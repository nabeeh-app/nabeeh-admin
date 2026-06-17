import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _supabaseAdmin: SupabaseClient | null = null;
let _supabaseBrowser: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin;
}

export function getSupabaseBrowser(): SupabaseClient {
  if (!_supabaseBrowser) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_ADMIN_SUPABASE_ANON_KEY!;
    _supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabaseBrowser;
}

// Legacy aliases
// Legacy aliases — proxy pattern to avoid creating Supabase clients at module load time
export const supabaseAdmin = new Proxy({} as SupabaseClient, { get: (_, prop) => (getSupabaseAdmin() as unknown as Record<string, unknown>)[prop as string] });
export const supabaseBrowser = new Proxy({} as SupabaseClient, { get: (_, prop) => (getSupabaseBrowser() as unknown as Record<string, unknown>)[prop as string] });
