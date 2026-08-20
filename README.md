# syllabus-to-calendar

A personal course dashboard for one student on UW's quarter system.

It holds courses, assignments, grading breakdowns, and grades. It computes what
your grade is now and what it would be under a hypothetical. It reads syllabi so
you don't have to type them in. It watches Canvas so you find out when a deadline
moves. And it publishes everything as a calendar feed your phone subscribes to.

## Where things are written down

- **`CONTEXT.md`** — the glossary. What the words mean here. Read this first;
  several of them are used more narrowly than usual.
- **`docs/adr/`** — decisions that were hard to reverse, would look surprising
  without the reasoning, and came from a real trade-off. Five so far.
- **`docs/PLAN.md`** — the resolved design and the build order.

## Stack

Next.js (App Router) · TypeScript · Tailwind · Supabase (Postgres, Storage, Auth)
· Vercel

## Status

Design resolved, no code yet. Phase 1 is the scaffold.
