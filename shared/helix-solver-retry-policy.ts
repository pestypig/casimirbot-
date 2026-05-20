export const HELIX_SOLVER_RETRY_POLICY_SCHEMA = "helix.solver_retry_policy.v1" as const;

export type HelixSolverRetryKind =
  | "rerun_retrieval"
  | "alternate_source"
  | "repair_binding"
  | "refresh_live_source"
  | "validate_candidate"
  | "ask_user"
  | "fail_closed";

export type HelixSolverRetryPolicy = {
  schema: typeof HELIX_SOLVER_RETRY_POLICY_SCHEMA;
  turn_id: string;
  failed_subgoal_id: string;

  retry_allowed: boolean;
  retry_kind: HelixSolverRetryKind;

  max_attempts: number;
  attempt_count: number;
  reason: string;

  assistant_answer: false;
  raw_content_included: false;
};
