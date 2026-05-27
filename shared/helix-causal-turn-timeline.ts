export const HELIX_CAUSAL_TURN_TIMELINE_SCHEMA = "helix.causal_turn_timeline.v1" as const;

export type HelixCausalTurnProducer =
  | "user"
  | "prompt_interpreter"
  | "route_classifier"
  | "tool_surface_builder"
  | "model"
  | "deterministic_fallback"
  | "tool_router"
  | "runtime_tool"
  | "repo_retrieval"
  | "coverage_gate"
  | "quality_gate"
  | "goal_satisfaction"
  | "solver_controller"
  | "terminal_authority"
  | "projection_gate"
  | "client_resolver"
  | "debug_export";

export type HelixCausalTurnStage =
  | "prompt_received"
  | "goal_classified"
  | "source_target_decided"
  | "route_label_set"
  | "tool_surface_built"
  | "model_step_requested"
  | "model_step_decided"
  | "deterministic_fallback_considered"
  | "deterministic_fallback_used"
  | "runtime_tool_call_validated"
  | "runtime_tool_dispatched"
  | "tool_observation_created"
  | "repo_evidence_observation_created"
  | "repo_docs_synthesis_packet_created"
  | "repo_docs_synthesis_repair_observation_created"
  | "model_answer_artifact_created"
  | "coverage_gate_evaluated"
  | "quality_gate_evaluated"
  | "goal_satisfaction_evaluated"
  | "solver_controller_decided"
  | "terminal_artifact_materialized"
  | "terminal_artifact_selected"
  | "terminal_candidate_rejected"
  | "projection_mismatch_checked"
  | "visible_response_written"
  | "debug_export_written";

export type HelixCausalTurnEvent = {
  schema: "helix.causal_turn_event.v1";
  turn_id: string;
  event_id: string;
  sequence: number;
  stage: HelixCausalTurnStage;
  producer: HelixCausalTurnProducer;
  timestamp_ms?: number;
  input_refs: string[];
  output_refs: string[];
  decision?: string;
  status?: "started" | "succeeded" | "blocked" | "failed" | "superseded";
  reason_code?: string;
  route_label?: string;
  canonical_goal_kind?: string;
  source_target?: string;
  selected_capability?: string;
  runtime_tool_call_id?: string;
  model_step_capability?: string;
  fallback?: {
    used: boolean;
    rule_id?: string;
    source_file?: string;
    matched_text_hash?: string;
    output_ref?: string;
  };
  terminal?: {
    selected_terminal_artifact_kind?: string;
    selected_terminal_artifact_ref?: string;
    visible_text_hash?: string;
  };
  rejected?: Array<{
    artifact_ref?: string;
    artifact_kind: string;
    reason:
      | "stale_route_label"
      | "stale_direct_answer"
      | "later_valid_final_answer_draft"
      | "coverage_valid_model_only_answer_exists"
      | "receipt_or_projection"
      | "typed_failure_superseded"
      | "route_contract_forbidden"
      | "unsupported_claim"
      | "missing_support_refs";
  }>;
  supersedes_event_ids?: string[];
  superseded_by_event_id?: string;
  public_summary?: string;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixCausalTurnTimeline = {
  schema: typeof HELIX_CAUSAL_TURN_TIMELINE_SCHEMA;
  turn_id: string;
  events: HelixCausalTurnEvent[];
  integrity: {
    ok: boolean;
    missing_created_by_event_refs: string[];
    terminal_without_selected_event: boolean;
    visible_without_terminal_event: boolean;
    stale_route_label_detected: boolean;
    deterministic_fallback_without_rule_id: boolean;
  };
  assistant_answer: false;
  raw_content_included: false;
};
