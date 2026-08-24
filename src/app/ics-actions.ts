"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyDbError, type ActionResult } from "@/lib/action-result";

export async function createIcsToken(): Promise<ActionResult & { token?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { data: existing } = await supabase
    .from("ics_tokens")
    .select("id")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: "You already have an active feed URL. Revoke it first to rotate." };
  }

  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const { error } = await supabase.from("ics_tokens").insert({ token });
  if (error) {
    return { ok: false, error: friendlyDbError(error) };
  }

  revalidatePath("/");
  return { ok: true, token };
}

export async function revokeIcsToken(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("ics_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("revoked_at", null);

  revalidatePath("/");
}
