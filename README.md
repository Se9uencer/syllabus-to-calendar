# syllabus-to-calendar

A personal course dashboard for one student on UW's quarter system.

It holds courses, assignments, grading breakdowns, and grades. It computes what
your grade is now and what it would be under a hypothetical. It reads syllabi so
you don't have to type them in. It watches Canvas so you find out when a deadline
moves. And it publishes everything as a calendar feed your phone subscribes to.

## Where things are written down

- **`CONTEXT.md`** — the glossary. What the words mean here. Read this first;
  several of them are used more narrowly than usual.
- **`docs/adr/`** — decisions that were hard to reverse, would look surprising
  without the reasoning, and came from a real trade-off. Five so far.
- **`docs/PLAN.md`** — the resolved design and the build order.
- **`plan.md`** — the live checklist.
- **`AGENTS.md`** — instructions for any AI agent working in this repo.

## Stack

Next.js (App Router) · TypeScript · Tailwind · Supabase (Postgres, Storage, Auth)
· Vercel

## Setup

### 1. Create the Supabase project

Create a project at [supabase.com](https://supabase.com). From **Project
Settings → API**, copy the values into `.env.local` (copy `.env.example`
first):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 2. Apply the allow-list migration

`supabase/migrations/0001_allowlist.sql` closes signup to everyone except the
one email seeded in that file — see `docs/adr/0001`. Apply it with the
[Supabase CLI](https://supabase.com/docs/guides/cli):

```
supabase link --project-ref <your-project-ref>
supabase db push
```

(Or paste the file into the SQL Editor in the dashboard, once.)

### 3. Disable public signup, and configure the magic-link email template

In **Authentication → Sign In / Providers → Email**, turn **off** "Allow new
users to sign up." The Postgres trigger from step 2 blocks it either way, but
this closes it at the Auth layer too — two independent points, neither
dependent on the other staying configured correctly.

In **Authentication → Email Templates → Magic Link**, change the link to use
the `token_hash` flow instead of Supabase's default implicit-flow redirect,
so the session can be established server-side (`src/app/auth/confirm`):

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/
```

### 4. Create the one account

Since public signup is off, create the allowed user manually: **Authentication
→ Users → Add user**, using the same email seeded in the migration. No
password needed — this app only ever signs in via magic link.

### 5. Run it

```
npm install
npm run dev
```

Visiting the app redirects to `/login` if there's no session (see
`src/middleware.ts`); requesting a magic link and following it signs you in.

### 6. Deploy

Push to Vercel and set the same three environment variables there. No cron,
no other config — see `docs/adr/0004` for why nothing is scheduled.

## Status

Phase 1 (scaffold) built: Next.js + Tailwind, Supabase Auth via magic link,
the Postgres allow-list, session-refresh middleware gating the whole app.
Setup steps above (creating the Supabase project, applying the migration,
and deploying) still need doing with real credentials. See `plan.md` for
what's next.
