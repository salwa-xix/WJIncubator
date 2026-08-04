-- ============================================================================
-- 0010 — Admin read RPCs and per-slot management
-- ============================================================================
-- The admin UI needs shaped reads, and the admin needs to add or remove an
-- INDIVIDUAL slot rather than only regenerate a whole grid — a mentor who
-- arrives late or leaves early is a per-slot fact, not a session-wide one.
--
-- All of these carry the same is_admin() gate as 0008.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Sessions, with the counts needed to decide what to do next.
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_sessions()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare v jsonb;
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id, 'name', s.name, 'session_date', s.session_date,
    'starts_at', to_char(s.starts_at, 'HH24:MI'),
    'ends_at',   to_char(s.ends_at,   'HH24:MI'),
    'slot_minutes', s.slot_minutes,
    'max_bookings_per_startup', s.max_bookings_per_startup,
    'allow_startup_cancellation', s.allow_startup_cancellation,
    'block_duplicate_mentor', s.block_duplicate_mentor,
    'status', s.status,
    'mentors_assigned', (select count(*) from public.session_mentors where session_id = s.id),
    'mentors_active',   (select count(*) from public.session_mentors where session_id = s.id and is_active),
    'slots_total',      (select count(*) from public.slots where session_id = s.id),
    'bookings',         (select count(*) from public.bookings where session_id = s.id and status = 'confirmed')
  ) order by s.created_at desc), '[]'::jsonb) into v
  from public.sessions s;

  return public.rpc_ok(jsonb_build_object('sessions', v));
end;
$$;

-- ---------------------------------------------------------------------------
-- Every mentor profile, with its assignment state for one session.
-- Returns ALL profiles — assignment is a decision the admin makes here, so the
-- unassigned ones have to be visible to be assignable.
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_mentors(p_session_id uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare v jsonb; v_session uuid;
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;
  v_session := coalesce(p_session_id, public.current_session_id());

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id, 'slug', m.slug, 'name_ar', m.name_ar, 'name_en', m.name_en,
    'image_url', m.image_url, 'bio', m.bio, 'role', m.role,
    'availability_label', m.availability_label,
    'is_active', m.is_active,
    'assigned',  sm.id is not null,
    'session_active', coalesce(sm.is_active, false),
    'slots_total',  (select count(*) from public.slots sl
                      where sl.session_id = v_session and sl.mentor_id = m.id),
    'slots_closed', (select count(*) from public.slots sl
                      where sl.session_id = v_session and sl.mentor_id = m.id and sl.status = 'closed'),
    'bookings',     (select count(*) from public.bookings b
                      where b.session_id = v_session and b.mentor_id = m.id and b.status = 'confirmed'),
    'organizations', (select coalesce(jsonb_agg(jsonb_build_object(
                        'name', o.org_name, 'logo_url', o.org_logo_url) order by o.sort_order), '[]'::jsonb)
                        from public.mentor_organizations o where o.mentor_id = m.id)
  ) order by m.sort_order), '[]'::jsonb) into v
  from public.mentors m
  left join public.session_mentors sm on sm.mentor_id = m.id and sm.session_id = v_session;

  return public.rpc_ok(jsonb_build_object('session_id', v_session, 'mentors', v));
end;
$$;

-- ---------------------------------------------------------------------------
-- The slot grid for a session: every slot, its state, and who holds it.
-- Unlike the startup view, this one DOES name the booking startup — that is
-- the whole point of the admin surface.
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_slots(p_session_id uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare v jsonb; v_session uuid;
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;
  v_session := coalesce(p_session_id, public.current_session_id());

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', sl.id,
    'mentor_id', sl.mentor_id,
    'mentor_name', m.name_ar,
    'start_time', to_char(sl.start_time, 'HH24:MI'),
    'end_time',   to_char(sl.end_time,   'HH24:MI'),
    'status', sl.status,
    'mentor_session_active', sm.is_active,
    'booking_id', b.id,
    'booked_by', st.name_ar
  ) order by m.sort_order, sl.start_time), '[]'::jsonb) into v
  from public.slots sl
  join public.mentors m on m.id = sl.mentor_id
  join public.session_mentors sm on sm.session_id = sl.session_id and sm.mentor_id = sl.mentor_id
  left join public.bookings b on b.slot_id = sl.id and b.status = 'confirmed'
  left join public.startups st on st.id = b.startup_id
  where sl.session_id = v_session;

  return public.rpc_ok(jsonb_build_object(
    'session_id', v_session,
    'times', coalesce((select jsonb_agg(distinct to_char(start_time, 'HH24:MI'))
                         from public.slots where session_id = v_session), '[]'::jsonb),
    'slots', v));
