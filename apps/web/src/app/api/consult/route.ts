import { z } from "zod";

import { sse, streamDermi } from "@/demo/mock-models";
import type { ConsultBody } from "@/demo/types";

/**
 * /api/consult
 *
 * DEMO BRANCH: streams DermiStreamEvent SSE from the scripted engine (plus one demo-only `demo` event
 * carrying UI hints). In production this loads the case, calls the LLM endpoint (DermiRequest) and
 * persists the final `done` message.
 */
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const Message = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().max(5000),
});

const Body = z.object({
  request: z.object({
    messages: z.array(Message).min(1).max(200),
    cnn_result: z.unknown().nullish(),
    case_id: z.string().nullish(),
  }),
  demo: z.object({
    context: z.record(z.string(), z.unknown()),
    event: z.object({ kind: z.enum(["start", "message", "photo", "pain", "satisfied"]) }).loose(),
    profile: z.object({
      name: z.string().max(100),
      allergies: z.array(z.string().max(100)).max(50),
      skinType: z.string().max(50),
    }),
    transcript: z.string().max(20000),
  }),
});

/** POST: stream Dermi reply */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
  return sse(streamDermi(parsed.data as unknown as ConsultBody), request.signal);
}
