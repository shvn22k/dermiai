import type {
  ChatMessage,
  ChatRole,
  CNNOutput,
  DermiRequest,
  DermiStreamEvent,
} from "@dermiai/schemas";
import { badRequest, unauthorized } from "@/lib/http";
import { streamDermi } from "@/lib/models/client";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 300;

/**
 * /api/consult
 *
 * Chat with Dermi: loads case context (incl. latest CNNOutput and message history),
 * calls the LLM endpoint (DermiRequest), and streams DermiStreamEvent SSE to the browser.
 * Persists the final completed response.
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

  let body: { caseId?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const caseId = body.caseId?.trim();
  const message = body.message?.trim();

  if (!caseId || !message) {
    return badRequest("'caseId' and 'message' are required");
  }

  // 1. Record incoming user message
  await supabase.from("messages").insert({
    case_id: caseId,
    user_id: user.id,
    role: "user",
    content: message,
  });

  // 2. Fetch recent conversation history
  const { data: dbMessages } = await supabase
    .from("messages")
    .select("role, content")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true })
    .limit(20);

  // 3. Fetch latest CNN findings for this case if any exist
  const { data: latestImg } = await supabase
    .from("case_images")
    .select("cnn_output")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const formattedMessages = (dbMessages || []).map((m) => ({
    role: m.role as ChatRole,
    content: m.content,
  }));

  const chatMessages: [ChatMessage, ...ChatMessage[]] =
    formattedMessages.length > 0
      ? [formattedMessages[0]!, ...formattedMessages.slice(1)]
      : [{ role: "user" as ChatRole, content: message }];

  const dermiRequest: DermiRequest = {
    case_id: caseId,
    messages: chatMessages,
    cnn_result: (latestImg?.cnn_output as unknown as CNNOutput) || null,
  };

  const upstreamStream = await streamDermi(dermiRequest, request.signal);
  const encoder = new TextEncoder();
  const reader = upstreamStream.getReader();

  const responseStream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const event = value as DermiStreamEvent;

          // When done event arrives, persist assistant message and safety findings
          if (event.type === "done") {
            try {
              const resp = event.response;
              await supabase.from("messages").insert({
                case_id: caseId,
                user_id: user.id,
                role: "assistant",
                content: resp.message.content,
                model_version: resp.model_version,
                escalate_to_clinician: resp.escalate_to_clinician,
                safety_flags: resp.safety_flags,
              });

              if (resp.escalate_to_clinician) {
                await supabase
                  .from("cases")
                  .update({ status: "see-dermatologist" })
                  .eq("id", caseId);

                await supabase.from("case_events").insert({
                  case_id: caseId,
                  user_id: user.id,
                  kind: "Status",
                  title: "Dermatologist referral recommended",
                  detail: "Dermi identified symptoms that should be clinically evaluated.",
                });
              }
            } catch (err) {
              console.error("[Failed to persist LLM reply]", err);
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
