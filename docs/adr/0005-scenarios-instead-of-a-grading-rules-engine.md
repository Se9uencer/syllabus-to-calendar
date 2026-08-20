# 5. Scenarios instead of a grading rules engine

- Status: accepted
- Date: 2026-08-20

## Context

Real syllabi state grading policies that a plain weighted average gets wrong:
the lowest quiz is dropped, the final replaces a weak midterm, extra credit adds
points outside the denominator, a curve is announced in week six and appears in
no document at all.

The direct approach is to model these as rules attached to Grade Categories, in a
vocabulary rich enough to cover what syllabi say. The vocabulary then has to be
extracted from prose by the parser, maintained as new phrasings appear, and
extended every time a course does something unanticipated. Taken far enough it
becomes an expression language — a sub-project with its own failure modes, and a
new place to look when a displayed grade seems wrong.

The alternative is direct manipulation: let a person edit a working copy of their
graded items freely — delete an item, add one, move it to another Category,
change a score or a total — and see the resulting grade. Every policy above is
expressible that way without any vocabulary at all, including the curve that no
vocabulary could have covered.

These are not equivalent, and the difference is who has to remember. A rule is
true continuously; a Scenario is an action someone takes. A dropped-lowest policy
left unmodeled means the displayed grade is wrong for the whole quarter — wrong
in the direction that makes the student work harder than they need to — and it
only tells the truth on days they remember to open a Scenario and delete a quiz.

## Decision

Grading is a pure function over a list of graded items, each carrying a Category,
a weight, a score, and a total. Current Standing is that function applied to the
real items. A Scenario is the same function applied to an edited copy. There is
one implementation of the arithmetic.

Two policies are modeled persistently, because being silently wrong about them
all quarter has a cost: drop-lowest-N within a Category, and replace-lowest-with,
where one component's score substitutes for a weaker one. Everything else —
extra credit, curves, one-off adjustments, hypotheticals — is expressed by
editing a Scenario.

## Consequences

- The sandbox costs little once the calculator exists: it is an editable copy of
  an array passed to the same function.
- Anything a syllabus can say about grading is expressible, including policies
  never anticipated, because the escape hatch is unrestricted editing rather than
  an enumerated case.
- Two persistent rules mean the parser needs to recognize only two policy shapes
  in prose, not an open-ended set.
- Policies outside those two are invisible to Current Standing. A course with an
  unusual scheme will show a number that is honest about the items it knows and
  silent about the policy it does not.
- Scenarios must be unmistakably separate from records in the interface. A
  hypothetical grade that gets mistaken for a real one is worse than no
  hypothetical at all.

## Alternatives considered

**A full rules vocabulary attached to Categories.** Correct without maintenance
across more cases, and no manual step. Rejected because the vocabulary is
open-ended, has to be extracted from prose, and still fails on curves —
so the manual escape hatch would have been needed regardless, at which point most
of the vocabulary stops earning its complexity.

**A general expression language per course.** Handles everything. Rejected as a
sub-project, and as a new and hard-to-debug source of wrong-looking grades in an
app whose entire purpose is to be trusted about grades.

**Sandbox only, no persistent rules.** The simplest possible version. Rejected
because drop-lowest and replace-lowest are common enough that a passively wrong
dashboard number would be the normal case rather than the exception.
