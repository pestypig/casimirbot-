import {
  HELIX_REASONING_SUBGOAL_LEDGER_SCHEMA,
  type HelixReasoningSubgoalLedger,
} from "../../../shared/helix-reasoning-subgoal-ledger";
import { listSubgoalEvaluations } from "./subgoal-evaluator";

export function buildReasoningSubgoalLedger(threadId: string): HelixReasoningSubgoalLedger {
  const latestBySubgoal = new Map<string, ReturnType<typeof listSubgoalEvaluations>[number]>();
  for (const evaluation of listSubgoalEvaluations(threadId)) {
    latestBySubgoal.set(evaluation.subgoal_id, evaluation);
  }
  const latest = [...latestBySubgoal.values()];
  const active_subgoals = latest
    .filter((evaluation) => evaluation.status !== "completed")
    .map((evaluation) => ({
      subgoal_id: evaluation.subgoal_id,
      label: evaluation.goal_label,
      status: evaluation.status,
      evidence_ids: evaluation.evidence_ids,
      next_best_tool: evaluation.next_best_tool ?? null,
      updated_at: evaluation.created_at,
    }));
  return {
    schema: HELIX_REASONING_SUBGOAL_LEDGER_SCHEMA,
    thread_id: threadId,
    active_subgoals,
    completed_subgoals: latest.filter((evaluation) => evaluation.status === "completed").map((evaluation) => evaluation.subgoal_id),
    stale_subgoals: latest.filter((evaluation) => evaluation.status === "stale").map((evaluation) => evaluation.subgoal_id),
    updated_at: new Date().toISOString(),
  };
}
