import type { HelixLiveTangentEvaluation } from "@shared/helix-live-tangent-evaluation";

const tangentsByRun = new Map<string, HelixLiveTangentEvaluation[]>();

export function recordLiveTangentEvaluation(tangent: HelixLiveTangentEvaluation): HelixLiveTangentEvaluation {
  tangentsByRun.set(tangent.situation_run_id, [
    ...(tangentsByRun.get(tangent.situation_run_id) ?? []),
    tangent,
  ].slice(-300));
  return tangent;
}

export function listLiveTangentEvaluations(input: {
  threadId?: string | null;
  situationRunId?: string | null;
  limit?: number;
} = {}): HelixLiveTangentEvaluation[] {
  const limit = Math.max(0, Math.min(300, Math.trunc(input.limit ?? 120)));
  return Array.from(tangentsByRun.values()).flat()
    .filter((entry) => !input.threadId || entry.thread_id === input.threadId)
    .filter((entry) => !input.situationRunId || entry.situation_run_id === input.situationRunId)
    .slice(-limit);
}

export function resetLiveTangentEvaluationsForTest(): void {
  tangentsByRun.clear();
}
