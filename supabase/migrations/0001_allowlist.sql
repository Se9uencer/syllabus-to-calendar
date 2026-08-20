-- This app is single-user by design (see docs/adr/0001, CONTEXT.md). Signup
-- is closed at the Auth layer already (see the "Magic link" setup step in
-- README.md — public signups are disabled in the Supabase dashboard), but
-- that's a project setting, not something version-controlled or enforced if
-- someone toggles it back on by accident. This migration adds a second,
-- independent enforcement point directly in Postgres: no row can ever be
-- inserted into auth.users for an email that isn't on this list, regardless
-- of what the dashboard setting says or what any client sends.

create table if not exists public.allowed_emails (
  email text primary key
);

-- No policies are defined, which — with RLS enabled — denies all access via
-- the anon/authenticated roles and the auto-generated API. Only the
-- SECURITY DEFINER function below (and the table owner) can read it.
alter table public.allowed_emails enable row level security;

create or replace function public.enforce_signup_allowlist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.allowed_emails
    where email = lower(new.email)
  ) then
    raise exception 'signup not allowed for %', new.email
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_signup_allowlist_trigger on auth.users;

create trigger enforce_signup_allowlist_trigger
  before insert on auth.users
  for each row
  execute function public.enforce_signup_allowlist();

-- Seed the one allowed account. Add more rows here (and re-run this
-- migration, or a new one) if that ever needs to change.
insert into public.allowed_emails (email)
values ('ibrahim.ansari0801@gmail.com')
on conflict (email) do nothing;
