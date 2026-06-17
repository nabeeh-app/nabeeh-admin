'use client';

import { useEffect, useState, useCallback } from 'react';
import { Database, MessageCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface HealthStatus {
  db: { connected: boolean; teacherCount: number; studentCount: number };
  whatsapp: { status: string; phone: string | null; lastCheck: string };
  lastRefresh: string;
}

const STATUS_COLORS: Record<string, string> = {
  connected: 'text-success',
  qr_ready: 'text-accent',
  connecting: 'text-warning',
  disconnected: 'text-destructive',
  unknown: 'text-ink/40',
  unreachable: 'text-destructive',
};

export default function HealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = useCallback(async () => {
    const res = await fetch('/api/admin/health');
    const json = await res.json();
    setHealth(json.success ? json.data : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  if (loading) {
    return <LoadingSpinner message="Checking health..." />;
  }

  const waStatus = health?.whatsapp?.status || 'unknown';
  const waColor = STATUS_COLORS[waStatus] || 'text-ink/40';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-ink font-display">System Health</h1>
        <span className="text-xs text-ink/40 font-mono uppercase tracking-wider">Auto-refreshes every 30s</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Database */}
        <div className="border border-ink/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-ink" />
            <h2 className="font-semibold text-ink font-display">Database</h2>
          </div>
          <div className="space-y-3 text-sm font-body">
            <div className="flex justify-between">
              <span className="text-ink/60">Status</span>
              <span className={health?.db.connected ? 'text-success font-mono uppercase tracking-wider' : 'text-destructive font-mono uppercase tracking-wider'}>
                {health?.db.connected ? 'Connected' : 'Error'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">Teachers</span>
              <span>{health?.db.teacherCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">Students</span>
              <span>{health?.db.studentCount}</span>
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="border border-ink/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-ink" />
            <h2 className="font-semibold text-ink font-display">WhatsApp</h2>
          </div>
          <div className="space-y-3 text-sm font-body">
            <div className="flex justify-between">
              <span className="text-ink/60">Status</span>
              <span className={`${waColor} font-mono uppercase tracking-wider`}>
                {waStatus.replace('_', ' ')}
              </span>
            </div>
            {health?.whatsapp?.phone && (
              <div className="flex justify-between">
                <span className="text-ink/60">Phone</span>
                <span className="font-mono">{health.whatsapp.phone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-ink/60">Last Check</span>
              <span>{health ? new Date(health.lastRefresh).toLocaleTimeString() : '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
