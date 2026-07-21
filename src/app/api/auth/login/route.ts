import { NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const localAuth = require('@/governance/local-auth.cjs');
export async function POST(request: Request) {
  const enabled = process.env.AUTH_MODE !== 'oidc' && process.env.BOOTSTRAP_ACKNOWLEDGEMENT === 'create-initial-admin';
  if (!enabled) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { email, password } = await request.json().catch(() => ({}));
  const result = typeof email === 'string' && typeof password === 'string' ? await localAuth.login(email, password) : null;
  if (!result) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  const response = NextResponse.json(result);
  response.cookies.set('wellness_local_session', result.token, { httpOnly: true, sameSite: 'strict', secure: false, maxAge: 8 * 60 * 60, path: '/' });
  return response;
}
