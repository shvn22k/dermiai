import "server-only";
import type {
  DermiRequest,
  DermiStreamEvent,
  VisionRequest,
  VisionStreamEvent,
} from "@dermiai/schemas";

/*
 * Server-side clients for the model endpoints on GCP. Both speak Server-Sent Events:
 * POST a JSON request, receive `data: <json>` lines, each one event from @dermiai/schemas.
 *
 * Planned behaviour:
 *  - URL from serverEnv().VISION_ENDPOINT_URL / LLM_ENDPOINT_URL. Never hardcode it.
 *  - Auth header per serverEnv().MODEL_AUTH_MODE (bearer token, or a GCP ID token via Vercel OIDC).
 *  - Parse and validate each event before forwarding it to the browser (models are untrusted input).
 *  - Abort upstream when the browser disconnects (request.signal).
 */

export async function streamVision(request: VisionRequest): Promise<ReadableStream<VisionStreamEvent>> {
  void request;
  throw new Error("streamVision: not implemented");
}

export async function streamDermi(request: DermiRequest): Promise<ReadableStream<DermiStreamEvent>> {
  void request;
  throw new Error("streamDermi: not implemented");
}
