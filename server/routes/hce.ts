import express from "express";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  DEFAULT_HCE_CONFIG,
  type HceConfigPayload,
  type HceConfigResponse,
  type HceMeasureResponse,
  type HceStreamEvent,
} from "@shared/hce-types";
import {
  buildAudioPacket,
  computeEnergies,
  evolveRun,
  frameUniform,
  getFrameIndex,
  getLastFrame,
  getRun,
  hashSeedToUint32,
  initRun,
  removeRun,
  sampleBranch,
} from "../services/hce-core";
import {
  applyLanguageBias,
  describeBranchChoice,
  hashEmbed,
} from "../services/hce-text";
import { hceShareStore } from "../services/hce-share-store";

const peakSchema = z.object({
  omega: z.number().min(-10).max(40),
  gamma: z.number().min(0.01).max(1.5),
  alpha: z.number().min(-2).max(2),
});

const configSchema = z.object({
  seed: z.string().min(1).optional(),
  peaks: z.array(peakSchema).min(1).max(12).optional(),
  rc: z.number().min(0.01).max(1).optional(),
  tau: z.number().min(0.01).max(10).optional(),
  beta: z.number().min(0).max(3).optional(),
  lambda: z.number().min(0).max(1).optional(),
  K: z.number().int().min(2).max(12).optional(),
  latentDim: z.number().int().min(8).max(512).optional(),
  dt: z.number().min(0.005).max(0.5).optional(),
});

const resolvedConfigSchema = z.object({
  seed: z.string().min(1),
  rc: z.number().min(0.01).max(1),
  tau: z.number().min(0.01).max(10),
  beta: z.number().min(0).max(3),
  lambda: z.number().min(0).max(1),
  K: z.number().int().min(2).max(12),
  latentDim: z.number().int().min(8).max(512),
  dt: z.number().min(0.005).max(0.5),
});

const shareSchema = z.object({
  seed: z.number().safe().optional(),
  params: z.object({
    config: resolvedConfigSchema,
    peaks: z.array(peakSchema).min(1).max(12).optional(),
    weirdness: z.number().min(0).max(5).optional(),
    prompt: z.string().max(8_192).optional(),
  }),
});

const shareIdSchema = z.string().uuid();

const measureSchema = z.object({
  runId: z.string().min(1),
  text: z.string().max(8_192),
  weirdness: z.number().min(0).max(5),
  lambda: z.number().min(0).max(1).optional(),
});


export const hceRouter = express.Router();

type RateLimiter = (req: Request, res: Response, next: NextFunction) => void;

const createRateLimiter = (windowMs: number, max: number): RateLimiter => {
  const hits = new Map<string, number[]>();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip ?? (req.headers["x-forwarded-for"] as string) ?? "unknown";
    const history = hits.get(key) ?? [];
    const recent = history.filter((ts) => now - ts < windowMs);
    if (recent.length >= max) {
      res.setHeader("Retry-After", Math.ceil(windowMs / 1000).toString());
      res.status(429).json({ error: "rate-limit" });
      return;
    }
    recent.push(now);
    hits.set(key, recent);
    next();
  };
};

const measureRateLimiter = createRateLimiter(5000, 8);
const streamRateLimiter = createRateLimiter(10000, 6);

const RUN_STALE_TTL_MS = 60_000;
const runCleanupTimers = new Map<string, NodeJS.Timeout>();
const activeRunStreams = new Map<string, number>();

const clearRunCleanup = (runId: string) => {
  const timer = runCleanupTimers.get(runId);
  if (timer) {
    clearTimeout(timer);
    runCleanupTimers.delete(runId);
  }
};

const scheduleRunCleanup = (runId: string) => {
  clearRunCleanup(runId);
  const timer = setTimeout(() => {
    runCleanupTimers.delete(runId);
    activeRunStreams.delete(runId);
    removeRun(runId);
  }, RUN_STALE_TTL_MS);
  timer.unref?.();
  runCleanupTimers.set(runId, timer);
};

