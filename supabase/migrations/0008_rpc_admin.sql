-- ============================================================================
-- 0008 — Admin RPCs
-- ============================================================================
-- Every function begins with an is_admin() gate. Combined with 0005 (no write
-- policies on any table), this is the ONLY way anything mutates — so every
-- change is validated and audited, with no second path in.
--
-- Shared failure code: NOT_ADMIN.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Overview counters
-- ---------------------------------------------------------------------------
create or replace function public.admin_overview(p_session_id uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_session_id uuid;
  v_result     jsonb;
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;

  v_session_id := coalesce(p_session_id, public.current_session_id());

  select jsonb_build_object(
    'session_id',        v_session_id,
    'total_startups',    (select count(*) from public.startups),
    'active_startups',   (select count(*) from public.startups where is_active),
    'total_mentors',     (select count(*) from public.mentors),
    'session_mentors',   (select count(*) from public.session_mentors
                           where session_id = v_session_id and is_active),
    'total_slots',       (select count(*) from public.slots where session_id = v_session_id),
    'closed_slots',      (select count(*) from public.slots
                           where session_id = v_session_id and status = 'closed'),
    'booked_slots',      (select count(*) from public.bookings
                           where session_id = v_session_id and status = 'confirmed'),
    'available_slots',   (select count(*)
                            from public.slots sl
                            left join public.bookings b
                              on b.slot_id = sl.id and b.status = 'confirmed'
                           where sl.session_id = v_session_id
                             and sl.status = 'open'
                             and b.id is null),
    'confirmed_bookings',(select count(*) from public.bookings
                           where session_id = v_session_id and status = 'confirmed'),
    'cancelled_bookings',(select count(*) from public.bookings
                           where session_id = v_session_id and status = 'cancelled')
  ) into v_result;

  return public.rpc_ok(v_result);
end;
$$;

-- ---------------------------------------------------------------------------
-- Session management
-- ---------------------------------------------------------------------------
create or replace function public.admin_create_session(
  p_name text,
  p_session_date date default null,
  p_starts_at time default '17:00',
  p_ends_at time default '19:00',
  p_slot_minutes integer default 20,
  p_max_bookings integer default 3
)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare v_id uuid;
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;

  insert into public.sessions (name, session_date, starts_at, ends_at, slot_minutes, max_bookings_per_startup)
  values (p_name, p_session_date, p_starts_at, p_ends_at, p_slot_minutes, p_max_bookings)
  returning id into v_id;

  perform public.write_audit('admin', auth.uid()::text, 'create_session', 'sessions', v_id, null);
  return public.rpc_ok(jsonb_build_object('session_id', v_id));
end;
$$;

create or replace function public.admin_update_session(
  p_session_id uuid,
  p_name text default null,
  p_session_date date default null,
  p_max_bookings integer default null,
  p_allow_cancellation boolean default null,
  p_block_duplicate_mentor boolean default null
)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;

  update public.sessions set
    name                       = coalesce(p_name, name),
    session_date               = coalesce(p_session_date, session_date),
    max_bookings_per_startup   = coalesce(p_max_bookings, max_bookings_per_startup),
    allow_startup_cancellation = coalesce(p_allow_cancellation, allow_startup_cancellation),
    block_duplicate_mentor     = coalesce(p_block_duplicate_mentor, block_duplicate_mentor)
  where id = p_session_id;

  if not found then return public.rpc_error('SESSION_NOT_FOUND'); end if;

  perform public.write_audit('admin', auth.uid()::text, 'update_session', 'sessions', p_session_id, null);
  return public.rpc_ok();
end;
$$;

-- Opening a session closes whichever one was open. The partial unique index
-- guarantees at most one is open; doing the swap here keeps the admin from
-- having to sequence two calls correctly under time pressure.
create or replace function public.admin_open_session(p_session_id uuid)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare v_session public.sessions%rowtype;
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;

  select * into v_session from public.sessions where id = p_session_id for update;
  if not found then return public.rpc_error('SESSION_NOT_FOUND'); end if;
  if v_session.session_date is null then return public.rpc_error('SESSION_DATE_REQUIRED'); end if;
  if not exists (select 1 from public.slots where session_id = p_session_id) then
    return public.rpc_error('NO_SLOTS');
  end if;

  update public.sessions set status = 'closed' where status = 'open' and id <> p_session_id;
  update public.sessions set status = 'open'   where id = p_session_id;

  perform public.write_audit('admin', auth.uid()::text, 'open_session', 'sessions', p_session_id, null);
  return public.rpc_ok();
end;
$$;

create or replace function public.admin_close_session(p_session_id uuid)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;
  update public.sessions set status = 'closed' where id = p_session_id;
  if not found then return public.rpc_error('SESSION_NOT_FOUND'); end if;
  perform public.write_audit('admin', auth.uid()::text, 'close_session', 'sessions', p_session_id, null);
  return public.rpc_ok();
end;
$$;

-- ---------------------------------------------------------------------------
-- Mentor ↔ session assignment
-- ---------------------------------------------------------------------------
create or replace function public.admin_assign_mentors(p_session_id uuid, p_mentor_ids uuid[])
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare v_added integer;
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;

  insert into public.session_mentors (session_id, mentor_id, sort_order)
  select p_session_id, m.id, m.sort_order
    from public.mentors m
   where m.id = any(p_mentor_ids)
  on conflict (session_id, mentor_id) do nothing;

  get diagnostics v_added = row_count;
  perform public.write_audit('admin', auth.uid()::text, 'assign_mentors', 'sessions', p_session_id,
                             jsonb_build_object('added', v_added));
  return public.rpc_ok(jsonb_build_object('added', v_added));
end;
$$;

-- Unassigning cascades to that mentor's slots. Refused if any of those slots
-- holds a confirmed booking — silently deleting someone's booked session is
-- never the right default.
create or replace function public.admin_unassign_mentor(p_session_id uuid, p_mentor_id uuid)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;

  if exists (
    select 1 from public.bookings
     where session_id = p_session_id and mentor_id = p_mentor_id and status = 'confirmed'
  ) then
    return public.rpc_error('MENTOR_HAS_BOOKINGS');
  end if;

  delete from public.session_mentors
   where session_id = p_session_id and mentor_id = p_mentor_id;
  if not found then return public.rpc_error('NOT_ASSIGNED'); end if;

  perform public.write_audit('admin', auth.uid()::text, 'unassign_mentor', 'mentors', p_mentor_id,
                             jsonb_build_object('session_id', p_session_id));
  return public.rpc_ok();
end;
$$;

-- Deactivating hides a mentor from the startup view and blocks NEW bookings.
-- Existing bookings survive — they are commitments already made to a company.
create or replace function public.admin_set_session_mentor_active(
  p_session_id uuid, p_mentor_id uuid, p_active boolean
)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;

  update public.session_mentors set is_active = p_active
   where session_id = p_session_id and mentor_id = p_mentor_id;
  if not found then return public.rpc_error('NOT_ASSIGNED'); end if;

  perform public.write_audit('admin', auth.uid()::text,
    case when p_active then 'activate_mentor' else 'deactivate_mentor' end,
    'mentors', p_mentor_id, jsonb_build_object('session_id', p_session_id));
  return public.rpc_ok();
end;
$$;

-- ---------------------------------------------------------------------------
-- Slot generation and control
-- ---------------------------------------------------------------------------
-- Builds the time grid from the session's own configuration (starts_at,
-- ends_at, slot_minutes) for every active assigned mentor. Idempotent, so it
-- is safe to re-run after assigning more mentors. Nothing about the number of
-- mentors or slots is hardcoded — a different event is different rows.
create or replace function public.admin_generate_slots(p_session_id uuid)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_session public.sessions%rowtype;
  v_created integer;
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;

  select * into v_session from public.sessions where id = p_session_id;
  if not found then return public.rpc_error('SESSION_NOT_FOUND'); end if;

  insert into public.slots (session_id, mentor_id, start_time, end_time)
  select p_session_id,
         sm.mentor_id,
         g.ts::time,
         (g.ts + make_interval(mins => v_session.slot_minutes))::time
    from public.session_mentors sm
    cross join lateral (
      select generate_series(
               date '2000-01-01' + v_session.starts_at,
               date '2000-01-01' + v_session.ends_at
                 - make_interval(mins => v_session.slot_minutes),
               make_interval(mins => v_session.slot_minutes)
             ) as ts
    ) g
   where sm.session_id = p_session_id
     and sm.is_active
  on conflict (session_id, mentor_id, start_time) do nothing;

  get diagnostics v_created = row_count;
  perform public.write_audit('admin', auth.uid()::text, 'generate_slots', 'sessions', p_session_id,
                             jsonb_build_object('created', v_created));
  return public.rpc_ok(jsonb_build_object('created', v_created));
