# 3. Human review is a mandatory gate, and verification only triages it

- Status: accepted
- Date: 2026-08-20

## Context

Extraction reads a syllabus and proposes deadlines, exam dates, and grading
weights. Some proportion of those proposals will be wrong, and the wrong ones do
not look wrong — a deadline off by a week renders exactly like a correct one.

An obvious way to reduce review effort is to verify extraction automatically and
skip review when verification passes: have a second model from a different
provider re-read the document, and accept anything the two agree on.

This does not hold up where it matters. Two models reading the same document
fail together precisely where the document is ambiguous — a misaligned table, a
week reference with no weekday, a date stated inconsistently in two places. Both
produce the same plausible reading, agree, and the error ships with elevated
confidence. Agreement filters careless errors, which are the ones a human would
have caught in seconds anyway; it is weakest on ambiguity, which is where syllabi
actually fail.

The cost side is lopsided. Review is a couple of minutes per syllabus, three or
four syllabi a quarter — well under an hour a year. What it buys is not sitting
out a midterm. A wrong exam date is not a defect to be fixed in the next
iteration; by the time it is visible, the exam has happened.

## Decision

No extracted data becomes a Confirmed Item without a human accepting it. There
is no confidence threshold, no agreement condition, and no "obviously fine" path
that writes through.

Verification exists, but its output is an ordering, not a verdict. Two things
feed it: deterministic checks in application code (grading weights summing to
100%, dates falling inside the Term, duplicate titles, assignments with no date)
and a cross-check pass by a model from a different provider than the one that
extracted. Anything either flags sorts to the top of the review queue. Everything
else sorts below it and can be accepted in bulk.

## Consequences

- Review effort scales with the number of syllabi, permanently. This is accepted
  as the cost of the guarantee.
- Verification can be improved, degraded, or removed entirely without changing
  what the app is allowed to trust, because it never had authority in the first
  place. A failure of the cross-check provider makes review slower, not wrong.
- A second provider means a second SDK, a second key, and a second failure mode
  in the parse path. That path must treat cross-check failure as non-fatal.
- Draft and Confirmed have to be genuinely separate states in the schema, not a
  boolean on one row that code could forget to check.
- Bulk-accepting the unflagged tail is a human choice made with the flags in
  view, which is different in kind from software deciding the tail is safe.

## Alternatives considered

**Cross-model agreement auto-saves; only disagreements are reviewed.** The
original proposal, and the fastest option by a wide margin. Rejected because
correlated failure on ambiguous input means the errors that survive agreement are
systematically the dangerous ones, and because the downside of a missed exam is
not recoverable.

**Deterministic checks only, no second model.** Cheaper and simpler, one provider.
Not rejected on the merits — the deterministic checks do most of the useful work.
The cross-check was kept on top of it because a faster review is worth a few
cents per syllabus, given that it changes only the ordering.
