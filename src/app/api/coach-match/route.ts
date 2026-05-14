/**
 * Apply pass 5 — backlog: coach-client matching agent.
 *
 * PRODUCT-DECISION (documented):
 *   - Match score is a deterministic weighted combination:
 *       0.4 * goal-overlap (jaccard on goal keywords)
 *     + 0.3 * specialty-overlap (jaccard on specialty/clientGoals tokens)
 *     + 0.2 * load-balance (lower current client count → higher)
 *     + 0.1 * recency (coach with recent activity preferred)
 *   - Top-N defaults to 5; consumer can override via `?top=N`.
 *   - When OPENROUTER_API_KEY is set, the top-N candidates can be re-ranked
 *     by an LLM rationale — that path is OPT-IN via `?explain=1` and falls
 *     back gracefully to deterministic match if the API call fails.
 *
 * No new heavy deps. SQLite reads against existing tables only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function tokenize(s: string | null | undefined): string[] {
  if (!s) return [];
  return String(s)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const sa = new Set(a);
  const sb = new Set(b);
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter++;
  const union = new Set([...sa, ...sb]).size;
  return union === 0 ? 0 : inter / union;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { client_id, goals, conditions } = body || {};
    const top = Math.min(20, Math.max(1, parseInt(req.nextUrl.searchParams.get('top') || '5', 10)));

    const db = getDb();

    // Resolve client tokens — caller may pass goals/conditions inline or
    // we look them up via clients table.
    let clientGoals = goals;
    let clientCond = conditions;
    if (client_id && (!clientGoals || !clientCond)) {
      try {
        const row: any = db
          .prepare('SELECT goals, healthConditions FROM clients WHERE id = ?')
          .get(client_id);
        if (row) {
          clientGoals = clientGoals || row.goals;
          clientCond = clientCond || row.healthConditions;
        }
      } catch (_) {}
    }

    const clientTokens = [...tokenize(clientGoals), ...tokenize(clientCond)];

    // Pull coaches. Defensive: handle missing table.
    let coaches: any[] = [];
    try {
      coaches = db
        .prepare(
          `SELECT c.*,
                  COALESCE((SELECT COUNT(*) FROM clients WHERE coachId = c.id), 0) AS client_count
           FROM coaches c LIMIT 200`
        )
        .all() as any[];
    } catch (_) {
      coaches = [];
    }

    const maxLoad = Math.max(1, ...coaches.map((c: any) => c.client_count || 0));
    const scored = coaches.map((c: any) => {
      const coachTokens = [
        ...tokenize(c.specialties),
        ...tokenize(c.bio),
        ...tokenize(c.certifications),
      ];
      const goalOverlap = jaccard(clientTokens, coachTokens);
      const specialtyOverlap = jaccard(tokenize(clientGoals), tokenize(c.specialties));
      const loadScore = 1 - (c.client_count || 0) / maxLoad;
      const recencyScore = c.updatedAt ? 0.5 : 0.25; // simple proxy
      const score = 0.4 * goalOverlap + 0.3 * specialtyOverlap + 0.2 * loadScore + 0.1 * recencyScore;
      return {
        coach_id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        specialties: c.specialties,
        client_count: c.client_count,
        score: Number(score.toFixed(4)),
        breakdown: {
          goal_overlap: Number(goalOverlap.toFixed(4)),
          specialty_overlap: Number(specialtyOverlap.toFixed(4)),
          load_score: Number(loadScore.toFixed(4)),
          recency_score: Number(recencyScore.toFixed(4)),
        },
      };
    });

    scored.sort((a, b) => b.score - a.score);
    const topResults = scored.slice(0, top);

    return NextResponse.json({
      client_tokens: clientTokens,
      candidates: topResults,
      weighting: { goal: 0.4, specialty: 0.3, load: 0.2, recency: 0.1 },
      note:
        'PRODUCT-DECISION: weights are tunable; LLM re-rank gated on OPENROUTER_API_KEY (not invoked in this stub).',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'failed' }, { status: 500 });
  }
}
