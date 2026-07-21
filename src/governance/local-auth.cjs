const crypto = require('node:crypto');
const { Pool } = require('pg');

let pool;
function database() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}
function hashPassword(password, salt = crypto.randomBytes(16)) {
  return `scrypt$${salt.toString('hex')}$${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}
function verifyPassword(password, encoded) {
  const [algorithm, saltHex, digestHex] = String(encoded).split('$');
  if (algorithm !== 'scrypt' || !saltHex || !digestHex) return false;
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), 64);
  const expected = Buffer.from(digestHex, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
function tokenHash(token) { return crypto.createHash('sha256').update(token).digest('hex'); }
async function login(email, password) {
  const result = await database().query(
    `SELECT i.tenant_id,i.subject,i.role,i.email,c.password_hash
       FROM wellness_identities i JOIN wellness_local_credentials c USING(tenant_id,subject)
      WHERE lower(i.email)=lower($1) AND i.active=true`,
    [email],
  );
  const identity = result.rows[0];
  if (!identity || !verifyPassword(password, identity.password_hash)) return null;
  const token = crypto.randomBytes(32).toString('base64url');
  await database().query(
    `INSERT INTO wellness_local_sessions(token_hash,tenant_id,subject,expires_at) VALUES($1,$2,$3,now()+interval '8 hours')`,
    [tokenHash(token), identity.tenant_id, identity.subject],
  );
  return { token, user: { subject: identity.subject, tenantId: identity.tenant_id, role: identity.role, email: identity.email } };
}
async function session(token) {
  if (!token) return null;
  const result = await database().query(
    `UPDATE wellness_local_sessions s SET last_seen_at=now()
       FROM wellness_identities i
      WHERE s.token_hash=$1 AND s.expires_at>now() AND i.tenant_id=s.tenant_id AND i.subject=s.subject AND i.active=true
      RETURNING i.subject,i.tenant_id,i.role,i.email`,
    [tokenHash(token)],
  );
  const row = result.rows[0];
  return row ? { subject: row.subject, tenantId: row.tenant_id, role: row.role, email: row.email } : null;
}
function requestToken(request) {
  const authorization = request.headers.get('authorization') || '';
  if (authorization.startsWith('Bearer ')) return authorization.slice(7);
  const match = (request.headers.get('cookie') || '').match(/(?:^|;\s*)wellness_local_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}
module.exports = { hashPassword, login, session, requestToken };
