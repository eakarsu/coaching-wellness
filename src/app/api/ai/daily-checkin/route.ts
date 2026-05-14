// Custom feature (batch_09): Daily AI check-in summarizing wearable + mood + nutrition signals.
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
    const { userId, wearables, mood, nutrition } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
    if (!OPENROUTER_API_KEY) return NextResponse.json({ error: 'AI provider not configured (OPENROUTER_API_KEY missing).' }, { status: 503 });

    // TODO: configure credentials for WEARABLE_FUSION_API_KEY (Apple Health / Fitbit aggregator).
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Wellness Coach Pro',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You synthesize today\'s wearable + mood + nutrition into a brief, encouraging daily check-in. JSON only.' },
          { role: 'user', content: `WEARABLES: ${JSON.stringify(wearables || {})}\nMOOD: ${JSON.stringify(mood || {})}\nNUTRITION: ${JSON.stringify(nutrition || {})}\nReturn JSON {"headline":"","strengths":[""],"focus_for_today":"","micro_action":"","red_flags":[""],"score_out_of_10":0}` },
        ],
        max_tokens: 700,
        temperature: 0.5,
      }),
    });

    const data: any = await r.json();
    const content = data?.choices?.[0]?.message?.content || '';
    return NextResponse.json({ type: 'daily-checkin', result: parseJSON(content) || { raw: content }, model: data?.model });
  } catch (e: any) {
    console.error('daily-checkin error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
