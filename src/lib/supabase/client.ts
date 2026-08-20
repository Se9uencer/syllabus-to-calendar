import { createBrowserClient } from "@supabase/ssr";

// Client Component usage only. Never import this into a Server Component,
// Route Handler, or Server Action — use lib/supabase/server.ts there instead,
// so RLS is evaluated with the right cookies-derived session either way.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
