import { NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const localAuth = require('@/governance/local-auth.cjs');
export async function GET(request: Request) {
  const enabled = process.env.AUTH_MODE !== 'oidc' && process.env.BOOTSTRAP_ACKNOWLEDGEMENT === 'create-initial-admin';
  if (!enabled) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const user = await localAuth.session(localAuth.requestToken(request));
  return user ? NextResponse.json({ user }) : NextResponse.json({ error: 'Invalid session' }, { status: 401 });
}
