-- ============================================================================
-- SEED — Booking session (PRODUCTION)
-- ============================================================================
-- Creates ONE session in `draft` and stops there. Deliberately it does NOT:
--
--   • set a date            — you supply the real one
--   • assign any mentors    — the admin chooses who takes part
--   • generate any slots    — the admin decides the days, times, and which
--                             slots are open
--
-- Everything past this point is an admin decision made in the UI, because the
-- roster and the schedule are operational choices that change per event. A
-- seed that pre-activated 17 mentors and pre-generated 102 slots would be
-- inventing the event's shape.
--
-- The starts_at / ends_at / slot_minutes values below are the DEFAULTS the
-- admin's slot generator starts from — not slots themselves. Nothing exists
-- until the admin generates it.
--
-- Optionally supply the date now:
--   psql ... -v session_date="'2026-08-13'" -f 04_session.sql
--
-- Without a date the session cannot be opened (sessions_open_needs_date), so
-- an unscheduled event physically cannot go live by accident.
--
-- The local test fixture (supabase/test/02_fixture.sql) is what assigns
-- mentors and generates slots. That is test data and never runs in production.
-- ============================================================================

\if :{?session_date}
\else
  \set session_date ''
\endif

\set ON_ERROR_STOP on

insert into public.sessions
  (name, session_date, starts_at, ends_at, slot_minutes,
   max_bookings_per_startup, allow_startup_cancellation, block_duplicate_mentor, status)
select
  'جلسات الإرشاد — WJIncubator',
  nullif(:'session_date', '')::date,
  time '17:00',   -- default the admin's slot generator starts from
  time '19:00',
  20,
  3,              -- confirmed-booking cap per startup
  false,          -- startup self-cancellation: OFF (confirmed decision)
  true,           -- one session per mentor per startup (confirmed decision)
  'draft'
where not exists (
  select 1 from public.sessions where name = 'جلسات الإرشاد — WJIncubator'
);

update public.sessions
   set session_date = nullif(:'session_date', '')::date
 where name = 'جلسات الإرشاد — WJIncubator'
   and nullif(:'session_date', '') is not null;

select s.name,
       coalesce(s.session_date::text, '(غير محدد — يحدده المشرف)') as session_date,
       s.status,
       s.max_bookings_per_startup as cap,
       (select count(*) from public.session_mentors where session_id = s.id) as mentors_assigned,
       (select count(*) from public.slots           where session_id = s.id) as slots_generated
  from public.sessions s
 where s.name = 'جلسات الإرشاد — WJIncubator';
