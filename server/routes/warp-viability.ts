import { Router } from "express";
import type { Request, Response } from "express";
import { issueWarpViabilityCertificate } from "../../tools/warpViabilityCertificate";
import { verifyCertificateIntegrity } from "../../tools/verifyCertificate";
import type { WarpConfig } from "../../types/warpViability";
import { loadWarpAgentsConfig } from "../../modules/physics/warpAgents";
import { recordTrainingTrace } from "../services/observability/training-trace-store";
import { getGlobalPipelineState, setGlobalPipelineState } from "../energy-pipeline";
import { runWarpFullSolveCalculator } from "../../scripts/warp-full-solve-calculator.js";
import { runWarpVisualOrchestrator } from "../services/warp/visual-orchestrator";
import path from "node:path";
import { z } from "zod";

const router = Router();
const CALCULATOR_OUT_ROOT = path.resolve("artifacts", "research", "full-solve");

const DEFAULT_VIABILITY_POLICY = {
  admissibleStatus: "ADMISSIBLE",
  allowMarginalAsViable: false,
  policy: "warp-viability",
  policyVersion: "default",
};

const resolveViabilityPolicy = async () => {
  try {
    const config = await loadWarpAgentsConfig();
    return {
      admissibleStatus:
        config.viabilityPolicy?.admissibleStatus ??
        DEFAULT_VIABILITY_POLICY.admissibleStatus,
      allowMarginalAsViable:
        config.viabilityPolicy?.allowMarginalAsViable ??
        DEFAULT_VIABILITY_POLICY.allowMarginalAsViable,
      policy: DEFAULT_VIABILITY_POLICY.policy,
      policyVersion: String(config.version),
    };
  } catch {
    return DEFAULT_VIABILITY_POLICY;
  }
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const resolveBaseUrl = (req: Request): string => {
  const protoHeader = req.headers?.["x-forwarded-proto"];
  const hostHeader = req.headers?.["x-forwarded-host"];
  const proto =
    typeof protoHeader === "string"
      ? protoHeader.split(",")[0].trim()
      : req.protocol;
  const host =
    typeof hostHeader === "string"
      ? hostHeader.split(",")[0].trim()
      : req.get("host");
  if (!host) {
    throw new Error("host_unavailable");
  }
  return `${proto}://${host}`;
};

const visualOrchestratorRequestSchema = z
  .object({
    solveInput: z.record(z.string(), z.unknown()).optional(),
    panels: z.array(z.string().min(1)).min(1).max(16).optional(),
    timeoutMs: z.number().int().min(5_000).max(180_000).optional(),
    pixelRatio: z.number().min(0.5).max(4).optional(),
    viewport: z
      .object({
        width: z.number().int().min(640).max(4096).optional(),
        height: z.number().int().min(480).max(4096).optional(),
      })
      .optional(),
    outDir: z.string().min(1).optional(),
    writeArtifacts: z.boolean().optional(),
    visualThreshold: z.number().min(0).max(1).optional(),
    continueOnPanelError: z.boolean().optional(),
  })
  .strict();

const resolveCalculatorOutPath = (candidate: unknown): string | null => {
  if (typeof candidate !== "string" || candidate.trim().length === 0) return null;
  const resolved = path.resolve(candidate);
  const rel = path.relative(CALCULATOR_OUT_ROOT, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return resolved;
};

const buildFirstFail = (constraints: Array<{
  id: string;
  severity: string;
  passed: boolean;
  lhs?: number;
  rhs?: number;
  note?: string;
  details?: string;
}>): { id: string; severity?: string; status?: string; value?: number | null; limit?: string | null; note?: string } | undefined => {
  const failing = constraints.find(
    (constraint) => constraint.severity === "HARD" && !constraint.passed,
  );
  if (!failing) return undefined;
  const limit =
    typeof failing.rhs === "number" && Number.isFinite(failing.rhs)
      ? String(failing.rhs)
      : null;
  return {
    id: failing.id,
    severity: failing.severity,
    status: "fail",
    value:
      typeof failing.lhs === "number" && Number.isFinite(failing.lhs)
        ? failing.lhs
        : null,
    limit,
    note: failing.note ?? failing.details,
  };
};

router.post("/viability", async (req: Request, res: Response) => {
  try {
    const config = (req.body && typeof req.body === "object" ? req.body : {}) as WarpConfig;
    const certificate = await issueWarpViabilityCertificate(config);
    const payload = certificate.payload;
    const integrityOk = verifyCertificateIntegrity(certificate);
    const response = {
      status: payload.status,
      constraints: payload.constraints,
      snapshot: payload.snapshot,
      citations: payload.citations,
      config: payload.config,
      certificate,
      certificateHash: certificate.certificateHash,
      certificateId: certificate.header.id,
      integrityOk,
    };
    const state = getGlobalPipelineState();
    state.warpViability = {
      certificate,
      certificateHash: certificate.certificateHash,
      certificateId: certificate.header.id,
      integrityOk,
      status: payload.status,
      constraints: payload.constraints,
      snapshot: payload.snapshot,
      updatedAt: Date.now(),
    };
    setGlobalPipelineState(state);
    try {
      const policy = await resolveViabilityPolicy();
      const hasCertificate = Boolean(certificate.certificateHash);
      const hardFailures = payload.constraints.filter(
        (constraint) => constraint.severity === "HARD" && !constraint.passed,
      );
      const firstFail = buildFirstFail(payload.constraints);
      const statusOk =
        payload.status === policy.admissibleStatus ||
        (policy.allowMarginalAsViable && payload.status === "MARGINAL");
      const pass =
        integrityOk && hasCertificate && statusOk && hardFailures.length === 0;
      const notes = [`status=${payload.status}`];
      if (!hasCertificate) {
        notes.push("certificate_hash_missing");
      }
      if (!integrityOk) {
        notes.push("certificate_integrity_failed");
      }
      if (!statusOk) {
        notes.push("status_not_allowed");
      }
      if (hardFailures.length) {
        notes.push(`hard_fail=${hardFailures.map((item) => item.id).join(",")}`);
      }
      recordTrainingTrace({
        traceId: `warp-viability:${certificate.header.id}`,
        source: {
          system: "warp-viability",
          component: "warp-viability-route",
          tool: "warp-viability",
          version: "v1",
          proxy: false,
        },
        signal: {
          kind: "warp-viability",
          proxy: false,
          ladder: {
            tier: pass ? "certified" : "diagnostic",
            policy: policy.policy,
            policyVersion: policy.policyVersion,
          },
        },
        pass,
        deltas: [],
        firstFail,
        certificate: {
          status: payload.status,
          certificateHash: certificate.certificateHash ?? null,
          certificateId: certificate.header.id ?? null,
          integrityOk,
        },
        notes: notes.length ? notes : undefined,
      });
    } catch (error) {
      console.warn("[warp-viability] training trace emit failed", error);
    }
    res.json(response);
  } catch (err) {
    console.error("[warp-viability] evaluation failed:", err);
    const message = err instanceof Error ? err.message : "Viability evaluation failed";
    res.status(500).json({ error: "viability_failed", message });
  }
});

router.get("/calculator", async (_req: Request, res: Response) => {
  try {
    const result = await runWarpFullSolveCalculator({
      writeOutput: false,
    });
    res.json(result);
  } catch (err) {
    console.error("[warp-viability] calculator failed:", err);
    const message = err instanceof Error ? err.message : "Calculator execution failed";
    res.status(500).json({ error: "calculator_failed", message });
  }
});

router.post("/calculator", async (req: Request, res: Response) => {
  try {
    const body = isObjectRecord(req.body) ? req.body : {};
    const persist = body.persist === true;
    const outPath = persist ? (resolveCalculatorOutPath(body.outPath) ?? undefined) : undefined;
    if (persist && !outPath) {
      res.status(400).json({
        error: "invalid_out_path",
        message: "outPath must resolve under artifacts/research/full-solve when persist=true.",
      });
      return;
    }

    const inputPayload = isObjectRecord(body.inputPayload) ? body.inputPayload : undefined;
    const inputPath = typeof body.inputPath === "string" && body.inputPath.trim().length > 0 ? body.inputPath : undefined;
    const injectCurvatureSignals = typeof body.injectCurvatureSignals === "boolean" ? body.injectCurvatureSignals : undefined;

    const result = await runWarpFullSolveCalculator({
      inputPath,
      inputPayload: inputPayload as any,
      injectCurvatureSignals,
      outPath,
      writeOutput: persist,
    });
    res.json(result);
  } catch (err) {
    console.error("[warp-viability] calculator failed:", err);
    const message = err instanceof Error ? err.message : "Calculator execution failed";
    res.status(500).json({ error: "calculator_failed", message });
  }
});

router.post("/visual-orchestrator/run", async (req: Request, res: Response) => {
  const parsed = visualOrchestratorRequestSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({
      error: "invalid_request",
      details: parsed.error.issues,
    });
    return;
  }

  let baseUrl: string;
  try {
    baseUrl = resolveBaseUrl(req);
  } catch (err) {
    res.status(400).json({
      error: "invalid_host",
      message: err instanceof Error ? err.message : String(err),
    });
    return;
  }

  try {
    const result = await runWarpVisualOrchestrator({
      baseUrl,
      solveInput: parsed.data.solveInput,
      panels: parsed.data.panels,
      timeoutMs: parsed.data.timeoutMs,
      pixelRatio: parsed.data.pixelRatio,
      viewport: parsed.data.viewport,
      outDir: parsed.data.outDir,
      writeArtifacts: parsed.data.writeArtifacts,
      visualThreshold: parsed.data.visualThreshold,
      continueOnPanelError: parsed.data.continueOnPanelError,
    });
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "playwright_unavailable") {
      res.status(503).json({ error: "render_unavailable", message });
      return;
    }
    if (message === "invalid_out_dir") {
      res.status(400).json({
        error: "invalid_out_dir",
        message:
          "outDir must resolve under artifacts/research/full-solve/visual-orchestrator.",
      });
      return;
    }
    console.error("[warp-viability] visual orchestrator failed:", err);
    res.status(500).json({ error: "visual_orchestrator_failed", message });
  }
});

export const warpViabilityRouter = router;
export default router;
