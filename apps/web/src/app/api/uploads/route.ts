import { json, serverError, unauthorized } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

/**
 * /api/uploads
 *
 * Signed DIRECT upload: returns a one-time Supabase Storage upload URL + path for the browser.
 * Image bytes never pass through Vercel (request body limits, cost). Bucket is private; RLS scopes paths to auth.uid().
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorized();
  }

  let body: { caseId?: string; filename?: string; contentType?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Optional JSON body
  }

  const caseId = body.caseId?.trim() || "general";
  const rawFilename = body.filename?.replace(/[^a-zA-Z0-9._-]/g, "_") || "photo.jpg";
  const uniqueId = crypto.randomUUID();
  const storagePath = `${user.id}/${caseId}/${uniqueId}-${rawFilename}`;

  const { data, error } = await supabase.storage
    .from("skin-images")
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    return serverError("Failed to create signed upload URL", error?.message);
  }

  return json({
    path: storagePath,
    token: data.token,
    signedUrl: data.signedUrl,
  });
}