end;
$$;

-- Closing a slot that holds a confirmed booking is refused rather than
-- silently orphaning it. The admin must cancel the booking first, which is a
-- decision someone should make consciously.
create or replace function public.admin_set_slot_status(p_slot_id uuid, p_status public.slot_status)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;

  if p_status = 'closed' and exists (
    select 1 from public.bookings where slot_id = p_slot_id and status = 'confirmed'
  ) then
    return public.rpc_error('SLOT_HAS_BOOKING');
  end if;

  update public.slots set status = p_status where id = p_slot_id;
  if not found then return public.rpc_error('SLOT_NOT_FOUND'); end if;

  perform public.write_audit('admin', auth.uid()::text, 'set_slot_status', 'slots', p_slot_id,
                             jsonb_build_object('status', p_status));
  return public.rpc_ok();
end;
$$;

-- ---------------------------------------------------------------------------
-- Booking management
-- ---------------------------------------------------------------------------
create or replace function public.admin_cancel_booking(p_booking_id uuid, p_reason text default null)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare v_booking public.bookings%rowtype;
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then return public.rpc_error('BOOKING_NOT_FOUND'); end if;
  if v_booking.status <> 'confirmed' then return public.rpc_error('ALREADY_CANCELLED'); end if;

  update public.bookings
     set status = 'cancelled', cancelled_at = now(), cancelled_by = 'admin', cancel_reason = p_reason
   where id = p_booking_id;

  -- The slot is free again with no second write: availability is derived.
  perform public.write_audit('admin', auth.uid()::text, 'cancel_booking', 'bookings', p_booking_id,
                             jsonb_build_object('reason', p_reason));
  return public.rpc_ok();
