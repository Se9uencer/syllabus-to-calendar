-- Phase 4: revocable .ics subscribe tokens + civil due date for date-only
-- assignments (so export does not reconstruct the day from a timezone-bound
-- timestamptz — see ADR 0007).

-- ======================================================== ics_tokens ===

create table if not exists public.ics_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  token text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint ics_tokens_token_key unique (token)
);

create index if not exists ics_tokens_user_id_idx on public.ics_tokens (user_id);
create index if not exists ics_tokens_token_idx on public.ics_tokens (token);

alter table public.ics_tokens enable row level security;

drop policy if exists ics_tokens_owner_policy on public.ics_tokens;
create policy ics_tokens_owner_policy on public.ics_tokens
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================== assignments.due_on ===
-- Civil calendar day for date-only dues. Written from the browser date
-- input (YYYY-MM-DD) at save time. Null for timed dues and for legacy
-- rows that have not been re-saved. No automatic backfill: reconstructing
-- the civil day from due_at requires knowing the entry timezone, which
-- we did not store.

alter table public.assignments
  add column if not exists due_on date;

alter table public.assignments
  drop constraint if exists assignments_due_on_date_only_check;

alter table public.assignments
  add constraint assignments_due_on_date_only_check check (
    due_on is null or due_is_date_only = true
  );
