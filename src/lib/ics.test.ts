import { describe, expect, it } from "vitest";
import { buildCalendarIcs, type IcsItem } from "./ics";

const base: IcsItem = {
  id: "11111111-1111-1111-1111-111111111111",
  title: "Homework 1",
  dueAt: null,
  dueOn: null,
  dueIsDateOnly: false,
  courseCode: "CSE142",
};

describe("buildCalendarIcs", () => {
  it("returns an empty calendar with no items", () => {
    const body = buildCalendarIcs([], "2026-01-01T00:00:00.000Z");
    expect(body).toContain("BEGIN:VCALENDAR");
    expect(body).toContain("END:VCALENDAR");
    expect(body).not.toContain("BEGIN:VEVENT");
  });

  it("emits a stable UID from assignment id", () => {
    const body = buildCalendarIcs(
      [{ ...base, dueAt: "2026-10-30T14:00:00.000Z" }],
      "2026-01-01T00:00:00.000Z",
    );
    expect(body).toContain(
      "UID:assignment-11111111-1111-1111-1111-111111111111@syllabus-to-calendar",
    );
  });

  it("emits VALUE=DATE from dueOn for date-only items", () => {
    const body = buildCalendarIcs(
      [
        {
          ...base,
          dueIsDateOnly: true,
          dueOn: "2026-10-09",
          dueAt: "2026-10-08T22:00:00.000Z",
        },
      ],
      "2026-01-01T00:00:00.000Z",
    );
    expect(body).toContain("DTSTART;VALUE=DATE:20261009");
    expect(body).not.toContain("DTSTART:20261008");
  });

  it("skips date-only items without dueOn", () => {
    const body = buildCalendarIcs(
      [{ ...base, dueIsDateOnly: true, dueAt: "2026-10-08T22:00:00.000Z" }],
      "2026-01-01T00:00:00.000Z",
    );
    expect(body).not.toContain("BEGIN:VEVENT");
  });

  it("emits timed DTSTART as UTC Z", () => {
    const body = buildCalendarIcs(
      [{ ...base, dueAt: "2026-10-30T14:00:00.000Z" }],
      "2026-01-01T00:00:00.000Z",
    );
    expect(body).toContain("DTSTART:20261030T140000Z");
  });

  it("escapes commas semicolons and newlines in SUMMARY", () => {
    const body = buildCalendarIcs(
      [
        {
          ...base,
          title: "A, B; C\nD",
          dueAt: "2026-10-30T14:00:00.000Z",
        },
      ],
      "2026-01-01T00:00:00.000Z",
    );
    expect(body).toContain("SUMMARY:CSE142: A\\, B\\; C\\nD");
  });
});
