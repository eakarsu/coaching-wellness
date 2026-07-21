import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loadConfig } = require('@/governance/config.cjs');

function equal(left: string, right: string) {
  const a = Buffer.from(left), b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const config = loadConfig();
  const code = request.nextUrl.searchParams.get('code') || '';
  const state = request.nextUrl.searchParams.get('state') || '';
  const storedState = request.cookies.get('wellness_oidc_state')?.value || '';
  const verifier = request.cookies.get('wellness_oidc_verifier')?.value || '';
  if (!code || !state || !storedState || !verifier || !equal(state, storedState)) return NextResponse.redirect(new URL('/login?error=invalid_sso_state', request.url), 303);
  const body = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: config.oidcRedirectUri, client_id: config.oidcClientId, client_secret: config.oidcClientSecret, code_verifier: verifier });
  const tokenResponse = await fetch(config.oidcTokenUrl, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' }, body, cache: 'no-store' });
  const token = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || typeof token.id_token !== 'string') return NextResponse.redirect(new URL('/login?error=sso_exchange_failed', request.url), 303);
  try {
    const claims = jwt.verify(token.id_token, config.publicKey, { algorithms: ['RS256'], issuer: config.oidcIssuer, audience: config.oidcAudience, maxAge: '15m', clockTolerance: 5 }) as jwt.JwtPayload;
    if (!claims.sub || !claims.tenant_id || !['member', 'coach', 'operator'].includes(String(claims.role).toLowerCase())) throw new Error('missing governed claims');
  } catch {
    return NextResponse.redirect(new URL('/login?error=invalid_identity_claims', request.url), 303);
  }
  const response = NextResponse.redirect(new URL('/', request.url), 303);
  response.cookies.set('wellness_session', token.id_token, { httpOnly: true, secure: config.production, sameSite: 'strict', maxAge: Math.min(Number(token.expires_in) || 900, 900), path: '/' });
  response.cookies.set('wellness_oidc_state', '', { expires: new Date(0), path: '/api/v1/wellness/auth' });
  response.cookies.set('wellness_oidc_verifier', '', { expires: new Date(0), path: '/api/v1/wellness/auth' });
  return response;
}