end;
$$;

-- Moving a booking re-runs the same rules a fresh booking would face, so a
-- reassignment can never create a state that booking could not.
create or replace function public.admin_reassign_booking(p_booking_id uuid, p_new_slot_id uuid)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
  v_slot    public.slots%rowtype;
  v_session public.sessions%rowtype;
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then return public.rpc_error('BOOKING_NOT_FOUND'); end if;
  if v_booking.status <> 'confirmed' then return public.rpc_error('ALREADY_CANCELLED'); end if;

  select * into v_slot from public.slots where id = p_new_slot_id for update;
  if not found then return public.rpc_error('SLOT_NOT_FOUND'); end if;
  if v_slot.status <> 'open' then return public.rpc_error('SLOT_CLOSED'); end if;
  if v_slot.session_id <> v_booking.session_id then return public.rpc_error('CROSS_SESSION'); end if;

  if exists (select 1 from public.bookings b
              where b.slot_id = v_slot.id and b.status = 'confirmed' and b.id <> p_booking_id) then
    return public.rpc_error('SLOT_TAKEN');
  end if;

  if exists (select 1 from public.bookings b
              where b.startup_id = v_booking.startup_id
                and b.session_id = v_booking.session_id
                and b.start_time = v_slot.start_time
                and b.status = 'confirmed'
                and b.id <> p_booking_id) then
    return public.rpc_error('TIME_CONFLICT');
  end if;

  select * into v_session from public.sessions where id = v_booking.session_id;
  if v_session.block_duplicate_mentor and exists (
    select 1 from public.bookings b
     where b.startup_id = v_booking.startup_id
       and b.session_id = v_booking.session_id
       and b.mentor_id  = v_slot.mentor_id
       and b.status = 'confirmed'
       and b.id <> p_booking_id
  ) then
    return public.rpc_error('MENTOR_ALREADY_BOOKED');
  end if;

  update public.bookings
     set slot_id = v_slot.id, mentor_id = v_slot.mentor_id, start_time = v_slot.start_time
   where id = p_booking_id;

  perform public.write_audit('admin', auth.uid()::text, 'reassign_booking', 'bookings', p_booking_id,
                             jsonb_build_object('new_slot_id', p_new_slot_id));
  return public.rpc_ok();
