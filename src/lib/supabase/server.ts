import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Components, Route Handlers, and Server Actions only. Every table
// this touches is behind RLS filtering on auth.uid() (see docs/adr/0001) —
// this client carries the caller's session, it is never the service role.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, which can't write cookies.
            // Safe to ignore as long as middleware.ts is also refreshing
            // the session on every request.
          }
        },
      },
    },
  );
}
