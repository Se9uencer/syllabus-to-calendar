# 2. Resolve relative dates in code, not in the model

- Status: accepted
- Date: 2026-08-20

## Context

Syllabi state a large share of their deadlines against the academic calendar
rather than the civil one: "Week 5, Friday", "the Monday after spring break",
"the class following the midterm". Turning those into real dates requires the
Term's calendar, which the app already stores.

The extraction step is an LLM reading a document. It would be natural to hand it
the Term's dates in the prompt and ask for finished ISO dates back — one step,
no resolver to write, a much flatter output schema.

The problem is the failure mode. A deadline computed a week early is
indistinguishable, on screen and in an exported calendar, from a correct one.
There is no parse error, no exception, no visible anomaly — just a wrong date
that gets trusted. Date arithmetic is also the part of the task least likely to
be reproducible run to run.

There is a second, quieter cost. Term dates get entered by hand and will
sometimes be wrong. If dates were computed during extraction, correcting a Term
start date would require re-uploading and re-parsing every affected syllabus, at
cost, with no guarantee the second parse matches the first in any other respect.

## Decision

The model never computes a date. Extraction returns the deadline expression as
written, plus a structured hint drawn from a small closed vocabulary — a week
offset with a weekday, a named calendar landmark, an explicit date. A
deterministic resolver in application code turns a hint plus a Term into a
Resolved Date.

Expressions the resolver cannot handle are stored with a null date and the raw
text preserved, and are surfaced for manual entry during review. They never
reach the dashboard, the grade calculator, or the exported calendar feed as if
they were real deadlines.

## Consequences

- Date resolution is reproducible and testable without calling a model. The
  resolver's edge cases can be covered by ordinary unit tests.
- Correcting a Term date re-derives every deadline anchored to it, with no
  re-parsing and no cost.
- The extraction schema is more complex than "return a date", and the hint
  vocabulary has to be maintained as new phrasings show up in real syllabi.
- Some hints are not resolvable in one pass, because they reference another
  extracted item ("the class after the midterm"). These either resolve in a
  dependency-ordered second pass or fall through to manual entry.
- Any expression outside the vocabulary degrades to manual entry rather than to
  a guess. Manual entry is a visible cost; a wrong guess is not.

## Alternatives considered

**The model returns finished dates, with the Term calendar supplied in the
prompt.** Simplest by a wide margin, no resolver, flat schema. Rejected because
its errors are silent and its output is not reproducible, and because it makes
correcting a Term date expensive.

**Both — the model returns a date, code resolves independently, disagreements
are flagged.** Would catch model errors that the code path alone cannot. Rejected
as strictly more work than resolving in code, since the resolver has to exist
either way, plus reconciliation logic on top of it, to protect against a step
that would no longer be load-bearing.