exception
  when unique_violation then
    return public.rpc_error('SLOT_TAKEN');
end;
$$;

-- ---------------------------------------------------------------------------
-- Startup management
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_startup_active(p_startup_id uuid, p_active boolean)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;
  update public.startups set is_active = p_active where id = p_startup_id;
  if not found then return public.rpc_error('STARTUP_NOT_FOUND'); end if;
  perform public.write_audit('admin', auth.uid()::text, 'set_startup_active', 'startups', p_startup_id,
                             jsonb_build_object('active', p_active));
  return public.rpc_ok();
end;
$$;

create or replace function public.admin_set_startup_limit(p_startup_id uuid, p_override integer)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;
  update public.startups set max_bookings_override = p_override where id = p_startup_id;
  if not found then return public.rpc_error('STARTUP_NOT_FOUND'); end if;
  perform public.write_audit('admin', auth.uid()::text, 'set_startup_limit', 'startups', p_startup_id,
                             jsonb_build_object('override', p_override));
  return public.rpc_ok();
end;
$$;

-- Set a specific code (used when the organiser supplies their own list).
create or replace function public.admin_set_startup_code(p_startup_id uuid, p_code text)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;
  if p_code is null or p_code !~ '^[0-9]{4}$' then return public.rpc_error('BAD_FORMAT'); end if;

  update public.startups
     set access_code_hash = extensions.crypt(p_code, extensions.gen_salt('bf', 10))
   where id = p_startup_id;
  if not found then return public.rpc_error('STARTUP_NOT_FOUND'); end if;

  -- The code itself is never logged.
  perform public.write_audit('admin', auth.uid()::text, 'set_startup_code', 'startups', p_startup_id, null);
  return public.rpc_ok();
end;
$$;

-- Generate a fresh random code and return it ONCE. Because codes are stored as
-- bcrypt hashes they cannot be read back later — reset-and-reveal is the only
-- honest affordance, and it is strictly better than a readable password column.
create or replace function public.admin_reset_startup_code(p_startup_id uuid)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_rand bytea;
  v_code text;
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;

  v_rand := extensions.gen_random_bytes(3);
  v_code := lpad(((get_byte(v_rand,0)::int * 65536
                 + get_byte(v_rand,1)::int * 256
                 + get_byte(v_rand,2)::int) % 10000)::text, 4, '0');

  update public.startups
     set access_code_hash = extensions.crypt(v_code, extensions.gen_salt('bf', 10))
   where id = p_startup_id;
  if not found then return public.rpc_error('STARTUP_NOT_FOUND'); end if;

  perform public.write_audit('admin', auth.uid()::text, 'reset_startup_code', 'startups', p_startup_id, null);
  return public.rpc_ok(jsonb_build_object('code', v_code));
