# 6. Grading arithmetic

- Status: accepted
- Date: 2026-08-24

## Context

ADR 0005 decided that grading is a pure function over items and that only
drop-lowest-N and replace-lowest-with are persistent policies. It did not pin
down the arithmetic. A wrong Current Standing number is silently wrong for the
whole quarter — the failure mode that ADR 0005 exists to prevent — so the
formulas need to be decided once and tested, not rediscovered in the UI.

## Decision

One pure function in `src/lib/grades.ts` owns all of the following.

**Item ratio.** `score / max`. Scores above `max` are allowed (extra credit on
a single item) without a separate rules vocabulary.

**Drop, then replace.** Within each category, among graded items only, drop the
`min(n, gradedCount)` lowest ratios. Ties break by lower `max`, then by `id`.
The category average is the mean of kept ratios. A category with nothing left
after drops is omitted from standing — never treated as zero.

Then each source category whose `replacesLowestInCategoryId` points at a target:
if the source has an average and it is strictly higher than the target's lowest
kept ratio, that one slot is rewritten to the source average. The source still
counts at its own weight. Multiple sources targeting the same category apply
greedily in `id` order; a replaced slot is not replaced again.

**Current Standing.** Renormalized weighted average over categories that still
have kept graded items. Ungraded work is absent, never counted as zero.

**X% determined.** Not renormalized. Each category contributes
`weightPct * keptGraded / max(itemCount - dropLowestN, 0)` using assignments
as entered (future work is not invented). Sum those shares.

**Target projection.** Fill every ungraded categorized item with a uniform
trial ratio `r`, then run the same drop/replace pipeline. Course grade on the
syllabus scale is `sum(weight * avg) / sum(weights)` over categories that have
an average after that fill.

- `maxPossible` uses `r = 1`; `minPossible` uses `r = 0`
- Unreachable when `maxPossible < target`
- Already locked when `minPossible >= target`
- Otherwise binary-search the uniform `r` on remaining items that hits the target

Targets are local UI state and are never persisted.

## Consequences

- Current Standing and Scenarios share one implementation; a Scenario is an
  edited copy of the same input array.
- The determined share and the standing percentage answer different questions
  and must not be confused in the UI.
- Projection assumes a uniform future ratio across remaining items. Courses
  where remaining work is uneven still need the Scenario sandbox for a
  more precise question.

## Alternatives considered

**Renormalize "% determined" the same way as standing.** Rejected — that would
always report 100% once any graded work exists in every category that has
grades, which is not "how much of the syllabus weight is locked."

**Replace the whole target category with the source average.** Rejected —
syllabi that say "the final replaces your lowest midterm" mean one slot, not
the whole bucket.

**Drop after replace.** Rejected — dropping first matches the usual reading
(drop the worst quiz, then maybe replace a weak midterm) and keeps replace
operating on the kept set.
