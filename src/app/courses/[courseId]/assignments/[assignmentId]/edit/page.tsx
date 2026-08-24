import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AssignmentEditForm } from "./assignment-edit-form";

export default async function AssignmentEditPage({
  params,
}: {
  params: Promise<{ courseId: string; assignmentId: string }>;
}) {
  const { courseId, assignmentId } = await params;
  const supabase = await createClient();

  const [{ data: assignment }, { data: categories }] = await Promise.all([
    supabase
      .from("assignments")
      .select("id, title, kind, due_at, due_on, due_is_date_only, category_id, notes")
      .eq("id", assignmentId)
      .maybeSingle(),
    supabase
      .from("grade_categories")
      .select("id, name")
      .eq("course_id", courseId)
      .order("name"),
  ]);

  if (!assignment) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit assignment</h1>
        <Link href={`/courses/${courseId}`} className="text-sm text-neutral-500 underline">
          Back to course
        </Link>
      </div>
      <AssignmentEditForm
        courseId={courseId}
        categories={categories ?? []}
        assignment={assignment}
      />
    </main>
  );
}
