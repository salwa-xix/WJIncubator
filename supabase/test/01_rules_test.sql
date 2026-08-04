-- ============================================================================
-- RULE TESTS — asserts every booking rule the database is supposed to enforce.
-- Run via `npm run db:test`. Any failed assertion aborts with an exception.
-- ============================================================================

\set ON_ERROR_STOP on
\pset pager off

create or replace function pg_temp.assert(p_cond boolean, p_label text)
returns void language plpgsql as $$
begin
  if p_cond then
    raise notice '  PASS  %', p_label;
  else
    raise exception 'FAIL  %', p_label;
  end if;
end $$;

create or replace function pg_temp.code_of(p jsonb) returns text
language sql immutable as $$ select coalesce(p->>'code', case when (p->>'ok')::boolean then 'OK' else 'NO_CODE' end) $$;

-- ---------------------------------------------------------------------------
do $$ begin raise notice E'\n=== SEED INTEGRITY ==='; end $$;

select pg_temp.assert((select count(*) from public.startups) = 19, '19 startups seeded');
select pg_temp.assert((select count(*) from public.mentors)  = 14, '14 mentor profiles seeded');
select pg_temp.assert((select count(*) from public.mentor_organizations) = 27, '27 mentor organizations seeded');
select pg_temp.assert((select count(distinct start_time) from public.slots) = 6, 'six 20-minute slots per mentor');
select pg_temp.assert(
  (select array_agg(distinct to_char(start_time,'HH24:MI') order by to_char(start_time,'HH24:MI')) from public.slots)
   = array['17:00','17:20','17:40','18:00','18:20','18:40'],
  'slot times match the challenge schedule');
select pg_temp.assert((select count(*) from public.slots) = 84, '84 slots (14 mentors x 6)');
select pg_temp.assert((select session_date is null from public.sessions limit 1), 'event date left configurable (NULL)');

-- ---------------------------------------------------------------------------
do $$ begin raise notice E'\n=== SETUP: admin, codes, open session ==='; end $$;

insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111', 'admin@wj.test');
insert into public.admin_users (user_id, display_name) values ('11111111-1111-1111-1111-111111111111', 'Test Admin');
select set_config('test.user_id', '11111111-1111-1111-1111-111111111111', false);

select pg_temp.assert(public.is_admin(), 'is_admin() true for a listed admin');

-- Opening must be impossible while the date is unset.
select pg_temp.assert(
  pg_temp.code_of(public.admin_open_session((select id from public.sessions))) = 'SESSION_DATE_REQUIRED',
  'cannot open a session with no date');

select public.admin_update_session((select id from public.sessions), p_session_date => current_date);
select pg_temp.assert(
  (public.admin_open_session((select id from public.sessions))->>'ok')::boolean,
  'session opens once a date is set');

-- Issue codes. '0042' specifically checks that leading zeros survive.
select public.admin_set_startup_code(id, '0042') from public.startups where slug = 'mabien';
select public.admin_set_startup_code(id, '1234') from public.startups where slug = 'nanoclean';
select public.admin_set_startup_code(id, '5678') from public.startups where slug = 'groupz';

-- ---------------------------------------------------------------------------
do $$ begin raise notice E'\n=== AUTHENTICATION ==='; end $$;

select pg_temp.assert(
  pg_temp.code_of(public.startup_login((select id from public.startups where slug='mabien'), '9999')) = 'INVALID_CODE',
  'wrong code rejected');

select pg_temp.assert(
  pg_temp.code_of(public.startup_login((select id from public.startups where slug='mabien'), '42')) = 'BAD_FORMAT',
  'non-4-digit code rejected');

select pg_temp.assert(
  (public.startup_login((select id from public.startups where slug='mabien'), '0042')->>'ok')::boolean,
  'leading-zero code 0042 authenticates (stored as TEXT, not integer)');

select pg_temp.assert(
  pg_temp.code_of(public.get_startup_dashboard('not-a-real-token-aaaaaaaaaaaaaaaa')) = 'INVALID_SESSION',
  'unknown token rejected');

-- Throttle: 5 failures inside 15 minutes locks further attempts.
do $$
declare v_id uuid := (select id from public.startups where slug='nanoclean');
begin
  for i in 1..5 loop perform public.startup_login(v_id, '0000'); end loop;
end $$;
select pg_temp.assert(
  pg_temp.code_of(public.startup_login((select id from public.startups where slug='nanoclean'), '1234')) = 'TOO_MANY_ATTEMPTS',
  'brute-force throttle engages after 5 failures — even for the CORRECT code');

-- ---------------------------------------------------------------------------
do $$ begin raise notice E'\n=== BOOKING RULES ==='; end $$;

create temp table t (k text primary key, v text);
insert into t values ('tok_a', (public.startup_login((select id from public.startups where slug='mabien'), '0042')->>'token'));
insert into t values ('tok_b', (public.startup_login((select id from public.startups where slug='groupz'), '5678')->>'token'));

