#!/usr/bin/env bash
# =============================================================================
# DEV-ONLY demo state.
#
# Puts the local test database into a known, exercisable state so the UI can be
# driven end to end: an admin account, an open session with mentors and slots,
# two startups with known codes, and one booking already taken by someone else
# so the "booked by another startup" state is visible.
#
# Never run against production: it sets known access codes.
#
#   ./scripts/dev-seed-demo.sh [--fresh]
#       --fresh   rebuild the database from migrations + seeds first
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PSQL=(psql -h /tmp -p "${PGPORT:-54329}" -U postgres -d wjtest -qtA -v ON_ERROR_STOP=1)

if [[ "${1:-}" == "--fresh" ]]; then
  echo "==> rebuilding database"
  bash "$ROOT/scripts/db-test.sh" >/dev/null 2>&1 || true
fi

ADMIN_ID=22222222-2222-2222-2222-222222222222
OTHER_ID=33333333-3333-3333-3333-333333333333

"${PSQL[@]}" >/dev/null <<SQL
insert into auth.users (id, email) values
  ('$ADMIN_ID','organiser@wj.test'),
  ('$OTHER_ID','notadmin@wj.test')
on conflict (id) do nothing;

insert into public.admin_users (user_id, display_name)
values ('$ADMIN_ID','Organiser')
on conflict (user_id) do nothing;

delete from public.bookings;
delete from public.login_attempts;
update public.slots set status = 'open';
update public.startups set is_active = true;
update public.session_mentors set is_active = true;

select set_config('test.user_id','$ADMIN_ID',false);

-- known demo codes (dev only)
select public.admin_set_startup_code(id,'0042') from public.startups where slug='mabien';
select public.admin_set_startup_code(id,'1234') from public.startups where slug='nanoclean';

-- one mentor switched off and one slot closed, so those states are visible
select public.admin_set_session_mentor_active(
  (select id from public.sessions where status='open'),
  (select id from public.mentors where slug='omran-yousef'), false);
select public.admin_set_slot_status(
  (select sl.id from public.slots sl join public.mentors m on m.id = sl.mentor_id
    where m.slug='basma-khoja' and sl.start_time='18:40'), 'closed');
SQL

# One slot taken by another startup, so "محجوز" appears on the startup grid.
TOKEN=$("${PSQL[@]}" -c "select public.startup_login((select id from public.startups where slug='nanoclean'),'1234')->>'token';")
SLOT=$("${PSQL[@]}" -c "select sl.id from public.slots sl join public.mentors m on m.id = sl.mentor_id
                         where m.slug='basma-khoja' and sl.start_time='17:00';")
"${PSQL[@]}" -c "select public.book_slot('$TOKEN','$SLOT');" >/dev/null
"${PSQL[@]}" -c "delete from public.login_attempts;" >/dev/null

echo "demo state ready"
"${PSQL[@]}" -c "select '  session       : ' || status from public.sessions where status='open';"
"${PSQL[@]}" -c "select '  active mentors: ' || count(*) from public.session_mentors where is_active;"
"${PSQL[@]}" -c "select '  slots         : ' || count(*) from public.slots;"
"${PSQL[@]}" -c "select '  bookings      : ' || count(*) from public.bookings where status='confirmed';"
echo "  admin        : organiser@wj.test (any password via the dev shim)"
echo "  startups     : مبين=0042  نانوكلين=1234"
