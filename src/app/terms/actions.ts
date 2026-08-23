"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyDbError, type ActionResult } from "@/lib/action-result";

export async function createTerm(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const starts_on = String(formData.get("starts_on") ?? "");
  const ends_on = String(formData.get("ends_on") ?? "");
  const finals_start_on = String(formData.get("finals_start_on") ?? "");
  const finals_end_on = String(formData.get("finals_end_on") ?? "");

  if (!name || !starts_on || !ends_on || !finals_start_on || !finals_end_on) {
    return { ok: false, error: "Fill in every field." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("terms").insert({
    name,
    starts_on,
    ends_on,
    finals_start_on,
    finals_end_on,
  });

  if (error) {
    return { ok: false, error: friendlyDbError(error) };
  }

  revalidatePath("/terms");
  return { ok: true };
}
