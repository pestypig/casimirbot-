import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { hashStableJson } from "../../utils/information-boundary";
import {
  listPersistedStarSimJobManifests,
  persistStarSimJobArtifacts,
  persistStarSimJobFailure,
  readPersistedStarSimJobResult,
  resolveStarSimJobPaths,
} from "./artifacts";
import { canonicalizeStarSimRequest } from "./canonicalize";
import type { RequestedLane, StarSimJobRecord, StarSimRequest, StarSimResponse } from "./contract";
import { runStarSim } from "./solver-registry";
import { resolveStarSimSolverRuntime } from "./worker/starsim-runtime";

type InternalJobRecord = StarSimJobRecord & {
  request: StarSimRequest;
  result: StarSimResponse | null;
};

const jobs = new Map<string, InternalJobRecord>();
const queue: string[] = [];
const running = new Set<string>();
const activeFingerprintToJobId = new Map<string, string>();
let jobsLoaded = false;
let mutationChain = Promise.resolve();

const heavyLaneSet = new Set<RequestedLane>(["structure_mesa", "oscillation_gyre"]);

const withMutationLock = async <T>(work: () => Promise<T>): Promise<T> => {
  const previous = mutationChain;
  let release!: () => void;
  mutationChain = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    return await work();
  } finally {
    release();
  }
};

const getJobConcurrency = (): number => {
  const value = Number(process.env.STAR_SIM_JOB_CONCURRENCY);
  return Number.isFinite(value) && value > 0 ? Math.max(1, Math.floor(value)) : 1;
};

const getJobMaxAttempts = (): number => {
  const value = Number(process.env.STAR_SIM_JOB_MAX_ATTEMPTS);
  return Number.isFinite(value) && value > 0 ? Math.max(1, Math.floor(value)) : 2;
};

const queuePositionFor = (jobId: string): number => {
  if (running.has(jobId) || !queue.includes(jobId)) {
    return 0;
  }
  return queue.indexOf(jobId) + 1;
};

const publicJobRecord = (job: InternalJobRecord): StarSimJobRecord => ({
  job_id: job.job_id,
  status: job.status,
  status_reason: job.status_reason,
  created_at_iso: job.created_at_iso,
  started_at_iso: job.started_at_iso,
  completed_at_iso: job.completed_at_iso,
  requested_lanes: job.requested_lanes,
  heavy_lanes: job.heavy_lanes,
  request_hash: job.request_hash,
  job_fingerprint: job.job_fingerprint,
  attempt_count: job.attempt_count,
  max_attempts: job.max_attempts,
  queue_position: queuePositionFor(job.job_id),
  result_path: job.result_path,
  error: job.error,
  deduped: job.deduped,
  deduped_from_job_id: job.deduped_from_job_id,
});

const readPersistedRequest = async (requestPath: string): Promise<StarSimRequest> => {
  try {
    const raw = await fs.readFile(path.resolve(process.cwd(), requestPath), "utf8");
    return JSON.parse(raw) as StarSimRequest;
  } catch {
    return {};
  }
};

const buildJobFingerprint = (request: StarSimRequest): string => {
  const canonical = canonicalizeStarSimRequest(request);
  const requestedHeavyLanes = canonical.requested_lanes.filter((lane) => heavyLaneSet.has(lane));
  const runtimes: Record<string, { runtime_mode: string; runtime_fingerprint: string }> = {};
  if (requestedHeavyLanes.includes("structure_mesa") || requestedHeavyLanes.includes("oscillation_gyre")) {
    const mesa = resolveStarSimSolverRuntime("mesa");
    runtimes.structure_mesa = {
      runtime_mode: mesa.runtime_kind,
      runtime_fingerprint: mesa.runtime_fingerprint,
    };
  }
  if (requestedHeavyLanes.includes("oscillation_gyre")) {
    const gyre = resolveStarSimSolverRuntime("gyre");
    runtimes.oscillation_gyre = {
      runtime_mode: gyre.runtime_kind,
      runtime_fingerprint: gyre.runtime_fingerprint,
    };
  }

  return hashStableJson({
    schema_version: "star-sim-job-fingerprint/2",
    execution_mode: "job",
    target: canonical.target,
    fields: canonical.fields,
    benchmark_case_id: canonical.benchmark_case_id,
    physics_flags: canonical.physics_flags,
    evidence_refs: canonical.evidence_refs,
    requested_lanes: canonical.requested_lanes,
    strict_lanes: canonical.strict_lanes,
    runtimes,
  });
};

const shouldRetryJob = (message: string): boolean =>
  message.includes("star_sim_worker_exit")
  || message.includes("star_sim_worker_error")
  || message.includes("star_sim_worker_timeout");

const persistJob = async (job: InternalJobRecord): Promise<void> => {
  if (job.status === "completed") {
    await persistStarSimJobArtifacts({
      job: publicJobRecord(job),
      request: job.request,
      result: job.result,
    });
    return;
  }

  if (job.status === "failed" || job.status === "abandoned") {
    await persistStarSimJobFailure({
      job: publicJobRecord(job),
      request: job.request,
      error: job.error ?? job.status_reason ?? "star_sim_job_failed",
    });
    return;
  }

  await persistStarSimJobArtifacts({
    job: publicJobRecord(job),
    request: job.request,
    result: null,
  });
};

const syncActiveFingerprint = (job: InternalJobRecord): void => {
  if (job.status === "queued" || job.status === "running") {
    activeFingerprintToJobId.set(job.job_fingerprint, job.job_id);
    return;
  }
  const activeJobId = activeFingerprintToJobId.get(job.job_fingerprint);
  if (activeJobId === job.job_id) {
    activeFingerprintToJobId.delete(job.job_fingerprint);
  }
};

