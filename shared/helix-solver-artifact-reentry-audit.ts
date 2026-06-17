export const HELIX_SOLVER_ARTIFACT_REENTRY_AUDIT_SCHEMA =
  "helix.solver_artifact_reentry_audit.v1" as const;

export type HelixSolverArtifactReentryFailureCode =
  | "artifact_not_reentered"
  | "receipt_selected_without_goal_authority"
  | "projection_selected_without_evidence"
  | "capability_result_not_reentered"
  | "retrieval_plan_without_result"
  | "retrieval_result_not_arbitrated"
  | "terminal_answer_before_solver_completion";

export type HelixSolverArtifactAuditEntry = {
  ref: string;
  kind: string;
  produced: boolean;
  classified_as:
    | "receipt"
    | "projection"
    | "capability_result"
    | "retrieval_plan"
    | "retrieval_result"
    | "evidence"
    | "terminal"
    | "other";
  selected_for_answer: boolean;
  selected_as_support?: boolean;
  rejected_for_answer: boolean;
  reentered_solver: boolean;
  allowed_by_canonical_goal: boolean;
  allowed_by_route_product_contract: boolean;
  allowed_by_terminal_authority: boolean;
  failure_codes: HelixSolverArtifactReentryFailureCode[];
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixSolverArtifactReentryAudit = {
  schema: typeof HELIX_SOLVER_ARTIFACT_REENTRY_AUDIT_SCHEMA;
  audit_id: string;
  turn_id: string;
  terminal_artifact_kind: string;
  terminal_artifact_id: string | null;
  final_answer_source: string;
  ok: boolean;
  failure_codes: HelixSolverArtifactReentryFailureCode[];
  terminal_relevant_artifacts: HelixSolverArtifactAuditEntry[];
  assistant_answer: false;
  raw_content_included: false;
};
