import type { HelixInterpretedEvent } from "@shared/helix-interpreted-event-log";
import { listInterpretedEvents } from "../situation-room/interpreted-event-log-store";

export function selectInterpretedLogContext(input: {
  threadId: string;
  roomId?: string | null;
  limit?: number;
}): {
  schema: "helix.interpreted_log_context_selection.v1";
  thread_id: string;
  room_id?: string | null;
  events: HelixInterpretedEvent[];
  raw_logs_included: false;
  deterministic_content_role: "evidence_not_assistant_answer";
} {
  return {
    schema: "helix.interpreted_log_context_selection.v1",
    thread_id: input.threadId,
    room_id: input.roomId ?? null,
    events: listInterpretedEvents({
      threadId: input.threadId,
      roomId: input.roomId ?? null,
      limit: input.limit ?? 20,
    }),
    raw_logs_included: false,
    deterministic_content_role: "evidence_not_assistant_answer",
  };
}
