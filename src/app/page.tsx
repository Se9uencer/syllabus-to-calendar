import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { FeedPanel } from "./feed-panel";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: active } = await supabase
    .from("ics_tokens")
    .select("id, token")
    .is("revoked_at", null)
    .maybeSingle();

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <p className="text-sm text-neutral-500">Signed in as</p>
      <p className="font-medium">{user?.email}</p>
      <Link
        href="/terms"
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
      >
        Go to terms
      </Link>
      <FeedPanel
        origin={origin}
        activeToken={active ? { id: active.id, token: active.token } : null}
      />
      <form action="/logout" method="post">
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
