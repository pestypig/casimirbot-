export const HELIX_SUBGOAL_EVALUATION_SCHEMA = "helix.subgoal_evaluation.v1" as const;

export type HelixSubgoalEvaluationStatus =
  | "active"
  | "progress"
  | "blocked"
  | "completed"
  | "stale";

export type HelixSubgoalEvaluation = {
  schema: typeof HELIX_SUBGOAL_EVALUATION_SCHEMA;
  evaluation_id: string;
  subgoal_id: string;
  thread_id: string;
  goal_label: string;
  status: HelixSubgoalEvaluationStatus;
  evidence_ids: string[];
  next_best_tool?: string | null;
  evaluation_summary: string;
  deterministic: boolean;
  model_invoked: boolean;
  created_at: string;
};
