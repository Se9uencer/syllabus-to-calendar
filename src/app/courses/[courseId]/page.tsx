import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseEditForm } from "./course-edit-form";
import { MeetingForm } from "./meeting-form";
import { CategoryForm } from "./category-form";
import { CategoryEditForm } from "./category-edit-form";
import { AssignmentForm } from "./assignment-form";
import { deleteMeeting, deleteAssignment } from "./actions";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, code, title, instructor, term_id")
    .eq("id", courseId)
    .maybeSingle();

  if (!course) {
    notFound();
  }

  const [{ data: meetings }, { data: categories }, { data: assignments }] =
    await Promise.all([
      supabase
        .from("course_meetings")
        .select("id, weekday, starts_at, ends_at")
        .eq("course_id", courseId)
        .order("weekday"),
      supabase
        .from("grade_categories")
        .select("id, name, weight_pct, drop_lowest_n, replaces_lowest_in_category_id")
        .eq("course_id", courseId)
        .order("name"),
      supabase
        .from("assignments")
        .select("id, title, kind, due_at, due_is_date_only, category_id")
        .eq("course_id", courseId)
        .order("due_at", { nullsFirst: false }),
    ]);

  const categoryList = categories ?? [];

  return (
    <main className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {course.code} — {course.title}
        </h1>
        <Link href={`/terms/${course.term_id}`} className="text-sm text-neutral-500 underline">
          Term
        </Link>
      </div>

      <CourseEditForm course={course} />

      <section className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <h2 className="text-sm font-medium">Meeting times</h2>
        {meetings && meetings.length > 0 ? (
          <ul className="space-y-2">
            {meetings.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <span>
                  {WEEKDAY_LABELS[m.weekday]} {m.starts_at}–{m.ends_at}
                </span>
                <form action={deleteMeeting}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="course_id" value={courseId} />
                  <button type="submit" className="text-red-600 underline">
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">No meeting times yet.</p>
        )}
        <MeetingForm courseId={courseId} />
      </section>

      <section className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <h2 className="text-sm font-medium">Grade categories</h2>
        {categoryList.length > 0 ? (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {categoryList.map((cat) => (
              <CategoryEditForm
                key={cat.id}
                courseId={courseId}
                category={cat}
                otherCategories={categoryList.filter((c) => c.id !== cat.id)}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">No categories yet.</p>
        )}
        <CategoryForm courseId={courseId} otherCategories={categoryList} />
      </section>

      <section className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <h2 className="text-sm font-medium">Assignments</h2>
        {assignments && assignments.length > 0 ? (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {assignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                <Link
                  href={`/courses/${courseId}/assignments/${a.id}/edit`}
                  className="flex-1"
                >
                  <span className="font-medium">{a.title}</span>{" "}
                  <span className="text-neutral-500">
                    ({a.kind}
                    {a.category_id &&
                      ` · ${categoryList.find((c) => c.id === a.category_id)?.name ?? ""}`}
                    )
                  </span>
                  <br />
                  <span className="text-neutral-500">
                    {a.due_at
                      ? a.due_is_date_only
                        ? new Date(a.due_at).toLocaleDateString()
                        : new Date(a.due_at).toLocaleString()
                      : "No due date"}
                  </span>
                </Link>
                <form action={deleteAssignment}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="course_id" value={courseId} />
                  <button type="submit" className="text-red-600 underline">
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">No assignments yet.</p>
        )}
        <AssignmentForm courseId={courseId} categories={categoryList} />
      </section>
    </main>
  );
}
