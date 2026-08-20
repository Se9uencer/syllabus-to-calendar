# Agent instructions

This file is for any AI coding agent working in this repo — read it before
writing code.

## Read these first, in order

1. **`CONTEXT.md`** — the glossary. Terms here (Term, Course, Draft Item,
   Confirmed Item, Observation, Link, Drift, Grade Category, Scenario, …) are
   used narrowly and deliberately. If you're about to name something, check
   whether it already has a name here first.
2. **`docs/adr/`** — five decisions, each the result of a real trade-off. Don't
   relitigate them in code review with yourself; if one turns out to be wrong,
   say so and propose a new ADR that supersedes it, don't just quietly drift
   away from it.
3. **`docs/PLAN.md`** — the resolved design: schema sketch, phase breakdown,
   open assumptions.
4. **`plan.md`** (root) — the live checklist. This is what's actually in
   progress right now, kept current as work happens.
5. **`mistakes.md`** — a running log of things that went wrong and had to be
   fixed. Check it before doing something that smells like a repeat.

## Non-negotiables (from the ADRs — don't undo these casually)

- Every table carries `user_id`; every RLS policy filters on `auth.uid()`. This
  app is single-user by design, but the schema isn't (ADR 0001).
- Relative dates ("Week 5, Friday") are never computed by an LLM. The model
  emits a structured hint; a deterministic resolver in code computes the date
  from the course's Term (ADR 0002).
- Nothing an LLM extracts from a syllabus becomes a Confirmed Item — and
  nothing a Confirmed Item feeds (dashboard, grade calculator, `.ics` export)
  — without a human confirming it first. No confidence threshold skips this
  (ADR 0003).
- Canvas has no REST API available to us (personal access tokens are disabled
  for UW students). The only Canvas input is the read-only calendar feed,
  server-side only, treated as a credential. Its job is drift detection, not
  being a primary source (ADR 0004).
- Grading policy is a pure function over `(category, weight, score, max)`.
  Curves, extra credit, and one-offs go in the scenario sandbox by direct
  editing — don't build a rules vocabulary for them. Only drop-lowest-N and
  replace-lowest-with are persistent, per category (ADR 0005).

## Stack

Next.js (App Router) · TypeScript · Tailwind · Supabase (Postgres, Storage,
Auth) · Vercel. Server Components query Supabase directly — there is no JSON
API layer (see `docs/PLAN.md`), so don't introduce one for a feature that
doesn't need it.

## Working conventions

- No comments unless they explain a non-obvious WHY (a workaround, a hidden
  constraint) — never restate what the code already says.
- No speculative abstraction. If only one course ever needs a rule, don't
  build a rule engine for it — this is exactly the mistake ADR 0005 avoids.
- Don't add an API route, an auth mode, or a config knob the plan doesn't call
  for. If you think one is needed, say so and update `plan.md`/`docs/PLAN.md`
  rather than adding it silently.
- Single user, but write RLS policies as if that could change — per ADR 0001,
  the tenancy code paths are unverified by construction (only one user ever
  exercises them), so be extra careful they're actually correct, not just
  untested.

## Before ending a task

- Update `plan.md`: check off what's done, add anything discovered that isn't
  on the list yet.
- If something broke, was misdesigned, or took a wrong turn before being
  fixed, add an entry to `mistakes.md`. Skip it for ordinary iteration
  (writing code, then fixing a typo) — it's for the kind of mistake worth not
  repeating.
- If a decision got made that's hard to reverse, would surprise a future
  reader, and came from a real trade-off, write an ADR in `docs/adr/` (see the
  existing five for the format) and add the term to `CONTEXT.md` if it
  introduces new language.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
