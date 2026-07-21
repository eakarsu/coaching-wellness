import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loadConfig } = require('@/governance/config.cjs');

export async function GET() {
  const config = loadConfig();
  const state = crypto.randomBytes(32).toString('base64url');
  const verifier = crypto.randomBytes(48).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  const url = new URL(config.oidcAuthorizeUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', config.oidcClientId);
  url.searchParams.set('redirect_uri', config.oidcRedirectUri);
  url.searchParams.set('scope', 'openid profile email');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  const response = NextResponse.redirect(url, 303);
  const options = { httpOnly: true, secure: config.production, sameSite: 'lax' as const, maxAge: 600, path: '/api/v1/wellness/auth' };
  response.cookies.set('wellness_oidc_state', state, options);
  response.cookies.set('wellness_oidc_verifier', verifier, options);
  return response;
}
