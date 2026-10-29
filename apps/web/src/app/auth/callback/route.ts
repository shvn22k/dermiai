import { notImplemented } from "@/lib/http";

/**
 * /auth/callback
 *
 * Supabase Auth redirect target: exchange the OAuth / magic-link `code` for a session cookie.
 */

/** GET: exchange code, then redirect to `next` */
export async function GET() {
  return notImplemented("GET /auth/callback");
}
