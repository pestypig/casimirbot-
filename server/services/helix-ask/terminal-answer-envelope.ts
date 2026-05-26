import { auditHelixAskContextForPoison } from "./ask-context-poison-audit";
import { auditTerminalPresentationCoverage } from "./terminal-presentation-coverage-audit";
import { buildHelixTurnTerminalAuthority, hashHelixTerminalText } from "./turn-terminal-authority";
import { evaluateTerminalBoundaryEligibility, type HelixRuntimeAuthorityBoundaryReport } from "./runtime-authority-contract";
import type { HelixTerminalAuthority } from "@shared/helix-turn-poison-guard";

export type HelixTerminalAnswerEnvelope = {
  schema: "helix.terminal_answer_envelope.v1";
  turn_id: string;
  thread_id: string;
  source_target: string;
  terminal_artifact_kind: string;
  final_answer_source: string;
  terminal_text: string;
  terminal_text_hash: string;
  terminal_kind: HelixTerminalAuthority["terminal_kind"];
  authority_origin:
    | "terminal_presentation"
    | "selected_final_answer"
    | "request_user_input"
    | "typed_failure";
  assistant_answer: false;
  raw_content_included: false;
};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readTerminalPresentationText = (payload: Record<string, unknown>): string | null => {
  const presentation = readRecord(payload.terminal_presentation);
  return presentation?.schema === "helix.terminal_presentation.v1"
    ? readString(presentation.concise_text)
    : null;
};

const readSourceTarget = (payload: Record<string, unknown>): string =>
  readString(readRecord(payload.route_product_contract)?.source_target) ??
  readString(readRecord(payload.source_target_intent)?.target_source) ??
  "unknown";

const readTerminalArtifactKind = (payload: Record<string, unknown>): string =>
  readString(payload.terminal_artifact_kind) ?? "typed_failure";

const readFinalAnswerSource = (payload: Record<string, unknown>): string =>
  readString(payload.final_answer_source) ?? readTerminalArtifactKind(payload);

const readTurnId = (payload: Record<string, unknown>, fallback?: string | null): string =>
  readString(payload.turn_id) ?? readString(fallback) ?? "unknown-turn";

const readThreadId = (payload: Record<string, unknown>, fallback?: string | null): string =>
  readString(payload.thread_id) ??
  readString(payload.session_id) ??
  readString(fallback) ??
  "helix-ask:desktop";

const requestUserInputText = (payload: Record<string, unknown>): string =>
  readString(readRecord(payload.pending_server_request)?.prompt) ??
  readString(readRecord(payload.request_user_input)?.prompt) ??
  readString(readRecord(payload.pending_request)?.prompt) ??
  "I need more information before I can answer this turn.";

const typedFailureText = (payload: Record<string, unknown>): string =>
  readString(payload.terminal_failure_text) ??
  readString(readRecord(payload.typed_failure)?.message) ??
  "I could not produce a terminal answer for this turn.";

function terminalKindForArtifact(terminalArtifactKind: string): HelixTerminalAuthority["terminal_kind"] {
  if (terminalArtifactKind === "request_user_input") return "request_user_input";
  if (terminalArtifactKind === "typed_failure") return "failure";
  if (terminalArtifactKind === "live_pipeline_receipt") return "workspace_action_receipt";
  if (terminalArtifactKind === "situation_context_pack") return "situation_context_pack";
  if (terminalArtifactKind === "live_environment_binding_diagnosis") return "live_answer_environment";
  if (terminalArtifactKind === "tool_evaluation" || terminalArtifactKind === "workstation_tool_evaluation") {
    return "tool_evaluation";
  }
  return "answer";
}

