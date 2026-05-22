'use client';

/**
 * Apply pass 7 — UI for /api/joint-plan (joint nutrition + fitness plan generator).
 *
 * The endpoint was added in apply pass 5 but had no frontend wiring; this page
 * fills that gap. Matches the visual language of /ai-insights (gray-800 surfaces,
 * indigo CTA, JSON result panel).
 */

import { useState } from 'react';

export default function JointPlanPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [response, setResponse] = useState<unknown>(null);

  const [clientName, setClientName] = useState('');
  const [goals, setGoals] = useState('');
  const [healthConditions, setHealthConditions] = useState('');
  const [weeks, setWeeks] = useState<number>(8);

  const run = async () => {
    setError('');
    setLoading(true);
    setResponse(null);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (stored) headers['Authorization'] = `Bearer ${stored}`;
    } catch {}

    try {
      const res = await fetch('/api/joint-plan', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          clientName: clientName.trim() || undefined,
          goals: goals.trim() || undefined,
          healthConditions: healthConditions.trim() || undefined,
          weeks,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`);
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
      <h1 className="text-3xl font-bold mb-2">🧬 Joint Nutrition + Fitness Plan</h1>
      <p className="text-gray-400 mb-2">
        Generates an integrated multi-week plan blending fitness sessions with daily nutrition targets.
      </p>
      <p className="text-amber-400 text-xs mb-6 border border-amber-900/60 bg-amber-950/30 rounded p-2">
        Wellness guidance only — not medical advice. Consult a qualified healthcare professional before making medical decisions.
      </p>

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
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-100"
              placeholder="e.g., build lean mass, drop 5% body fat"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Health conditions (optional)</label>
            <input
              value={healthConditions}
              onChange={(e) => setHealthConditions(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-100"
              placeholder="e.g., mild hypertension, knee issue"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Horizon (weeks, 1-24)</label>
            <input
              type="number"
              min={1}
              max={24}
              value={weeks}
              onChange={(e) => setWeeks(Math.max(1, Math.min(24, parseInt(e.target.value || '8', 10))))}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-100"
            />
          </div>
        </div>

        <button
          onClick={run}
          disabled={loading}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded text-sm font-medium"
        >
          {loading ? 'Generating...' : 'Generate Joint Plan'}
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
