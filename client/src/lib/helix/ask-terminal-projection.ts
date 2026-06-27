import {
  formatHelixVisibleTerminalSourceLabel,
  normalizeFinalAnswerSourceForTerminalKind,
  resolveHelixVisibleTerminal as resolveHelixVisibleTerminalCore,
} from "@/lib/helix/resolveHelixVisibleTerminal";

const HELIX_ASK_BACKEND_ENTRYPOINT_REQUIRED_ERROR_CODE = "backend_ask_entry_required";
const HELIX_ASK_BACKEND_ENTRYPOINT_REQUIRED_TEXT =
  "This prompt requires the backend Ask solver path before a final answer can be shown.";
const HELIX_ASK_BACKEND_DEBUG_MATERIALIZATION_ERROR_CODE = "backend_debug_materialization";
const HELIX_ASK_BACKEND_DEBUG_MATERIALIZATION_TEXT =
  "Backend Ask was reached, but no server terminal artifact or debug artifact was materialized for this turn.";

type RecordLike = Record<string, unknown>;

export type HelixAskTerminalProjectionReply = RecordLike & {
  id: string;
  turn_id?: unknown;
  ok?: boolean;
  debug?: unknown;
  content?: unknown;
  text?: unknown;
  assistant_answer?: unknown;
  liveEvents?: unknown[];
};

export type VisibleResolvedTurn = {
  active_turn_id: string;
  primary_route_label: string;
  primary_terminal_label: "final_answer" | "final_failure" | "pending_input";
  primary_source_label: string;
  selected_final_answer: string;
  terminal_error_code?: string | null;
  pending_server_request_present: boolean;
};

export type HelixAskFinalAnswerPresentation = {
  heading: "Final answer" | "Checkpoint receipt";
  sourceLabel: string | null;
  isDeterministicReceiptFallback: boolean;
};

function coerceText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return String(value);
  } catch {
    return "";
  }
}

function readAgentLoopAuditRecord(value: unknown): RecordLike | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;
}

function normalizeTerminalAnswerText(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .trim();
}

function isInvalidTerminalAnswerText(value: string | null | undefined): boolean {
  const normalized = normalizeTerminalAnswerText(value);
  if (!normalized) return true;
  return (
    /^no final answer returned\.?$/i.test(normalized) ||
    /^I could not produce a substantive direct answer for this background-only turn\.?$/i.test(normalized) ||
    /^I couldn't produce a final answer for that turn\. Please retry once\.?$/i.test(normalized)
  );
}

function readHelixPendingInputRecord(value: unknown): RecordLike | null {
  const record = readAgentLoopAuditRecord(value);
  if (!record) return null;
  const status = coerceText(record.status ?? record.state ?? record.resolution_status).trim().toLowerCase();
  if (status === "resolved" || status === "cancelled" || status === "canceled" || status === "superseded") {
    return null;
  }
  const requestId = coerceText(record.request_id ?? record.requestId ?? record.id).trim();
  const prompt = coerceText(record.prompt ?? record.message ?? record.text ?? record.question).trim();
  const requiredFieldsCandidate = record.required_fields ?? record.requiredFields;
  const requiredFields = Array.isArray(requiredFieldsCandidate) ? requiredFieldsCandidate : [];
  if (requestId || prompt || requiredFields.length > 0 || record.kind === "request_user_input") return record;
  return null;
}

const readHelixResolvedTurnSummary = (reply?: HelixAskTerminalProjectionReply | null): RecordLike | null => {
  const record = readAgentLoopAuditRecord(reply);
  const debugRecord = readAgentLoopAuditRecord(reply?.debug);
  const turnTruthTable = readAgentLoopAuditRecord(record?.turn_truth_table ?? debugRecord?.turn_truth_table);
  return readAgentLoopAuditRecord(record?.resolved_turn_summary ?? debugRecord?.resolved_turn_summary ?? turnTruthTable?.resolved_turn_summary);
};

