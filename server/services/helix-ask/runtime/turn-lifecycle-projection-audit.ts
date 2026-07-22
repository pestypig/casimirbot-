import type {
  HelixTurnLifecycle,
  HelixTurnLifecycleProjectionAudit,
  HelixTurnLifecycleProjectionMismatch,
} from "@shared/helix-turn-lifecycle";

export type HelixLegacyLifecycleProjection = {
  evidence_reentry_completed?: boolean | null;
  followup_reasoning_completed?: boolean | null;
  provider_solver_completion_observed?: boolean | null;
  terminal_error_code?: string | null;
  terminal_rejection_reason?: string | null;
  terminal_eligible?: boolean | null;
  provider_terminal_candidate_text?: string | null;
};

export const auditHelixTurnLifecycleProjection = (input: {
  lifecycle: HelixTurnLifecycle;
  projection: HelixLegacyLifecycleProjection;
}): HelixTurnLifecycleProjectionAudit => {
  const reduction = input.lifecycle.reduction;
  const projection = input.projection;
  const mismatches: HelixTurnLifecycleProjectionMismatch[] = [];
  const latestReentryEventId = reduction.latest_reentry_event_id;
  const finalMessageEventId = reduction.final_agent_message_event_id;

  if (
    reduction.observation_reentry_refs.length > 0 &&
    projection.evidence_reentry_completed === false
  ) {
    mismatches.push({
      code: "legacy_evidence_reentry_disagrees_with_runtime",
      lifecycle_event_id: latestReentryEventId,
      projection_path: "ask_turn_solver_trace.evidence_reentry.completed",
      lifecycle_value: true,
      projection_value: false,
    });
  }
  if (
    reduction.post_observation_reasoning_completed &&
    projection.followup_reasoning_completed === false
  ) {
    mismatches.push({
      code: "legacy_followup_reasoning_disagrees_with_runtime",
      lifecycle_event_id: finalMessageEventId,
      projection_path: "ask_turn_solver_trace.followup_reasoning.completed",
      lifecycle_value: true,
      projection_value: false,
    });
  }
  if (
    reduction.runtime_turn_completed &&
    projection.provider_solver_completion_observed === false
  ) {
    mismatches.push({
      code: "legacy_provider_completion_disagrees_with_runtime",
      lifecycle_event_id: finalMessageEventId,
      projection_path: "terminal_writer.integrity.provider_solver_completion_observed",
      lifecycle_value: true,
      projection_value: false,
    });
  }
  if (
    input.lifecycle.scope === "helix_ask_turn" &&
    reduction.complete &&
    projection.terminal_error_code === "solver_continuation_pending"
  ) {
    mismatches.push({
      code: "continuation_pending_after_runtime_completion",
      lifecycle_event_id: finalMessageEventId,
      projection_path: "terminal_error_code",
      lifecycle_value: "turn.completed",
      projection_value: projection.terminal_error_code,
    });
  }
  if (
    input.lifecycle.scope === "helix_ask_turn" &&
    reduction.complete &&
    projection.terminal_eligible === true &&
    projection.terminal_rejection_reason
  ) {
    mismatches.push({
      code: "terminal_rejection_after_eligible_runtime_completion",
      lifecycle_event_id: finalMessageEventId,
      projection_path: "terminal_rejection_reason",
      lifecycle_value: true,
      projection_value: projection.terminal_rejection_reason,
    });
  }
  if (
    projection.provider_terminal_candidate_text &&
    /\bHELIX_CAPABILITY_LANE_REQUEST_JSON\s*:/i.test(
      projection.provider_terminal_candidate_text,
    )
  ) {
    mismatches.push({
      code: "pending_lane_request_projected_as_terminal_candidate",
      lifecycle_event_id: finalMessageEventId,
      projection_path: "provider_terminal_candidate.candidate_text_preview",
      lifecycle_value: "capability_lane_request",
      projection_value: "agent_provider_terminal_candidate",
    });
  }

  return {
    schema: "helix.turn_lifecycle_projection_audit.v1",
    ok: mismatches.length === 0,
    mismatches,
    assistant_answer: false,
    raw_content_included: false,
  };
};
