-- ============================================================================
-- 0004 — Internal helpers
-- ============================================================================
-- Every function here is SECURITY DEFINER with `search_path = ''`. The empty
-- search path is deliberate: it forces full qualification of every identifier,
-- so a caller cannot shadow a table or function name and have our elevated
-- function resolve to theirs instead.
-- ============================================================================

-- Is the current Supabase Auth user an admin?
-- SECURITY DEFINER because admin_users is itself behind RLS — a plain query
-- would be filtered by the very policy that calls this.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users a where a.user_id = auth.uid()
  );
$$;

-- The single open session, or NULL. Guaranteed unique by sessions_only_one_open.
create or replace function public.current_session_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.id from public.sessions s where s.status = 'open' limit 1;
$$;

-- Resolve an opaque startup token to a startup id, or NULL if the token is
-- unknown, expired or revoked. Touches last_seen_at so idle sessions are
-- visible to the admin.
create or replace function public.startup_id_from_token(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_startup_id uuid;
begin
  if p_token is null or length(p_token) < 20 then
    return null;
  end if;

  update public.startup_auth_tokens
     set last_seen_at = now()
   where token = p_token
     and revoked_at is null
     and expires_at > now()
  returning startup_id into v_startup_id;

  return v_startup_id;
end;
$$;

-- The booking cap that actually applies: the session default unless this
-- startup carries an explicit override.
create or replace function public.effective_max_bookings(p_startup_id uuid, p_session_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(st.max_bookings_override, se.max_bookings_per_startup)
    from public.startups st
    cross join public.sessions se
   where st.id = p_startup_id
     and se.id = p_session_id;
$$;

-- Uniform result envelopes, so every RPC speaks the same shape and the client
-- can map `code` to an Arabic message in one place.
create or replace function public.rpc_error(p_code text, p_detail jsonb default null)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object('ok', false, 'code', p_code) ||
         coalesce(jsonb_build_object('detail', p_detail), '{}'::jsonb);
$$;

create or replace function public.rpc_ok(p_data jsonb default '{}'::jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object('ok', true) || coalesce(p_data, '{}'::jsonb);
$$;

create or replace function public.write_audit(
  p_actor public.actor_kind,
  p_actor_id text,
  p_action text,
  p_entity text default null,
  p_entity_id uuid default null,
  p_detail jsonb default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_log (actor, actor_id, action, entity, entity_id, detail)
  values (p_actor, p_actor_id, p_action, p_entity, p_entity_id, p_detail);
$$;
