const crypto = require("node:crypto");
const { authenticate } = require("./auth.cjs");
const { tx, register, audit } = require("./db.cjs");
const { transition, safetyEvaluation, canAccess } = require("./domain.cjs");
function problem(status, message, code) {
  return Object.assign(new Error(message), { status, code });
}
function response(status, body) {
  return { status, body };
}
function signature(body, secret) {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}
function safe(a, b) {
  return (
    /^[a-f0-9]{64}$/i.test(a || "") &&
    crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"))
  );
}
function role(p, ...r) {
  if (!r.includes(p.role)) throw problem(403, "Forbidden");
}
async function enrollment(c, p, id, lock = false) {
  const e = (
    await c.query(
      `SELECT * FROM wellness_enrollments WHERE tenant_id=$1 AND id=$2${lock ? " FOR UPDATE" : ""}`,
      [p.tenantId, id],
    )
  ).rows[0];
  if (!e) throw problem(404, "Enrollment not found");
  if (!canAccess(p, e)) throw problem(403, "Forbidden");
  return e;
}
async function changeEnrollment(c, p, e, command, metadata = {}) {
  const next = transition(e.state, command),
    r = await c.query(
      `UPDATE wellness_enrollments SET state=$1,version=version+1,updated_at=now(),consent_revoked_at=CASE WHEN $2='revoke_consent' THEN now() ELSE consent_revoked_at END WHERE tenant_id=$3 AND id=$4 AND version=$5 RETURNING *`,
      [next, command, p.tenantId, e.id, e.version],
    );
  if (!r.rowCount) throw problem(409, "Enrollment changed concurrently");
  await audit(c, p, `enrollment.${command}`, "enrollment", e.id, {
    from: e.state,
    to: next,
    ...metadata,
  });
  return r.rows[0];
}
function createService({ config, pool, providers }) {
  return async (request) => {
    try {
      const parts = request.path.split("/").filter(Boolean),
        method = request.method.toUpperCase(),
        raw = request.rawBody || JSON.stringify(request.body || {});
      if (parts[0] === "webhooks") {
        const provider = parts[1],
          tenantId = request.headers["x-tenant-id"],
          delivery = request.headers["x-delivery-id"];
        if (
          !tenantId ||
          !delivery ||
          !safe(
            request.headers["x-signature"],
            signature(raw, config.webhookSecret),
          )
        )
          throw problem(401, "Invalid webhook signature");
        const p = {
          tenantId,
          subject: `webhook:${provider}`,
          role: "operator",
        };
        const result = await tx(pool, async (c) => {
          const receipt = await c.query(
            `INSERT INTO wellness_webhook_receipts(tenant_id,provider,delivery_id,body_sha256)VALUES($1,$2,$3,$4)ON CONFLICT DO NOTHING RETURNING id`,
            [
              tenantId,
              provider,
              delivery,
              crypto.createHash("sha256").update(raw).digest("hex"),
            ],
          );
          if (!receipt.rowCount) return { duplicate: true };
          if (provider === "wearable") {
            const e = await enrollment(c, p, request.body.enrollmentId);
            if (e.state !== "ACTIVE" && e.state !== "SAFETY_HOLD")
              throw problem(
                409,
                "Enrollment is not eligible for wearable ingestion",
              );
            for (const item of request.body.observations || []) {
              if (
                !item.sourceEventId ||
                !item.metric ||
                !Number.isFinite(item.value) ||
                !item.unit ||
                !item.observedAt
              )
                throw problem(400, "Invalid wearable observation");
              await c.query(
                `INSERT INTO wellness_wearable_observations(tenant_id,enrollment_id,provider,source_event_id,metric,value,unit,observed_at,quality)VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)ON CONFLICT DO NOTHING`,
                [
                  tenantId,
                  e.id,
                  provider,
                  item.sourceEventId,
                  item.metric,
                  item.value,
                  item.unit,
                  item.observedAt,
                  item.quality || "provider-reported",
                ],
              );
            }
            await audit(
              c,
              p,
              "wearable.observations-ingested",
              "enrollment",
              e.id,
              {
                deliveryId: delivery,
                count: (request.body.observations || []).length,
              },
            );
          } else if (provider === "billing") {
            const e = await enrollment(c, p, request.body.enrollmentId, true),
              command =
                request.body.event === "payment.succeeded"
                  ? "payment_succeeded"
                  : request.body.event === "payment.failed"
                    ? "payment_failed"
                    : null;
            if (!command) throw problem(400, "Unsupported billing event");
            await changeEnrollment(c, p, e, command, {
              deliveryId: delivery,
              providerReference: request.body.reference,
            });
            await c.query(
              `UPDATE wellness_provider_jobs SET status=$1,response_payload=$2,updated_at=now()WHERE tenant_id=$3 AND enrollment_id=$4 AND provider='billing' AND operation='charge' AND status IN('queued','running','retryable')`,
              [
                command === "payment_succeeded" ? "succeeded" : "dead-letter",
                { reference: request.body.reference },
                tenantId,
                e.id,
              ],
            );
          }
          return { duplicate: false };
        });
        return response(result.duplicate ? 200 : 202, {
          accepted: true,
          ...result,
        });
      }
      const p = authenticate(request.headers, config);
      await tx(pool, (c) => register(c, p));
      if (parts[0] === "wellness" && parts[1] === "session" && method === "GET")
        return response(200, { user: p });
      if (parts[0] !== "wellness") throw problem(404, "Route not found");
      if (parts[1] === "coaches" && method === "GET") {
        const rows = (
          await pool.query(
            `SELECT wc.coach_subject,wc.specialties,wc.capacity,count(e.id)::int active_enrollments FROM wellness_coaches wc LEFT JOIN wellness_enrollments e ON e.tenant_id=wc.tenant_id AND e.coach_subject=wc.coach_subject AND e.state IN('PENDING_PAYMENT','ACTIVE','SAFETY_HOLD')WHERE wc.tenant_id=$1 AND wc.active=true GROUP BY wc.tenant_id,wc.coach_subject ORDER BY wc.coach_subject`,
            [p.tenantId],
          )
        ).rows;
        return response(200, { coaches: rows });
      }
      if (parts[1] === "coaches" && method === "POST") {
        role(p, "coach", "operator");
        const coach =
          p.role === "coach" ? p.subject : request.body.coachSubject;
        if (
          !coach ||
          !Array.isArray(request.body.specialties) ||
          !Number.isInteger(request.body.capacity)
        )
          throw problem(400, "Coach specialties and capacity are required");
        const row = await tx(pool, async (c) => {
          const r = (
            await c.query(
              `INSERT INTO wellness_coaches(tenant_id,coach_subject,specialties,capacity)VALUES($1,$2,$3,$4)ON CONFLICT(tenant_id,coach_subject)DO UPDATE SET specialties=EXCLUDED.specialties,capacity=EXCLUDED.capacity,active=true RETURNING *`,
              [
                p.tenantId,
                coach,
                request.body.specialties,
                request.body.capacity,
              ],
            )
          ).rows[0];
          await audit(c, p, "coach-profile.upserted", "coach-profile", null, {
            coachSubject: coach,
          });
          return r;
        });
        return response(201, { coach: row });
      }
      if (
        parts[1] === "enrollments" &&
        parts.length === 2 &&
        method === "POST"
      ) {
        role(p, "member", "operator");
        const member =
          p.role === "member" ? p.subject : request.body.memberSubject;
        if (
          !member ||
          !request.body.coachSubject ||
          !request.body.programName ||
          !Number.isInteger(request.body.priceCents) ||
          request.body.priceCents < 1 ||
          !request.body.consentVersion ||
          request.body.consentAccepted !== true ||
          !request.body.idempotencyKey
        )
          throw problem(
            400,
            "Member, coach, program, integer price, accepted consent, and idempotency key are required",
          );
        if (request.body.readinessAnswers?.requiresClinicalClearance)
          throw problem(
            409,
            "Program enrollment requires documented clinical clearance outside this wellness service",
          );
        const row = await tx(pool, async (c) => {
          const replay = await c.query(
            `SELECT * FROM wellness_enrollments WHERE tenant_id=$1 AND member_subject=$2 AND idempotency_key=$3`,
            [p.tenantId, member, request.body.idempotencyKey],
          );
          if (replay.rowCount) return replay.rows[0];
          const coach = (
            await c.query(
              `SELECT wc.*,count(e.id)::int active_count FROM wellness_coaches wc LEFT JOIN wellness_enrollments e ON e.tenant_id=wc.tenant_id AND e.coach_subject=wc.coach_subject AND e.state IN('PENDING_PAYMENT','ACTIVE','SAFETY_HOLD')WHERE wc.tenant_id=$1 AND wc.coach_subject=$2 AND wc.active=true GROUP BY wc.tenant_id,wc.coach_subject`,
              [p.tenantId, request.body.coachSubject],
            )
          ).rows[0];
          if (!coach || coach.active_count >= coach.capacity)
            throw problem(409, "Coach unavailable or at capacity");
          const e = (
            await c.query(
              `INSERT INTO wellness_enrollments(tenant_id,member_subject,coach_subject,program_name,price_cents,consent_version,consented_at,readiness_answers,idempotency_key)VALUES($1,$2,$3,$4,$5,$6,now(),$7,$8)RETURNING *`,
              [
                p.tenantId,
                member,
                request.body.coachSubject,
                request.body.programName,
                request.body.priceCents,
                request.body.consentVersion,
                request.body.readinessAnswers || {},
                request.body.idempotencyKey,
              ],
            )
          ).rows[0];
          await c.query(
            `INSERT INTO wellness_provider_jobs(tenant_id,enrollment_id,provider,operation,idempotency_key,request_payload)VALUES($1,$2,'billing','charge',$3,$4)`,
            [
              p.tenantId,
              e.id,
              `charge:${e.id}`,
              {
                enrollmentId: e.id,
                amountCents: e.price_cents,
                paymentMethodToken: request.body.paymentMethodToken,
              },
            ],
          );
          await audit(c, p, "enrollment.created", "enrollment", e.id, {
            consentVersion: e.consent_version,
            coachSubject: e.coach_subject,
          });
          return e;
        });
        return response(201, { enrollment: row });
      }
      if (parts[1] === "workspace" && method === "GET") {
        const params = [p.tenantId];
        let w = "tenant_id=$1";
        if (p.role === "member") {
          params.push(p.subject);
          w += " AND member_subject=$2";
        }
        if (p.role === "coach") {
          params.push(p.subject);
          w += " AND coach_subject=$2";
        }
        const enrollments = (
            await pool.query(
              `SELECT * FROM wellness_enrollments WHERE ${w} ORDER BY created_at DESC`,
              params,
            )
          ).rows,
          ids = enrollments.map((e) => e.id);
        const q = async (table) =>
          ids.length
            ? (
                await pool.query(
                  `SELECT * FROM ${table} WHERE tenant_id=$1 AND enrollment_id=ANY($2::uuid[]) ORDER BY created_at DESC`,
                  [p.tenantId, ids],
                )
              ).rows
            : [];
        const [
          plans,
          goals,
          checkIns,
          alerts,
          adjustments,
          observations,
          appointments,
        ] = await Promise.all(
          [
            "wellness_plans",
            "wellness_goals",
            "wellness_check_ins",
            "wellness_safety_alerts",
            "wellness_adjustments",
            "wellness_wearable_observations",
            "wellness_appointments",
          ].map(q),
        );
        const jobs =
          p.role === "operator"
            ? (
                await pool.query(
                  `SELECT id,enrollment_id,appointment_id,provider,operation,status,attempts,last_error_code,next_attempt_at FROM wellness_provider_jobs WHERE tenant_id=$1 ORDER BY created_at DESC`,
                  [p.tenantId],
                )
              ).rows
            : [];
        return response(200, {
          enrollments,
          plans,
          goals,
          checkIns,
          alerts,
          adjustments,
          observations,
          appointments,
          jobs,
          safetyBoundary:
            "Wellness support only. Urgent symptoms and high pain require appropriate medical evaluation; this service does not diagnose.",
        });
      }
      if (
        parts[1] === "enrollments" &&
        parts[3] === "retry" &&
        method === "POST"
      ) {
        role(p, "member", "operator");
        const out = await tx(pool, async (c) => {
          const e = await enrollment(c, p, parts[2], true),
            updated = await changeEnrollment(c, p, e, "retry_payment"),
            key = `charge:${e.id}:retry:${e.version}`,
            job = (
              await c.query(
                `INSERT INTO wellness_provider_jobs(tenant_id,enrollment_id,provider,operation,idempotency_key,request_payload)VALUES($1,$2,'billing','charge',$3,$4)RETURNING id,status`,
                [
                  p.tenantId,
                  e.id,
                  key,
                  {
                    enrollmentId: e.id,
                    amountCents: e.price_cents,
                    paymentMethodToken: request.body.paymentMethodToken,
                  },
                ],
              )
            ).rows[0];
          return { enrollment: updated, job };
        });
        return response(202, out);
      }
      if (
        parts[1] === "enrollments" &&
        parts[3] === "revoke-consent" &&
        method === "POST"
      ) {
        role(p, "member", "operator");
        if (!request.body.reason)
          throw problem(400, "Revocation reason is required");
        const out = await tx(pool, async (c) => {
          const e = await enrollment(c, p, parts[2], true),
            updated = await changeEnrollment(c, p, e, "revoke_consent", {
              reason: request.body.reason,
            });
          await c.query(
            `UPDATE wellness_provider_jobs SET status='dead-letter',last_error_code='CONSENT_REVOKED',updated_at=now()WHERE tenant_id=$1 AND enrollment_id=$2 AND status IN('queued','retryable')`,
            [p.tenantId, e.id],
          );
          if (e.state === "ACTIVE" || e.state === "SAFETY_HOLD")
            await c.query(
              `INSERT INTO wellness_provider_jobs(tenant_id,enrollment_id,provider,operation,idempotency_key,request_payload)VALUES($1,$2,'billing','refund',$3,$4)ON CONFLICT DO NOTHING`,
              [
                p.tenantId,
                e.id,
                `refund:${e.id}`,
                {
                  enrollmentId: e.id,
                  amountCents: e.price_cents,
                  reason: request.body.reason,
                },
              ],
            );
          return updated;
        });
        return response(200, { enrollment: out });
      }
      if (
        parts[1] === "enrollments" &&
        parts[3] === "clear-safety" &&
        method === "POST"
      ) {
        role(p, "coach");
        if (!request.body.note)
          throw problem(400, "Coach safety review note is required");
        const out = await tx(pool, async (c) => {
          const e = await enrollment(c, p, parts[2], true);
          const open = await c.query(
            `SELECT 1 FROM wellness_safety_alerts WHERE tenant_id=$1 AND enrollment_id=$2 AND status='OPEN'`,
            [p.tenantId, e.id],
          );
          if (open.rowCount)
            throw problem(409, "All safety alerts must be acknowledged first");
          const critical = await c.query(
            `SELECT 1 FROM wellness_safety_alerts WHERE tenant_id=$1 AND enrollment_id=$2 AND severity='CRITICAL' AND disposition<>'REFER_TO_CLINICIAN'`,
            [p.tenantId, e.id],
          );
          if (critical.rowCount)
            throw problem(
              409,
              "Critical reports require clinician referral disposition",
            );
          const updated = await changeEnrollment(c, p, e, "coach_clear", {
            note: request.body.note,
          });
          await c.query(
            `UPDATE wellness_plans SET state='ACTIVE',version=version+1,updated_by=$1,updated_at=now()WHERE tenant_id=$2 AND enrollment_id=$3`,
            [p.subject, p.tenantId, e.id],
          );
          return updated;
        });
        return response(200, { enrollment: out });
      }
      if (parts[1] === "plans" && method === "POST") {
        role(p, "coach");
        if (
          !request.body.enrollmentId ||
          !request.body.title ||
          !request.body.plan
        )
          throw problem(400, "Enrollment, title, and typed plan are required");
        const row = await tx(pool, async (c) => {
          const e = await enrollment(c, p, request.body.enrollmentId);
          if (e.state !== "ACTIVE")
            throw problem(409, "Enrollment must be active");
          const r = (
            await c.query(
              `INSERT INTO wellness_plans(tenant_id,enrollment_id,title,plan_payload,updated_by)VALUES($1,$2,$3,$4,$5)RETURNING *`,
              [
                p.tenantId,
                e.id,
                request.body.title,
                request.body.plan,
                p.subject,
              ],
            )
          ).rows[0];
          await audit(c, p, "plan.created", "plan", r.id, {
            enrollmentId: e.id,
          });
          return r;
        });
        return response(201, { plan: row });
      }
      if (parts[1] === "goals" && method === "POST") {
        role(p, "member", "coach");
        if (
          !request.body.enrollmentId ||
          !request.body.title ||
          !request.body.metric ||
          !request.body.targetValue
        )
          throw problem(400, "Measurable goal fields are required");
        const row = await tx(pool, async (c) => {
          const e = await enrollment(c, p, request.body.enrollmentId);
          if (e.state !== "ACTIVE")
            throw problem(409, "Enrollment must be active");
          const r = (
            await c.query(
              `INSERT INTO wellness_goals(tenant_id,enrollment_id,title,metric,target_value,created_by)VALUES($1,$2,$3,$4,$5,$6)RETURNING *`,
              [
                p.tenantId,
                e.id,
                request.body.title,
                request.body.metric,
                request.body.targetValue,
                p.subject,
              ],
            )
          ).rows[0];
          await audit(c, p, "goal.created", "goal", r.id);
          return r;
        });
        return response(201, { goal: row });
      }
      if (parts[1] === "check-ins" && method === "POST") {
        role(p, "member");
        if (!request.body.enrollmentId || !request.body.evidence)
          throw problem(400, "Enrollment and evidence are required");
        const evaluation = safetyEvaluation(request.body);
        const out = await tx(pool, async (c) => {
          let e = await enrollment(c, p, request.body.enrollmentId, true);
          if (!["ACTIVE", "SAFETY_HOLD"].includes(e.state))
            throw problem(409, "Enrollment is not active");
          const check = (
            await c.query(
              `INSERT INTO wellness_check_ins(tenant_id,enrollment_id,pain,energy,mood,adherence,chest_pain,fainting,evidence,rule_version,created_by)VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'deterministic-safety-rules-v1',$10)RETURNING *`,
              [
                p.tenantId,
                e.id,
                request.body.pain,
                request.body.energy,
                request.body.mood,
                request.body.adherence,
                !!request.body.chestPain,
                !!request.body.fainting,
                request.body.evidence,
                p.subject,
              ],
            )
          ).rows[0];
          for (const a of evaluation.alerts)
            await c.query(
              `INSERT INTO wellness_safety_alerts(tenant_id,enrollment_id,check_in_id,rule_code,severity,message)VALUES($1,$2,$3,$4,$5,$6)`,
              [p.tenantId, e.id, check.id, a.rule, a.severity, a.message],
            );
          if (evaluation.adjustment)
            await c.query(
              `INSERT INTO wellness_adjustments(tenant_id,enrollment_id,check_in_id,rule_code,recommendation)VALUES($1,$2,$3,$4,$5)`,
              [
                p.tenantId,
                e.id,
                check.id,
                evaluation.adjustment.rule,
                evaluation.adjustment.recommendation,
              ],
            );
          if (evaluation.hold && e.state === "ACTIVE") {
            e = await changeEnrollment(c, p, e, "safety_hold", {
              rules: evaluation.alerts.map((a) => a.rule),
            });
            await c.query(
              `UPDATE wellness_plans SET state='SAFETY_HOLD',version=version+1,updated_at=now()WHERE tenant_id=$1 AND enrollment_id=$2`,
              [p.tenantId, e.id],
            );
            await c.query(
              `INSERT INTO wellness_provider_jobs(tenant_id,enrollment_id,provider,operation,idempotency_key,request_payload)VALUES($1,$2,'notification','safety-alert',$3,$4)ON CONFLICT DO NOTHING`,
              [
                p.tenantId,
                e.id,
                `safety:${check.id}`,
                {
                  enrollmentId: e.id,
                  checkInId: check.id,
                  severity: evaluation.alerts[0].severity,
                },
              ],
            );
          }
          await audit(c, p, "check-in.recorded", "check-in", check.id, {
            evaluation,
          });
          return { checkIn: check, evaluation, enrollment: e };
        });
        return response(201, out);
      }
      if (
        parts[1] === "alerts" &&
        parts[3] === "acknowledge" &&
        method === "POST"
      ) {
        role(p, "coach", "operator");
        const allowed = [
          "REFER_TO_CLINICIAN",
          "CONTACT_MEMBER",
          "RESOLVED_NON_CLINICAL",
        ];
        if (!allowed.includes(request.body.disposition) || !request.body.note)
          throw problem(400, "Approved disposition and note are required");
        const row = await tx(pool, async (c) => {
          const alert = (
            await c.query(
              `SELECT a.*,e.member_subject,e.coach_subject FROM wellness_safety_alerts a JOIN wellness_enrollments e ON e.id=a.enrollment_id WHERE a.tenant_id=$1 AND a.id=$2 FOR UPDATE OF a`,
              [p.tenantId, parts[2]],
            )
          ).rows[0];
          if (!alert) throw problem(404, "Alert not found");
          if (!canAccess(p, alert)) throw problem(403, "Forbidden");
          if (alert.status !== "OPEN")
            throw problem(409, "Alert already decided");
          const r = (
            await c.query(
              `UPDATE wellness_safety_alerts SET status='ACKNOWLEDGED',disposition=$1,coach_note=$2,acknowledged_by=$3,acknowledged_at=now()WHERE id=$4 RETURNING *`,
              [
                request.body.disposition,
                request.body.note,
                p.subject,
                alert.id,
              ],
            )
          ).rows[0];
          await audit(
            c,
            p,
            "safety-alert.acknowledged",
            "safety-alert",
            alert.id,
            { disposition: r.disposition },
          );
          return r;
        });
        return response(200, { alert: row });
      }
      if (
        parts[1] === "adjustments" &&
        parts[3] === "decision" &&
        method === "POST"
      ) {
        role(p, "coach");
        if (
          !["APPROVED", "REJECTED"].includes(request.body.decision) ||
          !request.body.note
        )
          throw problem(400, "Decision and note are required");
        const row = await tx(pool, async (c) => {
          const a = (
            await c.query(
              `SELECT a.*,e.member_subject,e.coach_subject FROM wellness_adjustments a JOIN wellness_enrollments e ON e.id=a.enrollment_id WHERE a.tenant_id=$1 AND a.id=$2 FOR UPDATE OF a`,
              [p.tenantId, parts[2]],
            )
          ).rows[0];
          if (!a) throw problem(404, "Adjustment not found");
          if (!canAccess(p, a) || a.status !== "PENDING")
            throw problem(409, "Adjustment is unavailable");
          const r = (
            await c.query(
              `UPDATE wellness_adjustments SET status=$1,decided_by=$2,decision_note=$3,decided_at=now()WHERE id=$4 RETURNING *`,
              [request.body.decision, p.subject, request.body.note, a.id],
            )
          ).rows[0];
          if (r.status === "APPROVED")
            await c.query(
              `UPDATE wellness_plans SET plan_payload=plan_payload||$1::jsonb,version=version+1,updated_by=$2,updated_at=now()WHERE tenant_id=$3 AND enrollment_id=$4`,
              [
                JSON.stringify({ lastApprovedAdjustment: r.recommendation }),
                p.subject,
                p.tenantId,
                a.enrollment_id,
              ],
            );
          await audit(c, p, "adjustment.decided", "adjustment", a.id, {
            decision: r.status,
          });
          return r;
        });
        return response(200, { adjustment: row });
      }
      if (
        parts[1] === "appointments" &&
        parts.length === 2 &&
        method === "POST"
      ) {
        role(p, "coach");
        const starts = new Date(request.body.startsAt),
          ends = new Date(request.body.endsAt);
        if (
          !request.body.enrollmentId ||
          !request.body.agenda ||
          !request.body.idempotencyKey ||
          !Number.isFinite(starts.getTime()) ||
          ends <= starts
        )
          throw problem(400, "Valid appointment fields are required");
        const out = await tx(pool, async (c) => {
          const e = await enrollment(c, p, request.body.enrollmentId);
          if (!["ACTIVE", "SAFETY_HOLD"].includes(e.state))
            throw problem(409, "Enrollment is unavailable");
          const overlap = await c.query(
            `SELECT 1 FROM wellness_appointments a JOIN wellness_enrollments e ON e.id=a.enrollment_id WHERE a.tenant_id=$1 AND e.coach_subject=$2 AND a.state<>'CANCELLED' AND a.starts_at<$4 AND a.ends_at>$3`,
            [p.tenantId, p.subject, starts, ends],
          );
          if (overlap.rowCount)
            throw problem(409, "Coach already has an overlapping appointment");
          const a = (
              await c.query(
                `INSERT INTO wellness_appointments(tenant_id,enrollment_id,starts_at,ends_at,agenda,created_by)VALUES($1,$2,$3,$4,$5,$6)RETURNING *`,
                [
                  p.tenantId,
                  e.id,
                  starts,
                  ends,
                  request.body.agenda,
                  p.subject,
                ],
              )
            ).rows[0],
            job = (
              await c.query(
                `INSERT INTO wellness_provider_jobs(tenant_id,enrollment_id,appointment_id,provider,operation,idempotency_key,request_payload)VALUES($1,$2,$3,'video','create-meeting',$4,$5)RETURNING id,status`,
                [
                  p.tenantId,
                  e.id,
                  a.id,
                  request.body.idempotencyKey,
                  { appointmentId: a.id, startsAt: starts, endsAt: ends },
                ],
              )
            ).rows[0];
          await audit(c, p, "appointment.scheduled", "appointment", a.id);
          return { appointment: a, job };
        });
        return response(201, out);
      }
      if (
        parts[1] === "appointments" &&
        parts[3] === "retry" &&
        method === "POST"
      ) {
        role(p, "coach", "operator");
        if (!request.body.idempotencyKey)
          throw problem(400, "idempotencyKey is required");
        const out = await tx(pool, async (c) => {
          const a = (
            await c.query(
              `SELECT a.*,e.member_subject,e.coach_subject FROM wellness_appointments a JOIN wellness_enrollments e ON e.id=a.enrollment_id WHERE a.tenant_id=$1 AND a.id=$2 FOR UPDATE OF a`,
              [p.tenantId, parts[2]],
            )
          ).rows[0];
          if (!a) throw problem(404, "Appointment not found");
          if (!canAccess(p, a)) throw problem(403, "Forbidden");
          if (a.state !== "PROVIDER_FAILED")
            throw problem(409, "Appointment has no retryable video failure");
          await c.query(
            `UPDATE wellness_appointments SET state='VIDEO_PENDING' WHERE id=$1`,
            [a.id],
          );
          const job = (
            await c.query(
              `INSERT INTO wellness_provider_jobs(tenant_id,enrollment_id,appointment_id,provider,operation,idempotency_key,request_payload)VALUES($1,$2,$3,'video','create-meeting',$4,$5)RETURNING id,status`,
              [
                p.tenantId,
                a.enrollment_id,
                a.id,
                request.body.idempotencyKey,
                {
                  appointmentId: a.id,
                  startsAt: a.starts_at,
                  endsAt: a.ends_at,
                },
              ],
            )
          ).rows[0];
          await audit(c, p, "appointment.video-retried", "appointment", a.id);
          return { appointment: { ...a, state: "VIDEO_PENDING" }, job };
        });
        return response(202, out);
      }
      if (parts[1] === "wearable" && parts[2] === "sync" && method === "POST") {
        role(p, "member", "operator");
        if (!request.body.enrollmentId || !request.body.cursor)
          throw problem(400, "Enrollment and provider cursor are required");
        const out = await tx(pool, async (c) => {
          const e = await enrollment(c, p, request.body.enrollmentId);
          if (!["ACTIVE", "SAFETY_HOLD"].includes(e.state))
            throw problem(409, "Enrollment is unavailable");
          const key =
              request.body.idempotencyKey ||
              `wearable:${e.id}:${request.body.cursor}`,
            job = (
              await c.query(
                `INSERT INTO wellness_provider_jobs(tenant_id,enrollment_id,provider,operation,idempotency_key,request_payload)VALUES($1,$2,'wearable','sync',$3,$4)ON CONFLICT(tenant_id,provider,idempotency_key)DO UPDATE SET updated_at=now()RETURNING id,status`,
                [
                  p.tenantId,
                  e.id,
                  key,
                  { enrollmentId: e.id, cursor: request.body.cursor },
                ],
              )
            ).rows[0];
          return job;
        });
        return response(202, { job: out });
      }
      if (parts[1] === "jobs" && parts[3] === "execute" && method === "POST") {
        role(p, "operator");
        let job;
        try {
          job = await tx(pool, async (c) => {
            const r = await c.query(
              `UPDATE wellness_provider_jobs SET status='running',attempts=attempts+1,updated_at=now()WHERE tenant_id=$1 AND id=$2 AND status IN('queued','retryable')AND next_attempt_at<=now()RETURNING *`,
              [p.tenantId, parts[2]],
            );
            if (!r.rowCount) throw problem(409, "Job is not executable");
            return r.rows[0];
          });
          const result = await providers[job.provider](
            job.operation,
            job.request_payload,
            job.idempotency_key,
          );
          const done = await tx(pool, async (c) => {
            if (job.operation === "charge") {
              const e = await enrollment(c, p, job.enrollment_id, true);
              await changeEnrollment(c, p, e, "payment_succeeded", {
                providerReference: result.reference,
              });
            }
            if (job.operation === "create-meeting")
              await c.query(
                `UPDATE wellness_appointments SET state='CONFIRMED',meeting_url=$1,provider_meeting_id=$2 WHERE tenant_id=$3 AND id=$4`,
                [
                  result.meetingUrl,
                  result.meetingId,
                  p.tenantId,
                  job.appointment_id,
                ],
              );
            if (job.operation === "sync") {
              for (const item of result.observations || [])
                await c.query(
                  `INSERT INTO wellness_wearable_observations(tenant_id,enrollment_id,provider,source_event_id,metric,value,unit,observed_at,quality)VALUES($1,$2,'wearable',$3,$4,$5,$6,$7,$8)ON CONFLICT DO NOTHING`,
                  [
                    p.tenantId,
                    job.enrollment_id,
                    item.sourceEventId,
                    item.metric,
                    item.value,
                    item.unit,
                    item.observedAt,
                    item.quality || "provider-reported",
                  ],
                );
            }
            const r = (
              await c.query(
                `UPDATE wellness_provider_jobs SET status='succeeded',response_payload=$1,last_error_code=NULL,updated_at=now()WHERE id=$2 RETURNING id,status,attempts`,
                [result, job.id],
              )
            ).rows[0];
            await audit(
              c,
              p,
              "provider-job.succeeded",
              "provider-job",
              job.id,
              { provider: job.provider, operation: job.operation },
            );
            return r;
          });
          return response(200, { job: done });
        } catch (error) {
          if (!job) throw error;
          const failed = await tx(pool, async (c) => {
            const retry = error.retryable && job.attempts < 5,
              status = retry ? "retryable" : "dead-letter",
              r = (
                await c.query(
                  `UPDATE wellness_provider_jobs SET status=$1,last_error_code=$2,next_attempt_at=now()+($3*interval '1 minute'),updated_at=now()WHERE id=$4 RETURNING id,status,attempts,last_error_code`,
                  [
                    status,
                    error.code || "PROVIDER_ERROR",
                    2 ** job.attempts,
                    job.id,
                  ],
                )
              ).rows[0];
            // A transient billing outage keeps the enrollment pending so the same
            // idempotent job can succeed later. Only terminal declines require a
            // member-supplied payment method and the explicit retry transition.
            if (job.operation === "charge" && !retry) {
              const e = await enrollment(c, p, job.enrollment_id, true);
              await changeEnrollment(c, p, e, "payment_failed", {
                code: error.code,
              });
            }
            if (job.operation === "create-meeting")
              await c.query(
                `UPDATE wellness_appointments SET state='PROVIDER_FAILED' WHERE tenant_id=$1 AND id=$2`,
                [p.tenantId, job.appointment_id],
              );
            await audit(c, p, "provider-job.failed", "provider-job", job.id, {
              provider: job.provider,
              code: error.code || "PROVIDER_ERROR",
              retry,
            });
            return r;
          });
          return response(502, {
            error: "Provider operation failed",
            job: failed,
          });
        }
      }
      if (parts[1] === "restore-drills" && method === "POST") {
        role(p, "operator");
        if (
          !request.body.backupReference ||
          !["scheduled", "passed", "failed"].includes(request.body.status)
        )
          throw problem(400, "Restore evidence is invalid");
        const r = await tx(pool, async (c) => {
          const row = (
            await c.query(
              `INSERT INTO wellness_restore_drills(tenant_id,backup_reference,status,evidence_uri,recorded_by)VALUES($1,$2,$3,$4,$5)RETURNING *`,
              [
                p.tenantId,
                request.body.backupReference,
                request.body.status,
                request.body.evidenceUri || null,
                p.subject,
              ],
            )
          ).rows[0];
          await audit(c, p, "restore-drill.recorded", "restore-drill", row.id, {
            status: row.status,
          });
          return row;
        });
        return response(201, { drill: r });
      }
      throw problem(404, "Route not found");
    } catch (e) {
      const status =
        e.status || { 23503: 409, 23505: 409, "22P02": 400 }[e.code] || 500;
      return response(status, {
        error: status >= 500 ? "Internal server error" : e.message,
        code: e.code,
      });
    }
  };
}
module.exports = { createService, signature };