end;
$$;

-- ---------------------------------------------------------------------------
-- Bookings, filterable. NULL filters mean "no filter", so the UI can pass
-- whatever the user has set without composing SQL client-side.
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_bookings(
  p_session_id uuid default null,
  p_startup_id uuid default null,
  p_mentor_id  uuid default null,
  p_start_time text default null,
  p_status     text default null
)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare v jsonb; v_session uuid;
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;
  v_session := coalesce(p_session_id, public.current_session_id());

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', b.id,
    'startup_id', b.startup_id, 'startup_name', st.name_ar, 'startup_logo', st.logo_url,
    'mentor_id', b.mentor_id,  'mentor_name', m.name_ar,
    'slot_id', b.slot_id,
    'start_time', to_char(b.start_time, 'HH24:MI'),
    'end_time',   to_char(sl.end_time,  'HH24:MI'),
    'session_date', se.session_date,
    'status', b.status,
    'created_at', b.created_at,
    'cancelled_at', b.cancelled_at,
    'cancelled_by', b.cancelled_by,
    'cancel_reason', b.cancel_reason
  ) order by b.start_time, st.sort_order), '[]'::jsonb) into v
  from public.bookings b
  join public.startups st on st.id = b.startup_id
  join public.mentors  m  on m.id  = b.mentor_id
  join public.slots    sl on sl.id = b.slot_id
  join public.sessions se on se.id = b.session_id
  where b.session_id = v_session
    and (p_startup_id is null or b.startup_id = p_startup_id)
    and (p_mentor_id  is null or b.mentor_id  = p_mentor_id)
    and (p_start_time is null or to_char(b.start_time, 'HH24:MI') = p_start_time)
    and (p_status     is null or b.status::text = p_status);

  return public.rpc_ok(jsonb_build_object('bookings', v));
end;
$$;

-- ---------------------------------------------------------------------------
-- Startups with their live quota for a session.
-- access_code_hash is not selected here and cannot be: no role holds the
-- column privilege (0005). Codes are set or reset, never read.
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_startups(p_session_id uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare v jsonb; v_session uuid;
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;
  v_session := coalesce(p_session_id, public.current_session_id());

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id, 'slug', s.slug, 'name_ar', s.name_ar, 'name_en', s.name_en,
    'logo_url', s.logo_url, 'sector', s.sector, 'stage', s.stage, 'hq', s.hq,
    'founder_name', s.founder_name,
    'is_active', s.is_active,
    'has_code', s.access_code_hash is not null,
    'max_bookings_override', s.max_bookings_override,
    'limit', coalesce(s.max_bookings_override,
                      (select max_bookings_per_startup from public.sessions where id = v_session)),
    'used', (select count(*) from public.bookings b
              where b.startup_id = s.id and b.session_id = v_session and b.status = 'confirmed')
  ) order by s.sort_order), '[]'::jsonb) into v
  from public.startups s;

  return public.rpc_ok(jsonb_build_object('startups', v));
end;
$$;

create or replace function public.admin_audit_log(p_limit integer default 50)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare v jsonb;
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'actor', a.actor, 'action', a.action,
    'entity', a.entity, 'entity_id', a.entity_id,
    'detail', a.detail, 'created_at', a.created_at
  ) order by a.id desc), '[]'::jsonb) into v
  from (select * from public.audit_log order by id desc limit greatest(p_limit, 1)) a;
  return public.rpc_ok(jsonb_build_object('entries', v));
end;
$$;

