'use client';

/**
 * Apply pass 7 — UI for /api/coach-match (deterministic coach-client matcher).
 *
 * The endpoint was added in apply pass 5 but had no frontend wiring; this page
 * fills that gap. Lets a user supply goals/conditions/client_id and view
 * top-N coach candidates with score breakdown.
 */

import { useState } from 'react';

type Candidate = {
  coach_id: string;
  firstName?: string;
  lastName?: string;
  specialties?: string;
  client_count?: number;
  score: number;
  breakdown: {
    goal_overlap: number;
    specialty_overlap: number;
    load_score: number;
    recency_score: number;
  };
};

type MatchResponse = {
  client_tokens: string[];
  candidates: Candidate[];
  weighting: { goal: number; specialty: number; load: number; recency: number };
  note: string;
};

export default function CoachMatchPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [response, setResponse] = useState<MatchResponse | null>(null);

  const [clientId, setClientId] = useState('');
  const [goals, setGoals] = useState('');
  const [conditions, setConditions] = useState('');
  const [top, setTop] = useState<number>(5);

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
      const url = `/api/coach-match?top=${encodeURIComponent(String(top))}`;
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          client_id: clientId.trim() || undefined,
          goals: goals.trim() || undefined,
          conditions: conditions.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`);
      } else {
        setResponse(data as MatchResponse);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 text-gray-100">
      <h1 className="text-3xl font-bold mb-2">🤝 Coach-Client Matcher</h1>
      <p className="text-gray-400 mb-6">
        Ranks coaches by goal overlap, specialty overlap, current client load, and recency.
      </p>

      <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4 md:p-6 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Client ID (optional — auto-loads goals/conditions)</label>
            <input
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-100"
              placeholder="e.g., a uuid from /clients"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Top N (1-20)</label>
            <input
              type="number"
              min={1}
              max={20}
              value={top}
              onChange={(e) => setTop(Math.max(1, Math.min(20, parseInt(e.target.value || '5', 10))))}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Goals (optional — overrides client lookup)</label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-100"
              placeholder="e.g., marathon training, stress reduction, plant-based nutrition"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Conditions (optional)</label>
            <textarea
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-100"
              placeholder="e.g., mild hypertension, IBS"
            />
          </div>
        </div>

        <button
          onClick={run}
          disabled={loading}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded text-sm font-medium"
        >
          {loading ? 'Matching...' : 'Find Coaches'}
        </button>

        {error && (
          <div className="mt-2 p-3 rounded bg-red-900/30 border border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}
      </div>

      {response && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4 md:p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Top Matches</h2>
            <div className="text-xs text-gray-400 mb-3">
              Tokens used: {response.client_tokens.length ? response.client_tokens.join(', ') : '(none)'}
              <span className="mx-2">·</span>
              Weights: goal {response.weighting.goal} · specialty {response.weighting.specialty} · load{' '}
              {response.weighting.load} · recency {response.weighting.recency}
            </div>
            {response.candidates.length === 0 ? (
              <div className="text-sm text-gray-500 italic">
                No coaches in database. Add coaches via /admin or seed data.
              </div>
            ) : (
              <div className="space-y-2">
                {response.candidates.map((c, i) => (
                  <div
                    key={c.coach_id || i}
                    className="border border-gray-700 rounded p-3 bg-gray-900/60 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                  >
                    <div>
                      <div className="font-medium text-gray-100">
                        #{i + 1} — {c.firstName || ''} {c.lastName || ''}{' '}
                        <span className="text-gray-500 text-xs">({c.coach_id})</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Specialties: {c.specialties || '(none)'}
                        <span className="mx-2">·</span>
                        Clients: {c.client_count ?? 0}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        goal {c.breakdown.goal_overlap} · specialty {c.breakdown.specialty_overlap} · load{' '}
                        {c.breakdown.load_score} · recency {c.breakdown.recency_score}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-indigo-400">{c.score.toFixed(3)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer hover:text-gray-300">Raw JSON</summary>
            <pre className="mt-2 bg-gray-900 border border-gray-700 rounded p-3 overflow-auto max-h-[400px] whitespace-pre-wrap text-gray-300">
              {JSON.stringify(response, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
