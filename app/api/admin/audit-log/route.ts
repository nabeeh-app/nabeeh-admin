import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  await requireAdmin(request);
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const action = searchParams.get('action');
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from('admin_audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (action) {
    query = query.eq('action', action);
  }

  const { data, count } = await query;

  return NextResponse.json({
    success: true,
    data: data || [],
    pagination: { page, limit, total: count || 0 },
  });
}
