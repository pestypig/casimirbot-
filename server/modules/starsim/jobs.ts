import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import { hashStableJson } from "../../utils/information-boundary";
import {
  persistStarSimJobArtifacts,
  persistStarSimJobFailure,
  resolveStarSimJobPaths,
} from "./artifacts";
import type { StarSimJobRecord, StarSimRequest, StarSimResponse } from "./contract";
import { runStarSim } from "./solver-registry";

type InternalJobRecord = StarSimJobRecord & {
  request: StarSimRequest;
  result: StarSimResponse | null;
};

const jobs = new Map<string, InternalJobRecord>();
const queue: string[] = [];
const running = new Set<string>();

const getJobConcurrency = (): number => {
  const value = Number(process.env.STAR_SIM_JOB_CONCURRENCY);
  return Number.isFinite(value) && value > 0 ? Math.max(1, Math.floor(value)) : 1;
};

const heavyLaneSet = new Set(["structure_mesa", "oscillation_gyre"]);

const queuePositionFor = (jobId: string): number => {
  if (running.has(jobId) || !queue.includes(jobId)) {
    return 0;
  }
  return queue.indexOf(jobId) + 1;
};

const publicJobRecord = (job: InternalJobRecord): StarSimJobRecord => ({
  job_id: job.job_id,
  status: job.status,
  created_at_iso: job.created_at_iso,
  started_at_iso: job.started_at_iso,
  completed_at_iso: job.completed_at_iso,
  requested_lanes: job.requested_lanes,
  heavy_lanes: job.heavy_lanes,
  request_hash: job.request_hash,
  queue_position: queuePositionFor(job.job_id),
  result_path: job.result_path,
  error: job.error,
});

const executeJob = async (jobId: string): Promise<void> => {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = "running";
  job.started_at_iso = new Date().toISOString();
  job.completed_at_iso = null;
  job.error = null;

  try {
    const result = await runStarSim(job.request, { executionMode: "job" });
    job.status = "completed";
    job.completed_at_iso = new Date().toISOString();
    job.result = result;
    job.result_path = resolveStarSimJobPaths(job.job_id).resultPath;
    await persistStarSimJobArtifacts({
      jobId: job.job_id,
      request: job.request as unknown as Record<string, unknown>,
      result: result as unknown as Record<string, unknown>,
      status: job.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    job.status = "failed";
    job.completed_at_iso = new Date().toISOString();
    job.error = message;
    job.result = null;
    job.result_path = resolveStarSimJobPaths(job.job_id).resultPath;
    await persistStarSimJobFailure({
      jobId: job.job_id,
      request: job.request as unknown as Record<string, unknown>,
      error: message,
    });
  } finally {
    running.delete(jobId);
    void drainQueue();
  }
};

const drainQueue = async (): Promise<void> => {
  while (running.size < getJobConcurrency() && queue.length > 0) {
    const next = queue.shift();
    if (!next) break;
    running.add(next);
    void executeJob(next);
  }
};

export const submitStarSimJob = (request: StarSimRequest): StarSimJobRecord => {
  const jobId = randomUUID();
  const record: InternalJobRecord = {
    job_id: jobId,
    status: "queued",
    created_at_iso: new Date().toISOString(),
    started_at_iso: null,
    completed_at_iso: null,
    requested_lanes: request.requested_lanes ?? [],
    heavy_lanes: (request.requested_lanes ?? []).filter((lane) => heavyLaneSet.has(lane)),
    request_hash: hashStableJson(request),
    queue_position: queue.length + 1,
    result_path: null,
    error: null,
    request,
    result: null,
  };
  jobs.set(jobId, record);
  queue.push(jobId);
  void drainQueue();
  return publicJobRecord(record);
};

export const getStarSimJob = (jobId: string): StarSimJobRecord | null => {
  const job = jobs.get(jobId);
  return job ? publicJobRecord(job) : null;
};

export const getStarSimJobResult = async (jobId: string): Promise<StarSimResponse | null> => {
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
  try {
    const raw = await fs.readFile(job.result_path, "utf8");
    const parsed = JSON.parse(raw) as StarSimResponse;
    job.result = parsed;
    return parsed;
  } catch {
    return null;
  }
};

export const __resetStarSimJobsForTest = (): void => {
  jobs.clear();
  queue.splice(0, queue.length);
  running.clear();
};