export function resolveTerminalAnswerEnvelope(
  payload: Record<string, unknown>,
  options: { threadId?: string | null; turnId?: string | null } = {},
): HelixTerminalAnswerEnvelope {
  const turnId = readTurnId(payload, options.turnId);
  const threadId = readThreadId(payload, options.threadId);
  const sourceTarget = readSourceTarget(payload);
  let terminalArtifactKind = readTerminalArtifactKind(payload);
  let finalAnswerSource = readFinalAnswerSource(payload);
  let terminalText: string | null = null;
  let authorityOrigin: HelixTerminalAnswerEnvelope["authority_origin"] = "terminal_presentation";

  if (terminalArtifactKind === "typed_failure" || finalAnswerSource === "typed_failure") {
    terminalArtifactKind = "typed_failure";
    terminalText = typedFailureText(payload);
    finalAnswerSource = "typed_failure";
    authorityOrigin = "typed_failure";
  } else if (terminalArtifactKind === "request_user_input") {
    terminalText = requestUserInputText(payload);
    authorityOrigin = "request_user_input";
  } else {
    terminalText = readTerminalPresentationText(payload);
  }
  if (!terminalText) {
    terminalText = readString(payload.selected_final_answer);
    authorityOrigin = "selected_final_answer";
  }
  if (!terminalText) {
    terminalArtifactKind = "typed_failure";
    finalAnswerSource = "typed_failure";
    terminalText = typedFailureText(payload);
    authorityOrigin = "typed_failure";
  }

  return {
    schema: "helix.terminal_answer_envelope.v1",
    turn_id: turnId,
    thread_id: threadId,
    source_target: sourceTarget,
    terminal_artifact_kind: terminalArtifactKind,
    final_answer_source: finalAnswerSource,
    terminal_text: terminalText,
    terminal_text_hash: hashHelixTerminalText(terminalText),
    terminal_kind: terminalKindForArtifact(terminalArtifactKind),
    authority_origin: authorityOrigin,
    assistant_answer: false,
    raw_content_included: false,
  };
}

function upsertTerminalAnswerInArray(value: unknown, envelope: HelixTerminalAnswerEnvelope): unknown[] {
  const events = Array.isArray(value)
    ? value.filter((event) => readRecord(event)?.type !== "terminal_answer")
    : [];
  const status =
    envelope.terminal_kind === "failure"
      ? "final_failure"
      : envelope.terminal_kind === "request_user_input"
        ? "pending_input"
        : "final_answer";
  return [
    ...events,
    {
      type: "terminal_answer",
      at_ms: Date.now(),
      text: envelope.terminal_text,
      status,
    },
  ];
}

function upsertCurrentTurnEvents(value: unknown, envelope: HelixTerminalAnswerEnvelope): unknown {
  if (Array.isArray(value)) return upsertTerminalAnswerInArray(value, envelope);
  const record = readRecord(value) ?? {};
  return {
    ...record,
    terminal_answer: {
      ...(readRecord(record.terminal_answer) ?? {}),
      type: "terminal_answer",
      text: envelope.terminal_text,
    },
  };
}

function buildTerminalBoundaryFailureEnvelope(
  payload: Record<string, unknown>,
  envelope: HelixTerminalAnswerEnvelope,
  boundary: HelixRuntimeAuthorityBoundaryReport,
): HelixTerminalAnswerEnvelope {
  const blockingReasons = boundary.blocking_reasons.length > 0
    ? boundary.blocking_reasons
    : ["terminal_boundary_ineligible"];
  const terminalText = [
    "I could not complete this turn because the terminal boundary blocked a source/capability answer before the agent runtime loop proved it.",
    `Missing runtime authority: ${blockingReasons.join(", ")}.`,
  ].join(" ");
  payload.terminal_error_code = readString(payload.terminal_error_code) ?? "terminal_boundary_ineligible";
  payload.typed_failure = {
    ...(readRecord(payload.typed_failure) ?? {}),
    kind: "typed_failure",
    error_code: payload.terminal_error_code,
    text: terminalText,
    answer_text: terminalText,
    terminal_boundary_eligibility: boundary,
    assistant_answer: false,
    raw_content_included: false,
  };
  return {
    ...envelope,
    terminal_artifact_kind: "typed_failure",
    final_answer_source: "typed_failure",
    terminal_text: terminalText,
    terminal_text_hash: hashHelixTerminalText(terminalText),
    terminal_kind: "failure",
    authority_origin: "typed_failure",
  };
}

