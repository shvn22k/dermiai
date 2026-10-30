import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env.public";
import type { Database } from "@/lib/supabase/database.types";

/** Supabase client acting as the signed-in user (RLS applies). Use in route handlers / server components. */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = publicEnv();
  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only. src/proxy.ts refreshes the session.
        }
      },
    },
  });
}
