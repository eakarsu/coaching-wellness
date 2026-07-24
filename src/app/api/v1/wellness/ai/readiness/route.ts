import { NextResponse } from 'next/server';
import { Pool } from 'pg';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const localAuth = require('@/governance/local-auth.cjs');

let pool: Pool | undefined;
function database() { if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL }); return pool; }

export async function POST(request: Request) {
  const user = await localAuth.session(localAuth.requestToken(request));
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  const apiKey = process.env.OPENROUTER_API_KEY, model = process.env.OPENROUTER_MODEL, baseUrl = process.env.OPENROUTER_BASE_URL;
  if (!apiKey || !model || !baseUrl) return NextResponse.json({ error: 'OpenRouter runtime is not configured' }, { status: 503 });
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, temperature: 0.2, messages: [
    { role: 'system', content: 'You are a wellness operations reviewer, not a clinician. Return concise operational risks, evidence gaps, next actions, uncertainty, and required qualified-human review.' },
    { role: 'user', content: prompt },
  ] }) });
  if (!response.ok) return NextResponse.json({ error: `OpenRouter returned ${response.status}` }, { status: 502 });
  const payload = await response.json(); const output = String(payload?.choices?.[0]?.message?.content || '').trim();
  if (!output) return NextResponse.json({ error: 'OpenRouter returned an empty response' }, { status: 502 });
  const saved = await database().query(`INSERT INTO wellness_ai_results(tenant_id,actor_subject,feature,input,output,model) VALUES($1,$2,'readiness',$3,$4,$5) RETURNING id`, [user.tenantId, user.subject, { prompt }, output, model]);
  return NextResponse.json({ id: saved.rows[0].id, response: output, model, provider: 'openrouter' });
}
