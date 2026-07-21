# Wellness Operations Runbook

## Release gate

1. Run CI against an empty PostgreSQL database and confirm the migration succeeds twice.
2. Review the migration and take a verified backup before applying it to an existing environment.
3. Run `ALLOW_SCHEMA_MIGRATION=1 ./start.sh migrate` as a dedicated deploy job.
4. Run `./start.sh check`; only then replace application instances.
5. Verify `/api/v1/wellness/health`, SSO for each role, tenant isolation, and one provider sandbox operation.

Application startup never migrates or seeds. Roll back application containers independently. Database rollback is forward-fix or point-in-time restore; do not reverse a migration against live wellness records without an approved data plan.

## Safety boundary and escalation

The system is for wellness coaching, not medical diagnosis or emergency care. Deterministic rules create a safety hold for chest pain, fainting, or high reported pain. They may also create a human-review adjustment for low adherence; no suggestion edits a plan without a coach decision.

- The member UI tells a person with potentially life-threatening symptoms to contact local emergency services.
- A coach must acknowledge every alert. `CRITICAL` alerts require the `REFER_TO_CLINICIAN` disposition before a hold can be cleared.
- A hold pauses the plan but preserves evidence. Do not put diagnostic conclusions in coach notes.
- If the notification job fails, the alert remains open in the coach workspace. Operations must use the incident contact tree and must not treat provider delivery as the source of truth.
- Escalation contacts, covered hours, jurisdiction-specific emergency language, and the approved referral policy are deployment-owned external requirements.

## Provider failure recovery

Provider calls use bearer authentication, timeouts, explicit error codes, idempotency keys, and durable jobs. Operations can inspect jobs without exposing request payloads in the UI.

- `queued` or due `retryable`: execute from the operator workspace after confirming provider health.
- `dead-letter`: investigate the last error code. Create a domain-specific retry through the member or coach workflow where offered; never edit job rows manually.
- Billing failure moves the enrollment to `PAYMENT_FAILED`; a member provides a new token and queues a new charge.
- Video failure moves the appointment to `PROVIDER_FAILED`; a coach queues a new idempotent meeting attempt.
- Consent revocation dead-letters outstanding work and queues an eligible refund. It must not be manually reversed.
- Signed webhook delivery IDs are replay-safe. Replays return success with `duplicate: true`.

Alert on health failures, elevated HTTP 5xx, provider job dead letters, oldest due job age, open critical-alert age, and failed restore drills. JSON request logs include request ID, route, status, and duration only; do not add tokens, request bodies, readiness answers, check-in evidence, or other sensitive content.

## Privacy and access incident

1. Preserve append-only audit events and infrastructure logs; do not query or export more member data than needed.
2. Revoke affected IdP sessions and provider credentials, rotate webhook secrets, and isolate the tenant if appropriate.
3. Determine tenant, subjects, time range, record types, and downstream providers from audit and job metadata.
4. Follow the organization’s privacy, legal, member-notification, and retention procedures.
5. Record corrective actions and test tenant/role isolation before reopening access.

## Backup and restore

- Use managed PostgreSQL encrypted backups with point-in-time recovery. The application does not create its own backups.
- Retention, region, encryption keys, RPO, and RTO must be approved by the data owner.
- At the approved cadence, restore into an isolated account/network, run `./start.sh check`, validate row counts and foreign keys, and sample audit continuity without using production provider credentials.
- Record the backup reference, result, and evidence URI in the operator restore-drill form. A recorded form is evidence, not proof; retain provider restore logs separately.

## External launch blockers

Code cannot complete these items: provision managed PostgreSQL and backups; register an OIDC client with tenant and role claims; configure HTTPS/DNS; contract and credential billing, video, wearable, and notification providers; publish consent/privacy/retention terms; approve clinical-referral and emergency language by jurisdiction; establish staffed escalation and incident contacts; and perform independent security/privacy review.
