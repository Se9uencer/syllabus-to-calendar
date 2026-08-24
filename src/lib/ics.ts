export type IcsItem = {
  id: string;
  title: string;
  dueAt: string | null;
  dueOn: string | null;
  dueIsDateOnly: boolean;
  courseCode: string;
};

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let remaining = line;
  parts.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);
  while (remaining.length > 0) {
    parts.push(" " + remaining.slice(0, 74));
    remaining = remaining.slice(74);
  }
  return parts.join("\r\n");
}

function formatUtcStamp(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear().toString().padStart(4, "0");
  const m = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = d.getUTCDate().toString().padStart(2, "0");
  const hh = d.getUTCHours().toString().padStart(2, "0");
  const mm = d.getUTCMinutes().toString().padStart(2, "0");
  const ss = d.getUTCSeconds().toString().padStart(2, "0");
  return `${y}${m}${day}T${hh}${mm}${ss}Z`;
}

function formatDateOnly(dueOn: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueOn)) return null;
  return dueOn.replace(/-/g, "");
}

export function buildCalendarIcs(items: IcsItem[], nowIso?: string): string {
  const now = formatUtcStamp(nowIso ?? new Date().toISOString()) ?? "19700101T000000Z";
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//syllabus-to-calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const item of items) {
    const uid = `assignment-${item.id}@syllabus-to-calendar`;
    const summary = escapeText(`${item.courseCode}: ${item.title}`);
    let dtstartLine: string | null = null;

    if (item.dueIsDateOnly) {
      if (!item.dueOn) continue;
      const date = formatDateOnly(item.dueOn);
      if (!date) continue;
      dtstartLine = `DTSTART;VALUE=DATE:${date}`;
    } else {
      if (!item.dueAt) continue;
      const stamp = formatUtcStamp(item.dueAt);
      if (!stamp) continue;
      dtstartLine = `DTSTART:${stamp}`;
    }

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(dtstartLine);
    lines.push(`SUMMARY:${summary}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
