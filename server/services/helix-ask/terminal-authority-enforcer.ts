import type { HelixTerminalAuthority } from "@shared/helix-turn-poison-guard";
import { buildHelixTurnTerminalAuthority } from "./turn-terminal-authority";
import { resolveTerminalAnswerEnvelope } from "./terminal-answer-envelope";

export function enforceHelixTerminalAuthority(input: {
  thread_id: string;
  turn_id?: string | null;
  payload: Record<string, unknown>;
}): HelixTerminalAuthority {
  const existing = input.payload.terminal_answer_authority;
  const envelope = resolveTerminalAnswerEnvelope(input.payload, {
    threadId: input.thread_id,
    turnId: input.turn_id,
  });
  if (
    existing &&
    typeof existing === "object" &&
    (existing as Record<string, unknown>).server_authoritative === true &&
    (existing as Record<string, unknown>).terminal_text_preview === envelope.terminal_text
  ) {
    return existing as HelixTerminalAuthority;
  }
  return buildHelixTurnTerminalAuthority({
    thread_id: input.thread_id,
    turn_id: envelope.turn_id,
    final_answer_source: envelope.final_answer_source,
    terminal_artifact_kind: envelope.terminal_artifact_kind,
    terminal_kind: envelope.terminal_kind,
    terminal_text: envelope.terminal_text,
    route: typeof input.payload.route_reason_code === "string"
      ? input.payload.route_reason_code
      : typeof input.payload.route === "string"
        ? input.payload.route
        : null,
    authority_origin: envelope.authority_origin,
  });
}
