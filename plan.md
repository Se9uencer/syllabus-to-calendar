# Plan

The live checklist. For the *why* behind any item, see `docs/PLAN.md` (schema
sketch, full rationale) and `docs/adr/` (the decisions that were real
trade-offs). Check items off as they're actually done and deployed/working —
not when the code is merely written. Add sub-items as they're discovered;
don't let this file go stale.

Status: Phase 2 schema + CRUD are in code; Phase 3 grades (calculator,
standing, target projection, scenario sandbox) implemented. Manual entry of
one real quarter and production smoke-checks remain for you.

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

**Auth is now fully wired**, including one dependency the original plan
didn't anticipate — Supabase's built-in mailer won't let you edit the magic
link template at all without custom SMTP configured (a hard lock in the
dashboard, not just a warning). Resolved with Resend (free tier, connected
via its own MCP server mid-session):

- [x] **Vercel env vars** — set, production site confirmed 200 (was 500,
      verified via `get_runtime_errors` before the fix, and a direct fetch
      after)
- [x] **Custom SMTP (Resend)** — required before the magic-link template
      could be edited at all (see `mistakes.md` 2026-08-23 for a real
      mistake made setting this up: a mis-parsed API key from the Resend
      MCP tool's output caused a `535 "Authentication credentials invalid"`
      failure, root-caused via Supabase's own auth logs and fixed)
- [x] **Magic-link email template** points at `/auth/confirm` with the
      `token_hash` flow
- [x] **Public signup disabled** in Supabase Auth settings
- [x] **The one Supabase Auth user** exists and is confirmed — verified
      directly via `select … from auth.users`
- [x] **End-to-end verified** — traced a real magic-link request through
      Supabase's `auth_logs` and Resend's send log: `/otp` → 200, Resend
      shows the email sent and clicked, `/verify` → 200,
      `auth.users.last_sign_in_at` updated. A real session, not an
      assumption.

## Phase 2 — Schema and manual entry

- [x] Migration: `terms`, `term_breaks`, `courses`, `course_meetings`,
      `grade_categories`, `assignments`, `grades` (see `docs/PLAN.md` for
      columns)
- [x] CRUD UI: terms (incl. breaks, finals window)
- [x] CRUD UI: courses (belongs to a term)
- [x] CRUD UI: grade categories per course
- [x] CRUD UI: assignments (belongs to a course + category)
- [ ] Manually enter one real quarter's worth of courses as a working test

## Phase 3 — Grades

- [x] Grading function: pure, takes `(category, weight, score, max)[]`
- [x] Current Standing: graded-work-only average + "X% of grade determined"
- [x] drop-lowest-N per category
- [x] replace-lowest-with between categories
- [x] Target-grade projection, including flagging when a target is
      arithmetically unreachable
- [x] Scenario sandbox: editable copy (add/delete/recategorize/rescore),
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
