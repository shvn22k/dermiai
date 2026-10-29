import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasPublicEnv, publicEnv } from "@/lib/env.public";

let warned = false;

/** Refresh the Supabase auth session cookie on every request (called from src/proxy.ts). */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Dev only: without Supabase configured, skip the refresh so UI work doesn't need a backend.
  // Production still throws below, so a misconfigured deploy fails loudly.
  if (process.env.NODE_ENV !== "production" && !hasPublicEnv()) {
    if (!warned) {
      warned = true;
      console.warn(
        "[dermiai] Supabase env not set; skipping session refresh. Copy apps/web/.env.example to apps/web/.env.local to enable auth.",
      );
    }
    return response;
  }

  const { url, publishableKey } = publicEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Do not run code between createServerClient and this call (see Supabase SSR docs).
  await supabase.auth.getClaims();
  return response;
}