hceRouter.use("/measure", measureRateLimiter);
hceRouter.use("/stream", streamRateLimiter);

hceRouter.post(
  "/config",
  (req: Request, res: Response<HceConfigResponse | { error: string; details?: unknown }>) => {
    const parsed = configSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: "invalid-configuration",
        details: parsed.error.flatten(),
      });
    }
    const body = parsed.data;
    const payload: HceConfigPayload = {
      seed: body.seed,
      peaks: body.peaks ?? [],
      rc: body.rc ?? DEFAULT_HCE_CONFIG.rc,
      tau: body.tau ?? DEFAULT_HCE_CONFIG.tau,
      beta: body.beta ?? DEFAULT_HCE_CONFIG.beta,
      lambda: body.lambda ?? DEFAULT_HCE_CONFIG.lambda,
      K: body.K ?? DEFAULT_HCE_CONFIG.K,
      latentDim: body.latentDim ?? DEFAULT_HCE_CONFIG.latentDim,
      dt: body.dt ?? DEFAULT_HCE_CONFIG.dt,
    };
    const run = initRun(payload);
    activeRunStreams.set(run.id, 0);
    scheduleRunCleanup(run.id);
    const response: HceConfigResponse = {
      runId: run.id,
      branchCenters: run.centers.map((center) => Array.from(center)),
      initialState: Array.from(run.psi),
      config: run.config,
    };
    res.json(response);
  },
);

hceRouter.get("/stream", (req: Request, res: Response) => {
  const { runId } = req.query;
  if (typeof runId !== "string") {
    return res.status(400).json({ error: "runId required" });
  }
  const run = getRun(runId);
  if (!run) {
    return res.status(404).json({ error: "run not found" });
  }

  clearRunCleanup(runId);
  activeRunStreams.set(runId, (activeRunStreams.get(runId) ?? 0) + 1);

  const intervalMs = clampNumber(
    typeof req.query.interval === "string" ? Number(req.query.interval) : NaN,
    40,
    500,
    66,
  );
  const temp = clampNumber(
    typeof req.query.temp === "string" ? Number(req.query.temp) : NaN,
    0.01,
    2.5,
    0.2,
  );

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  (res as any).flushHeaders?.();

  let cancelled = false;
  const queue: HceStreamEvent[] = [];
  let backpressured = false;

  const writePayload = (payload: HceStreamEvent | { batch: true; frames: HceStreamEvent[] }) => {
    const chunk = `data: ${JSON.stringify(payload)}\n\n`;
    if (!res.write(chunk)) {
      backpressured = true;
      stopProducer();
      res.once("drain", () => {
        if (cancelled) return;
        backpressured = false;
        startProducer();
        flushQueue();
      });
      return false;
    }
    return true;
  };

  const flushQueue = () => {
    if (cancelled || backpressured) return;
    while (queue.length > 0) {
      if (queue.length === 1) {
        const next = queue.shift();
        if (!next) break;
        if (!writePayload(next)) return;
      } else {
        const frames = queue.splice(0, queue.length);
        if (!writePayload({ batch: true, frames })) return;
      }
    }
  };

  const produceFrame = () => {
    if (cancelled) return;
    const result = evolveRun(run, undefined, temp);
    const event: HceStreamEvent = {
      t: result.time,
      psi: result.psi,
      energies: result.energies,
      suggestedBranch: result.suggestedBranch,
    };
    queue.push(event);
    flushQueue();
  };

  let producer: ReturnType<typeof setInterval> | null = null;
  const startProducer = () => {
    if (!producer && !cancelled) {
      producer = setInterval(produceFrame, intervalMs);
    }
  };
  const stopProducer = () => {
    if (producer) {
      clearInterval(producer);
      producer = null;
    }
  };

  const flushTimer = setInterval(flushQueue, Math.max(50, intervalMs));
  const heartbeat = setInterval(() => {
    if (!cancelled) {
      res.write(`:hb ${Date.now()}\n\n`);
    }
  }, 10_000);

  const last = getLastFrame(runId);
  if (last) {
    res.write(`data: ${JSON.stringify(last)}\n\n`);
  }

  produceFrame();
  startProducer();

  req.on("close", () => {
    cancelled = true;
    stopProducer();
    clearInterval(flushTimer);
    clearInterval(heartbeat);
    res.end();
    const remaining = (activeRunStreams.get(runId) ?? 1) - 1;
    if (remaining <= 0) {
      activeRunStreams.delete(runId);
      scheduleRunCleanup(runId);
    } else {
      activeRunStreams.set(runId, remaining);
    }
  });

});

