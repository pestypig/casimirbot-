import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { appendPatchRecord, canonicalizePatchInput, derivePatchId } from "../services/evolution/patch-store";
import { runCongruenceGate } from "../services/evolution/congruence-gate";
import { loadEvolutionConfig } from "../services/evolution/config";
import { recordEvolutionTrace } from "../services/observability/training-trace-store";
import { getTrajectory } from "../services/evolution/trajectory";

const ingestSchema = z.object({
  title: z.string().min(1),
  touchedPaths: z.array(z.string()).optional(),
  intentTags: z.array(z.string()).optional(),
});

export const evolutionRouter = Router();

evolutionRouter.post("/patches/ingest", (req: Request, res: Response) => {
  const parsed = ingestSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      error: {
        code: "EVOLUTION_INVALID_REQUEST",
        message: "Invalid evolution ingest payload",
        details: parsed.error.flatten(),
      },
    });
  }
  const canonical = canonicalizePatchInput(parsed.data);
  const patchId = derivePatchId(canonical);
  const ts = new Date().toISOString();
  const persisted = appendPatchRecord({ patchId, ts, ...canonical });
  if (!persisted.ok) {
    return res.status(500).json({
      error: {
        code: persisted.code,
        message: persisted.message,
      },
    });
  }
  return res.json({
    patchId,
    persisted: true,
    artifacts: [
      { kind: "evolution-patches-jsonl", ref: persisted.path },
      { kind: "evolution-patch-id", ref: patchId },
    ],
  });
});


const gateSchema = z.object({
  reportOnly: z.boolean().optional(),
  casimirVerdict: z.enum(["PASS", "FAIL"]).optional(),
  contractDriftVoice: z.boolean().optional(),
  contractDriftGoBoard: z.boolean().optional(),
  traceSchemaBreak: z.boolean().optional(),
  apiBreakDetected: z.boolean().optional(),
  indicators: z.object({ I: z.number(), A: z.number(), P: z.number(), E: z.number(), debt: z.number() }),
  config: z.unknown().optional(),
});

evolutionRouter.post("/gate/run", (req: Request, res: Response) => {
  const parsed = gateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "EVOLUTION_INVALID_REQUEST", message: "Invalid gate payload", details: parsed.error.flatten() } });
  }
  const loaded = loadEvolutionConfig(parsed.data.config);
  if (!loaded.ok) {
    return res.status(400).json({ error: { code: loaded.code, message: loaded.message, details: loaded.details } });
  }
  const result = runCongruenceGate({ ...parsed.data, config: loaded.config });
  const score = result.deltas.find((x) => x.id === "congruence_score")?.after;
  recordEvolutionTrace({
    traceId: `evolution:${Date.now()}`,
    pass: result.verdict !== "FAIL",
    verdict: result.verdict,
    firstFail: result.firstFail ?? undefined,
    score: typeof score === "number" ? score : undefined,
    artifacts: result.artifacts,
  });
  return res.json(result);
});


evolutionRouter.get("/trajectory/:id", (req: Request, res: Response) => {
  const trajectory = getTrajectory(req.params.id);
  if (!trajectory) {
    return res.status(404).json({ error: { code: "EVOLUTION_NOT_FOUND", message: "Trajectory not found" } });
  }
  return res.json(trajectory);
});
