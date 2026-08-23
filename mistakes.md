# Mistakes

A running log of things that went wrong during development and had to be
walked back — kept so the same mistake doesn't get made twice, by a human or
an agent working this repo later.

This is not a bug tracker and not a changelog. Don't log ordinary iteration
(wrote code, found a typo, fixed it). Log it when something got built, shipped,
or decided, turned out to be wrong in a way that cost real rework, and the
lesson generalizes beyond the one spot it happened.

## Format

```
## YYYY-MM-DD — short title

**What happened:** what was built/assumed/decided.
**Why it was wrong:** what broke, or what it would have broken.
**Fix:** what changed.
**Lesson:** the generalizable takeaway — what to check next time to catch
this class of mistake earlier.
```

## Log

## 2026-08-23 — Mis-parsed a secret from an MCP tool's unstructured output

**What happened:** Created a Resend API key via the Resend MCP tool to configure
Supabase's custom SMTP. The tool's response concatenated the token directly
into the following sentence with no delimiter — literally
`Token: <token>IMPORTANT: The token above is only shown once...` — and the
token was transcribed by eye instead of extracted programmatically. Two
characters from "IMPORTANT" were carried into the value handed to Ibrahim to
paste into Supabase's SMTP password field.

**Why it was wrong:** SMTP auth failed with `535 "Authentication credentials
invalid"` on every magic-link request. Supabase's error was properly logged
and reported "email couldn't send," but the real cause — a corrupted
password — took a deliberate check of Supabase's auth logs to surface, since
the app's own login form intentionally shows a generic error (see
`src/app/login/actions.ts`) to avoid leaking which emails are allow-listed.

**Fix:** Regenerated the key and this time stripped the tool's own
known-constant suffix from the raw string in code (Python slicing) rather
than reading it, to get an exact value with no ambiguity. Removed the bad
key from Resend.

**Lesson:** When a tool hands back a secret embedded in unstructured prose
with no clear delimiter, don't transcribe it by eye — extract it
programmatically (strip the known fixed prefix/suffix text) before handing
it anywhere it'll be pasted as a credential. A single wrong character in a
secret fails closed with an opaque error, and the failure surfaces far from
where the mistake was made.
