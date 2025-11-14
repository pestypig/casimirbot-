import { randomUUID } from "node:crypto";
import { Queue, Worker, QueueEvents, type Job, type JobsOptions, type RedisOptions } from "bullmq";
import { metrics } from "../metrics";

type MediaJobPayload = { input: unknown; ctx: any };
type EssenceCollapsePayload = { envelopeId: string };

type JobName = "media.generate" | "essence.collapse";

type HandlerMap = {
  "media.generate"?: (payload: MediaJobPayload) => Promise<unknown>;
  "essence.collapse"?: (payload: EssenceCollapsePayload) => Promise<unknown>;
};

const defaultEssenceCollapseHandler = async (payload: EssenceCollapsePayload) => ({ ok: true, envelopeId: payload.envelopeId });

const handlers: HandlerMap = {
  "essence.collapse": defaultEssenceCollapseHandler,
};

const activeCounts = new Map<JobName, number>();

const adjustQueueGauge = (name: JobName, delta: number): void => {
  const next = Math.max(0, (activeCounts.get(name) ?? 0) + delta);
  activeCounts.set(name, next);
  metrics.setQueueActive(name, next);
};

const redisUrl = process.env.REDIS_URL?.trim();
let backend: "redis" | "local" = redisUrl ? "redis" : "local";
const getMediaQueueConcurrency = (): number => Math.max(1, Number(process.env.MEDIA_QUEUE_CONCURRENCY ?? 1));

let redisQueue: Queue | null = null;
let redisEvents: QueueEvents | null = null;
let redisWorker: Worker | null = null;
const redisConnection: RedisOptions | null = redisUrl ? buildRedisConnection(redisUrl) : null;

class LocalQueue {
  private running = 0;
  private queue: Array<{
    name: JobName;
    payload: any;
    handler: (payload: any) => Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor(private concurrency: number) {}

  add(name: JobName, payload: any, handler: (payload: any) => Promise<unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.queue.push({ name, payload, handler, resolve, reject });
      this.drain();
    });
  }

  private drain(): void {
    if (this.running >= this.concurrency) {
      return;
    }
    const job = this.queue.shift();
    if (!job) {
      return;
    }
    this.running += 1;
    adjustQueueGauge(job.name, 1);
    job.handler(job.payload)
      .then((result) => job.resolve(result))
      .catch((err) => job.reject(err))
      .finally(() => {
        adjustQueueGauge(job.name, -1);
        this.running = Math.max(0, this.running - 1);
        this.drain();
      });
  }

  getPendingCounts(): Record<JobName, number> {
    const counts: Record<JobName, number> = {
      "media.generate": 0,
      "essence.collapse": 0,
    };
    for (const job of this.queue) {
      counts[job.name] = (counts[job.name] ?? 0) + 1;
    }
    return counts;
  }
}

let localQueue = new LocalQueue(getMediaQueueConcurrency());

function buildRedisConnection(url: string): RedisOptions {
  const parsed = new URL(url);
  const opts: RedisOptions = {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
  };
  if (parsed.username) {
    opts.username = parsed.username;
  }
  if (parsed.password) {
    opts.password = parsed.password;
  }
  if (parsed.pathname.length > 1) {
    const db = Number(parsed.pathname.replace(/^\/+/, ""));
    if (!Number.isNaN(db)) {
      opts.db = db;
    }
  }
  if (parsed.protocol === "rediss:") {
    opts.tls = {};
  }
  return opts;
}

if (backend === "redis" && redisUrl && redisConnection) {
  try {
    redisQueue = new Queue("agi-jobs", { connection: redisConnection });
    redisEvents = new QueueEvents("agi-jobs", { connection: redisConnection });
    redisWorker = new Worker(
      "agi-jobs",
      async (job) => {
        const handler = handlers[job.name as JobName];
        if (!handler) {
          throw new Error(`No handler registered for ${job.name}`);
        }
        return handler(job.data);
      },
      { connection: redisConnection, concurrency: getMediaQueueConcurrency() },
    );
    redisWorker.on("error", (err) => {
      console.error("[queue] worker error", err);
    });
    redisWorker.on("active", (job) => adjustQueueGauge(job.name as JobName, 1));
    const settle = (job?: Job | null) => {
      if (job) {
        adjustQueueGauge(job.name as JobName, -1);
      }
    };
    redisWorker.on("completed", (job) => settle(job));
    redisWorker.on("failed", (job) => settle(job));
  } catch (err) {
    console.warn(`[queue] Redis backend unavailable, falling back to in-memory queue: ${(err as Error).message}`);
    backend = "local";
    redisQueue = null;
    redisEvents = null;
    redisWorker = null;
  }
}

const ensureHandler = (name: JobName): ((payload: any) => Promise<unknown>) => {
  const handler = handlers[name];
  if (!handler) {
    throw new Error(`Queue handler for ${name} not registered`);
  }
  return handler;
};

const addJob = async (name: JobName, payload: any, opts?: JobsOptions): Promise<unknown> => {
  if (backend === "redis" && redisQueue && redisEvents) {
    const job = await redisQueue.add(name, payload, {
      attempts: 1,
      removeOnComplete: true,
      removeOnFail: true,
      jobId: `${name}:${randomUUID()}`,
      ...(opts ?? {}),
    });
    return job.waitUntilFinished(redisEvents);
  }
  return localQueue.add(name, payload, ensureHandler(name));
};

export const registerMediaWorker = (handler: (payload: MediaJobPayload) => Promise<unknown>): void => {
  handlers["media.generate"] = handler;
};

export const enqueueMediaJob = async (payload: MediaJobPayload): Promise<unknown> => {
  return addJob("media.generate", payload);
};

export const enqueueEssenceCollapseJob = async (payload: EssenceCollapsePayload): Promise<unknown> => {
  return addJob("essence.collapse", payload);
};

export const getQueueBackend = (): "redis" | "local" => backend;

export const __resetQueueForTest = (opts?: { concurrency?: number; dropHandlers?: boolean }): void => {
  backend = "local";
  redisQueue = null;
  redisEvents = null;
  redisWorker = null;
  const concurrency = Math.max(1, opts?.concurrency ?? getMediaQueueConcurrency());
  localQueue = new LocalQueue(concurrency);
  activeCounts.clear();
  (["media.generate", "essence.collapse"] as const).forEach((name) => metrics.setQueueActive(name, 0));
  handlers["essence.collapse"] = defaultEssenceCollapseHandler;
  if (opts?.dropHandlers !== false) {
    delete handlers["media.generate"];
  }
};

export const getQueueSnapshot = () => {
  const active: Record<JobName, number> = {
    "media.generate": activeCounts.get("media.generate") ?? 0,
    "essence.collapse": activeCounts.get("essence.collapse") ?? 0,
  };
  const pending = backend === "local" ? localQueue.getPendingCounts() : null;
  return {
    backend,
    active,
    pending,
  };
};
