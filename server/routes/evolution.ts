import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { guardTenant, shouldRequireTenant } from "../auth/tenant";
import {
  appendPatchRecord,
  canonicalizePatchInput,
  derivePatchId,
} from "../services/evolution/patch-store";
import { runCongruenceGate } from "../services/evolution/congruence-gate";
import { loadEvolutionConfig } from "../services/evolution/config";
import { recordEvolutionTrace } from "../services/observability/training-trace-store";
import { getTrajectory } from "../services/evolution/trajectory";

const ingestSchema = z.object({
  title: z.string().min(1),
  touchedPaths: z.array(z.string()).optional(),
  intentTags: z.array(z.string()).optional(),
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

const EVOLUTION_MAX_BODY_BYTES = Number(process.env.EVOLUTION_MAX_BODY_BYTES ?? 65536);

const estimateBodyBytes = (body: unknown): number | null => {
  if (body === null || body === undefined) return 0;
  try {
    return Buffer.byteLength(JSON.stringify(body), "utf8");
  } catch {
    return null;
  }
};

const enforceWriteGuards = (req: Request, res: Response): boolean => {
  const tenantGuard = guardTenant(req, { require: shouldRequireTenant() });
  if (!tenantGuard.ok) {
    res.status(tenantGuard.status).json({ error: tenantGuard.error });
    return false;
  }
  const contentLength = Number(req.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > EVOLUTION_MAX_BODY_BYTES) {
    res.status(413).json({
      error: { code: "EVOLUTION_PAYLOAD_TOO_LARGE", message: "Evolution payload exceeds route limits" },
    });
    return false;
  }
  const estimatedBytes = estimateBodyBytes(req.body);
  if (estimatedBytes !== null && estimatedBytes > EVOLUTION_MAX_BODY_BYTES) {
    res.status(413).json({
      error: { code: "EVOLUTION_PAYLOAD_TOO_LARGE", message: "Evolution payload exceeds route limits" },
    });
    return false;
  }
  return true;
};

export const evolutionRouter = Router();

evolutionRouter.post("/patches/ingest", (req: Request, res: Response) => {
  if (!enforceWriteGuards(req, res)) return;
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

evolutionRouter.post("/gate/run", (req: Request, res: Response) => {
  if (!enforceWriteGuards(req, res)) return;
  const parsed = gateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      error: {
        code: "EVOLUTION_INVALID_REQUEST",
        message: "Invalid gate payload",
        details: parsed.error.flatten(),
      },
    });
  }
  const loaded = loadEvolutionConfig(parsed.data.config);
  if (!loaded.ok) {
    return res.status(400).json({
      error: { code: loaded.code, message: loaded.message, details: loaded.details },
    });
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
