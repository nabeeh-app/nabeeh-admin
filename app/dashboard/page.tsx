'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, UserCheck, Clock, UserX, GraduationCap, Banknote, AlertCircle, Bot } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Metrics {
  totalTeachers: number;
  activeTeachers: number;
  trialTeachers: number;
  expiredTeachers: number;
  totalStudents: number;
  mrr: number;
  pendingPayments: number;
  aiTokensMonth: number;
  tierDistribution: Record<string, number>;
  monthlySignups: { month: string; count: number }[];
}

const STAT_CONFIG = [
  { key: 'totalTeachers' as const, label: 'Total Teachers', icon: Users, bg: 'var(--surface-sage)', iconColor: 'var(--primary)' },
  { key: 'activeTeachers' as const, label: 'Active Subscriptions', icon: UserCheck, bg: 'var(--surface-sage)', iconColor: 'var(--success)' },
  { key: 'trialTeachers' as const, label: 'Trial Users', icon: Clock, bg: 'var(--surface-cool)', iconColor: 'var(--warning)' },
  { key: 'expiredTeachers' as const, label: 'Expired / Cancelled', icon: UserX, bg: 'rgba(197,48,48,0.1)', iconColor: 'var(--destructive)' },
  { key: 'totalStudents' as const, label: 'Total Students', icon: GraduationCap, bg: 'var(--surface-sage)', iconColor: 'var(--primary)' },
  { key: 'mrr' as const, label: 'MRR (EGP)', icon: Banknote, bg: 'var(--surface-cool)', iconColor: 'color-mix(in srgb, var(--ink) 70%, transparent)' },
  { key: 'pendingPayments' as const, label: 'Pending Payments', icon: AlertCircle, bg: 'var(--surface-cool)', iconColor: 'var(--warning)' },
  { key: 'aiTokensMonth' as const, label: 'AI Tokens (Month)', icon: Bot, bg: 'var(--surface-sage)', iconColor: 'var(--primary)' },
];

const PIE_COLORS: Record<string, string> = {
  free: '#e8eced',
  basic: '#026370',
  pro: '#05c4b8',
  center: '#e5ff97',
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    const res = await fetch('/api/admin/metrics');
    const json = await res.json();
    setMetrics(json.success ? json.data : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  if (loading) {
    return <LoadingSpinner message="Loading metrics..." />;
  }

  if (!metrics) {
    return <div className="font-body" style={{ color: 'var(--destructive)' }}>Failed to load metrics</div>;
  }

  const pieData = Object.entries(metrics.tierDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-display" style={{ color: 'var(--ink)' }}>Platform Overview</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CONFIG.map((stat) => {
          const Icon = stat.icon;
          const value = metrics[stat.key];
          const displayValue = typeof value === 'number' && (stat.key === 'mrr' || stat.key === 'aiTokensMonth')
            ? value.toLocaleString()
            : value;
          return (
            <div key={stat.key} className="p-4" style={{ backgroundColor: stat.bg }}>
              <div className="flex items-center space-x-2">
                <Icon className="h-8 w-8" style={{ color: stat.iconColor }} />
                <div>
                  <p className="text-2xl font-bold font-display" style={{ color: 'var(--ink)' }}>{displayValue}</p>
                  <p className="text-sm font-mono uppercase tracking-wider" style={{ color: 'color-mix(in srgb, var(--ink) 60%, transparent)' }}>{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tier Distribution Pie Chart */}
        <div className="border border-ink/10 p-6">
          <h2 className="font-semibold text-ink font-display mb-4">Tier Distribution</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name.toLowerCase()] || '#083d44'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-ink/30 font-body">No data</div>
          )}
        </div>

        {/* Monthly Signups Bar Chart */}
        <div className="border border-ink/10 p-6">
          <h2 className="font-semibold text-ink font-display mb-4">New Teachers (Last 6 Months)</h2>
          {metrics.monthlySignups.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metrics.monthlySignups}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#083d44', fontFamily: 'DM Mono' }}
                  tickFormatter={(v: string) => v.split('-')[1]}
                />
                <YAxis tick={{ fontSize: 11, fill: '#083d44', fontFamily: 'DM Mono' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fcfcf8', border: '1px solid #083d44', fontFamily: 'Thmanyah Sans' }}
                  labelFormatter={(v) => `Month ${v}`}
                />
                <Bar dataKey="count" fill="#026370" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-ink/30 font-body">No data</div>
          )}
        </div>
      </div>
    </div>
  );
}