end;
$$;

-- ---------------------------------------------------------------------------
-- Mentor profile management
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_mentor_active(p_mentor_id uuid, p_active boolean)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;
  update public.mentors set is_active = p_active where id = p_mentor_id;
  if not found then return public.rpc_error('MENTOR_NOT_FOUND'); end if;
  perform public.write_audit('admin', auth.uid()::text, 'set_mentor_active', 'mentors', p_mentor_id,
                             jsonb_build_object('active', p_active));
  return public.rpc_ok();
end;
$$;

create or replace function public.admin_update_mentor(
  p_mentor_id uuid,
  p_name_ar text default null,
  p_name_en text default null,
  p_bio text default null,
  p_role text default null,
  p_image_url text default null,
  p_availability_label text default null
)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;

  update public.mentors set
    name_ar            = coalesce(p_name_ar, name_ar),
    name_en            = coalesce(p_name_en, name_en),
    bio                = coalesce(p_bio, bio),
    role               = coalesce(p_role, role),
    image_url          = coalesce(p_image_url, image_url),
    availability_label = coalesce(p_availability_label, availability_label)
  where id = p_mentor_id;
  if not found then return public.rpc_error('MENTOR_NOT_FOUND'); end if;

  perform public.write_audit('admin', auth.uid()::text, 'update_mentor', 'mentors', p_mentor_id, null);
  return public.rpc_ok();
end;
$$;

-- Deletion is refused while any booking references the mentor, in any session,
-- cancelled or not — the record of what happened matters more than tidiness.
create or replace function public.admin_delete_mentor(p_mentor_id uuid)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;

  if exists (select 1 from public.bookings where mentor_id = p_mentor_id) then
    return public.rpc_error('MENTOR_HAS_BOOKINGS');
  end if;

  delete from public.mentors where id = p_mentor_id;
  if not found then return public.rpc_error('MENTOR_NOT_FOUND'); end if;

  perform public.write_audit('admin', auth.uid()::text, 'delete_mentor', 'mentors', p_mentor_id, null);
  return public.rpc_ok();
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants — authenticated only. The is_admin() gate inside each function is the
-- real check; this simply keeps anon from even reaching them.
-- ---------------------------------------------------------------------------
grant execute on function public.admin_overview(uuid)                                        to authenticated;
grant execute on function public.admin_create_session(text, date, time, time, integer, integer) to authenticated;
grant execute on function public.admin_update_session(uuid, text, date, integer, boolean, boolean) to authenticated;
grant execute on function public.admin_open_session(uuid)                                    to authenticated;
grant execute on function public.admin_close_session(uuid)                                   to authenticated;
grant execute on function public.admin_assign_mentors(uuid, uuid[])                          to authenticated;
grant execute on function public.admin_unassign_mentor(uuid, uuid)                           to authenticated;
grant execute on function public.admin_set_session_mentor_active(uuid, uuid, boolean)        to authenticated;
grant execute on function public.admin_generate_slots(uuid)                                  to authenticated;
grant execute on function public.admin_set_slot_status(uuid, public.slot_status)             to authenticated;
grant execute on function public.admin_cancel_booking(uuid, text)                            to authenticated;
grant execute on function public.admin_reassign_booking(uuid, uuid)                          to authenticated;
grant execute on function public.admin_set_startup_active(uuid, boolean)                     to authenticated;
grant execute on function public.admin_set_startup_limit(uuid, integer)                      to authenticated;
grant execute on function public.admin_set_startup_code(uuid, text)                          to authenticated;
grant execute on function public.admin_reset_startup_code(uuid)                              to authenticated;
grant execute on function public.admin_set_mentor_active(uuid, boolean)                      to authenticated;
grant execute on function public.admin_update_mentor(uuid, text, text, text, text, text, text) to authenticated;
grant execute on function public.admin_delete_mentor(uuid)                                   to authenticated;
