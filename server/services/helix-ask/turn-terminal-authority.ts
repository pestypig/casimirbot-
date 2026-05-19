import crypto from "node:crypto";
import {
  HELIX_TERMINAL_AUTHORITY_SCHEMA,
  type HelixTerminalAuthority,
  type HelixLiveSourceTerminalAuthority,
} from "@shared/helix-turn-poison-guard";

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const terminalAuthorityByThread = new Map<string, HelixTerminalAuthority[]>();

function inferTerminalKind(input: {
  final_answer_source?: string | null;
  terminal_artifact_kind?: string | null;
}): HelixTerminalAuthority["terminal_kind"] {
  const source = normalizeText(input.final_answer_source);
  const artifact = normalizeText(input.terminal_artifact_kind);
  if (/request_user_input|pending_server_request/i.test(source) || /request_user_input|pending_server_request/i.test(artifact)) {
    return "request_user_input";
  }
  if (/typed_failure|failure|error/i.test(source) || /typed_failure|failure|error/i.test(artifact)) {
    return "failure";
  }
  if (/workstation_tool_evaluation|tool_evaluation/i.test(source) || /workstation_tool_evaluation|tool_evaluation/i.test(artifact)) {
    return "tool_evaluation";
  }
  if (/workspace_action_receipt|note_update_receipt|doc_open_receipt|receipt/i.test(artifact)) {
    return "workspace_action_receipt";
  }
  if (/situation_context_pack/i.test(artifact)) return "situation_context_pack";
  if (/live_answer_environment/i.test(artifact)) return "live_answer_environment";
  return "answer";
}

export function hashHelixTerminalText(value: unknown): string {
  return crypto.createHash("sha256").update(normalizeText(value)).digest("hex");
}

export function buildHelixTurnTerminalAuthority(input: {
  thread_id: string;
  turn_id?: string | null;
  final_answer_source?: string | null;
  terminal_artifact_kind?: string | null;
  terminal_text: string;
  terminal_item_id?: string | null;
  route?: HelixTerminalAuthority["route"] | null;
  terminal_kind?: HelixTerminalAuthority["terminal_kind"] | null;
  authority_origin?: HelixTerminalAuthority["authority_origin"] | null;
  live_source_authority?: HelixLiveSourceTerminalAuthority | null;
  created_at?: string;
}): HelixTerminalAuthority {
  const terminalText = normalizeText(input.terminal_text);
  return {
    schema: HELIX_TERMINAL_AUTHORITY_SCHEMA,
    thread_id: input.thread_id,
    turn_id: input.turn_id ?? null,
    route: normalizeText(input.route) || "/ask",
    terminal_kind: input.terminal_kind ?? inferTerminalKind(input),
    final_answer_source: normalizeText(input.final_answer_source) || "unknown",
    terminal_artifact_kind: normalizeText(input.terminal_artifact_kind) || "unknown",
    terminal_item_id: normalizeText(input.terminal_item_id) || null,
    terminal_text_hash: hashHelixTerminalText(terminalText),
    terminal_text_preview: terminalText,
    authority_origin: input.authority_origin ?? undefined,
    live_source_authority: input.live_source_authority ?? null,
    server_authoritative: true,
    created_at: input.created_at ?? new Date().toISOString(),
  };
}

export function recordHelixTurnTerminalAuthority(input: Parameters<typeof buildHelixTurnTerminalAuthority>[0]): HelixTerminalAuthority {
  const authority = buildHelixTurnTerminalAuthority(input);
  const existing = terminalAuthorityByThread.get(authority.thread_id) ?? [];
  const filtered = existing.filter((entry: HelixTerminalAuthority) => entry.turn_id !== authority.turn_id);
  terminalAuthorityByThread.set(authority.thread_id, [...filtered, authority].slice(-500));
  return authority;
}

export function getHelixTurnTerminalAuthority(input: {
  thread_id: string;
  turn_id?: string | null;
}): HelixTerminalAuthority | null {
  const records = terminalAuthorityByThread.get(input.thread_id) ?? [];
  if (input.turn_id) {
    return records.find((entry: HelixTerminalAuthority) => entry.turn_id === input.turn_id) ?? null;
  }
  return records.at(-1) ?? null;
}

export function listHelixTurnTerminalAuthorities(threadId: string): HelixTerminalAuthority[] {
  return [...(terminalAuthorityByThread.get(threadId) ?? [])];
}

export function clearHelixTurnTerminalAuthorityForTest(): void {
  terminalAuthorityByThread.clear();
}
