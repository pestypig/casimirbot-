import type { ChatMessage, ChatSession } from "@shared/agi-chat";

import type { HelixAskMinimalRuntimeReply } from "./HelixAskMinimalRuntimeLifecycle";

function parseTimeMs(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildHelixAskMinimalRuntimeRepliesFromChatSession(
  session: ChatSession | null | undefined,
): HelixAskMinimalRuntimeReply[] {
  const messages = [...(session?.messages ?? [])].sort((left, right) => {
    const leftMs = parseTimeMs(left.at);
    const rightMs = parseTimeMs(right.at);
    if (leftMs !== null && rightMs !== null && leftMs !== rightMs) return leftMs - rightMs;
    if (leftMs !== null && rightMs === null) return -1;
    if (leftMs === null && rightMs !== null) return 1;
    return left.id.localeCompare(right.id);
  });
  const replies: HelixAskMinimalRuntimeReply[] = [];
  let pendingUser: ChatMessage | null = null;
  for (const message of messages) {
    if (message.role === "user") {
      pendingUser = message;
      continue;
    }
    if (message.role !== "assistant") continue;
    const answer = message.content.trim();
    if (!answer) {
      pendingUser = null;
      continue;
    }
    const turnId = message.traceId?.trim() || pendingUser?.traceId?.trim() || message.id;
    const createdAtMs =
      parseTimeMs(message.at) ??
      parseTimeMs(pendingUser?.at) ??
      0;
    replies.push({
      id: `helix-chat-turn:${session?.id ?? "session"}:${turnId}`,
      turn_id: turnId,
      createdAtMs,
      content: answer,
      question: pendingUser?.content ?? "",
      mode: "observe",
      debug: {
        durable_chat_projection: true,
        session_id: session?.id ?? null,
        user_message_id: pendingUser?.id ?? null,
        assistant_message_id: message.id,
        turn_id: turnId,
      },
      result: {
        selected_final_answer: answer,
        turn_id: turnId,
        debug: {
          durable_chat_projection: true,
          session_id: session?.id ?? null,
        },
      },
      liveEvents: [],
    });
    pendingUser = null;
  }
  return replies;
}
