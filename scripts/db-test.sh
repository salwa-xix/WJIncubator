#!/usr/bin/env bash
# =============================================================================
# Builds a throwaway Postgres database, applies every migration and seed, then
# runs the rule and concurrency suites against it.
#
# Validating the schema against a real Postgres locally means the booking rules
# are proven before they ever reach Supabase — and it makes the concurrency
# behaviour reproducible rather than hoped for.
#
#   ./scripts/db-test.sh
# =============================================================================
set -euo pipefail

PGPORT="${PGPORT:-54329}"
PGDATA="${PGDATA:-/tmp/pgdata}"
PGHOST=/tmp
DB=wjtest
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PSQL_BASE=(-h "$PGHOST" -p "$PGPORT" -U postgres)

if ! pg_isready -h "$PGHOST" -p "$PGPORT" >/dev/null 2>&1; then
  echo "==> starting postgres on :$PGPORT"
  if [ ! -d "$PGDATA/base" ]; then
    mkdir -p "$PGDATA"; chown -R postgres:postgres "$PGDATA" 2>/dev/null || true
    su postgres -c "/usr/lib/postgresql/16/bin/initdb -D $PGDATA -A trust -U postgres" >/dev/null
  fi
  su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D $PGDATA -o '-p $PGPORT -k /tmp' -l /tmp/pg.log start" >/dev/null
  sleep 2
fi

echo "==> rebuilding $DB"
psql "${PSQL_BASE[@]}" -q -c "drop database if exists $DB;" -c "create database $DB;" >/dev/null

P=(psql "${PSQL_BASE[@]}" -d "$DB" -v ON_ERROR_STOP=1 -q)

echo "==> applying shim + migrations"
"${P[@]}" -f "$ROOT/supabase/test/00_local_shim.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  "${P[@]}" -f "$f" && echo "    ok  $(basename "$f")"
done

echo "==> seeding"
for f in "$ROOT"/supabase/seed/01_startups.sql \
         "$ROOT"/supabase/seed/02_mentors.sql \
         "$ROOT"/supabase/seed/03_mentor_organizations.sql \
         "$ROOT"/supabase/seed/06_asset_urls.sql; do
  "${P[@]}" -f "$f" && echo "    ok  $(basename "$f")"
done
"${P[@]}" -f "$ROOT/supabase/seed/04_session.sql" >/dev/null && echo "    ok  04_session.sql (draft only — no mentors, no slots)"

# The admin's job, reproduced as a fixture so the production seed stays empty.
echo "==> test fixture (assign mentors + generate slots)"
"${P[@]}" -f "$ROOT/supabase/test/02_fixture.sql" >/dev/null && echo "    ok  02_fixture.sql"

echo ""
echo "==> rule tests"
psql "${PSQL_BASE[@]}" -d "$DB" -v ON_ERROR_STOP=1 -f "$ROOT/supabase/test/01_rules_test.sql" 2>&1 \
  | grep -E "PASS|FAIL|ERROR|===" | sed 's/^psql.*NOTICE:  //'

echo ""
echo "==> concurrency tests"
"$ROOT/scripts/db-concurrency-test.sh" "${PSQL_BASE[@]}" -d "$DB"
