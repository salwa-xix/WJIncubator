#!/usr/bin/env bash
# =============================================================================
# CONCURRENCY TEST
# =============================================================================
# Fires genuinely simultaneous booking attempts from separate database
# connections and asserts the invariants hold. Every worker waits for a shared
# wall-clock instant before calling book_slot(), so the attempts really do
# overlap rather than merely being launched in a loop.
#
# This is the test the whole design exists to pass: 19 startups competing for a
# finite slot pool during a live event, where a double-booked mentor is a
# visible failure in the room.
#
# Usage:  ./scripts/db-concurrency-test.sh <psql-connection-args...>
# =============================================================================
set -uo pipefail

PSQL_ARGS=("$@")
q() { psql "${PSQL_ARGS[@]}" -qtA -c "$1"; }

pass=0; fail=0
check() { # check <condition> <label>
  if [ "$1" = "t" ] || [ "$1" = "true" ]; then
    echo "  PASS  $2"; pass=$((pass+1))
  else
    echo "  FAIL  $2"; fail=$((fail+1))
  fi
}

echo ""
echo "=== SETUP ==="
q "delete from public.bookings;" >/dev/null
q "update public.slots set status='open';" >/dev/null
q "update public.startups set is_active = true;" >/dev/null
q "delete from public.login_attempts;" >/dev/null

# Issue a code + token for every startup.
q "
do \$\$
declare r record; i int := 0;
begin
  for r in select id from public.startups order by sort_order loop
    i := i + 1;
    update public.startups
       set access_code_hash = extensions.crypt(lpad(i::text,4,'0'), extensions.gen_salt('bf',4))
     where id = r.id;
  end loop;
end \$\$;" >/dev/null

