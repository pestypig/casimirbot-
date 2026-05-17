import type { HelixLiveFieldWorkerRun } from "@shared/helix-live-field-worker-run";

const runsBySituationRun = new Map<string, HelixLiveFieldWorkerRun[]>();

export function recordLiveFieldWorkerRun(run: HelixLiveFieldWorkerRun): HelixLiveFieldWorkerRun {
  runsBySituationRun.set(run.situation_run_id, [
    ...(runsBySituationRun.get(run.situation_run_id) ?? []),
    run,
  ].slice(-800));
  return run;
}

export function listLiveFieldWorkerRuns(input: {
  threadId?: string | null;
  environmentId?: string | null;
  situationRunId?: string | null;
  workerId?: string | null;
  limit?: number;
} = {}): HelixLiveFieldWorkerRun[] {
  const limit = Math.max(0, Math.min(500, Math.trunc(input.limit ?? 200)));
  return Array.from(runsBySituationRun.values()).flat()
    .filter((run) => !input.threadId || run.thread_id === input.threadId)
    .filter((run) => !input.environmentId || run.environment_id === input.environmentId)
    .filter((run) => !input.situationRunId || run.situation_run_id === input.situationRunId)
    .filter((run) => !input.workerId || run.worker_id === input.workerId)
    .slice(-limit);
}

export function resetLiveFieldWorkerRunsForTest(): void {
  runsBySituationRun.clear();
}
