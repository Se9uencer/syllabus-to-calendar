import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TermEditForm } from "./term-edit-form";
import { BreakForm } from "./break-form";
import { CourseForm } from "./course-form";
import { deleteBreak } from "./actions";

export default async function TermDetailPage({
  params,
}: {
  params: Promise<{ termId: string }>;
}) {
  const { termId } = await params;
  const supabase = await createClient();

  const { data: term } = await supabase
    .from("terms")
    .select("id, name, starts_on, ends_on, finals_start_on, finals_end_on")
    .eq("id", termId)
    .maybeSingle();

  if (!term) {
    notFound();
  }

  const [{ data: breaks }, { data: courses }] = await Promise.all([
    supabase
      .from("term_breaks")
      .select("id, name, starts_on, ends_on")
      .eq("term_id", termId)
      .order("starts_on"),
    supabase
      .from("courses")
      .select("id, code, title")
      .eq("term_id", termId)
      .order("code"),
  ]);

  return (
    <main className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{term.name}</h1>
        <Link href="/terms" className="text-sm text-neutral-500 underline">
          All terms
        </Link>
      </div>

      <TermEditForm term={term} />

      <section className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <h2 className="text-sm font-medium">Breaks</h2>
        {breaks && breaks.length > 0 ? (
          <ul className="space-y-2">
            {breaks.map((b) => (
              <li key={b.id} className="flex items-center justify-between text-sm">
                <span>
                  {b.name} — {b.starts_on} to {b.ends_on}
                </span>
                <form action={deleteBreak}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="term_id" value={termId} />
                  <button type="submit" className="text-red-600 underline">
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">No breaks yet.</p>
        )}
        <BreakForm termId={termId} />
      </section>

      <section className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <h2 className="text-sm font-medium">Courses</h2>
        {courses && courses.length > 0 ? (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {courses.map((course) => (
              <li key={course.id} className="py-2">
                <Link href={`/courses/${course.id}`} className="block text-sm">
                  <span className="font-medium">{course.code}</span> — {course.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">No courses yet.</p>
        )}
        <CourseForm termId={termId} />
      </section>
    </main>
  );
}