const readHelixCanonicalGoalKind = (reply?: HelixAskTerminalProjectionReply | null): string => {
  const record = readAgentLoopAuditRecord(reply);
  const debugRecord = readAgentLoopAuditRecord(reply?.debug);
  const canonical = readAgentLoopAuditRecord(record?.canonical_goal_frame ?? debugRecord?.canonical_goal_frame);
  return coerceText(canonical?.goal_kind).trim() || "unknown";
};

const readHelixTopLevelPendingServerRequest = (reply?: HelixAskTerminalProjectionReply | null): RecordLike | null => {
  const record = readAgentLoopAuditRecord(reply);
  return readHelixPendingInputRecord(record?.pending_server_request);
};

const readLatestAuthoritativeFinalLiveEventText = (reply?: HelixAskTerminalProjectionReply | null): string | null => {
  const replyRecord = readAgentLoopAuditRecord(reply);
  const debugRecord = readAgentLoopAuditRecord(reply?.debug);
  const auditRecord = readAgentLoopAuditRecord(debugRecord?.agent_loop_audit);
  const events = [
    ...(Array.isArray(reply?.liveEvents) ? reply.liveEvents : []),
    ...(Array.isArray(replyRecord?.live_events) ? replyRecord.live_events : []),
    ...(Array.isArray(debugRecord?.live_events) ? debugRecord.live_events : []),
    ...(Array.isArray(debugRecord?.turn_transcript_events) ? debugRecord.turn_transcript_events : []),
    ...(Array.isArray(auditRecord?.turn_transcript_events) ? auditRecord.turn_transcript_events : []),
  ];
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = readAgentLoopAuditRecord(events[index]);
    if (!event || typeof event !== "object") continue;
    const rawText = coerceText(event.text).trim();
    const tool = coerceText(event.tool).trim().toLowerCase();
    const type = coerceText(event.type).trim().toLowerCase();
    const meta = readAgentLoopAuditRecord(event.meta);
    const stage = coerceText(meta?.stage ?? meta?.event_stage).trim().toLowerCase();
    const status = coerceText(meta?.status ?? meta?.terminal_status).trim().toLowerCase();
    const isFinalEvent =
      tool === "final" ||
      type === "final_answer" ||
      stage === "final_answer" ||
      status === "final_answer" ||
      /\bfinal_answer\b/i.test(coerceText(event.id)) ||
      /^Final:\s*/i.test(rawText);
    if (!isFinalEvent) continue;
    const text = rawText.replace(/^Final:\s*/i, "").trim();
    if (text && !isInvalidTerminalAnswerText(text)) return text;
  }
  return null;
};

const normalizeVisibleDocPath = (value: string): string | null => {
  const path = value.trim().replace(/:(?:L)?\d+(?:-L?\d+)?$/i, "");
  return path.startsWith("/") ? path : null;
};

const renderDocOpenTerminalFromLocationText = (args: {
  text: string;
  goalKind: string;
  terminalKind: string;
}): string | null => {
  if (args.terminalKind !== "doc_open_receipt") return null;
  if (args.goalKind !== "latest_doc_navigation" && args.goalKind !== "doc_open_best") return null;
  if (!/^\s*Locations?:/i.test(args.text)) return null;
  const pathMatch = args.text.match(/\bPath:\s*(\/[^\s]+?\.md)(?::L?\d+(?:-L?\d+)?)?/i);
  const path = pathMatch?.[1] ? normalizeVisibleDocPath(pathMatch[1]) : null;
  if (!path) return null;
  const titleMatch = args.text.match(/^\s*-\s+(.+?),\s+L\d+/m);
  const title = titleMatch?.[1]?.trim() || path.split(/[\\/]/).pop() || path;
  const heading = args.goalKind === "latest_doc_navigation" ? "Opened latest verified document:" : "Opened document:";
  return [heading, "Document:", `- ${title}`, `  Path: ${path}`].join("\n");
};

