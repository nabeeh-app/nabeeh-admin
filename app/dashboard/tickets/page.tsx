'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StatusBadge, getStatusVariant, getPriorityVariant } from '@/components/StatusBadge';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
}

const STATUS_TABS = ['all', 'open', 'in_progress', 'resolved', 'closed'] as const;

const STATUS_LABELS: Record<string, string> = {
  all: 'All',
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  const loadTickets = useCallback(async () => {
    const res = await fetch(`/api/admin/tickets?status=${filterStatus}`);
    const json = await res.json();
    setTickets(json.success ? json.data : []);
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-ink font-display mb-6">Support Tickets</h1>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => { setFilterStatus(s); setLoading(true); }}
            className={`px-4 py-2 text-sm font-mono uppercase tracking-wider transition-colors ${
              filterStatus === s
                ? 'bg-accent text-ink font-medium'
                : 'bg-surface-cool text-ink/60 hover:text-ink hover:bg-surface-sage'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner message="Loading tickets..." />
      ) : (
        <div className="bg-canvas border border-ink/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10">
              <tr>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Subject</th>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Status</th>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Priority</th>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Created</th>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-surface-sage/50 transition-colors">
                  <td className="px-4 py-3 font-medium font-body">{t.subject}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={STATUS_LABELS[t.status] || t.status} variant={getStatusVariant(t.status)} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge label={t.priority} variant={getPriorityVariant(t.priority)} />
                  </td>
                  <td className="px-4 py-3 text-ink/60 font-body">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/tickets/${t.id}`} className="text-primary hover:text-primary/80 text-xs font-mono uppercase tracking-wider font-medium">View</Link>
                  </td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-ink/40 font-body">No tickets</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
