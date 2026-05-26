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

type RecordLike = Record<string, unknown>;

function readRecord(value: unknown): RecordLike | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTerminalText(value: unknown): string {
  return readString(value).replace(/\u00a0/g, " ").trim();
}

function isInvalidTerminalText(value: unknown): boolean {
  const normalized = normalizeTerminalText(value);
  if (!normalized) return true;
  return (
    /^no final answer returned\.?$/i.test(normalized) ||
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

export function resolveHelixVisibleTerminal(
  value: unknown,
  fallbackContent?: string | null,
): HelixVisibleTerminalResolution {
  const record = readRecord(value);
  const debug = readRecord(record?.debug);
  const agentLoop = readRecord(record?.agent_runtime_loop ?? debug?.agent_runtime_loop ?? record?.agent_loop_audit ?? debug?.agent_loop_audit);
  const envelope = firstRecord(record?.terminal_answer_envelope, debug?.terminal_answer_envelope, agentLoop?.terminal_answer_envelope);
  const authority = firstRecord(record?.terminal_answer_authority, debug?.terminal_answer_authority, agentLoop?.terminal_answer_authority);
  const presentation = firstRecord(record?.terminal_presentation, debug?.terminal_presentation, agentLoop?.terminal_presentation);
  const summary = firstRecord(record?.resolved_turn_summary, debug?.resolved_turn_summary);

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