export const renderTypedFailureFallback = (code?: string | null): string => {
  const normalized = coerceText(code).trim();
  if (normalized === "synthesis_unavailable") {
    return "I found candidate evidence, but no current-turn synthesis artifact answered the requested conclusion.\nCause: synthesis_unavailable.";
  }
  if (normalized === "equation_source_unavailable") {
    return "I looked for an equation-bearing source, but no current-turn equation artifact satisfied the source contract.\nCause: equation_source_unavailable.";
  }
  if (normalized === HELIX_ASK_BACKEND_DEBUG_MATERIALIZATION_ERROR_CODE) {
    return HELIX_ASK_BACKEND_DEBUG_MATERIALIZATION_TEXT;
  }
  if (normalized === HELIX_ASK_BACKEND_ENTRYPOINT_REQUIRED_ERROR_CODE) {
    return HELIX_ASK_BACKEND_ENTRYPOINT_REQUIRED_TEXT;
  }
  return normalized ? `I could not complete that turn.\nCause: ${normalized}.` : "I could not complete that turn.";
};

export function buildVisibleResolvedTurn(reply: HelixAskTerminalProjectionReply): VisibleResolvedTurn {
  const replyRecord = readAgentLoopAuditRecord(reply);
  const debugRecord = readAgentLoopAuditRecord(reply.debug);
  const terminalAuthorityRecord =
    readAgentLoopAuditRecord(replyRecord?.terminal_answer_authority) ??
    readAgentLoopAuditRecord(debugRecord?.terminal_answer_authority);
  const terminalAuthorityTrusted =
    terminalAuthorityRecord?.schema === "helix.turn_terminal_authority.v1" &&
    terminalAuthorityRecord.server_authoritative === true;
  const summary = readHelixResolvedTurnSummary(reply);
  const terminalResolution = resolveHelixVisibleTerminalCore(reply);
  const terminalResolutionIsFinalAnswer =
    Boolean(terminalResolution.backendTerminalText) &&
    terminalResolution.source !== "typed_failure" &&
    terminalResolution.source !== "terminal_authority_missing" &&
    terminalResolution.finalAnswerSource !== "typed_failure" &&
    terminalResolution.finalAnswerSource !== "request_user_input" &&
    terminalResolution.terminalKind !== "failure" &&
    terminalResolution.terminalKind !== "request_user_input" &&
    terminalResolution.terminalArtifactKind !== "typed_failure";
  const pendingRequest = readHelixTopLevelPendingServerRequest(reply);
  const pendingPresent = Boolean(pendingRequest) && !terminalResolutionIsFinalAnswer;
  const statusCandidate =
    terminalResolutionIsFinalAnswer
      ? "final_answer"
      : coerceText(summary?.final_status).trim() ||
        coerceText(readAgentLoopAuditRecord(replyRecord?.satisfaction_report ?? debugRecord?.satisfaction_report)?.terminal_kind).trim() ||
        (pendingPresent ? "pending_input" : reply.ok === false ? "final_failure" : "final_answer");
  const normalizedStatus: VisibleResolvedTurn["primary_terminal_label"] =
    statusCandidate === "pending_input" && pendingPresent
      ? "pending_input"
      : statusCandidate === "final_failure" || (statusCandidate === "pending_input" && !pendingPresent)
        ? "final_failure"
        : "final_answer";
  const terminalErrorCode =
    terminalResolutionIsFinalAnswer
      ? null
      : terminalResolution.terminalErrorCode ||
        coerceText(replyRecord?.terminal_error_code).trim() ||
        coerceText(debugRecord?.terminal_error_code).trim() ||
        coerceText(summary?.terminal_error_code).trim() ||
        (
          !pendingPresent &&
          reply.ok !== false &&
          !terminalAuthorityTrusted &&
          (
            coerceText(replyRecord?.selected_final_answer).trim() ||
            coerceText(debugRecord?.selected_final_answer).trim() ||
            coerceText(reply.assistant_answer).trim() ||
            coerceText(reply.text).trim() ||
            coerceText(reply.content).trim()
          )
            ? "terminal_authority_missing"
            : null
        );
  const explicitFinalAnswerSource =
    coerceText(terminalResolution.finalAnswerSource).trim() ||
    coerceText(replyRecord?.final_answer_source).trim() ||
    coerceText(debugRecord?.final_answer_source).trim() ||
    coerceText(terminalAuthorityRecord?.final_answer_source).trim();
  const finalAnswerSource =
    explicitFinalAnswerSource ||
    (terminalErrorCode ? "typed_failure" : "unknown");
  const explicitTypedFailureSignal =
    explicitFinalAnswerSource === "typed_failure" ||
    terminalResolution.terminalKind === "failure" ||
    terminalResolution.terminalArtifactKind === "typed_failure" ||
    coerceText(summary?.terminal_artifact_kind).trim() === "typed_failure" ||
    coerceText(replyRecord?.terminal_artifact_kind).trim() === "typed_failure" ||
    coerceText(debugRecord?.terminal_artifact_kind).trim() === "typed_failure" ||
    coerceText(terminalAuthorityRecord?.terminal_artifact_kind).trim() === "typed_failure";
  const isTypedFailure = finalAnswerSource === "typed_failure" || Boolean(terminalErrorCode);
  const liveFinalAnswer = readLatestAuthoritativeFinalLiveEventText(reply);
  const terminalAuthorityText = coerceText(terminalAuthorityRecord?.terminal_text_preview).trim();
  const typedFailureRecord =
    readAgentLoopAuditRecord(replyRecord?.typed_failure) ??
    readAgentLoopAuditRecord(debugRecord?.typed_failure);
  const selectedTypedFailureAnswer =
    explicitTypedFailureSignal
      ? (
          coerceText(replyRecord?.selected_final_answer).trim() ||
          coerceText(debugRecord?.selected_final_answer).trim() ||
          coerceText(typedFailureRecord?.answer_text).trim() ||
          coerceText(typedFailureRecord?.text).trim() ||
          coerceText(replyRecord?.terminal_failure_text).trim() ||
          coerceText(debugRecord?.terminal_failure_text).trim()
        )
      : "";
  const selectedFinalAnswerCandidate =
    isTypedFailure
      ? selectedTypedFailureAnswer || terminalAuthorityText || terminalResolution.text || renderTypedFailureFallback(terminalErrorCode)
      : terminalAuthorityTrusted && terminalAuthorityText
        ? terminalAuthorityText
        : "";
  const canonicalGoalKind = readHelixCanonicalGoalKind(reply);
  const terminalArtifactKind =
    coerceText(terminalResolution.terminalArtifactKind).trim() ||
    coerceText(summary?.terminal_artifact_kind).trim() ||
    coerceText(replyRecord?.terminal_artifact_kind).trim() ||
    coerceText(debugRecord?.terminal_artifact_kind).trim() ||
    coerceText(terminalAuthorityRecord?.terminal_artifact_kind).trim();
  const effectiveFinalAnswerSource =
    normalizeFinalAnswerSourceForTerminalKind(finalAnswerSource, terminalArtifactKind) ??
    finalAnswerSource;
  const situationContextAnswer =
    effectiveFinalAnswerSource === "artifact_synthesis" && terminalArtifactKind === "situation_context_pack"
      ? (
          coerceText(replyRecord?.assistant_answer).trim() ||
          coerceText(replyRecord?.answer).trim() ||
          coerceText(replyRecord?.text).trim() ||
          liveFinalAnswer
        )
      : "";
  const canonicalSelectedFinalAnswer =
    !isTypedFailure && terminalArtifactKind === "model_synthesized_answer" && effectiveFinalAnswerSource === "final_answer_draft"
      ? (
          coerceText(replyRecord?.selected_final_answer).trim() ||
          coerceText(debugRecord?.selected_final_answer).trim()
        )
      : "";
  const selectedFinalAnswerRaw =
    terminalResolutionIsFinalAnswer
      ? terminalResolution.text
      : canonicalSelectedFinalAnswer
      ? canonicalSelectedFinalAnswer
      : isTypedFailure
        ? selectedFinalAnswerCandidate
      : terminalResolution.text &&
    terminalResolution.source !== "legacy_shadow" &&
    terminalResolution.source !== "empty" &&
    terminalResolution.source !== "typed_failure"
      ? terminalResolution.text
      : terminalResolution.source === "typed_failure"
      ? terminalResolution.text
      : situationContextAnswer
        ? situationContextAnswer
      : !isTypedFailure && liveFinalAnswer && isInvalidTerminalAnswerText(selectedFinalAnswerCandidate)
      ? liveFinalAnswer
      : selectedFinalAnswerCandidate;
  const selectedFinalAnswer =
    pendingPresent
      ? ""
      : renderDocOpenTerminalFromLocationText({
        text: selectedFinalAnswerRaw,
        goalKind: canonicalGoalKind,
        terminalKind: terminalArtifactKind,
      }) ?? selectedFinalAnswerRaw;
  const summaryRouteLabel = coerceText(summary?.resolved_route_label).trim();
  const routeLabel =
    terminalArtifactKind === "workstation_tool_evaluation" && /model_synthesized_answer/i.test(summaryRouteLabel)
      ? `${canonicalGoalKind} / workstation_tool_evaluation`
      : summaryRouteLabel || `${canonicalGoalKind} / ${effectiveFinalAnswerSource}`;
  return {
    active_turn_id: coerceText(reply.turn_id).trim() || coerceText(summary?.turn_id).trim() || reply.id,
    primary_route_label: routeLabel,
    primary_terminal_label: normalizedStatus,
    primary_source_label: formatHelixVisibleTerminalSourceLabel({
      terminalArtifactKind,
      finalAnswerSource: effectiveFinalAnswerSource,
    }),
    selected_final_answer: selectedFinalAnswer,
    terminal_error_code: terminalErrorCode,
    pending_server_request_present: pendingPresent,
  };
}

