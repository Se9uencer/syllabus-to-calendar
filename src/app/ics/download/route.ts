import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildCalendarIcs, type IcsItem } from "@/lib/ics";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: assignments, error } = await supabase
    .from("assignments")
    .select("id, title, due_at, due_on, due_is_date_only, courses(code)")
    .not("due_at", "is", null);

  if (error) {
    return new NextResponse("Could not build calendar", { status: 500 });
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
      "Content-Disposition": 'attachment; filename="syllabus-to-calendar.ics"',
    },
  });
}
