-- ============================================================================
-- LOCAL TEST SHIM — not applied to Supabase.
-- ============================================================================
-- Supabase provides the `auth` schema, `auth.uid()`, and the `anon` /
-- `authenticated` roles. A plain Postgres instance does not. This file
-- recreates just enough of them that the real migrations can be applied and
-- exercised locally, unmodified.
--
-- Applied only by `npm run db:test`. Never part of the migration sequence.
-- ============================================================================

create schema if not exists auth;

create table if not exists auth.users (
  id    uuid primary key default gen_random_uuid(),
  email text unique
);

-- Supabase derives this from the request JWT. Locally we drive it with a GUC
-- so tests can act as a specific admin, or as nobody.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('test.user_id', true), '')::uuid;
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth   to anon, authenticated, service_role;
