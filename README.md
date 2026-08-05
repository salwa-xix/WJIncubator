# WJIncubator — نظام حجز الجلسات الإرشادية

Mentor-booking system for the WJIncubator (حاضنة وادي جدة) event. Participating
startups book short mentoring sessions with a private code; a separate admin
area controls the session, the mentor roster, the slot grid, and every booking.

Arabic-first (RTL). Supabase backend. **Every booking rule is enforced in the
database**, not the browser.

---

## Status — complete

| Phase | Scope | State |
| ----- | ----- | ----- |
| 1 | Project setup, RTL, brand theme, Supabase config | ✅ |
| 2 | Schema, constraints, RLS, booking RPCs, seed structure | ✅ |
| 3 | Startup login, admin login, session guards, Arabic error states | ✅ |
| 4 | Startup dashboard, mentor cards, slot selection, booking flow | ✅ |
| 5 | Admin dashboard, session/mentor/slot/booking management | ✅ |
| 6 | Accessibility, responsive polish, testing, security, deployment | ✅ |

---

## 1. Local setup

**Requirements:** Node 20+, npm 10+. PostgreSQL 16 only if you want to run the
database test suite locally.

```bash
git clone <repo> && cd wadihub-incubator
npm install
cp .env.example .env          # fill in your Supabase values
npm run dev                   # http://localhost:5173
```

The app runs without Supabase credentials — the login screen reports exactly
which environment variables are missing instead of failing blank.

| Script | Purpose |
| ------ | ------- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck (`tsc -b`) then production build |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | Types only |
| `npm run db:test` | Throwaway Postgres → all migrations, seeds, **57 assertions** |
| `npm run db:concurrency` | Concurrency suite only |
| `npm run dev:shim` | Dev-only Supabase-protocol shim over local Postgres |
| `npm run test:ui` | Browser regression at 1440px and 390px |

---

## 2. Supabase deployment

### 2.1 Create the project

1. Create a Supabase project (region closest to the event — `eu-central-1` or
   `me-central-1` for Jeddah).
2. From **Project Settings → API**, copy the **Project URL** and the **anon**
   key. The service-role key is never needed by the app.

### 2.2 Apply migrations, in order

Paste each file into the SQL Editor and run it, or use the Supabase CLI:

```bash
supabase link --project-ref <ref>
supabase db push          # applies supabase/migrations/* in filename order
```

| # | File | Contents |
| - | ---- | -------- |
| 0001 | `extensions.sql` | pgcrypto in the `extensions` schema |
| 0002 | `types_tables.sql` | Enums and all 11 tables |
| 0003 | `constraints_indexes.sql` | Rule-enforcing indexes, triggers |
| 0004 | `helpers.sql` | `is_admin()`, token resolution, envelopes |
| 0005 | `rls.sql` | RLS on everything, column-level secret lockdown |
| 0006 | `rpc_startup_auth.sql` | Login, logout, throttle |
| 0007 | `rpc_startup_booking.sql` | Dashboard + `book_slot()` |
| 0008 | `rpc_admin.sql` | Admin mutations |
| 0009 | `rpc_session_guards.sql` | Lightweight session checks |
| 0010 | `rpc_admin_reads.sql` | Admin reads + per-slot management |
| 0011 | `lock_down_function_grants.sql` | **Revokes the default PUBLIC EXECUTE grant** |

> **0011 is not optional.** Postgres grants `EXECUTE` on every function to
> `PUBLIC` by default, which would leave anon able to call every `admin_*`
> function and — worse — `write_audit()` directly, forging audit history.

### 2.3 Seed the real data

```bash
psql "$SUPABASE_DB_URL" -f supabase/seed/01_startups.sql
psql "$SUPABASE_DB_URL" -f supabase/seed/02_mentors.sql
psql "$SUPABASE_DB_URL" -f supabase/seed/03_mentor_organizations.sql
psql "$SUPABASE_DB_URL" -f supabase/seed/06_asset_urls.sql
psql "$SUPABASE_DB_URL" -f supabase/seed/04_session.sql     # draft session only
```

`04_session.sql` deliberately creates a **draft session with no date, no
mentors and no slots**. Everything after that is an admin decision made in the
UI.

### 2.4 Create the admin account

In **Authentication → Users**, add a user with email + password, then:

```sql
insert into public.admin_users (user_id, display_name)
values ('<the-auth-user-uuid>', 'اسم المشرف');
```

Authentication alone grants nothing — a signed-in user who is not in
`admin_users` is refused and signed straight back out.

### 2.5 Images

`public/assets/**` ships with the repo and is served by the frontend, so
nothing further is required. To move images to Supabase Storage instead,
upload the folders to a public bucket and change the path prefix in
`supabase/seed/06_asset_urls.sql`, then re-run that file.

