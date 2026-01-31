import crypto from "node:crypto";
import { ensureDatabase, getPool } from "../../db/client";

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

type HelixAskJobStore = {
  create: (params: HelixAskJobCreateParams) => Promise<HelixAskJobRecord>;
  get: (jobId: string) => Promise<HelixAskJobRecord | null>;
  markRunning: (jobId: string) => Promise<HelixAskJobRecord | null>;
  complete: (jobId: string, result: Record<string, unknown>) => Promise<HelixAskJobRecord | null>;
  fail: (jobId: string, error: string) => Promise<HelixAskJobRecord | null>;
  appendPartial: (jobId: string, chunk: string) => Promise<void>;
  cleanupExpired: () => Promise<void>;
  reapStale: (cutoffMs: number, reason: string) => Promise<void>;
};

type HelixAskJobCreateParams = {
  sessionId?: string;
  traceId?: string;
  question?: string;
  ttlMs?: number;
};

type HelixAskJobRow = {
  id: string;
  status: HelixAskJobStatus;
  created_at: Date | string;
  updated_at: Date | string;
  expires_at: Date | string;
  session_id?: string | null;
  trace_id?: string | null;
  question?: string | null;
  partial_text?: string | null;
  result_json?: unknown | null;
  error?: string | null;
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
const HELIX_ASK_JOB_STALE_MS = clampNumber(
  readNumber(
    process.env.HELIX_ASK_JOB_STALE_MS ?? process.env.HELIX_ASK_JOB_TIMEOUT_MS,
    10 * 60 * 1000,
  ),
  60_000,
  6 * 60 * 60 * 1000,
);
const HELIX_ASK_JOB_STALE_REASON = "helix_ask_orphaned";

const memoryJobs = new Map<string, HelixAskJobRecord>();

const pruneMemoryExpired = (): void => {
  const now = Date.now();
  for (const [id, job] of memoryJobs.entries()) {
    if (job.expiresAt <= now) {
      memoryJobs.delete(id);
    }
  }
};

const toMs = (value: Date | string | number): number => {
  if (value instanceof Date) {
    return value.getTime();
  }
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : Date.now();
};

const coerceResult = (value: unknown): Record<string, unknown> | undefined => {
  if (!value) return undefined;
  if (typeof value === "object") return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const rowToJob = (row: HelixAskJobRow): HelixAskJobRecord => ({
  id: row.id,
  status: row.status,
  createdAt: toMs(row.created_at),
  updatedAt: toMs(row.updated_at),
  expiresAt: toMs(row.expires_at),
  sessionId: row.session_id ?? undefined,
  traceId: row.trace_id ?? undefined,
  question: row.question ?? undefined,
  partialText: row.partial_text ?? undefined,
  result: coerceResult(row.result_json),
  error: row.error ?? undefined,
});

const memoryStore: HelixAskJobStore = {
  create: async (params) => {
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
    memoryJobs.set(job.id, job);
    return job;
  },
  get: async (jobId) => {
    const job = memoryJobs.get(jobId);
    if (!job) return null;
    if (job.expiresAt <= Date.now()) {
      memoryJobs.delete(jobId);
      return null;
    }
    return job;
  },
  markRunning: async (jobId) => {
    const job = await memoryStore.get(jobId);
    if (!job) return null;
    Object.assign(job, { status: "running", updatedAt: Date.now() });
    return job;
  },
  complete: async (jobId, result) => {
    const job = await memoryStore.get(jobId);
    if (!job) return null;
    Object.assign(job, { status: "completed", result, error: undefined, updatedAt: Date.now() });
    return job;
  },
  fail: async (jobId, error) => {
    const job = await memoryStore.get(jobId);
    if (!job) return null;
    Object.assign(job, { status: "failed", error, result: undefined, updatedAt: Date.now() });
    return job;
  },
  appendPartial: async (jobId, chunk) => {
    const job = await memoryStore.get(jobId);
    if (!job || !chunk) return;
    const next = `${job.partialText ?? ""}${chunk}`;
    job.partialText =
      next.length > HELIX_ASK_JOB_PARTIAL_MAX_CHARS
        ? next.slice(-HELIX_ASK_JOB_PARTIAL_MAX_CHARS)
        : next;
    job.updatedAt = Date.now();
  },
  cleanupExpired: async () => {
    pruneMemoryExpired();
  },
  reapStale: async (cutoffMs, reason) => {
    for (const job of memoryJobs.values()) {
      if ((job.status === "running" || job.status === "queued") && job.updatedAt < cutoffMs) {
        Object.assign(job, { status: "failed", error: reason, result: undefined, updatedAt: Date.now() });
      }
    }
  },
};

const getDbPool = async () => {
  await ensureDatabase();
  return getPool();
};

const dbStore: HelixAskJobStore = {
  create: async (params) => {
    const now = Date.now();
    const ttlMs = clampNumber(params.ttlMs ?? HELIX_ASK_JOB_TTL_MS, 60_000, 6 * 60 * 60 * 1000);
    const expiresAt = new Date(now + ttlMs);
    const id = crypto.randomUUID();
    const pool = await getDbPool();
    await pool.query(
      `INSERT INTO helix_ask_jobs
        (id, status, created_at, updated_at, expires_at, session_id, trace_id, question)
        VALUES ($1, $2, now(), now(), $3, $4, $5, $6)`,
      [id, "queued", expiresAt, params.sessionId ?? null, params.traceId ?? null, params.question ?? null],
    );
    return {
      id,
      status: "queued",
      createdAt: now,
      updatedAt: now,
      expiresAt: expiresAt.getTime(),
      sessionId: params.sessionId,
      traceId: params.traceId,
      question: params.question,
    };
  },
  get: async (jobId) => {
    const pool = await getDbPool();
    const { rows } = await pool.query<HelixAskJobRow>(
      `SELECT * FROM helix_ask_jobs WHERE id = $1 AND expires_at > now()`,
      [jobId],
    );
    if (rows.length === 0) {
      return null;
    }
    return rowToJob(rows[0]);
  },
  markRunning: async (jobId) => {
    const pool = await getDbPool();
    const { rows } = await pool.query<HelixAskJobRow>(
      `UPDATE helix_ask_jobs
       SET status = $2, updated_at = now()
       WHERE id = $1 AND expires_at > now()
       RETURNING *`,
      [jobId, "running"],
    );
    return rows[0] ? rowToJob(rows[0]) : null;
  },
  complete: async (jobId, result) => {
    const pool = await getDbPool();
    const { rows } = await pool.query<HelixAskJobRow>(
      `UPDATE helix_ask_jobs
       SET status = $2, result_json = $3, error = NULL, updated_at = now()
       WHERE id = $1 AND expires_at > now()
       RETURNING *`,
      [jobId, "completed", result],
    );
    return rows[0] ? rowToJob(rows[0]) : null;
  },
  fail: async (jobId, error) => {
    const pool = await getDbPool();
    const { rows } = await pool.query<HelixAskJobRow>(
      `UPDATE helix_ask_jobs
       SET status = $2, error = $3, result_json = NULL, updated_at = now()
       WHERE id = $1 AND expires_at > now()
       RETURNING *`,
      [jobId, "failed", error],
    );
    return rows[0] ? rowToJob(rows[0]) : null;
  },
  appendPartial: async (jobId, chunk) => {
    if (!chunk) return;
    const pool = await getDbPool();
    const { rows } = await pool.query<{ partial_text: string | null }>(
      `SELECT partial_text FROM helix_ask_jobs WHERE id = $1 AND expires_at > now()`,
      [jobId],
    );
    if (rows.length === 0) return;
    const next = `${rows[0].partial_text ?? ""}${chunk}`;
    const trimmed =
      next.length > HELIX_ASK_JOB_PARTIAL_MAX_CHARS
        ? next.slice(-HELIX_ASK_JOB_PARTIAL_MAX_CHARS)
        : next;
    await pool.query(
      `UPDATE helix_ask_jobs SET partial_text = $2, updated_at = now() WHERE id = $1`,
      [jobId, trimmed],
    );
  },
  cleanupExpired: async () => {
    const pool = await getDbPool();
    await pool.query(`DELETE FROM helix_ask_jobs WHERE expires_at <= now()`);
  },
  reapStale: async (cutoffMs, reason) => {
    const pool = await getDbPool();
    const cutoff = new Date(cutoffMs);
    await pool.query(
      `UPDATE helix_ask_jobs
       SET status = $2, error = $3, result_json = NULL, updated_at = now()
       WHERE status IN ('queued', 'running') AND updated_at < $1`,
      [cutoff, "failed", reason],
    );
  },
};

const shouldUseMemoryStore = (): boolean => {
  const explicit = process.env.HELIX_ASK_JOB_STORE?.trim().toLowerCase();
  if (explicit === "memory" || explicit === "mem" || explicit === "inmemory") {
    return true;
  }
  return process.env.USE_INMEM_HELIX_ASK_JOB_STORE === "1";
};

let resolvedStore: HelixAskJobStore | null = null;
let warnedStoreError = false;
let forceMemory = shouldUseMemoryStore();
const HAS_DATABASE_URL = Boolean(process.env.DATABASE_URL);

const resolveStore = async (): Promise<HelixAskJobStore> => {
  if (forceMemory || !HAS_DATABASE_URL) {
    resolvedStore = memoryStore;
    return resolvedStore;
  }
  if (resolvedStore) {
    return resolvedStore;
  }
  try {
    await ensureDatabase();
    resolvedStore = dbStore;
    return resolvedStore;
  } catch (error) {
    if (!warnedStoreError) {
      warnedStoreError = true;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[helix.ask] job store unavailable: ${message}`);
    }
    throw error;
  }
};

const safeRun = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (!warnedStoreError) {
      warnedStoreError = true;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[helix.ask] job store error: ${message}`);
    }
    return fallback;
  }
};

const cleanupTimer = setInterval(() => {
  const cutoff = Date.now() - HELIX_ASK_JOB_STALE_MS;
  void resolveStore()
    .then((store) => Promise.all([store.cleanupExpired(), store.reapStale(cutoff, HELIX_ASK_JOB_STALE_REASON)]))
    .catch(() => undefined);
}, HELIX_ASK_JOB_CLEANUP_MS);
cleanupTimer.unref?.();

export const createHelixAskJob = async (params: HelixAskJobCreateParams): Promise<HelixAskJobRecord> => {
  const store = await resolveStore();
  return store.create(params);
};

export const getHelixAskJob = async (jobId: string): Promise<HelixAskJobRecord | null> => {
  const store = await resolveStore();
  return safeRun(() => store.get(jobId), null);
};

export const markHelixAskJobRunning = async (
  jobId: string,
): Promise<HelixAskJobRecord | null> => {
  const store = await resolveStore();
  return safeRun(() => store.markRunning(jobId), null);
};

export const completeHelixAskJob = async (
  jobId: string,
  result: Record<string, unknown>,
): Promise<HelixAskJobRecord | null> => {
  const store = await resolveStore();
  return safeRun(() => store.complete(jobId, result), null);
};

export const failHelixAskJob = async (
  jobId: string,
  error: string,
): Promise<HelixAskJobRecord | null> => {
  const store = await resolveStore();
  return safeRun(() => store.fail(jobId, error), null);
};

export const appendHelixAskJobPartial = (jobId: string, chunk: string): void => {
  void resolveStore()
    .then((store) => store.appendPartial(jobId, chunk))
    .catch(() => undefined);
};
