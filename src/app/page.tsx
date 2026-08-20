import { createClient } from "@/lib/supabase/server";

// Smoke-test home page for the Phase 1 scaffold: proves the session and RLS
// wiring work end to end. Replaced by the real dashboard in Phase 2.
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <p className="text-sm text-neutral-500">Signed in as</p>
      <p className="font-medium">{user?.email}</p>
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
