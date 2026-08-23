// Converts a value from an <input type="date"> or <input type="datetime-local">
// (always the browser's local wall-clock time, with no timezone offset) into
// a correct UTC instant. Must run in the browser, not the server — only the
// browser knows the user's actual local timezone at the moment of input.
//
// JS Date parsing has a footgun here: "YYYY-MM-DD" parses as UTC midnight,
// but "YYYY-MM-DDTHH:MM" (no offset) parses as local time — per spec, not a
// bug. Appending "T00:00" to a bare date forces the local-time branch, so a
// date-only due date round-trips to the correct calendar day instead of
// shifting by the user's UTC offset.
// Returns "" for an empty value or garbage input rather than throwing —
// callers should treat "" the same as "no date entered." Note that a
// partial value (e.g. "2026-10") is not garbage as far as JS Date parsing
// is concerned — "YYYY-MM" is valid ISO 8601 and parses fine — but native
// date/datetime-local inputs never actually emit a partial string through
// their .value in the first place, so this doesn't come up in practice.
export function localInputToIsoUtc(value: string, dateOnly: boolean): string {
  if (!value) return "";
  const withTime = dateOnly ? `${value}T00:00` : value;
  const date = new Date(withTime);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

// The reverse: a UTC ISO instant back to the string an <input type="date">
// or <input type="datetime-local"> expects, in the browser's local
// timezone. Must run client-side, same as localInputToIsoUtc — call it from
// a useEffect (never during initial render), since a Client Component's
// first render also executes on the server, in the server's timezone, and
// computing this there would produce a value that mismatches on hydration.
export function isoUtcToLocalInput(iso: string, dateOnly: boolean): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  if (dateOnly) return `${yyyy}-${mm}-${dd}`;
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}
