import type { HelixLiveConfidenceUpdate } from "@shared/helix-live-confidence-update";

const updatesByRun = new Map<string, HelixLiveConfidenceUpdate[]>();

export function recordLiveConfidenceUpdate(update: HelixLiveConfidenceUpdate): HelixLiveConfidenceUpdate {
  const existing = updatesByRun.get(update.situation_run_id) ?? [];
  updatesByRun.set(update.situation_run_id, [
    ...existing.filter((entry: HelixLiveConfidenceUpdate) => entry.confidence_update_id !== update.confidence_update_id),
    update,
  ].slice(-800));
  return update;
}

export function listLiveConfidenceUpdates(input: {
  threadId?: string | null;
  environmentId?: string | null;
  situationRunId?: string | null;
  limit?: number;
} = {}): HelixLiveConfidenceUpdate[] {
  const limit = Math.max(0, Math.min(800, Math.trunc(input.limit ?? 200)));
  return (Array.from(updatesByRun.values()).flat() as HelixLiveConfidenceUpdate[])
    .filter((entry: HelixLiveConfidenceUpdate) => !input.threadId || entry.thread_id === input.threadId)
    .filter((entry: HelixLiveConfidenceUpdate) => !input.environmentId || entry.environment_id === input.environmentId)
    .filter((entry: HelixLiveConfidenceUpdate) => !input.situationRunId || entry.situation_run_id === input.situationRunId)
    .sort((a: HelixLiveConfidenceUpdate, b: HelixLiveConfidenceUpdate) => a.created_at.localeCompare(b.created_at))
    .slice(-limit);
}

export function resetLiveConfidenceUpdatesForTest(): void {
  updatesByRun.clear();
}

