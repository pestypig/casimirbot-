export type HelixVisibleTerminalResolution = {
  text: string;
  source: string;
  backendTerminalText: string | null;
  terminalKind: string | null;
  finalAnswerSource: string | null;
  terminalErrorCode: string | null;
  authorityVerified: boolean;
  usedLegacyShadow: boolean;
};

export type HelixVisibleTerminalSourceLabelInput = {
  terminalArtifactKind?: unknown;
  finalAnswerSource?: unknown;
  fallback?: unknown;
};

export type HelixRuntimeStopReasonVisibilityInput = {
  stopReason?: unknown;
  finalStatus?: unknown;
  terminalErrorCode?: unknown;
  solverDecision?: unknown;
  terminalKind?: unknown;
};

type RecordLike = Record<string, unknown>;

function readRecord(value: unknown): RecordLike | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeTerminalText(value: unknown): string {
  return readString(value).replace(/\u00a0/g, " ").trim();
}

function isInvalidTerminalText(value: unknown): boolean {
  const normalized = normalizeTerminalText(value);
  if (!normalized) return true;
  return (
    /^no final answer returned\.?$/i.test(normalized) ||
    /^I could not produce a terminal answer for this turn\.?$/i.test(normalized) ||
    /^I could not produce a final answer for this turn\.?$/i.test(normalized) ||
    /^direct_answer_unavailable$/i.test(normalized) ||
    /^model_only_answer_unavailable$/i.test(normalized) ||
    /^I could not produce a substantive direct answer for this background-only turn\.?$/i.test(normalized) ||
    /^I couldn't produce a final answer for that turn\. Please retry once\.?$/i.test(normalized)
  );
}

function firstRecord(...values: unknown[]): RecordLike | null {
  for (const value of values) {
    const record = readRecord(value);
    if (record) return record;
  }
  return null;
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const text = normalizeTerminalText(value);
    if (text && !isInvalidTerminalText(text)) return text;
  }
  return "";
}

function renderTypedFailureFallback(code?: string | null): string {
  const normalized = readString(code);
  if (normalized === "synthesis_unavailable") {
    return "I found candidate evidence, but no current-turn synthesis artifact answered the requested conclusion.\nCause: synthesis_unavailable.";
  }
  if (normalized === "equation_source_unavailable") {
    return "I looked for an equation-bearing source, but no current-turn equation artifact satisfied the source contract.\nCause: equation_source_unavailable.";
  }
  return normalized ? `I could not complete that turn.\nCause: ${normalized}.` : "I could not complete that turn.";
}

export function formatHelixVisibleTerminalSourceLabel(
  input: HelixVisibleTerminalSourceLabelInput,
): string {
  const terminalKind = readString(input.terminalArtifactKind);
  const finalAnswerSource = readString(input.finalAnswerSource);
  const fallback = readString(input.fallback);

  const kindLabelByTerminalKind: Record<string, string> = {
    direct_answer_text: "model direct answer",
    doc_summary: "doc summary",
    doc_open_receipt: "doc open receipt",
    doc_location_matches: "docs location",
    doc_location_result: "docs location",
    doc_evidence_location: "docs location",
    doc_search_results: "docs search",
    workstation_tool_evaluation: "workstation tool evaluation",
    workspace_action_receipt: "workspace action receipt",
    note_update_receipt: "note update receipt",
    calculator_receipt: "calculator receipt",
    tool_evaluation: "tool evaluation",
    live_pipeline_receipt: "live pipeline receipt",
    live_environment_binding_diagnosis: "live environment diagnosis",
    situation_context_pack: "situation context",
    compound_research_locator_answer: "compound research locator answer",
    scholarly_research_answer: "scholarly research answer",
    internet_search_answer: "internet search answer",
    repo_code_evidence_answer: "repo code evidence answer",
    typed_failure: "typed failure",
  };

  if (terminalKind && kindLabelByTerminalKind[terminalKind]) {
    return kindLabelByTerminalKind[terminalKind];
  }

  if (terminalKind && terminalKind !== "unknown") {
    return terminalKind.replace(/_/g, " ");
  }

  if (finalAnswerSource) {
    return finalAnswerSource.replace(/_/g, " ");
  }

  return fallback ? fallback.replace(/_/g, " ") : "unknown";
}

export function shouldShowHelixRuntimeStopReason(
  input: HelixRuntimeStopReasonVisibilityInput,
): boolean {
  const stopReason = readString(input.stopReason);
  if (!stopReason) return false;

  const finalStatus = readString(input.finalStatus);
  const terminalErrorCode = readString(input.terminalErrorCode);
  const solverDecision = readString(input.solverDecision);
  const terminalKind = readString(input.terminalKind);

  if (
    stopReason === "budget_exhausted" &&
    !terminalErrorCode &&
    terminalKind !== "typed_failure" &&
    (finalStatus === "final_answer" || terminalKind === "final_answer") &&
    solverDecision !== "fail_closed"
  ) {
    return false;
  }

  return true;
}

