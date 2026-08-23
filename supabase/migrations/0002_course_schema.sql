-- Phase 2 schema: terms, courses, and everything scoped under them for
-- manual entry. See docs/PLAN.md for the schema sketch this implements and
-- docs/adr/0001 for why every table carries user_id directly rather than
-- inferring ownership via joins to a parent.
--
-- FK delete-action summary:
--   term_breaks, course_meetings, grade_categories -> their parent: CASCADE
--     (pure sub-records with no meaning outside that parent)
--   courses -> terms, assignments -> courses: RESTRICT
--     (protects a term/course full of data from an oversight delete)
--   assignments.category_id -> grade_categories: SET NULL
--     (an assignment survives its category being deleted; "no category" is
--     a valid state for ungraded work like readings)
--   grade_categories.replaces_lowest_in_category_id -> grade_categories: SET NULL
--   grades -> assignments: CASCADE (a grade has no meaning without its assignment)
--   every user_id -> auth.users: CASCADE
--
-- Primary keys are uuid, not bigint identity, despite that being this
-- skill-set's general default for single-database apps. That guidance is
-- protecting against index fragmentation on large tables; nothing here will
-- ever be a large table (a personal course dashboard's lifetime row count is
-- in the hundreds, not millions). uuid keeps every id type-uniform with
-- user_id/auth.users.id, with the Phase 5/6 tables that will FK against
-- these, and with how ids travel through route params, Server Action form
-- fields, and eventually .ics UIDs (Phase 4) -- all string-shaped paths.
--
-- No composite FK ties assignments.category_id to assignments.course_id.
-- Postgres's ON DELETE SET NULL on a composite FK nulls every column in the
-- FK, which would null the not-null course_id too when a category is
-- deleted. Cross-course category integrity is therefore enforced in the
-- createAssignment/updateAssignment Server Actions, not the schema.

create schema if not exists private;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================ terms ===

create table if not exists public.terms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  finals_start_on date not null,
  finals_end_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint terms_user_id_name_key unique (user_id, name),
  constraint terms_dates_check check (
    ends_on >= starts_on
    and finals_start_on >= starts_on
    and finals_end_on >= finals_start_on
  )
);

create index if not exists terms_user_id_idx on public.terms (user_id);

alter table public.terms enable row level security;

drop policy if exists terms_owner_policy on public.terms;
create policy terms_owner_policy on public.terms
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop trigger if exists set_updated_at on public.terms;
create trigger set_updated_at
  before update on public.terms
  for each row execute function private.set_updated_at();

-- ===================================================== term_breaks ===

create table if not exists public.term_breaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  term_id uuid not null references public.terms(id) on delete cascade,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint term_breaks_dates_check check (ends_on >= starts_on)
);

create index if not exists term_breaks_term_id_idx on public.term_breaks (term_id);
create index if not exists term_breaks_user_id_idx on public.term_breaks (user_id);

alter table public.term_breaks enable row level security;

drop policy if exists term_breaks_owner_policy on public.term_breaks;
create policy term_breaks_owner_policy on public.term_breaks
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop trigger if exists set_updated_at on public.term_breaks;
create trigger set_updated_at
  before update on public.term_breaks
  for each row execute function private.set_updated_at();

-- ========================================================= courses ===

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  term_id uuid not null references public.terms(id) on delete restrict,
  code text not null,
  title text not null,
  instructor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courses_term_id_code_key unique (term_id, code)
);

create index if not exists courses_term_id_idx on public.courses (term_id);
create index if not exists courses_user_id_idx on public.courses (user_id);

alter table public.courses enable row level security;

drop policy if exists courses_owner_policy on public.courses;
create policy courses_owner_policy on public.courses
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop trigger if exists set_updated_at on public.courses;
create trigger set_updated_at
  before update on public.courses
  for each row execute function private.set_updated_at();

-- ================================================== course_meetings ===

