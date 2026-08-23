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

The Supabase project (`syllabus-to-calendar`, ref `eecpacucxtabmdpcjgll`) and
the Vercel project are already created and linked — Vercel auto-deploys on
every push to `claude/course-dashboard-brief-zm65t6`. The allow-list
migration (`supabase/migrations/0001_allowlist.sql`) is applied to the live
database. What's left are three dashboard-only steps with no API/MCP path:

### 1. Add environment variables in Vercel

Project Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://eecpacucxtabmdpcjgll.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ID6rWP2Uv2GhKL0m0tqMQA_rzrX1PCR
SUPABASE_SECRET_KEY=<sb_secret_... from Settings → API Keys → "Publishable and secret API keys">
```

Use the new `sb_secret_...` secret key, not the legacy `service_role` key —
same privileges (bypasses RLS), but independently rotatable and rejected if
a browser ever sends it (see [Supabase's migration
guide](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys)).
If the project only shows legacy keys, there's a "Create new API keys"
button on that same page. Not readable via the Supabase MCP tools by
design — grab it from the dashboard. Redeploy after adding these (the live
site 500s until then — expected, see `plan.md`).

For local dev, put the same three in `.env.local` (copy `.env.example`
first) — this file already exists locally and is gitignored.

### 2. Disable public signup, and configure the magic-link email template

In **Authentication → Sign In / Providers → Email**, turn **off** "Allow new
users to sign up." The Postgres trigger applied in step 2 above blocks it
either way, but this closes it at the Auth layer too — two independent
points, neither dependent on the other staying configured correctly.

In **Authentication → Email Templates → Magic Link**, change the link to use
the `token_hash` flow instead of Supabase's default implicit-flow redirect,
so the session can be established server-side (`src/app/auth/confirm`):

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/
```

### 3. Create the one account

Since public signup is off, create the allowed user manually: **Authentication
→ Users → Add user**, using the same email seeded in the migration
(`ibrahim.ansari0801@gmail.com`). No password needed — this app only ever
signs in via magic link. Nothing can sign in until this exists.

### Run it locally

```
npm install
npm run dev
```

Visiting the app redirects to `/login` if there's no session (see
`src/proxy.ts`); requesting a magic link and following it signs you in.

## Status

Phase 1 (scaffold) built and deployed: Next.js + Tailwind, Supabase Auth via
magic link, the Postgres allow-list (applied to the live project, in a
`private` schema — not `public`), session-refresh middleware gating the
whole app, Vercel project linked and auto-deploying. The three dashboard
steps above are what's left before the live site actually works. See
`plan.md` for details and what's next.