hceRouter.post(
  "/measure",
  (req: Request, res: Response<HceMeasureResponse | { error: string; details?: unknown }>) => {
    const parsed = measureSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: "invalid-measure-request",
        details: parsed.error.flatten(),
      });
    }
    const { runId, text, weirdness, lambda } = parsed.data;
    const run = getRun(runId);
    if (!run) {
      return res.status(404).json({ error: "run not found" });
    }
    const embedding = hashEmbed(text, run.config.latentDim);
    const baseEnergies = computeEnergies(
      run.psi,
      run.centers,
      typeof lambda === "number" ? lambda : run.config.lambda,
    );
    const biased = applyLanguageBias(
      baseEnergies,
      run.psi,
      run.centers,
      embedding,
      run.config.beta,
    );

    const frameIndex = getFrameIndex(runId);
    const uniform = frameUniform(frameIndex, run.config.seed);
    const branch = sampleBranch(biased, Math.max(weirdness, 0.001), run.prng, uniform);
    const dominant = run.centers[branch];
    if (dominant) {
      const collapseMix = clampNumber(1 - Math.exp(-run.config.dt * 1.5), 0.1, 0.6, 0.35);
      for (let i = 0; i < run.psi.length; i += 1) {
        run.psi[i] = (1 - collapseMix) * run.psi[i] + collapseMix * dominant[i];
      }
    }

    const summary = describeBranchChoice(branch, biased, run.centers, embedding, text);
    const audioParams = buildAudioPacket(run, branch);

    const response: HceMeasureResponse = {
      branch,
      energies: biased,
      summary,
      audioParams,
    };
    res.json(response);
  },
);

hceRouter.post(
  "/share",
  async (req: Request, res: Response<{ runId: string } | { error: string; details?: unknown }>) => {
    const parsed = shareSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: "invalid-share-request",
        details: parsed.error.flatten(),
      });
    }
    try {
      const {
        params: { config, peaks = [], weirdness, prompt },
        seed,
      } = parsed.data;
      const numericSeed = seed ?? hashSeedToUint32(config.seed);
      const runId = await hceShareStore.createShare(numericSeed, {
        config,
        peaks,
        weirdness,
        prompt,
      });
      res.json({ runId });
    } catch (err: any) {
      if (process.env.NODE_ENV !== "test") {
        console.error("[hce] share persist failed", err);
      }
      res.status(500).json({ error: "share-persist-failed" });
    }
  },
);

hceRouter.get(
  "/share/:id",
  async (req: Request, res: Response<{ seed: number; params: unknown } | { error: string }>) => {
    const parsedId = shareIdSchema.safeParse(req.params.id);
    if (!parsedId.success) {
      return res.status(400).json({ error: "invalid-share-id" });
    }
    try {
      const record = await hceShareStore.getShare(parsedId.data);
      if (!record) {
        return res.status(404).json({ error: "share-not-found" });
      }
      res.json(record);
    } catch (err: any) {
      if (process.env.NODE_ENV !== "test") {
        console.error("[hce] share fetch failed", err);
      }
      res.status(500).json({ error: "share-fetch-failed" });
    }
  },
);

function clampNumber(value: number, min: number, max: number, fallback: number) {
  const numeric = Number.isFinite(value) ? value : fallback;
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric < min) return min;
  if (numeric > max) return max;
  return numeric;
}

