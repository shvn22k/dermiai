/**
 * DEMO BRANCH ONLY. Browser side of the model routes: POST, read the SSE stream, hand each parsed event
 * to the caller, and mirror everything into the under-the-hood trace.
 */
import type { DermiStreamEvent, VisionStreamEvent } from "@dermiai/schemas";

import { trace } from "@/demo/trace";
import type { ClassifyBody, ConsultBody, DemoMetaEvent } from "@/demo/types";

const CONTRACT_LABEL: Record<string, string> = {
  status: "StreamStatus",
  delta: "TokenDelta",
  done: "StreamDone",
  error: "StreamError",
  result: "VisionResult",
};

async function stream<E extends { type: string }>(
  route: "/api/classify" | "/api/consult",
  body: unknown,
  requestLabel: string,
  onEvent: (event: E) => void,
  signal?: AbortSignal,
) {
  trace.log({
    route,
    direction: "request",
    label: requestLabel,
    contract: true,
    json: JSON.stringify(body, null, 2),
  });

  const res = await fetch(route, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`${route} failed: ${res.status}`);

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let split: number;
    while ((split = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, split);
      buffer = buffer.slice(split + 2);
      const data = chunk
        .split("\n")
        .filter((l) => l.startsWith("data: "))
        .map((l) => l.slice(6))
        .join("\n");
      if (!data) continue;
      const event = JSON.parse(data) as E;
      const contractLabel = CONTRACT_LABEL[event.type];
      trace.log({
        route,
        direction: "event",
        label: contractLabel ?? "demo-only",
        contract: Boolean(contractLabel),
        json: data,
      });
      onEvent(event);
    }
  }
}

export function classify(
  body: ClassifyBody,
  onEvent: (e: VisionStreamEvent) => void,
  signal?: AbortSignal,
) {
  return stream("/api/classify", body, "VisionRequest (+ demo hints)", onEvent, signal);
}

export function consult(
  body: ConsultBody,
  onEvent: (e: DermiStreamEvent | DemoMetaEvent) => void,
  signal?: AbortSignal,
) {
  return stream("/api/consult", body, "DermiRequest (+ demo context)", onEvent, signal);
}

/* ---------- photos ---------- */

/** Downscale to ≤ 720px JPEG (keeps localStorage small) and measure mean brightness 0..1. */
export async function processImage(
  source: CanvasImageSource,
  width: number,
  height: number,
): Promise<{ dataUrl: string; brightness: number }> {
  const scale = Math.min(1, 720 / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  const sample = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < sample.length; i += 4 * 16) {
    sum += 0.2126 * sample[i]! + 0.7152 * sample[i + 1]! + 0.0722 * sample[i + 2]!;
    count += 1;
  }
  return { dataUrl: canvas.toDataURL("image/jpeg", 0.72), brightness: count ? sum / count / 255 : 0.5 };
}

export async function processFile(file: File) {
  const bitmap = await createImageBitmap(file);
  try {
    return await processImage(bitmap, bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}
