import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import {
  runGrAgentLoop,
  type GrAgentLoopOptions,
} from "../gr/gr-agent-loop.js";
import {
  grAgentLoopOptionsSchema,
} from "../gr/gr-agent-loop-schema.js";
import {
  getGrAgentLoopRunById,
  getGrAgentLoopRuns,
  getGrAgentLoopKpis,
  recordGrAgentLoopRun,
} from "../services/observability/gr-agent-loop-store.js";

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
});

const grAgentRouter = Router();

grAgentRouter.options("/gr-agent-loop", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

grAgentRouter.options("/gr-agent-loop/:id", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

grAgentRouter.get("/gr-agent-loop/kpis", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const parsed = listQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid-query",
      details: parsed.error.flatten(),
    });
  }
  const { limit } = parsed.data;
  const kpis = getGrAgentLoopKpis({ limit });
  return res.json({ kpis, limit: kpis.window.limit });
});

grAgentRouter.get("/gr-agent-loop", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const parsed = listQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid-query",
      details: parsed.error.flatten(),
    });
  }
  const { limit } = parsed.data;
  const runs = getGrAgentLoopRuns({ limit });
  return res.json({ runs, limit });
});

grAgentRouter.get("/gr-agent-loop/:id", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const record = getGrAgentLoopRunById(req.params.id);
  if (!record) {
    return res.status(404).json({ error: "gr-agent-loop-not-found" });
  }
  return res.json({ run: record });
});

grAgentRouter.post("/gr-agent-loop", async (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const body =
    req.body && typeof req.body === "object"
      ? (req.body as Record<string, unknown>)
      : {};
  const parsed = grAgentLoopOptionsSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid-gr-agent-loop",
      details: parsed.error.flatten(),
    });
  }
  const start = Date.now();
  try {
    const options = parsed.data as GrAgentLoopOptions;
    const result = await runGrAgentLoop(options);
    const durationMs = Date.now() - start;
    const run = recordGrAgentLoopRun({
      result,
      options,
      durationMs,
    });
    return res.json({ run, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[gr-agent] loop failed:", message);
    return res.status(500).json({ error: "gr-agent-loop-failed", message });
  }
});

export { grAgentRouter };
