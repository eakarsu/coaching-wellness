# Governed Wellness Operations

A tenant-scoped wellness coaching workflow for members, coaches, and operations staff. The production path is deliberately narrow: readiness and consent, payment-backed enrollment, a human-authored plan, measurable goals, deterministic safety-aware check-ins, coach-reviewed adjustments, appointments, wearable provenance, consent revocation, and provider recovery.

This service supports non-medical wellness coaching. It does not diagnose, prescribe, replace a clinician, or provide emergency care.

## Production architecture

- Next.js UI and route handlers under `/api/v1/wellness`
- PostgreSQL as the durable system of record
- RS256 OIDC authorization-code flow with state and PKCE
- Tenant and role checks on every governed operation (`member`, `coach`, `operator`)
- Versioned consent and readiness evidence
- Explicit enrollment state machine with optimistic version checks
- Deterministic safety rules; no generative-AI decision path
- Durable, idempotent provider jobs for billing, video, wearable, and notifications
- Signed, replay-safe wearable and billing webhooks
- Append-only audit events and recorded restore drills

The previous SQLite, password-auth, generic-AI, mock-integration, and generated-gap routes remain in source for historical comparison but are quarantined by the production proxy. Set `ENABLE_LEGACY_DEMOS=1` only in a disposable non-production environment. They are not supported product surfaces.

## Local verification

Requirements: Node 20+, npm, and PostgreSQL 16+.

```bash
npm ci
createdb coaching_wellness_test
TEST_DATABASE_URL=postgres:///coaching_wellness_test npm test
npm run build
npm audit --audit-level=moderate
```

The integration test uses the exact database named by `TEST_DATABASE_URL`, truncates governed wellness tables, applies the migration twice, and must never target shared data.

## Configuration and deployment

Copy `.env.example` into your deployment secret/config system; never commit the resulting values. Generate the RS256 key outside the application and provide only the public key here. Provider bearer tokens, the OIDC client secret, and webhook HMAC secret belong in a secret manager.

```bash
ALLOW_SCHEMA_MIGRATION=1 ./start.sh migrate
./start.sh check
./start.sh start
```

Startup does not seed data, kill processes, mutate the filesystem, or run migrations. Schema changes require the explicit migration command and flag. The health endpoint is `/api/v1/wellness/health`.

See [RUNBOOK.md](RUNBOOK.md) for rollout, safety escalation, provider recovery, backup/restore, and incident procedures.
