import type {
  HelixInternalTurnSuccess,
  HelixTerminalProjectionHealth,
} from "@shared/helix-internal-turn-success";
import type { HelixTerminalAuthoritySingleWriterResult } from "@shared/helix-terminal-authority";
import {
  applyHelixTerminalAuthoritySingleWriter,
} from "./terminal-authority-single-writer";
import {
  applyTerminalProjectionMissedInternalSuccessFailure,
} from "./terminal-answer-envelope";
import {
  classifyHelixInternalTurnSuccess,
  type HelixClassifierArtifact,
} from "./internal-turn-success-classifier";

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const hashHelixTerminalText = (value: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const normalizeRepoEvidenceAnswerCandidate = (
  value: Record<string, unknown> | null,
): Record<string, unknown> | null => {
  if (!value) return null;
  const answerText = readString(value.answer_text) ?? readString(value.text);
  if (!answerText) return null;
  return {
    ...value,
    schema: readString(value.schema) ?? "helix.repo_code_evidence_answer.v1",
    artifact_id: readString(value.artifact_id) ?? readString(value.ref) ?? "repo_code_evidence_answer:recovered",
    answer_text: answerText,
    support_refs: [
      ...readArray(value.support_refs),
      ...readArray(value.source_observation_refs),
      ...readArray(value.artifact_refs),
      ...readArray(value.evidence_refs),
      ...readArray(value.grounded_in_observation_refs),
    ],
    assistant_answer: false,
    raw_content_included: false,
  };
};

const readRepoEvidenceAnswerCandidate = (
  payload: Record<string, unknown>,
  artifactLedger: HelixClassifierArtifact[],
): Record<string, unknown> | null => {
  const topLevel = normalizeRepoEvidenceAnswerCandidate(readRecord(payload.repo_code_evidence_answer));
  if (topLevel) return topLevel;
  return artifactLedger
    .filter((artifact) => readString(artifact.kind) === "repo_code_evidence_answer")
    .map((artifact) => normalizeRepoEvidenceAnswerCandidate(readRecord(artifact.payload) ?? readRecord(artifact)))
    .find((entry): entry is Record<string, unknown> => Boolean(entry)) ?? null;
};

const readRepoEvidenceObservationRefs = (artifactLedger: HelixClassifierArtifact[]): string[] =>
  artifactLedger
    .filter((artifact) => {
      const payload = readRecord(artifact.payload);
      return /repo_code_evidence_observation|repo_evidence_relevance_gate|repo_docs_synthesis_packet/i.test([
        readString(artifact.kind),
        readString(payload?.schema),
      ].join(" "));
    })
    .map((artifact) => readString(artifact.artifact_id) ?? readString(readRecord(artifact.payload)?.artifact_id))
    .filter((ref): ref is string => Boolean(ref));

const projectRepoEvidenceAnswerIfReady = (input: {
  payload: Record<string, unknown>;
  artifactLedger: HelixClassifierArtifact[];
  turnId: string;
  threadId?: string | null;
}): boolean => {
  const canonicalGoal = readRecord(input.payload.canonical_goal_frame);
  const answer = readRepoEvidenceAnswerCandidate(input.payload, input.artifactLedger);
  const answerText = readString(answer?.answer_text) ?? readString(answer?.text);
  const supportRefs = Array.from(new Set([
    ...readArray(answer?.support_refs).map(readString),
    ...readArray(answer?.source_observation_refs).map(readString),
    ...readArray(answer?.artifact_refs).map(readString),
    ...readArray(answer?.evidence_refs).map(readString),
    ...readArray(answer?.grounded_in_observation_refs).map(readString),
    ...readRepoEvidenceObservationRefs(input.artifactLedger),
  ].filter((ref): ref is string => Boolean(ref))));
  const relevanceGate = readRecord(input.payload.repo_evidence_relevance_gate);
  const failureReasons: string[] = [];
  const goalKind = readString(canonicalGoal?.goal_kind);
  const requiredTerminalKind = readString(canonicalGoal?.required_terminal_kind);
  if (
    !(
      goalKind === "repo_entity_definition" ||
      goalKind === "repo_code_evidence_question"
    )
  ) {
    failureReasons.push("canonical_goal_not_repo_evidence");
  }
  if (requiredTerminalKind !== "repo_code_evidence_answer") failureReasons.push("required_terminal_not_repo_code_evidence_answer");
  if (!answer) failureReasons.push("repo_answer_missing");
  if (!answerText) failureReasons.push("repo_answer_text_missing");
  if (supportRefs.length === 0) failureReasons.push("repo_answer_support_refs_missing");
  if (relevanceGate?.terminal_allowed === false) failureReasons.push("repo_relevance_gate_blocks_terminal");
  input.payload.projection_mismatch_repo_repair_probe = {
    schema: "helix.projection_mismatch_repo_repair_probe.v1",
    turn_id: input.turnId,
    goal_kind: goalKind,
    required_terminal_kind: requiredTerminalKind,
    answer_present: Boolean(answer),
    answer_text_present: Boolean(answerText),
    support_refs_count: supportRefs.length,
    relevance_terminal_allowed: relevanceGate?.terminal_allowed ?? null,
    artifact_ledger_kinds: input.artifactLedger.map((artifact) => readString(artifact.kind)).filter(Boolean),
    failure_reasons: failureReasons,
    assistant_answer: false,
    raw_content_included: false,
  };
  const debug = readRecord(input.payload.debug);
  if (debug) {
    debug.projection_mismatch_repo_repair_probe = input.payload.projection_mismatch_repo_repair_probe;
  }
  if (failureReasons.length > 0) {
    return false;
  }

  input.payload.repo_code_evidence_answer = {
    ...answer,
    support_refs: supportRefs,
    assistant_answer: false,
    raw_content_included: false,
  };
  input.payload.terminal_artifact_kind = "repo_code_evidence_answer";
  input.payload.final_answer_source = "repo_code_evidence_answer";
  input.payload.terminal_artifact_id = readString(answer.artifact_id) ?? `${input.turnId}:repo_code_evidence_answer`;
  input.payload.selected_final_answer = answerText;
  input.payload.answer = answerText;
  input.payload.text = answerText;
  input.payload.assistant_answer = answerText;
  input.payload.ok = true;
  input.payload.status = "final_answer";
  input.payload.final_status = "final_answer";
  input.payload.response_type = "final_answer";
  input.payload.terminal_presentation = {
    ...(readRecord(input.payload.terminal_presentation) ?? {}),
    schema: "helix.terminal_presentation.v1",
    turn_id: input.turnId,
    terminal_artifact_kind: "repo_code_evidence_answer",
    concise_text: answerText,
    assistant_answer: false,
    raw_content_included: false,
  };
  input.payload.terminal_answer_authority = {
    ...(readRecord(input.payload.terminal_answer_authority) ?? {}),
    schema: "helix.turn_terminal_authority.v1",
    turn_id: input.turnId,
    terminal_kind: "answer",
    final_answer_source: "repo_code_evidence_answer",
    terminal_artifact_kind: "repo_code_evidence_answer",
    terminal_artifact_id: readString(answer.artifact_id) ?? `${input.turnId}:repo_code_evidence_answer`,
    terminal_text_preview: answerText.slice(0, 240),
    terminal_text_hash: hashHelixTerminalText(answerText),
    server_authoritative: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  delete input.payload.terminal_error_code;
  delete input.payload.terminal_failure_text;
  delete input.payload.typed_failure;
  input.payload.projection_mismatch_repo_repair_result = {
    schema: "helix.projection_mismatch_repo_repair_result.v1",
    turn_id: input.turnId,
    terminal_artifact_kind: readString(input.payload.terminal_artifact_kind),
    final_answer_source: readString(input.payload.final_answer_source),
    terminal_error_code: readString(input.payload.terminal_error_code),
    repo_answer_text_quality_gate: input.payload.repo_answer_text_quality_gate,
    terminal_boundary_eligibility: input.payload.terminal_boundary_eligibility,
    assistant_answer: false,
    raw_content_included: false,
  };
  const resultDebug = readRecord(input.payload.debug);
  if (resultDebug) {
    resultDebug.projection_mismatch_repo_repair_result = input.payload.projection_mismatch_repo_repair_result;
  }
  return readString(input.payload.terminal_artifact_kind) === "repo_code_evidence_answer";
};

const buildRepoProjectionWriterMirror = (
  payload: Record<string, unknown>,
  turnId: string,
  priorWriter: HelixTerminalAuthoritySingleWriterResult | null,
): HelixTerminalAuthoritySingleWriterResult | null => {
  if (readString(payload.terminal_artifact_kind) !== "repo_code_evidence_answer") return null;
  const text = readString(payload.selected_final_answer) ?? readString(payload.answer) ?? readString(payload.text);
  if (!text) return null;
  const answer = readRecord(payload.repo_code_evidence_answer);
  const artifactRef =
    readString(payload.terminal_artifact_id) ??
    readString(answer?.artifact_id) ??
    `${turnId}:repo_code_evidence_answer`;
  const writer: HelixTerminalAuthoritySingleWriterResult = {
    schema: "helix.terminal_authority_single_writer_result.v1",
    artifactId: "terminal_authority_single_writer",
    schemaVersion: "helix.terminal_authority_single_writer.v1",
    turn_id: turnId,
    selectedArtifactKind: "repo_code_evidence_answer",
    selectedArtifactRef: artifactRef,
    selected_terminal_artifact_ref: artifactRef,
    selected_terminal_artifact_kind: "repo_code_evidence_answer",
    visible_text: text,
    assistant_answer: false,
    source: "repo_code_evidence_answer",
    rejected_candidates: priorWriter?.rejected_candidates ?? [],
    writes: {
      payload_text: text,
      payload_answer: text,
      payload_assistant_answer: text,
      payload_selected_final_answer: text,
      terminal_presentation_concise_text: text,
      debug_selected_final_answer: text,
    },
    wroteVisibleFields: [
      "payload.text",
      "payload.answer",
      "payload.assistant_answer",
      "payload.selected_final_answer",
      "terminal_presentation.concise_text",
      "debug.selected_final_answer",
    ],
    forbiddenPreAuthorityVisibleFields: priorWriter?.forbiddenPreAuthorityVisibleFields ?? [],
    audit: {
      artifactId: "terminal_authority_single_writer",
      schemaVersion: "helix.terminal_authority_single_writer.v1",
      selectedArtifactKind: "repo_code_evidence_answer",
      selectedArtifactRef: artifactRef,
      rejectedCandidates: priorWriter?.audit?.rejectedCandidates ?? [],
      wroteVisibleFields: [
        "payload.text",
        "payload.answer",
        "payload.assistant_answer",
        "payload.selected_final_answer",
        "terminal_presentation.concise_text",
        "debug.selected_final_answer",
      ],
      forbiddenPreAuthorityVisibleFields: priorWriter?.forbiddenPreAuthorityVisibleFields ?? [],
    },
    integrity: {
      ...(priorWriter?.integrity ?? {}),
      single_writer_applied: true,
      visible_matches_selected_artifact: true,
      visible_matches_draft: Boolean(readString(readRecord(payload.final_answer_draft)?.text) === text),
      stale_failure_visible: false,
      receipt_visible_as_answer: false,
      post_tool_model_step_satisfied: true,
      legacy_terminal_candidate_count: priorWriter?.integrity?.legacy_terminal_candidate_count ?? 0,
      forbidden_terminal_candidate_count: priorWriter?.integrity?.forbidden_terminal_candidate_count ?? 0,
      payload_mirror_written_after_terminal_selection: true,
      materialized_terminal_artifact_kind: "repo_code_evidence_answer",
      materialized_terminal_artifact_ref: artifactRef,
      materialization_blocked_reason: null,
      terminal_projection_kind_match: true,
      terminal_projection_guard_applied: true,
      terminal_projection_guard_action: "project_authority_artifact",
      terminal_projection_failure_code: null,
    },
  };
  payload.terminal_authority_single_writer = writer as unknown as Record<string, unknown>;
  const debug = readRecord(payload.debug);
  if (debug) {
    debug.terminal_authority_single_writer = writer as unknown as Record<string, unknown>;
  }
  return writer;
};

const reclassifyAfterRepoProjectionRepair = (input: {
  turnId: string;
  artifactLedger: HelixClassifierArtifact[];
  payload: Record<string, unknown>;
  writer: HelixTerminalAuthoritySingleWriterResult | null;
  repairAttempted: boolean;
  repairSucceeded: boolean;
}): HelixInternalTurnSuccess =>
  classifyHelixInternalTurnSuccess({
    turn_id: input.turnId,
    artifact_ledger: input.artifactLedger,
    terminal_authority_single_writer_result: input.repairSucceeded
      ? buildRepoProjectionWriterMirror(input.payload, input.turnId, input.writer)
      : input.writer,
    visible_text: readString(input.payload.selected_final_answer),
    payload_snapshot: input.payload,
    stage: "pre_response_send",
    repair: {
      repair_attempted: input.repairAttempted,
      repair_action: input.repairSucceeded
        ? "project_repo_code_evidence_answer"
        : "emit_projection_failure_typed_failure",
      repair_succeeded: input.repairSucceeded,
    },
  });

const projectionHealthFrom = (
  success: HelixInternalTurnSuccess,
  gateApplied: boolean,
  repaired: boolean,
): HelixTerminalProjectionHealth => ({
  outcome: success.outcome,
  internal_success:
    success.internal.tool_path_succeeded ||
    success.internal.repo_evidence_path_succeeded ||
    success.internal.live_job_path_succeeded ||
    success.internal.final_answer_draft_exists,
  visible_success: success.outcome === "internal_success_and_visible_success",
  single_writer_applied: success.terminal.single_writer_applied,
  visible_matches_selected_artifact: success.visible.visible_matches_selected_artifact,
  visible_matches_draft: success.visible.visible_matches_final_answer_draft,
  stale_failure_visible: success.visible.stale_failure_visible,
  projection_mismatch_gate_applied: gateApplied,
  projection_mismatch_repaired: repaired,
  visible_selected_earlier_direct_answer: success.visible.visible_selected_earlier_direct_answer,
  missing_allowed_terminal_artifact_despite_valid_draft: success.visible.missing_allowed_terminal_artifact_despite_valid_draft,
  typed_failure_despite_valid_draft: success.visible.typed_failure_despite_valid_draft,
});

export function applyHelixProjectionMismatchGate(input: {
  turn_id: string;
  artifact_ledger: HelixClassifierArtifact[];
  current_payload: Record<string, unknown>;
  current_visible_text?: string | null;
  terminal_writer_result?: HelixTerminalAuthoritySingleWriterResult | null;
  thread_id?: string | null;
}): {
  internal_turn_success: HelixInternalTurnSuccess;
  terminal_projection_health: HelixTerminalProjectionHealth;
  terminal_writer_result?: HelixTerminalAuthoritySingleWriterResult;
  must_fail_response: boolean;
  failure_code?: "terminal_projection_missed_internal_success";
} {
  let writer =
    input.terminal_writer_result ??
    (readRecord(input.current_payload.terminal_authority_single_writer) as HelixTerminalAuthoritySingleWriterResult | null);
  let success = classifyHelixInternalTurnSuccess({
    turn_id: input.turn_id,
    artifact_ledger: input.artifact_ledger,
    terminal_authority_single_writer_result: writer,
    visible_text: input.current_visible_text,
    payload_snapshot: input.current_payload,
    stage: "pre_response_send",
  });

  let repaired = false;
  if (success.outcome === "internal_success_visible_failure") {
    try {
      writer = applyHelixTerminalAuthoritySingleWriter({
        payload: input.current_payload,
        turnId: input.turn_id,
        threadId: input.thread_id,
        artifactLedger: input.artifact_ledger,
      });
      success = classifyHelixInternalTurnSuccess({
        turn_id: input.turn_id,
        artifact_ledger: input.artifact_ledger,
        terminal_authority_single_writer_result: writer,
        visible_text: readString(input.current_payload.selected_final_answer),
        payload_snapshot: input.current_payload,
        stage: "pre_response_send",
        repair: {
          repair_attempted: true,
          repair_action: "invoke_terminal_authority_single_writer",
          repair_succeeded: true,
        },
      });
      repaired = success.outcome === "internal_success_and_visible_success";
      if (!repaired && success.outcome === "internal_success_visible_failure") {
        const repoProjectionRepaired = projectRepoEvidenceAnswerIfReady({
          payload: input.current_payload,
          artifactLedger: input.artifact_ledger,
          turnId: input.turn_id,
          threadId: input.thread_id,
        });
        success = reclassifyAfterRepoProjectionRepair({
          turnId: input.turn_id,
          artifactLedger: input.artifact_ledger,
          payload: input.current_payload,
          writer,
          repairAttempted: true,
          repairSucceeded: repoProjectionRepaired,
        });
        repaired = repoProjectionRepaired && success.outcome === "internal_success_and_visible_success";
      }
    } catch {
      const repoProjectionRepaired = projectRepoEvidenceAnswerIfReady({
        payload: input.current_payload,
        artifactLedger: input.artifact_ledger,
        turnId: input.turn_id,
        threadId: input.thread_id,
      });
      success = reclassifyAfterRepoProjectionRepair({
        turnId: input.turn_id,
        artifactLedger: input.artifact_ledger,
        payload: input.current_payload,
        writer: null,
        repairAttempted: true,
        repairSucceeded: repoProjectionRepaired,
      });
      if (repoProjectionRepaired) {
        repaired = success.outcome === "internal_success_and_visible_success";
      } else {
        applyTerminalProjectionMissedInternalSuccessFailure(input.current_payload, {
          threadId: input.thread_id,
          turnId: input.turn_id,
        });
      }
    }
  }

  input.current_payload.internal_turn_success = success;
  input.current_payload.terminal_projection_health = projectionHealthFrom(success, true, repaired);
  const debug = readRecord(input.current_payload.debug);
  if (debug) {
    debug.internal_turn_success = success;
    debug.terminal_projection_health = input.current_payload.terminal_projection_health;
  }

  return {
    internal_turn_success: success,
    terminal_projection_health: input.current_payload.terminal_projection_health as HelixTerminalProjectionHealth,
    terminal_writer_result: writer ?? undefined,
    must_fail_response: success.outcome === "internal_success_visible_failure",
    failure_code: success.outcome === "internal_success_visible_failure"
      ? "terminal_projection_missed_internal_success"
      : undefined,
  };
}
