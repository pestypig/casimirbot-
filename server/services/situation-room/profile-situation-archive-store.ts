import crypto from "node:crypto";
import {
  HELIX_PROFILE_SITUATION_ARCHIVE_SCHEMA,
  type ProfileSituationArchive,
} from "@shared/helix-profile-situation-archive";
import type { ContinuousCategorizationJob } from "@shared/helix-continuous-categorization-job";
import type { HelixSyntheticEvidence } from "@shared/helix-synthetic-evidence";
import type { HelixPatternCandidate } from "@shared/helix-pattern-candidate";
import { listSyntheticEvidence } from "./synthetic-evidence-ledger";
import { listPatternCandidates } from "./pattern-candidate-ledger";
import { updateContinuousCategorizationJob } from "./continuous-categorization-job-store";

const archivesByProfile = new Map<string, ProfileSituationArchive[]>();

const hashShort = (value: unknown, size = 16): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function archiveCategorizationSession(input: {
  job: ContinuousCategorizationJob;
  profileId?: string | null;
  endedAt?: string;
}): ProfileSituationArchive {
  const profileId = input.profileId ?? input.job.profile_id ?? "local-profile";
  const endedAt = input.endedAt ?? new Date().toISOString();
  const evidence = listSyntheticEvidence(input.job.thread_id).slice(-24);
  const candidates = listPatternCandidates(input.job.thread_id).slice(-12);
  const archive: ProfileSituationArchive = {
    schema: HELIX_PROFILE_SITUATION_ARCHIVE_SCHEMA,
    archive_id: `profile_archive:${hashShort([profileId, input.job.job_id, endedAt], 18)}`,
    profile_id: profileId,
    thread_id: input.job.thread_id,
    job_id: input.job.job_id,
    source_family: input.job.source_family,
    session_title: input.job.objective || `${input.job.source_family} session`,
    objective: input.job.objective,
    started_at: input.job.created_at,
    ended_at: endedAt,
    summary: input.job.latest_summary ?? `Categorization job observed ${input.job.counters.source_events_seen} source events.`,
    evidence_index: evidence.map((entry: HelixSyntheticEvidence) => ({
      evidence_id: entry.evidence_id,
      category: entry.produced_by,
      summary: entry.claim,
      confidence: entry.support_status === "supports" ? 0.85 : entry.support_status === "partial" ? 0.55 : 0.35,
      source_refs: entry.source_refs,
    })),
    subgoals: [],
    learned_pattern_candidates: candidates.map((candidate: HelixPatternCandidate) => candidate.candidate_id),
    raw_logs_included: false,
    assistant_answer: false,
    created_at: endedAt,
  };
  const existing = archivesByProfile.get(profileId) ?? [];
  archivesByProfile.set(profileId, [...existing, archive].slice(-200));
  updateContinuousCategorizationJob({
    jobId: input.job.job_id,
    status: "archived",
    archiveId: archive.archive_id,
    now: endedAt,
  });
  return archive;
}

export function listProfileSituationArchives(profileId: string): ProfileSituationArchive[] {
  return [...(archivesByProfile.get(profileId) ?? [])];
}

export function clearProfileSituationArchivesForTest(): void {
  archivesByProfile.clear();
}
