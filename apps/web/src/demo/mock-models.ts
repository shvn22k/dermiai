import "server-only";

import type { DermiStreamEvent, ImageQuality, VisionStreamEvent } from "@dermiai/schemas";

import { respond } from "@/demo/engine";
import { SCENARIOS, scenarioFromText } from "@/demo/scenarios";
import type { ClassifyBody, ConsultBody, DemoMetaEvent } from "@/demo/types";

/*
 * DEMO BRANCH ONLY. Drop-in mocks for src/lib/models/client.ts: same inputs, same contract events,
 * streamed with realistic pacing. Swap these for the real GCP endpoints and the routes stay the same.
 */

export const VISION_MODEL = "vision-demo-mock-0.1";
export const DERMI_MODEL = "dermi-demo-script-0.1";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function quality(brightness: number): ImageQuality {
  if (brightness < 0.12) return "unusable";
  if (brightness < 0.2) return "poor";
  if (brightness < 0.3) return "acceptable";
  return "good";
}

export async function* streamVision({ demo }: ClassifyBody): AsyncGenerator<VisionStreamEvent> {
  yield { type: "status", message: "Checking photo quality" };
  await sleep(650);
  yield { type: "status", message: "Mapping the affected area" };
  await sleep(750);
  yield { type: "status", message: "Comparing with your profile" };
  await sleep(700);
  // Mock: the canned result is picked from the chat so far (or the presenter's override).
  const scenario = demo.override ?? scenarioFromText(demo.hint) ?? "contact-dermatitis";
  yield {
    type: "result",
    output: {
      top_k: SCENARIOS[scenario].cnn,
      image_quality: quality(demo.brightness),
      model_version: VISION_MODEL,
    },
  };
}

export async function* streamDermi({
  request,
  demo,
}: ConsultBody): AsyncGenerator<DermiStreamEvent | DemoMetaEvent> {
  const turn = respond({
    context: demo.context,
    event: demo.event,
    cnn: request.cnn_result ?? null,
    profile: demo.profile,
    transcript: demo.transcript,
  });

  yield { type: "status", message: "Reading your message" };
  await sleep(350);
  for (const message of turn.statuses) {
    yield { type: "status", message };
    await sleep(550);
  }

  // Token-ish deltas: a word (and its trailing space) at a time.
  for (const piece of turn.text.match(/\S+\s*|\s+/g) ?? []) {
    yield { type: "delta", content: piece };
    await sleep(14 + Math.random() * 22);
  }

  yield { type: "demo", ...turn.meta };
  yield {
    type: "done",
    response: {
      message: { role: "assistant", content: turn.text },
      model_version: DERMI_MODEL,
      escalate_to_clinician: turn.escalate,
      safety_flags: turn.flags,
    },
  };
}

/** Async generator of events -> `text/event-stream` response. Stops when the browser disconnects. */
export function sse<T>(events: AsyncGenerator<T>, signal: AbortSignal): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (signal.aborted) {
        await events.return(undefined);
        controller.close();
        return;
      }
      const { value, done } = await events.next();
      if (done) controller.close();
      else controller.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`));
    },
    async cancel() {
      await events.return(undefined);
    },
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
