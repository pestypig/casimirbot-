import type { HelixLiveInterpretationWorkerRun } from "@shared/helix-live-interpretation-worker-run";

const runsByInterpretationRun = new Map<string, HelixLiveInterpretationWorkerRun[]>();

export function recordLiveInterpretationWorkerRun(run: HelixLiveInterpretationWorkerRun): HelixLiveInterpretationWorkerRun {
  runsByInterpretationRun.set(run.interpretation_run_id, [
    ...(runsByInterpretationRun.get(run.interpretation_run_id) ?? [])
      .filter((entry) => entry.interpretation_worker_run_id !== run.interpretation_worker_run_id),
    run,
  ].slice(-1000));
  return run;
}

export function listLiveInterpretationWorkerRuns(input: {
  threadId?: string | null;
  interpretationRunId?: string | null;
  situationRunId?: string | null;
  workerId?: string | null;
  limit?: number;
} = {}): HelixLiveInterpretationWorkerRun[] {
  const limit = Math.max(0, Math.min(1000, Math.trunc(input.limit ?? 300)));
  return Array.from(runsByInterpretationRun.values()).flat()
    .filter((run) => !input.threadId || run.thread_id === input.threadId)
    .filter((run) => !input.interpretationRunId || run.interpretation_run_id === input.interpretationRunId)
    .filter((run) => !input.situationRunId || run.situation_run_id === input.situationRunId)
    .filter((run) => !input.workerId || run.interpretation_worker_id === input.workerId)
    .slice(-limit);
}

export function resetLiveInterpretationWorkerRunsForTest(): void {
  runsByInterpretationRun.clear();
}
