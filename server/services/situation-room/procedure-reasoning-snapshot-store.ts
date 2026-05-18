import type { HelixProcedureReasoningSnapshot } from "@shared/helix-procedure-reasoning-snapshot";

const snapshotsByThread = new Map<string, HelixProcedureReasoningSnapshot[]>();

export function recordProcedureReasoningSnapshot(
  snapshot: HelixProcedureReasoningSnapshot,
): HelixProcedureReasoningSnapshot {
  snapshotsByThread.set(snapshot.thread_id, [
    ...(snapshotsByThread.get(snapshot.thread_id) ?? []).filter((entry: HelixProcedureReasoningSnapshot) => entry.snapshot_id !== snapshot.snapshot_id),
    snapshot,
  ].slice(-300));
  return snapshot;
}

export function listProcedureReasoningSnapshots(input: {
  threadId?: string | null;
  situationRunId?: string | null;
  limit?: number;
} = {}): HelixProcedureReasoningSnapshot[] {
  const limit = Math.max(0, Math.min(300, Math.trunc(input.limit ?? 80)));
  return Array.from(snapshotsByThread.values()).flat()
    .filter((entry: HelixProcedureReasoningSnapshot) => !input.threadId || entry.thread_id === input.threadId)
    .filter((entry: HelixProcedureReasoningSnapshot) => !input.situationRunId || entry.situation_run_id === input.situationRunId)
    .slice(-limit);
}

export function getProcedureReasoningSnapshot(snapshotId: string): HelixProcedureReasoningSnapshot | null {
  return Array.from(snapshotsByThread.values()).flat()
    .find((entry: HelixProcedureReasoningSnapshot) => entry.snapshot_id === snapshotId) ?? null;
}

export function resetProcedureReasoningSnapshotsForTest(): void {
  snapshotsByThread.clear();
}
