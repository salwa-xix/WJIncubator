-- ============================================================================
-- 0002 — Enums and tables
-- ============================================================================
-- Model shape:
--
--   sessions ──< session_mentors ──< slots ──< bookings
--                      │                          │
--                   mentors                    startups
--
-- A *session* is one bookable event (date, time grid, per-session rules).
-- Mentor participation is per-session and admin-controlled, so all mentor
-- profiles can live in `mentors` while only the assigned, active ones appear
-- to startups. Nothing about the roster size is encoded in the schema — a
-- future event needs new rows, not new code.
-- ============================================================================

create type public.session_status as enum ('draft', 'open', 'closed');
create type public.slot_status    as enum ('open', 'closed');
create type public.booking_status as enum ('confirmed', 'cancelled');
create type public.actor_kind     as enum ('startup', 'admin', 'system');

-- ---------------------------------------------------------------------------
-- startups — the 19 participating companies (source: Incubator_Startup_Profiles.pdf)
-- ---------------------------------------------------------------------------
create table public.startups (
  id                    uuid primary key default gen_random_uuid(),
  sort_order            integer not null default 0,
  name_ar               text not null,
  name_en               text not null,
  slug                  text not null unique,
  logo_url              text,
  founder_name          text,
  founder_role          text,
  description           text,
  stage                 text,
  hq                    text,
  linkedin_url          text,
  sector                text,

  -- bcrypt hash of the private 4-digit code. NULL until codes are issued, so
  -- the roster can be seeded before the codes exist. Never selectable by the
  -- client: no RLS policy exposes this table to anon at all.
  access_code_hash      text,

  is_active             boolean not null default true,

  -- Per-startup override of the session's booking cap. NULL = use the session
  -- default, which is where the "3 bookings" rule actually lives.
  max_bookings_override integer check (max_bookings_override is null or max_bookings_override >= 0),

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- mentors — every mentor profile from the source file
-- ---------------------------------------------------------------------------
create table public.mentors (
  id                 uuid primary key default gen_random_uuid(),
  sort_order         integer not null default 0,
  -- Stable natural key: makes seeding idempotent and gives extracted image
  -- assets a predictable filename to map onto.
  slug               text not null unique,
  name_ar            text not null,
  name_en            text,
  image_url          text,
  bio                text,
  role               text,

  -- Verbatim from the source deck ("الخميس 5–7", "فترتين", "السبت").
  -- Display metadata only — nothing branches on this value.
  availability_label text,

  -- Global archive flag. Participation in a given event is decided by
  -- session_mentors, not by this column.
  is_active          boolean not null default true,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table public.mentor_organizations (
  id            uuid primary key default gen_random_uuid(),
  mentor_id     uuid not null references public.mentors (id) on delete cascade,
  org_name      text not null,
  org_logo_url  text,
  sort_order    integer not null default 0
);

-- ---------------------------------------------------------------------------
-- sessions — one bookable event. All tunable rules live here, not in code.
-- ---------------------------------------------------------------------------
create table public.sessions (
  id                         uuid primary key default gen_random_uuid(),
  name                       text not null,

  -- Configurable: left NULL until the event is scheduled. A session cannot be
  -- opened without it (see the CHECK below).
  session_date               date,

  starts_at                  time not null default '17:00',
  ends_at                    time not null default '19:00',
  slot_minutes               integer not null default 20 check (slot_minutes between 5 and 180),

  -- The confirmed-booking cap. This is the "max 3" rule.
  max_bookings_per_startup   integer not null default 3 check (max_bookings_per_startup >= 0),

  -- Per-event policy switches, so these stay decisions rather than edits.
  allow_startup_cancellation boolean not null default false,
  block_duplicate_mentor     boolean not null default true,

  status                     session_status not null default 'draft',
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),

  constraint sessions_time_order check (ends_at > starts_at),
  constraint sessions_open_needs_date check (status = 'draft' or session_date is not null)
);

comment on column public.sessions.max_bookings_per_startup is
  'Confirmed-booking cap per startup for this session. Overridable per startup via startups.max_bookings_override.';

-- ---------------------------------------------------------------------------
-- session_mentors — which mentors take part, and whether they are active.
-- This is the table the admin drives; the startup view reads through it.
-- ---------------------------------------------------------------------------
create table public.session_mentors (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions (id) on delete cascade,
  mentor_id   uuid not null references public.mentors (id) on delete restrict,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),

  unique (session_id, mentor_id)
);

