import type { VisionStreamEvent } from "@dermiai/schemas";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { streamVision } from "@/lib/models/client";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

/**
 * /api/classify
 *
 * Run CNN classifier on an uploaded image: creates a short-lived signed download URL,
 * invokes the vision endpoint, streams SSE events back to the client, and persists CNNOutput.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorized();
  }

  let body: { caseId?: string; imagePath?: string; painLevel?: number };
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { caseId, imagePath, painLevel } = body;
  if (!caseId || !imagePath) {
    return badRequest("'caseId' and 'imagePath' are required");
  }

  // Generate 60-second signed download URL for the vision model
  const { data: signed, error: signError } = await supabase.storage
    .from("skin-images")
    .createSignedUrl(imagePath, 60);

  if (signError || !signed) {
    return serverError("Failed to generate signed download URL for image", signError?.message);
  }

  const upstreamStream = await streamVision(
    { image_url: signed.signedUrl },
    request.signal,
  );

  const encoder = new TextEncoder();
  const reader = upstreamStream.getReader();

  const responseStream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const event = value as VisionStreamEvent;

          // If the model produced a result, persist it in Supabase
          if (event.type === "result") {
            try {
              await supabase.from("case_images").insert({
                case_id: caseId,
                user_id: user.id,
                storage_path: imagePath,
                cnn_output: event.output as unknown as Json,
                model_version: event.output.model_version,
                pain_level: typeof painLevel === "number" ? painLevel : null,
              });

              // Add a check-in event to the case timeline
              const topCondition = event.output.top_k[0]?.condition ?? "Analysis complete";
              await supabase.from("case_events").insert({
                case_id: caseId,
                user_id: user.id,
                kind: "Check-in",
                title: "Photo analyzed",
                detail: `Image classified with top finding: ${topCondition}.`,
                pain_level: typeof painLevel === "number" ? painLevel : null,
              });
            } catch (dbErr) {
              console.error("[Failed to persist CNN output]", dbErr);
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
