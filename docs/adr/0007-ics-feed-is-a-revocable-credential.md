# 7. The .ics feed URL is a revocable credential

- Status: accepted
- Date: 2026-08-24

## Context

Phase 4 publishes deadlines as a calendar feed phones can subscribe to. Calendar
apps fetch that URL without a user session, so RLS-on-`auth.uid()` cannot serve
it. Something has to bypass RLS. At the same time, anyone who learns the URL
can read every due date on the account — the URL is a credential, same shape
as the Canvas calendar feed URL (ADR 0004), just outbound instead of inbound.

A related footgun: date-only assignments were stored only as a UTC timestamptz
of "browser-local midnight at entry." Reconstructing the civil day from that
instant requires knowing the entry timezone. Hardcoding `America/Los_Angeles`
(or any zone) silently shifts the day when entry happened elsewhere.

## Decision

1. **Token in path, revocable.** `ics_tokens` holds an unguessable `token` and
   optional `revoked_at`. The public subscribe URL is `/feed/[token]`. Mint and
   revoke happen under the session client; revoke sets `revoked_at`.

2. **Secret key only after token check.** The public route looks up the token
   with the server-only `SUPABASE_SECRET_KEY` client, rejects unknown/revoked
   tokens with 404, then loads that `user_id`'s assignments. Session RLS still
   owns mint/revoke and the authenticated download at `/ics/download`.

3. **Separate path prefixes.** Public allowlist is `/feed` only
   (`startsWith`). Download stays under `/ics/download` so it never becomes
   public by prefix accident.

4. **Civil date for all-day.** `assignments.due_on` (date) stores the
   YYYY-MM-DD from the browser date input at save time. All-day VEVENTs use
   `DTSTART;VALUE=DATE` from `due_on`, never from reconstructing `due_at`.
   Timed events keep using `due_at` as UTC. Legacy date-only rows without
   `due_on` are omitted from the feed until re-saved.

## Consequences

- Leaking the subscribe URL is a full calendar leak until revoke; the UI must
  say so.
- Google Calendar and similar will keep a stale copy on their refresh schedule;
  revoke stops new fetches, it does not erase caches.
- Secret key is required in Vercel/local for the public feed; missing key fails
  closed (503), not open.
- Existing date-only assignments need one re-save to appear as all-day events.

## Alternatives considered

**Put public and download under `/ics/*` and allowlist `/ics/`.** Rejected —
middleware uses `startsWith`, so `/ics/download` would become public.

**Hardcode America/Los_Angeles for all-day reconstruction.** Rejected — wrong
whenever entry was not Pacific; contradicts the Phase 2 local-midnight design.

**Session cookie on the feed URL.** Rejected — calendar apps do not send the
app's session cookies.
