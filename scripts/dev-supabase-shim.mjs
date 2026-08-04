/**
 * DEV-ONLY Supabase shim.
 *
 * Speaks just enough of the Supabase REST + Auth protocol to point the real
 * frontend at the local Postgres from scripts/db-test.sh. That means the login
 * flow can be exercised against the actual RPCs — the real bcrypt check, the
 * real throttle, the real is_admin() gate — instead of a mock that would only
 * prove the UI talks to itself.
 *
 * Never used in production; the real app talks to Supabase.
 *
 *   node scripts/dev-supabase-shim.mjs [port]
 */
import { createServer } from 'node:http'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)
const PORT = Number(process.argv[2] ?? 54330)
const PSQL = ['-h', '/tmp', '-p', process.env.PGPORT ?? '54329', '-U', 'postgres', '-d', 'wjtest', '-qtA']
const TAG = 'SHIMJSON'

// Signature map: how each RPC's named arguments unpack from the JSON body.
// Explicit rather than reflective so the shim can never call something the
// real client wouldn't.
const RPCS = {
  list_startups: () => `select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from public.list_startups() x`,
  startup_login: (p) => `select public.startup_login((${p}->>'p_startup_id')::uuid, ${p}->>'p_code')`,
  startup_logout: (p) => `select public.startup_logout(${p}->>'p_token')`,
  startup_session_info: (p) => `select public.startup_session_info(${p}->>'p_token')`,
  get_startup_dashboard: (p) => `select public.get_startup_dashboard(${p}->>'p_token')`,
  book_slot: (p) => `select public.book_slot(${p}->>'p_token', (${p}->>'p_slot_id')::uuid)`,
  is_admin: () => `select to_jsonb(public.is_admin())`,

  // --- admin reads ---
  admin_overview:      (p) => `select public.admin_overview(nullif(${p}->>'p_session_id','')::uuid)`,
  admin_list_sessions: ()  => `select public.admin_list_sessions()`,
  admin_list_mentors:  (p) => `select public.admin_list_mentors(nullif(${p}->>'p_session_id','')::uuid)`,
  admin_list_slots:    (p) => `select public.admin_list_slots(nullif(${p}->>'p_session_id','')::uuid)`,
  admin_list_startups: (p) => `select public.admin_list_startups(nullif(${p}->>'p_session_id','')::uuid)`,
  admin_audit_log:     (p) => `select public.admin_audit_log(coalesce((${p}->>'p_limit')::int, 40))`,
  admin_list_bookings: (p) => `select public.admin_list_bookings(
      nullif(${p}->>'p_session_id','')::uuid, nullif(${p}->>'p_startup_id','')::uuid,
      nullif(${p}->>'p_mentor_id','')::uuid,  nullif(${p}->>'p_start_time',''),
      nullif(${p}->>'p_status',''))`,

  // --- admin writes ---
  admin_create_session: (p) => `select public.admin_create_session(${p}->>'p_name',
      nullif(${p}->>'p_session_date','')::date, (${p}->>'p_starts_at')::time,
      (${p}->>'p_ends_at')::time, (${p}->>'p_slot_minutes')::int, (${p}->>'p_max_bookings')::int)`,
  admin_update_session: (p) => `select public.admin_update_session((${p}->>'p_session_id')::uuid,
      nullif(${p}->>'p_name',''), nullif(${p}->>'p_session_date','')::date,
      nullif(${p}->>'p_max_bookings','')::int, nullif(${p}->>'p_allow_cancellation','')::boolean,
      nullif(${p}->>'p_block_duplicate_mentor','')::boolean)`,
  admin_open_session:  (p) => `select public.admin_open_session((${p}->>'p_session_id')::uuid)`,
  admin_close_session: (p) => `select public.admin_close_session((${p}->>'p_session_id')::uuid)`,
  admin_assign_mentors: (p) => `select public.admin_assign_mentors((${p}->>'p_session_id')::uuid,
      (select array_agg(value::text::uuid) from jsonb_array_elements_text(${p}->'p_mentor_ids') value))`,
  admin_unassign_mentor: (p) => `select public.admin_unassign_mentor((${p}->>'p_session_id')::uuid,(${p}->>'p_mentor_id')::uuid)`,
  admin_set_session_mentor_active: (p) => `select public.admin_set_session_mentor_active(
      (${p}->>'p_session_id')::uuid,(${p}->>'p_mentor_id')::uuid,(${p}->>'p_active')::boolean)`,
  admin_generate_slots: (p) => `select public.admin_generate_slots((${p}->>'p_session_id')::uuid)`,
  admin_set_slot_status: (p) => `select public.admin_set_slot_status((${p}->>'p_slot_id')::uuid,(${p}->>'p_status')::public.slot_status)`,
  admin_add_slot: (p) => `select public.admin_add_slot((${p}->>'p_session_id')::uuid,(${p}->>'p_mentor_id')::uuid,
      ${p}->>'p_start_time', nullif(${p}->>'p_minutes','')::int)`,
  admin_delete_slot: (p) => `select public.admin_delete_slot((${p}->>'p_slot_id')::uuid)`,
  admin_set_mentor_slots_status: (p) => `select public.admin_set_mentor_slots_status(
      (${p}->>'p_session_id')::uuid,(${p}->>'p_mentor_id')::uuid,(${p}->>'p_status')::public.slot_status)`,
  admin_cancel_booking: (p) => `select public.admin_cancel_booking((${p}->>'p_booking_id')::uuid, nullif(${p}->>'p_reason',''))`,
  admin_reassign_booking: (p) => `select public.admin_reassign_booking((${p}->>'p_booking_id')::uuid,(${p}->>'p_new_slot_id')::uuid)`,
  admin_set_startup_active: (p) => `select public.admin_set_startup_active((${p}->>'p_startup_id')::uuid,(${p}->>'p_active')::boolean)`,
  admin_set_startup_limit: (p) => `select public.admin_set_startup_limit((${p}->>'p_startup_id')::uuid, nullif(${p}->>'p_override','')::int)`,
  admin_set_startup_code: (p) => `select public.admin_set_startup_code((${p}->>'p_startup_id')::uuid, ${p}->>'p_code')`,
  admin_reset_startup_code: (p) => `select public.admin_reset_startup_code((${p}->>'p_startup_id')::uuid)`,
  admin_set_mentor_active: (p) => `select public.admin_set_mentor_active((${p}->>'p_mentor_id')::uuid,(${p}->>'p_active')::boolean)`,
  admin_update_mentor: (p) => `select public.admin_update_mentor((${p}->>'p_mentor_id')::uuid,
      nullif(${p}->>'p_name_ar',''), nullif(${p}->>'p_name_en',''), nullif(${p}->>'p_bio',''),
      nullif(${p}->>'p_role',''), nullif(${p}->>'p_image_url',''), nullif(${p}->>'p_availability_label',''))`,
}

