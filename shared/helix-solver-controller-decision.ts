export const HELIX_SOLVER_CONTROLLER_DECISION_SCHEMA = "helix.solver_controller_decision.v1" as const;

export type HelixSolverControllerBlockingReason =
  | "poison_audit_failed"
  | "route_authority_failed"
  | "terminal_route_mismatch"
  | "route_product_contract_rejected_terminal"
  | "solver_path_incomplete"
  | "retrieval_not_answerable"
  | "capability_lifecycle_incomplete"
  | "turn_id_integrity_failed"
  | "visual_evidence_missing"
  | "workspace_context_missing"
  | "prompt_object_extraction_invalid";

export type HelixSolverControllerDecision = {
  schema: typeof HELIX_SOLVER_CONTROLLER_DECISION_SCHEMA;
  turn_id: string;
  final_route: string | null;
  canonical_goal_kind: string | null;
  required_terminal_kind: string | null;
  selected_terminal_artifact_kind: string | null;
  decision: "allow_terminal" | "retry" | "request_user_input" | "fail_closed";
  blocking_reasons: HelixSolverControllerBlockingReason[];
  consumed_artifact_refs: string[];
  retry_policy_ref?: string;
  typed_failure_code?: string;
  assistant_answer: false;
  raw_content_included: false;
};
