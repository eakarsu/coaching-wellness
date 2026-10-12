'use client';

import AIResponseReport from "../../components/AIResponseReport";
import { useState } from 'react';

type Tab = 'smartGoal' | 'planDiff' | 'adherencePrediction';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'smartGoal', label: 'SMART Goal Generator', icon: '🎯' },
  { id: 'planDiff', label: 'Plan Diff & Tweaks', icon: '🔀' },
  { id: 'adherencePrediction', label: 'Adherence Predictor', icon: '📊' },
];

export const PRESETS: Record<Tab, { label: string; name: string; goals: string; conditions: string; planA?: string; planB?: string; history?: string }[]> = {
  smartGoal: [
    { label: 'Walking routine', name: 'Alex Rivera (fictional)', goals: 'Build a consistent walking routine: three 30-minute walks weekly over eight weeks.', conditions: 'No health conditions supplied; confirm any movement restrictions.' },
    { label: 'Sleep consistency', name: 'Jordan Lee (fictional)', goals: 'Establish a consistent sleep schedule and track bedtime on five nights each week.', conditions: 'Reports occasional fatigue; no diagnosis supplied.' },
    { label: 'Strength habit', name: 'Morgan Chen (fictional)', goals: 'Complete two introductory strength sessions weekly for six weeks.', conditions: 'Past knee discomfort; ask a qualified professional about restrictions.' },
  ],
  planDiff: [
    { label: 'Walking plans', name: 'Alex Rivera (fictional)', goals: 'Improve walking consistency without increasing discomfort.', conditions: 'No clinical history supplied.', planA: 'Three 20-minute walks weekly, with a rest day between walks.', planB: 'Five 15-minute walks weekly, with flexible rest days.' },
    { label: 'Recovery plans', name: 'Jordan Lee (fictional)', goals: 'Balance activity and recovery.', conditions: 'Occasional fatigue; no diagnosis supplied.', planA: 'Two light strength sessions and two rest days per week.', planB: 'Three light strength sessions with one mobility day and two rest days.' },
    { label: 'Sleep plans', name: 'Morgan Chen (fictional)', goals: 'Maintain a steady sleep routine.', conditions: 'No health conditions supplied.', planA: 'Track bedtime and wake time daily for four weeks.', planB: 'Track bedtime on weekdays and review patterns weekly.' },
  ],
  adherencePrediction: [
    { label: 'Steady attendance', name: 'Alex Rivera (fictional)', goals: 'Attend three walking sessions weekly.', conditions: 'No health conditions supplied.', history: 'Last four weeks: 3/3, 3/3, 2/3, 3/3 sessions completed; one missed session due to travel.' },
    { label: 'Interrupted routine', name: 'Jordan Lee (fictional)', goals: 'Complete two strength sessions weekly.', conditions: 'Occasional fatigue; no diagnosis supplied.', history: 'Last four weeks: 2/2, 1/2, 0/2, 1/2 sessions completed; schedule changed during week three.' },
    { label: 'Returning client', name: 'Morgan Chen (fictional)', goals: 'Resume short walks four days weekly.', conditions: 'Past knee discomfort; restrictions need confirmation.', history: 'Last four weeks: 0/4, 1/4, 2/4, 2/4 walks completed; client reports gradual return.' },
  ],
};

export default function AIInsightsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('smartGoal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [response, setResponse] = useState<unknown>(null);

  // shared inputs
  const [clientName, setClientName] = useState('');
  const [clientGoals, setClientGoals] = useState('');
  const [clientHealthConditions, setClientHealthConditions] = useState('');

  // planDiff inputs
  const [planA, setPlanA] = useState('');
  const [planB, setPlanB] = useState('');

  // adherencePrediction inputs
  const [history, setHistory] = useState('');

  const run = async () => {
    setError('');
    setLoading(true);
    setResponse(null);
    const ctx: Record<string, string> = {};
    if (clientName.trim()) ctx.clientName = clientName.trim();
    if (clientGoals.trim()) ctx.clientGoals = clientGoals.trim();
    if (clientHealthConditions.trim()) ctx.clientHealthConditions = clientHealthConditions.trim();
    if (activeTab === 'planDiff') {
      ctx.planA = planA.trim();
      ctx.planB = planB.trim();
    }
    if (activeTab === 'adherencePrediction') {
      ctx.history = history.trim();
    }

    try {
      // Optional bearer header — coaching-wellness stores user in localStorage as 'user'
      // (no JWT yet); fall through gracefully.
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (stored) headers['Authorization'] = `Bearer ${stored}`;
      } catch {}

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ type: activeTab, context: ctx }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503) {
          setError(data.error || 'AI provider not configured (503).');
        } else {
          setError(data.error || `Request failed (${res.status})`);
        }
      } else {
        setResponse(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 text-gray-100">
      <h1 className="text-3xl font-bold mb-2">🧠 AI Insights</h1>
      <p className="text-gray-400 mb-6">
        SMART goal generation, plan diff, and adherence prediction for your wellness clients.
      </p>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-700">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTab(t.id);
              setResponse(null);
              setError('');
            }}
            className={`px-4 py-2 rounded-t-md text-sm flex items-center gap-1 ${
              activeTab === t.id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4 md:p-6 mb-6 space-y-4">
        <div aria-label="Example requests" className="space-y-2">
          <p className="text-sm text-gray-300">Fill all fields with a fictional example. Review before running AI.</p>
          <div className="flex flex-wrap gap-2">{PRESETS[activeTab].map(preset => <button key={preset.label} type="button" disabled={loading} onClick={() => {
            setClientName(preset.name); setClientGoals(preset.goals); setClientHealthConditions(preset.conditions);
            if (activeTab === 'planDiff') { setPlanA(preset.planA || ''); setPlanB(preset.planB || ''); }
            if (activeTab === 'adherencePrediction') setHistory(preset.history || '');
          }} className="rounded border border-gray-600 px-3 py-2 text-sm text-gray-100 disabled:opacity-50">{preset.label}</button>)}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Client name (optional)</label>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-100"
              placeholder="e.g., Alex Johnson"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Goals (optional)</label>
            <input
              value={clientGoals}
              onChange={(e) => setClientGoals(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-100"
              placeholder="e.g., lose 10 lbs, improve sleep"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Health conditions (optional)</label>
            <input
              value={clientHealthConditions}
              onChange={(e) => setClientHealthConditions(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-100"
              placeholder="e.g., mild hypertension"
            />
          </div>
        </div>

        {activeTab === 'planDiff' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Plan A</label>
              <textarea
                value={planA}
                onChange={(e) => setPlanA(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-100"
                placeholder="Describe plan A (workouts, meals, sleep cadence...)"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Plan B</label>
              <textarea
                value={planB}
                onChange={(e) => setPlanB(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-100"
                placeholder="Describe plan B"
              />
            </div>
          </div>
        )}

        {activeTab === 'adherencePrediction' && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">Recent history</label>
            <textarea
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-100"
              placeholder="Sessions completed last 4 weeks, notes, missed appointments..."
            />
          </div>
        )}

        <button
          onClick={run}
          disabled={loading}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded text-sm font-medium"
        >
          {loading ? 'Running...' : 'Run AI'}
        </button>

        {error && (
          <div className="mt-2 p-3 rounded bg-red-900/30 border border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}
      </div>

      {response !== null && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-3">Result</h2>
          <AIResponseReport value={response}/>
        </div>
      )}
    </div>
  );
}
