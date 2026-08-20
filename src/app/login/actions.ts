"use server";

import { createClient } from "@/lib/supabase/server";

export type SendMagicLinkResult =
  | { ok: true }
  | { ok: false; error: string };

// shouldCreateUser: false means this can never create a new account, no
// matter what email is submitted — only an account that already exists in
// Supabase Auth can receive a link. Combined with the Postgres allow-list
// trigger in supabase/migrations (which rejects any new-account creation
// for an unlisted email in the first place), sign-up is closed at two
// independent layers. See docs/adr/0001 and AGENTS.md.
export async function sendMagicLink(
  _prevState: SendMagicLinkResult | null,
  formData: FormData,
): Promise<SendMagicLinkResult> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { ok: false, error: "Enter an email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });

  if (error) {
    // Deliberately vague: don't reveal whether the email is allow-listed.
    return { ok: false, error: "Couldn't send a link. Try again." };
  }

  return { ok: true };
}
