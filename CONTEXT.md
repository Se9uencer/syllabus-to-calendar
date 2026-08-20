# Context

A glossary of the language this project uses. Terms only — no implementation
detail, no decisions, no plans. When a word here conflicts with how it is used
in conversation or in code, this file wins or gets corrected; it does not get
quietly ignored.

## Term

A single UW quarter — Autumn, Winter, Spring, or Summer — with a first day of
instruction, a last day of instruction, any breaks inside it, and a finals
window. A Term is the calendar a Course lives inside, and it is the anchor
against which Relative Dates are resolved.

Deliberately called *Term* and not *semester* or *quarter*: UW runs quarters, but
the concept is "the academic period a course belongs to," and naming it after
the period's length would make the word wrong if that ever changes.

## Course

One class taken in one Term. A Course is the thing that has assignments, a
grading breakdown, an instructor, and office hours. The same class taken twice,
or a class with the same name in a different Term, is a different Course.

## Relative Date

A due date a syllabus states in terms of the academic calendar rather than the
civil calendar — "Week 3", "the Friday after spring break", "the class after the
midterm". A Relative Date is not a date; it is an expression that becomes a date
only once resolved against a Term.

## Resolved Date

The civil-calendar date a Relative Date becomes after being anchored to a Term.
Every deadline the app shows, exports, or counts toward a grade is a Resolved
Date — the app never displays an unresolved expression as though it were a
deadline.

## Source Document

A syllabus as it actually arrived — an uploaded PDF, a photograph of a printed
page, or text pasted out of a Canvas page or Google Doc. All three are the same
kind of thing to this app: the instructor's stated word about a Course, in
whatever form it was published.

## Extraction

One reading of one Source Document, producing Draft Items. An Extraction is a
proposal about what a document says. It is never, on its own, a statement about
what is true.

## Draft Item

Something an Extraction claims — an assignment, an exam, a grading weight, an
office hour. A Draft Item has been read but not believed. It does not appear on
the dashboard, does not count toward a grade, and is never exported to a
calendar.

## Confirmed Item

A Draft Item a human has looked at and accepted, possibly after correcting it.
Only Confirmed Items are course facts. The line between Draft and Confirmed is
the only place data becomes real, and nothing crosses it automatically.

## Assignment

A single obligation in a Course — a problem set, an exam, a quiz, a reading, a
project milestone. An Assignment is a real thing in the world with one due date
at any given moment. It is not a row from any particular source; several sources
may describe it.

## Observation

What one source says about one Assignment at one moment — the syllabus's
description of it, or what the Canvas Feed currently reports. Observations are
kept, not collapsed: each source stays on record saying what it said, which is
what makes disagreement between them detectable.

## Link

A confirmed statement that two Observations describe the same Assignment. Links
are proposed by matching and established by a person, once, and then persist.
A Link is about identity, not about which source is right.

## Drift

When the Canvas Feed's current Observation disagrees with what was previously
confirmed for a Linked Assignment — most often because an instructor moved a
deadline after publishing the syllabus. Drift is the thing the Canvas Feed exists
to reveal; a syllabus cannot report it, having been written before it happened.

## Canvas Feed

The read-only calendar feed Canvas publishes for a student. It carries titles,
due dates, and a stable identifier per item, and nothing else — no scores, no
grading weights, no policies. Its authority is narrow and total: within titles
and dates it is the most current source there is, and outside them it is silent.

## Grade Category

A named bucket in one Course's grading breakdown, with a weight — "Homework
40%", "Labs 25%", "Participation 10%". Categories are whatever a given syllabus
says they are; they are not drawn from a fixed list, and two courses share a
category name only by coincidence. Assignments belong to a Category, which is
what makes it possible to speak about a group of them at once.

## Current Standing

What a Course's grade is right now, computed over graded work only, alongside how
much of the final grade has actually been determined. Ungraded work is absent
from the calculation, not counted as zero — a number that treats unwritten exams
as failures describes nothing.

## Scenario

A working copy of a Course's graded items that can be edited freely — items
added, deleted, moved between Categories, scores and totals changed — to see what
the resulting grade would be. A Scenario is a question, never a record. Nothing
in one affects Current Standing, and Current Standing is never derived from one.
