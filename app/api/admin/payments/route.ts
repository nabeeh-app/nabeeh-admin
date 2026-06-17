import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, logAdminAction } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

const updatePaymentSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['verified', 'rejected', 'refunded']),
});

const createPaymentSchema = z.object({
  teacher_id: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(['vodafone_cash', 'instapay', 'paymob', 'cash', 'bank_transfer', 'other']),
  reference_number: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export async function GET(request: Request) {
  await requireAdmin(request);
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';
  const method = searchParams.get('method');
  const teacherId = searchParams.get('teacher_id');

  let query = supabaseAdmin
    .from('payments')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (method) {
    query = query.eq('method', method);
  }
  if (teacherId) {
    query = query.eq('teacher_id', teacherId);
  }

  const { data } = await query;

  return NextResponse.json({ success: true, data: data || [] });
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request, { requireModify: true });
  const formData = await request.formData();
  const body = Object.fromEntries(formData.entries());

  const parsed = createPaymentSchema.safeParse({
    ...body,
    amount: Number(body.amount),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues[0].message, code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const { teacher_id, amount, method, reference_number, notes } = parsed.data;
  let receiptUrl: string | null = null;

  // Handle receipt upload
  const receipt = formData.get('receipt') as File | null;
  if (receipt && receipt.size > 0) {
    const ext = receipt.name.split('.').pop() || 'jpg';
    const filePath = `payments/receipts/${teacher_id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('payments')
      .upload(filePath, receipt, { contentType: receipt.type });

    if (uploadError) {
      return NextResponse.json(
        { success: false, message: 'Failed to upload receipt: ' + uploadError.message },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage.from('payments').getPublicUrl(filePath);
    receiptUrl = urlData.publicUrl;
  }

  const { data, error } = await supabaseAdmin
    .from('payments')
    .insert({
      teacher_id,
      amount,
      currency: 'EGP',
      method,
      status: 'pending',
      receipt_url: receiptUrl,
      reference_number: reference_number || null,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  await logAdminAction(
    admin.id,
    'create_payment',
    'payment',
    data.id,
    { teacher_id, amount, method },
    request.headers.get('x-forwarded-for') || undefined
  );

  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request, { requireModify: true });
  const body = await request.json();
  const parsed = updatePaymentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues[0].message, code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const { id, status } = parsed.data;

  const { error } = await supabaseAdmin
    .from('payments')
    .update({ status, verified_at: new Date().toISOString(), verified_by: admin.id })
    .eq('id', id);

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  await logAdminAction(admin.id, 'update_payment', 'payment', id, { status });

  return NextResponse.json({ success: true });
}
