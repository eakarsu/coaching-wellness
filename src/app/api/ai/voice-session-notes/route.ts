// Custom feature (batch_09): Voice-driven session note dictation.
// Accepts a transcript (assumed pre-transcribed). Produces structured SOAP-style notes.
// TODO: configure credentials for VOICE_STT_API_KEY for server-side STT.
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
    const { coachId, clientId, transcript } = await req.json();
    if (!coachId || !clientId || !transcript) return NextResponse.json({ error: 'coachId, clientId, transcript required' }, { status: 400 });
    if (!OPENROUTER_API_KEY) return NextResponse.json({ error: 'AI provider not configured (OPENROUTER_API_KEY missing).' }, { status: 503 });

    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You convert a dictated coach session transcript into structured notes. JSON only. Non-medical phrasing.' },
          { role: 'user', content: `COACH: ${coachId}\nCLIENT: ${clientId}\nSTT_PROVIDER_CONFIGURED: ${Boolean(process.env.VOICE_STT_API_KEY)}\nTRANSCRIPT: ${transcript.slice(0, 6000)}\nReturn JSON {"subjective":"","objective":"","assessment":"","plan":"","action_items":[""],"followup_in_days":0}` },
        ],
        max_tokens: 1800,
        temperature: 0.3,
      }),
    });

    const data: any = await r.json();
    const content = data?.choices?.[0]?.message?.content || '';
    return NextResponse.json({ type: 'voice-session-notes', result: parseJSON(content) || { raw: content }, model: data?.model });
  } catch (e: any) {
    console.error('voice-session-notes error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
