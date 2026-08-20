# Plan

The live checklist. For the *why* behind any item, see `docs/PLAN.md` (schema
sketch, full rationale) and `docs/adr/` (the decisions that were real
trade-offs). Check items off as they're actually done and deployed/working —
not when the code is merely written. Add sub-items as they're discovered;
don't let this file go stale.

Status: Phase 1 scaffolded. Four items below need Ibrahim's Supabase/Vercel
credentials to finish — see README.md Setup for the exact steps.

## Phase 1 — Scaffold

- [x] Next.js App Router project, TypeScript, Tailwind
- [ ] Supabase project created; env vars wired (local + Vercel) — manual,
      needs a real Supabase account (README.md step 1)
- [x] Supabase Auth: magic link enabled (code side — `signInWithOtp`,
      `/auth/confirm` callback route; the email template still needs
      pointing at it manually, README.md step 3)
- [x] Allow-list check enforced in Postgres (not just client-side) —
      `supabase/migrations/0001_allowlist.sql`, a trigger on `auth.users`,
      independent of the dashboard signup toggle
- [x] RLS enabled on every table from the first migration onward —
      `allowed_emails` has RLS on with no policies (deny-all); the pattern
      carries into Phase 2's domain tables
- [ ] Deployed to Vercel (`vercel.app` subdomain) — manual, needs a real
      Vercel account (README.md step 6)

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
