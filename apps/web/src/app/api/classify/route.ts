import { z } from "zod";

import { sse, streamVision } from "@/demo/mock-models";
import { SCENARIO_IDS } from "@/demo/scenarios";
import type { ClassifyBody } from "@/demo/types";

/**
 * /api/classify
 *
 * DEMO BRANCH: streams VisionStreamEvent SSE from the mock CNN. In production this creates a short-lived
 * signed download URL, calls the vision endpoint (VisionRequest) and persists CNNOutput on the case.
 */
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const Body = z.object({
  request: z.object({ image_url: z.string().min(1), request_id: z.string().nullish() }),
  demo: z.object({
    brightness: z.number().min(0).max(1),
    hint: z.string().max(5000),
    override: z.enum(SCENARIO_IDS as [string, ...string[]]).nullable(),
  }),
});

/** POST: stream vision result */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
  return sse(streamVision(parsed.data as ClassifyBody), request.signal);
}
