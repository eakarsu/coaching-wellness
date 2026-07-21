import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loadConfig } = require('@/governance/config.cjs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getPool } = require('@/governance/db.cjs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createProviders } = require('@/governance/providers.cjs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createService } = require('@/governance/service.cjs');
let service: ReturnType<typeof createService>;
function getService() { if (!service) { const config = loadConfig(); service = createService({ config, pool: getPool(config), providers: createProviders(config) }); } return service; }

export async function POST(request: Request, context: { params: Promise<{ provider: string }> }) {
  const started = Date.now(), requestId = crypto.randomUUID(), { provider } = await context.params, rawBody = await request.text();
  let body = {};
  try { body = JSON.parse(rawBody); } catch { return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 }); }
  const result = await getService()({ method: 'POST', path: `webhooks/${provider}`, headers: Object.fromEntries(request.headers.entries()), body, rawBody });
  console.info(JSON.stringify({ event: 'wellness.webhook', requestId, provider, status: result.status, durationMs: Date.now() - started }));
  return NextResponse.json(result.body, { status: result.status, headers: { 'x-request-id': requestId } });
}
