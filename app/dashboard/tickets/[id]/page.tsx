'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StatusBadge, getStatusVariant, getPriorityVariant } from '@/components/StatusBadge';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadTicket = useCallback(async () => {
    const res = await fetch(`/api/admin/tickets?id=${ticketId}`);
    const json = await res.json();
    setTicket(json.success ? json.data : null);
    setLoading(false);
  }, [ticketId]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  async function updateStatus(status: string) {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticketId, status }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.message || 'Failed to update ticket');
      }
      await loadTicket();
    } catch {
      alert('Network error — please try again');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!ticket) return <div className="text-destructive font-body">Ticket not found</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-ink/60 hover:text-ink text-sm font-mono uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-2">
          <StatusBadge label={STATUS_LABELS[ticket.status] || ticket.status} variant={getStatusVariant(ticket.status)} />
          <StatusBadge label={ticket.priority} variant={getPriorityVariant(ticket.priority)} />
        </div>
        <h1 className="text-3xl font-bold text-ink font-display">{ticket.subject}</h1>
        <p className="text-sm text-ink/40 font-mono uppercase tracking-wider mt-1">
          Created {new Date(ticket.created_at).toLocaleString()}
        </p>
      </div>

      {/* Description */}
      <div className="border border-ink/10 p-6">
        <p className="text-ink font-body whitespace-pre-wrap">{ticket.description}</p>
      </div>

      {/* Actions */}
      <div className="border border-ink/10 p-6">
        <h2 className="font-semibold text-ink font-display mb-4">Actions</h2>
        <div className="flex gap-2">
          {ticket.status === 'open' && (
            <button
              onClick={() => updateStatus('in_progress')}
              disabled={actionLoading}
              className="px-4 py-2 bg-accent text-ink font-body font-medium uppercase tracking-wider hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Saving...' : 'Start Working'}
            </button>
          )}
          {ticket.status === 'in_progress' && (
            <button
              onClick={() => updateStatus('resolved')}
              disabled={actionLoading}
              className="px-4 py-2 bg-success text-white font-body font-medium uppercase tracking-wider hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Saving...' : 'Resolve'}
            </button>
          )}
          {ticket.status === 'resolved' && (
            <button
              onClick={() => updateStatus('closed')}
              disabled={actionLoading}
              className="px-4 py-2 bg-surface-cool text-ink font-body font-medium uppercase tracking-wider hover:bg-surface-sage transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Saving...' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
