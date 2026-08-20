# 4. Canvas enters through the read-only feed, and its job is drift detection

- Status: accepted
- Date: 2026-08-20

## Context

The original plan assumed the Canvas REST API, reached with a personal access
token the student generates themselves. That would have supplied assignments,
per-section due-date overrides, submissions, and grades — enough to make Canvas
the app's primary data source and reduce syllabus parsing to a supplement.

Token self-generation is configured per institution. It is documented as
available at UW, but checking the actual account settings showed the option is
not present: personal access tokens are disabled for students. Other
institutions have made the same change. No amount of design works around an
endpoint that cannot be authenticated against.

Scraping Canvas with a browser session cookie would technically work and was
rejected outright — it violates acceptable use, and building a personal tool on
a terms violation is not worth the deadlines it would surface.

What remains is the per-student calendar feed Canvas publishes: a read-only
iCalendar URL carrying titles, due dates, and a stable identifier per item. No
grades. No grading weights. No submission state.

## Decision

Canvas is ingested solely through its read-only calendar feed, fetched
server-side. Grades and scores are entered by hand; there is no automated source
for them.

The feed's purpose is not to supply the assignment list — the syllabus does that
in more detail. Its purpose is to reveal Drift. A syllabus is frozen the week it
is published; instructors move deadlines afterward and record the move in Canvas.
The feed is therefore the only source in the system capable of reporting that a
confirmed due date has become wrong, and a changed date surfaces as an alert
rather than a silent overwrite.

Where a Link exists, Canvas is authoritative for the due date and the syllabus is
authoritative for weight, type, and description. A feed item with no Link is a
new Assignment and appears without a review step: Canvas is not inferring
anything, so the review gate that governs Extraction does not apply to it.

The feed URL is unguessable and unauthenticated, which makes it a credential. It
is stored server-side and never sent to the browser.

## Consequences

- The grade calculator becomes entirely manually fed. That raises its value
  rather than lowering it — it is now the only place grade information exists at
  all, instead of a second view of something Canvas already computes.
- The syllabus parser carries most of the app's value, since it is the only
  source for weights, exams, policies, and office hours.
- Sync is a poll, not a subscription. Drift is discovered when the feed is next
  fetched, not when the instructor makes the change.
- Feed items are sparse. Matching them to richly described syllabus items relies
  on titles that instructors are under no obligation to keep consistent.
- If UW ever re-enables personal access tokens, the REST API becomes an
  additional source of Observations rather than a rewrite: the model already
  assumes several sources describe one Assignment.

## Alternatives considered

**Skip Canvas entirely and subscribe to its feed directly in a calendar app,
alongside this app's own feed.** No ingestion code, no matching, no linking UI.
Rejected because overlapping deadlines then appear twice in the calendar with no
indication which is current, and because Drift becomes invisible — the whole
reason the feed is worth having.

**Ingest the feed and let Canvas dates silently overwrite confirmed ones.** Less
interface to build. Rejected because a moved deadline is information worth
seeing, and an overwrite destroys the evidence that anything moved.

**Scrape the Canvas web interface with a session cookie.** Would restore grades
and weights. Rejected as a terms-of-use violation.
