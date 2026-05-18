import type { HelixReceiptPresentationSnapshot } from "@shared/helix-receipt-presentation-snapshot";

const snapshotsByTurn = new Map<string, HelixReceiptPresentationSnapshot[]>();

export function recordReceiptPresentationSnapshot(
  snapshot: HelixReceiptPresentationSnapshot,
): HelixReceiptPresentationSnapshot {
  snapshotsByTurn.set(snapshot.turn_id, [
    ...(snapshotsByTurn.get(snapshot.turn_id) ?? [])
      .filter((entry: HelixReceiptPresentationSnapshot) => entry.snapshot_id !== snapshot.snapshot_id),
    snapshot,
  ].slice(-100));
  return snapshot;
}

export function listReceiptPresentationSnapshots(input: {
  turnId?: string | null;
  limit?: number;
} = {}): HelixReceiptPresentationSnapshot[] {
  const limit = Math.max(0, Math.min(300, Math.trunc(input.limit ?? 100)));
  return Array.from(snapshotsByTurn.values()).flat()
    .filter((entry: HelixReceiptPresentationSnapshot) => !input.turnId || entry.turn_id === input.turnId)
    .slice(-limit);
}

export function resetReceiptPresentationSnapshotsForTest(): void {
  snapshotsByTurn.clear();
}
