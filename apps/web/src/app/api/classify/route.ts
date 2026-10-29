import { notImplemented } from "@/lib/http";

/**
 * /api/classify
 *
 * Run the CNN on an uploaded image: creates a short-lived signed download URL, calls the vision
 * endpoint (VisionRequest), and streams VisionStreamEvent SSE back. Persists CNNOutput on the case.
 */
export const maxDuration = 60;

/** POST: stream vision result for {caseId, imagePath} */
export async function POST() {
  return notImplemented("POST /api/classify");
}