-- ---------------------------------------------------------------------------
-- slots
-- ---------------------------------------------------------------------------
-- The FK targets session_mentors rather than mentors, so a slot cannot exist
-- for a mentor who was never assigned to that session. Unassigning a mentor
-- removes their slots by cascade instead of leaving orphans behind.
--
-- `status` is open/closed ONLY. Booked-ness is derived from the existence of a
-- confirmed booking — a stored "booked" flag is the classic desync bug, where
-- one cancellation that forgets to reset it kills the slot for the rest of the
-- event. Admin close/reopen is a genuinely separate axis, which is why it is
-- the thing that gets stored.
-- ---------------------------------------------------------------------------
create table public.slots (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null,
  mentor_id   uuid not null,
  start_time  time not null,
  end_time    time not null,
  status      slot_status not null default 'open',
  created_at  timestamptz not null default now(),

  constraint slots_time_order check (end_time > start_time),

  constraint slots_session_mentor_fk
    foreign key (session_id, mentor_id)
    references public.session_mentors (session_id, mentor_id) on delete cascade,

  -- One slot per mentor per start time within a session.
  constraint slots_unique_per_mentor_time unique (session_id, mentor_id, start_time),

  -- Target for the bookings composite FK below. Makes the denormalised columns
  -- on `bookings` provably consistent with the slot they point at.
  constraint slots_identity_unique unique (id, session_id, mentor_id, start_time)
);

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------
-- session_id / mentor_id / start_time are denormalised so the "no two bookings
-- at the same time" and "not the same mentor twice" rules can be expressed as
-- plain indexes. The composite FK below locks those copies to the slot they
-- came from, so they cannot drift.
-- ---------------------------------------------------------------------------
create table public.bookings (
  id            uuid primary key default gen_random_uuid(),
  startup_id    uuid not null references public.startups (id) on delete restrict,
  slot_id       uuid not null,
  session_id    uuid not null,
  mentor_id     uuid not null,
  start_time    time not null,
  status        booking_status not null default 'confirmed',
  created_at    timestamptz not null default now(),
  cancelled_at  timestamptz,
  cancelled_by  actor_kind,
  cancel_reason text,

  constraint bookings_slot_fk
    foreign key (slot_id, session_id, mentor_id, start_time)
    references public.slots (id, session_id, mentor_id, start_time) on delete restrict,

  -- A cancelled booking must carry a timestamp, and a live one must not.
  constraint bookings_cancel_consistency
    check ((status = 'cancelled') = (cancelled_at is not null))
);

-- ---------------------------------------------------------------------------
-- startup_auth_tokens — opaque session tokens issued after a code check.
-- Startups are not Supabase Auth users; admins are.
-- ---------------------------------------------------------------------------
create table public.startup_auth_tokens (
  token        text primary key,
  startup_id   uuid not null references public.startups (id) on delete cascade,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at   timestamptz not null,
  revoked_at   timestamptz
);

-- ---------------------------------------------------------------------------
-- admin_users — membership table gating the admin surface. A valid Supabase
-- Auth login that is not listed here has no admin access.
-- ---------------------------------------------------------------------------
create table public.admin_users (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- login_attempts — feeds the brute-force throttle. A 4-digit code is only
-- 10,000 combinations, so unthrottled guessing is a real attack, not a
-- theoretical one.
-- ---------------------------------------------------------------------------
create table public.login_attempts (
  id         bigserial primary key,
  startup_id uuid,
  succeeded  boolean not null,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id         bigserial primary key,
  actor      actor_kind not null,
  actor_id   text,
  action     text not null,
  entity     text,
  entity_id  uuid,
  detail     jsonb,
  created_at timestamptz not null default now()
);
