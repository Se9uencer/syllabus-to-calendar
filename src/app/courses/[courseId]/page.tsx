import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculate, type GradeCategoryInput, type GradeItemInput } from "@/lib/grades";
import { CourseEditForm } from "./course-edit-form";
import { MeetingForm } from "./meeting-form";
import { CategoryForm } from "./category-form";
import { CategoryEditForm } from "./category-edit-form";
import { AssignmentForm } from "./assignment-form";
import { GradeForm } from "./grade-form";
import { StandingBanner } from "./standing-banner";
import { TargetProjection } from "./target-projection";
import { ScenarioSandbox } from "./scenario-sandbox";
import { deleteMeeting, deleteAssignment } from "./actions";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type AssignmentRow = {
  id: string;
  title: string;
  kind: string;
  due_at: string | null;
  due_on: string | null;
  due_is_date_only: boolean;
  category_id: string | null;
};

type GradeRow = {
  id: string;
  assignment_id: string;
  score: number;
  max_score: number;
};

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
        .select("id, title, kind, due_at, due_on, due_is_date_only, category_id")
        .eq("course_id", courseId)
        .order("due_at", { nullsFirst: false }),
    ]);

  const categoryList = categories ?? [];
  const assignmentList = (assignments ?? []) as AssignmentRow[];
  const assignmentIds = assignmentList.map((a) => a.id);

  let gradeList: GradeRow[] = [];
  if (assignmentIds.length > 0) {
    const { data: grades } = await supabase
      .from("grades")
      .select("id, assignment_id, score, max_score")
      .in("assignment_id", assignmentIds);
    gradeList = (grades ?? []) as GradeRow[];
  }

  const gradeByAssignment = new Map(
    gradeList.map((g) => [g.assignment_id, g] as const),
  );

  const gradeCategories: GradeCategoryInput[] = categoryList.map((c) => ({
    id: c.id,
    weightPct: Number(c.weight_pct),
    dropLowestN: c.drop_lowest_n,
    replacesLowestInCategoryId: c.replaces_lowest_in_category_id,
  }));

  const gradeItems: GradeItemInput[] = assignmentList.map((a) => {
    const g = gradeByAssignment.get(a.id);
    return {
      id: a.id,
      categoryId: a.category_id,
      score: g ? Number(g.score) : null,
      max: g ? Number(g.max_score) : null,
    };
  });

  const standing = calculate(gradeCategories, gradeItems);
  const categoryNames = Object.fromEntries(categoryList.map((c) => [c.id, c.name]));

  const scenarioItems = assignmentList.map((a) => {
    const g = gradeByAssignment.get(a.id);
    return {
      id: a.id,
      title: a.title,
      categoryId: a.category_id,
      score: g ? Number(g.score) : null,
      max: g ? Number(g.max_score) : null,
    };
  });

  const byCategory = categoryList.map((cat) => ({
    cat,
    assignments: assignmentList.filter((a) => a.category_id === cat.id),
  }));
  const uncategorized = assignmentList.filter((a) => a.category_id == null);

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

      <StandingBanner result={standing} categoryNames={categoryNames} />
      <TargetProjection categories={gradeCategories} items={gradeItems} />

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

      <section className="space-y-4 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <h2 className="text-sm font-medium">Assignments</h2>
        {assignmentList.length > 0 ? (
          <div className="space-y-6">
            {byCategory.map(({ cat, assignments: group }) =>
              group.length === 0 ? null : (
                <div key={cat.id} className="space-y-2">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    {cat.name} · {Number(cat.weight_pct)}%
                    {cat.drop_lowest_n > 0 ? ` · drop ${cat.drop_lowest_n}` : ""}
                  </h3>
                  <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {group.map((a) => (
                      <AssignmentGradeRow
                        key={a.id}
                        courseId={courseId}
                        assignment={a}
                        grade={gradeByAssignment.get(a.id) ?? null}
                      />
                    ))}
                  </ul>
                </div>
              ),
            )}
            {uncategorized.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Uncategorized
                </h3>
                <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {uncategorized.map((a) => (
                    <AssignmentGradeRow
                      key={a.id}
                      courseId={courseId}
                      assignment={a}
                      grade={gradeByAssignment.get(a.id) ?? null}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No assignments yet.</p>
        )}
        <AssignmentForm courseId={courseId} categories={categoryList} />
      </section>

      <ScenarioSandbox
        categories={gradeCategories}
        initialItems={scenarioItems}
        categoryNames={categoryNames}
      />
    </main>
  );
}

function AssignmentGradeRow({
  courseId,
  assignment: a,
  grade,
}: {
  courseId: string;
  assignment: AssignmentRow;
  grade: GradeRow | null;
}) {
  return (
    <li className="py-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/courses/${courseId}/assignments/${a.id}/edit`} className="flex-1">
          <span className="font-medium">{a.title}</span>{" "}
          <span className="text-neutral-500">({a.kind})</span>
          <br />
          <span className="text-neutral-500">
            {a.due_is_date_only && a.due_on
              ? a.due_on
              : a.due_at
                ? a.due_is_date_only
                  ? new Date(a.due_at).toLocaleDateString()
                  : new Date(a.due_at).toLocaleString()
                : "No due date"}
          </span>
          {grade && (
            <>
              <br />
              <span className="text-neutral-700 dark:text-neutral-300">
                {Number(grade.score)} / {Number(grade.max_score)}
              </span>
            </>
          )}
        </Link>
        <form action={deleteAssignment}>
          <input type="hidden" name="id" value={a.id} />
          <input type="hidden" name="course_id" value={courseId} />
          <button type="submit" className="text-red-600 underline">
            Delete
          </button>
        </form>
      </div>
      <GradeForm
        courseId={courseId}
        assignmentId={a.id}
        grade={
          grade
            ? {
                id: grade.id,
                score: Number(grade.score),
                max_score: Number(grade.max_score),
              }
            : null
        }
      />
    </li>
  );
}
