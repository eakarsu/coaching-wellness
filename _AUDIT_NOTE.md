# Audit Apply Notes — coaching-wellness

Source: `_AUDIT/reports/batch_09.md` § coaching-wellness

## Original audit recommendations

The audit section is brief:
> **Domain:** Health coaching/wellness platform.
> **Stack & Maturity:** Next.js. 11 pages, 14 AI endpoints. **Verdict: Template-Clone**.
> **Pages:** Clients, appointments, wellness, admin, register, password-reset, profile, fitness, nutrition, login.

No specific "Missing AI Counterparts", "Missing Non-AI Features", or "Custom Feature Ideas" subsections were raised for this project.

## Implemented this pass

**None.** This pass is backlog-only.

Reason: the audit did not surface concrete mechanical recommendations to apply. Adding speculative AI endpoints without an audit-driven gap list (see neighbouring projects like `coaching` which got a list, and `beauty-wellness-ai` which got rich custom ideas) would diverge from the apply-pass mandate of "≤3 SAFE MECHANICAL recommendations".

## Backlog (not implemented)

Inferred adjacent backlog (do not treat as audit recommendations):

- More structured wellness-goal AI (SMART-goal generation, milestone forecasting).
- Nutrition + fitness plan diff (compare two plans, suggest tweaks).
- Coach-client matching agent.
- Adherence prediction (which clients are likely to drop off).

These would each require product decisions about scope, success metrics, and which existing tables underpin them.

## Categorisation

- MECHANICAL: none surfaced by audit.
- NEEDS-PRODUCT-DECISION: any extension above (matching, adherence prediction).

## Apply pass 3 (frontend)

- **Stack:** Next.js 14 (App Router) under `src/app/`.
- **Action:** LEFT-AS-IS (FE already wired).
- **Verification:** `src/app/api/ai/generate/route.ts` is the only AI route — a dispatching `POST` handler. Three pages call it via `fetch('/api/ai/generate', { method: 'POST', ... })`: `clients/page.tsx`, `appointments/page.tsx`, `wellness/page.tsx`. Missing `OPENROUTER_API_KEY` triggers a sample-data fallback in the route (intentional graceful-degrade rather than a 503).
- **Files modified:** none.

## Apply pass 4 (mechanical backlog)

- **Action:** IMPLEMENTED (3 features).
- **Features added (all extend the existing `/api/ai/generate` dispatcher with new `type` values):**
  1. `smartGoal` — SMART wellness goal generator with milestone forecasting (specific/measurable/achievable/relevant/time-bound + weekly milestones, risk factors, success indicators).
  2. `planDiff` — diff two wellness plans, propose merged plan + targeted tweaks, surface risk notes (uses `context.planA` / `context.planB`).
  3. `adherencePrediction` — predict client adherence probability, flag drop-off risk, recommend retention actions and check-in cadence (uses `context.history`).
  - All three new types short-circuit with HTTP 503 when `OPENROUTER_API_KEY` is missing (legacy types keep their existing graceful sample-data fallback for backward compatibility).
  - New page: `src/app/ai-insights/page.tsx` with three tabs (one per new type), shared client/goals/health-conditions inputs, and per-tab specialised inputs. Defensive `Authorization: Bearer <token>` header from `localStorage.getItem('token')` (project is currently session-less SQLite — header is included for forward compat).
  - Navbar: `src/components/Navbar.tsx` gets an "AI Insights" entry pointing to `/ai-insights`.
- **Backlog deferred:**
  - Coach-client matching agent — NEEDS-PRODUCT-DECISION (matching-criteria schema and success metric).
  - Wearable / smartwatch ingestion — NEEDS-CREDS.
  - Joint nutrition+fitness plan generator — possible but out of cap-priority for this pass.
- **Smoke test:** PASS — `npm run dev` (Next.js 16 turbopack); `POST /api/ai/generate {type:"smartGoal", ...}` with key set returns HTTP 200; restarted with empty `OPENROUTER_API_KEY` and same call returns HTTP 503 with `"AI provider not configured ..."`; legacy `type:"workout"` still returns sample data (HTTP 200) — backward compat preserved. Server cleaned up after.
- **Files modified:** `src/app/api/ai/generate/route.ts`, `src/components/Navbar.tsx`, plus new `src/app/ai-insights/page.tsx`.
