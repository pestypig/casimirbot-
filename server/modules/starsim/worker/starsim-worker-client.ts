import { randomUUID } from "node:crypto";
import { Worker } from "node:worker_threads";
import type { CanonicalStar } from "../contract";
import type {
  OscillationGyreWorkerResult,
  StarSimWorkerRequest,
  StarSimWorkerResponse,
  StructureMesaWorkerResult,
} from "./starsim-worker-types";

type PendingTask = {
  resolve: (value: StructureMesaWorkerResult | OscillationGyreWorkerResult) => void;
  reject: (err: Error) => void;
  timeout?: NodeJS.Timeout;
};

const STAR_SIM_WORKER_TIMEOUT_MS = (() => {
  const value = Number(process.env.STAR_SIM_WORKER_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0 ? value : 0;
})();

let starSimWorker: Worker | null = null;
const pending = new Map<string, PendingTask>();

const resolveTsExecArgv = () => {
  const major = Number(process.versions.node.split(".")[0]);
  return major >= 20 ? ["--import", "tsx"] : ["--loader", "tsx"];
};

const handleWorkerMessage = (message: StarSimWorkerResponse) => {
  const task = pending.get(message.id);
  if (!task) return;
  pending.delete(message.id);
  if (task.timeout) clearTimeout(task.timeout);
  if (message.ok) {
    task.resolve(message.payload);
    return;
  }
  const error = new Error(message.error);
  if (message.stack) error.stack = message.stack;
  task.reject(error);
};

const rejectAllPending = (error: Error) => {
  for (const [id, task] of pending.entries()) {
    pending.delete(id);
    if (task.timeout) clearTimeout(task.timeout);
    task.reject(error);
  }
};

const createWorker = () => {
  const worker = new Worker(new URL("./starsim-worker.ts", import.meta.url), {
    execArgv: resolveTsExecArgv(),
    type: "module",
  });
  worker.on("message", handleWorkerMessage);
  worker.on("error", (error) => {
    rejectAllPending(error instanceof Error ? error : new Error(String(error)));
    starSimWorker = null;
  });
  worker.on("exit", (code) => {
    if (code !== 0) {
      rejectAllPending(new Error(`Star-sim worker exited with code ${code}`));
    }
    starSimWorker = null;
  });
  return worker;
};

const ensureWorker = () => {
  if (!starSimWorker) {
    starSimWorker = createWorker();
  }
  return starSimWorker;
};

const submitTask = <T extends StructureMesaWorkerResult | OscillationGyreWorkerResult>(
  request: StarSimWorkerRequest,
): Promise<T> => {
  const worker = ensureWorker();
  return new Promise<T>((resolve, reject) => {
    const task: PendingTask = {
      resolve: (value) => resolve(value as T),
      reject,
    };
    if (STAR_SIM_WORKER_TIMEOUT_MS > 0) {
      task.timeout = setTimeout(() => {
        pending.delete(request.id);
        reject(new Error("Star-sim worker timed out"));
      }, STAR_SIM_WORKER_TIMEOUT_MS);
    }
    pending.set(request.id, task);
    worker.postMessage(request);
  });
};

export const runStructureMesaInWorker = (star: CanonicalStar, cacheKey: string) =>
  submitTask<StructureMesaWorkerResult>({
    id: randomUUID(),
    kind: "structure_mesa",
    star,
    cache_key: cacheKey,
  });

export const runOscillationGyreInWorker = (args: {
  star: CanonicalStar;
  cacheKey: string;
  structureCacheKey: string;
  structureClaimId: string;
  structureSummary: Record<string, unknown>;
}) =>
  submitTask<OscillationGyreWorkerResult>({
    id: randomUUID(),
    kind: "oscillation_gyre",
    star: args.star,
    cache_key: args.cacheKey,
    structure_cache_key: args.structureCacheKey,
    structure_claim_id: args.structureClaimId,
    structure_summary: args.structureSummary,
  });

export const __resetStarSimWorkerForTest = async (): Promise<void> => {
  for (const [id, task] of pending.entries()) {
    pending.delete(id);
    if (task.timeout) clearTimeout(task.timeout);
    task.reject(new Error("Star-sim worker reset for test"));
  }
  if (starSimWorker) {
    const worker = starSimWorker;
    starSimWorker = null;
    await worker.terminate();
  }
};
