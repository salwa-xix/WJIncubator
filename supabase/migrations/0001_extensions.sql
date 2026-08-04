-- ============================================================================
-- 0001 — Extensions
-- ============================================================================
-- pgcrypto provides gen_random_uuid() and the bcrypt crypt()/gen_salt() pair
-- used to hash startup access codes. It lives in the `extensions` schema so
-- that SECURITY DEFINER functions can run with `search_path = ''` and still
-- reach it by explicit qualification — an empty search_path is what stops a
-- caller from shadowing our function names with their own.
-- ============================================================================

create schema if not exists extensions;

create extension if not exists pgcrypto with schema extensions;

grant usage on schema extensions to public;
