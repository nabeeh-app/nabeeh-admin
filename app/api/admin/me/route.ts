import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);
    return NextResponse.json({
      success: true,
      data: { id: admin.id, role: admin.role, name: admin.name },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { success: false, message: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
