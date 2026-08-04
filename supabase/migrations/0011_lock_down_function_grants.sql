-- ============================================================================
-- 0011 — Lock down function EXECUTE grants
-- ============================================================================
-- Postgres grants EXECUTE on every new function to PUBLIC by default. The
-- explicit `grant execute ... to anon/authenticated` statements in the earlier
-- migrations therefore ADDED nothing that was not already there — and left the
-- default in place.
--
-- The practical consequences before this migration:
--
--   • anon could call every admin_* function. They are gated by is_admin() so
--     they returned NOT_ADMIN rather than acting, but an unauthenticated
--     caller could still enumerate the entire admin surface.
--
--   • anon could call write_audit() directly, which is SECURITY DEFINER and
--     inserts whatever it is handed. That is arbitrary audit-log injection:
--     an attacker could forge entries, or bury a real one under noise. The
--     audit log is the record of what happened, so a writable one is worse
--     than none.
--
--   • anon could call startup_id_from_token(), turning a stolen or guessed
--     token into a confirmed startup id without going through any RPC that
--     checks anything.
--
-- Fix: revoke from PUBLIC everywhere, then re-grant only the two intended
-- surfaces. Default privileges are changed too, so a function added later
-- fails closed rather than silently repeating this.
-- ============================================================================

revoke all on all functions in schema public from public, anon, authenticated;
revoke all on all functions in schema extensions from public, anon, authenticated;

alter default privileges in schema public revoke execute on functions from public;

-- ---------------------------------------------------------------------------
-- Public surface: everything an unauthenticated browser may call. Seven
-- functions, all of which validate their own inputs and none of which returns
-- another company's data.
-- ---------------------------------------------------------------------------
grant execute on function public.list_startups()                to anon, authenticated;
grant execute on function public.startup_login(uuid, text)      to anon, authenticated;
grant execute on function public.startup_logout(text)           to anon, authenticated;
grant execute on function public.startup_session_info(text)     to anon, authenticated;
grant execute on function public.get_startup_dashboard(text)    to anon, authenticated;
grant execute on function public.book_slot(text, uuid)          to anon, authenticated;
grant execute on function public.cancel_my_booking(text, uuid)  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin surface: authenticated only, and each one still re-checks is_admin()
-- internally. The grant keeps anon from reaching them at all; the internal
-- gate is what actually authorises.
-- ---------------------------------------------------------------------------
grant execute on function public.is_admin() to authenticated;

grant execute on function public.admin_overview(uuid)                                          to authenticated;
grant execute on function public.admin_list_sessions()                                         to authenticated;
grant execute on function public.admin_list_mentors(uuid)                                      to authenticated;
grant execute on function public.admin_list_slots(uuid)                                        to authenticated;
grant execute on function public.admin_list_bookings(uuid, uuid, uuid, text, text)             to authenticated;
grant execute on function public.admin_list_startups(uuid)                                     to authenticated;
grant execute on function public.admin_audit_log(integer)                                      to authenticated;
grant execute on function public.admin_create_session(text, date, time, time, integer, integer) to authenticated;
grant execute on function public.admin_update_session(uuid, text, date, integer, boolean, boolean) to authenticated;
grant execute on function public.admin_open_session(uuid)                                      to authenticated;
grant execute on function public.admin_close_session(uuid)                                     to authenticated;
grant execute on function public.admin_assign_mentors(uuid, uuid[])                            to authenticated;
grant execute on function public.admin_unassign_mentor(uuid, uuid)                             to authenticated;
grant execute on function public.admin_set_session_mentor_active(uuid, uuid, boolean)          to authenticated;
grant execute on function public.admin_generate_slots(uuid)                                    to authenticated;
grant execute on function public.admin_set_slot_status(uuid, public.slot_status)               to authenticated;
grant execute on function public.admin_add_slot(uuid, uuid, text, integer)                     to authenticated;
grant execute on function public.admin_delete_slot(uuid)                                       to authenticated;
grant execute on function public.admin_set_mentor_slots_status(uuid, uuid, public.slot_status) to authenticated;
grant execute on function public.admin_cancel_booking(uuid, text)                              to authenticated;
grant execute on function public.admin_reassign_booking(uuid, uuid)                            to authenticated;
grant execute on function public.admin_set_startup_active(uuid, boolean)                       to authenticated;
grant execute on function public.admin_set_startup_limit(uuid, integer)                        to authenticated;
grant execute on function public.admin_set_startup_code(uuid, text)                            to authenticated;
grant execute on function public.admin_reset_startup_code(uuid)                                to authenticated;
grant execute on function public.admin_set_mentor_active(uuid, boolean)                        to authenticated;
grant execute on function public.admin_update_mentor(uuid, text, text, text, text, text, text) to authenticated;
grant execute on function public.admin_delete_mentor(uuid)                                     to authenticated;

-- ---------------------------------------------------------------------------
-- Deliberately granted to NOBODY. These are called only from inside other
-- SECURITY DEFINER functions, which run as the owner and so do not need the
-- caller to hold a grant:
--
--   write_audit            — writable audit log = forgeable history
--   startup_id_from_token  — turns a token into an identity with no checks
--   effective_max_bookings — internal quota lookup
--   current_session_id     — internal
--   rpc_ok / rpc_error     — envelope helpers
--   touch_updated_at       — trigger function
-- ---------------------------------------------------------------------------
