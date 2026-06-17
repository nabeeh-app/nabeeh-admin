import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

const TIER_PRICES: Record<string, number> = { free: 0, basic: 99, pro: 249, center: 599 };

export async function GET(request: Request) {
  await requireAdmin(request);
  const [teachers, subscriptions, students, payments, aiUsage] = await Promise.all([
    supabaseAdmin.from('teachers').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('subscriptions').select('teacher_id, tier, status, created_at'),
    supabaseAdmin.from('students').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('payments').select('status, amount'),
    supabaseAdmin.from('ai_usage_log').select('tokens_used, created_at'),
  ]);

  const subs = subscriptions.data || [];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const mrr = subs
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + (TIER_PRICES[s.tier] || 0), 0);

  const aiTokensMonth = (aiUsage.data || [])
    .filter((u) => u.created_at >= monthStart)
    .reduce((sum, u) => sum + u.tokens_used, 0);

  // Tier distribution for pie chart
  const tierDistribution = subs.reduce((acc, s) => {
    acc[s.tier] = (acc[s.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Add free tier teachers (those without subscriptions)
  const teachersWithSub = new Set(subs.map((s) => s.teacher_id));
  const totalTeachers = teachers.count || 0;
  const freeCount = totalTeachers - teachersWithSub.size;
  if (freeCount > 0) {
    tierDistribution['free'] = (tierDistribution['free'] || 0) + freeCount;
  }

  // New teachers per month (last 6 months) for line chart
  const monthlySignups: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlySignups[key] = 0;
  }
  // Count from actual data (using created_at from subscriptions as proxy)
  subs.forEach((s) => {
    const d = new Date(s.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (key in monthlySignups) monthlySignups[key]++;
  });

  return NextResponse.json({
    success: true,
    data: {
      totalTeachers: totalTeachers,
      activeTeachers: subs.filter((s) => s.status === 'active').length,
      trialTeachers: subs.filter((s) => s.status === 'trial').length,
      expiredTeachers: subs.filter((s) => s.status === 'expired' || s.status === 'cancelled').length,
      totalStudents: students.count || 0,
      mrr,
      pendingPayments: (payments.data || []).filter((p) => p.status === 'pending').length,
      aiTokensMonth,
      tierDistribution,
      monthlySignups: Object.entries(monthlySignups).map(([month, count]) => ({ month, count })),
    },
  });
}
