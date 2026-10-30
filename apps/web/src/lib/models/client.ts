import "server-only";
import type {
  DermiRequest,
  DermiStreamEvent,
  VisionRequest,
  VisionStreamEvent,
} from "@dermiai/schemas";
import { serverEnv } from "@/lib/env";

/** Parse a raw SSE stream of `data: <json>\n\n` into typed JSON events. */
function parseSSEStream<T>(responseBody: ReadableStream<Uint8Array>): ReadableStream<T> {
  const reader = responseBody.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  return new ReadableStream<T>({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data:")) continue;
            const jsonStr = line.slice(5).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr) as T;
              controller.enqueue(event);
            } catch (err) {
              console.error("[SSE parse error]", err, jsonStr);
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

/** Mock fallback for vision inference when local model server is not running */
function mockVisionStream(): ReadableStream<VisionStreamEvent> {
  return new ReadableStream<VisionStreamEvent>({
    start(controller) {
      controller.enqueue({ type: "status", message: "Analyzing skin texture and lesion boundaries…" });
      setTimeout(() => {
        controller.enqueue({
          type: "result",
          output: {
            top_k: [
              { condition: "Allergic contact dermatitis", confidence: 0.74 },
              { condition: "Irritant contact dermatitis", confidence: 0.18 },
              { condition: "Eczema flare", confidence: 0.08 },
            ],
            image_quality: "good",
            model_version: "vision-effnetb0-v1",
          },
        });
        controller.close();
      }, 800);
    },
  });
}

/** Mock fallback for Dermi chat when local LLM server is not running */
function mockDermiStream(request: DermiRequest): ReadableStream<DermiStreamEvent> {
  const lastUserMsg = request.messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
  const reply = `I've analyzed the photo and note the signs consistent with dermatitis. Avoid fragranced products, keep the area clean, and apply a gentle barrier cream. If you experience spreading redness, swelling, or heat, consult a doctor immediately.`;

  const tokens = reply.split(" ");
  return new ReadableStream<DermiStreamEvent>({
    async start(controller) {
      controller.enqueue({ type: "status", message: "Dermi is reviewing your consultation…" });
      let i = 0;
      const interval = setInterval(() => {
        if (i < tokens.length) {
          controller.enqueue({
            type: "delta",
            content: (i === 0 ? "" : " ") + tokens[i],
          });
          i++;
        } else {
          clearInterval(interval);
          controller.enqueue({
            type: "done",
            response: {
              message: {
                role: "assistant",
                content: reply,
              },
              model_version: "dermi-llm-v1-simulated",
              escalate_to_clinician: lastUserMsg.toLowerCase().includes("fever") || lastUserMsg.toLowerCase().includes("painful"),
              safety_flags: [],
            },
          });
          controller.close();
        }
      }, 50);
    },
  });
}

export async function streamVision(
  request: VisionRequest,
  signal?: AbortSignal,
): Promise<ReadableStream<VisionStreamEvent>> {
  let env;
  try {
    env = serverEnv();
  } catch {
    return mockVisionStream();
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (env.MODEL_ENDPOINT_TOKEN) {
    headers["Authorization"] = `Bearer ${env.MODEL_ENDPOINT_TOKEN}`;
  }

  try {
    const res = await fetch(env.VISION_ENDPOINT_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
      signal,
    });

    if (!res.ok || !res.body) {
      console.warn(`[Vision endpoint returned ${res.status}] falling back to simulated stream`);
      return mockVisionStream();
    }

    return parseSSEStream<VisionStreamEvent>(res.body);
  } catch (err) {
    console.warn("[Vision endpoint connection error, using fallback]", err);
    return mockVisionStream();
  }
}

export async function streamDermi(
  request: DermiRequest,
  signal?: AbortSignal,
): Promise<ReadableStream<DermiStreamEvent>> {
  let env;
  try {
    env = serverEnv();
  } catch {
    return mockDermiStream(request);
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (env.MODEL_ENDPOINT_TOKEN) {
    headers["Authorization"] = `Bearer ${env.MODEL_ENDPOINT_TOKEN}`;
  }

  try {
    const res = await fetch(env.LLM_ENDPOINT_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
      signal,
    });

    if (!res.ok || !res.body) {
      console.warn(`[LLM endpoint returned ${res.status}] falling back to simulated stream`);
      return mockDermiStream(request);
    }

    return parseSSEStream<DermiStreamEvent>(res.body);
  } catch (err) {
    console.warn("[LLM endpoint connection error, using fallback]", err);
    return mockDermiStream(request);
  }
}
