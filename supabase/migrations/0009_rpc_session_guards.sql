-- ============================================================================
-- 0009 — Session guard RPCs
-- ============================================================================
-- Route guards need to answer "is this session still valid?" on every
-- navigation. Answering it with get_startup_dashboard() would drag the whole
-- mentor grid along for a yes/no, so both sides get a cheap dedicated check.
-- ============================================================================

-- Validates a startup token and returns just enough to render a header.
-- Also the single place the client learns a session has expired.
create or replace function public.startup_session_info(p_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_startup_id uuid;
  v_startup    public.startups%rowtype;
begin
  v_startup_id := public.startup_id_from_token(p_token);
  if v_startup_id is null then
    return public.rpc_error('INVALID_SESSION');
  end if;

  select * into v_startup from public.startups where id = v_startup_id;

  -- A company switched off mid-event loses access on its next navigation
  -- rather than at its next booking attempt.
  if not v_startup.is_active then
    return public.rpc_error('STARTUP_INACTIVE');
  end if;

  return public.rpc_ok(jsonb_build_object(
    'startup', jsonb_build_object(
      'id',       v_startup.id,
      'name_ar',  v_startup.name_ar,
      'name_en',  v_startup.name_en,
      'logo_url', v_startup.logo_url
    )
  ));
end;
$$;

-- Admin guard. is_admin() is already used inside RLS policies, but the client
-- needs to call it directly to decide whether to render the admin shell — a
-- valid Supabase Auth login that is not in admin_users must not get in.
grant execute on function public.is_admin() to authenticated;

grant execute on function public.startup_session_info(text) to anon, authenticated;