function isSourceOrCapabilityTurn(args: {
  record: RecordLike | null;
  debug: RecordLike | null;
  agentLoop: RecordLike | null;
}): boolean {
  const sourceIntent = firstRecord(
    args.record?.source_target_intent,
    args.debug?.source_target_intent,
    args.record?.ask_turn_preflight_context && readRecord(args.record.ask_turn_preflight_context)?.source_target_intent,
    args.debug?.ask_turn_preflight_context && readRecord(args.debug.ask_turn_preflight_context)?.source_target_intent,
  );
  const sourceTarget = readString(sourceIntent?.target_source ?? sourceIntent?.source_target);
  const sourceStrength = readString(sourceIntent?.strength);
  if (sourceTarget && sourceTarget !== "unknown" && sourceStrength !== "none") return true;

  const canonicalGoal = firstRecord(args.record?.canonical_goal_frame, args.debug?.canonical_goal_frame);
  const goalKind = readString(canonicalGoal?.goal_kind);
  if (
    goalKind &&
    goalKind !== "model_only_concept" &&
    /(?:doc|visual|live|calculator|panel|workspace|notes|process_graph|source|location|open)/i.test(goalKind)
  ) {
    return true;
  }

  if (Array.isArray(args.record?.available_capabilities) || Array.isArray(args.debug?.available_capabilities)) return true;
  if (readRecord(args.record?.agent_runtime_loop ?? args.debug?.agent_runtime_loop ?? args.agentLoop)) return true;
  return false;
}

function hasSatisfiedDirectAnswerGoal(record: RecordLike | null, debug: RecordLike | null): boolean {
  const goal = firstRecord(record?.goal_satisfaction_evaluation, debug?.goal_satisfaction_evaluation);
  const satisfaction = readString(goal?.satisfaction);
  const nextDecision = readString(goal?.next_decision);
  if (satisfaction === "satisfied" && nextDecision === "allow_terminal") return true;

  const runtime = firstRecord(record?.agent_runtime_loop, debug?.agent_runtime_loop);
  const terminalState = readString(runtime?.terminal_state);
  return terminalState === "answer_drafted" || terminalState === "terminal_satisfied";
}

function directAnswerTextFromArtifacts(...artifactContainers: unknown[]): string {
  for (const container of artifactContainers) {
    for (const artifact of readArray(container)) {
      const artifactRecord = readRecord(artifact);
      const artifactKind = readString(artifactRecord?.kind);
      const payload = readRecord(artifactRecord?.payload);
      const schema = readString(payload?.schema);
      if (
        artifactKind !== "direct_answer_text" &&
        artifactKind !== "final_answer_draft" &&
        schema !== "helix.direct_answer_text.v1" &&
        schema !== "helix.final_answer_draft.v1"
      ) {
        continue;
      }
      const text = firstText(payload?.answer_text, payload?.text, artifactRecord?.text);
      if (text) return text;
    }
  }
  return "";
}

function directAnswerTextFromRecord(record: RecordLike | null, debug: RecordLike | null): string {
  const directAnswer = firstRecord(record?.direct_answer_text, debug?.direct_answer_text);
  const finalDraft = firstRecord(record?.final_answer_draft, debug?.final_answer_draft);
  return (
    firstText(directAnswer?.answer_text, directAnswer?.text, finalDraft?.answer_text, finalDraft?.text) ||
    directAnswerTextFromArtifacts(record?.current_turn_artifact_ledger, debug?.current_turn_artifact_ledger)
  );
}

