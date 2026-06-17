import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from './supabase';
import type { AdminRole, AdminUser } from '@/types';

export type { AdminRole, AdminUser } from '@/types';

export async function getAdminUser(userId: string): Promise<AdminUser | null> {
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as AdminUser;
}

export function canModify(role: AdminRole): boolean {
  return role === 'super_admin' || role === 'support_agent';
}

export function canManageAdmins(role: AdminRole): boolean {
  return role === 'super_admin';
}

export async function logAdminAction(
  adminId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string
) {
  await supabaseAdmin.from('admin_audit_log').insert({
    admin_id: adminId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
    ip_address: ipAddress,
  });
}

export async function requireAdmin(
  _request: Request,
  options?: { requireModify?: boolean }
): Promise<AdminUser> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-session')?.value;

  if (!token) {
    throw NextResponse.json(
      { success: false, message: 'Authentication required', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    throw NextResponse.json(
      { success: false, message: 'Invalid or expired session', code: 'INVALID_SESSION' },
      { status: 401 }
    );
  }

  const adminUser = await getAdminUser(user.id);

  if (!adminUser) {
    throw NextResponse.json(
      { success: false, message: 'Not an admin user', code: 'NOT_ADMIN' },
      { status: 403 }
    );
  }

  if (options?.requireModify && !canModify(adminUser.role)) {
    throw NextResponse.json(
      { success: false, message: 'Insufficient permissions', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  return adminUser;
}