export function chooseVisibleFinalText(reply: HelixAskTerminalProjectionReply): string {
  const visible = buildVisibleResolvedTurn(reply);
  const replyRecord = readAgentLoopAuditRecord(reply);
  if (visible.primary_source_label.replace(/\s+/g, "_") === "typed_failure" || visible.terminal_error_code) {
    return visible.selected_final_answer || renderTypedFailureFallback(visible.terminal_error_code);
  }
  if (!visible.selected_final_answer && replyRecord?.ok === false) {
    return renderTypedFailureFallback("terminal_authority_missing");
  }
  return visible.selected_final_answer || "";
}

const readTerminalAnswerAuthorityRecord = (value: unknown): RecordLike | null => {
  const record = readAgentLoopAuditRecord(value);
  return record?.schema === "helix.turn_terminal_authority.v1" && record.server_authoritative === true
    ? record
    : null;
};

const readTerminalSourceLabelCandidate = (
  record: RecordLike | null | undefined,
  fallbackFinalAnswerSource?: string | null,
): string | null => {
  const terminalKind =
    typeof record?.terminal_artifact_kind === "string" && record.terminal_artifact_kind.trim()
      ? record.terminal_artifact_kind.trim()
      : typeof record?.selected_terminal_artifact_kind === "string" && record.selected_terminal_artifact_kind.trim()
        ? record.selected_terminal_artifact_kind.trim()
      : null;
  const recordSource =
    typeof record?.final_answer_source === "string" && record.final_answer_source.trim()
      ? record.final_answer_source.trim()
      : typeof record?.source === "string" && record.source.trim()
        ? record.source.trim()
      : null;
  if (!terminalKind && !recordSource) return null;
  return formatHelixVisibleTerminalSourceLabel({
    terminalArtifactKind: terminalKind,
    finalAnswerSource: normalizeFinalAnswerSourceForTerminalKind(recordSource ?? fallbackFinalAnswerSource ?? null, terminalKind),
  });
};

