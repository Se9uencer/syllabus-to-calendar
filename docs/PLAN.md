# Implementation Plan

Written after the design interview. Every decision below traces to that session;
the ones that were genuine trade-offs are recorded in `docs/adr/`, and the
language is defined in `CONTEXT.md`.

## What this app is

A personal course dashboard for one student on UW's quarter system. It holds
courses, assignments, grading breakdowns, and grades; it computes what your grade
currently is and what it would be under a hypothetical; and it publishes your
deadlines as a calendar feed you subscribe to from your phone.

Three sources feed it: what you type, what a syllabus says (read by a model,
confirmed by you), and what Canvas's calendar feed currently reports.

## Resolved decisions

| Area | Decision |
|---|---|
| Name | `syllabus-to-calendar`, unchanged |
| Stack | Next.js App Router, TypeScript, Tailwind, Supabase, Vercel Hobby |
| Tenancy | `user_id` on every table, RLS filters on it — ADR 0001 |
| Data access | Server Components query Supabase directly; no JSON API layer |
| Term anchoring | A `terms` record per quarter, entered by hand; courses belong to a term |
| Date resolution | Model emits hints, code computes dates — ADR 0002 |
| Extraction model | `claude-opus-5`, model id in an env var |
| Syllabus inputs | PDF, image, and pasted text — one code path, no OCR step |
| Review | Mandatory human gate; verification only reorders the queue — ADR 0003 |
| Verification | Deterministic checks plus a cross-provider second read, both advisory |
| Canvas | Read-only calendar feed; its job is drift detection — ADR 0004 |
| Canvas linking | Matcher proposes, human confirms once, link persists |
| Grades | Manual entry only; Canvas cannot supply them |
| Grade model | Pure function; scenarios instead of a rules engine — ADR 0005 |
| Persistent rules | drop-lowest-N and replace-lowest-with, per category |
| Time views | Agenda list and month grid |
| Export | Hosted `.ics` feed at a revocable token URL, plus a download button |
| Auth | Supabase magic link, allow-list enforced in Postgres |
| Scheduling | None. Canvas fetched when the app is opened, cached briefly |
| Deadline | None. Correctness over speed |

## Schema sketch

Not final — the first migration is where it gets settled. Every table carries
`user_id` per ADR 0001.

```
terms                 name, starts_on, ends_on, finals_start_on, finals_end_on
term_breaks           term_id, name, starts_on, ends_on
courses               term_id, code, title, instructor
course_meetings       course_id, weekday, starts_at, ends_at
grade_categories      course_id, name, weight_pct,
                      drop_lowest_n, replaces_lowest_in_category_id
assignments           course_id, category_id, title, kind, due_at,
                      due_is_date_only, notes
grades                assignment_id, score, max_score, graded_at

source_documents      course_id, kind, storage_path, raw_text
extractions           source_document_id, model, prompt_version, raw_output,
                      status
draft_items           extraction_id, kind, payload, source_quote, due_hint,
                      resolved_due_at, flags, status, assignment_id

canvas_feeds          url (treated as a credential), last_fetched_at
canvas_items          feed_id, canvas_uid, summary, dtstart, url,
                      first_seen_at, last_seen_at
links                 assignment_id, canvas_item_id, confirmed_at
drift_events          assignment_id, old_due_at, new_due_at, detected_at,
                      acknowledged_at

ics_tokens            token, created_at, revoked_at
```

Scenarios have no table. They are an edited copy of an array held in the browser,
passed to the same grading function as real data, and discarded — ADR 0005.

## Phases

Ordered so each layer is exercised by real use before the next one depends on it.

**1 — Scaffold.** Next.js + Tailwind, Supabase project, magic-link auth,
allow-list check in Postgres, RLS enabled with policies on `auth.uid()`. Deploy
to Vercel immediately so deployment is never a late surprise.

**2 — Schema and manual entry.** The migration above, plus CRUD for terms,
courses, categories, and assignments. Unglamorous and load-bearing: this is where
everything else writes.

**3 — Grades.** The grading function, Current Standing with "X% of the grade
determined", drop-lowest and replace-lowest, target projection including when a
target becomes unreachable, and the scenario sandbox. At the end of this phase
the app is already worth more than Canvas's free feed.

**4 — Calendar.** Agenda list grouped by week with course, weight, and drift
flags; month grid for spotting crunch weeks; `.ics` feed on a token URL with
UIDs derived from assignment ids, plus a download button.

**5 — Syllabus extraction.** Upload or paste, structured extraction on
`claude-opus-5` returning values with a `source_quote` and a due hint per item,
the deterministic date resolver, the deterministic sanity checks, the
cross-provider triage pass, and the review table sorted by risk. Nothing reaches
`assignments` without confirmation.

**6 — Canvas.** Feed ingestion, the proposed-link UI, drift detection and
acknowledgement.

## Assumptions and open items

- Canvas personal access tokens are disabled for UW students. Confirmed by
  checking the account settings, and the reason the REST API is out — ADR 0004.
  If this changes, the REST API becomes an additional source, not a rewrite.
- The Canvas feed URL comes from Canvas → Calendar → Calendar Feed. It is
  unauthenticated and therefore a credential: server-side only, never logged.
- The cross-check provider and exact model id are not yet pinned. It must be a
  different provider than the extraction model for the independence argument to
  hold — a same-family second read mostly reproduces the first one's mistakes.
- UW quarter dates are entered by hand from the published academic calendar.
- Google Calendar refreshes subscribed feeds on its own slow schedule. Drift
  alerts surface in the app; the feed is not an alerting channel.
- Vercel Hobby cron limits are irrelevant under the current design, since there
  is no scheduled job. Revisit only if fetch-on-open proves insufficient.
