import fs from "node:fs";
import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import {
  trainingTraceCertificateSchema,
  trainingTraceConstraintSchema,
  trainingTraceDeltaSchema,
  trainingTraceMetricsSchema,
  trainingTracePayloadSchema,
  predictionObservationLedgerSchema,
  trainingTraceSignalSchema,
  trainingTraceSourceSchema,
  trainingTraceCalibrationSchema,
  trainingTraceHilPacketSchema,
} from "../../shared/schema.js";
import { guardTenant, shouldRequireTenant } from "../auth/tenant";
import {
  getTrainingTraceById,
  getTrainingTraceExport,
  getTrainingTraceLogPath,
  getTrainingTraces,
  recordTrainingTrace,
} from "../services/observability/training-trace-store.js";

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Tenant-Id, X-Customer-Id, X-Org-Id, traceparent, tracestate",
  );
  res.setHeader("Access-Control-Expose-Headers", "traceparent, tracestate");
};

const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
  tenantId: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
});

const exportQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100000).optional(),
  tenantId: z.string().min(1).optional(),
});

const trainingTraceInputSchema = z.object({
  traceId: z.string().min(1).optional(),
  tenantId: z.string().min(1).optional(),
  source: trainingTraceSourceSchema.optional(),
  calibration: trainingTraceCalibrationSchema.optional(),
  hil_packet: trainingTraceHilPacketSchema.optional(),
  signal: trainingTraceSignalSchema.optional(),
  pass: z.boolean(),
  deltas: z.array(trainingTraceDeltaSchema).optional(),
  metrics: trainingTraceMetricsSchema.optional(),
  firstFail: trainingTraceConstraintSchema.optional(),
  certificate: trainingTraceCertificateSchema.optional(),
  predictionObservationLedger: predictionObservationLedgerSchema.optional(),
  payload: trainingTracePayloadSchema.optional(),
  notes: z.array(z.string()).optional(),
  eventRefs: z.array(z.string()).optional(),
  ts: z.string().optional(),
  id: z.string().optional(),
});

const trainingTraceRouter = Router();

const isAgiRequest = (req: Request): boolean =>
  req.baseUrl?.startsWith("/api/agi") ?? false;

const normalizeTenantId = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const parseBoundedInt = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(min, Math.floor(parsed)), max);
};

const TRAINING_TRACE_MAX_BYTES = parseBoundedInt(
  process.env.TRAINING_TRACE_MAX_BYTES,
  250000,
  1024,
  5000000,
);

const estimateBodyBytes = (value: unknown): number | null => {
  try {
    const raw = JSON.stringify(value);
    return Buffer.byteLength(raw, "utf8");
  } catch {
    return null;
  }
};

const resolveTenant = (
  req: Request,
  candidate?: string,
):
  | { ok: true; tenantId?: string }
  | { ok: false; status: number; error: string } => {
  const guard = guardTenant(req, {
    require: isAgiRequest(req) && shouldRequireTenant(),
  });
  if (!guard.ok) return guard;
  const candidateId = normalizeTenantId(candidate);
  if (guard.tenantId && candidateId && guard.tenantId !== candidateId) {
    return { ok: false, status: 403, error: "tenant-mismatch" };
  }
  return { ok: true, tenantId: guard.tenantId ?? candidateId };
};

trainingTraceRouter.options("/training-trace", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

trainingTraceRouter.options("/training-trace/export", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

trainingTraceRouter.options("/training-trace/:id", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

trainingTraceRouter.get("/training-trace/export", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const parsed = exportQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid-query",
      details: parsed.error.flatten(),
    });
  }
  const tenantGuard = resolveTenant(req, parsed.data.tenantId);
  if (!tenantGuard.ok) {
    return res.status(tenantGuard.status).json({ error: tenantGuard.error });
  }
  const tenantId = tenantGuard.tenantId;
  const logPath = getTrainingTraceLogPath();
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=\"training-trace.jsonl\"",
  );
  if (!tenantId && fs.existsSync(logPath)) {
    const stream = fs.createReadStream(logPath);
    stream.on("error", (error) => {
      console.warn("[training-trace] export failed", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "training-trace-export-failed" });
      } else {
        res.end();
      }
    });
    stream.pipe(res);
    return;
  }
  const { limit } = parsed.data;
  const traces = getTrainingTraceExport({ limit, tenantId });
  const jsonl = traces.map((trace) => JSON.stringify(trace)).join("\n");
  return res.send(jsonl ? `${jsonl}\n` : "");
});

trainingTraceRouter.get("/training-trace", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const parsed = listQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid-query",
      details: parsed.error.flatten(),
    });
  }
  const tenantGuard = resolveTenant(req, parsed.data.tenantId);
  if (!tenantGuard.ok) {
    return res.status(tenantGuard.status).json({ error: tenantGuard.error });
  }
  const { limit, source } = parsed.data;
  const traces = getTrainingTraces({ limit, tenantId: tenantGuard.tenantId })
    .filter((trace) => !source || trace.notes?.includes(`source=${source}`));
  return res.json({ traces, limit });
});

trainingTraceRouter.get("/training-trace/:id", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const tenantGuard = resolveTenant(req);
  if (!tenantGuard.ok) {
    return res.status(tenantGuard.status).json({ error: tenantGuard.error });
  }
  const record = getTrainingTraceById(req.params.id, tenantGuard.tenantId);
  if (!record) {
    return res.status(404).json({ error: "training-trace-not-found" });
  }
  return res.json({ trace: record });
});

trainingTraceRouter.post("/training-trace", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const contentLength = Number(req.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > TRAINING_TRACE_MAX_BYTES) {
    return res.status(413).json({
      error: "payload_too_large",
      limitBytes: TRAINING_TRACE_MAX_BYTES,
    });
  }
  const body =
    req.body && typeof req.body === "object"
      ? (req.body as Record<string, unknown>)
      : {};
  const estimatedBytes = estimateBodyBytes(body);
  if (estimatedBytes !== null && estimatedBytes > TRAINING_TRACE_MAX_BYTES) {
    return res.status(413).json({
      error: "payload_too_large",
      limitBytes: TRAINING_TRACE_MAX_BYTES,
    });
  }
  const parsed = trainingTraceInputSchema.safeParse(body);
  if (!parsed.success) {
    const hasCalibrationPacket =
      Object.prototype.hasOwnProperty.call(body, "calibration") &&
      body.calibration !== undefined;
    const calibrationParsed = hasCalibrationPacket
      ? trainingTraceCalibrationSchema.safeParse((body as { calibration?: unknown }).calibration)
      : { success: true as const };
    if (!calibrationParsed.success) {
      return res.status(400).json({
        error: "invalid-training-trace",
        reason: "MALFORMED_CALIBRATION_PACKET",
        details: calibrationParsed.error.flatten(),
      });
    }
    return res.status(400).json({
      error: "invalid-training-trace",
      details: parsed.error.flatten(),
    });
  }
  const tenantGuard = resolveTenant(req, parsed.data.tenantId);
  if (!tenantGuard.ok) {
    return res.status(tenantGuard.status).json({ error: tenantGuard.error });
  }
  const trace = recordTrainingTrace({
    ...parsed.data,
    tenantId: tenantGuard.tenantId,
  });
  return res.json({ trace });
});

export { trainingTraceRouter };
