-- ============================================================================
-- 0007 — Startup booking RPCs
-- ============================================================================

-- ---------------------------------------------------------------------------
-- get_startup_dashboard — everything the dashboard needs, in one round trip.
-- ---------------------------------------------------------------------------
-- Slot state is reported as one of: available | booked | mine | closed.
-- "booked" deliberately carries no identity: a startup learns that a slot is
-- taken, never by whom. That is also why this is an RPC rather than a
-- subscribable view — a realtime payload of the bookings table would leak it.
-- ---------------------------------------------------------------------------
create or replace function public.get_startup_dashboard(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_startup_id uuid;
  v_startup    public.startups%rowtype;
  v_session    public.sessions%rowtype;
  v_limit      integer;
  v_used       integer;
  v_mentors    jsonb;
  v_bookings   jsonb;
begin
  v_startup_id := public.startup_id_from_token(p_token);
  if v_startup_id is null then
    return public.rpc_error('INVALID_SESSION');
  end if;

  select * into v_startup from public.startups where id = v_startup_id;

  select * into v_session from public.sessions where status = 'open';
  if not found then
    -- No event is open. A real state, not an error the user caused.
    return public.rpc_ok(jsonb_build_object(
      'startup', jsonb_build_object(
        'id', v_startup.id, 'name_ar', v_startup.name_ar,
        'name_en', v_startup.name_en, 'logo_url', v_startup.logo_url,
        'is_active', v_startup.is_active),
      'session',  null,
      'quota',    null,
      'bookings', '[]'::jsonb,
      'mentors',  '[]'::jsonb
    ));
  end if;

  v_limit := public.effective_max_bookings(v_startup_id, v_session.id);

  select count(*) into v_used
    from public.bookings b
   where b.startup_id = v_startup_id
     and b.session_id = v_session.id
     and b.status = 'confirmed';

  -- Mentors active for THIS session only, each with their slots.
  select coalesce(jsonb_agg(m_row order by m_row->>'sort_order'), '[]'::jsonb)
    into v_mentors
  from (
    select jsonb_build_object(
             'id',                 m.id,
             'name_ar',            m.name_ar,
             'name_en',            m.name_en,
             'image_url',          m.image_url,
             'bio',                m.bio,
             'role',               m.role,
             'availability_label', m.availability_label,
             'sort_order',         lpad(sm.sort_order::text, 6, '0'),
             'organizations',      (
               select coalesce(jsonb_agg(jsonb_build_object(
                        'name', o.org_name, 'logo_url', o.org_logo_url
                      ) order by o.sort_order), '[]'::jsonb)
                 from public.mentor_organizations o
                where o.mentor_id = m.id
             ),
             'slots', (
               select coalesce(jsonb_agg(jsonb_build_object(
                        'id',         sl.id,
                        'start_time', to_char(sl.start_time, 'HH24:MI'),
                        'end_time',   to_char(sl.end_time,   'HH24:MI'),
                        'state',
                          case
                            when sl.status = 'closed'            then 'closed'
                            when b.startup_id = v_startup_id     then 'mine'
                            when b.id is not null                then 'booked'
                            else 'available'
                          end
                      ) order by sl.start_time), '[]'::jsonb)
                 from public.slots sl
                 left join public.bookings b
                        on b.slot_id = sl.id and b.status = 'confirmed'
                where sl.session_id = v_session.id
                  and sl.mentor_id  = m.id
             )
           ) as m_row
      from public.session_mentors sm
      join public.mentors m on m.id = sm.mentor_id
     where sm.session_id = v_session.id
       and sm.is_active
       and m.is_active
  ) t;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id',           b.id,
           'mentor_id',    b.mentor_id,
           'mentor_name',  m.name_ar,
           'mentor_image', m.image_url,
           'start_time',   to_char(b.start_time, 'HH24:MI'),
           'end_time',     to_char(sl.end_time,  'HH24:MI'),
           'status',       b.status,
           'created_at',   b.created_at
         ) order by b.start_time), '[]'::jsonb)
    into v_bookings
    from public.bookings b
    join public.mentors m on m.id = b.mentor_id
    join public.slots  sl on sl.id = b.slot_id
   where b.startup_id = v_startup_id
     and b.session_id = v_session.id
     and b.status = 'confirmed';

  return public.rpc_ok(jsonb_build_object(
    'startup', jsonb_build_object(
      'id', v_startup.id, 'name_ar', v_startup.name_ar,
      'name_en', v_startup.name_en, 'logo_url', v_startup.logo_url,
      'is_active', v_startup.is_active),
    'session', jsonb_build_object(
      'id', v_session.id, 'name', v_session.name,
      'session_date', v_session.session_date,
      'allow_cancellation', v_session.allow_startup_cancellation),
    'quota', jsonb_build_object(
      'limit', v_limit, 'used', v_used, 'remaining', greatest(v_limit - v_used, 0)),
    'bookings', v_bookings,
    'mentors',  v_mentors
  ));
