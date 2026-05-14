/**
 * Apply pass 5 — backlog: joint nutrition + fitness plan generator.
 *
 * NEEDS-CREDS: gates on OPENROUTER_API_KEY (returns HTTP 503 + missing).
 * Unlike the legacy `/api/ai/generate` dispatcher, this endpoint follows
 * the apply-pass-5 contract: no graceful sample-data fallback.
 *
 * Documented env vars:
 *   - OPENROUTER_API_KEY  (required)
 *   - OPENROUTER_MODEL    (optional; default openai/gpt-3.5-turbo)
 */
import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';

export async function POST(req: NextRequest) {
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: 'AI provider not configured', missing: 'OPENROUTER_API_KEY' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { clientName, goals, healthConditions, weeks } = body || {};
    const horizonWeeks = Number.isFinite(+weeks) && +weeks > 0 && +weeks <= 24 ? +weeks : 8;

    const prompt = `Generate a joint nutrition + fitness plan ${
      clientName ? `for ${clientName}` : ''
    } with goals: ${goals || 'general wellness'} and health conditions: ${
      healthConditions || 'none'
    }. Horizon: ${horizonWeeks} weeks.

Return JSON only with shape:
{
  "summary": "string",
  "weekly_breakdown": [{"week": 1, "fitness_focus": "string", "nutrition_focus": "string", "key_targets": ["string"]}],
  "fitness_plan": {"weekly_sessions": 0, "session_types": ["string"], "progression": "string"},
  "nutrition_plan": {"daily_calories": 0, "macro_split": {"protein_pct": 0, "carbs_pct": 0, "fat_pct": 0}, "hydration_l": 0, "meal_pattern": "string"},
  "synergy_notes": "string",
  "warning_signs": ["string"]
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Wellness Coach Pro - Joint Plan',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are a professional wellness coach who designs integrated nutrition + fitness plans. Respond with valid JSON only.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: 'upstream provider error', details: text },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    try {
      const parsed = JSON.parse(content);
      return NextResponse.json(parsed);
    } catch {
      // 3-strategy parse: locate JSON block
      const m = content.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          return NextResponse.json(JSON.parse(m[0]));
        } catch {
          /* fall through */
        }
      }
      return NextResponse.json({ raw: content });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'failed' }, { status: 500 });
  }
}
