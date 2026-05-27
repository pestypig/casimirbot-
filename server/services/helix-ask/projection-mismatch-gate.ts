import type {
  HelixInternalTurnSuccess,
  HelixTerminalProjectionHealth,
} from "@shared/helix-internal-turn-success";
import type { HelixTerminalAuthoritySingleWriterResult } from "@shared/helix-terminal-authority";
import {
  applyHelixTerminalAuthoritySingleWriter,
} from "./terminal-authority-single-writer";
import { applyTerminalProjectionMissedInternalSuccessFailure } from "./terminal-answer-envelope";
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
    } catch {
      applyTerminalProjectionMissedInternalSuccessFailure(input.current_payload, {
        threadId: input.thread_id,
        turnId: input.turn_id,
      });
      success = classifyHelixInternalTurnSuccess({
        turn_id: input.turn_id,
        artifact_ledger: input.artifact_ledger,
        terminal_authority_single_writer_result: null,
        visible_text: readString(input.current_payload.selected_final_answer),
        payload_snapshot: input.current_payload,
        stage: "pre_response_send",
        repair: {
          repair_attempted: true,
          repair_action: "emit_projection_failure_typed_failure",
          repair_succeeded: false,
        },
      });
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
