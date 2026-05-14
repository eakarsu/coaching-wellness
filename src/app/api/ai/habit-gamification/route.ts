// Custom feature (batch_09): Habit-streak gamification with social leaderboards.
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
    const { userId, user_streaks, peer_group } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
    if (!OPENROUTER_API_KEY) return NextResponse.json({ error: 'AI provider not configured (OPENROUTER_API_KEY missing).' }, { status: 503 });

    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You award badges, XP, and rank a user vs peers based on habit streaks. Encouraging tone. JSON only.' },
          { role: 'user', content: `USER_STREAKS: ${JSON.stringify(user_streaks || {})}\nPEER_GROUP: ${JSON.stringify((peer_group || []).slice(0, 20))}\nReturn JSON {"badges":[""],"xp_awarded":0,"current_rank":0,"next_milestone":{"name":"","at_streak":0},"shoutout_copy":""}` },
        ],
        max_tokens: 700,
        temperature: 0.6,
      }),
    });

    const data: any = await r.json();
    const content = data?.choices?.[0]?.message?.content || '';
    return NextResponse.json({ type: 'habit-gamification', result: parseJSON(content) || { raw: content }, model: data?.model });
  } catch (e: any) {
    console.error('habit-gamification error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
