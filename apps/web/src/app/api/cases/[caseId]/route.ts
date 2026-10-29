import { notImplemented } from "@/lib/http";

/**
 * /api/cases/[caseId]
 *
 * A single case.
 */

/** GET: get case */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { caseId } = await params;
  return notImplemented(`GET /api/cases/${caseId}`);
}

/** PATCH: update case */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { caseId } = await params;
  return notImplemented(`PATCH /api/cases/${caseId}`);
}

/** DELETE: delete case and its images */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { caseId } = await params;
  return notImplemented(`DELETE /api/cases/${caseId}`);
}
