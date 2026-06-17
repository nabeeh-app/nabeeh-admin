import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  await requireAdmin(request);
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'month';

  const now = new Date();
  let since: Date;
  if (period === 'day') since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  else if (period === 'week') since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  else since = new Date(now.getFullYear(), now.getMonth(), 1);

  const { data: logs } = await supabaseAdmin
    .from('ai_usage_log')
    .select('*')
    .gte('created_at', since.toISOString());

  const { data: teachers } = await supabaseAdmin
    .from('teachers')
    .select('id, name');

  const teacherMap = new Map((teachers || []).map((t) => [t.id, t.name]));
  const grouped = new Map<string, { teacher_id: string; teacher_name: string; total_tokens: number; feature_breakdown: Record<string, number> }>();

  (logs || []).forEach((log) => {
    if (!grouped.has(log.teacher_id)) {
      grouped.set(log.teacher_id, {
        teacher_id: log.teacher_id,
        teacher_name: teacherMap.get(log.teacher_id) || 'Unknown',
        total_tokens: 0,
        feature_breakdown: {},
      });
    }
    const row = grouped.get(log.teacher_id)!;
    row.total_tokens += log.tokens_used;
    row.feature_breakdown[log.feature] = (row.feature_breakdown[log.feature] || 0) + log.tokens_used;
  });

  return NextResponse.json({ success: true, data: Array.from(grouped.values()).sort((a, b) => b.total_tokens - a.total_tokens) });
}