-- ---------------------------------------------------------------------------
-- Per-slot management
-- ---------------------------------------------------------------------------
-- Adding one slot to one mentor. The composite FK on `slots` already refuses a
-- mentor who is not assigned to the session, so an invalid pair cannot be
-- created even if this check were removed.
create or replace function public.admin_add_slot(
  p_session_id uuid, p_mentor_id uuid, p_start_time text, p_minutes integer default null
)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_session public.sessions%rowtype;
  v_start   time;
  v_id      uuid;
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;

  select * into v_session from public.sessions where id = p_session_id;
  if not found then return public.rpc_error('SESSION_NOT_FOUND'); end if;

  if p_start_time !~ '^[0-2][0-9]:[0-5][0-9]$' then
    return public.rpc_error('BAD_FORMAT');
  end if;
  v_start := p_start_time::time;

  if not exists (select 1 from public.session_mentors
                  where session_id = p_session_id and mentor_id = p_mentor_id) then
    return public.rpc_error('NOT_ASSIGNED');
  end if;

  insert into public.slots (session_id, mentor_id, start_time, end_time)
  values (p_session_id, p_mentor_id, v_start,
          (v_start + make_interval(mins => coalesce(p_minutes, v_session.slot_minutes))))
  on conflict (session_id, mentor_id, start_time) do nothing
  returning id into v_id;

  if v_id is null then return public.rpc_error('SLOT_EXISTS'); end if;

  perform public.write_audit('admin', auth.uid()::text, 'add_slot', 'slots', v_id,
                             jsonb_build_object('mentor_id', p_mentor_id, 'start_time', p_start_time));
  return public.rpc_ok(jsonb_build_object('slot_id', v_id));
end;
$$;

-- Deleting a slot is refused while it holds a confirmed booking. The FK from
-- bookings would refuse it anyway; failing here gives a usable reason instead
-- of a constraint violation.
create or replace function public.admin_delete_slot(p_slot_id uuid)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;

  if exists (select 1 from public.bookings
              where slot_id = p_slot_id and status = 'confirmed') then
    return public.rpc_error('SLOT_HAS_BOOKING');
  end if;

  delete from public.slots where id = p_slot_id;
  if not found then return public.rpc_error('SLOT_NOT_FOUND'); end if;

  perform public.write_audit('admin', auth.uid()::text, 'delete_slot', 'slots', p_slot_id, null);
  return public.rpc_ok();
end;
$$;

-- Bulk open/close for one mentor's whole row in the grid.
create or replace function public.admin_set_mentor_slots_status(
  p_session_id uuid, p_mentor_id uuid, p_status public.slot_status
)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare v_changed integer;
begin
  if not public.is_admin() then return public.rpc_error('NOT_ADMIN'); end if;

  update public.slots sl
     set status = p_status
   where sl.session_id = p_session_id
     and sl.mentor_id  = p_mentor_id
     -- Never close a slot out from under a confirmed booking.
     and (p_status = 'open'
          or not exists (select 1 from public.bookings b
                          where b.slot_id = sl.id and b.status = 'confirmed'));

  get diagnostics v_changed = row_count;
  perform public.write_audit('admin', auth.uid()::text, 'set_mentor_slots_status', 'mentors', p_mentor_id,
                             jsonb_build_object('status', p_status, 'changed', v_changed));
  return public.rpc_ok(jsonb_build_object('changed', v_changed));
end;
$$;

grant execute on function public.admin_list_sessions()                                  to authenticated;
grant execute on function public.admin_list_mentors(uuid)                               to authenticated;
grant execute on function public.admin_list_slots(uuid)                                 to authenticated;
grant execute on function public.admin_list_bookings(uuid, uuid, uuid, text, text)      to authenticated;
grant execute on function public.admin_list_startups(uuid)                              to authenticated;
grant execute on function public.admin_audit_log(integer)                               to authenticated;
grant execute on function public.admin_add_slot(uuid, uuid, text, integer)              to authenticated;
grant execute on function public.admin_delete_slot(uuid)                                to authenticated;
grant execute on function public.admin_set_mentor_slots_status(uuid, uuid, public.slot_status) to authenticated;