export function readHelixAskFinalAnswerSourceLabel(...sources: unknown[]): string | null {
  for (const source of sources) {
    const record = readAgentLoopAuditRecord(source);
    if (!record) continue;
    const finalAnswerDraft = readAgentLoopAuditRecord(record.final_answer_draft);
    const finalAnswerDraftAuthority =
      typeof finalAnswerDraft?.authority === "string" && finalAnswerDraft.authority.trim()
        ? finalAnswerDraft.authority.trim()
        : null;
    if (finalAnswerDraftAuthority === "deterministic_receipt_fallback") {
      return "deterministic receipt fallback";
    }
    const directSource =
      typeof record.final_answer_source === "string" && record.final_answer_source.trim()
        ? record.final_answer_source.trim()
        : null;
    const resolvedSummary = readAgentLoopAuditRecord(record.resolved_turn_summary);
    const terminalAuthorityRecord = readTerminalAnswerAuthorityRecord(record.terminal_answer_authority);
    const terminalAuthoritySingleWriterRecord = readAgentLoopAuditRecord(record.terminal_authority_single_writer);
    const debugRecord = readAgentLoopAuditRecord(record.debug);
    const debugResolvedSummary = readAgentLoopAuditRecord(debugRecord?.resolved_turn_summary);
    const debugTerminalAuthorityRecord = readTerminalAnswerAuthorityRecord(debugRecord?.terminal_answer_authority);
    const debugTerminalAuthoritySingleWriterRecord = readAgentLoopAuditRecord(debugRecord?.terminal_authority_single_writer);
    for (const terminalRecord of [
      terminalAuthorityRecord,
      terminalAuthoritySingleWriterRecord,
      debugTerminalAuthorityRecord,
      debugTerminalAuthoritySingleWriterRecord,
      resolvedSummary,
      debugResolvedSummary,
    ]) {
      const label = readTerminalSourceLabelCandidate(terminalRecord, directSource);
      if (label) return label;
    }
    const directTerminalKind =
      typeof record.terminal_artifact_kind === "string" && record.terminal_artifact_kind.trim()
        ? record.terminal_artifact_kind.trim()
        : null;
    if (directSource || directTerminalKind) {
      return formatHelixVisibleTerminalSourceLabel({
        terminalArtifactKind: directTerminalKind,
        finalAnswerSource: normalizeFinalAnswerSourceForTerminalKind(directSource, directTerminalKind),
      });
    }
    const truthTable = readAgentLoopAuditRecord(record.turn_truth_table);
    const truthTerminal = readAgentLoopAuditRecord(truthTable?.terminal);
    const truthSource =
      typeof truthTerminal?.final_answer_source === "string" && truthTerminal.final_answer_source.trim()
        ? truthTerminal.final_answer_source.trim()
        : null;
    const truthTerminalKind =
      typeof truthTerminal?.kind === "string" && truthTerminal.kind.trim()
        ? truthTerminal.kind.trim()
        : typeof truthTerminal?.terminal_artifact_kind === "string" && truthTerminal.terminal_artifact_kind.trim()
          ? truthTerminal.terminal_artifact_kind.trim()
          : null;
    if (truthSource || truthTerminalKind) {
      return formatHelixVisibleTerminalSourceLabel({
        terminalArtifactKind: truthTerminalKind,
        finalAnswerSource: normalizeFinalAnswerSourceForTerminalKind(truthSource, truthTerminalKind),
      });
    }
    const audit = readAgentLoopAuditRecord(record.agent_loop_audit);
    const auditSource =
      typeof audit?.final_answer_source === "string" && audit.final_answer_source.trim()
        ? audit.final_answer_source.trim()
        : null;
    const auditTerminalKind =
      typeof audit?.terminal_artifact_kind === "string" && audit.terminal_artifact_kind.trim()
        ? audit.terminal_artifact_kind.trim()
        : null;
    if (auditSource || auditTerminalKind) {
      return formatHelixVisibleTerminalSourceLabel({
        terminalArtifactKind: auditTerminalKind,
        finalAnswerSource: normalizeFinalAnswerSourceForTerminalKind(auditSource, auditTerminalKind),
      });
    }
  }
  return null;
}

export function isHelixAskDeterministicReceiptFallbackLabel(value: unknown): boolean {
  return /^deterministic[\s_-]+receipt[\s_-]+fallback$/i.test(coerceText(value).trim());
}

export function resolveHelixAskFinalAnswerPresentation(
  sourceLabel: string | null | undefined,
): HelixAskFinalAnswerPresentation {
  if (isHelixAskDeterministicReceiptFallbackLabel(sourceLabel)) {
    return {
      heading: "Checkpoint receipt",
      sourceLabel: "checkpoint receipt (not reviewed)",
      isDeterministicReceiptFallback: true,
    };
  }
  const normalized = coerceText(sourceLabel).trim();
  return {
    heading: "Final answer",
    sourceLabel: normalized || null,
    isDeterministicReceiptFallback: false,
  };
}
