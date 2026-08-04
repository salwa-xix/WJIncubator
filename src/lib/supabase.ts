import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env, isSupabaseConfigured } from './env'

/**
 * The single Supabase client for the app.
 *
 * Only the anon key ever reaches the browser. Every table denies that key via
 * RLS; the app reads and writes exclusively through SECURITY DEFINER RPCs, so
 * possession of this key grants nothing on its own.
 *
 * `persistSession` covers the ADMIN side only — admins are real Supabase Auth
 * users. Startups do not use Supabase Auth: they authenticate with a 4-digit
 * code exchanged server-side for an opaque session token (see Phase 3).
 */
let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Copy .env.example to .env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    )
  }
  client ??= createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: 'wj-admin-auth',
    },
    global: {
      headers: { 'x-application-name': 'wjincubator-booking' },
    },
  })
  return client
}

/** Probe used by the setup panel to confirm the project is reachable. */
export async function pingSupabase(): Promise<{ ok: boolean; detail: string }> {
  if (!isSupabaseConfigured) return { ok: false, detail: 'لم تتم تهيئة المتغيرات' }
  try {
    const { error } = await getSupabase().auth.getSession()
    if (error) return { ok: false, detail: error.message }
    return { ok: true, detail: 'الاتصال ناجح' }
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : 'خطأ غير معروف' }
  }
}
