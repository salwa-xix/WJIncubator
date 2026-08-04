import { getSupabase } from './supabase'
import { isSupabaseConfigured } from './env'

/**
 * Typed access to the database RPCs.
 *
 * Every function here returns the same envelope the database produces —
 * `{ ok: true, ... }` or `{ ok: false, code }` — so the UI has exactly one
 * shape to branch on. Transport failures are folded into the same shape rather
 * than thrown, because a dropped connection and a rejected booking need the
 * same treatment at the call site: show a message, stay on the page.
 */

export type RpcResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; code: string; detail?: unknown }

export type StartupSummary = {
  id: string
  name_ar: string
  name_en: string | null
  logo_url: string | null
}

export type StartupListItem = StartupSummary & { is_active: boolean }

async function call<T>(fn: string, args: Record<string, unknown> = {}): Promise<RpcResult<T>> {
  if (!isSupabaseConfigured) return { ok: false, code: 'NOT_CONFIGURED' }
  try {
    const { data, error } = await getSupabase().rpc(fn, args)
    if (error) {
      // A Postgres-level failure that escaped the RPC's own error handling.
      return { ok: false, code: 'UNKNOWN', detail: error.message }
    }
    return data as RpcResult<T>
  } catch {
    return { ok: false, code: 'NETWORK' }
  }
}

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

/** Login dropdown source. Carries no hint of any access code. */
export async function listStartups(): Promise<StartupListItem[]> {
  if (!isSupabaseConfigured) return []
  const { data, error } = await getSupabase().rpc('list_startups')
  if (error || !Array.isArray(data)) return []
  return data as StartupListItem[]
}

export function startupLogin(startupId: string, code: string) {
  return call<{ token: string; expires_at: string; startup: StartupSummary }>('startup_login', {
    p_startup_id: startupId,
    p_code: code,
  })
}

export function startupLogout(token: string) {
  return call('startup_logout', { p_token: token })
}

export function startupSessionInfo(token: string) {
  return call<{ startup: StartupSummary }>('startup_session_info', { p_token: token })
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

/**
 * Membership check. A valid Supabase Auth login is NOT sufficient — the user
 * must also be listed in admin_users, which is what this asks.
 */
export async function isAdmin(): Promise<boolean> {
  if (!isSupabaseConfigured) return false
  try {
    const { data, error } = await getSupabase().rpc('is_admin')
    return !error && data === true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Startup dashboard
// ---------------------------------------------------------------------------

/** available = bookable · booked = taken by someone else · mine = this startup · closed = admin-closed */
export type SlotState = 'available' | 'booked' | 'mine' | 'closed'

export type DashboardSlot = {
  id: string
  start_time: string
  end_time: string
  state: SlotState
}

export type DashboardMentor = {
  id: string
  name_ar: string
  name_en: string | null
  image_url: string | null
  bio: string | null
  role: string | null
  availability_label: string | null
  organizations: { name: string; logo_url: string | null }[]
  slots: DashboardSlot[]
}

export type DashboardBooking = {
  id: string
  mentor_id: string
  mentor_name: string
  mentor_image: string | null
  start_time: string
  end_time: string
  status: string
  created_at: string
}

export type DashboardData = {
  startup: StartupSummary & { is_active: boolean }
  session: { id: string; name: string; session_date: string | null; allow_cancellation: boolean } | null
  quota: { limit: number; used: number; remaining: number } | null
  bookings: DashboardBooking[]
  mentors: DashboardMentor[]
}

/**
 * One round trip for the whole dashboard. `booked` slots carry no identity —
 * a startup learns a slot is taken, never by whom.
 */
export function getStartupDashboard(token: string) {
  return call<DashboardData>('get_startup_dashboard', { p_token: token })
}

/**
 * The single write path for startups. Every rule is re-checked inside one
 * database transaction, so the result here is authoritative — the UI's own
 * checks only exist to avoid a pointless round trip.
 */
export function bookSlot(token: string, slotId: string) {
  return call<{ booking_id: string; used: number; remaining: number }>('book_slot', {
    p_token: token,
    p_slot_id: slotId,
  })
}
