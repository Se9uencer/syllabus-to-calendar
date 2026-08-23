# Plan

The live checklist. For the *why* behind any item, see `docs/PLAN.md` (schema
sketch, full rationale) and `docs/adr/` (the decisions that were real
trade-offs). Check items off as they're actually done and deployed/working —
not when the code is merely written. Add sub-items as they're discovered;
don't let this file go stale.

Status: Phase 1 scaffolded, and both accounts are wired via MCP (Supabase +
Vercel connectors, connected mid-session). Three small things remain and are
Supabase/Vercel *dashboard* steps with no MCP/API path — see below.

## Phase 1 — Scaffold

- [x] Next.js App Router project, TypeScript, Tailwind
- [x] Supabase project created (`syllabus-to-calendar`, ref
      `eecpacucxtabmdpcjgll`, us-west-1, free tier); local `.env.local`
      wired with the real URL + publishable key (gitignored, not committed)
- [x] Supabase Auth: magic link enabled (code side — `signInWithOtp`,
      `/auth/confirm` callback route, verified against current Supabase docs)
- [x] Allow-list check enforced in Postgres (not just client-side) —
      `supabase/migrations/0001_allowlist.sql` applied to the live project.
      Table + trigger live in a `private` schema, not `public` (see the
      commit that moved it — a SECURITY DEFINER function in `public` is a
      callable PostgREST endpoint unless something stops it). `get_advisors`
      shows only the expected deny-all RLS notice.
- [x] RLS enabled on every table from the first migration onward —
      confirmed via `get_advisors`; the pattern carries into Phase 2
- [x] Deployed to Vercel — project `syllabus-to-calendar` linked to the
      GitHub repo (auto-deploys on every push to
      `claude/course-dashboard-brief-zm65t6`), build verified green
      (`https://syllabus-to-calendar-mu.vercel.app`)

**Three things remain, all manual — no Supabase/Vercel MCP tool reaches
them:**

- [ ] **Vercel env vars.** The live site currently 500s
      (`get_runtime_errors` confirms: "Your project's URL and Key are
      required"). Add in Project Settings → Environment Variables:
      `NEXT_PUBLIC_SUPABASE_URL=https://eecpacucxtabmdpcjgll.supabase.co`,
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ID6rWP2Uv2GhKL0m0tqMQA_rzrX1PCR`,
      and `SUPABASE_SECRET_KEY` — the new `sb_secret_...` key, not the
      legacy `service_role` JWT (Settings → API Keys → "Publishable and
      secret API keys"; grab it from the dashboard, no MCP tool returns it
      by design). Then redeploy.
- [ ] **Disable public signup + point the magic-link email template at
      `/auth/confirm`** — Supabase Auth settings, no config-API tool
      available (README.md step 3).
- [ ] **Create the one Supabase Auth user** for
      `ibrahim.ansari0801@gmail.com` — Authentication → Users → Add user
      (README.md step 4). Nothing can sign in until this exists, since
      `shouldCreateUser: false` means the magic link can't create it.

## Phase 2 — Schema and manual entry

- [ ] Migration: `terms`, `term_breaks`, `courses`, `course_meetings`,
      `grade_categories`, `assignments`, `grades` (see `docs/PLAN.md` for
      columns)
- [ ] CRUD UI: terms (incl. breaks, finals window)
- [ ] CRUD UI: courses (belongs to a term)
- [ ] CRUD UI: grade categories per course
- [ ] CRUD UI: assignments (belongs to a course + category)
- [ ] Manually enter one real quarter's worth of courses as a working test

## Phase 3 — Grades

- [ ] Grading function: pure, takes `(category, weight, score, max)[]`
- [ ] Current Standing: graded-work-only average + "X% of grade determined"
- [ ] drop-lowest-N per category
- [ ] replace-lowest-with between categories
- [ ] Target-grade projection, including flagging when a target is
      arithmetically unreachable
- [ ] Scenario sandbox: editable copy (add/delete/recategorize/rescore),
      clearly distinct in the UI from real data, never persisted as truth

## Phase 4 — Calendar

- [ ] Agenda list: grouped by week, shows course + weight + drift flag
- [ ] Month grid
- [ ] `.ics` feed endpoint at a revocable token URL
- [ ] Stable per-assignment UIDs (derived from assignment id, never
      title/date)
- [ ] Download button serving the same generated body
- [ ] Only Confirmed Items and linked Canvas items appear — never Draft Items

## Phase 5 — Syllabus extraction

- [ ] Upload/paste UI: PDF, image, pasted text — one code path
- [ ] Extraction call: `claude-opus-5` (env-configurable), structured output,
      schema includes `source_quote` and a due-date hint per item
- [ ] Deterministic date resolver: hint + Term → date, or null + flag if
      unresolvable
- [ ] Deterministic sanity checks: weights sum to 100%, dates inside term
      bounds, no duplicate title+date, orphaned items
- [ ] Cross-provider triage pass (second model, different provider — pick and
      pin the model)
- [ ] Review table: sorted by risk (unresolved dates first, then flagged,
      then clean), source quote inline per row, bulk-accept the clean tail
- [ ] Confirmed Items only created through this review step — verify no code
      path bypasses it

## Phase 6 — Canvas

- [ ] Store the Canvas calendar feed URL server-side (credential, never
      logged, never sent to the client)
- [ ] Fetch-on-open with short-lived cache (no cron)
- [ ] Matcher: propose Canvas item ↔ syllabus item links (title similarity +
      date proximity, same course)
- [ ] Link confirmation UI — one-time per assignment, persists
- [ ] Drift detection: Canvas item's date disagrees with a linked Confirmed
      Item's date
- [ ] Drift surfaced as an in-app alert (not relying on the `.ics` feed, which
      refreshes on its own slow schedule) with an acknowledge action

## Open items (not phase-specific)

- [ ] Pin the cross-check model for Phase 5 (must be a different provider than
      Claude)
- [ ] Enter real UW 2026–27 term dates once published
- [ ] Revisit Vercel Hobby cron limits only if fetch-on-open turns out to be
      insufficient (not expected to bind under the current design)
