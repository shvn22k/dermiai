import { notImplemented } from "@/lib/http";

/**
 * /api/cases/[caseId]/report
 *
 * Export a case report (PDF/print view) for the user to share with a clinician.
 */

/** GET: export report */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { caseId } = await params;
  return notImplemented(`GET /api/cases/${caseId}/report`);
}