export function applyTerminalAnswerEnvelope(
  payload: Record<string, unknown>,
  envelope: HelixTerminalAnswerEnvelope,
): HelixTerminalAnswerEnvelope {
  const previewPayload = {
    ...payload,
    selected_final_answer: envelope.terminal_text,
    terminal_artifact_kind: envelope.terminal_artifact_kind,
    final_answer_source: envelope.final_answer_source,
    terminal_answer_envelope: envelope,
  };
  const initialBoundary = evaluateTerminalBoundaryEligibility(previewPayload);
  if (!initialBoundary.eligible) {
    envelope = buildTerminalBoundaryFailureEnvelope(payload, envelope, initialBoundary);
  }

  payload.turn_id = envelope.turn_id;
  payload.thread_id = envelope.thread_id;
  payload.selected_final_answer = envelope.terminal_text;
  payload.answer = envelope.terminal_text;
  payload.text = envelope.terminal_text;
  payload.finalAnswer = envelope.terminal_text;
  payload.content = envelope.terminal_text;
  payload.terminal_artifact_kind = envelope.terminal_artifact_kind;
  payload.final_answer_source = envelope.final_answer_source;
  payload.terminal_answer_envelope = envelope;
  payload.terminal_boundary_eligibility = evaluateTerminalBoundaryEligibility(payload);

  const presentation = readRecord(payload.terminal_presentation);
  payload.terminal_presentation = {
    ...(presentation ?? {
      schema: "helix.terminal_presentation.v1",
      presentation_id: `terminal_presentation:${envelope.turn_id}`,
      turn_id: envelope.turn_id,
      terminal_artifact_kind: envelope.terminal_artifact_kind,
      expansion_available: false,
      expansion_ref: null,
      distillation_ref: null,
      receipt_snapshot_ref: null,
      assistant_answer: false,
      raw_content_included: false,
    }),
    schema: "helix.terminal_presentation.v1",
    turn_id: envelope.turn_id,
    terminal_artifact_kind: envelope.terminal_artifact_kind,
    concise_text: envelope.terminal_text,
    assistant_answer: false,
    raw_content_included: false,
  };

  const terminalAuthority = buildHelixTurnTerminalAuthority({
    thread_id: envelope.thread_id,
    turn_id: envelope.turn_id,
    final_answer_source: envelope.final_answer_source,
    terminal_artifact_kind: envelope.terminal_artifact_kind,
    terminal_kind: envelope.terminal_kind,
    terminal_text: envelope.terminal_text,
    terminal_item_id: readString(payload.terminal_item_id),
    route: readString(payload.route_reason_code) ?? readString(payload.route),
    authority_origin: envelope.authority_origin,
  });
  payload.terminal_answer_authority = terminalAuthority;
  payload.current_turn_events = upsertCurrentTurnEvents(payload.current_turn_events, envelope);
  payload.turn_events = upsertTerminalAnswerInArray(payload.turn_events, envelope);

  const poisonAudit = auditHelixAskContextForPoison({
    thread_id: envelope.thread_id,
    turn_id: envelope.turn_id,
    payload,
    terminal_authority: terminalAuthority,
    client_visible_text: envelope.terminal_text,
  });
  payload.poison_audit = poisonAudit;

  payload.terminal_presentation_coverage_audit = auditTerminalPresentationCoverage({
    payload,
    turnId: envelope.turn_id,
    route: readString(payload.route_reason_code) ?? readString(payload.route) ?? "/ask/turn",
    terminalArtifactKind: envelope.terminal_artifact_kind,
    selectedFinalAnswer: envelope.terminal_text,
  });

  const debug = readRecord(payload.debug);
  if (debug) {
    debug.selected_final_answer = envelope.terminal_text;
    debug.answer = envelope.terminal_text;
    debug.text = envelope.terminal_text;
    debug.finalAnswer = envelope.terminal_text;
    debug.content = envelope.terminal_text;
    debug.terminal_artifact_kind = envelope.terminal_artifact_kind;
    debug.final_answer_source = envelope.final_answer_source;
    debug.terminal_presentation = payload.terminal_presentation;
    debug.terminal_answer_authority = payload.terminal_answer_authority;
    debug.terminal_answer_envelope = envelope;
    debug.terminal_boundary_eligibility = payload.terminal_boundary_eligibility;
    debug.current_turn_events = payload.current_turn_events;
    debug.turn_events = payload.turn_events;
    debug.poison_audit = payload.poison_audit;
    debug.terminal_presentation_coverage_audit = payload.terminal_presentation_coverage_audit;
  }

  return envelope;
}
