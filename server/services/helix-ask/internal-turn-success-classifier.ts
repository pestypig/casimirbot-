import type {
  HelixInternalTurnSuccess,
  HelixInternalTurnSuccessStage,
} from "@shared/helix-internal-turn-success";
import type { HelixTerminalAuthoritySingleWriterResult } from "@shared/helix-terminal-authority";

export type HelixClassifierArtifact = {
  artifact_id?: unknown;
  kind?: unknown;
  payload?: unknown;
};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const stableTextHash = (value: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const payloadOf = (artifact: HelixClassifierArtifact): Record<string, unknown> | null =>
  readRecord(artifact.payload);

const kindOf = (artifact: HelixClassifierArtifact): string =>
  readString(artifact.kind) ?? readString(payloadOf(artifact)?.kind) ?? "";

const schemaOf = (artifact: HelixClassifierArtifact): string =>
  readString(payloadOf(artifact)?.schema) ?? "";

const idOf = (artifact: HelixClassifierArtifact): string | undefined =>
  readString(artifact.artifact_id) ?? readString(payloadOf(artifact)?.artifact_id) ?? undefined;

const textOf = (artifact: HelixClassifierArtifact): string | null => {
  const payload = payloadOf(artifact);
  return readString(payload?.answer_text) ?? readString(payload?.text) ?? readString(payload?.visible_text);
};

const isObservationPacket = (artifact: HelixClassifierArtifact): boolean =>
  kindOf(artifact) === "agent_step_observation_packet" ||
  schemaOf(artifact) === "helix.agent_step_observation_packet.v1";

const isSuccessfulObservationPacket = (artifact: HelixClassifierArtifact): boolean => {
  if (!isObservationPacket(artifact)) return false;
  const payload = payloadOf(artifact);
  return readString(payload?.status) === "succeeded" || readBoolean(payload?.terminal_eligible) === false;
};

const isFinalDraft = (artifact: HelixClassifierArtifact): boolean =>
  kindOf(artifact) === "final_answer_draft" ||
  schemaOf(artifact) === "helix.final_answer_draft.v1";

const isDirectAnswer = (artifact: HelixClassifierArtifact): boolean =>
  kindOf(artifact) === "direct_answer_text" ||
  schemaOf(artifact) === "helix.direct_answer_text.v1";

const isGenericTerminalFailure = (text: string | null | undefined): boolean =>
  /\bI could not produce a terminal answer for this turn\b/i.test(text ?? "");

const isStaleFailure = (text: string | null | undefined): boolean =>
  /(?:workspace_step_failed|Failed to execute)/i.test(text ?? "");

const isLegacyFallback = (text: string | null | undefined): boolean =>
  /\b(?:legacy|fallback|Retrying after tool timeout|No final answer returned)\b/i.test(text ?? "");

export function classifyHelixInternalTurnSuccess(input: {
  turn_id: string;
  artifact_ledger: HelixClassifierArtifact[];
  terminal_authority_single_writer_result?: HelixTerminalAuthoritySingleWriterResult | null;
  visible_text?: string | null;
  payload_snapshot?: Record<string, unknown>;
  stage: HelixInternalTurnSuccessStage;
  repair?: HelixInternalTurnSuccess["repair"];
}): HelixInternalTurnSuccess {
  const ledger = input.artifact_ledger;
  let latestObservation: { artifact: HelixClassifierArtifact; sequence: number } | null = null;
  let finalDraft: { artifact: HelixClassifierArtifact; sequence: number } | null = null;
  let directAnswer: { artifact: HelixClassifierArtifact; sequence: number } | null = null;
  for (let index = 0; index < ledger.length; index += 1) {
    const artifact = ledger[index];
    if (!artifact) continue;
    if (isSuccessfulObservationPacket(artifact)) latestObservation = { artifact, sequence: index };
    if (isFinalDraft(artifact) && textOf(artifact)) finalDraft = { artifact, sequence: index };
    if (isDirectAnswer(artifact) && textOf(artifact)) directAnswer = { artifact, sequence: index };
  }

  const writer = input.terminal_authority_single_writer_result ?? null;
  const visibleText =
    input.visible_text ??
    readString(input.payload_snapshot?.selected_final_answer) ??
    readString(input.payload_snapshot?.answer) ??
    readString(input.payload_snapshot?.text);
  const finalDraftText = finalDraft ? textOf(finalDraft.artifact) : null;
  const writerVisibleText = readString(writer?.visible_text);
  const selectedRef = readString(writer?.selected_terminal_artifact_ref);
  const selectedText =
    selectedRef && finalDraft && selectedRef === idOf(finalDraft.artifact)
      ? finalDraftText
      : writerVisibleText;
  const postToolRequired = Boolean(latestObservation);
  const postToolSatisfied = Boolean(
    latestObservation &&
    finalDraft &&
    finalDraft.sequence > latestObservation.sequence,
  );
  const goalSatisfaction =
    ledger.some((artifact) => {
      const payload = payloadOf(artifact);
      return kindOf(artifact) === "goal_satisfaction_evaluation" && readString(payload?.satisfaction) === "satisfied";
    }) || postToolSatisfied
      ? "satisfied"
      : "unknown";
  const singleWriterApplied = writer?.integrity?.single_writer_applied === true;
  const visibleMatchesSelected = Boolean(visibleText && selectedText && visibleText === selectedText);
  const visibleMatchesDraft = Boolean(visibleText && finalDraftText && visibleText === finalDraftText);
  const staleFailureVisible = isStaleFailure(visibleText);
  const genericFailureVisible = isGenericTerminalFailure(visibleText);
  const legacyFallbackVisible = isLegacyFallback(visibleText);
  const receiptVisibleAsAnswer = writer?.integrity?.receipt_visible_as_answer === true;
  const terminalErrorCode = readString(input.payload_snapshot?.terminal_error_code) ?? undefined;
  const finalDraftSelection = readRecord(input.payload_snapshot?.final_answer_draft_selection);
  const materialization = readRecord(input.payload_snapshot?.route_terminal_materialization);
  const materializationOk = materialization?.materialization_ok === true || Boolean(finalDraftSelection?.materialized_terminal_artifact_kind);
  const draftQualityOk =
    finalDraftSelection?.latest_final_answer_draft_quality_ok === true ||
    readRecord(input.payload_snapshot?.final_answer_draft_quality_gate)?.ok === true ||
    (Boolean(finalDraft) && !finalDraftSelection);
  const finalDraftLaterThanDirect = Boolean(finalDraft && (!directAnswer || finalDraft.sequence > directAnswer.sequence));
  const routeFamily = readString(materialization?.route_family);
  const internalSuccess = Boolean(postToolSatisfied || (finalDraft && draftQualityOk));
  const visibleSuccess = Boolean(singleWriterApplied && visibleMatchesSelected && !staleFailureVisible && !genericFailureVisible && !receiptVisibleAsAnswer);
  const visibleHasText = Boolean(visibleText && !staleFailureVisible && !genericFailureVisible);
  const visibleSelectedEarlierDirectAnswer = Boolean(
    finalDraft &&
    directAnswer &&
    finalDraft.sequence > directAnswer.sequence &&
    visibleText &&
    visibleText === textOf(directAnswer.artifact) &&
    visibleText !== finalDraftText,
  );
  const missingAllowedTerminalArtifactDespiteValidDraft = Boolean(
    finalDraft &&
    draftQualityOk &&
    terminalErrorCode === "missing_allowed_terminal_artifact",
  );
  const typedFailureDespiteValidDraft = Boolean(
    finalDraft &&
    draftQualityOk &&
    (readString(input.payload_snapshot?.terminal_artifact_kind) === "typed_failure" ||
      readString(input.payload_snapshot?.final_answer_source) === "typed_failure"),
  );
  const outcome: HelixInternalTurnSuccess["outcome"] =
    internalSuccess && visibleSuccess
      ? "internal_success_and_visible_success"
      : internalSuccess
        ? "internal_success_visible_failure"
        : visibleHasText && !singleWriterApplied
          ? "visible_success_without_internal_authority"
          : "internal_failure_visible_failure";

  return {
    schema: "helix.internal_turn_success.v1",
    turn_id: input.turn_id,
    computed_at_stage: input.stage,
    internal: {
      tool_path_succeeded: postToolSatisfied,
      repo_evidence_path_succeeded: false,
      live_job_path_succeeded: false,
      latest_successful_observation_packet_ref: latestObservation ? idOf(latestObservation.artifact) : undefined,
      latest_successful_observation_sequence: latestObservation?.sequence,
      post_tool_model_step_required: postToolRequired,
      post_tool_model_step_satisfied: postToolSatisfied,
      final_answer_draft_exists: Boolean(finalDraft),
      final_answer_draft_ref: finalDraft ? idOf(finalDraft.artifact) : undefined,
      final_answer_draft_sequence: finalDraft?.sequence,
      final_answer_draft_is_later_than_direct_answer: finalDraftLaterThanDirect,
      final_answer_draft_quality_ok: draftQualityOk,
      materialized_terminal_artifact_kind: readString(finalDraftSelection?.materialized_terminal_artifact_kind) ?? readString(materialization?.materialized_terminal_artifact_kind) ?? undefined,
      model_only_synthesis_succeeded: Boolean(finalDraft && draftQualityOk && routeFamily === "model_only"),
      repo_source_synthesis_succeeded: Boolean(finalDraft && draftQualityOk && routeFamily === "repo_evidence" && materializationOk),
      docs_source_synthesis_succeeded: Boolean(finalDraft && draftQualityOk && routeFamily === "docs_source"),
      calculator_synthesis_succeeded: Boolean(finalDraft && draftQualityOk && routeFamily === "calculator_tool"),
      goal_satisfaction: goalSatisfaction,
      pending_tool_call_ids: [],
    },
    terminal: {
      single_writer_applied: singleWriterApplied,
      selected_terminal_artifact_ref: selectedRef ?? undefined,
      selected_terminal_artifact_kind: readString(writer?.selected_terminal_artifact_kind) ?? undefined,
      terminal_authority_ok: singleWriterApplied,
      ["terminal_error_code"]: terminalErrorCode,
      selected_terminal_sequence:
        selectedRef && finalDraft && selectedRef === idOf(finalDraft.artifact)
          ? finalDraft.sequence
          : undefined,
    },
    visible: {
      visible_text_hash: visibleText ? stableTextHash(visibleText) : undefined,
      visible_matches_selected_artifact: visibleMatchesSelected,
      visible_matches_final_answer_draft: visibleMatchesDraft,
      stale_failure_visible: staleFailureVisible,
      receipt_visible_as_answer: receiptVisibleAsAnswer,
      legacy_fallback_visible: legacyFallbackVisible,
      generic_terminal_failure_visible: genericFailureVisible,
      visible_selected_earlier_direct_answer: visibleSelectedEarlierDirectAnswer,
      missing_allowed_terminal_artifact_despite_valid_draft: missingAllowedTerminalArtifactDespiteValidDraft,
      typed_failure_despite_valid_draft: typedFailureDespiteValidDraft,
    },
    outcome,
    repair: input.repair ?? {
      repair_attempted: false,
      repair_action: "none",
    },
    assistant_answer: false,
    raw_content_included: false,
  };
}
