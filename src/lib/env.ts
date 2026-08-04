/**
 * Environment access, validated once at module load.
 *
 * The app must stay runnable before a Supabase project exists (Phase 1), so a
 * missing config is a reported state rather than a crash — `isSupabaseConfigured`
 * lets the UI say what's missing instead of throwing a blank screen.
 */

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

export const env = {
  supabaseUrl: url,
  supabaseAnonKey: anonKey,
} as const

export const isSupabaseConfigured = Boolean(url && anonKey)

/** Which specific variables are missing — surfaced in the setup panel. */
export function missingEnvVars(): string[] {
  const missing: string[] = []
  if (!url) missing.push('VITE_SUPABASE_URL')
  if (!anonKey) missing.push('VITE_SUPABASE_ANON_KEY')
  return missing
}
