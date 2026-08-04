-- ============================================================================
-- 0003 — Rule-enforcing indexes and supporting indexes
-- ============================================================================
-- How the booking rules are split between indexes and the booking RPC:
--
--   CROSS-STARTUP rules must be indexes. Two different startups racing for the
--   same slot are two different transactions touching different startup rows,
--   so only a shared constraint can arbitrate. That is "one confirmed booking
--   per slot".
--
--   PER-STARTUP rules (booking cap, time clash, duplicate mentor) are decided
--   inside book_slot() while holding a row lock on that startup. The lock fully
--   serialises one startup's concurrent attempts, so a count taken under it
--   cannot be stale. Two of these also get an index anyway, as defence in
--   depth. The cap and the duplicate-mentor rule are configurable per session,
--   which a partial index cannot express — those stay RPC-enforced, and the
--   row lock is what makes that airtight rather than hopeful.
-- ============================================================================

-- RULE: a slot can hold at most one confirmed booking.
-- This is the one that arbitrates between competing startups. Cancelled rows
-- are excluded, so a cancelled booking frees the slot with no extra work.
create unique index bookings_one_confirmed_per_slot
  on public.bookings (slot_id)
  where status = 'confirmed';

-- RULE: a startup cannot hold two confirmed bookings at the same moment.
create unique index bookings_no_time_clash
  on public.bookings (startup_id, session_id, start_time)
  where status = 'confirmed';

-- Supporting indexes for the dashboard and admin queries.
create index bookings_by_startup    on public.bookings (startup_id, session_id) where status = 'confirmed';
create index bookings_by_session    on public.bookings (session_id, start_time);
create index bookings_by_mentor     on public.bookings (mentor_id, session_id)  where status = 'confirmed';
create index slots_by_session       on public.slots (session_id, start_time);
create index slots_by_mentor        on public.slots (session_id, mentor_id);
create index session_mentors_active on public.session_mentors (session_id) where is_active;
create index mentor_orgs_by_mentor  on public.mentor_organizations (mentor_id, sort_order);

-- At most one session may be `open` at a time. "The current session" is
-- therefore a fact the database guarantees, not a convention the app hopes for.
create unique index sessions_only_one_open
  on public.sessions ((status))
  where status = 'open';

-- Token lookups and expiry sweeps.
create index startup_auth_tokens_by_startup on public.startup_auth_tokens (startup_id);
create index startup_auth_tokens_expiry     on public.startup_auth_tokens (expires_at);

-- Throttle window lookups.
create index login_attempts_recent on public.login_attempts (startup_id, created_at desc);

create index audit_log_recent on public.audit_log (created_at desc);

-- Keep `updated_at` honest without every writer having to remember.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger startups_touch before update on public.startups
  for each row execute function public.touch_updated_at();
create trigger mentors_touch before update on public.mentors
  for each row execute function public.touch_updated_at();
create trigger sessions_touch before update on public.sessions
  for each row execute function public.touch_updated_at();
