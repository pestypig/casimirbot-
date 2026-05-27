import { auditHelixAskContextForPoison } from "./ask-context-poison-audit";
import { auditTerminalPresentationCoverage } from "./terminal-presentation-coverage-audit";
import { buildHelixTurnTerminalAuthority, hashHelixTerminalText } from "./turn-terminal-authority";
import { evaluateTerminalBoundaryEligibility, type HelixRuntimeAuthorityBoundaryReport } from "./runtime-authority-contract";
import { evaluateRepoAnswerTextQualityGate } from "./repo-answer-text-quality-gate";
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

const readArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

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

const isStaleRepoEvidenceTerminalText = (value: unknown): boolean => {
  const text = readString(value) ?? "";
  return /\b(?:could not complete|could not answer|could not produce|terminal boundary blocked|source\/capability answer before the agent runtime loop|turn stopped before required artifacts|missing required artifacts|required artifacts (?:were|are) satisfied|repo_code_evidence_unavailable)\b/i.test(text);
};

const isUnavailableTerminalPlaceholderText = (value: unknown): boolean => {
  const text = readString(value) ?? "";
  return /\b(?:I could not produce a terminal answer for this turn|direct_answer_unavailable|model_only_answer_unavailable|repo_code_evidence_unavailable|could not produce a final answer|could not complete this turn)\b/i.test(text);
};

const isUnbackedRepoEvidenceTerminalText = (value: unknown): boolean => {
  const text = readString(value) ?? "";
  if (!text) return true;
  if (/\b(?:repo evidence|key evidence|source|file|path|client\/|server\/|shared\/|docs\/|\.ts|\.tsx|\.js|\.md)\b/i.test(text)) {
    return false;
  }
  return /\btypically refers to\b/i.test(text);
};

