import type { HelixTerminalAuthority } from "@shared/helix-turn-poison-guard";
import { buildHelixTurnTerminalAuthority } from "./turn-terminal-authority";
import { resolveTerminalAnswerEnvelope } from "./terminal-answer-envelope";

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const routeBase = (route: string | null): string | null =>
  route ? route.split("/")[0]?.trim() || route : null;

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
  const currentRoute =
    readString(input.payload.route_reason_code) ??
    readString(input.payload.route);
  const currentRouteBase = routeBase(currentRoute);
  const existingRecord =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : null;
  const existingRouteBase = routeBase(readString(existingRecord?.route));
  const existingTerminalArtifactKind = readString(existingRecord?.terminal_artifact_kind);
  const existingFinalAnswerSource = readString(existingRecord?.final_answer_source);
  if (
    existingRecord &&
    existingRecord.server_authoritative === true &&
    existingRecord.terminal_text_preview === envelope.terminal_text &&
    (!currentRouteBase || !existingRouteBase || currentRouteBase === existingRouteBase) &&
    (!existingTerminalArtifactKind || existingTerminalArtifactKind === envelope.terminal_artifact_kind) &&
    (!existingFinalAnswerSource || existingFinalAnswerSource === envelope.final_answer_source)
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
    route: currentRoute,
    authority_origin: envelope.authority_origin,
  });
}
