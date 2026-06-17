import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, logAdminAction } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

const updateTicketSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['in_progress', 'resolved', 'closed']),
});

export async function GET(request: Request) {
  await requireAdmin(request);
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const id = searchParams.get('id');

  if (id) {
    const { data } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .single();
    return NextResponse.json({ success: true, data });
  }

  let query = supabaseAdmin.from('support_tickets').select('*');
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  const { data } = await query.order('created_at', { ascending: false });
  return NextResponse.json({ success: true, data: data || [] });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request, { requireModify: true });
  const body = await request.json();
  const parsed = updateTicketSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues[0].message, code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const { id, status } = parsed.data;

  const { error } = await supabaseAdmin
    .from('support_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction(admin.id, 'update_ticket', 'support_ticket', id, { status });

  return NextResponse.json({ success: true });
}