const clipText = (value: string, max = 180): string =>
  value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1)).trimEnd()}...`;

const buildRepoEvidenceTerminalRepairText = (payload: Record<string, unknown>): string | null => {
  const canonicalGoal = readRecord(payload.canonical_goal_frame);
  const concept =
    readString(readArray(canonicalGoal?.corpus_anchors)[0]) ??
    readString(readArray(canonicalGoal?.concept_tokens)[0]) ??
    "this internal concept";
  const directObservations = readArray(payload.evidence_observations);
  const ledgerObservations = readArray(payload.current_turn_artifact_ledger).flatMap((entry) => {
    const artifact = readRecord(entry);
    const artifactPayload = readRecord(artifact?.payload);
    const searchable = [
      readString(artifact?.kind),
      readString(artifactPayload?.kind),
      readString(artifactPayload?.schema),
    ].join(" ");
    if (!/repo_code_evidence_observation|helix\.repo_code_evidence_observation\.v1/i.test(searchable)) return [];
    if (readArray(artifactPayload?.observations).length > 0) return readArray(artifactPayload?.observations);
    if (readArray(artifactPayload?.spans).length > 0) return readArray(artifactPayload?.spans);
    return artifactPayload ? [artifactPayload] : [];
  });
  const observations = directObservations.length > 0 ? directObservations : ledgerObservations;
  const sourceLines = observations
    .map((entry) => {
      const record = readRecord(entry);
      if (!record) return null;
      const source =
        readString(record.source_id) ??
        readString(record.ref) ??
        readString(record.path) ??
        readString(record.filePath) ??
        readString(record.id);
      const excerpt = clipText(
        readString(record.snippet) ??
          readString(record.excerpt) ??
          readString(record.reason) ??
          "",
      );
      return source ? `- ${source}${excerpt ? `: ${excerpt}` : ""}` : null;
    })
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, 6);
  if (sourceLines.length === 0) return null;
  return [
    `I found current repo evidence for ${concept}.`,
    "",
    "Key evidence:",
    ...sourceLines,
  ].join("\n").trim();
};

export const applyDocConceptExplanationTerminalCandidate = (
  payload: Record<string, unknown>,
): { applied: boolean; text: string | null; artifactId: string | null } => {
  const terminalErrorCode = readString(payload.terminal_error_code);
  const terminalArtifactKind = readTerminalArtifactKind(payload);
  const finalAnswerSource = readFinalAnswerSource(payload);
  if (
    terminalErrorCode !== "concept_explanation_unavailable" &&
    terminalArtifactKind !== "typed_failure" &&
    finalAnswerSource !== "typed_failure"
  ) {
    return { applied: false, text: null, artifactId: null };
  }
  const ledger = Array.isArray(payload.current_turn_artifact_ledger)
    ? payload.current_turn_artifact_ledger
    : [];
  for (const entry of ledger) {
    const artifact = readRecord(entry);
    if (!artifact || readString(artifact.kind) !== "doc_concept_explanation") continue;
    const artifactPayload = readRecord(artifact.payload);
    const text =
      readString(artifactPayload?.answer_text) ??
      readString(artifactPayload?.text) ??
      readString(artifactPayload?.plain_language_summary);
    if (!text) continue;
    const path = readString(artifactPayload?.source_path) ?? readString(artifactPayload?.path);
    const terminalText = path && !text.includes(path) ? `${text}\n\nPath: ${path}` : text;
    payload.ok = true;
    payload.response_type = "final_answer";
    payload.final_status = "final_answer";
    payload.terminal_artifact_kind = "doc_concept_explanation";
    payload.final_answer_source = "artifact_synthesis";
    payload.selected_final_answer = terminalText;
    payload.answer = terminalText;
    payload.text = terminalText;
    payload.finalAnswer = terminalText;
    payload.content = terminalText;
    const artifactId = readString(artifact.artifact_id);
    if (artifactId) payload.terminal_artifact_id = artifactId;
    delete payload.terminal_error_code;
    delete payload.scientific_extraction_failed;
    delete payload.scientific_extraction_fail_reason;
    return { applied: true, text: terminalText, artifactId };
  }
  return { applied: false, text: null, artifactId: null };
};

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
  const docConceptTerminal = applyDocConceptExplanationTerminalCandidate(payload);

  if (docConceptTerminal.applied && docConceptTerminal.text) {
    terminalArtifactKind = "doc_concept_explanation";
    finalAnswerSource = "artifact_synthesis";
    terminalText = docConceptTerminal.text;
    authorityOrigin = "selected_final_answer";
  } else if (terminalArtifactKind === "typed_failure" || finalAnswerSource === "typed_failure") {
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

function buildUnavailableTerminalTextFailureEnvelope(
  payload: Record<string, unknown>,
  envelope: HelixTerminalAnswerEnvelope,
): HelixTerminalAnswerEnvelope {
  const terminalText = envelope.terminal_text || UNAVAILABLE_TERMINAL_TEXT;
  payload.terminal_error_code = readString(payload.terminal_error_code) ?? "terminal_answer_unavailable";
  payload.typed_failure = {
    ...(readRecord(payload.typed_failure) ?? {}),
    kind: "typed_failure",
    error_code: payload.terminal_error_code,
    text: terminalText,
    answer_text: terminalText,
    rejected_terminal_artifact_kind: envelope.terminal_artifact_kind,
    rejected_final_answer_source: envelope.final_answer_source,
    rejected_reason: "unavailable_terminal_placeholder_text",
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

function buildRepoAnswerQualityFailureEnvelope(
  payload: Record<string, unknown>,
  envelope: HelixTerminalAnswerEnvelope,
): HelixTerminalAnswerEnvelope {
  const gate = evaluateRepoAnswerTextQualityGate({
    turnId: envelope.turn_id,
    answerRef: readString(readRecord(payload.repo_code_evidence_answer)?.artifact_id) ??
      readString(readRecord(payload.final_answer_draft)?.artifact_id) ??
      envelope.terminal_artifact_kind,
    answerText: envelope.terminal_text,
    payload,
  });
  payload.repo_answer_text_quality_gate = gate;
  if (gate.ok) return envelope;

  const terminalText = [
    "I could not complete this repo-grounded answer because repo evidence was retrieved, but no valid model-authored synthesis passed terminal authority.",
    `Repo answer quality violations: ${gate.violations.join(", ")}.`,
  ].join(" ");
  payload.terminal_error_code = "repo_evidence_synthesis_failed";
  payload.typed_failure = {
    ...(readRecord(payload.typed_failure) ?? {}),
    kind: "typed_failure",
    error_code: payload.terminal_error_code,
    text: terminalText,
    answer_text: terminalText,
    rejected_terminal_artifact_kind: envelope.terminal_artifact_kind,
    rejected_final_answer_source: envelope.final_answer_source,
    repo_answer_text_quality_gate: gate,
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

function clearStaleFailureFieldsForSuccessfulTerminal(
  payload: Record<string, unknown>,
  envelope: HelixTerminalAnswerEnvelope,
): void {
  if (envelope.terminal_kind === "failure" || envelope.final_answer_source === "typed_failure") return;

  delete payload.terminal_error_code;
  delete payload.terminal_failure_text;

  const typedFailure = readRecord(payload.typed_failure);
  if (typedFailure) {
    payload.rejected_typed_failure = {
      ...typedFailure,
      rejected_reason: "successful_terminal_authority_superseded_failure",
      superseded_by_terminal_artifact_kind: envelope.terminal_artifact_kind,
      assistant_answer: false,
      raw_content_included: false,
    };
    delete payload.typed_failure;
  }

  const satisfaction = readRecord(payload.satisfaction_report);
  if (satisfaction?.missing_reason) {
    payload.satisfaction_report = {
      ...satisfaction,
      missing_reason: null,
      superseded_missing_reason: satisfaction.missing_reason,
    };
  }
}

function syncSuccessfulTerminalStatusMirrors(
  payload: Record<string, unknown>,
  envelope: HelixTerminalAnswerEnvelope,
): void {
  if (envelope.terminal_kind === "failure" || envelope.final_answer_source === "typed_failure") return;

  payload.ok = true;
  payload.status = "final_answer";
  payload.final_status = "final_answer";
  payload.response_type = "final_answer";

  const existingSummary = readRecord(payload.resolved_turn_summary);
  const canonicalGoalFrame = readRecord(payload.canonical_goal_frame);
  const resolvedRouteLabel = [
    readString(canonicalGoalFrame?.goal_kind) ?? "terminal_answer",
    envelope.terminal_artifact_kind,
  ].join(" / ");
  payload.resolved_turn_summary = {
    ...(existingSummary ?? {}),
    turn_id: envelope.turn_id,
    final_status: "final_answer",
    resolved_route_label: resolvedRouteLabel,
    terminal_kind: "final_answer",
    terminal_artifact_kind: envelope.terminal_artifact_kind,
    terminal_error_code: null,
    pending_server_request_present: false,
  };
}

export function applyTerminalAnswerEnvelope(
  payload: Record<string, unknown>,
  envelope: HelixTerminalAnswerEnvelope,
): HelixTerminalAnswerEnvelope {
  if (envelope.terminal_artifact_kind === "repo_code_evidence_answer") {
    envelope = buildRepoAnswerQualityFailureEnvelope(payload, envelope);
  }
  if (
    envelope.terminal_kind !== "failure" &&
    envelope.final_answer_source !== "typed_failure" &&
    isUnavailableTerminalPlaceholderText(envelope.terminal_text)
  ) {
    envelope = buildUnavailableTerminalTextFailureEnvelope(payload, envelope);
  }
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

  clearStaleFailureFieldsForSuccessfulTerminal(payload, envelope);
  syncSuccessfulTerminalStatusMirrors(payload, envelope);

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
  const runtimeRecord = readRecord(payload.turn_runtime);
  if (runtimeRecord && envelope.terminal_kind !== "failure" && envelope.final_answer_source !== "typed_failure") {
    payload.turn_runtime = {
      ...runtimeRecord,
      status: "completed",
      terminal: {
        kind: "final_answer",
        text: envelope.terminal_text,
        error_code: null,
      },
      missing_required_artifacts: [],
    };
  }

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
    if (envelope.terminal_kind !== "failure" && envelope.final_answer_source !== "typed_failure") {
      debug.ok = true;
      debug.status = "final_answer";
      debug.final_status = "final_answer";
      debug.response_type = "final_answer";
      debug.resolved_turn_summary = payload.resolved_turn_summary;
      delete debug.terminal_error_code;
      delete debug.terminal_failure_text;
      delete debug.typed_failure;
    }
    debug.terminal_boundary_eligibility = payload.terminal_boundary_eligibility;
    debug.current_turn_events = payload.current_turn_events;
    debug.turn_events = payload.turn_events;
    debug.poison_audit = payload.poison_audit;
    debug.terminal_presentation_coverage_audit = payload.terminal_presentation_coverage_audit;
  }

  return envelope;
}
