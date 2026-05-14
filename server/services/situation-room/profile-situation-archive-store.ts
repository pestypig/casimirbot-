import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
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
import { listInterpretedEvents } from "./interpreted-event-log-store";
import { listUserSteeringEvidence } from "./user-steering-ingest";

const archivesByProfile = new Map<string, ProfileSituationArchive[]>();
const ARCHIVE_DIR = path.resolve(process.cwd(), ".cal/profile-archives");
const hydratedProfiles = new Set<string>();

const hashShort = (value: unknown, size = 16): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const safeProfileFileName = (profileId: string): string =>
  `${profileId.replace(/[^a-zA-Z0-9_.-]/g, "_")}.jsonl`;

const archivePath = (profileId: string): string =>
  path.join(ARCHIVE_DIR, safeProfileFileName(profileId));

const hydrateProfileArchives = (profileId: string): void => {
  if (hydratedProfiles.has(profileId)) return;
  hydratedProfiles.add(profileId);
  const filePath = archivePath(profileId);
  if (!fs.existsSync(filePath)) return;
  const entries = fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line: string) => line.trim())
    .filter(Boolean)
    .map((line: string) => JSON.parse(line) as ProfileSituationArchive);
  archivesByProfile.set(profileId, entries.slice(-200));
};

const persistArchive = (archive: ProfileSituationArchive): void => {
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  fs.appendFileSync(archivePath(archive.profile_id), `${JSON.stringify(archive)}\n`, "utf8");
};

export function archiveCategorizationSession(input: {
  job: ContinuousCategorizationJob;
  profileId?: string | null;
  endedAt?: string;
}): ProfileSituationArchive {
  const profileId = input.profileId ?? input.job.profile_id ?? "local-profile";
  hydrateProfileArchives(profileId);
  const endedAt = input.endedAt ?? new Date().toISOString();
  const evidence = listSyntheticEvidence(input.job.thread_id).slice(-24);
  const candidates = listPatternCandidates(input.job.thread_id).slice(-12);
  const interpretedEvents = listInterpretedEvents({
    threadId: input.job.thread_id,
    roomId: input.job.room_id,
    limit: 40,
  });
  const steeringEvidence = listUserSteeringEvidence(input.job.thread_id).slice(-40);
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
    interpreted_event_summaries: interpretedEvents.map((event) => ({
      event_id: event.event_id,
      kind: event.kind,
      summary: event.summary,
      confidence: event.confidence ?? null,
    })),
    user_steering_evidence: steeringEvidence.map((entry) => ({
      steering_id: entry.steering_id,
      user_claim: entry.user_claim,
      effect: entry.effect,
      next_checks: entry.next_checks,
      evidence_refs: entry.evidence_refs,
    })),
    subgoals: [],
    learned_pattern_candidates: candidates.map((candidate: HelixPatternCandidate) => candidate.candidate_id),
    raw_logs_included: false,
    assistant_answer: false,
    created_at: endedAt,
  };
  const existing = archivesByProfile.get(profileId) ?? [];
  archivesByProfile.set(profileId, [...existing, archive].slice(-200));
  persistArchive(archive);
  updateContinuousCategorizationJob({
    jobId: input.job.job_id,
    status: "archived",
    archiveId: archive.archive_id,
    now: endedAt,
  });
  return archive;
}

export function listProfileSituationArchives(profileId: string): ProfileSituationArchive[] {
  hydrateProfileArchives(profileId);
  return [...(archivesByProfile.get(profileId) ?? [])];
}

export function getProfileSituationArchive(profileId: string, archiveId: string): ProfileSituationArchive | null {
  hydrateProfileArchives(profileId);
  return archivesByProfile.get(profileId)?.find((archive: ProfileSituationArchive) => archive.archive_id === archiveId) ?? null;
}

export function compareCurrentSessionToArchive(input: {
  profileId: string;
  archiveId: string;
  threadId: string;
}): {
  schema: "helix.profile_archive_comparison.v1";
  archive_id: string;
  thread_id: string;
  overlap_count: number;
  archive_evidence_count: number;
  current_pattern_count: number;
  summary: string;
  raw_logs_included: false;
  assistant_answer: false;
} | null {
  const archive = getProfileSituationArchive(input.profileId, input.archiveId);
  if (!archive) return null;
  const currentPatterns = listPatternCandidates(input.threadId);
  const archiveCandidateSet = new Set(archive.learned_pattern_candidates);
  const overlap = currentPatterns.filter((candidate: HelixPatternCandidate) => archiveCandidateSet.has(candidate.candidate_id));
  return {
    schema: "helix.profile_archive_comparison.v1",
    archive_id: archive.archive_id,
    thread_id: input.threadId,
    overlap_count: overlap.length,
    archive_evidence_count: archive.evidence_index.length,
    current_pattern_count: currentPatterns.length,
    summary: overlap.length > 0
      ? `Current session shares ${overlap.length} pattern candidate(s) with the archive.`
      : "No exact promoted/candidate overlap was found; compare by evidence categories next.",
    raw_logs_included: false,
    assistant_answer: false,
  };
}

export function clearProfileSituationArchivesForTest(): void {
  archivesByProfile.clear();
  hydratedProfiles.clear();
}
