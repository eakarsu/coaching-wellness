# Completeness Review: coaching-wellness

**Review date:** 2026-07-18

## Assessment basis

Static inspection of project-owned source and configuration only; no dependency installation, build, database migration, external-service call, or runtime launch was performed. The scan considered 99 project files (81 source files), 1 manifest(s), 0 test-like file(s), and 0 CI workflow(s), excluding dependency/generated directories.

## Classification

**Prototype-demo**

This is a prototype/demo for application workflow. Generated gap/demo patterns are present: it contains 81 source files and visible routes/pages in `src/`, but those surfaces are not evidence of durable domain execution, verified integrations, or operational completion.

## Why it is not complete

- Generated gap/visualization routes describe missing capabilities or simulate recommendations; they do not implement the underlying domain operation.
- Generic LLM calls are used as product behavior without enough typed tools, grounded evidence, deterministic rules, or output evaluation.
- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- No recognizable project-owned automated tests were found for the main workflow.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.

## Needed features

1. Define the primary user and acceptance criteria, then complete one end-to-end workflow against persistent data instead of demo fixtures.
2. Replace mocks, placeholders, and generic AI responses with validated domain services and explicit failure/retry behavior.
3. Implement secure identity, role/tenant boundaries, input validation, secrets handling, and auditable state changes.
4. Add representative automated tests, CI quality gates, environment documentation, migrations, observability, backup, and deployment configuration.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- Weak/fallback secret patterns can permit forged sessions or accidental insecure deployments.
- Automation contains destructive process, filesystem, or database operations; do not run it on a shared machine without review.
- Startup appears coupled to seed/migration behavior, risking data mutation or non-repeatable launches.
- AI-provider availability, cost, privacy, prompt injection, and unvalidated output are launch risks until bounded and evaluated.

## Evidence inspected

- `README.md`
- `src/app/api/users/route.ts:24`
- `src/app/codex/custom-viz/page.tsx:31`
- `src/app/client-layout.tsx`
- `package.json`
- `start.sh`

## Recommended next action

Stop adding generated pages; prove one application workflow workflow against real services and persistent state, with tests and measurable acceptance criteria.

## Implementation progress (2026-07-19)

The source-actionable findings are implemented around one production workflow: a tenant member completes readiness and versioned consent, enrolls with a capacity-constrained coach, recovers payment if necessary, receives a human-authored plan and measurable goal, records evidence-backed check-ins, enters a safety hold under deterministic rules when appropriate, receives documented coach dispositions and plan-adjustment decisions, schedules a provider-backed session, imports provenance-bearing wearable observations, and can revoke consent with downstream work cancellation and an eligible refund job.

- Added replay-safe PostgreSQL migrations for tenant identities, coach capacity, versioned enrollment state, plans, goals, check-ins, safety alerts, human-reviewed adjustments, appointments, wearable provenance, durable provider jobs, webhook receipts, restore drills, and immutable audit events.
- Added RS256 OIDC authorization-code authentication with state and PKCE, short-lived secure cookies, fail-closed production configuration, tenant and member/coach/operator authorization, explicit input/state validation, and secret-manager-ready environment documentation.
- Added billing, video, wearable, and notification adapters with bearer authentication, timeouts/error classification, idempotency, exponential retry state, terminal dead letters, manual recovery paths, signed webhooks, and replay detection. Transient billing outages preserve pending enrollment for safe job retry; terminal declines require an explicit member retry.
- Replaced the production UI with role-specific member, coach, and operator workspaces. Urgent symptom and high-pain rules are deterministic, visibly bounded as non-medical, pause the plan, require coach action, and require a clinician-referral disposition for critical reports. Generic AI, SQLite, weak-password auth, mocks, and generated-gap routes are quarantined from production.
- Added JSON request telemetry without sensitive bodies, database health and startup checks, explicit opt-in migration commands, a non-root standalone container, CI with PostgreSQL, security auditing, environment/runbook documentation, provider recovery, privacy incident, and backup/restore procedures.
- Verification completed locally: all 7 tests passed against a disposable real PostgreSQL database and HTTP server; the migration applied repeatedly; cross-tenant and unrelated-member access failed as expected; payment decline and transient-outage recovery, video failure/retry, wearable webhook replay, consent revocation, and audit immutability were exercised. The Next.js 16.2.10 production build, governed-source ESLint run, startup migration/check commands, shell syntax check, dependency audit (0 vulnerabilities), and `git diff --check` passed.

Remaining launch dependencies are external: provision managed PostgreSQL with encrypted backup/PITR; register the production OIDC client and required tenant/role claims; configure HTTPS and DNS; contract and provision sandbox/production billing, video, wearable, and notification providers; approve consent, privacy, retention, referral, and jurisdiction-specific emergency language; staff escalation and incident contacts; run a real isolated restore drill; and complete independent security/privacy review. No code path claims those approvals or services are complete.

## Runtime acceptance (2026-07-20)

The non-suite validator passed the complete disposable runtime journey on
PostgreSQL `55633`, API `6080`, and UI `6081` at `2026-07-20T20:41:46Z`:
`API_VERIFIED / startup_login_session_api`. The run proved startup,
environment-provisioned scrypt login, opaque PostgreSQL session
persistence/revalidation, and authenticated API use. The legacy destructive
SQLite seed now requires a separate exact acknowledgement and an
environment-supplied password.
