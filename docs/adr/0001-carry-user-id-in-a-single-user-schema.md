# 1. Carry `user_id` in a single-user schema

- Status: accepted
- Date: 2026-08-20

## Context

This app is, by explicit design, a personal tool for one person. There are no
plans to open it to classmates, there is no billing, and the auth layer exists
only to keep strangers out.

That makes tenancy columns look like dead weight. Every table would carry a
`user_id` that only ever holds one value, every row-level security policy would
compare it against a session that can only ever belong to one account, and every
query would filter on a predicate that never excludes anything.

The alternative — omitting tenancy entirely — is cheaper today but bakes the
single-user assumption into the shape of the data rather than into a single
policy. Undoing it later means touching every table, every policy, and every
query at once.

## Decision

Every domain table carries a `user_id` foreign key, and row-level security
policies filter on it, even though exactly one user will ever exist.

## Consequences

- Each new table costs a `user_id` column, an index, and an RLS policy. This is
  a small, recurring tax paid on work that has no functional payoff today.
- Opening the app to a second person becomes a permissions and UI change rather
  than a schema migration. The data model is already correct for it.
- A missing `user_id` filter cannot silently leak data between users while there
  is only one user, which means the tenancy code paths are effectively untested.
  They must be treated as unverified until a second account exists.
- This repository doubles as a reference for how to do tenancy properly, which
  matters because the same patterns are being applied to a separate multi-user
  project.

## Alternatives considered

**Zero-tenancy — no `user_id` anywhere, RLS reduced to "is the caller
authenticated".** Simplest possible queries and policies, and adding tenancy
later would be a migration with a one-row backfill. Rejected because the
recurring cost of carrying the column was judged smaller than the cost of a
schema-wide retrofit, and because the multi-tenant shape has value as a
reference even while unused.

**No auth at all — a single shared password held in an environment variable.**
Fewest moving parts, but no session model, no way to revoke access without a
redeploy, and no identity to attach data to. Rejected as too weak a foundation
for something holding academic records.
