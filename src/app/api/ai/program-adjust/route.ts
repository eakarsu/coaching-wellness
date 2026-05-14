// Custom feature (batch_09): AI-driven program-cycle adjustments (deloads, rest day prediction).
import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

function parseJSON(t: string) {
  if (!t) return null;
  const c = t.replace(/```(?:json)?/gi, '').replace(/```/g, '');
  const m = c.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, current_program, last_4w_load, recovery_signals } = await req.json();
    if (!userId || !current_program) return NextResponse.json({ error: 'userId and current_program required' }, { status: 400 });
    if (!OPENROUTER_API_KEY) return NextResponse.json({ error: 'AI provider not configured (OPENROUTER_API_KEY missing).' }, { status: 503 });

    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You adjust an exercise / wellness program: deload weeks, rest day prediction, intensity tweaks. JSON only.' },
          { role: 'user', content: `PROGRAM: ${JSON.stringify(current_program)}\nLOAD: ${JSON.stringify(last_4w_load || {})}\nRECOVERY: ${JSON.stringify(recovery_signals || {})}\nReturn JSON {"adjustments":[{"week":0,"change":"deload|intensify|rest","details":""}],"recommended_rest_days_next_week":0,"injury_risk":"low|med|high","rationale":""}` },
        ],
        max_tokens: 1200,
        temperature: 0.3,
      }),
    });

    const data: any = await r.json();
    const content = data?.choices?.[0]?.message?.content || '';
    return NextResponse.json({ type: 'program-adjust', result: parseJSON(content) || { raw: content }, model: data?.model });
  } catch (e: any) {
    console.error('program-adjust error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