const sessions = new Map() // access_token -> { userId, email }

async function sql(text, userId) {
  const pre = userId ? `select set_config('test.user_id', '${userId}', false);` : ''
  const { stdout } = await run('psql', [...PSQL, '-c', `${pre}${text}`], { maxBuffer: 8 << 20 })
  return stdout.trim().split('\n').filter(Boolean).pop() ?? 'null'
}

function send(res, status, body) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
  })
  res.end(payload)
}

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, '')

  const chunks = []
  for await (const c of req) chunks.push(c)
  const raw = Buffer.concat(chunks).toString() || '{}'
  const url = new URL(req.url, 'http://localhost')

  const bearer = (req.headers.authorization ?? '').replace('Bearer ', '')
  const userId = sessions.get(bearer)?.userId ?? null

  try {
    // ---- Auth: password grant -------------------------------------------
    if (url.pathname === '/auth/v1/token') {
      const { email, password } = JSON.parse(raw)
      // The shim accepts any password for a known admin — Supabase owns real
      // password verification, and duplicating it here would prove nothing.
      const row = await sql(
        `select coalesce((select to_jsonb(u) from auth.users u where u.email = ${lit(email)}), 'null'::jsonb)`,
      )
      const user = JSON.parse(row)
      if (!user || !password) return send(res, 400, { error: 'invalid_grant' })
      const token = `shim-${Math.random().toString(36).slice(2)}`
      sessions.set(token, { userId: user.id, email })
      return send(res, 200, {
        access_token: token,
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: token,
        user: { id: user.id, email, aud: 'authenticated', role: 'authenticated' },
      })
    }
    if (url.pathname === '/auth/v1/logout') {
      sessions.delete(bearer)
      return send(res, 204, '')
    }
    if (url.pathname === '/auth/v1/user') {
      const s = sessions.get(bearer)
      if (!s) return send(res, 401, { error: 'unauthorized' })
      return send(res, 200, { id: s.userId, email: s.email, aud: 'authenticated', role: 'authenticated' })
    }

    // ---- RPC -------------------------------------------------------------
    const m = url.pathname.match(/^\/rest\/v1\/rpc\/(\w+)$/)
    if (m && RPCS[m[1]]) {
      if (raw.includes(TAG)) return send(res, 400, { message: 'rejected' })
      const out = await sql(RPCS[m[1]](`$${TAG}$${raw}$${TAG}$::jsonb`), userId)
      return send(res, 200, out)
    }

    return send(res, 404, { message: `no shim route for ${url.pathname}` })
  } catch (e) {
    return send(res, 500, { message: String(e?.message ?? e).slice(0, 400) })
  }
}).listen(PORT, () => console.log(`supabase shim on http://localhost:${PORT}`))

function lit(s) {
  return `'${String(s).replace(/'/g, "''")}'`
}
