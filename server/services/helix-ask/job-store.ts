import crypto from "node:crypto";

export type HelixAskJobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type HelixAskJobRecord = {
  id: string;
  status: HelixAskJobStatus;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  sessionId?: string;
  traceId?: string;
  question?: string;
  partialText?: string;
  result?: Record<string, unknown>;
  error?: string;
};

const readNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const HELIX_ASK_JOB_TTL_MS = clampNumber(
  readNumber(process.env.HELIX_ASK_JOB_TTL_MS, 30 * 60 * 1000),
  60_000,
  6 * 60 * 60 * 1000,
);
const HELIX_ASK_JOB_PARTIAL_MAX_CHARS = clampNumber(
  readNumber(process.env.HELIX_ASK_JOB_PARTIAL_MAX_CHARS, 6000),
  512,
  20000,
);
const HELIX_ASK_JOB_CLEANUP_MS = clampNumber(
  readNumber(process.env.HELIX_ASK_JOB_CLEANUP_MS, 60_000),
  10_000,
  10 * 60_000,
);

const jobs = new Map<string, HelixAskJobRecord>();

const pruneExpired = (): void => {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (job.expiresAt <= now) {
      jobs.delete(id);
    }
  }
};

const cleanupTimer = setInterval(pruneExpired, HELIX_ASK_JOB_CLEANUP_MS);
cleanupTimer.unref?.();

export const createHelixAskJob = (params: {
  sessionId?: string;
  traceId?: string;
  question?: string;
  ttlMs?: number;
}): HelixAskJobRecord => {
  const now = Date.now();
  const ttlMs = clampNumber(params.ttlMs ?? HELIX_ASK_JOB_TTL_MS, 60_000, 6 * 60 * 60 * 1000);
  const job: HelixAskJobRecord = {
    id: crypto.randomUUID(),
    status: "queued",
    createdAt: now,
    updatedAt: now,
    expiresAt: now + ttlMs,
    sessionId: params.sessionId,
    traceId: params.traceId,
    question: params.question,
  };
  jobs.set(job.id, job);
  return job;
};

export const getHelixAskJob = (jobId: string): HelixAskJobRecord | null => {
  const job = jobs.get(jobId);
  if (!job) return null;
  if (job.expiresAt <= Date.now()) {
    jobs.delete(jobId);
    return null;
  }
  return job;
};

const updateJob = (jobId: string, patch: Partial<HelixAskJobRecord>): HelixAskJobRecord | null => {
  const job = getHelixAskJob(jobId);
  if (!job) return null;
  Object.assign(job, patch);
  job.updatedAt = Date.now();
  return job;
};

export const markHelixAskJobRunning = (jobId: string): HelixAskJobRecord | null =>
  updateJob(jobId, { status: "running" });

export const completeHelixAskJob = (
  jobId: string,
  result: Record<string, unknown>,
): HelixAskJobRecord | null =>
  updateJob(jobId, { status: "completed", result, error: undefined });

export const failHelixAskJob = (jobId: string, error: string): HelixAskJobRecord | null =>
  updateJob(jobId, { status: "failed", error, result: undefined });

export const appendHelixAskJobPartial = (jobId: string, chunk: string): void => {
  const job = getHelixAskJob(jobId);
  if (!job || !chunk) return;
  const next = `${job.partialText ?? ""}${chunk}`;
  job.partialText =
    next.length > HELIX_ASK_JOB_PARTIAL_MAX_CHARS
      ? next.slice(-HELIX_ASK_JOB_PARTIAL_MAX_CHARS)
      : next;
  job.updatedAt = Date.now();
};
