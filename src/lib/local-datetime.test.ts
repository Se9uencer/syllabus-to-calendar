import { beforeAll, describe, expect, it } from "vitest";
import { isoUtcToLocalInput, localInputToIsoUtc } from "./local-datetime";

// Pinned so assertions can check exact UTC values instead of only round-trip
// behavior — these functions are timezone-sensitive by design (that's the
// whole point of them), so the test run's timezone has to be fixed to make
// the expected values deterministic. Real usage always runs in a browser,
// where "local" is whatever the visitor's system reports; this only fixes
// what "local" means for the test process itself.
beforeAll(() => {
  process.env.TZ = "UTC";
});

describe("localInputToIsoUtc", () => {
  it("returns an empty string for an empty input", () => {
    expect(localInputToIsoUtc("", false)).toBe("");
    expect(localInputToIsoUtc("", true)).toBe("");
  });

  it("returns an empty string for garbage input instead of throwing", () => {
    // Native <input type="date">/<input type="datetime-local"> elements
    // never actually emit a partial value through .value — they're either
    // "" or fully-formed, unlike a plain text input mid-typing. The only
    // realistic "bad" input is something malformed reaching this function
    // some other way.
    expect(localInputToIsoUtc("not-a-date", false)).toBe("");
  });

  it("converts a datetime-local value as local wall-clock time", () => {
    expect(localInputToIsoUtc("2026-10-30T14:00", false)).toBe(
      "2026-10-30T14:00:00.000Z",
    );
  });

  it("forces midnight for a date-only value", () => {
    // This is the bug this whole module exists to avoid: a bare
    // "2026-10-30" parses as UTC midnight per the JS Date spec regardless of
    // timezone, while "2026-10-30T00:00" parses as *local* midnight. Forcing
    // the "T00:00" suffix routes date-only input through the local-time
    // branch instead of the UTC one, so it round-trips to the same calendar
    // day the user picked once displayed back in their own timezone.
    expect(localInputToIsoUtc("2026-10-30", true)).toBe(
      "2026-10-30T00:00:00.000Z",
    );
  });
});

describe("isoUtcToLocalInput", () => {
  it("returns an empty string for an empty or invalid input", () => {
    expect(isoUtcToLocalInput("", false)).toBe("");
    expect(isoUtcToLocalInput("not-a-date", false)).toBe("");
  });

  it("formats a UTC instant back to a datetime-local value", () => {
    expect(isoUtcToLocalInput("2026-10-30T14:00:00.000Z", false)).toBe(
      "2026-10-30T14:00",
    );
  });

  it("formats a UTC instant back to a date-only value", () => {
    expect(isoUtcToLocalInput("2026-10-30T14:00:00.000Z", true)).toBe(
      "2026-10-30",
    );
  });
});

describe("round-trip", () => {
  it("is the identity for a datetime value", () => {
    const original = "2026-10-30T14:00";
    const iso = localInputToIsoUtc(original, false);
    expect(isoUtcToLocalInput(iso, false)).toBe(original);
  });

  it("is the identity for a date-only value", () => {
    const original = "2026-10-30";
    const iso = localInputToIsoUtc(original, true);
    expect(isoUtcToLocalInput(iso, true)).toBe(original);
  });
});
