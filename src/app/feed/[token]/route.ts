import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildCalendarIcs, type IcsItem } from "@/lib/ics";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  if (!token) {
    return new NextResponse("Not found", { status: 404 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return new NextResponse("Calendar feed unavailable", { status: 503 });
  }

  const { data: row } = await admin
    .from("ics_tokens")
    .select("user_id, revoked_at")
    .eq("token", token)
    .maybeSingle();

  if (!row || row.revoked_at) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { data: assignments, error } = await admin
    .from("assignments")
    .select("id, title, due_at, due_on, due_is_date_only, courses(code)")
    .eq("user_id", row.user_id)
    .not("due_at", "is", null);

  if (error) {
    return new NextResponse("Calendar feed unavailable", { status: 503 });
  }

  const items: IcsItem[] = (assignments ?? []).map((a) => {
    const course = a.courses as { code: string } | { code: string }[] | null;
    const code = Array.isArray(course) ? course[0]?.code : course?.code;
    return {
      id: a.id,
      title: a.title,
      dueAt: a.due_at,
      dueOn: a.due_on,
      dueIsDateOnly: a.due_is_date_only,
      courseCode: code ?? "Course",
    };
  });

  const body = buildCalendarIcs(items);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "private, max-age=300",
    },
  });
}
