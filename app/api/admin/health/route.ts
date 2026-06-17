import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  await requireAdmin(request);
  const now = new Date().toISOString();

  const [teachers, students] = await Promise.all([
    supabaseAdmin.from('teachers').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('students').select('id', { count: 'exact', head: true }),
  ]);

  // Fetch WhatsApp status from backend
  let whatsappStatus = 'unknown';
  let whatsappPhone = null;
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const waRes = await fetch(`${backendUrl}/api/admin/whatsapp-health`, {
      signal: AbortSignal.timeout(5000),
    });
    const waJson = await waRes.json();
    if (waJson.success) {
      whatsappStatus = waJson.data.status;
      whatsappPhone = waJson.data.phone;
    }
  } catch {
    whatsappStatus = 'unreachable';
  }

  return NextResponse.json({
    success: true,
    data: {
      db: {
        connected: !teachers.error && !students.error,
        teacherCount: teachers.count || 0,
        studentCount: students.count || 0,
      },
      whatsapp: {
        status: whatsappStatus,
        phone: whatsappPhone,
        lastCheck: now,
      },
      lastRefresh: now,
    },
  });
}
