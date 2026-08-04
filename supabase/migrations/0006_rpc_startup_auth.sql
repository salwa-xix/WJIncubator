-- ============================================================================
-- 0006 — Startup authentication RPCs
-- ============================================================================
-- Startups do not have Supabase Auth accounts. They pick their company from a
-- list and enter a private 4-digit code, which is verified HERE, server-side,
-- against a bcrypt hash. The code never leaves the database and the hash never
-- leaves the server, so no amount of client inspection reveals another
-- company's code.
--
-- A 4-digit code is 10,000 combinations — small enough that guessing is a real
-- attack. `startup_login` therefore throttles per startup.
-- ============================================================================

-- Login dropdown source. Returns identity and branding only; there is no
-- column here that could hint at a code.
create or replace function public.list_startups()
returns table (
  id        uuid,
  name_ar   text,
  name_en   text,
  logo_url  text,
  is_active boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.name_ar, s.name_en, s.logo_url, s.is_active
    from public.startups s
   order by s.sort_order, s.name_ar;
$$;

-- ---------------------------------------------------------------------------
-- startup_login
-- ---------------------------------------------------------------------------
-- Failure codes: INVALID_CODE, STARTUP_INACTIVE, TOO_MANY_ATTEMPTS, BAD_FORMAT
--
-- "no code set" and "wrong code" both return INVALID_CODE on purpose — telling
-- them apart would let someone map which startups are provisioned.
-- ---------------------------------------------------------------------------
create or replace function public.startup_login(p_startup_id uuid, p_code text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_startup    public.startups%rowtype;
  v_failures   integer;
  v_token      text;
  v_ttl        interval := interval '12 hours';
begin
  -- Codes are TEXT, not integers: '0042' must survive as '0042'.
  if p_code is null or p_code !~ '^[0-9]{4}$' then
    return public.rpc_error('BAD_FORMAT');
  end if;

  select * into v_startup from public.startups where id = p_startup_id;
  if not found then
    return public.rpc_error('INVALID_CODE');
  end if;

  -- Throttle: 5 failures in 15 minutes locks this startup out of further
  -- attempts. Counted per startup, which is the thing being guessed.
  select count(*) into v_failures
    from public.login_attempts
   where startup_id = p_startup_id
     and succeeded = false
     and created_at > now() - interval '15 minutes';

  if v_failures >= 5 then
    return public.rpc_error('TOO_MANY_ATTEMPTS');
  end if;

  if v_startup.access_code_hash is null
     or extensions.crypt(p_code, v_startup.access_code_hash) <> v_startup.access_code_hash then
    insert into public.login_attempts (startup_id, succeeded) values (p_startup_id, false);
    return public.rpc_error('INVALID_CODE');
  end if;

  -- Correct code, but the company is switched off.
  if not v_startup.is_active then
    insert into public.login_attempts (startup_id, succeeded) values (p_startup_id, true);
    return public.rpc_error('STARTUP_INACTIVE');
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.startup_auth_tokens (token, startup_id, expires_at)
  values (v_token, p_startup_id, now() + v_ttl);

  insert into public.login_attempts (startup_id, succeeded) values (p_startup_id, true);
  perform public.write_audit('startup', p_startup_id::text, 'login', 'startups', p_startup_id, null);

  return public.rpc_ok(jsonb_build_object(
    'token',      v_token,
    'expires_at', now() + v_ttl,
    'startup',    jsonb_build_object(
      'id',       v_startup.id,
      'name_ar',  v_startup.name_ar,
      'name_en',  v_startup.name_en,
      'logo_url', v_startup.logo_url
    )
  ));
end;
$$;

create or replace function public.startup_logout(p_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  update public.startup_auth_tokens
     set revoked_at = now()
   where token = p_token
     and revoked_at is null;
  return public.rpc_ok();
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants. These four are the ENTIRE public surface for an unauthenticated
-- client: list the companies, log in, log out. Nothing else is reachable.
-- ---------------------------------------------------------------------------
grant execute on function public.list_startups()                to anon, authenticated;
grant execute on function public.startup_login(uuid, text)      to anon, authenticated;
grant execute on function public.startup_logout(text)           to anon, authenticated;
