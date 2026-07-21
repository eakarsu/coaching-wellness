const crypto = require('node:crypto');
const { Pool } = require('pg');
const { hashPassword } = require('../src/governance/local-auth.cjs');

async function main() {
  if (process.env.BOOTSTRAP_ACKNOWLEDGEMENT !== 'create-initial-admin') throw new Error('BOOTSTRAP_ACKNOWLEDGEMENT=create-initial-admin is required');
  const email = String(process.env.PROVISION_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.PROVISION_ADMIN_PASSWORD || '');
  const name = String(process.env.PROVISION_ADMIN_NAME || '').trim();
  if (!email.includes('@') || password.length < 12 || !name || !process.env.DATABASE_URL) throw new Error('Valid provisioning environment is required');
  const db = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const existing = await db.query('SELECT tenant_id,subject FROM wellness_identities WHERE lower(email)=lower($1)', [email]);
    if (existing.rowCount) { console.log(JSON.stringify({ event: 'initial_admin_exists' })); return; }
    const tenantId = crypto.randomUUID(), subject = `local:${crypto.randomUUID()}`;
    await db.query('BEGIN');
    await db.query('INSERT INTO wellness_tenants(id,name) VALUES($1,$2)', [tenantId, process.env.PROVISION_COMPANY_NAME || name]);
    await db.query("INSERT INTO wellness_identities(tenant_id,subject,role,email) VALUES($1,$2,'operator',$3)", [tenantId, subject, email]);
    await db.query('INSERT INTO wellness_local_credentials(tenant_id,subject,password_hash) VALUES($1,$2,$3)', [tenantId, subject, hashPassword(password)]);
    await db.query('COMMIT');
    console.log(JSON.stringify({ event: 'initial_admin_created', tenantId }));
  } catch (error) { await db.query('ROLLBACK').catch(() => {}); throw error; }
  finally { await db.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