-- Slot handles: two mentors, three times.
insert into t
select 'm1_t1', id::text from public.slots
 where mentor_id = (select id from public.mentors where slug='basma-khoja') and start_time='17:00';
insert into t
select 'm1_t2', id::text from public.slots
 where mentor_id = (select id from public.mentors where slug='basma-khoja') and start_time='17:20';
insert into t
select 'm2_t1', id::text from public.slots
 where mentor_id = (select id from public.mentors where slug='anas-alsufyani') and start_time='17:00';
insert into t
select 'm2_t2', id::text from public.slots
 where mentor_id = (select id from public.mentors where slug='anas-alsufyani') and start_time='17:20';
insert into t
select 'm3_t3', id::text from public.slots
 where mentor_id = (select id from public.mentors where slug='khalid-alkhudair') and start_time='17:40';
insert into t
select 'm4_t4', id::text from public.slots
 where mentor_id = (select id from public.mentors where slug='muna-balhamar') and start_time='18:00';

select pg_temp.assert(
  (public.book_slot((select v from t where k='tok_a'), (select v from t where k='m1_t1')::uuid)->>'ok')::boolean,
  'first booking succeeds');

select pg_temp.assert(
  pg_temp.code_of(public.book_slot((select v from t where k='tok_b'), (select v from t where k='m1_t1')::uuid)) = 'SLOT_TAKEN',
  'RULE: a slot cannot be booked twice');

select pg_temp.assert(
  pg_temp.code_of(public.book_slot((select v from t where k='tok_a'), (select v from t where k='m2_t1')::uuid)) = 'TIME_CONFLICT',
  'RULE: a startup cannot hold two bookings at the same time');

select pg_temp.assert(
  pg_temp.code_of(public.book_slot((select v from t where k='tok_a'), (select v from t where k='m1_t2')::uuid)) = 'MENTOR_ALREADY_BOOKED',
  'RULE: the same mentor cannot be booked twice by one startup');

-- Fill to the cap of 3.
select public.book_slot((select v from t where k='tok_a'), (select v from t where k='m2_t2')::uuid);
select public.book_slot((select v from t where k='tok_a'), (select v from t where k='m3_t3')::uuid);

select pg_temp.assert(
  (select (public.get_startup_dashboard((select v from t where k='tok_a'))->'quota'->>'used')::int) = 3,
  'quota reports 3 used');

select pg_temp.assert(
  pg_temp.code_of(public.book_slot((select v from t where k='tok_a'), (select v from t where k='m4_t4')::uuid)) = 'LIMIT_REACHED',
  'RULE: the 3-booking cap is enforced');

-- ---------------------------------------------------------------------------
do $$ begin raise notice E'\n=== SLOT AND MENTOR STATE ==='; end $$;

select pg_temp.assert(
  (public.admin_set_slot_status((select v from t where k='m4_t4')::uuid, 'closed')->>'ok')::boolean,
  'admin can close a free slot');

select pg_temp.assert(
  pg_temp.code_of(public.book_slot((select v from t where k='tok_b'), (select v from t where k='m4_t4')::uuid)) = 'SLOT_CLOSED',
  'RULE: a closed slot cannot be booked');

select pg_temp.assert(
  pg_temp.code_of(public.admin_set_slot_status((select v from t where k='m1_t1')::uuid, 'closed')) = 'SLOT_HAS_BOOKING',
  'closing a booked slot is refused, never silently orphaned');

-- Deactivating a mentor for the session blocks new bookings.
select public.admin_set_session_mentor_active(
  public.current_session_id(), (select id from public.mentors where slug='muna-balhamar'), false);
select public.admin_set_slot_status((select v from t where k='m4_t4')::uuid, 'open');

select pg_temp.assert(
  pg_temp.code_of(public.book_slot((select v from t where k='tok_b'), (select v from t where k='m4_t4')::uuid)) = 'MENTOR_INACTIVE',
  'RULE: an inactive mentor receives no new bookings');

select pg_temp.assert(
  (select count(*) from jsonb_array_elements(public.get_startup_dashboard((select v from t where k='tok_b'))->'mentors')) = 13,
  'startup view hides the deactivated mentor (13 of 14 visible)');

select public.admin_set_session_mentor_active(
  public.current_session_id(), (select id from public.mentors where slug='muna-balhamar'), true);

-- Inactive startup cannot book.
select public.admin_set_startup_active((select id from public.startups where slug='groupz'), false);
select pg_temp.assert(
  pg_temp.code_of(public.book_slot((select v from t where k='tok_b'), (select v from t where k='m4_t4')::uuid)) = 'STARTUP_INACTIVE',
  'RULE: an inactive startup cannot book');
select public.admin_set_startup_active((select id from public.startups where slug='groupz'), true);

-- ---------------------------------------------------------------------------
do $$ begin raise notice E'\n=== CANCELLATION FREES THE SLOT ==='; end $$;

