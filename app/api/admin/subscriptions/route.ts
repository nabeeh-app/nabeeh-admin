import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, logAdminAction } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

const updateSubscriptionSchema = z.object({
  teacher_id: z.string().uuid(),
  action: z.enum(['change_tier', 'extend_trial', 'suspend', 'cancel', 'reactivate']),
  tier: z.enum(['free', 'basic', 'pro', 'center']).optional(),
  days: z.number().int().positive().optional(),
  reason: z.string().max(500).optional(),
});

export async function GET(request: Request) {
  await requireAdmin(request);
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacher_id');

  if (teacherId) {
    const { data } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({ success: true, data: data || [] });
  }

  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false });

  return NextResponse.json({ success: true, data: data || [] });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request, { requireModify: true });
  const body = await request.json();
  const parsed = updateSubscriptionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues[0].message, code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const { teacher_id, action, tier, days, reason } = parsed.data;

  // Get current subscription
  const { data: currentSub } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('teacher_id', teacher_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = { updated_at: now };
  let auditAction = '';

  switch (action) {
    case 'change_tier':
      if (!tier) {
        return NextResponse.json(
          { success: false, message: 'Tier is required for change_tier action', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      updateData.tier = tier;
      auditAction = `change_tier_to_${tier}`;
      break;

    case 'extend_trial':
      if (!days) {
        return NextResponse.json(
          { success: false, message: 'Days is required for extend_trial action', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      const currentTrialEnd = currentSub?.trial_ends_at ? new Date(currentSub.trial_ends_at) : new Date();
      currentTrialEnd.setDate(currentTrialEnd.getDate() + days);
      updateData.trial_ends_at = currentTrialEnd.toISOString();
      updateData.status = 'trial';
      auditAction = `extend_trial_by_${days}_days`;
      break;

    case 'suspend':
      updateData.status = 'suspended';
      auditAction = 'suspend';
      break;

    case 'cancel':
      updateData.status = 'cancelled';
      updateData.cancelled_at = now;
      auditAction = 'cancel';
      break;

    case 'reactivate':
      updateData.status = 'active';
      updateData.cancelled_at = null;
      auditAction = 'reactivate';
      break;
  }

  if (currentSub) {
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update(updateData)
      .eq('id', currentSub.id);

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
  } else {
    // Create new subscription if none exists
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        teacher_id,
        tier: tier || 'free',
        status: action === 'suspend' ? 'suspended' : action === 'cancel' ? 'cancelled' : 'active',
        ...updateData,
      });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
  }

  await logAdminAction(
    admin.id,
    auditAction,
    'subscription',
    currentSub?.id,
    { teacher_id, tier: tier || currentSub?.tier, reason, previous_status: currentSub?.status },
    request.headers.get('x-forwarded-for') || undefined
  );

  return NextResponse.json({ success: true });
}
