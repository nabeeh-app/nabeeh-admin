import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseBrowser } from '@/lib/supabase';

const sessionSchema = z.object({
  accessToken: z.string().min(1, 'Missing access token'),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = sessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues[0].message, code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const { accessToken } = parsed.data;

  const { data: { user }, error } = await supabaseBrowser.auth.getUser(accessToken);

  if (error || !user) {
    return NextResponse.json(
      { success: false, message: 'Invalid token', code: 'INVALID_TOKEN' },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('admin-session', accessToken, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 3600,
  });

  return response;
}
