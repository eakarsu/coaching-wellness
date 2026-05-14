'use client';

import { useState } from 'react';

type Tab = 'smartGoal' | 'planDiff' | 'adherencePrediction';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'smartGoal', label: 'SMART Goal Generator', icon: '🎯' },
  { id: 'planDiff', label: 'Plan Diff & Tweaks', icon: '🔀' },
  { id: 'adherencePrediction', label: 'Adherence Predictor', icon: '📊' },
];

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
          <pre className="bg-gray-900 border border-gray-700 rounded p-3 text-xs overflow-auto max-h-[600px] whitespace-pre-wrap text-gray-200">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
