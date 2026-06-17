'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StatusBadge, getStatusVariant } from '@/components/StatusBadge';
import { SubscriptionManager } from '@/components/SubscriptionManager';

interface TeacherDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  subscription: { id: string; tier: string; status: string; expires_at: string | null; trial_ends_at: string | null; cancelled_at: string | null } | null;
  students_count: number;
  groups_count: number;
  offerings_count: number;
  payments: { id: string; amount: number; currency: string; method: string; status: string; created_at: string }[];
}

export default function TeacherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTeacher = useCallback(async () => {
    const res = await fetch(`/api/admin/teachers?id=${teacherId}`);
    const json = await res.json();
    setTeacher(json.success ? json.data : null);
    setLoading(false);
  }, [teacherId]);

  useEffect(() => {
    loadTeacher();
  }, [loadTeacher]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!teacher) return <div className="text-destructive font-body">Teacher not found</div>;

  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length >= 2) return words[0].charAt(0) + words[1].charAt(0);
    return words[0]?.charAt(0) || 'T';
  };

  return (
    <div className="space-y-6">
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

      <div className="flex items-center gap-4">
        <div className="h-14 w-14 flex items-center justify-center bg-surface-sage text-primary text-xl font-display">
          {getInitials(teacher.name)}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-ink font-display">{teacher.name}</h1>
          <p className="text-ink/60 font-body">{teacher.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Students', value: teacher.students_count, bg: 'bg-surface-sage' },
          { label: 'Groups', value: teacher.groups_count, bg: 'bg-surface-cool' },
          { label: 'Offerings', value: teacher.offerings_count, bg: 'bg-surface-cool' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} p-4`}>
            <p className="text-2xl font-bold font-display">{stat.value}</p>
            <p className="text-sm text-ink/60 font-mono uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Subscription Management */}
      <SubscriptionManager
        subscription={teacher.subscription}
        teacherId={teacher.id}
        onUpdate={loadTeacher}
      />

      {/* Payments */}
      <div className="border border-ink/10 overflow-hidden">
        <div className="p-4 border-b border-ink/10">
          <h2 className="font-semibold text-ink font-display">Recent Payments</h2>
        </div>
        {teacher.payments.length === 0 ? (
          <p className="p-4 text-ink/40 text-sm font-body">No payments</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10">
              <tr>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Amount</th>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Method</th>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Status</th>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {teacher.payments.map((p) => (
                <tr key={p.id} className="hover:bg-surface-sage/50 transition-colors">
                  <td className="px-4 py-3 font-body">{p.amount} {p.currency}</td>
                  <td className="px-4 py-3 font-body">{p.method.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={p.status} variant={getStatusVariant(p.status)} />
                  </td>
                  <td className="px-4 py-3 text-ink/60 font-body">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
