import { notImplemented } from "@/lib/http";

/**
 * /api/consult
 *
 * Chat with Dermi: loads case context (incl. latest CNNOutput), calls the LLM endpoint (DermiRequest),
 * and streams DermiStreamEvent SSE through to the browser. Persists the final `done` message.
 */
export const maxDuration = 300;

/** POST: stream Dermi reply for {caseId, message} */
export async function POST() {
  return notImplemented("POST /api/consult");
}
