import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasPublicEnv, publicEnv } from "@/lib/env.public";
import type { Database } from "@/lib/supabase/database.types";

let warned = false;

/** Refresh the Supabase auth session cookie on every request and protect app routes. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Until auth lands or when testing without Supabase env, the app runs on demo mode.
  if (!hasPublicEnv()) {
    if (!warned) {
      warned = true;
      console.warn(
        "[dermiai] Supabase env not set; running in demo mode. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to enable full auth.",
      );
    }
    return response;
  }

  const { url, publishableKey } = publicEnv();

  const supabase = createServerClient<Database>(url, publishableKey, {
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

  // getUser verifies the auth token against Supabase Auth servers
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtectedAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/cases") ||
    pathname.startsWith("/consult") ||
    pathname.startsWith("/reminders") ||
    pathname.startsWith("/ingredients");

  // Unauthenticated users attempting to access protected pages are redirected to sign-in
  if (!user && isProtectedAppRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/sign-in";
    redirectUrl.searchParams.set("next", pathname);

    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value);
    });
    return redirectResponse;
  }

  // Already authenticated user visiting /sign-in is redirected to /dashboard
  if (user && pathname === "/sign-in") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.searchParams.delete("next");

    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value);
    });
    return redirectResponse;
  }

  return response;
}
