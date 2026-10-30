import { badRequest, json, notFound, serverError, unauthorized } from "@/lib/http";
import type { CaseStatus, TablesUpdate } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/**
 * /api/cases/[caseId]
 *
 * Single case CRUD for the signed-in owner.
 */

/** GET: get case details including timeline events, photos, and messages */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { caseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorized();
  }

  const { data: caseItem, error } = await supabase
    .from("cases")
    .select(
      `
      *,
      case_images (*),
      case_events (*),
      messages (*)
    `,
    )
    .eq("id", caseId)
    .single();

  if (error || !caseItem) {
    return notFound(`Case '${caseId}' not found`);
  }

  return json(caseItem);
}

/** PATCH: update case (e.g. status or title) */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { caseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorized();
  }

  let body: { title?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const updates: TablesUpdate<"cases"> = {};
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.status !== undefined) updates.status = body.status as CaseStatus;

  if (Object.keys(updates).length === 0) {
    return badRequest("No valid fields provided to update");
  }

  // Get current case status for comparison
  const { data: currentCase } = await supabase
    .from("cases")
    .select("status")
    .eq("id", caseId)
    .single();

  const { data: updatedCase, error } = await supabase
    .from("cases")
    .update(updates)
    .eq("id", caseId)
    .select()
    .single();

  if (error || !updatedCase) {
    return serverError("Failed to update case", error?.message);
  }

  // If status changed, record a Status timeline event
  if (body.status && currentCase && currentCase.status !== body.status) {
    await supabase.from("case_events").insert({
      case_id: caseId,
      user_id: user.id,
      kind: "Status",
      title: `Status: ${currentCase.status} → ${body.status}`,
      detail: `Status changed to ${body.status}.`,
    });
  }

  return json(updatedCase);
}

/** DELETE: delete case and its associated data */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { caseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorized();
  }

  // Retrieve images to remove from Storage bucket
  const { data: images } = await supabase
    .from("case_images")
    .select("storage_path")
    .eq("case_id", caseId);

  if (images && images.length > 0) {
    const paths = images.map((img) => img.storage_path);
    await supabase.storage.from("skin-images").remove(paths);
  }

  const { error } = await supabase.from("cases").delete().eq("id", caseId);

  if (error) {
    return serverError("Failed to delete case", error.message);
  }

  return json({ success: true, deletedCaseId: caseId });
}
