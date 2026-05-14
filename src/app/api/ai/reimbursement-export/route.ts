// Custom feature (batch_09): Insurance / HSA reimbursement export.
// TODO: configure credentials for INSURANCE_API_KEY (Stedi / Change Healthcare bridge).
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
    const { userId, sessions, target_format = 'HSA-letter' } = await req.json();
    if (!userId || !Array.isArray(sessions)) return NextResponse.json({ error: 'userId and sessions array required' }, { status: 400 });
    if (!OPENROUTER_API_KEY) return NextResponse.json({ error: 'AI provider not configured (OPENROUTER_API_KEY missing).' }, { status: 503 });

    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You produce insurance / HSA reimbursement export documents from session records. JSON only.' },
          { role: 'user', content: `TARGET: ${target_format}\nINS_API: ${Boolean(process.env.INSURANCE_API_KEY)}\nSESSIONS: ${JSON.stringify(sessions.slice(0, 30))}\nReturn JSON {"document_type":"","line_items":[{"date":"","cpt_or_code":"","description":"","amount_usd":0}],"total_usd":0,"narrative":"","disclaimer":""}` },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    const data: any = await r.json();
    const content = data?.choices?.[0]?.message?.content || '';
    return NextResponse.json({ type: 'reimbursement-export', result: parseJSON(content) || { raw: content }, model: data?.model });
  } catch (e: any) {
    console.error('reimbursement-export error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
