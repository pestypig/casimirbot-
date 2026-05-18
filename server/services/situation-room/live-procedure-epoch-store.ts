import type { HelixLiveProcedureEpoch } from "@shared/helix-live-procedure-epoch";

const epochsByRun = new Map<string, HelixLiveProcedureEpoch[]>();

export function recordLiveProcedureEpoch(epoch: HelixLiveProcedureEpoch): HelixLiveProcedureEpoch {
  const existing = epochsByRun.get(epoch.situation_run_id) ?? [];
  epochsByRun.set(epoch.situation_run_id, [
    ...existing.filter((entry: HelixLiveProcedureEpoch) => entry.epoch_id !== epoch.epoch_id),
    epoch,
  ].slice(-800));
  return epoch;
}

export function listLiveProcedureEpochs(input: {
  threadId?: string | null;
  environmentId?: string | null;
  situationRunId?: string | null;
  limit?: number;
} = {}): HelixLiveProcedureEpoch[] {
  const limit = Math.max(0, Math.min(800, Math.trunc(input.limit ?? 200)));
  return (Array.from(epochsByRun.values()).flat() as HelixLiveProcedureEpoch[])
    .filter((entry: HelixLiveProcedureEpoch) => !input.threadId || entry.thread_id === input.threadId)
    .filter((entry: HelixLiveProcedureEpoch) => !input.environmentId || entry.environment_id === input.environmentId)
    .filter((entry: HelixLiveProcedureEpoch) => !input.situationRunId || entry.situation_run_id === input.situationRunId)
    .sort((a: HelixLiveProcedureEpoch, b: HelixLiveProcedureEpoch) => a.created_at.localeCompare(b.created_at))
    .slice(-limit);
}

export function resetLiveProcedureEpochsForTest(): void {
  epochsByRun.clear();
}

