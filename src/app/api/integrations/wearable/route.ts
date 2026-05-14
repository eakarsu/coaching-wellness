/**
 * Apply pass 5 — backlog: wearable / smartwatch ingestion stub.
 *
 * NEEDS-CREDS — gates on env vars; returns HTTP 503 + `missing` when unset.
 *
 * Documented env vars:
 *   - FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET, FITBIT_REFRESH_TOKEN
 *   - GARMIN_CONSUMER_KEY, GARMIN_CONSUMER_SECRET, GARMIN_ACCESS_TOKEN
 *   - APPLE_HEALTH_TOKEN  (HealthKit data is normally ingested client-side)
 *
 * Schema: writes to additive `wearable_samples_v5` table (CREATE IF NOT EXISTS).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function need(name: string) {
  return process.env[name] ? null : name;
}

function ensureSchema() {
  try {
    const db = getDb();
    db.exec(`
      CREATE TABLE IF NOT EXISTS wearable_samples_v5 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider TEXT NOT NULL,
        client_id TEXT,
        metric TEXT NOT NULL,
        value REAL,
        recorded_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (_) { /* soft-fail */ }
}
ensureSchema();

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get('provider') || 'fitbit';
  let missing: string | null = null;
  if (provider === 'fitbit') missing = need('FITBIT_REFRESH_TOKEN') || need('FITBIT_CLIENT_ID');
  else if (provider === 'garmin') missing = need('GARMIN_ACCESS_TOKEN') || need('GARMIN_CONSUMER_KEY');
  else if (provider === 'apple-health') missing = need('APPLE_HEALTH_TOKEN');
  else return NextResponse.json({ error: 'unknown provider' }, { status: 400 });

  if (missing) {
    return NextResponse.json(
      { error: `${provider} not configured`, missing },
      { status: 503 }
    );
  }
  return NextResponse.json({ provider, samples: [], note: 'stub — wire upstream when env complete' });
}

export async function POST(req: NextRequest) {
  // Lets clients (or HealthKit bridges) push samples without provider creds.
  // Useful for manual/CSV import paths.
  try {
    const body = await req.json();
    const { provider, client_id, samples } = body || {};
    if (!provider || !Array.isArray(samples)) {
      return NextResponse.json({ error: 'provider and samples[] required' }, { status: 400 });
    }
    const db = getDb();
    const stmt = db.prepare(
      `INSERT INTO wearable_samples_v5 (provider, client_id, metric, value, recorded_at)
       VALUES (?,?,?,?,?)`
    );
    let count = 0;
    for (const s of samples) {
      try {
        stmt.run(
          provider,
          client_id || null,
          s.metric || 'unknown',
          typeof s.value === 'number' ? s.value : null,
          s.recorded_at || new Date().toISOString()
        );
        count++;
      } catch (_) {}
    }
    return NextResponse.json({ ingested: count });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'failed' }, { status: 500 });
  }
}
