import express from "express";
import { CurvatureUnitInput } from "@shared/essence-physics";
import {
  CurvatureDiagnosticsRecord,
  CurvatureDiagnosticsRunInput,
} from "@shared/curvature-diagnostics";
import { getBlob, putBlob } from "../storage";
import { runCurvatureUnitWithProvenance, curvatureUnitHandler } from "../skills/physics.curvature";
import { recordCurvatureDiagnostics, getCurvatureDiagnostics, subscribeCurvatureDiagnostics } from "../services/physics/curvature-diagnostics-store";
import { sha256Hex } from "../utils/information-boundary";
import { stableJsonStringify } from "../utils/stable-json";

export const curvatureRouter = express.Router();

const readStreamToBuffer = async (
  stream: NodeJS.ReadableStream,
): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<unknown>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as any));
  }
  return Buffer.concat(chunks);
};

const extractHash = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.startsWith("sha256:")) return trimmed.slice("sha256:".length);
  if (trimmed.startsWith("cid:")) return trimmed.slice("cid:".length);
  if (trimmed.startsWith("storage://fs/")) {
    return trimmed.slice("storage://fs/".length);
  }
  if (trimmed.startsWith("storage://s3/")) {
    const parts = trimmed.split("/").filter(Boolean);
    return parts.at(-1) ?? trimmed;
  }
  return trimmed;
};

const toCidLocator = (hash: string): string => `cid:${extractHash(hash)}`;

curvatureRouter.post("/unit", async (req, res) => {
  const parsed = CurvatureUnitInput.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
  }

  try {
    const personaId = typeof req.auth?.sub === "string" ? req.auth.sub : "persona:api";
    const result = await curvatureUnitHandler(parsed.data, { personaId });
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: "curvature_unit_failed", message });
  }
});

curvatureRouter.post("/run", async (req, res) => {
  const parsed = CurvatureDiagnosticsRunInput.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
  }
  try {
    const personaId = typeof req.auth?.sub === "string" ? req.auth.sub : "persona:api";
    const { ridge_tracking, ...curvatureInput } = parsed.data;
    const run = await runCurvatureUnitWithProvenance(curvatureInput, { personaId });
    const createdAt = new Date().toISOString();
    const ridgeTrackingHash = ridge_tracking
      ? `sha256:${sha256Hex(
          Buffer.from(stableJsonStringify(ridge_tracking), "utf8"),
        )}`
      : undefined;
    const record = CurvatureDiagnosticsRecord.parse({
      schema_version: "curvature_diagnostics/1",
      created_at: createdAt,
      essence_id: run.envelope_id,
      envelope: run.envelope,
      information_boundary: run.information_boundary,
      hashes: {
        ...run.hashes,
        ...(ridgeTrackingHash ? { ridge_tracking_hash: ridgeTrackingHash } : {}),
      },
      ...(ridge_tracking ? { ridge_tracking } : {}),
      result: run.result,
    });
    const payloadJson = stableJsonStringify(record);
    const payloadBuf = Buffer.from(payloadJson, "utf8");
    const payloadHash = sha256Hex(payloadBuf);
    const blob = await putBlob(payloadBuf, { contentType: "application/json" });
    const trackingKey =
      run.result.inputs.u_manifest?.device_id ??
      (typeof req.auth?.sub === "string" ? req.auth.sub : "persona:api");
    recordCurvatureDiagnostics({
      result_hash: `sha256:${payloadHash}`,
      essence_id: run.envelope_id,
      k_metrics: run.result.summary.k_metrics,
      ridge_summary: run.result.summary.ridge_summary,
      ridges: run.result.ridges?.spines,
      drive_hz: ridge_tracking?.drive_hz,
      max_link_distance_m: ridge_tracking?.max_link_distance_m,
      track_window: ridge_tracking?.track_window,
      tracking_key: trackingKey,
      ts: createdAt,
    });
    return res.json({
      result_hash: `sha256:${payloadHash}`,
      result_cid: blob.cid,
      result_url: blob.uri,
      record,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: "curvature_run_failed", message });
  }
});

curvatureRouter.get("/result/:hash", async (req, res) => {
  const rawHash = typeof req.params.hash === "string" ? req.params.hash : "";
  if (!rawHash) {
    return res.status(400).json({ error: "invalid_request", message: "hash is required" });
  }
  try {
    const locator = toCidLocator(rawHash);
    const stream = await getBlob(locator);
    const buffer = await readStreamToBuffer(stream);
    const parsed = CurvatureDiagnosticsRecord.parse(JSON.parse(buffer.toString("utf8")));
    return res.json({
      result_hash: `sha256:${extractHash(rawHash)}`,
      record: parsed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(404).json({ error: "curvature_result_not_found", message });
  }
});

curvatureRouter.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
  res.write(`event: ping\ndata: {}\n\n`);

  const limitParam = req.query?.limit;
  const limit = Array.isArray(limitParam)
    ? Number(limitParam[0])
    : Number(limitParam ?? 50);
  const initial = getCurvatureDiagnostics(Number.isFinite(limit) ? limit : 50);
  for (const event of initial.reverse()) {
    res.write(`id: ${event.seq}\ndata: ${JSON.stringify(event)}\n\n`);
  }

  const heartbeat = setInterval(() => {
    try {
      res.write(`event: ping\ndata: {}\n\n`);
    } catch {
      // ignore write failures; close handler will clean up
    }
  }, 20000);

  const unsubscribe = subscribeCurvatureDiagnostics((event) => {
    res.write(`id: ${event.seq}\ndata: ${JSON.stringify(event)}\n\n`);
  });

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});
