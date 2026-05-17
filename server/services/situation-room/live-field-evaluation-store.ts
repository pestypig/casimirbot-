import {
  type HelixLiveFieldEvaluation,
  type HelixLiveFieldEvaluationStatus,
} from "@shared/helix-live-field-evaluation";

const evaluationsByRun = new Map<string, HelixLiveFieldEvaluation[]>();

export function recordLiveFieldEvaluation(evaluation: HelixLiveFieldEvaluation): HelixLiveFieldEvaluation {
  evaluationsByRun.set(evaluation.situation_run_id, [
    ...(evaluationsByRun.get(evaluation.situation_run_id) ?? []),
    evaluation,
  ].slice(-500));
  return evaluation;
}

export function listLiveFieldEvaluations(input: {
  threadId?: string | null;
  environmentId?: string | null;
  situationRunId?: string | null;
  fieldKey?: string | null;
  includeExpired?: boolean;
  limit?: number;
} = {}): HelixLiveFieldEvaluation[] {
  const limit = Math.max(0, Math.min(400, Math.trunc(input.limit ?? 160)));
  const now = Date.now();
  return Array.from(evaluationsByRun.values()).flat()
    .filter((entry) => !input.threadId || entry.thread_id === input.threadId)
    .filter((entry) => !input.environmentId || entry.environment_id === input.environmentId)
    .filter((entry) => !input.situationRunId || entry.situation_run_id === input.situationRunId)
    .filter((entry) => !input.fieldKey || entry.field_key === input.fieldKey)
    .filter((entry) => input.includeExpired || Date.parse(entry.expires_at) > now)
    .sort((a, b) => a.expires_at.localeCompare(b.expires_at) || a.evaluation_id.localeCompare(b.evaluation_id))
    .slice(-limit);
}

export function latestLiveFieldEvaluationsByField(input: {
  threadId?: string | null;
  environmentId?: string | null;
  situationRunId?: string | null;
} = {}): Map<string, HelixLiveFieldEvaluation> {
  const latest = new Map<string, HelixLiveFieldEvaluation>();
  for (const evaluation of listLiveFieldEvaluations({ ...input, limit: 400 })) {
    if (evaluation.status === "expired") continue;
    latest.set(evaluation.field_key, evaluation);
  }
  return latest;
}

export function expireLiveFieldEvaluation(input: {
  evaluation: HelixLiveFieldEvaluation;
  now?: string;
}): HelixLiveFieldEvaluation {
  const expired: HelixLiveFieldEvaluation = {
    ...input.evaluation,
    status: "expired" as HelixLiveFieldEvaluationStatus,
    expires_at: input.now ?? new Date().toISOString(),
  };
  return recordLiveFieldEvaluation(expired);
}

export function resetLiveFieldEvaluationsForTest(): void {
  evaluationsByRun.clear();
}
