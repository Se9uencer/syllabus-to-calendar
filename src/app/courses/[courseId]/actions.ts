"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { friendlyDbError, type ActionResult } from "@/lib/action-result";

// ------------------------------------------------------------- course ---

export async function updateCourse(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const instructor = String(formData.get("instructor") ?? "").trim();

  if (!id || !code || !title) {
    return { ok: false, error: "Code and title are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("courses")
    .update({ code, title, instructor: instructor || null })
    .eq("id", id);

  if (error) {
    return { ok: false, error: friendlyDbError(error) };
  }

  revalidatePath(`/courses/${id}`);
  return { ok: true };
}

export async function deleteCourse(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const term_id = String(formData.get("term_id") ?? "");
  if (!id) {
    return { ok: false, error: "Missing course id." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("courses").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return { ok: false, error: "Delete this course's assignments first." };
    }
    return { ok: false, error: friendlyDbError(error) };
  }

  if (term_id) {
    revalidatePath(`/terms/${term_id}`);
  }
  redirect(term_id ? `/terms/${term_id}` : "/terms");
}

// ----------------------------------------------------------- meetings ---

export async function createMeeting(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const course_id = String(formData.get("course_id") ?? "");
  const weekday = Number(formData.get("weekday"));
  const starts_at = String(formData.get("starts_at") ?? "");
  const ends_at = String(formData.get("ends_at") ?? "");

  if (!course_id || Number.isNaN(weekday) || !starts_at || !ends_at) {
    return { ok: false, error: "Fill in every field." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("course_meetings")
    .insert({ course_id, weekday, starts_at, ends_at });

  if (error) {
    return { ok: false, error: friendlyDbError(error) };
  }

  revalidatePath(`/courses/${course_id}`);
  return { ok: true };
}

export async function deleteMeeting(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const course_id = String(formData.get("course_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("course_meetings").delete().eq("id", id);

  if (course_id) {
    revalidatePath(`/courses/${course_id}`);
  }
}

// ---------------------------------------------------------- categories ---

export async function createCategory(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const course_id = String(formData.get("course_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const weight_pct = Number(formData.get("weight_pct"));
  const drop_lowest_n = Number(formData.get("drop_lowest_n") || 0);
  const replaces_lowest_in_category_id =
    String(formData.get("replaces_lowest_in_category_id") ?? "") || null;

  if (!course_id || !name || Number.isNaN(weight_pct)) {
    return { ok: false, error: "Name and weight are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("grade_categories").insert({
    course_id,
    name,
    weight_pct,
    drop_lowest_n: Number.isNaN(drop_lowest_n) ? 0 : drop_lowest_n,
    replaces_lowest_in_category_id,
  });

  if (error) {
    return { ok: false, error: friendlyDbError(error) };
  }

  revalidatePath(`/courses/${course_id}`);
  return { ok: true };
}

export async function updateCategory(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const course_id = String(formData.get("course_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const weight_pct = Number(formData.get("weight_pct"));
  const drop_lowest_n = Number(formData.get("drop_lowest_n") || 0);
  const replaces_lowest_in_category_id =
    String(formData.get("replaces_lowest_in_category_id") ?? "") || null;

  if (!id || !name || Number.isNaN(weight_pct)) {
    return { ok: false, error: "Name and weight are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("grade_categories")
    .update({
      name,
      weight_pct,
      drop_lowest_n: Number.isNaN(drop_lowest_n) ? 0 : drop_lowest_n,
      replaces_lowest_in_category_id,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: friendlyDbError(error) };
  }

  revalidatePath(`/courses/${course_id}`);
  return { ok: true };
}

export async function deleteCategory(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const course_id = String(formData.get("course_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("grade_categories").delete().eq("id", id);

  if (course_id) {
    revalidatePath(`/courses/${course_id}`);
  }
}

// --------------------------------------------------------- assignments ---

export async function createAssignment(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const course_id = String(formData.get("course_id") ?? "");
  const category_id = String(formData.get("category_id") ?? "") || null;
  const title = String(formData.get("title") ?? "").trim();
  const kind = String(formData.get("kind") ?? "assignment");
  // Pre-converted to a UTC ISO instant in the browser (see
  // src/lib/local-datetime.ts) — a Server Action runs on the server, which
  // doesn't know the user's timezone, so the conversion can't happen here.
  const due_at = String(formData.get("due_at") ?? "") || null;
  const due_is_date_only = formData.get("due_is_date_only") === "on";
  const notes = String(formData.get("notes") ?? "").trim();

  if (!course_id || !title) {
    return { ok: false, error: "Title is required." };
  }

  if (category_id) {
    const supabaseCheck = await createClient();
    const { data: category } = await supabaseCheck
      .from("grade_categories")
      .select("course_id")
      .eq("id", category_id)
      .maybeSingle();
    if (!category || category.course_id !== course_id) {
      return { ok: false, error: "That category doesn't belong to this course." };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from("assignments").insert({
    course_id,
    category_id,
    title,
    kind,
    due_at,
    due_is_date_only,
    notes: notes || null,
  });

  if (error) {
    return { ok: false, error: friendlyDbError(error) };
  }

  revalidatePath(`/courses/${course_id}`);
  return { ok: true };
}

export async function updateAssignment(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const course_id = String(formData.get("course_id") ?? "");
  const category_id = String(formData.get("category_id") ?? "") || null;
  const title = String(formData.get("title") ?? "").trim();
  const kind = String(formData.get("kind") ?? "assignment");
  const due_at = String(formData.get("due_at") ?? "") || null;
  const due_is_date_only = formData.get("due_is_date_only") === "on";
  const notes = String(formData.get("notes") ?? "").trim();

  if (!id || !course_id || !title) {
    return { ok: false, error: "Title is required." };
  }

  if (category_id) {
    const supabaseCheck = await createClient();
    const { data: category } = await supabaseCheck
      .from("grade_categories")
      .select("course_id")
      .eq("id", category_id)
      .maybeSingle();
    if (!category || category.course_id !== course_id) {
      return { ok: false, error: "That category doesn't belong to this course." };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("assignments")
    .update({
      category_id,
      title,
      kind,
      due_at,
      due_is_date_only,
      notes: notes || null,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: friendlyDbError(error) };
  }

  revalidatePath(`/courses/${course_id}`);
  revalidatePath(`/courses/${course_id}/assignments/${id}/edit`);
  return { ok: true };
}

export async function deleteAssignment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const course_id = String(formData.get("course_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("assignments").delete().eq("id", id);

  if (course_id) {
    revalidatePath(`/courses/${course_id}`);
  }
}

// -------------------------------------------------------------- grades ---

export async function upsertGrade(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const course_id = String(formData.get("course_id") ?? "");
  const assignment_id = String(formData.get("assignment_id") ?? "");
  const score = Number(formData.get("score"));
  const max_score = Number(formData.get("max_score"));

  if (!course_id || !assignment_id) {
    return { ok: false, error: "Missing assignment." };
  }
  if (Number.isNaN(score) || Number.isNaN(max_score)) {
    return { ok: false, error: "Score and max are required." };
  }

  const supabase = await createClient();
  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, course_id")
    .eq("id", assignment_id)
    .maybeSingle();

  if (!assignment || assignment.course_id !== course_id) {
    return { ok: false, error: "That assignment doesn't belong to this course." };
  }

  const { data: existing } = await supabase
    .from("grades")
    .select("id")
    .eq("assignment_id", assignment_id)
    .maybeSingle();

  const graded_at = new Date().toISOString();

  if (existing) {
    const { error } = await supabase
      .from("grades")
      .update({ score, max_score, graded_at })
      .eq("id", existing.id);
    if (error) {
      return { ok: false, error: friendlyDbError(error) };
    }
  } else {
    const { error } = await supabase.from("grades").insert({
      assignment_id,
      score,
      max_score,
      graded_at,
    });
    if (error) {
      return { ok: false, error: friendlyDbError(error) };
    }
  }

  revalidatePath(`/courses/${course_id}`);
  return { ok: true };
}

export async function deleteGrade(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const course_id = String(formData.get("course_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("grades").delete().eq("id", id);

  if (course_id) {
    revalidatePath(`/courses/${course_id}`);
  }
}
