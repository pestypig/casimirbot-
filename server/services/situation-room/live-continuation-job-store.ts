import crypto from "node:crypto";
import type { HelixWorkerLaneReceipt } from "@shared/helix-live-continuation";

export type LiveContinuationJobStatus = "active" | "paused" | "blocked" | "stale" | "stopped";
export type LiveContinuationJobMode = "single_agent";
export type LiveContinuationVoicePolicy =
  | "muted"
  | "propose_only"
  | "confirm_speak_required"
  | "automatic_when_policy_allows";
export type LiveContinuationLane = HelixWorkerLaneReceipt["lane"];

export type LiveContinuationJob = {
  job_id: string;
  thread_id: string;
  room_id: string;
  environment_id?: string | null;
  contract_id?: string | null;
  source_ids: string[];
  objective: string;
  status: LiveContinuationJobStatus;
  mode: LiveContinuationJobMode;
  voice_policy: LiveContinuationVoicePolicy;
  lanes_enabled: LiveContinuationLane[];
  cooldowns: {
    callout_dedupe_keys: Record<string, string>;
    last_tick_at?: string | null;
    min_tick_interval_ms: number;
  };
  last_observation_refs: string[];
  created_at: string;
  updated_at: string;
};

export type UpsertLiveContinuationJobInput = {
  job_id?: string | null;
  thread_id: string;
  room_id: string;
  environment_id?: string | null;
  contract_id?: string | null;
  source_ids?: string[] | null;
  objective: string;
  status?: LiveContinuationJobStatus | null;
  voice_policy?: LiveContinuationVoicePolicy | null;
  lanes_enabled?: LiveContinuationLane[] | null;
  cooldowns?: Partial<LiveContinuationJob["cooldowns"]> | null;
  last_observation_refs?: string[] | null;
  now?: string;
};

export type ListLiveContinuationJobsFilter = {
  threadId?: string | null;
  roomId?: string | null;
  sourceId?: string | null;
  status?: LiveContinuationJobStatus | "any" | null;
  includeStopped?: boolean;
};

const jobs = new Map<string, LiveContinuationJob>();

export const DEFAULT_LIVE_CONTINUATION_LANES: LiveContinuationLane[] = [
  "source_health",
  "world_state",
  "risk_watch",
  "objective_progress",
  "route_watch",
  "resource_status",
  "prediction_reflection",
  "voice_gate",
];

const hashShort = (value: unknown, size = 16): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const normalizeString = (value?: string | null): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(
      values
        .map((value: string | null | undefined) => normalizeString(value))
        .filter((value: string | null): value is string => Boolean(value)),
    ),
  ).sort();

const isLiveContinuationLane = (value: unknown): value is LiveContinuationLane =>
  typeof value === "string" &&
  (DEFAULT_LIVE_CONTINUATION_LANES as readonly string[]).includes(value);

const normalizeLanes = (values?: LiveContinuationLane[] | null): LiveContinuationLane[] => {
  const normalized = uniqueStrings(values ?? []).filter(isLiveContinuationLane);
  return normalized.length > 0 ? normalized : [...DEFAULT_LIVE_CONTINUATION_LANES];
};

const normalizeVoicePolicy = (value?: LiveContinuationVoicePolicy | null): LiveContinuationVoicePolicy => {
  if (
    value === "muted" ||
    value === "propose_only" ||
    value === "confirm_speak_required" ||
    value === "automatic_when_policy_allows"
  ) {
    return value;
  }
  return "propose_only";
};

const normalizeStatus = (value?: LiveContinuationJobStatus | null): LiveContinuationJobStatus => {
  if (value === "paused" || value === "blocked" || value === "stale" || value === "stopped") return value;
  return "active";
};

const buildJobId = (input: {
  thread_id: string;
  room_id: string;
  environment_id?: string | null;
  contract_id?: string | null;
  source_ids: string[];
  objective: string;
}): string =>
  `live_continuation:${hashShort([
    input.thread_id,
    input.room_id,
    normalizeString(input.environment_id) ?? null,
    normalizeString(input.contract_id) ?? null,
    input.source_ids,
    input.objective,
  ], 18)}`;

