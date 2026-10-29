import { notImplemented } from "@/lib/http";

/**
 * /api/uploads
 *
 * Signed DIRECT upload: returns a one-time Supabase Storage upload URL + path for the browser.
 * Image bytes never pass through Vercel (request body limits, cost). Bucket is private; RLS scopes paths to auth.uid().
 */

/** POST: create signed upload URL for {caseId, contentType} */
export async function POST() {
  return notImplemented("POST /api/uploads");
}
