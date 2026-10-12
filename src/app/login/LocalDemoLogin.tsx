"use client";
import { FormEvent, useState } from 'react';

export async function getConfiguredDemoCredentials(fetcher: typeof fetch = fetch): Promise<{ email: string; password: string }> {
  const response = await fetcher('/api/auth/demo-credentials', { cache: 'no-store' });
  if (!response.ok) throw new Error('Demo credentials are unavailable.');
  const credentials: unknown = await response.json();
  if (!credentials || typeof credentials !== 'object' ||
    !('email' in credentials) || !('password' in credentials) ||
    typeof credentials.email !== 'string' || typeof credentials.password !== 'string' ||
    !credentials.email || !credentials.password) throw new Error('Demo credentials are unavailable.');
  return { email: credentials.email, password: credentials.password };
}

export default function LocalDemoLogin() {
  const [demoLoginBusy, setDemoLoginBusy] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function fillDemoCredentials() {
    setError('');
    setDemoLoginBusy(true);
    try {
      const credentials = await getConfiguredDemoCredentials();
      setEmail(credentials.email);
      setPassword(credentials.password);
    } catch {
      setError('Demo credentials are unavailable. Sign in with your configured account.');
    } finally {
      setDemoLoginBusy(false);
    }
  }

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setError('');
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) return setError('Sign in failed.');
    location.assign('/');
  }

  return <form onSubmit={signIn} className="auth-form">
    <label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
    <label>Password<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
    {error && <p className="error-banner" role="alert">{error}</p>}
    <button disabled={demoLoginBusy} type="button" className="secondary-button full" onClick={fillDemoCredentials}>{demoLoginBusy ? 'Loading demo credentials...' : 'Fill Demo Credentials'}</button>
    <button type="submit" className="primary-button full">Sign In</button>
  </form>;
}
