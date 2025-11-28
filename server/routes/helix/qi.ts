import express, { type Response } from "express";
import { computeQiDiagnostics } from "../../modules/qi/diagnostics";
import { getGlobalPipelineState } from "../../energy-pipeline";
import type { QiDiagnosticsRequest } from "@shared/qi-diagnostics";

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const helixQiRouter = express.Router();

helixQiRouter.options("/diagnostics", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixQiRouter.get("/diagnostics", (req, res) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");

  const q = req.query as Record<string, unknown>;
  const radius = Number(q.radius ?? q.radius_m);
  const weightsRaw =
    typeof q.weights === "string"
      ? (q.weights as string).split(",").map((v) => Number(v.trim()))
      : Array.isArray(q.weights)
      ? (q.weights as unknown[]).map((v) => Number(v))
      : undefined;

  const input: QiDiagnosticsRequest = {
    radius_m: Number.isFinite(radius) ? radius : undefined,
    weights: Array.isArray(weightsRaw) && weightsRaw.length >= 3 ? (weightsRaw.slice(0, 3) as any) : undefined,
  };

  try {
    const state = getGlobalPipelineState();
    const payload = computeQiDiagnostics(state, input);
    res.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[helix-qi] diagnostics error:", message);
    res.status(500).json({ error: "diagnostics_failed", message });
  }
});

export { helixQiRouter };
