'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { StatusBadge, getStatusVariant } from '@/components/StatusBadge';

interface Subscription {
  id: string;
  tier: string;
  status: string;
  expires_at: string | null;
  trial_ends_at: string | null;
  cancelled_at: string | null;
}

interface Props {
  subscription: Subscription | null;
  teacherId: string;
  onUpdate: () => void;
}

const TIERS = [
  { value: 'free', label: 'Free', limits: '30 students, 3 groups' },
  { value: 'basic', label: 'Basic (EGP 99/mo)', limits: '100 students, 10 groups' },
  { value: 'pro', label: 'Pro (EGP 249/mo)', limits: '300 students, 30 groups' },
  { value: 'center', label: 'Center (EGP 599/mo)', limits: '1000 students, 100 groups' },
] as const;

export function SubscriptionManager({ subscription, teacherId, onUpdate }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function executeAction(action: string, params: Record<string, unknown> = {}) {
    setLoading(action);
    setError('');
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: teacherId, action, ...params }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || 'Failed to update subscription');
      } else {
        onUpdate();
        setExpanded(false);
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="border border-ink/10">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-sage/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <h2 className="font-semibold text-ink font-display">Subscription</h2>
        {expanded ? <ChevronUp className="w-4 h-4 text-ink/40" /> : <ChevronDown className="w-4 h-4 text-ink/40" />}
      </div>

      {/* Current state */}
      <div className="px-4 pb-4 text-sm font-body space-y-2">
        <div className="flex flex-wrap gap-4">
          <span>Tier: <strong className="font-mono uppercase tracking-wider">{subscription?.tier || 'free'}</strong></span>
          <span>Status: <StatusBadge label={subscription?.status || 'active'} variant={getStatusVariant(subscription?.status || 'active')} /></span>
          {subscription?.expires_at && (
            <span>Expires: {new Date(subscription.expires_at).toLocaleDateString()}</span>
          )}
          {subscription?.trial_ends_at && (
            <span>Trial ends: {new Date(subscription.trial_ends_at).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div className="border-t border-ink/10 p-4 space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 font-body">{error}</div>
          )}

          {/* Change tier */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink/60 mb-2">Change Tier</label>
            <div className="grid grid-cols-2 gap-2">
              {TIERS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => executeAction('change_tier', { tier: t.value })}
                  disabled={loading === 'change_tier' || subscription?.tier === t.value}
                  className={`text-left p-3 border text-sm font-body transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    subscription?.tier === t.value
                      ? 'border-primary bg-primary/5'
                      : 'border-ink/10 hover:border-ink/30 hover:bg-surface-sage/30'
                  }`}
                >
                  <div className="font-medium">{t.label}</div>
                  <div className="text-xs text-ink/50 mt-1">{t.limits}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => executeAction('extend_trial', { days: 14 })}
              disabled={loading === 'extend_trial'}
              className="px-4 py-2 text-xs font-mono uppercase tracking-wider border border-ink/20 hover:border-ink/40 hover:bg-surface-sage/30 transition-colors disabled:opacity-40"
            >
              {loading === 'extend_trial' ? 'Saving...' : 'Extend Trial +14d'}
            </button>
            <button
              onClick={() => executeAction('suspend')}
              disabled={loading === 'suspend' || subscription?.status === 'suspended'}
              className="px-4 py-2 text-xs font-mono uppercase tracking-wider border border-warning/40 text-warning hover:bg-warning/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading === 'suspend' ? 'Saving...' : 'Suspend'}
            </button>
            <button
              onClick={() => executeAction('cancel')}
              disabled={loading === 'cancel' || subscription?.status === 'cancelled'}
              className="px-4 py-2 text-xs font-mono uppercase tracking-wider border border-destructive/40 text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading === 'cancel' ? 'Saving...' : 'Cancel'}
            </button>
            {(subscription?.status === 'cancelled' || subscription?.status === 'suspended') && (
              <button
                onClick={() => executeAction('reactivate')}
                disabled={loading === 'reactivate'}
                className="px-4 py-2 text-xs font-mono uppercase tracking-wider border border-success/40 text-success hover:bg-success/5 transition-colors disabled:opacity-40"
              >
                {loading === 'reactivate' ? 'Saving...' : 'Reactivate'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
