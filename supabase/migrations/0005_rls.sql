-- ============================================================================
-- 0005 — Row Level Security
-- ============================================================================
-- Posture: RLS on for every table, and NO policy for `anon` anywhere. In
-- Postgres, RLS with no matching policy denies — so the browser's anon key can
-- read and write exactly nothing directly. All startup-facing access goes
-- through SECURITY DEFINER RPCs, which is what lets the database check the
-- rules itself instead of trusting the caller.
--
-- Consequence worth stating plainly: possession of the anon key grants nothing.
-- It is a routing credential, not an authorisation one.
--
-- Admins are real Supabase Auth users and DO get table policies, because the
-- admin UI benefits from ordinary reads and the writes still funnel through
-- RPCs that audit.
-- ============================================================================

alter table public.startups             enable row level security;
alter table public.mentors              enable row level security;
alter table public.mentor_organizations enable row level security;
alter table public.sessions             enable row level security;
alter table public.session_mentors      enable row level security;
alter table public.slots                enable row level security;
alter table public.bookings             enable row level security;
alter table public.startup_auth_tokens  enable row level security;
alter table public.admin_users          enable row level security;
alter table public.login_attempts       enable row level security;
alter table public.audit_log            enable row level security;

-- Belt and braces: even if a policy were added by mistake, the anon role has
-- no table privileges to exercise. Function EXECUTE is granted explicitly in
-- the RPC migrations.
revoke all on all tables in schema public from anon, authenticated;

-- The access-code hash must never be readable, by anyone, through any path.
-- Column-level revoke means even a future over-broad policy cannot leak it.
revoke select (access_code_hash) on public.startups from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin read policies
-- ---------------------------------------------------------------------------
create policy admin_read_startups on public.startups
  for select to authenticated using (public.is_admin());

create policy admin_read_mentors on public.mentors
  for select to authenticated using (public.is_admin());

create policy admin_read_mentor_orgs on public.mentor_organizations
  for select to authenticated using (public.is_admin());

create policy admin_read_sessions on public.sessions
  for select to authenticated using (public.is_admin());

create policy admin_read_session_mentors on public.session_mentors
  for select to authenticated using (public.is_admin());

create policy admin_read_slots on public.slots
  for select to authenticated using (public.is_admin());

create policy admin_read_bookings on public.bookings
  for select to authenticated using (public.is_admin());

create policy admin_read_audit on public.audit_log
  for select to authenticated using (public.is_admin());

create policy admin_read_login_attempts on public.login_attempts
  for select to authenticated using (public.is_admin());

-- An admin may see that startup sessions exist (for support: "are they logged
-- in?") but the token column is revoked below so the value itself stays opaque.
create policy admin_read_tokens on public.startup_auth_tokens
  for select to authenticated using (public.is_admin());

revoke select (token) on public.startup_auth_tokens from authenticated;

-- Admins may see the admin roster.
create policy admin_read_admins on public.admin_users
  for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Deliberately absent: INSERT / UPDATE / DELETE policies.
--
-- Nobody writes to these tables directly — not even an admin. Every mutation
-- goes through an RPC that validates, audits, and (for bookings) holds the
-- right locks. Leaving the write path out of RLS entirely means there is no
-- second, unaudited way in.
-- ---------------------------------------------------------------------------

grant select on public.mentors, public.mentor_organizations,
                public.sessions, public.session_mentors, public.slots,
                public.bookings, public.audit_log, public.login_attempts,
                public.admin_users
  to authenticated;

-- ---------------------------------------------------------------------------
-- Secret-bearing tables get COLUMN-level grants, never table-level.
--
-- This is not stylistic. In Postgres a table-level GRANT SELECT confers every
-- column, and a later REVOKE SELECT (col) does NOT carve one back out — column
-- revokes only touch column-level grants. Granting the whole table and then
-- revoking the secret column silently leaves it readable. Enumerating the
-- allowed columns is the only construction that actually withholds one.
--
-- Omitted deliberately:
--   startups.access_code_hash      — the bcrypt hash of a startup's code
--   startup_auth_tokens.token      — a live session bearer token
-- Neither is readable by ANY role through ANY path. Codes are verified inside
-- startup_login(); tokens are issued there and never read back.
-- ---------------------------------------------------------------------------
grant select (
  id, sort_order, name_ar, name_en, slug, logo_url,
  founder_name, founder_role, description, stage, hq,
  linkedin_url, sector, is_active, max_bookings_override,
  created_at, updated_at
) on public.startups to authenticated;

grant select (
  startup_id, created_at, last_seen_at, expires_at, revoked_at
) on public.startup_auth_tokens to authenticated;