mapfile -t TOKENS < <(q "
select (public.startup_login(s.id, lpad(row_number() over (order by s.sort_order)::text,4,'0'))->>'token')
  from public.startups s order by s.sort_order;")
echo "  issued ${#TOKENS[@]} startup sessions"

SLOT=$(q "select id from public.slots order by mentor_id, start_time limit 1;")

# -----------------------------------------------------------------------------
echo ""
echo "=== TEST A — 19 startups race for ONE slot ==="
FIRE=$(q "select (clock_timestamp() + interval '3 seconds')::text;")
RESULTS=$(mktemp -d)

for i in "${!TOKENS[@]}"; do
  (
    psql "${PSQL_ARGS[@]}" -qtA \
      -c "select pg_sleep(greatest(0, extract(epoch from (timestamptz '$FIRE' - clock_timestamp()))));" \
      -c "select coalesce(public.book_slot('${TOKENS[$i]}','$SLOT')->>'code','OK');" \
      2>/dev/null | tail -1 > "$RESULTS/$i"
  ) &
done
wait

OK_COUNT=$(cat "$RESULTS"/* 2>/dev/null | grep -c '^OK$')
TAKEN_COUNT=$(cat "$RESULTS"/* 2>/dev/null | grep -c '^SLOT_TAKEN$')
DB_COUNT=$(q "select count(*) from public.bookings where slot_id='$SLOT' and status='confirmed';")
echo "  results: OK=$OK_COUNT  SLOT_TAKEN=$TAKEN_COUNT  rows-in-db=$DB_COUNT"
check "$([ "$OK_COUNT" = "1" ] && echo t)"  "exactly ONE attempt succeeded"
check "$([ "$DB_COUNT" = "1" ] && echo t)"  "exactly one confirmed booking row exists"
check "$([ "$TAKEN_COUNT" = "$((${#TOKENS[@]}-1))" ] && echo t)" "every loser got a clean SLOT_TAKEN (no crash, no silent drop)"
rm -rf "$RESULTS"

# -----------------------------------------------------------------------------
echo ""
echo "=== TEST B — one startup fires 6 simultaneous bookings (cap is 3) ==="
q "delete from public.bookings;" >/dev/null
# Six slots that are each a DIFFERENT mentor at a DIFFERENT time, so neither
# the time-clash nor the duplicate-mentor rule can fire. That leaves the
# booking cap as the only thing that can stop them — which is the point.
mapfile -t SIX < <(q "
select sl.id
  from (select start_time, row_number() over (order by start_time) rn
          from (select distinct start_time from public.slots) a) t
  join (select id as mentor_id, row_number() over (order by sort_order) rn
          from public.mentors) m on m.rn = t.rn
  join public.slots sl on sl.mentor_id = m.mentor_id and sl.start_time = t.start_time
 order by t.rn;")

FIRE=$(q "select (clock_timestamp() + interval '3 seconds')::text;")
RESULTS=$(mktemp -d)
for i in "${!SIX[@]}"; do
  (
    psql "${PSQL_ARGS[@]}" -qtA \
      -c "select pg_sleep(greatest(0, extract(epoch from (timestamptz '$FIRE' - clock_timestamp()))));" \
      -c "select coalesce(public.book_slot('${TOKENS[0]}','${SIX[$i]}')->>'code','OK');" \
      2>/dev/null | tail -1 > "$RESULTS/$i"
  ) &
done
wait

OK_B=$(cat "$RESULTS"/* 2>/dev/null | grep -c '^OK$')
DB_B=$(q "select count(*) from public.bookings where status='confirmed';")
echo "  results: OK=$OK_B  rows-in-db=$DB_B"
check "$([ "$DB_B" = "3" ] && echo t)" "the 3-booking cap held under 6 simultaneous attempts"
rm -rf "$RESULTS"

# -----------------------------------------------------------------------------
echo ""
echo "=== TEST C — full storm: all 19 startups, 8 attempts each, at once ==="
q "delete from public.bookings;" >/dev/null
FIRE=$(q "select (clock_timestamp() + interval '4 seconds')::text;")

for i in "${!TOKENS[@]}"; do
  (
    SLOTS=$(psql "${PSQL_ARGS[@]}" -qtA -c \
      "select string_agg(id::text,' ') from (select id from public.slots where status='open' order by md5(id::text || '$i') limit 8) z;")
    CMD="select pg_sleep(greatest(0, extract(epoch from (timestamptz '$FIRE' - clock_timestamp()))));"
    for s in $SLOTS; do CMD="$CMD select public.book_slot('${TOKENS[$i]}','$s');"; done
    psql "${PSQL_ARGS[@]}" -qtA -c "$CMD" >/dev/null 2>&1
  ) &
done
wait

echo "  --- invariants after the storm ---"
DUP_SLOT=$(q "select count(*) from (select slot_id from public.bookings where status='confirmed' group by slot_id having count(*)>1) z;")
OVER_CAP=$(q "select count(*) from (select startup_id from public.bookings where status='confirmed' group by startup_id having count(*)>3) z;")
CLASH=$(q "select count(*) from (select startup_id,start_time from public.bookings where status='confirmed' group by 1,2 having count(*)>1) z;")
DUP_MENTOR=$(q "select count(*) from (select startup_id,mentor_id from public.bookings where status='confirmed' group by 1,2 having count(*)>1) z;")
CLOSED=$(q "select count(*) from public.bookings b join public.slots s on s.id=b.slot_id where b.status='confirmed' and s.status='closed';")
TOTAL=$(q "select count(*) from public.bookings where status='confirmed';")
ORPHAN=$(q "select count(*) from public.bookings b join public.slots s on s.id=b.slot_id where b.start_time <> s.start_time or b.mentor_id <> s.mentor_id;")

echo "  total confirmed bookings: $TOTAL"
check "$([ "$DUP_SLOT"   = "0" ] && echo t)" "no slot was booked twice"
check "$([ "$OVER_CAP"   = "0" ] && echo t)" "no startup exceeded the 3-booking cap"
check "$([ "$CLASH"      = "0" ] && echo t)" "no startup holds two bookings at the same time"
check "$([ "$DUP_MENTOR" = "0" ] && echo t)" "no startup booked the same mentor twice"
check "$([ "$CLOSED"     = "0" ] && echo t)" "no booking landed on a closed slot"
check "$([ "$ORPHAN"     = "0" ] && echo t)" "denormalised columns never drifted from their slot"

echo ""
echo "============================================"
echo "  concurrency: $pass passed, $fail failed"
echo "============================================"
[ "$fail" -eq 0 ] || exit 1