Regenerate assets from the source PDFs at any time:

```bash
pip install pymupdf
python3 scripts/extract_assets.py <startups.pdf> <mentors.pdf> <company.pdf>
```

All three files are required. `Company.pdf` supplies نقطة's logo and two of the
three mentors added after the original decks, so running with only the first two
would emit a seed that silently omits them.

---

## 3. Production configuration

### 3.1 Frontend environment

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

The anon key is public by design. It grants **nothing** on its own: no table is
readable with it, and only seven functions are callable.

### 3.2 Build and host

```bash
npm run build       # → dist/
```

Deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages). The app
uses client-side routing, so **rewrite all paths to `/index.html`**, otherwise a
refresh on `/admin/bookings` 404s.

*Vercel* — `vercel.json`:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```
*Netlify* — `public/_redirects`:
```
/*  /index.html  200
```

### 3.3 Event-day checklist, in order

1. **Set the event date** — Admin → الجلسة → date → حفظ.
2. **Assign mentors** — Admin → المرشدون → select → إسناد المحدد.
3. **Deactivate** anyone not taking part. Slots are generated only for mentors
   who are assigned *and* active.
4. **Generate the slot grid** — Admin → المواعيد → إنشاء شبكة المواعيد.
5. **Adjust individual slots** — close, delete, or add per mentor.
6. **Issue access codes** — `psql "$SUPABASE_DB_URL" -f supabase/seed/05_issue_codes.sql`.
   Prints all 19 codes **once**; capture the output and distribute them.
   Alternatively reset one at a time from Admin → الشركات.
7. **Open the session** — Admin → الجلسة → فتح الجلسة. Refused unless a date
   and slots exist.
8. After the event, **إغلاق الجلسة** stops further booking while leaving every
   record intact.

### 3.4 Deliberately not done in advance

Per the approved requirements, none of the following happens automatically —
each is an explicit admin action:

- No production event date is set.
- No mentors are assigned or activated.
- No slots are generated.
- No access codes are issued.

---

## 4. Business rules (approved, do not change casually)

| Rule | Where enforced |
| ---- | -------------- |
| One confirmed booking per slot | `UNIQUE (slot_id) WHERE status='confirmed'` |
| No two bookings at the same time | `UNIQUE (startup_id, session_id, start_time) WHERE confirmed` |
| Max 3 confirmed bookings per startup | `book_slot()` under a row lock on the startup |
| Never the same mentor twice | `book_slot()` under the same lock |
| Startup self-cancellation **disabled** | `sessions.allow_startup_cancellation = false` |
| Closed slots unbookable | Checked in the booking transaction |
| Inactive mentor / startup blocked | Checked in the same transaction |
| Denormalised time cannot drift | Composite FK to `slots` |

The cap and the duplicate-mentor rule are **session columns**, so changing
either is a data edit, not a code change.

**Locking order is always startup → slot.** Two startups racing one slot
contend on the slot; one startup double-clicking contends on itself. A fixed
order means no cycle, so they cannot deadlock. Holding the startup lock is what
makes the per-startup counts safe to read with a plain `SELECT`.

`slots` has **no `booked` column** — availability is derived from the existence
of a confirmed booking, so cancelling frees a slot with no second write to
forget. Admin `open`/`closed` is a separate axis, which is why *that* is stored.

---

## 5. Security model

- **RLS on all 11 tables, with no policy for `anon` anywhere.** In Postgres, RLS
  with no matching policy denies. The browser's anon key can read and write
  exactly nothing directly.
- **Seven callable functions** make up the entire public surface. Everything
  else, including all `admin_*` functions and internal helpers, is revoked from
  `PUBLIC` (migration 0011) and asserted in the test suite.
- **Secret columns use column-level grants.** A table-level `GRANT SELECT`
  confers every column and a later column `REVOKE` does *not* carve one back
  out — so `access_code_hash` and `startup_auth_tokens.token` are withheld by
  enumerating the allowed columns instead. No role can read either.
- **Codes** are bcrypt-hashed, stored as `TEXT` so leading zeros survive
  (`0042` stays `0042`), verified server-side, and throttled at 5 failed
  attempts per 15 minutes. They cannot be read back — reset reveals a new code
  once.
- **Every SECURITY DEFINER function pins `search_path = ''`**, so a caller
  cannot shadow an identifier and have an elevated function resolve to theirs.
- **No write policies exist on any table.** Every mutation goes through an RPC
  that validates and writes to `audit_log`; there is no second, unaudited path.
- A `booked` slot carries **no identity** in the startup view — a startup learns
  a slot is taken, never by whom.

---

## 6. Testing

```bash
npm run db:test     # 57 database assertions (47 rule + 10 concurrency)
npm run test:ui     # 40 browser assertions at 1440px and 390px
npm run build       # typecheck + production build
```

**Concurrency** — workers synchronise on a shared wall-clock instant so the
attempts genuinely overlap:

| Scenario | Result |
| -------- | ------ |
| 19 startups race for one slot | exactly 1 wins, 18 clean `SLOT_TAKEN` |
| One startup fires 6 bookings at once | the cap of 3 holds |
| Full storm, all 19 at once | no double-booked slot, no over-cap startup, no time clash, no duplicate mentor, no drift |

`supabase/test/00_local_shim.sql` recreates just enough of Supabase's `auth`
schema and roles to run the real migrations unmodified locally. It is never
applied to Supabase.

---

## 7. Accessibility

- Skip-to-content link as the first tab stop on every page.
- One `<h1>` per page, correct heading order, one `<main>` landmark.
- Every form control labelled; `scope="col"` on all table headers.
- The booking dialog traps focus, closes on `Escape`, and returns focus to the
  slot chip that opened it — without the trap, focus wanders onto the grid
  behind the overlay and the next `Enter` books something invisible.
- Visible focus ring for keyboard users only (`:focus-visible`).
- Per-route document titles, so history entries and tabs are distinguishable.
- `prefers-reduced-motion` honoured.
- Full login → book → logout flow completes by keyboard alone.

---

## 8. Data provenance

Everything real comes from the uploaded source files. **Nothing is invented.**

| Data | Source | Count |
| ---- | ------ | ----- |
| Startups | `Incubator_Startup_Profiles.pdf` (pages 1–18) + `Company.pdf` | 19 |
| Mentor profiles | `مرشدين المعسكر.pdf` (14) + `Company.pdf` (3) | 17 |
| Mentor organizations | `مرشدين المعسكر.pdf` | 27 |
| Images extracted | all three PDFs | 61 |

`Company.pdf` is a later addendum. It adds three mentors
(د. سلطان الحياني · معاذ العديمي · د. عبدالرحمن حريري) and replaces the deck's
19th company, **Floraex / فلوراكس**, with **نقطة / NKTA**. Floraex is deleted
rather than renamed, so نقطة never inherits its profile or its access code — see
the guard at the top of `supabase/seed/01_startups.sql`.

Known data-quality gaps in the sources are carried over **unchanged and
flagged**, because correcting them is the organiser's decision:

1. Six mentors share two duplicated placeholder bios
   (شودري / الخضير / المشجري, and القحطاني / الزبيري / يوسف).
2. "سلطلن الزحوفي" is very likely a typo for "سلطان".
3. `Company.pdf` is a cover page, not a profile deck. It gives no availability
   for its three mentors, no bio or portrait for معاذ العديمي, and nothing but a
   name and logo for نقطة. Those columns are NULL, not filled in with guesses —
   every field that renders them treats NULL as "print nothing".

CartiHeal's slide sets its wordmark in type rather than placing an image, so its
`logo_url` is NULL rather than a substitute.

---

## 9. Repository layout

```
├─ public/
│  ├─ assets/           61 images extracted from the source PDFs
│  ├─ fonts/            IBM Plex Sans Arabic, subset-split (SIL OFL 1.1)
│  └─ favicon.svg
├─ scripts/
│  ├─ db-test.sh                 build a throwaway DB and run every assertion
│  ├─ db-concurrency-test.sh     genuinely-parallel booking races
│  ├─ ui-regression.mjs          browser suite, desktop + mobile
│  ├─ dev-seed-demo.sh           known local demo state
│  ├─ dev-supabase-shim.mjs      dev-only Supabase-protocol shim
│  └─ extract_assets.py          regenerate images from the source PDFs
├─ src/
│  ├─ components/  brand/ · ui/ · layout/
│  ├─ features/    auth/ · booking/ · admin/
│  ├─ pages/       StartupLogin · StartupDashboard · admin/*
│  ├─ lib/         supabase · api · adminApi · errors · env · cn
│  └─ styles/      index.css · fonts.css
├─ supabase/
│  ├─ migrations/  0001 … 0011
│  ├─ seed/        startups · mentors · organizations · session · codes · assets
│  └─ test/        local auth shim · fixture · rule assertions
└─ .env.example
```

---

## 10. Stack

Vite · React 18 · TypeScript (strict) · Tailwind · React Router · TanStack Query
· sonner · Supabase (Postgres, RLS, Auth, plpgsql RPCs).

**No Edge Functions** — the entire backend is SQL migrations. Fewer moving
parts, one deploy target, and the whole rule engine is testable offline.

The admin area is lazy-loaded: 19 startups hit the booking page at once at the
start of an event, and they should not download the organiser's tooling to do
it.
