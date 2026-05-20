export const HELIX_SOLVER_SUBGOAL_SCHEMA = "helix.solver_subgoal.v1" as const;
export const HELIX_SOLVER_SUBGOAL_LEDGER_SCHEMA = "helix.solver_subgoal_ledger.v1" as const;

export type HelixSolverSubgoalKind =
  | "interpret_prompt"
  | "retrieve_evidence"
  | "execute_capability"
  | "compare_evidence"
  | "diagnose_debug"
  | "verify_result"
  | "compose_answer"
  | "terminal_authority";

export type HelixSolverSubgoalStatus =
  | "planned"
  | "running"
  | "succeeded"
  | "failed"
  | "skipped"
  | "blocked";

export type HelixSolverSubgoalEvaluation = {
  ok: boolean;
  reasons: string[];
  missing: string[];
  retry_recommended: boolean;
};

export type HelixSolverSubgoal = {
  schema: typeof HELIX_SOLVER_SUBGOAL_SCHEMA;
  subgoal_id: string;
  turn_id: string;

  kind: HelixSolverSubgoalKind;
  status: HelixSolverSubgoalStatus;

  success_criteria: string[];
  evidence_refs: string[];
  capability_plan_refs: string[];
  capability_result_refs: string[];
  retrieval_result_refs: string[];

  evaluation: HelixSolverSubgoalEvaluation;

  assistant_answer: false;
  raw_content_included: false;
};

export type HelixSolverSubgoalLedger = {
  schema: typeof HELIX_SOLVER_SUBGOAL_LEDGER_SCHEMA;
  turn_id: string;
  subgoals: HelixSolverSubgoal[];
  ok: boolean;
  failed_subgoal_ids: string[];
  blocked_subgoal_ids: string[];
  assistant_answer: false;
  raw_content_included: false;
};
