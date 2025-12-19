import express from "express";
import { z } from "zod";
import { CollapseBenchmarkInput, CollapseBenchmarkRunInput, LatticeSummary, type TLatticeSummary } from "@shared/collapse-benchmark";
import {
  buildCollapseBenchmarkExplain,
  buildCollapseBenchmarkResult,
  executeCollapseRun,
  loadLatticeSummaryFromSidecar,
  resolveDataCutoffIso,
} from "../services/collapse-benchmark";
import { getTelemetrySnapshot } from "../services/star/service";

export const collapseBenchmarksRouter = express.Router();

const coerceNumber = (v: unknown) => {
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return v;
};

const parseJson = (v: unknown) => {
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
};

const CollapseFromSessionQuery = z.object({
  session_id: z.string().min(1),
  session_type: z.string().optional(),
  dt_ms: z.preprocess(coerceNumber, z.number().nonnegative().default(50)),
  r_c_m: z.preprocess(coerceNumber, z.number().positive().optional()).optional(),
  c_mps: z.preprocess(coerceNumber, z.number().positive().optional()).optional(),
  lattice: z.preprocess(parseJson, LatticeSummary.optional()).optional(),
  lattice_sidecar_path: z.string().min(1).optional(),
  expected_lattice_generation_hash: z.string().trim().min(1).optional(),
});

collapseBenchmarksRouter.post("/", (req, res) => {
  try {
    const parsed = CollapseBenchmarkInput.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
    }
    const dataCutoffIso = resolveDataCutoffIso(req.query);
    const result = buildCollapseBenchmarkResult(parsed.data, dataCutoffIso);
    return res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status =
      typeof (err as any)?.status === "number" && Number.isFinite((err as any).status) ? Number((err as any).status) : 400;
    const code = typeof (err as any)?.code === "string" ? String((err as any).code) : "collapse_benchmark_failed";
    if (status === 409) {
      return res.status(status).json({
        error: code,
        message,
        expected: (err as any)?.expected,
        got: (err as any)?.got,
      });
    }
    return res.status(status).json({ error: code, message });
  }
});

collapseBenchmarksRouter.get("/from-session", async (req, res) => {
  const parsedQuery = CollapseFromSessionQuery.safeParse(req.query ?? {});
  if (!parsedQuery.success) {
    return res.status(400).json({ error: "invalid_request", details: parsedQuery.error.flatten() });
  }

  try {
    const data = parsedQuery.data;
    let latticeSummary: TLatticeSummary | undefined = data.lattice;
    if (!latticeSummary && data.lattice_sidecar_path) {
      const loadedLatticeSummary = await loadLatticeSummaryFromSidecar(data.lattice_sidecar_path);
      if (!loadedLatticeSummary) {
        return res
          .status(400)
          .json({ error: "invalid_lattice_sidecar", message: "Failed to derive lattice summary from sidecar" });
      }
      latticeSummary = loadedLatticeSummary;
    }

    const snapshot = getTelemetrySnapshot(data.session_id, data.session_type);
    const tau_ms = snapshot.dp_tau_estimate_ms;
    if (!Number.isFinite(tau_ms) || (tau_ms ?? 0) <= 0) {
      return res.status(404).json({ error: "dp_tau_unavailable", message: "dp_tau_estimate_ms unavailable for session" });
    }

    const baseInput = {
      schema_version: "collapse_benchmark/1" as const,
      dt_ms: data.dt_ms,
      tau_ms,
      r_c_m: data.r_c_m,
      lattice: latticeSummary,
      expected_lattice_generation_hash: data.expected_lattice_generation_hash,
      c_mps: data.c_mps,
    };

    const parsedInput = CollapseBenchmarkInput.safeParse(baseInput);
    if (!parsedInput.success) {
      return res.status(400).json({ error: "invalid_request", details: parsedInput.error.flatten() });
    }

    const dataCutoffIso = resolveDataCutoffIso(req.query);
    const result = buildCollapseBenchmarkResult(parsedInput.data, dataCutoffIso, {
      tau_ms_override: tau_ms,
      tau_source: "session_dp_tau",
    });
    return res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status =
      typeof (err as any)?.status === "number" && Number.isFinite((err as any).status) ? Number((err as any).status) : 400;
    const code =
      typeof (err as any)?.code === "string" ? String((err as any).code) : "collapse_benchmark_from_session_failed";
    if (status === 409) {
      return res.status(status).json({
        error: code,
        message,
        expected: (err as any)?.expected,
        got: (err as any)?.got,
      });
    }
    return res.status(status).json({ error: code, message });
  }
});

collapseBenchmarksRouter.post("/run", (req, res) => {
  try {
    const parsed = CollapseBenchmarkRunInput.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
    }
    const dataCutoffIso = resolveDataCutoffIso(req.query);
    const result = executeCollapseRun(parsed.data, dataCutoffIso);
    return res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status =
      typeof (err as any)?.status === "number" && Number.isFinite((err as any).status) ? Number((err as any).status) : 400;
    const code = typeof (err as any)?.code === "string" ? String((err as any).code) : "collapse_benchmark_run_failed";
    return res.status(status).json({ error: code, message });
  }
});

collapseBenchmarksRouter.post("/explain", (req, res) => {
  try {
    const parsed = CollapseBenchmarkInput.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
    }
    const dataCutoffIso = resolveDataCutoffIso(req.query);
    const result = buildCollapseBenchmarkExplain(parsed.data, dataCutoffIso);
    return res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status =
      typeof (err as any)?.status === "number" && Number.isFinite((err as any).status) ? Number((err as any).status) : 400;
    const code = typeof (err as any)?.code === "string" ? String((err as any).code) : "collapse_benchmark_explain_failed";
    if (status === 409) {
      return res.status(status).json({
        error: code,
        message,
        expected: (err as any)?.expected,
        got: (err as any)?.got,
      });
    }
    return res.status(status).json({ error: code, message });
  }
});
