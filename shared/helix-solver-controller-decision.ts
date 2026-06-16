export const HELIX_SOLVER_CONTROLLER_DECISION_SCHEMA = "helix.solver_controller_decision.v1" as const;

export type HelixSolverControllerBlockingReason =
  | "poison_audit_failed"
  | "route_authority_failed"
  | "terminal_route_mismatch"
  | "route_product_contract_rejected_terminal"
  | "solver_path_incomplete"
  | "retrieval_not_answerable"
  | "capability_lifecycle_incomplete"
  | "capability_admitted_not_dispatched"
  | "turn_id_integrity_failed"
  | "visual_evidence_missing"
  | "workspace_context_missing"
  | "prompt_object_extraction_invalid"
  | "goal_satisfaction_missing"
  | "goal_not_satisfied"
  | "required_artifact_contract_missing"
  | "terminal_kind_not_required"
  | "terminal_equivalence_missing"
  | "terminal_equivalence_failed"
  | "agent_runtime_loop_missing"
  | "agent_step_decision_missing"
  | "selected_capability_observation_missing"
  | "post_observation_model_decision_missing"
  | "stale_model_only_after_observation"
  | "composer_claimed_no_observations_but_receipts_exist"
  | "missing_required_live_source_mail_decision"
  | "missing_required_voice_receipt_or_hold"
  | "receipt_not_terminal_eligible"
  | "terminal_forbidden_by_phase_lock"
  | "direct_answer_text_missing"
  | "subgoals_observed_not_satisfied"
  | "prompt_requirement_coverage_incomplete"
  | "doc_retrieval_coverage_incomplete"
  | "compound_prompt_coverage_incomplete"
  | "committed_route_missing"
  | "committed_route_incompatible_goal"
  | "committed_route_tool_family_suppressed"
  | "committed_route_terminal_product_mismatch"
  | "stale_route_metadata_override_rejected"
  | "shortcut_bypassed_committed_route_firewall";

export type HelixSolverControllerDecision = {
  schema: typeof HELIX_SOLVER_CONTROLLER_DECISION_SCHEMA;
  turn_id: string;
  final_route: string | null;
  canonical_goal_kind: string | null;
  required_terminal_kind: string | null;
  selected_terminal_artifact_kind: string | null;
  decision: "allow_terminal" | "continue" | "retry" | "request_user_input" | "typed_failure" | "fail_closed";
  blocking_reasons: HelixSolverControllerBlockingReason[];
  consumed_artifact_refs: string[];
  superseded_blocking_reasons?: HelixSolverControllerBlockingReason[];
  compound_prompt_coverage_gate_superseded_by_answer_artifact?: boolean;
  compound_prompt_coverage_superseded_ref?: string | null;
  retry_policy_ref?: string;
  typed_failure_code?: string;
  assistant_answer: false;
  raw_content_included: false;
};
