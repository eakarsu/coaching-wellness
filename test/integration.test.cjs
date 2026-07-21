const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  crypto = require("node:crypto"),
  jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const { createService, signature } = require("../src/governance/service.cjs");
const url = process.env.TEST_DATABASE_URL;
test(
  "real wellness journey persists consent, safety, provider recovery, wearable provenance, and role boundaries",
  { skip: !url, timeout: 30000 },
  async (t) => {
    const pool = new Pool({ connectionString: url }),
      sql = fs.readFileSync(
        path.join(
          __dirname,
          "..",
          "db",
          "migrations",
          "001_governed_wellness.sql",
        ),
        "utf8",
      );
    await pool.query(sql);
    await pool.query(sql);
    await pool.query("TRUNCATE wellness_tenants RESTART IDENTITY CASCADE");
    const tenantA = (
        await pool.query(
          `INSERT INTO wellness_tenants(name)VALUES('Wellness A')RETURNING id`,
        )
      ).rows[0].id,
      tenantB = (
        await pool.query(
          `INSERT INTO wellness_tenants(name)VALUES('Wellness B')RETURNING id`,
        )
      ).rows[0].id,
      pair = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 }),
      config = {
        publicKey: pair.publicKey.export({ type: "spki", format: "pem" }),
        oidcIssuer: "https://id.test/",
        oidcAudience: "wellness",
        webhookSecret: "w".repeat(32),
      };
    let videoFail = true,
      billingOutage = true;
    const providers = {
        billing: async (op, payload) => {
          if (op === "charge" && payload.paymentMethodToken === "decline")
            throw Object.assign(new Error("declined"), {
              code: "BILLING_DECLINED",
              retryable: false,
            });
          if (
            op === "charge" &&
            payload.paymentMethodToken === "outage" &&
            billingOutage
          ) {
            billingOutage = false;
            throw Object.assign(new Error("gateway outage"), {
              code: "BILLING_503",
              retryable: true,
            });
          }
          return { reference: `billing-${op}` };
        },
        video: async () => {
          if (videoFail) {
            videoFail = false;
            throw Object.assign(new Error("outage"), {
              code: "VIDEO_503",
              retryable: true,
            });
          }
          return {
            meetingId: "meet-1",
            meetingUrl: "https://video.test/meet-1",
          };
        },
        wearable: async () => ({
          observations: [
            {
              sourceEventId: "sync-event-1",
              metric: "steps",
              value: 4200,
              unit: "count",
              observedAt: "2026-07-19T12:00:00Z",
            },
          ],
        }),
        notification: async () => ({ reference: "notify-1" }),
      },
      service = createService({ config, pool, providers });
    const server = http.createServer(async (req, res) => {
      let raw = "";
      for await (const ch of req) raw += ch;
      let body = {};
      try {
        body = raw ? JSON.parse(raw) : {};
      } catch {}
      const out = await service({
        method: req.method,
        path: new URL(req.url, "http://x").pathname.slice(1),
        headers: req.headers,
        body,
        rawBody: raw,
      });
      res.writeHead(out.status, { "content-type": "application/json" });
      res.end(JSON.stringify(out.body));
    });
    server.listen(0, "127.0.0.1");
    await new Promise((r) => server.once("listening", r));
    const base = `http://127.0.0.1:${server.address().port}`;
    t.after(async () => {
      await new Promise((r) => server.close(r));
      await pool.end();
    });
    const make = (sub, role, tenant = tenantA) =>
        jwt.sign(
          { tenant_id: tenant, role, email: `${sub}@test.invalid` },
          pair.privateKey,
          {
            algorithm: "RS256",
            subject: sub,
            issuer: config.oidcIssuer,
            audience: config.oidcAudience,
            expiresIn: "5m",
          },
        ),
      token = {
        member: make("member-1", "member"),
        other: make("member-2", "member"),
        coach: make("coach-1", "coach"),
        operator: make("operator-1", "operator"),
        tenantB: make("operator-b", "operator", tenantB),
      };
    async function req(p, tok, options = {}) {
      const h = {
          ...(options.body ? { "content-type": "application/json" } : {}),
          ...(tok ? { authorization: `Bearer ${tok}` } : {}),
          ...(options.headers || {}),
        },
        r = await fetch(`${base}/${p}`, {
          ...options,
          headers: h,
          body:
            options.body && typeof options.body !== "string"
              ? JSON.stringify(options.body)
              : options.body,
        });
      return { status: r.status, data: await r.json() };
    }
    async function ws(tok = token.operator) {
      return (await req("wellness/workspace", tok)).data;
    }
    async function execute(id) {
      return req(`wellness/jobs/${id}/execute`, token.operator, {
        method: "POST",
      });
    }
    assert.equal((await req("wellness/session")).status, 401);
    await req("wellness/session", token.operator);
    await req("wellness/coaches", token.coach, {
      method: "POST",
      body: { specialties: ["habit coaching"], capacity: 1 },
    });
    const blocked = await req("wellness/enrollments", token.member, {
      method: "POST",
      body: {
        coachSubject: "coach-1",
        programName: "Foundations",
        priceCents: 50000,
        consentVersion: "v1",
        consentAccepted: true,
        readinessAnswers: { requiresClinicalClearance: true },
        idempotencyKey: "blocked",
      },
    });
    assert.equal(blocked.status, 409);
    const body = {
        coachSubject: "coach-1",
        programName: "Foundations",
        priceCents: 50000,
        consentVersion: "v1",
        consentAccepted: true,
        readinessAnswers: { requiresClinicalClearance: false },
        paymentMethodToken: "decline",
        idempotencyKey: "enroll-1",
      },
      created = await req("wellness/enrollments", token.member, {
        method: "POST",
        body,
      });
    assert.equal(created.status, 201);
    const enrollmentId = created.data.enrollment.id;
    assert.equal(
      (
        await req("wellness/enrollments", token.member, {
          method: "POST",
          body,
        })
      ).data.enrollment.id,
      enrollmentId,
    );
    assert.equal(
      (
        await req("wellness/enrollments", token.other, {
          method: "POST",
          body: { ...body, idempotencyKey: "at-capacity" },
        })
      ).status,
      409,
    );
    assert.equal((await ws(token.tenantB)).enrollments.length, 0);
    let charge = (await ws()).jobs.find((j) => j.operation === "charge");
    assert.equal((await execute(charge.id)).status, 502);
    const retry = await req(
      `wellness/enrollments/${enrollmentId}/retry`,
      token.member,
      { method: "POST", body: { paymentMethodToken: "good" } },
    );
    assert.equal((await execute(retry.data.job.id)).status, 200);
    assert.equal((await ws(token.member)).enrollments[0].state, "ACTIVE");
    assert.equal(
      (
        await req("wellness/plans", token.coach, {
          method: "POST",
          body: {
            enrollmentId,
            title: "Foundations plan",
            plan: {
              movement: "20 minute walk",
              recovery: "consistent bedtime",
            },
          },
        })
      ).status,
      201,
    );
    assert.equal(
      (
        await req("wellness/goals", token.member, {
          method: "POST",
          body: {
            enrollmentId,
            title: "Consistent walking",
            metric: "walks per week",
            targetValue: "4",
          },
        })
      ).status,
      201,
    );
    const low = await req("wellness/check-ins", token.member, {
      method: "POST",
      body: {
        enrollmentId,
        pain: 2,
        energy: 4,
        mood: 4,
        adherence: 30,
        evidence: "Completed one of four walks",
      },
    });
    assert.equal(low.status, 201);
    assert.equal(low.data.evaluation.adjustment.rule, "LOW_ADHERENCE");
    let workspace = await ws(token.coach),
      adjustment = workspace.adjustments[0];
    assert.equal(
      (
        await req(
          `wellness/adjustments/${adjustment.id}/decision`,
          token.coach,
          {
            method: "POST",
            body: {
              decision: "APPROVED",
              note: "Member selected a smaller first step",
            },
          },
        )
      ).status,
      200,
    );
    const critical = await req("wellness/check-ins", token.member, {
      method: "POST",
      body: {
        enrollmentId,
        pain: 9,
        energy: 2,
        mood: 2,
        adherence: 20,
        chestPain: true,
        evidence: "Stopped activity after symptoms",
      },
    });
    assert.equal(critical.status, 201);
    assert.equal(critical.data.enrollment.state, "SAFETY_HOLD");
    workspace = await ws(token.coach);
    for (const alert of workspace.alerts)
      assert.equal(
        (
          await req(`wellness/alerts/${alert.id}/acknowledge`, token.coach, {
            method: "POST",
            body: {
              disposition:
                alert.severity === "CRITICAL"
                  ? "REFER_TO_CLINICIAN"
                  : "CONTACT_MEMBER",
              note: "Member contacted and routed according to safety policy",
            },
          })
        ).status,
        200,
      );
    assert.equal(
      (
        await req(
          `wellness/enrollments/${enrollmentId}/clear-safety`,
          token.coach,
          {
            method: "POST",
            body: {
              note: "Required dispositions documented; resume only after appropriate clearance",
            },
          },
        )
      ).data.enrollment.state,
      "ACTIVE",
    );
    const starts = new Date(Date.now() + 86400000),
      ends = new Date(starts.getTime() + 3600000),
      appointment = await req("wellness/appointments", token.coach, {
        method: "POST",
        body: {
          enrollmentId,
          startsAt: starts.toISOString(),
          endsAt: ends.toISOString(),
          agenda: "Review safe plan restart",
          idempotencyKey: "video-1",
        },
      });
    assert.equal(appointment.status, 201, JSON.stringify(appointment.data));
    assert.equal((await execute(appointment.data.job.id)).status, 502);
    const apptId = appointment.data.appointment.id,
      videoRetry = await req(
        `wellness/appointments/${apptId}/retry`,
        token.coach,
        { method: "POST", body: { idempotencyKey: "video-retry-1" } },
      );
    assert.equal(videoRetry.status, 202, JSON.stringify(videoRetry.data));
    assert.equal((await execute(videoRetry.data.job.id)).status, 200);
    const sync = await req("wellness/wearable/sync", token.member, {
      method: "POST",
      body: { enrollmentId, cursor: "cursor-1", idempotencyKey: "wear-sync-1" },
    });
    assert.equal((await execute(sync.data.job.id)).status, 200);
    const raw = JSON.stringify({
        enrollmentId,
        observations: [
          {
            sourceEventId: "webhook-1",
            metric: "sleep_duration",
            value: 7.2,
            unit: "hours",
            observedAt: "2026-07-19T08:00:00Z",
          },
        ],
      }),
      headers = {
        "content-type": "application/json",
        "x-tenant-id": tenantA,
        "x-delivery-id": "wear-delivery-1",
        "x-signature": signature(raw, config.webhookSecret),
      };
    assert.equal(
      (
        await req("webhooks/wearable", null, {
          method: "POST",
          headers,
          body: raw,
        })
      ).status,
      202,
    );
    assert.equal(
      (
        await req("webhooks/wearable", null, {
          method: "POST",
          headers,
          body: raw,
        })
      ).data.duplicate,
      true,
    );
    assert.equal((await ws(token.member)).observations.length, 2);
    assert.equal(
      (
        await req(
          `wellness/enrollments/${enrollmentId}/revoke-consent`,
          token.other,
          { method: "POST", body: { reason: "not owner" } },
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await req(
          `wellness/enrollments/${enrollmentId}/revoke-consent`,
          token.member,
          { method: "POST", body: { reason: "Member withdrew consent" } },
        )
      ).data.enrollment.state,
      "CONSENT_REVOKED",
    );
    const outageEnrollment = await req("wellness/enrollments", token.other, {
      method: "POST",
      body: {
        ...body,
        paymentMethodToken: "outage",
        idempotencyKey: "enroll-after-gateway-outage",
      },
    });
    assert.equal(outageEnrollment.status, 201);
    const outageId = outageEnrollment.data.enrollment.id,
      outageJob = (await ws()).jobs.find(
        (job) => job.enrollment_id === outageId && job.operation === "charge",
      );
    assert.equal((await execute(outageJob.id)).status, 502);
    assert.equal((await ws(token.other)).enrollments[0].state, "PENDING_PAYMENT");
    await pool.query(
      `UPDATE wellness_provider_jobs SET next_attempt_at=now() WHERE id=$1`,
      [outageJob.id],
    );
    assert.equal((await execute(outageJob.id)).status, 200);
    assert.equal((await ws(token.other)).enrollments[0].state, "ACTIVE");
    assert.equal(
      (
        await req("wellness/restore-drills", token.operator, {
          method: "POST",
          body: {
            backupReference: "vault://wellness/2026-07-19",
            status: "passed",
            evidenceUri: "https://evidence.test/wellness-restore",
          },
        })
      ).status,
      201,
    );
    await assert.rejects(
      async () =>
        pool.query(
          `UPDATE wellness_audit_events SET action='tamper' WHERE tenant_id=$1`,
          [tenantA],
        ),
      /append-only/,
    );
    assert.ok(
      Number(
        (
          await pool.query(
            `SELECT count(*) FROM wellness_audit_events WHERE tenant_id=$1`,
            [tenantA],
          )
        ).rows[0].count,
      ) >= 15,
    );
  },
);
