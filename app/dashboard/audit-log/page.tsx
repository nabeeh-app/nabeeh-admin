'use client';

import { useEffect, useState, useCallback } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface AuditEntry {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const limit = 50;

  const loadEntries = useCallback(async (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(limit) });
    if (filterAction) params.set('action', filterAction);
    const res = await fetch(`/api/admin/audit-log?${params}`);
    const json = await res.json();
    const data = json.success ? json.data : [];
    setEntries(data);
    setHasMore(data.length === limit);
    setLoading(false);
  }, [filterAction]);

  useEffect(() => {
    setPage(1);
    loadEntries(1);
  }, [loadEntries]);

  const uniqueActions = [...new Set(entries.map((e) => e.action))];

  return (
    <div>
      <h1 className="text-3xl font-bold text-ink font-display mb-6">Audit Log</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="h-10 px-3 border border-ink bg-canvas font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">All Actions</option>
          {[...uniqueActions].sort().map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading audit log..." />
      ) : (
        <>
          <div className="bg-canvas border border-ink/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-ink/10">
                <tr>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Time</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Admin</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Action</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Entity</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Details</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-surface-sage/50 transition-colors">
                    <td className="px-4 py-3 text-ink/60 font-body text-xs">
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{e.admin_id.slice(0, 8)}...</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 text-xs font-mono uppercase tracking-wider bg-surface-sage text-ink/80">
                        {e.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-body text-xs">
                      {e.entity_type && (
                        <span className="text-ink/60">{e.entity_type}</span>
                      )}
                      {e.entity_id && (
                        <span className="text-ink/40 ms-1">({e.entity_id.slice(0, 8)}...)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink/40 max-w-xs truncate">
                      {e.metadata ? JSON.stringify(e.metadata) : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink/40">{e.ip_address || '—'}</td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-ink/40 font-body">No audit entries</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => { setPage((p) => Math.max(1, p - 1)); }}
              disabled={page <= 1}
              className="px-4 py-2 text-xs font-mono uppercase tracking-wider bg-surface-cool text-ink/60 hover:bg-surface-sage disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm font-body text-ink/60">Page {page}</span>
            <button
              onClick={() => { setPage((p) => p + 1); }}
              disabled={!hasMore}
              className="px-4 py-2 text-xs font-mono uppercase tracking-wider bg-surface-cool text-ink/60 hover:bg-surface-sage disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
