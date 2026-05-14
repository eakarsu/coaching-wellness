/**
 * Apply pass 5 — backlog: email notification stub (NEEDS-CREDS).
 *
 * Documented env vars:
 *   - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 *
 * Returns HTTP 503 + `missing` when SMTP_HOST is unset.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function ensureSchema() {
  try {
    const db = getDb();
    db.exec(`
      CREATE TABLE IF NOT EXISTS notification_log_v5 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel TEXT,
        recipient TEXT,
        subject TEXT,
        body TEXT,
        status TEXT DEFAULT 'queued',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (_) {}
}
ensureSchema();

export async function POST(req: NextRequest) {
  if (!process.env.SMTP_HOST) {
    return NextResponse.json(
      { error: 'SMTP not configured', missing: 'SMTP_HOST' },
      { status: 503 }
    );
  }
  try {
    const { to, subject, body } = await req.json();
    if (!to || !subject) {
      return NextResponse.json({ error: 'to and subject required' }, { status: 400 });
    }
    try {
      getDb()
        .prepare(
          `INSERT INTO notification_log_v5 (channel, recipient, subject, body, status)
           VALUES ('email', ?, ?, ?, 'queued_stub')`
        )
        .run(to, subject, body || '');
    } catch (_) {}
    return NextResponse.json({
      status: 'queued',
      provider: 'smtp',
      note: 'stub — actual delivery requires nodemailer dep',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'failed' }, { status: 500 });
  }
}
