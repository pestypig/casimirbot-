import type {
  HelixTerminalAuthoritySingleWriterResult,
  HelixTerminalCandidate,
} from "@shared/helix-terminal-authority";
import {
  applyTerminalAnswerEnvelope,
  resolveTerminalAnswerEnvelope,
} from "./terminal-answer-envelope";

type ArtifactLike = {
  artifact_id?: unknown;
  kind?: unknown;
  payload?: unknown;
};

type SingleWriterInput = {
  turnId: string;
  threadId?: string | null;
  payload: Record<string, unknown>;
  artifactLedger?: ArtifactLike[] | null;
  legacyCandidates?: HelixTerminalCandidate[];
};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const textHash = (value: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const isStaleWorkspaceFailureText = (value: unknown): boolean =>
  /(?:workspace_step_failed|Failed to execute)/i.test(readString(value) ?? "");

const artifactPayload = (artifact: ArtifactLike): Record<string, unknown> | null =>
  readRecord(artifact.payload);

const artifactSchema = (artifact: ArtifactLike): string | null =>
  readString(artifactPayload(artifact)?.schema);

const artifactKind = (artifact: ArtifactLike): string =>
  readString(artifact.kind) ?? readString(artifactPayload(artifact)?.kind) ?? "unknown";

const artifactId = (artifact: ArtifactLike): string | null =>
  readString(artifact.artifact_id) ?? readString(artifactPayload(artifact)?.artifact_id);

const artifactText = (artifact: ArtifactLike): string | null => {
  const payload = artifactPayload(artifact);
  return (
    readString(payload?.answer_text) ??
    readString(payload?.text) ??
    readString(payload?.visible_text) ??
    readString(artifactPayload(artifact)?.message)
  );
};

const isPostToolObservation = (artifact: ArtifactLike): boolean => {
  const payload = artifactPayload(artifact);
  if (!(
    artifactKind(artifact) === "agent_step_observation_packet" ||
    artifactSchema(artifact) === "helix.agent_step_observation_packet.v1"
  )) {
    return false;
  }
  return (
    payload?.post_tool_model_step_required === true ||
    payload?.terminal_eligible === false ||
    readString(payload?.status) === "succeeded"
  );
};

const isFinalAnswerDraft = (artifact: ArtifactLike): boolean =>
  artifactKind(artifact) === "final_answer_draft" ||
  artifactSchema(artifact) === "helix.final_answer_draft.v1";

const isForbiddenReceiptOrProjection = (artifact: ArtifactLike): boolean => {
  const kind = artifactKind(artifact);
  return (
    kind === "workspace_action_receipt" ||
    kind === "agent_step_observation_packet" ||
    kind === "client_projection" ||
    kind === "live_pipeline_receipt" ||
    kind === "voice_delivery_proposal" ||
    kind === "legacy_terminal_candidate"
  );
};

const findSelectedDraftAfterRequiredObservation = (
  artifacts: ArtifactLike[],
): { artifact: ArtifactLike; sequence: number; latestObservationSequence: number } | null => {
  const latestObservationSequence = artifacts.reduce((latest, artifact, index) =>
    isPostToolObservation(artifact) ? index : latest, -1);
  if (latestObservationSequence < 0) return null;

  for (let index = artifacts.length - 1; index > latestObservationSequence; index -= 1) {
    const artifact = artifacts[index];
    if (!artifact || !isFinalAnswerDraft(artifact)) continue;
    const text = artifactText(artifact);
    if (!text || isStaleWorkspaceFailureText(text)) continue;
    return { artifact, sequence: index, latestObservationSequence };
  }
  return null;
};

export function recordLegacyTerminalCandidate(input: {
  turn_id: string;
  source:
    | "legacy_workspace_failure"
    | "legacy_panel_open_receipt"
    | "legacy_note_receipt"
    | "legacy_doc_receipt"
    | "legacy_calculator_receipt"
    | "legacy_situation_room_receipt"
    | "legacy_voice_receipt"
    | "legacy_fallback";
  text: string;
  reason: string;
}): HelixTerminalCandidate {
  return {
    schema: "helix.terminal_candidate.v1",
    candidate_id: `${input.turn_id}:legacy_terminal_candidate:${textHash([
      input.source,
      input.reason,
      input.text,
    ].join("|"))}`,
    turn_id: input.turn_id,
    artifact_kind: input.source,
    text: input.text,
    terminal_eligible: false,
    assistant_answer: false,
    source: input.source === "legacy_workspace_failure" ? "legacy_workspace_failure" : "legacy_fallback",
    created_at_stage: "legacy_branch",
    failure_code: input.reason,
    freshness: {},
  };
}

export function applyHelixTerminalAuthoritySingleWriter(
  input: SingleWriterInput,
): HelixTerminalAuthoritySingleWriterResult {
  const artifacts = input.artifactLedger ?? (
    Array.isArray(input.payload.current_turn_artifact_ledger)
      ? (input.payload.current_turn_artifact_ledger as ArtifactLike[])
      : []
  );
  const priorPayloadFields = {
    text: readString(input.payload.text),
    answer: readString(input.payload.answer),
    assistant_answer: readString(input.payload.assistant_answer),
    selected_final_answer: readString(input.payload.selected_final_answer),
  };

  const rejectedCandidates: HelixTerminalAuthoritySingleWriterResult["rejected_candidates"] = [];
  const selectedDraft = findSelectedDraftAfterRequiredObservation(artifacts);
  const latestRequiredObservationSequence = selectedDraft?.latestObservationSequence ??
    artifacts.reduce((latest, artifact, index) => isPostToolObservation(artifact) ? index : latest, -1);

  for (const artifact of artifacts) {
    if (!isForbiddenReceiptOrProjection(artifact)) continue;
    rejectedCandidates.push({
      ref: artifactId(artifact) ?? undefined,
      kind: artifactKind(artifact),
      reason: "receipt_or_projection",
    });
  }

  const legacyCandidates = [...(input.legacyCandidates ?? [])];
  for (const [field, value] of Object.entries(priorPayloadFields)) {
    if (isStaleWorkspaceFailureText(value)) {
      legacyCandidates.push(recordLegacyTerminalCandidate({
        turn_id: input.turnId,
        source: "legacy_workspace_failure",
        text: value ?? "",
        reason: `stale_${field}`,
      }));
    }
  }
  for (const candidate of legacyCandidates) {
    rejectedCandidates.push({
      ref: candidate.artifact_ref,
      kind: candidate.artifact_kind,
      source: candidate.source,
      reason: candidate.source === "legacy_workspace_failure"
        ? "stale_failure_candidate"
        : "legacy_direct_writer_quarantined",
    });
  }

  let selectedArtifactRef: string | null = null;
  let selectedArtifactKind: HelixTerminalAuthoritySingleWriterResult["selected_terminal_artifact_kind"] = null;
  let selectedSource: HelixTerminalAuthoritySingleWriterResult["source"] = "terminal_authority_repair_failure";

  if (selectedDraft) {
    const text = artifactText(selectedDraft.artifact) ?? "I could not produce a terminal answer for this turn.";
    selectedArtifactRef = artifactId(selectedDraft.artifact);
    selectedArtifactKind = "model_synthesized_answer";
    selectedSource = "final_answer_draft";
    input.payload.terminal_artifact_kind = "model_synthesized_answer";
    input.payload.final_answer_source = "final_answer_draft";
    input.payload.selected_final_answer = text;
    input.payload.answer = text;
    input.payload.text = text;
    input.payload.assistant_answer = text;
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: "model_synthesized_answer",
      concise_text: text,
      assistant_answer: false,
      raw_content_included: false,
    };
  } else if (latestRequiredObservationSequence >= 0) {
    input.payload.terminal_artifact_kind = "typed_failure";
    input.payload.final_answer_source = "typed_failure";
    input.payload.terminal_error_code = "post_tool_model_step_missing";
    input.payload.typed_failure = {
      ...(readRecord(input.payload.typed_failure) ?? {}),
      schema: "helix.typed_failure.v1",
      error_code: "post_tool_model_step_missing",
      message: "I could not complete this turn because a tool observation required a follow-up model answer step, but no later terminal answer artifact was available.",
      text: "I could not complete this turn because a tool observation required a follow-up model answer step, but no later terminal answer artifact was available.",
      answer_text: "I could not complete this turn because a tool observation required a follow-up model answer step, but no later terminal answer artifact was available.",
      assistant_answer: false,
      raw_content_included: false,
    };
    selectedArtifactKind = "typed_failure";
    selectedSource = "typed_failure";
    rejectedCandidates.push({
      kind: "normal_answer",
      reason: "missing_post_tool_model_step",
    });
  }

  const envelope = resolveTerminalAnswerEnvelope(input.payload, {
    threadId: input.threadId,
    turnId: input.turnId,
  });
  const appliedEnvelope = applyTerminalAnswerEnvelope(input.payload, envelope);
  const visibleText = appliedEnvelope.terminal_text;
  const draftText = selectedDraft ? artifactText(selectedDraft.artifact) : null;
  const receiptVisibleAsAnswer = artifacts.some((artifact) => {
    if (!isForbiddenReceiptOrProjection(artifact)) return false;
    const text = artifactText(artifact);
    return Boolean(text && text === visibleText);
  });
  const result: HelixTerminalAuthoritySingleWriterResult = {
    schema: "helix.terminal_authority_single_writer_result.v1",
    turn_id: input.turnId,
    selected_terminal_artifact_ref: selectedArtifactRef,
    selected_terminal_artifact_kind: selectedArtifactKind ?? (
      appliedEnvelope.terminal_artifact_kind === "typed_failure"
        ? "typed_failure"
        : appliedEnvelope.terminal_artifact_kind === "request_user_input"
          ? "request_user_input"
          : appliedEnvelope.terminal_artifact_kind === "direct_answer_text"
            ? "direct_answer_text"
            : null
    ),
    visible_text: visibleText,
    assistant_answer: false,
    source: selectedSource === "terminal_authority_repair_failure"
      ? appliedEnvelope.final_answer_source === "typed_failure"
        ? "typed_failure"
        : appliedEnvelope.terminal_artifact_kind === "direct_answer_text"
          ? "direct_answer_text"
          : selectedSource
      : selectedSource,
    rejected_candidates: rejectedCandidates,
    writes: {
      payload_text: visibleText,
      payload_answer: visibleText,
      payload_assistant_answer: visibleText,
      payload_selected_final_answer: visibleText,
      terminal_presentation_concise_text: visibleText,
      debug_selected_final_answer: visibleText,
    },
    integrity: {
      single_writer_applied: true,
      visible_matches_selected_artifact: !draftText || visibleText === draftText,
      visible_matches_draft: !draftText || visibleText === draftText,
      stale_failure_visible: isStaleWorkspaceFailureText(visibleText),
      receipt_visible_as_answer: receiptVisibleAsAnswer,
      post_tool_model_step_satisfied: latestRequiredObservationSequence < 0 || Boolean(selectedDraft),
      legacy_terminal_candidate_count: legacyCandidates.length,
      forbidden_terminal_candidate_count: rejectedCandidates.filter((entry) =>
        entry.reason === "receipt_or_projection" || entry.reason === "route_contract_forbidden"
      ).length,
      payload_mirror_written_after_terminal_selection: true,
    },
  };

  input.payload.terminal_authority_single_writer = result;
  input.payload.legacy_terminal_candidates = legacyCandidates;
  const debug = readRecord(input.payload.debug);
  if (debug) {
    debug.terminal_authority_single_writer = result;
    debug.legacy_terminal_candidates = legacyCandidates;
  }

  return result;
}
