"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { friendlyDbError, type ActionResult } from "@/lib/action-result";

export async function updateTerm(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const starts_on = String(formData.get("starts_on") ?? "");
  const ends_on = String(formData.get("ends_on") ?? "");
  const finals_start_on = String(formData.get("finals_start_on") ?? "");
  const finals_end_on = String(formData.get("finals_end_on") ?? "");

  if (!id || !name || !starts_on || !ends_on || !finals_start_on || !finals_end_on) {
    return { ok: false, error: "Fill in every field." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("terms")
    .update({ name, starts_on, ends_on, finals_start_on, finals_end_on })
    .eq("id", id);

  if (error) {
    return { ok: false, error: friendlyDbError(error) };
  }

  revalidatePath("/terms");
  revalidatePath(`/terms/${id}`);
  return { ok: true };
}

export async function deleteTerm(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { ok: false, error: "Missing term id." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("terms").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return { ok: false, error: "Delete this term's courses first." };
    }
    return { ok: false, error: friendlyDbError(error) };
  }

  revalidatePath("/terms");
  redirect("/terms");
}

export async function createBreak(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const term_id = String(formData.get("term_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const starts_on = String(formData.get("starts_on") ?? "");
  const ends_on = String(formData.get("ends_on") ?? "");

  if (!term_id || !name || !starts_on || !ends_on) {
    return { ok: false, error: "Fill in every field." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("term_breaks")
    .insert({ term_id, name, starts_on, ends_on });

  if (error) {
    return { ok: false, error: friendlyDbError(error) };
  }

  revalidatePath(`/terms/${term_id}`);
  return { ok: true };
}

export async function deleteBreak(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const term_id = String(formData.get("term_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("term_breaks").delete().eq("id", id);

  if (term_id) {
    revalidatePath(`/terms/${term_id}`);
  }
}

export async function createCourse(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const term_id = String(formData.get("term_id") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const instructor = String(formData.get("instructor") ?? "").trim();

  if (!term_id || !code || !title) {
    return { ok: false, error: "Code and title are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("courses").insert({
    term_id,
    code,
    title,
    instructor: instructor || null,
  });

  if (error) {
    return { ok: false, error: friendlyDbError(error) };
  }

  revalidatePath(`/terms/${term_id}`);
  return { ok: true };
}
