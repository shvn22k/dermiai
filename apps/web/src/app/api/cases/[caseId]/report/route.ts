import { json, notFound, unauthorized } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

/**
 * /api/cases/[caseId]/report
 *
 * Export clinical summary report data for the user to share with a doctor or dermatologist.
 */
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

  // 1. Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 2. Fetch case with photos, timeline, and messages
  const { data: caseItem, error: caseError } = await supabase
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

  if (caseError || !caseItem) {
    return notFound(`Case '${caseId}' not found`);
  }

  const report = {
    exportedAt: new Date().toISOString(),
    patient: {
      name: profile?.full_name || "Anonymous",
      skinType: profile?.skin_type,
      fitzpatrickTone: profile?.fitzpatrick_tone,
      allergies: profile?.allergies || [],
      medications: profile?.medications || [],
    },
    case: {
      id: caseItem.id,
      title: caseItem.title,
      bodySite: caseItem.body_site,
      status: caseItem.status,
      openedAt: caseItem.created_at,
      lastUpdated: caseItem.updated_at,
    },
    images: (caseItem.case_images || []).map((img) => ({
      id: img.id,
      storagePath: img.storage_path,
      capturedAt: img.created_at,
      painLevel: img.pain_level,
      cnnOutput: img.cnn_output,
    })),
    timeline: (caseItem.case_events || []).map((ev) => ({
      kind: ev.kind,
      title: ev.title,
      detail: ev.detail,
      painLevel: ev.pain_level,
      timestamp: ev.created_at,
    })),
    consultationsCount: (caseItem.messages || []).filter((m) => m.role === "assistant").length,
    disclaimer:
      "DermiAI is an educational decision-support tool, not a medical device. This report does not constitute a clinical diagnosis.",
  };

  return json(report);
}