const markPersistedOrphanedJobs = async (): Promise<void> => {
  const manifests = await listPersistedStarSimJobManifests();
  for (const manifest of manifests) {
    const request = await readPersistedRequest(manifest.request_path);
    const job: InternalJobRecord = {
      ...manifest.job,
      request,
      result: null,
    };
    if (job.status === "queued" || job.status === "running") {
      job.status = "abandoned";
      job.status_reason = "orphaned_after_restart";
      job.completed_at_iso = new Date().toISOString();
      job.error = job.error ?? "Job was orphaned after process restart before completion.";
      await persistJob(job);
    }
    jobs.set(job.job_id, job);
    syncActiveFingerprint(job);
  }
};

const ensureJobsLoaded = async (): Promise<void> => {
  if (jobsLoaded) {
    return;
  }
  jobsLoaded = true;
  await markPersistedOrphanedJobs();
};

const executeJob = async (jobId: string): Promise<void> => {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = "running";
  job.status_reason = null;
  job.started_at_iso = new Date().toISOString();
  job.completed_at_iso = null;
  job.error = null;
  job.attempt_count += 1;
  await persistJob(job);

  try {
    const result = await runStarSim(job.request, { executionMode: "job" });
    const failedLane = result.lanes.find((lane) => lane.status === "failed");
    if (failedLane) {
      const laneError =
        typeof failedLane.result.error === "string"
          ? failedLane.result.error
          : `${failedLane.requested_lane} returned failed status`;
      job.status = "failed";
      job.status_reason = laneError.includes("star_sim_worker") ? "worker_crash" : "lane_execution_error";
      job.completed_at_iso = new Date().toISOString();
      job.error = laneError;
      job.result = null;
      job.result_path = resolveStarSimJobPaths(job.job_id).resultPath;
      await persistJob(job);
      return;
    }

    job.status = "completed";
    job.status_reason = null;
    job.completed_at_iso = new Date().toISOString();
    job.result = result;
    job.result_path = resolveStarSimJobPaths(job.job_id).resultPath;
    await persistJob(job);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (shouldRetryJob(message) && job.attempt_count < job.max_attempts) {
      job.status = "queued";
      job.status_reason = "retrying_after_worker_failure";
      job.error = message;
      job.completed_at_iso = null;
      running.delete(jobId);
      if (!queue.includes(jobId)) {
        queue.push(jobId);
      }
      await persistJob(job);
      void drainQueue();
      return;
    }

    job.status = "failed";
    job.status_reason = shouldRetryJob(message) ? "worker_crash" : "job_execution_error";
    job.completed_at_iso = new Date().toISOString();
    job.error = message;
    job.result = null;
    job.result_path = resolveStarSimJobPaths(job.job_id).resultPath;
    await persistJob(job);
  } finally {
    running.delete(jobId);
    syncActiveFingerprint(job);
    void drainQueue();
  }
};

const drainQueue = async (): Promise<void> => {
  while (running.size < getJobConcurrency() && queue.length > 0) {
    const next = queue.shift();
    if (!next) break;
    const job = jobs.get(next);
    if (!job || job.status !== "queued") {
      continue;
    }
    running.add(next);
    syncActiveFingerprint(job);
    void executeJob(next);
  }
};

export const submitStarSimJob = async (request: StarSimRequest): Promise<StarSimJobRecord> => {
  await ensureJobsLoaded();
  return withMutationLock(async () => {
    const jobFingerprint = buildJobFingerprint(request);
    const existingId = activeFingerprintToJobId.get(jobFingerprint);
    if (existingId) {
      const existing = jobs.get(existingId);
      if (existing && (existing.status === "queued" || existing.status === "running")) {
        return {
          ...publicJobRecord(existing),
          deduped: true,
          deduped_from_job_id: existing.job_id,
        };
      }
    }

    const requestedLanes = canonicalizeStarSimRequest(request).requested_lanes;
    const record: InternalJobRecord = {
      job_id: randomUUID(),
      status: "queued",
      status_reason: null,
      created_at_iso: new Date().toISOString(),
      started_at_iso: null,
      completed_at_iso: null,
      requested_lanes: requestedLanes,
      heavy_lanes: requestedLanes.filter((lane) => heavyLaneSet.has(lane)),
      request_hash: hashStableJson(request),
      job_fingerprint: jobFingerprint,
      attempt_count: 0,
      max_attempts: getJobMaxAttempts(),
      queue_position: queue.length + 1,
      result_path: null,
      error: null,
      deduped: false,
      deduped_from_job_id: null,
      request,
      result: null,
    };
    jobs.set(record.job_id, record);
    queue.push(record.job_id);
    syncActiveFingerprint(record);
    await persistJob(record);
    void drainQueue();
    return publicJobRecord(record);
  });
};

export const getStarSimJob = async (jobId: string): Promise<StarSimJobRecord | null> => {
  await ensureJobsLoaded();
  const job = jobs.get(jobId);
  return job ? publicJobRecord(job) : null;
};

export const getStarSimJobResult = async (jobId: string): Promise<StarSimResponse | null> => {
  await ensureJobsLoaded();
  const job = jobs.get(jobId);
  if (!job) {
    return null;
  }
  if (job.result) {
    return job.result;
  }
  if (job.status !== "completed" || !job.result_path) {
    return null;
  }
  const parsed = await readPersistedStarSimJobResult(jobId);
  if (parsed) {
    job.result = parsed;
  }
  return parsed;
};

export const __resetStarSimJobsForTest = async (): Promise<void> => {
  jobs.clear();
  queue.splice(0, queue.length);
  running.clear();
  activeFingerprintToJobId.clear();
  jobsLoaded = false;
  mutationChain = Promise.resolve();
};
