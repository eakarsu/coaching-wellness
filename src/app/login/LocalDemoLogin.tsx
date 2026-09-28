'use client';

import { FormEvent, useState } from 'react';

export default function LocalDemoLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function fillDemoCredentials() {
    setError('');
    const response = await fetch('/api/auth/demo-credentials');
    if (!response.ok) return setError('Demo credentials are unavailable.');
    const credentials = await response.json();
    setEmail(credentials.email);
    setPassword(credentials.password);
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
    <button type="button" className="secondary-button full" onClick={fillDemoCredentials}>Auto Fill Demo Credentials</button>
    <button type="submit" className="primary-button full">Sign In</button>
  </form>;
}
