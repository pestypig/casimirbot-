import {
  HELIX_SUBGOAL_EVALUATION_SCHEMA,
  type HelixSubgoalEvaluation,
  type HelixSubgoalEvaluationStatus,
} from "../../../shared/helix-subgoal-evaluation";

export type EvaluateSubgoalFromSyntheticEvidenceInput = {
  thread_id: string;
  subgoal_id: string;
  goal_label: string;
  evidence_ids: string[];
  status: HelixSubgoalEvaluationStatus;
  evaluation_summary: string;
  next_best_tool?: string | null;
  deterministic?: boolean;
  model_invoked?: boolean;
};

const subgoalEvaluationsByThread = new Map<string, HelixSubgoalEvaluation[]>();

function newId(prefix: string): string {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

function uniqueStrings(values: unknown[]): string[] {
  return Array.from(new Set(values.map((entry) => String(entry ?? "").trim()).filter(Boolean)));
}

export function recordSubgoalEvaluation(input: EvaluateSubgoalFromSyntheticEvidenceInput): HelixSubgoalEvaluation {
  const evaluation: HelixSubgoalEvaluation = {
    schema: HELIX_SUBGOAL_EVALUATION_SCHEMA,
    evaluation_id: newId("subgoal-evaluation"),
    subgoal_id: input.subgoal_id,
    thread_id: input.thread_id,
    goal_label: input.goal_label.trim(),
    status: input.status,
    evidence_ids: uniqueStrings(input.evidence_ids),
    next_best_tool: input.next_best_tool ?? null,
    evaluation_summary: input.evaluation_summary.trim(),
    deterministic: input.deterministic !== false,
    model_invoked: input.model_invoked === true,
    created_at: new Date().toISOString(),
  };
  const existing = subgoalEvaluationsByThread.get(evaluation.thread_id) ?? [];
  subgoalEvaluationsByThread.set(evaluation.thread_id, [...existing, evaluation].slice(-200));
  return evaluation;
}

export function listSubgoalEvaluations(threadId: string): HelixSubgoalEvaluation[] {
  return [...(subgoalEvaluationsByThread.get(threadId) ?? [])];
}

export function clearSubgoalEvaluationsForTest(): void {
  subgoalEvaluationsByThread.clear();
}
