import Link from 'next/link';

const errors: Record<string, string> = {
  invalid_sso_state: 'The sign-in response could not be verified. Start a new sign-in.',
  sso_exchange_failed: 'The identity provider did not complete sign-in. Try again or contact support.',
  invalid_identity_claims: 'Your organization account is missing a tenant or approved role.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const code = (await searchParams).error || '';
  return <main className="auth-shell">
    <section className="auth-card">
      <div className="brand-mark">W</div>
      <p className="eyebrow">Wellness operations</p>
      <h1>Sign in through your organization</h1>
      <p className="muted">Access is restricted to assigned members, coaches, and operations staff. Sessions are short-lived and tenant-scoped.</p>
      {code && <p className="error-banner" role="alert">{errors[code] || 'Sign-in could not be completed.'}</p>}
      <Link className="primary-button full" href="/api/v1/wellness/auth/sso" prefetch={false}>Continue with SSO</Link>
      <p className="fine-print">This service supports non-medical wellness coaching. It does not diagnose or provide emergency care.</p>
    </section>
  </main>;
}
