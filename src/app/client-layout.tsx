'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import styles from './client-layout.module.css';

const LINKS = [
  { href: '/', label: 'Workspace' },
  { href: '/clients', label: 'Clients' },
  { href: '/appointments', label: 'Appointments' },
  { href: '/wellness', label: 'Wellness' },
  { href: '/nutrition', label: 'Nutrition' },
  { href: '/fitness', label: 'Fitness' },
  { href: '/joint-plan', label: 'Joint Plans' },
  { href: '/coach-match', label: 'Coach Match' },
  { href: '/recovery-readiness', label: 'Recovery Readiness' },
  { href: '/ai-insights', label: 'AI Insights' },
  { href: '/admin', label: 'Administration' },
  { href: '/profile', label: 'Profile' },
  { href: '/codex/custom-viz', label: 'Custom Visualization' },
  { href: '/codex/operations', label: 'Operations' },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (['/login', '/register', '/password-reset'].includes(pathname)) {
      setAuthenticated(false);
      return;
    }
    const controller = new AbortController();
    fetch('/api/v1/wellness/session', { cache: 'no-store', signal: controller.signal })
      .then(response => { if (!controller.signal.aborted) setAuthenticated(response.ok); })
      .catch(() => { if (!controller.signal.aborted) setAuthenticated(false); });
    return () => controller.abort();
  }, [pathname]);
  const show = authenticated && !['/login', '/register', '/password-reset'].includes(pathname);
  return <ErrorBoundary>{show ? <div className={styles.shell}>
    <aside className={styles.sidebar} aria-label="Application navigation">
      <div className={styles.brand}><strong>Wellness Operations</strong><span>Workspace</span></div>
      <label htmlFor="wellness-nav-search">Find a section</label>
      <input id="wellness-nav-search" type="search" placeholder="Search navigation" value={query} onChange={event => setQuery(event.target.value)} />
      <nav aria-label="Sections">{LINKS.filter(item => item.label.toLowerCase().includes(query.toLowerCase().trim())).map(item =>
        <Link key={item.href} href={item.href} className={pathname === item.href ? styles.active : undefined}>{item.label}</Link>
      )}</nav>
    </aside>
    <div className={styles.content}>{children}</div>
  </div> : children}</ErrorBoundary>;
}
