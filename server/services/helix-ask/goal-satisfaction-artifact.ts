type HelixTurnArtifactSourceScope = "current_turn" | "prior_turn_context" | "workspace_state";

export type HelixGoalSatisfactionArtifact = {
  artifact_id: string;
  turn_id: string;
  producer_item_id: string;
  kind: "goal_satisfaction_evaluation";
  created_at_ms: number;
  source_scope: HelixTurnArtifactSourceScope;
  goal_hash: string;
  payload: unknown;
};

export const buildHelixGoalSatisfactionEvaluationArtifact = (args: {
  turnId: string;
  goalHash: string;
  evaluation: unknown;
  createdAtMs?: number;
}): HelixGoalSatisfactionArtifact => ({
  artifact_id: `${args.turnId}:goal_satisfaction_evaluation`,
  turn_id: args.turnId,
  producer_item_id: "goal_satisfaction_evaluator",
  kind: "goal_satisfaction_evaluation",
  created_at_ms: args.createdAtMs ?? Date.now(),
  source_scope: "current_turn",
  goal_hash: args.goalHash,
  payload: args.evaluation,
});
