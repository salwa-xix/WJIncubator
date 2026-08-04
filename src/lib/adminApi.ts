import { getSupabase } from './supabase'
import { isSupabaseConfigured } from './env'
import type { RpcResult } from './api'

/**
 * Admin RPC surface. Every one of these is gated by is_admin() inside the
 * database, so this module is a convenience wrapper — not the security
 * boundary. There are no table writes anywhere: the admin mutates only
 * through these functions, which is what makes every change auditable.
 */
async function call<T>(fn: string, args: Record<string, unknown> = {}): Promise<RpcResult<T>> {
  if (!isSupabaseConfigured) return { ok: false, code: 'NOT_CONFIGURED' }
  try {
    const { data, error } = await getSupabase().rpc(fn, args)
    if (error) return { ok: false, code: 'UNKNOWN', detail: error.message }
    return data as RpcResult<T>
  } catch {
    return { ok: false, code: 'NETWORK' }
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdminSession = {
  id: string
  name: string
  session_date: string | null
  starts_at: string
  ends_at: string
  slot_minutes: number
  max_bookings_per_startup: number
  allow_startup_cancellation: boolean
  block_duplicate_mentor: boolean
  status: 'draft' | 'open' | 'closed'
  mentors_assigned: number
  mentors_active: number
  slots_total: number
  bookings: number
}

export type AdminMentor = {
  id: string
  slug: string
  name_ar: string
  name_en: string | null
  image_url: string | null
  bio: string | null
  role: string | null
  availability_label: string | null
  is_active: boolean
  assigned: boolean
  session_active: boolean
  slots_total: number
  slots_closed: number
  bookings: number
  organizations: { name: string; logo_url: string | null }[]
}

export type AdminSlot = {
  id: string
  mentor_id: string
  mentor_name: string
  start_time: string
  end_time: string
  status: 'open' | 'closed'
  mentor_session_active: boolean
  booking_id: string | null
  booked_by: string | null
}

export type AdminBooking = {
  id: string
  startup_id: string
  startup_name: string
  startup_logo: string | null
  mentor_id: string
  mentor_name: string
  slot_id: string
  start_time: string
  end_time: string
  session_date: string | null
  status: 'confirmed' | 'cancelled'
  created_at: string
  cancelled_at: string | null
  cancelled_by: string | null
  cancel_reason: string | null
}

export type AdminStartup = {
  id: string
  slug: string
  name_ar: string
  name_en: string | null
  logo_url: string | null
  sector: string | null
  stage: string | null
  hq: string | null
  founder_name: string | null
  is_active: boolean
  /** Whether a code exists — never the code or its hash. */
  has_code: boolean
  max_bookings_override: number | null
  limit: number
  used: number
}

export type AdminOverview = {
  session_id: string | null
  total_startups: number
  active_startups: number
  total_mentors: number
  session_mentors: number
  total_slots: number
  closed_slots: number
  booked_slots: number
  available_slots: number
  confirmed_bookings: number
  cancelled_bookings: number
}

export type AuditEntry = {
  id: number
  actor: string
  action: string
  entity: string | null
  entity_id: string | null
  detail: Record<string, unknown> | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------
export const adminOverview = (sessionId?: string | null) =>
  call<AdminOverview>('admin_overview', { p_session_id: sessionId ?? null })

export const adminListSessions = () => call<{ sessions: AdminSession[] }>('admin_list_sessions')

export const adminListMentors = (sessionId?: string | null) =>
  call<{ session_id: string | null; mentors: AdminMentor[] }>('admin_list_mentors', {
    p_session_id: sessionId ?? null,
  })

export const adminListSlots = (sessionId?: string | null) =>
  call<{ session_id: string | null; times: string[]; slots: AdminSlot[] }>('admin_list_slots', {
    p_session_id: sessionId ?? null,
  })

export const adminListBookings = (filters: {
  sessionId?: string | null
  startupId?: string | null
  mentorId?: string | null
  startTime?: string | null
  status?: string | null
}) =>
  call<{ bookings: AdminBooking[] }>('admin_list_bookings', {
    p_session_id: filters.sessionId ?? null,
    p_startup_id: filters.startupId || null,
    p_mentor_id: filters.mentorId || null,
    p_start_time: filters.startTime || null,
    p_status: filters.status || null,
  })

export const adminListStartups = (sessionId?: string | null) =>
  call<{ startups: AdminStartup[] }>('admin_list_startups', { p_session_id: sessionId ?? null })

export const adminAuditLog = (limit = 40) =>
  call<{ entries: AuditEntry[] }>('admin_audit_log', { p_limit: limit })

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------
export const adminCreateSession = (p: {
  name: string
  date?: string | null
  startsAt?: string
  endsAt?: string
  slotMinutes?: number
  maxBookings?: number
}) =>
  call<{ session_id: string }>('admin_create_session', {
    p_name: p.name,
    p_session_date: p.date || null,
    p_starts_at: p.startsAt ?? '17:00',
    p_ends_at: p.endsAt ?? '19:00',
    p_slot_minutes: p.slotMinutes ?? 20,
    p_max_bookings: p.maxBookings ?? 3,
  })

export const adminUpdateSession = (
  sessionId: string,
  p: { name?: string; date?: string; maxBookings?: number; allowCancellation?: boolean; blockDuplicateMentor?: boolean },
) =>
  call('admin_update_session', {
    p_session_id: sessionId,
    p_name: p.name ?? null,
    p_session_date: p.date ?? null,
    p_max_bookings: p.maxBookings ?? null,
    p_allow_cancellation: p.allowCancellation ?? null,
    p_block_duplicate_mentor: p.blockDuplicateMentor ?? null,
  })

export const adminOpenSession = (sessionId: string) =>
  call('admin_open_session', { p_session_id: sessionId })
export const adminCloseSession = (sessionId: string) =>
  call('admin_close_session', { p_session_id: sessionId })

// ---------------------------------------------------------------------------
// Mentors
// ---------------------------------------------------------------------------
export const adminAssignMentors = (sessionId: string, mentorIds: string[]) =>
  call<{ added: number }>('admin_assign_mentors', { p_session_id: sessionId, p_mentor_ids: mentorIds })

export const adminUnassignMentor = (sessionId: string, mentorId: string) =>
  call('admin_unassign_mentor', { p_session_id: sessionId, p_mentor_id: mentorId })

export const adminSetSessionMentorActive = (sessionId: string, mentorId: string, active: boolean) =>
  call('admin_set_session_mentor_active', {
    p_session_id: sessionId,
    p_mentor_id: mentorId,
    p_active: active,
  })

export const adminUpdateMentor = (
  mentorId: string,
  p: { nameAr?: string; nameEn?: string; bio?: string; role?: string; availabilityLabel?: string },
) =>
  call('admin_update_mentor', {
    p_mentor_id: mentorId,
    p_name_ar: p.nameAr ?? null,
    p_name_en: p.nameEn ?? null,
    p_bio: p.bio ?? null,
    p_role: p.role ?? null,
    p_image_url: null,
    p_availability_label: p.availabilityLabel ?? null,
  })

export const adminSetMentorActive = (mentorId: string, active: boolean) =>
  call('admin_set_mentor_active', { p_mentor_id: mentorId, p_active: active })

// ---------------------------------------------------------------------------
// Slots
// ---------------------------------------------------------------------------
export const adminGenerateSlots = (sessionId: string) =>
  call<{ created: number }>('admin_generate_slots', { p_session_id: sessionId })

export const adminSetSlotStatus = (slotId: string, status: 'open' | 'closed') =>
  call('admin_set_slot_status', { p_slot_id: slotId, p_status: status })

export const adminAddSlot = (sessionId: string, mentorId: string, startTime: string) =>
  call<{ slot_id: string }>('admin_add_slot', {
    p_session_id: sessionId,
    p_mentor_id: mentorId,
    p_start_time: startTime,
    p_minutes: null,
  })

export const adminDeleteSlot = (slotId: string) => call('admin_delete_slot', { p_slot_id: slotId })

export const adminSetMentorSlotsStatus = (
  sessionId: string,
  mentorId: string,
  status: 'open' | 'closed',
) =>
  call<{ changed: number }>('admin_set_mentor_slots_status', {
    p_session_id: sessionId,
    p_mentor_id: mentorId,
    p_status: status,
  })

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------
export const adminCancelBooking = (bookingId: string, reason?: string) =>
  call('admin_cancel_booking', { p_booking_id: bookingId, p_reason: reason || null })

export const adminReassignBooking = (bookingId: string, newSlotId: string) =>
  call('admin_reassign_booking', { p_booking_id: bookingId, p_new_slot_id: newSlotId })

// ---------------------------------------------------------------------------
// Startups
// ---------------------------------------------------------------------------
export const adminSetStartupActive = (startupId: string, active: boolean) =>
  call('admin_set_startup_active', { p_startup_id: startupId, p_active: active })

export const adminSetStartupLimit = (startupId: string, override: number | null) =>
  call('admin_set_startup_limit', { p_startup_id: startupId, p_override: override })

/**
 * Returns the new plaintext code ONE time. Codes are bcrypt-hashed and cannot
 * be read back, so reset-and-reveal is the only honest affordance — and a
 * strictly better one than a readable credential column.
 */
export const adminResetStartupCode = (startupId: string) =>
  call<{ code: string }>('admin_reset_startup_code', { p_startup_id: startupId })

export const adminSetStartupCode = (startupId: string, code: string) =>
  call('admin_set_startup_code', { p_startup_id: startupId, p_code: code })
