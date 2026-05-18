import type {
  HelixLiveArbitrationCandidate,
  HelixLiveArbitrationCandidateStatus,
} from "@shared/helix-live-arbitration-candidate";

const candidatesByRun = new Map<string, HelixLiveArbitrationCandidate[]>();

export function recordLiveArbitrationCandidate(candidate: HelixLiveArbitrationCandidate): HelixLiveArbitrationCandidate {
  const existing = candidatesByRun.get(candidate.situation_run_id) ?? [];
  const withoutDuplicate = existing.filter((entry: HelixLiveArbitrationCandidate) => entry.candidate_id !== candidate.candidate_id);
  candidatesByRun.set(candidate.situation_run_id, [...withoutDuplicate, candidate].slice(-500));
  return candidate;
}

export function listLiveArbitrationCandidates(input: {
  threadId?: string | null;
  environmentId?: string | null;
  situationRunId?: string | null;
  status?: HelixLiveArbitrationCandidateStatus | null;
  includeExpired?: boolean;
  limit?: number;
} = {}): HelixLiveArbitrationCandidate[] {
  const limit = Math.max(0, Math.min(500, Math.trunc(input.limit ?? 160)));
  const now = Date.now();
  return (Array.from(candidatesByRun.values()).flat() as HelixLiveArbitrationCandidate[])
    .filter((entry: HelixLiveArbitrationCandidate) => !input.threadId || entry.thread_id === input.threadId)
    .filter((entry: HelixLiveArbitrationCandidate) => !input.environmentId || entry.environment_id === input.environmentId)
    .filter((entry: HelixLiveArbitrationCandidate) => !input.situationRunId || entry.situation_run_id === input.situationRunId)
    .filter((entry: HelixLiveArbitrationCandidate) => !input.status || entry.status === input.status)
    .filter((entry: HelixLiveArbitrationCandidate) => input.includeExpired || entry.status === "expired" || Date.parse(entry.expires_at) > now)
    .sort((a: HelixLiveArbitrationCandidate, b: HelixLiveArbitrationCandidate) => a.expires_at.localeCompare(b.expires_at) || a.candidate_id.localeCompare(b.candidate_id))
    .slice(-limit);
}

export function getLiveArbitrationCandidate(candidateId: string): HelixLiveArbitrationCandidate | null {
  return (Array.from(candidatesByRun.values()).flat() as HelixLiveArbitrationCandidate[])
    .find((entry: HelixLiveArbitrationCandidate) => entry.candidate_id === candidateId) ?? null;
}

export function updateLiveArbitrationCandidateStatus(
  candidateId: string,
  status: HelixLiveArbitrationCandidateStatus,
): HelixLiveArbitrationCandidate | null {
  const candidate = getLiveArbitrationCandidate(candidateId);
  if (!candidate) return null;
  return recordLiveArbitrationCandidate({ ...candidate, status });
}

export function resetLiveArbitrationCandidatesForTest(): void {
  candidatesByRun.clear();
}