export function resolveHelixVisibleTerminal(
  value: unknown,
  fallbackContent?: string | null,
): HelixVisibleTerminalResolution {
  const record = readRecord(value);
  const debug = readRecord(record?.debug);
  const agentLoop = readRecord(record?.agent_runtime_loop ?? debug?.agent_runtime_loop ?? record?.agent_loop_audit ?? debug?.agent_loop_audit);
  const singleWriter = firstRecord(
    record?.terminal_authority_single_writer,
    debug?.terminal_authority_single_writer,
    agentLoop?.terminal_authority_single_writer,
  );
  const envelope = firstRecord(record?.terminal_answer_envelope, debug?.terminal_answer_envelope, agentLoop?.terminal_answer_envelope);
  const authority = firstRecord(record?.terminal_answer_authority, debug?.terminal_answer_authority, agentLoop?.terminal_answer_authority);
  const presentation = firstRecord(record?.terminal_presentation, debug?.terminal_presentation, agentLoop?.terminal_presentation);
  const summary = firstRecord(record?.resolved_turn_summary, debug?.resolved_turn_summary);
  const recoveredModelDirectAnswer =
    hasSatisfiedDirectAnswerGoal(record, debug) ? directAnswerTextFromRecord(record, debug) : "";

  const terminalErrorCode = firstText(record?.terminal_error_code, debug?.terminal_error_code, summary?.terminal_error_code) || null;
  const terminalKind =
    firstText(
      envelope?.terminal_kind,
      authority?.terminal_artifact_kind,
      presentation?.terminal_artifact_kind,
      record?.terminal_artifact_kind,
      debug?.terminal_artifact_kind,
      summary?.terminal_artifact_kind,
    ) || null;
  const finalAnswerSource =
    firstText(envelope?.final_answer_source, authority?.final_answer_source, record?.final_answer_source, debug?.final_answer_source) ||
    (terminalErrorCode ? "typed_failure" : null);
  const selectedFinalAnswer = firstText(record?.selected_final_answer, debug?.selected_final_answer);
  const selectedFinalAnswerIsAuthoritativeModelDraft =
    !terminalErrorCode &&
    terminalKind === "model_synthesized_answer" &&
    finalAnswerSource === "final_answer_draft" &&
    Boolean(selectedFinalAnswer);

  if (selectedFinalAnswerIsAuthoritativeModelDraft) {
    return {
      text: selectedFinalAnswer,
      source: "selected_final_answer",
      backendTerminalText: selectedFinalAnswer,
      terminalKind,
      finalAnswerSource,
      terminalErrorCode,
      authorityVerified: Boolean(authority?.server_authoritative === true),
      usedLegacyShadow: false,
    };
  }

  const singleWriterText = firstText(singleWriter?.visible_text);
  const singleWriterIntegrity = readRecord(singleWriter?.integrity);
  if (singleWriterText && singleWriterIntegrity?.single_writer_applied === true) {
    return {
      text: singleWriterText,
      source: "terminal_authority_single_writer",
      backendTerminalText: singleWriterText,
      terminalKind,
      finalAnswerSource,
      terminalErrorCode,
      authorityVerified: Boolean(authority?.server_authoritative === true),
      usedLegacyShadow: false,
    };
  }

  const envelopeText = firstText(envelope?.terminal_text);
  if (envelopeText) {
    return {
      text: envelopeText,
      source: "terminal_answer_envelope",
      backendTerminalText: envelopeText,
      terminalKind,
      finalAnswerSource,
      terminalErrorCode,
      authorityVerified: Boolean(authority?.server_authoritative === true),
      usedLegacyShadow: false,
    };
  }

  const authorityText = authority?.server_authoritative === true ? firstText(authority?.terminal_text_preview) : "";
  if (authorityText) {
    return {
      text: authorityText,
      source: "terminal_answer_authority",
      backendTerminalText: authorityText,
      terminalKind,
      finalAnswerSource,
      terminalErrorCode,
      authorityVerified: true,
      usedLegacyShadow: false,
    };
  }

  const presentationText = firstText(presentation?.concise_text);
  if (presentationText) {
    return {
      text: presentationText,
      source: "terminal_presentation",
      backendTerminalText: presentationText,
      terminalKind,
      finalAnswerSource,
      terminalErrorCode,
      authorityVerified: false,
      usedLegacyShadow: false,
    };
  }

  if (recoveredModelDirectAnswer) {
    return {
      text: recoveredModelDirectAnswer,
      source: "model_direct_answer_artifact",
      backendTerminalText: recoveredModelDirectAnswer,
      terminalKind: terminalKind ?? "direct_answer_text",
      finalAnswerSource: finalAnswerSource ?? "model_direct_answer",
      terminalErrorCode,
      authorityVerified: Boolean(authority?.server_authoritative === true),
      usedLegacyShadow: false,
    };
  }

  const typedFailureText =
    finalAnswerSource === "typed_failure" || terminalKind === "typed_failure" || terminalErrorCode
      ? firstText(record?.typed_failure && readRecord(record.typed_failure)?.answer_text, record?.selected_final_answer, debug?.selected_final_answer) ||
        renderTypedFailureFallback(terminalErrorCode)
      : "";
  if (typedFailureText) {
    return {
      text: typedFailureText,
      source: "typed_failure",
      backendTerminalText: typedFailureText,
      terminalKind: terminalKind ?? "typed_failure",
      finalAnswerSource: finalAnswerSource ?? "typed_failure",
      terminalErrorCode,
      authorityVerified: false,
      usedLegacyShadow: false,
    };
  }

  const sourceCapabilityTurn = isSourceOrCapabilityTurn({ record, debug, agentLoop });
  if (sourceCapabilityTurn) {
    const text = renderTypedFailureFallback("terminal_authority_missing");
    return {
      text,
      source: "terminal_authority_missing",
      backendTerminalText: null,
      terminalKind,
      finalAnswerSource,
      terminalErrorCode: terminalErrorCode ?? "terminal_authority_missing",
      authorityVerified: false,
      usedLegacyShadow: false,
    };
  }

  const legacyText = firstText(
    record?.selected_final_answer,
    debug?.selected_final_answer,
    record?.assistant_answer,
    record?.answer,
    record?.text,
    record?.finalAnswer,
    record?.content,
    fallbackContent,
  );
  return {
    text: legacyText,
    source: legacyText ? "legacy_shadow" : "empty",
    backendTerminalText: null,
    terminalKind,
    finalAnswerSource,
    terminalErrorCode,
    authorityVerified: false,
    usedLegacyShadow: Boolean(legacyText),
  };
}
