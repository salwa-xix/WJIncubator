-- ============================================================================
-- LOCAL TEST FIXTURE — never applied to production.
-- ============================================================================
-- Puts the draft session into a state the rule and concurrency suites can
-- exercise: every mentor assigned and active, and a full slot grid generated.
--
-- This is exactly the work the ADMIN does in production through the UI —
-- assigning mentors and generating slots. Reproducing it here as a fixture is
-- what keeps it out of the production seed, where pre-activating 17 mentors
-- and 102 slots would be inventing the event's shape.
--
-- Run by scripts/db-test.sh only.
-- ============================================================================

\set ON_ERROR_STOP on

-- Assign every mentor profile to the session.
insert into public.session_mentors (session_id, mentor_id, sort_order)
select s.id, m.id, m.sort_order
  from public.sessions s
  cross join public.mentors m
 where s.name = 'جلسات الإرشاد — WJIncubator'
on conflict (session_id, mentor_id) do nothing;

-- Generate the slot grid from the session's own configuration.
insert into public.slots (session_id, mentor_id, start_time, end_time)
select s.id,
       sm.mentor_id,
       g.ts::time,
       (g.ts + make_interval(mins => s.slot_minutes))::time
  from public.sessions s
  join public.session_mentors sm on sm.session_id = s.id and sm.is_active
  cross join lateral generate_series(
       date '2000-01-01' + s.starts_at,
       date '2000-01-01' + s.ends_at - make_interval(mins => s.slot_minutes),
       make_interval(mins => s.slot_minutes)
     ) as g(ts)
 where s.name = 'جلسات الإرشاد — WJIncubator'
on conflict (session_id, mentor_id, start_time) do nothing;

select (select count(*) from public.session_mentors) as mentors_assigned,
       (select count(*) from public.slots)           as slots_generated;
