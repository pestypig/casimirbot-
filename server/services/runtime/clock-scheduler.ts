import { beginLlMJob, acquireMediaSlot } from "../hardware/gpu-scheduler";
import type { RuntimeFrameContract, RuntimeLane } from "./frame-contract";
import type { RuntimeTaskClass } from "./tool-metadata";

export type RuntimeCtx = {
  contract: RuntimeFrameContract;
  now?: () => number;
};

export type TaskSpec<TIn, TOut> = {
  id: string;
  class: RuntimeTaskClass;
  lane: RuntimeLane;
  est_cost_ms?: number;
  deadline_ms?: number;
  input: TIn;
  run: (input: TIn, ctx: RuntimeCtx) => Promise<TOut>;
  onDeadline?: "degrade" | "partial" | "cancel";
};

export type ClockATaskResult<TOut> = {
  id: string;
  status: "ok" | "deadline" | "error";
  value?: TOut;
  error?: string;
};

export type ClockAResult = {
  tasks: ClockATaskResult<unknown>[];
  degraded: boolean;
};

export type ClockBDrainResult = {
  ran: number;
  failed: number;
  remaining: number;
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutHandle: NodeJS.Timeout | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error("deadline_exceeded")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
};

const runWithLaneLease = async <T>(lane: RuntimeLane, work: () => Promise<T>): Promise<T> => {
  if (lane === "llm") {
    const release = beginLlMJob();
    try {
      return await work();
    } finally {
      release();
    }
  }
  if (lane === "media") {
    const release = await acquireMediaSlot("clock-scheduler");
    try {
      return await work();
    } finally {
      release();
    }
  }
  return work();
};

export class ClockScheduler {
  private queue: Array<{ task: TaskSpec<unknown, unknown>; ctx: RuntimeCtx }> = [];

  async runClockA(tasks: TaskSpec<unknown, unknown>[], ctx: RuntimeCtx): Promise<ClockAResult> {
    const now = ctx.now ?? Date.now;
    const startedAt = now();
    const maxTasks = ctx.contract.clockA.max_plan_steps;
    const limited = tasks.slice(0, maxTasks);
    const results: ClockATaskResult<unknown>[] = [];
    let degraded = tasks.length > limited.length;

    for (const task of limited) {
      const elapsed = now() - startedAt;
      const remaining = ctx.contract.clockA.hard_deadline_ms - elapsed;
      if (remaining <= 0) {
        degraded = true;
        results.push({ id: task.id, status: "deadline", error: "clock_a_exhausted" });
        continue;
      }
      const deadlineMs = Math.max(1, Math.min(task.deadline_ms ?? remaining, remaining));
      try {
        const value = await runWithLaneLease(task.lane, () =>
          withTimeout(task.run(task.input, ctx), deadlineMs),
        );
        results.push({ id: task.id, status: "ok", value });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const isDeadline = message.includes("deadline_exceeded");
        if (isDeadline) {
          degraded = true;
          if (task.onDeadline === "cancel") {
            results.push({ id: task.id, status: "deadline", error: "cancelled_on_deadline" });
          } else if (task.onDeadline === "partial") {
            results.push({ id: task.id, status: "deadline", error: "partial_on_deadline" });
          } else {
            results.push({ id: task.id, status: "deadline", error: "degraded_on_deadline" });
          }
          continue;
        }
        results.push({
          id: task.id,
          status: "error",
          error: message,
        });
      }
    }

    return { tasks: results, degraded };
  }

  enqueueClockB(task: TaskSpec<unknown, unknown>, ctx: RuntimeCtx): { id: string; queueDepth: number } {
    if (this.queue.length >= ctx.contract.clockB.max_queue_depth) {
      this.queue.shift();
    }
    this.queue.push({ task, ctx });
    return { id: task.id, queueDepth: this.queue.length };
  }


  async drainClockB(maxJobs = 1): Promise<ClockBDrainResult> {
    const safeMax = Math.max(1, Math.floor(maxJobs));
    let ran = 0;
    let failed = 0;
    for (let i = 0; i < safeMax && this.queue.length > 0; i += 1) {
      const next = this.queue.shift();
      if (!next) break;
      try {
        await runWithLaneLease(next.task.lane, () => next.task.run(next.task.input, next.ctx));
        ran += 1;
      } catch {
        failed += 1;
      }
    }
    return { ran, failed, remaining: this.queue.length };
  }

  getQueueDepth(): number {
    return this.queue.length;
  }
}
