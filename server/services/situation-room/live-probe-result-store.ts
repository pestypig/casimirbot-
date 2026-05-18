import type { HelixLiveProbeResult } from "@shared/helix-live-probe-result";

const resultsByRun = new Map<string, HelixLiveProbeResult[]>();

export function recordLiveProbeResult(result: HelixLiveProbeResult): HelixLiveProbeResult {
  const existing = resultsByRun.get(result.situation_run_id) ?? [];
  resultsByRun.set(result.situation_run_id, [
    ...existing.filter((entry: HelixLiveProbeResult) => entry.probe_result_id !== result.probe_result_id),
    result,
  ].slice(-800));
  return result;
}

export function listLiveProbeResults(input: {
  threadId?: string | null;
  environmentId?: string | null;
  situationRunId?: string | null;
  limit?: number;
} = {}): HelixLiveProbeResult[] {
  const limit = Math.max(0, Math.min(800, Math.trunc(input.limit ?? 200)));
  return (Array.from(resultsByRun.values()).flat() as HelixLiveProbeResult[])
    .filter((entry: HelixLiveProbeResult) => !input.threadId || entry.thread_id === input.threadId)
    .filter((entry: HelixLiveProbeResult) => !input.environmentId || entry.environment_id === input.environmentId)
    .filter((entry: HelixLiveProbeResult) => !input.situationRunId || entry.situation_run_id === input.situationRunId)
    .sort((a: HelixLiveProbeResult, b: HelixLiveProbeResult) => a.created_at.localeCompare(b.created_at))
    .slice(-limit);
}

export function resetLiveProbeResultsForTest(): void {
  resultsByRun.clear();
}

