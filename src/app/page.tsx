'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Session = { subject: string; tenantId: string; role: 'member' | 'coach' | 'operator'; name: string };
type Item = Record<string, unknown> & { id: string; enrollment_id?: string; state?: string; status?: string };
type Workspace = {
  enrollments: Item[]; plans: Item[]; goals: Item[]; checkIns: Item[]; alerts: Item[];
  adjustments: Item[]; observations: Item[]; appointments: Item[]; jobs: Item[]; safetyBoundary: string;
};
type Coach = { coach_subject: string; specialties: string[]; capacity: number; active_enrollments: number };
const empty: Workspace = { enrollments: [], plans: [], goals: [], checkIns: [], alerts: [], adjustments: [], observations: [], appointments: [], jobs: [], safetyBoundary: '' };

function value(form: FormData, name: string) { return String(form.get(name) || '').trim(); }
function Status({ children }: { children: unknown }) { const text = String(children || 'unknown'); return <span className={`status status-${text.toLowerCase().replaceAll('_', '-')}`}>{text.replaceAll('_', ' ')}</span>; }

export default function Dashboard() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [workspace, setWorkspace] = useState<Workspace>(empty);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const request = useCallback(async (path: string, init?: RequestInit) => {
    const response = await fetch(`/api/v1/wellness/${path}`, { ...init, headers: { ...(init?.body ? { 'content-type': 'application/json' } : {}), ...(init?.headers || {}) }, cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) { router.replace('/login'); throw new Error('Your session has expired.'); }
    if (!response.ok) throw new Error(data.error || 'The operation could not be completed.');
    return data;
  }, [router]);

  const load = useCallback(async () => {
    try {
      const [identity, work, available] = await Promise.all([request('session'), request('workspace'), request('coaches')]);
      setSession(identity.user); setWorkspace(work); setCoaches(available.coaches);
    } catch (error) { setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Unable to load the workspace.' }); }
    finally { setBusy(false); }
  }, [request]);

  useEffect(() => { void load(); }, [load]);
  const post = async (path: string, body: unknown, message: string) => {
    setNotice(null);
    try { await request(path, { method: 'POST', body: JSON.stringify(body) }); setNotice({ kind: 'ok', text: message }); await load(); }
    catch (error) { setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Operation failed.' }); }
  };
  const submit = (event: FormEvent<HTMLFormElement>, path: string, makeBody: (data: FormData) => unknown, message: string) => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    void post(path, makeBody(data), message).then(() => form.reset());
  };
  const selected = workspace.enrollments[0];
  const selectedId = selected?.id;
  const openAlerts = workspace.alerts.filter(a => a.status === 'OPEN');
  const pendingAdjustments = workspace.adjustments.filter(a => a.status === 'PENDING');
  const failedAppointments = workspace.appointments.filter(a => a.state === 'PROVIDER_FAILED');
  const dueJobs = workspace.jobs.filter(j => ['queued', 'retryable'].includes(String(j.status)));
  const counts = useMemo(() => [
    ['Enrollments', workspace.enrollments.length], ['Open safety alerts', openAlerts.length],
    ['Appointments', workspace.appointments.length], ['Wearable records', workspace.observations.length],
  ], [workspace, openAlerts.length]);

  if (busy) return <main className="loading-shell"><div className="spinner"/><p>Loading tenant-scoped workspace…</p></main>;
  if (!session) return <main className="loading-shell"><p>Sign-in is required.</p><a className="primary-button" href="/login">Go to SSO</a></main>;

  return <main>
    <header className="topbar">
      <div><p className="eyebrow">Wellness operations</p><h1>Coaching workspace</h1></div>
      <div className="identity"><div><strong>{session.name}</strong><span>{session.role} · tenant {session.tenantId.slice(0, 8)}</span></div><button className="quiet-button" onClick={async () => { await fetch('/api/v1/wellness/auth/logout', { method: 'POST' }); router.replace('/login'); }}>Sign out</button></div>
    </header>

    <section className="safety-banner" role="note"><strong>Safety boundary</strong><span>{workspace.safetyBoundary || 'Wellness coaching is not medical care.'} If symptoms may be life-threatening, contact local emergency services now.</span></section>
    {notice && <div className={`notice ${notice.kind}`} role="status">{notice.text}<button aria-label="Dismiss" onClick={() => setNotice(null)}>×</button></div>}

    <section className="stat-grid">{counts.map(([label, count]) => <div className="stat" key={String(label)}><span>{label}</span><strong>{count}</strong></div>)}</section>

    {workspace.enrollments.length > 0 && <section className="panel">
      <div className="panel-heading"><div><p className="eyebrow">Live care journey</p><h2>Assigned enrollments</h2></div><button className="quiet-button" onClick={() => void load()}>Refresh</button></div>
      <div className="enrollment-grid">{workspace.enrollments.map(item => <article className="enrollment" key={item.id}>
        <div><Status>{item.state}</Status><h3>{String(item.program_name)}</h3><p>{session.role === 'member' ? `Coach ${String(item.coach_subject)}` : `Member ${String(item.member_subject)}`}</p></div>
        <dl><div><dt>Consent</dt><dd>{String(item.consent_version)} · {item.consent_revoked_at ? 'revoked' : 'active'}</dd></div><div><dt>Workflow version</dt><dd>{String(item.version)}</dd></div></dl>
      </article>)}</div>
    </section>}

    {session.role === 'member' && <div className="work-grid">
      {!selected && <section className="panel accent-panel"><p className="eyebrow">Step 1</p><h2>Enroll with a coach</h2><p className="muted">Your readiness answers and explicit consent are stored with the enrollment. Payment runs as a recoverable provider job.</p>
        {coaches.length === 0 ? <p className="empty">No coach currently has a published profile and capacity.</p> : <form onSubmit={e => submit(e, 'enrollments', f => ({ coachSubject: value(f, 'coach'), programName: value(f, 'program'), priceCents: Number(value(f, 'price')), consentVersion: 'wellness-consent-v1', consentAccepted: f.get('consent') === 'on', readinessAnswers: { requiresClinicalClearance: f.get('clearance') === 'on' }, paymentMethodToken: value(f, 'payment'), idempotencyKey: crypto.randomUUID() }), 'Enrollment recorded and payment queued.')}>
          <label>Coach<select name="coach" required>{coaches.map(c => <option key={c.coach_subject} value={c.coach_subject}>{c.coach_subject} · {c.specialties.join(', ')} · {c.capacity - c.active_enrollments} spaces</option>)}</select></label>
          <label>Program<input name="program" required defaultValue="Foundations" /></label><label>Price in cents<input name="price" type="number" min="1" required defaultValue="50000" /></label><label>Payment method token<input name="payment" required autoComplete="off" /></label>
          <label className="check"><input name="clearance" type="checkbox"/> My readiness screen indicates clinical clearance is required</label><label className="check"><input name="consent" type="checkbox" required/> I consent to wellness coaching under version wellness-consent-v1</label><button className="primary-button">Enroll and queue payment</button>
        </form>}
      </section>}
      {selected?.state === 'PAYMENT_FAILED' && <section className="panel danger-panel"><h2>Payment needs attention</h2><p className="muted">The provider rejected or could not complete the charge. No plan can start until payment succeeds.</p><form onSubmit={e => submit(e, `enrollments/${selectedId}/retry`, f => ({ paymentMethodToken: value(f, 'payment') }), 'Payment retry queued.')}><label>New payment token<input name="payment" required /></label><button className="primary-button">Retry payment</button></form></section>}
      {selected && ['ACTIVE', 'SAFETY_HOLD'].includes(String(selected.state)) && <>
        <section className="panel"><p className="eyebrow">Progress evidence</p><h2>Record a check-in</h2><p className="muted">Deterministic safety rules place the plan on hold for urgent symptoms or high pain. Recommendations never auto-edit a plan.</p><form onSubmit={e => submit(e, 'check-ins', f => ({ enrollmentId: selectedId, pain: Number(value(f, 'pain')), energy: Number(value(f, 'energy')), mood: Number(value(f, 'mood')), adherence: Number(value(f, 'adherence')), chestPain: f.get('chest') === 'on', fainting: f.get('fainting') === 'on', evidence: value(f, 'evidence') }), 'Check-in recorded and safety rules evaluated.')}>
          <div className="field-row"><label>Pain (0–10)<input name="pain" type="number" min="0" max="10" required /></label><label>Energy (1–5)<input name="energy" type="number" min="1" max="5" required /></label><label>Mood (1–5)<input name="mood" type="number" min="1" max="5" required /></label><label>Adherence %<input name="adherence" type="number" min="0" max="100" required /></label></div>
          <div className="field-row"><label className="check"><input name="chest" type="checkbox"/> Chest pain</label><label className="check"><input name="fainting" type="checkbox"/> Fainting</label></div><label>Evidence / reflection<textarea name="evidence" required /></label><button className="primary-button">Evaluate and save</button>
        </form></section>
        <section className="panel"><h2>Add a measurable goal</h2><form onSubmit={e => submit(e, 'goals', f => ({ enrollmentId: selectedId, title: value(f, 'title'), metric: value(f, 'metric'), targetValue: value(f, 'target') }), 'Goal saved.')}><label>Goal<input name="title" required /></label><label>Measure<input name="metric" required placeholder="walks per week" /></label><label>Target<input name="target" required placeholder="4" /></label><button className="secondary-button">Save goal</button></form>
          <h3 className="section-break">Wearable provenance</h3><form onSubmit={e => submit(e, 'wearable/sync', f => ({ enrollmentId: selectedId, cursor: value(f, 'cursor'), idempotencyKey: crypto.randomUUID() }), 'Wearable sync queued.')}><label>Provider cursor<input name="cursor" required /></label><button className="secondary-button">Queue secure sync</button></form>
        </section>
        <section className="panel danger-panel"><h2>Consent and data processing</h2><p className="muted">Revocation is auditable, stops queued provider work, and queues any eligible refund. It cannot be undone.</p><button className="danger-button" onClick={() => { const reason = window.prompt('Document the reason for consent revocation'); if (reason && window.confirm('Revoke consent and stop this enrollment?')) void post(`enrollments/${selectedId}/revoke-consent`, { reason }, 'Consent revoked and downstream work stopped.'); }}>Revoke consent</button></section>
      </>}
    </div>}

    {session.role === 'coach' && <div className="work-grid">
      <section className="panel"><p className="eyebrow">Availability</p><h2>Coach profile</h2><form onSubmit={e => submit(e, 'coaches', f => ({ specialties: value(f, 'specialties').split(',').map(x => x.trim()).filter(Boolean), capacity: Number(value(f, 'capacity')) }), 'Coach profile published.')}><label>Specialties<input name="specialties" required placeholder="habit coaching, recovery" /></label><label>Concurrent enrollment capacity<input name="capacity" type="number" min="0" max="100" required /></label><button className="secondary-button">Publish capacity</button></form></section>
      {selected && <><section className="panel"><p className="eyebrow">Human-authored</p><h2>Create a typed plan</h2><form onSubmit={e => submit(e, 'plans', f => ({ enrollmentId: selectedId, title: value(f, 'title'), plan: { movement: value(f, 'movement'), recovery: value(f, 'recovery'), support: value(f, 'support') } }), 'Plan created.')}><label>Plan title<input name="title" required /></label><label>Movement commitment<input name="movement" required /></label><label>Recovery commitment<input name="recovery" required /></label><label>Coach support<input name="support" required /></label><button className="primary-button">Create plan</button></form></section>
      <section className="panel"><h2>Schedule a session</h2><form onSubmit={e => submit(e, 'appointments', f => ({ enrollmentId: selectedId, startsAt: new Date(value(f, 'starts')).toISOString(), endsAt: new Date(value(f, 'ends')).toISOString(), agenda: value(f, 'agenda'), idempotencyKey: crypto.randomUUID() }), 'Appointment saved and video meeting queued.')}><label>Starts<input name="starts" type="datetime-local" required /></label><label>Ends<input name="ends" type="datetime-local" required /></label><label>Agenda<input name="agenda" required /></label><button className="secondary-button">Schedule session</button></form></section></>}
      <section className="panel wide"><div className="panel-heading"><div><p className="eyebrow">Action queue</p><h2>Safety alerts</h2></div><Status>{openAlerts.length ? 'OPEN' : 'CLEAR'}</Status></div>{openAlerts.length === 0 ? <p className="empty">No open alerts.</p> : openAlerts.map(alert => <article className="action-row" key={alert.id}><div><Status>{alert.severity}</Status><strong>{String(alert.rule_code)}</strong><p>{String(alert.message)}</p></div><div className="button-row"><button className="danger-button" onClick={() => void post(`alerts/${alert.id}/acknowledge`, { disposition: alert.severity === 'CRITICAL' ? 'REFER_TO_CLINICIAN' : 'CONTACT_MEMBER', note: 'Member contacted and routed according to the documented safety procedure.' }, 'Safety disposition recorded.')}>{alert.severity === 'CRITICAL' ? 'Document clinician referral' : 'Document member contact'}</button></div></article>)}</section>
      <section className="panel wide"><h2>Plan adjustments awaiting judgment</h2>{pendingAdjustments.length === 0 ? <p className="empty">No pending deterministic suggestions.</p> : pendingAdjustments.map(item => <article className="action-row" key={item.id}><div><strong>{String(item.rule_code)}</strong><p>{String(item.recommendation)}</p></div><div className="button-row"><button className="secondary-button" onClick={() => void post(`adjustments/${item.id}/decision`, { decision: 'APPROVED', note: 'Coach reviewed this with member context.' }, 'Adjustment approved by coach.')}>Approve</button><button className="quiet-button" onClick={() => void post(`adjustments/${item.id}/decision`, { decision: 'REJECTED', note: 'Not appropriate for the current plan.' }, 'Adjustment rejected.')}>Reject</button></div></article>)}</section>
      {selected?.state === 'SAFETY_HOLD' && openAlerts.length === 0 && <section className="panel danger-panel"><h2>Safety hold review</h2><p>All alerts are acknowledged. Resume only after required referral dispositions and review.</p><button className="danger-button" onClick={() => void post(`enrollments/${selectedId}/clear-safety`, { note: 'Required dispositions are documented and coach completed the safety review.' }, 'Safety hold cleared.')}>Clear documented hold</button></section>}
      {failedAppointments.map(item => <section className="panel danger-panel" key={item.id}><h2>Video provider failed</h2><p>{new Date(String(item.starts_at)).toLocaleString()} · {String(item.agenda)}</p><button className="secondary-button" onClick={() => void post(`appointments/${item.id}/retry`, { idempotencyKey: crypto.randomUUID() }, 'Video retry queued.')}>Queue new meeting attempt</button></section>)}
    </div>}

    {session.role === 'operator' && <div className="work-grid">
      <section className="panel wide"><div className="panel-heading"><div><p className="eyebrow">Provider recovery</p><h2>Durable job queue</h2></div><Status>{dueJobs.length ? 'ATTENTION' : 'CLEAR'}</Status></div>{workspace.jobs.length === 0 ? <p className="empty">No provider jobs in this tenant.</p> : workspace.jobs.map(job => <article className="action-row" key={job.id}><div><Status>{job.status}</Status><strong>{String(job.provider)} · {String(job.operation)}</strong><p>Attempts {String(job.attempts)}{job.last_error_code ? ` · ${String(job.last_error_code)}` : ''}</p></div>{['queued', 'retryable'].includes(String(job.status)) && <button className="secondary-button" onClick={() => void post(`jobs/${job.id}/execute`, {}, 'Provider job executed.')}>Execute due job</button>}</article>)}</section>
      <section className="panel"><p className="eyebrow">Resilience evidence</p><h2>Record a restore drill</h2><form onSubmit={e => submit(e, 'restore-drills', f => ({ backupReference: value(f, 'reference'), status: value(f, 'status'), evidenceUri: value(f, 'evidence') }), 'Restore drill evidence recorded.')}><label>Backup reference<input name="reference" required placeholder="vault://wellness/backup-id" /></label><label>Result<select name="status"><option value="passed">Passed</option><option value="failed">Failed</option><option value="scheduled">Scheduled</option></select></label><label>Evidence URI<input name="evidence" type="url" /></label><button className="primary-button">Record drill</button></form></section>
    </div>}

    <section className="panel activity"><p className="eyebrow">Persistent evidence</p><h2>Recent activity</h2><div className="activity-grid"><div><strong>Goals</strong><span>{workspace.goals.length}</span></div><div><strong>Check-ins</strong><span>{workspace.checkIns.length}</span></div><div><strong>Plans</strong><span>{workspace.plans.length}</span></div><div><strong>Appointments</strong><span>{workspace.appointments.length}</span></div></div></section>
    <footer>Deterministic safety rules v1 · Audited state changes · Tenant-scoped access · Provider operations are idempotent and recoverable</footer>
  </main>;
}