export function upsertLiveContinuationJob(input: UpsertLiveContinuationJobInput): LiveContinuationJob {
  const now = input.now ?? new Date().toISOString();
  const threadId = normalizeString(input.thread_id);
  const roomId = normalizeString(input.room_id);
  const objective = normalizeString(input.objective);
  if (!threadId || !roomId || !objective) {
    throw new Error("LiveContinuationJob requires thread_id, room_id, and objective.");
  }

  const sourceIds = uniqueStrings(input.source_ids ?? []);
  const jobId =
    normalizeString(input.job_id) ??
    buildJobId({
      thread_id: threadId,
      room_id: roomId,
      environment_id: input.environment_id,
      contract_id: input.contract_id,
      source_ids: sourceIds,
      objective,
    });
  const existing = jobs.get(jobId);
  const job: LiveContinuationJob = {
    job_id: jobId,
    thread_id: threadId,
    room_id: roomId,
    environment_id: normalizeString(input.environment_id) ?? existing?.environment_id ?? null,
    contract_id: normalizeString(input.contract_id) ?? existing?.contract_id ?? null,
    source_ids: sourceIds.length > 0 ? sourceIds : existing?.source_ids ?? [],
    objective,
    status: normalizeStatus(input.status ?? existing?.status ?? "active"),
    mode: "single_agent",
    voice_policy: normalizeVoicePolicy(input.voice_policy ?? existing?.voice_policy),
    lanes_enabled: normalizeLanes(input.lanes_enabled ?? existing?.lanes_enabled),
    cooldowns: {
      callout_dedupe_keys: {
        ...(existing?.cooldowns.callout_dedupe_keys ?? {}),
        ...(input.cooldowns?.callout_dedupe_keys ?? {}),
      },
      last_tick_at:
        normalizeString(input.cooldowns?.last_tick_at) ??
        existing?.cooldowns.last_tick_at ??
        null,
      min_tick_interval_ms:
        typeof input.cooldowns?.min_tick_interval_ms === "number" &&
        Number.isFinite(input.cooldowns.min_tick_interval_ms) &&
        input.cooldowns.min_tick_interval_ms >= 0
          ? input.cooldowns.min_tick_interval_ms
          : existing?.cooldowns.min_tick_interval_ms ?? 5000,
    },
    last_observation_refs: uniqueStrings(input.last_observation_refs ?? existing?.last_observation_refs ?? []),
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
  jobs.set(job.job_id, job);
  return job;
}

export function getActiveLiveContinuationJobForRoom(roomId: string): LiveContinuationJob | null {
  const normalizedRoomId = normalizeString(roomId);
  if (!normalizedRoomId) return null;
  return listLiveContinuationJobs({ roomId: normalizedRoomId, status: "active" })[0] ?? null;
}

export function listLiveContinuationJobs(filter: ListLiveContinuationJobsFilter = {}): LiveContinuationJob[] {
  const threadId = normalizeString(filter.threadId);
  const roomId = normalizeString(filter.roomId);
  const sourceId = normalizeString(filter.sourceId);
  return Array.from(jobs.values())
    .filter((job: LiveContinuationJob) => !threadId || job.thread_id === threadId)
    .filter((job: LiveContinuationJob) => !roomId || job.room_id === roomId)
    .filter((job: LiveContinuationJob) => !sourceId || job.source_ids.includes(sourceId))
    .filter((job: LiveContinuationJob) => filter.status === "any" || !filter.status || job.status === filter.status)
    .filter((job: LiveContinuationJob) => filter.includeStopped === true || job.status !== "stopped")
    .sort(
      (a: LiveContinuationJob, b: LiveContinuationJob) =>
        b.updated_at.localeCompare(a.updated_at) || a.job_id.localeCompare(b.job_id),
    );
}

function updateLiveContinuationJobStatus(
  jobId: string,
  status: Extract<LiveContinuationJobStatus, "active" | "paused" | "stopped">,
  now = new Date().toISOString(),
): LiveContinuationJob | null {
  const normalizedJobId = normalizeString(jobId);
  if (!normalizedJobId) return null;
  const existing = jobs.get(normalizedJobId);
  if (!existing) return null;
  const updated: LiveContinuationJob = {
    ...existing,
    status,
    updated_at: now,
  };
  jobs.set(updated.job_id, updated);
  return updated;
}

export function pauseLiveContinuationJob(jobId: string, now?: string): LiveContinuationJob | null {
  return updateLiveContinuationJobStatus(jobId, "paused", now);
}

export function resumeLiveContinuationJob(jobId: string, now?: string): LiveContinuationJob | null {
  return updateLiveContinuationJobStatus(jobId, "active", now);
}

export function stopLiveContinuationJob(jobId: string, now?: string): LiveContinuationJob | null {
  return updateLiveContinuationJobStatus(jobId, "stopped", now);
}

export function resetLiveContinuationJobsForTest(): void {
  jobs.clear();
}
