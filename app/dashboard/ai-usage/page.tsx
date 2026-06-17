'use client';

import { useEffect, useState, useCallback } from 'react';

import { LoadingSpinner } from '@/components/LoadingSpinner';

interface AiUsageRow {
  teacher_id: string;
  teacher_name: string;
  total_tokens: number;
  feature_breakdown: Record<string, number>;
}

const PERIOD_TABS = [
  { key: 'day' as const, label: 'Today' },
  { key: 'week' as const, label: 'This Week' },
  { key: 'month' as const, label: 'This Month' },
];

export default function AiUsagePage() {
  const [usage, setUsage] = useState<AiUsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');

  const loadUsage = useCallback(async () => {
    const res = await fetch(`/api/admin/ai-usage?period=${period}`);
    const json = await res.json();
    setUsage(json.success ? json.data : []);
    setLoading(false);
  }, [period]);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-ink font-display mb-6">AI Usage</h1>

      {/* Period tabs */}
      <div className="flex gap-2 mb-6">
        {PERIOD_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setPeriod(tab.key); setLoading(true); }}
            className={`px-4 py-2 text-sm font-mono uppercase tracking-wider transition-colors ${
              period === tab.key
                ? 'bg-accent text-ink font-medium'
                : 'bg-surface-cool text-ink/60 hover:text-ink hover:bg-surface-sage'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-canvas border border-ink/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10">
              <tr>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Teacher</th>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Total Tokens</th>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Features</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {usage.map((u) => (
                <tr key={u.teacher_id} className="hover:bg-surface-sage/50 transition-colors">
                  <td className="px-4 py-3 font-medium font-body">{u.teacher_name}</td>
                  <td className="px-4 py-3 font-body">{u.total_tokens.toLocaleString()}</td>
                  <td className="px-4 py-3 text-ink/60 text-xs">
                    {Object.entries(u.feature_breakdown).map(([f, t]) => (
                      <span key={f} className="inline-block bg-surface-cool px-2 py-0.5 mr-1 mb-1 font-mono text-xs">
                        {f}: {t.toLocaleString()}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
              {usage.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-12 text-center text-ink/40 font-body">No AI usage data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
