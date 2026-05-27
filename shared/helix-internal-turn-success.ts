export const HELIX_INTERNAL_TURN_SUCCESS_SCHEMA =
  "helix.internal_turn_success.v1" as const;

export type HelixInternalTurnSuccessOutcome =
  | "internal_success_and_visible_success"
  | "internal_success_visible_failure"
  | "internal_failure_visible_failure"
  | "visible_success_without_internal_authority"
  | "pending_or_incomplete_turn";

export type HelixInternalTurnSuccessStage =
  | "post_runtime_loop"
  | "pre_terminal_writer"
  | "post_terminal_writer"
  | "pre_debug_export"
  | "pre_response_send";

export type HelixInternalTurnSuccess = {
  schema: typeof HELIX_INTERNAL_TURN_SUCCESS_SCHEMA;
  turn_id: string;
  computed_at_stage: HelixInternalTurnSuccessStage;
  internal: {
    tool_path_succeeded: boolean;
    repo_evidence_path_succeeded: boolean;
    live_job_path_succeeded: boolean;
    latest_successful_observation_packet_ref?: string;
    latest_successful_observation_sequence?: number;
    post_tool_model_step_required: boolean;
    post_tool_model_step_satisfied: boolean;
    final_answer_draft_exists: boolean;
    final_answer_draft_ref?: string;
    final_answer_draft_sequence?: number;
    goal_satisfaction: "satisfied" | "partially_satisfied" | "unsatisfied" | "unknown";
    pending_tool_call_ids: string[];
  };
  terminal: {
    single_writer_applied: boolean;
    selected_terminal_artifact_ref?: string;
    selected_terminal_artifact_kind?: string;
    terminal_authority_ok: boolean;
    terminal_error_code?: string;
    selected_terminal_sequence?: number;
  };
  visible: {
    visible_text_hash?: string;
    visible_matches_selected_artifact: boolean;
    visible_matches_final_answer_draft: boolean;
    stale_failure_visible: boolean;
    receipt_visible_as_answer: boolean;
    legacy_fallback_visible: boolean;
    generic_terminal_failure_visible: boolean;
  };
  outcome: HelixInternalTurnSuccessOutcome;
  repair: {
    repair_attempted: boolean;
    repair_action?:
      | "invoke_terminal_authority_single_writer"
      | "replace_visible_text_with_selected_artifact"
      | "emit_projection_failure_typed_failure"
      | "none";
    repair_succeeded?: boolean;
  };
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixTerminalProjectionHealth = {
  outcome: HelixInternalTurnSuccessOutcome;
  internal_success: boolean;
  visible_success: boolean;
  single_writer_applied: boolean;
  visible_matches_selected_artifact: boolean;
  visible_matches_draft: boolean;
  stale_failure_visible: boolean;
  projection_mismatch_gate_applied: boolean;
  projection_mismatch_repaired: boolean;
};