end;
$$;

-- ---------------------------------------------------------------------------
-- book_slot — the one write path for startups.
-- ---------------------------------------------------------------------------
-- Failure codes:
--   INVALID_SESSION · STARTUP_INACTIVE · SLOT_NOT_FOUND · SLOT_CLOSED
--   SESSION_CLOSED  · MENTOR_INACTIVE  · SLOT_TAKEN     · LIMIT_REACHED
--   TIME_CONFLICT   · MENTOR_ALREADY_BOOKED
--
-- Locking: the startup row is locked BEFORE the slot row, always in that
-- order. Two startups racing the same slot contend on the slot; one startup
-- double-clicking contends on itself. A fixed lock order means no cycle, so
-- these can never deadlock. Holding the startup lock is what makes the
-- per-startup counts below safe to read with a plain SELECT.
-- ---------------------------------------------------------------------------
create or replace function public.book_slot(p_token text, p_slot_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_startup_id uuid;
  v_startup    public.startups%rowtype;
  v_slot       public.slots%rowtype;
  v_session    public.sessions%rowtype;
  v_limit      integer;
  v_used       integer;
  v_booking_id uuid;
begin
  v_startup_id := public.startup_id_from_token(p_token);
  if v_startup_id is null then
    return public.rpc_error('INVALID_SESSION');
  end if;

  -- (1) Lock this startup. Serialises its own concurrent attempts.
  select * into v_startup from public.startups where id = v_startup_id for update;
  if not v_startup.is_active then
    return public.rpc_error('STARTUP_INACTIVE');
  end if;

  -- (2) Lock the slot. Arbitrates between competing startups.
  select * into v_slot from public.slots where id = p_slot_id for update;
  if not found then
    return public.rpc_error('SLOT_NOT_FOUND');
  end if;
  if v_slot.status <> 'open' then
    return public.rpc_error('SLOT_CLOSED');
  end if;

  -- (3) The slot must belong to the session that is currently open.
  select * into v_session from public.sessions where id = v_slot.session_id;
  if v_session.status <> 'open' then
    return public.rpc_error('SESSION_CLOSED');
  end if;

  -- (4) Mentor must be assigned to this session, active for it, and not archived.
  if not exists (
    select 1
      from public.session_mentors sm
      join public.mentors m on m.id = sm.mentor_id
     where sm.session_id = v_slot.session_id
       and sm.mentor_id  = v_slot.mentor_id
       and sm.is_active
       and m.is_active
  ) then
    return public.rpc_error('MENTOR_INACTIVE');
  end if;

  -- (5) Already taken? (The unique index re-checks this at INSERT.)
  if exists (
    select 1 from public.bookings b
     where b.slot_id = v_slot.id and b.status = 'confirmed'
  ) then
    return public.rpc_error('SLOT_TAKEN');
  end if;

  -- (6) Booking cap — session default, or this startup's override.
  v_limit := public.effective_max_bookings(v_startup_id, v_slot.session_id);
  select count(*) into v_used
    from public.bookings b
   where b.startup_id = v_startup_id
     and b.session_id = v_slot.session_id
     and b.status = 'confirmed';
  if v_used >= v_limit then
    return public.rpc_error('LIMIT_REACHED', jsonb_build_object('limit', v_limit));
  end if;

  -- (7) No two bookings at the same moment.
  if exists (
    select 1 from public.bookings b
     where b.startup_id = v_startup_id
       and b.session_id = v_slot.session_id
       and b.start_time = v_slot.start_time
       and b.status = 'confirmed'
  ) then
    return public.rpc_error('TIME_CONFLICT');
  end if;

  -- (8) Same mentor twice — per-session policy.
  if v_session.block_duplicate_mentor and exists (
    select 1 from public.bookings b
     where b.startup_id = v_startup_id
       and b.session_id = v_slot.session_id
       and b.mentor_id  = v_slot.mentor_id
       and b.status = 'confirmed'
  ) then
    return public.rpc_error('MENTOR_ALREADY_BOOKED');
  end if;

  insert into public.bookings (startup_id, slot_id, session_id, mentor_id, start_time)
  values (v_startup_id, v_slot.id, v_slot.session_id, v_slot.mentor_id, v_slot.start_time)
  returning id into v_booking_id;

  perform public.write_audit('startup', v_startup_id::text, 'book', 'bookings', v_booking_id,
                             jsonb_build_object('slot_id', v_slot.id, 'mentor_id', v_slot.mentor_id));

  return public.rpc_ok(jsonb_build_object(
    'booking_id', v_booking_id,
    'used',       v_used + 1,
    'remaining',  greatest(v_limit - (v_used + 1), 0)
  ));

exception
  when unique_violation then
    -- Final backstop. If two transactions somehow both cleared step (5), the
    -- partial unique index rejects the second INSERT. The rule holds even if
    -- the checks above are wrong.
    return public.rpc_error('SLOT_TAKEN');
end;
$$;

-- ---------------------------------------------------------------------------
-- cancel_my_booking — only when the session permits it.
-- Cancelling frees the slot automatically: availability is derived from the
-- existence of a confirmed booking, so there is no second write to forget.
-- ---------------------------------------------------------------------------
create or replace function public.cancel_my_booking(p_token text, p_booking_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_startup_id uuid;
  v_booking    public.bookings%rowtype;
  v_session    public.sessions%rowtype;
begin
  v_startup_id := public.startup_id_from_token(p_token);
  if v_startup_id is null then
    return public.rpc_error('INVALID_SESSION');
  end if;

  select * into v_booking from public.bookings
   where id = p_booking_id and startup_id = v_startup_id
   for update;
  if not found then
    return public.rpc_error('BOOKING_NOT_FOUND');
  end if;
  if v_booking.status <> 'confirmed' then
    return public.rpc_error('ALREADY_CANCELLED');
  end if;

  select * into v_session from public.sessions where id = v_booking.session_id;
  if not v_session.allow_startup_cancellation then
    return public.rpc_error('CANCELLATION_DISABLED');
  end if;
  if v_session.status <> 'open' then
    return public.rpc_error('SESSION_CLOSED');
  end if;

  update public.bookings
     set status = 'cancelled', cancelled_at = now(), cancelled_by = 'startup'
   where id = p_booking_id;

  perform public.write_audit('startup', v_startup_id::text, 'cancel', 'bookings', p_booking_id, null);
  return public.rpc_ok();
end;
$$;

grant execute on function public.get_startup_dashboard(text)   to anon, authenticated;
grant execute on function public.book_slot(text, uuid)         to anon, authenticated;
grant execute on function public.cancel_my_booking(text, uuid) to anon, authenticated;
