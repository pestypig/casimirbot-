import type {
  HelixLiveObservationProbe,
  HelixLiveObservationProbeStatus,
} from "@shared/helix-live-observation-probe";

const probesByRun = new Map<string, HelixLiveObservationProbe[]>();

export function recordLiveObservationProbe(probe: HelixLiveObservationProbe): HelixLiveObservationProbe {
  const existing = probesByRun.get(probe.situation_run_id) ?? [];
  probesByRun.set(probe.situation_run_id, [
    ...existing.filter((entry: HelixLiveObservationProbe) => entry.probe_id !== probe.probe_id),
    probe,
  ].slice(-800));
  return probe;
}

export function listLiveObservationProbes(input: {
  threadId?: string | null;
  environmentId?: string | null;
  situationRunId?: string | null;
  status?: HelixLiveObservationProbeStatus | null;
  includeExpired?: boolean;
  limit?: number;
} = {}): HelixLiveObservationProbe[] {
  const limit = Math.max(0, Math.min(800, Math.trunc(input.limit ?? 200)));
  const now = Date.now();
  return (Array.from(probesByRun.values()).flat() as HelixLiveObservationProbe[])
    .filter((entry: HelixLiveObservationProbe) => !input.threadId || entry.thread_id === input.threadId)
    .filter((entry: HelixLiveObservationProbe) => !input.environmentId || entry.environment_id === input.environmentId)
    .filter((entry: HelixLiveObservationProbe) => !input.situationRunId || entry.situation_run_id === input.situationRunId)
    .filter((entry: HelixLiveObservationProbe) => !input.status || entry.status === input.status)
    .filter((entry: HelixLiveObservationProbe) => input.includeExpired || Date.parse(entry.expires_at) > now)
    .sort((a: HelixLiveObservationProbe, b: HelixLiveObservationProbe) => a.created_at.localeCompare(b.created_at))
    .slice(-limit);
}

export function updateLiveObservationProbeStatus(
  probeId: string,
  status: HelixLiveObservationProbeStatus,
): HelixLiveObservationProbe | null {
  const probe = (Array.from(probesByRun.values()).flat() as HelixLiveObservationProbe[])
    .find((entry: HelixLiveObservationProbe) => entry.probe_id === probeId) ?? null;
  if (!probe) return null;
  return recordLiveObservationProbe({ ...probe, status });
}

export function resetLiveObservationProbesForTest(): void {
  probesByRun.clear();
}

