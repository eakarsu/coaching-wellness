"use client";

import { useEffect, useState } from 'react';

type Data = {
  summary: Record<string, number>;
  clients: Array<{ name: string; readiness: number; signal: string; action: string }>;
  rules: Array<{ rule: string; response: string }>;
};

export default function RecoveryReadinessPage() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetch('/api/recovery-readiness')
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return <div className="max-w-5xl mx-auto p-6 text-gray-100">Loading recovery readiness...</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 text-gray-100">
      <h1 className="text-3xl font-bold mb-2">Recovery Readiness</h1>
      <p className="text-gray-400 mb-6">Use sleep, soreness, hydration, and wearable signals to adjust coaching plans.</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(data.summary).map(([key, value]) => (
          <div key={key} className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
            <div className="text-2xl font-semibold text-indigo-300">{value}</div>
            <div className="text-sm text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-gray-800/60 border border-gray-700 rounded-lg p-5">
          <h2 className="font-semibold mb-3">Client Queue</h2>
          {data.clients.map((client) => (
            <div key={client.name} className="border-t border-gray-700 py-3">
              <div className="font-medium">{client.name} - {client.readiness}/100</div>
              <div className="text-sm text-gray-400">{client.signal}</div>
              <div className="text-sm text-indigo-300">{client.action}</div>
            </div>
          ))}
        </section>
        <section className="bg-gray-800/60 border border-gray-700 rounded-lg p-5">
          <h2 className="font-semibold mb-3">Adjustment Rules</h2>
          {data.rules.map((rule) => (
            <div key={rule.rule} className="border-t border-gray-700 py-3">
              <div className="font-medium">{rule.rule}</div>
              <div className="text-sm text-gray-400">{rule.response}</div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
