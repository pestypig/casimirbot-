import crypto from "node:crypto";
import {
  HELIX_TERMINAL_AUTHORITY_SCHEMA,
  type HelixTerminalAuthority,
} from "@shared/helix-turn-poison-guard";

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export function hashHelixTerminalText(value: unknown): string {
  return crypto.createHash("sha256").update(normalizeText(value)).digest("hex");
}

export function buildHelixTurnTerminalAuthority(input: {
  thread_id: string;
  turn_id?: string | null;
  final_answer_source?: string | null;
  terminal_artifact_kind?: string | null;
  terminal_text: string;
  route?: string | null;
  created_at?: string;
}): HelixTerminalAuthority {
  return {
    schema: HELIX_TERMINAL_AUTHORITY_SCHEMA,
    thread_id: input.thread_id,
    turn_id: input.turn_id ?? null,
    final_answer_source: normalizeText(input.final_answer_source) || "unknown",
    terminal_artifact_kind: normalizeText(input.terminal_artifact_kind) || "unknown",
    terminal_text_hash: hashHelixTerminalText(input.terminal_text),
    terminal_text_preview: normalizeText(input.terminal_text).slice(0, 240),
    route: normalizeText(input.route) || null,
    created_at: input.created_at ?? new Date().toISOString(),
  };
}
