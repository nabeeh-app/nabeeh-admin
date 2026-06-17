import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  await requireAdmin(request);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  // Detail view
  if (id) {
    const [teacherData, subData, studentsData, groupsData, offeringsData, paymentsData] = await Promise.all([
      supabaseAdmin.from('teachers').select('*').eq('id', id).single(),
      supabaseAdmin.from('subscriptions').select('*').eq('teacher_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabaseAdmin.from('students').select('id', { count: 'exact', head: true }).eq('teacher_id', id),
      supabaseAdmin.from('groups').select('id', { count: 'exact', head: true }).eq('teacher_id', id),
      supabaseAdmin.from('offerings').select('id', { count: 'exact', head: true }).eq('teacher_id', id),
      supabaseAdmin.from('payments').select('*').eq('teacher_id', id).order('created_at', { ascending: false }).limit(10),
    ]);

    if (!teacherData.data) {
      return NextResponse.json(
        { success: false, message: 'Teacher not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...teacherData.data,
        subscription: subData.data,
        students_count: studentsData.count || 0,
        groups_count: groupsData.count || 0,
        offerings_count: offeringsData.count || 0,
        payments: paymentsData.data || [],
      },
    });
  }

  // List view
  const { data: teacherData } = await supabaseAdmin
    .from('teachers')
    .select('id, name, email, phone, created_at');

  const { data: subsData } = await supabaseAdmin
    .from('subscriptions')
    .select('teacher_id, tier, status');

  const { data: studentsData } = await supabaseAdmin
    .from('students')
    .select('id, teacher_id');

  const subMap = new Map((subsData || []).map((s) => [s.teacher_id, s]));
  const studentCountMap = new Map<string, number>();
  (studentsData || []).forEach((s) => {
    studentCountMap.set(s.teacher_id, (studentCountMap.get(s.teacher_id) || 0) + 1);
  });

  const rows = (teacherData || []).map((t) => ({
    id: t.id,
    name: t.name,
    email: t.email,
    phone: t.phone,
    tier: subMap.get(t.id)?.tier || 'free',
    status: subMap.get(t.id)?.status || 'active',
    students_count: studentCountMap.get(t.id) || 0,
    created_at: t.created_at,
  }));

  return NextResponse.json({ success: true, data: rows });
}