select pg_temp.assert(
  pg_temp.code_of(public.cancel_my_booking(
    (select v from t where k='tok_a'),
    (select id from public.bookings where slot_id = (select v from t where k='m1_t1')::uuid and status='confirmed')
  )) = 'CANCELLATION_DISABLED',
  'startup self-cancellation is off by default');

select public.admin_cancel_booking(
  (select id from public.bookings where slot_id = (select v from t where k='m1_t1')::uuid and status='confirmed'),
  'test');

select pg_temp.assert(
  (public.book_slot((select v from t where k='tok_b'), (select v from t where k='m1_t1')::uuid)->>'ok')::boolean,
  'cancelling frees the slot with no second write (availability is derived)');

select pg_temp.assert(
  (select (public.get_startup_dashboard((select v from t where k='tok_a'))->'quota'->>'used')::int) = 2,
  'cancellation returns quota to the startup');

-- ---------------------------------------------------------------------------
do $$ begin raise notice E'\n=== NON-ADMIN IS LOCKED OUT ==='; end $$;

select set_config('test.user_id', '', false);
select pg_temp.assert(not public.is_admin(), 'is_admin() false with no auth user');
select pg_temp.assert(
  pg_temp.code_of(public.admin_overview()) = 'NOT_ADMIN', 'admin_overview refuses a non-admin');
select pg_temp.assert(
  pg_temp.code_of(public.admin_cancel_booking(gen_random_uuid())) = 'NOT_ADMIN', 'admin_cancel_booking refuses a non-admin');
select pg_temp.assert(
  pg_temp.code_of(public.admin_reset_startup_code(gen_random_uuid())) = 'NOT_ADMIN', 'admin_reset_startup_code refuses a non-admin');

-- ---------------------------------------------------------------------------
do $$ begin raise notice E'\n=== ANON CANNOT REACH TABLES DIRECTLY ==='; end $$;

do $$
declare v_leaked boolean := false;
begin
  set local role anon;
  begin
    perform 1 from public.startups limit 1;
    v_leaked := true;   -- reaching here at all means the table was readable
  exception when insufficient_privilege then
    v_leaked := false;
  end;
  reset role;
  perform pg_temp.assert(not v_leaked, 'anon cannot SELECT from startups (no table privilege)');
end $$;

do $$
declare v_leaked boolean := false;
begin
  set local role anon;
  begin
    perform 1 from public.bookings limit 1;
    v_leaked := true;
  exception when insufficient_privilege then
    v_leaked := false;
  end;
  reset role;
  perform pg_temp.assert(not v_leaked, 'anon cannot SELECT from bookings (booking identities never leak)');
end $$;

select pg_temp.assert(
  not has_column_privilege('authenticated', 'public.startups', 'access_code_hash', 'SELECT'),
  'access_code_hash is unreadable even by an authenticated admin');

select pg_temp.assert(
  not has_column_privilege('anon', 'public.startups', 'access_code_hash', 'SELECT'),
  'access_code_hash is unreadable by anon');

select pg_temp.assert(
  not has_column_privilege('authenticated', 'public.startup_auth_tokens', 'token', 'SELECT'),
  'session tokens are unreadable even by an authenticated admin');

-- Prove the rest of the row IS still readable, i.e. the lockdown is targeted
-- and did not just break the admin UI.
select pg_temp.assert(
  has_column_privilege('authenticated', 'public.startups', 'name_ar', 'SELECT'),
  'admin can still read ordinary startup columns');

-- ---------------------------------------------------------------------------
do $$ begin raise notice E'\n=== FUNCTION GRANTS ==='; end $$;

-- Postgres grants EXECUTE to PUBLIC by default, so this is the assertion that
-- catches a new function silently becoming world-callable.
select pg_temp.assert(
  (select array_agg(p.proname::text order by p.proname)
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE'))
  = array['book_slot','cancel_my_booking','get_startup_dashboard','list_startups',
          'startup_login','startup_logout','startup_session_info'],
  'anon can execute exactly the 7 intended public functions');

select pg_temp.assert(
  not has_function_privilege('anon', 'public.write_audit(public.actor_kind,text,text,text,uuid,jsonb)', 'EXECUTE'),
  'anon cannot write to the audit log (no forged history)');

select pg_temp.assert(
  not has_function_privilege('anon', 'public.startup_id_from_token(text)', 'EXECUTE'),
  'anon cannot resolve a token to an identity directly');

select pg_temp.assert(
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'admin\_%'
      and has_function_privilege('anon', p.oid, 'EXECUTE')) = 0,
  'anon cannot reach any admin_* function');

select pg_temp.assert(
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
      and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%')) = 0,
  'every SECURITY DEFINER function pins search_path');

select pg_temp.assert(
  (select count(*) from pg_policies where schemaname='public' and cmd <> 'SELECT') = 0,
  'no write policies exist — every mutation goes through an audited RPC');

select pg_temp.assert(
  (select count(*) from pg_tables where schemaname='public' and not rowsecurity) = 0,
  'RLS is enabled on every public table');

do $$ begin raise notice E'\n=== ALL RULE TESTS PASSED ===\n'; end $$;
