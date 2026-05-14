import type { HelixTerminalAuthority } from "@shared/helix-turn-poison-guard";
import { buildHelixTurnTerminalAuthority } from "./turn-terminal-authority";

export function enforceHelixTerminalAuthority(input: {
  thread_id: string;
  turn_id?: string | null;
  payload: Record<string, unknown>;
}): HelixTerminalAuthority {
  const existing = input.payload.terminal_answer_authority;
  if (existing && typeof existing === "object" && (existing as Record<string, unknown>).server_authoritative === true) {
    return existing as HelixTerminalAuthority;
  }
  const terminalText =
    typeof input.payload.assistant_answer === "string" ? input.payload.assistant_answer :
    typeof input.payload.answer === "string" ? input.payload.answer :
    typeof input.payload.text === "string" ? input.payload.text :
    typeof input.payload.selected_final_answer === "string" ? input.payload.selected_final_answer :
    "";
  return buildHelixTurnTerminalAuthority({
    thread_id: input.thread_id,
    turn_id: input.turn_id ?? (typeof input.payload.turn_id === "string" ? input.payload.turn_id : null),
    final_answer_source: typeof input.payload.final_answer_source === "string" ? input.payload.final_answer_source : null,
    terminal_artifact_kind: typeof input.payload.terminal_artifact_kind === "string" ? input.payload.terminal_artifact_kind : null,
    terminal_text: terminalText,
    route: typeof input.payload.route_reason_code === "string"
      ? input.payload.route_reason_code
      : typeof input.payload.route === "string"
        ? input.payload.route
        : null,
  });
}
