import { Router } from "express";
import { z } from "zod";
import { collectRefinerySummary } from "../services/agi/refinery-summary";
import { exportRefineryDataset } from "../services/agi/refinery-export";
import { guardTenant } from "../auth/tenant";

export const refineryRouter = Router();

const summaryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(1000).optional(),
});

const exportBodySchema = z.object({
  limit: z.number().int().positive().max(5000).optional(),
  outDir: z.string().optional(),
  realRatio: z.number().min(0).max(1).optional(),
  syntheticRatio: z.number().min(0).max(1).optional(),
  minAlpha: z.number().min(0).max(1).optional(),
  enforceGates: z.boolean().optional(),
  requireNoUnknownExecution: z.boolean().optional(),
  minClientShare: z.number().min(0).max(1).optional(),
  minServerShare: z.number().min(0).max(1).optional(),
  minClientServerShare: z.number().min(0).max(1).optional(),
  maxDocsSharedShare: z.number().min(0).max(1).optional(),
  variantReservoirPath: z.string().optional(),
});

const exportEnabled = (): boolean => process.env.ENABLE_AGI_REFINERY_EXPORT === "1";

refineryRouter.get("/refinery/summary", (req, res) => {
  const tenantGuard = guardTenant(req);
  if (!tenantGuard.ok) {
    return res.status(tenantGuard.status).json({ error: tenantGuard.error });
  }
  const parsed = summaryQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid-query", details: parsed.error.flatten() });
  }
  const summary = collectRefinerySummary({
    limit: parsed.data.limit,
    tenantId: tenantGuard.tenantId,
  });
  res.json(summary);
});

refineryRouter.post("/refinery/export", async (req, res) => {
  if (!exportEnabled()) {
    return res.status(404).json({ error: "export_disabled" });
  }
  const tenantGuard = guardTenant(req);
  if (!tenantGuard.ok) {
    return res.status(tenantGuard.status).json({ error: tenantGuard.error });
  }
  const parsed = exportBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.flatten() });
  }
  try {
    const summary = await exportRefineryDataset({
      limit: parsed.data.limit,
      outDir: parsed.data.outDir,
      realRatio: parsed.data.realRatio,
      syntheticRatio: parsed.data.syntheticRatio,
      minAlpha: parsed.data.minAlpha,
      enforceGates: parsed.data.enforceGates,
      requireNoUnknownExecution: parsed.data.requireNoUnknownExecution,
      minClientShare: parsed.data.minClientShare,
      minServerShare: parsed.data.minServerShare,
      minClientServerShare: parsed.data.minClientServerShare,
      maxDocsSharedShare: parsed.data.maxDocsSharedShare,
      variantReservoirPath: parsed.data.variantReservoirPath,
      tenantId: tenantGuard.tenantId,
      emitTrace: true,
    });
    if (summary.blocked) {
      return res.status(409).json({ export: summary, error: "export_blocked" });
    }
    res.json({ export: summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "export_failed", message });
  }
});