create table if not exists public.course_meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  -- 0 = Sunday .. 6 = Saturday, matching JS Date#getDay() so the calendar
  -- code (Phase 4) needs no conversion.
  weekday smallint not null,
  starts_at time not null,
  ends_at time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_meetings_weekday_check check (weekday between 0 and 6),
  constraint course_meetings_time_check check (ends_at > starts_at)
);

create index if not exists course_meetings_course_id_idx on public.course_meetings (course_id);
create index if not exists course_meetings_user_id_idx on public.course_meetings (user_id);

alter table public.course_meetings enable row level security;

drop policy if exists course_meetings_owner_policy on public.course_meetings;
create policy course_meetings_owner_policy on public.course_meetings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop trigger if exists set_updated_at on public.course_meetings;
create trigger set_updated_at
  before update on public.course_meetings
  for each row execute function private.set_updated_at();

-- ================================================= grade_categories ===

create table if not exists public.grade_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null,
  weight_pct numeric(5,2) not null,
  -- Consumed by Phase 3's grading function (ADR 0005); the columns are
  -- created now so Phase 3 has no schema work of its own.
  drop_lowest_n integer not null default 0,
  replaces_lowest_in_category_id uuid references public.grade_categories(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grade_categories_course_id_name_key unique (course_id, name),
  constraint grade_categories_weight_pct_check check (weight_pct > 0 and weight_pct <= 100),
  constraint grade_categories_drop_lowest_n_check check (drop_lowest_n >= 0),
  constraint grade_categories_no_self_replace_check check (
    replaces_lowest_in_category_id is null or replaces_lowest_in_category_id <> id
  )
);

create index if not exists grade_categories_course_id_idx on public.grade_categories (course_id);
create index if not exists grade_categories_user_id_idx on public.grade_categories (user_id);
create index if not exists grade_categories_replaces_lowest_idx
  on public.grade_categories (replaces_lowest_in_category_id);

alter table public.grade_categories enable row level security;

drop policy if exists grade_categories_owner_policy on public.grade_categories;
create policy grade_categories_owner_policy on public.grade_categories
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop trigger if exists set_updated_at on public.grade_categories;
create trigger set_updated_at
  before update on public.grade_categories
  for each row execute function private.set_updated_at();

-- ====================================================== assignments ===

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  category_id uuid references public.grade_categories(id) on delete set null,
  title text not null,
  kind text not null default 'assignment',
  due_at timestamptz,
  due_is_date_only boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assignments_kind_check check (kind in (
    'assignment', 'exam', 'quiz', 'reading', 'project',
    'paper', 'lab', 'presentation', 'discussion', 'other'
  ))
);

create index if not exists assignments_course_id_due_at_idx on public.assignments (course_id, due_at);
create index if not exists assignments_category_id_idx on public.assignments (category_id);
create index if not exists assignments_user_id_idx on public.assignments (user_id);

alter table public.assignments enable row level security;

drop policy if exists assignments_owner_policy on public.assignments;
create policy assignments_owner_policy on public.assignments
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop trigger if exists set_updated_at on public.assignments;
create trigger set_updated_at
  before update on public.assignments
  for each row execute function private.set_updated_at();

-- =========================================================== grades ===
-- No UI in Phase 2 -- the table exists so Phase 3 has no schema work of
-- its own, same as grade_categories' drop_lowest_n /
-- replaces_lowest_in_category_id columns. One row per assignment
-- (confirmed with Ibrahim): a regrade updates this row, no history.

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  score numeric(7,2) not null,
  max_score numeric(7,2) not null,
  graded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grades_assignment_id_key unique (assignment_id),
  constraint grades_score_check check (score >= 0),
  constraint grades_max_score_check check (max_score > 0)
);

create index if not exists grades_user_id_idx on public.grades (user_id);

alter table public.grades enable row level security;

drop policy if exists grades_owner_policy on public.grades;
create policy grades_owner_policy on public.grades
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop trigger if exists set_updated_at on public.grades;
create trigger set_updated_at
  before update on public.grades
  for each row execute function private.set_updated_at();
