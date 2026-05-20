import express, { type Request, type Response, type NextFunction } from "express";
import type { HelixEnvironmentSourceHeartbeat, HelixEnvironmentSourceManifest } from "@shared/helix-environment-source-manifest";
import type { HelixEnvironmentProbeResult } from "@shared/helix-environment-probe";
import { auditEnvironmentSourceContract } from "../services/situation-room/environment-source-contract-validator";
import { registerEnvironmentSourceManifest, getEnvironmentSourceManifest } from "../services/situation-room/environment-source-registry";
import { recordEnvironmentSourceHeartbeat } from "../services/situation-room/environment-source-heartbeat-store";
import { projectEnvironmentSourceAvailability } from "../services/situation-room/environment-source-availability-projector";
import {
  listPendingEnvironmentProbeRequests,
  recordEnvironmentProbeResult,
} from "../services/situation-room/environment-probe-broker";

export const environmentSourceRouter = express.Router();

const sensorToken = (): string | null =>
  process.env.HELIX_ENVIRONMENT_SENSOR_TOKEN ??
  process.env.HELIX_MINECRAFT_SENSOR_TOKEN ??
  null;

const requireSensorBearer = (req: Request, res: Response, next: NextFunction) => {
  const token = sensorToken();
  if (!token) return next();
  const expected = `Bearer ${token}`;
  if (req.get("authorization") !== expected) {
    return res.status(401).json({ error: "environment_sensor_auth_required" });
  }
  return next();
};

const bodyBytes = (body: unknown): number => Buffer.byteLength(JSON.stringify(body ?? {}), "utf8");

const rejectOversizedPayload = (req: Request, res: Response, next: NextFunction) => {
  if (bodyBytes(req.body) > 64_000) {
    return res.status(413).json({ error: "environment_payload_too_large" });
  }
  return next();
};

environmentSourceRouter.use(express.json({ limit: "64kb" }));
environmentSourceRouter.use(requireSensorBearer);
environmentSourceRouter.use(rejectOversizedPayload);

environmentSourceRouter.post("/sources/manifest", (req, res) => {
  const manifest = req.body as HelixEnvironmentSourceManifest;
  const audit = auditEnvironmentSourceContract({ subject: manifest });
  if (!audit.ok) return res.status(400).json({ ok: false, audit });
  try {
    const registered = registerEnvironmentSourceManifest(manifest);
    return res.json({ ok: true, manifest: registered, audit });
  } catch (error) {
    return res.status(400).json({ ok: false, error: error instanceof Error ? error.message : "manifest_rejected", audit });
  }
});

environmentSourceRouter.post("/sources/heartbeat", (req, res) => {
  const heartbeat = req.body as HelixEnvironmentSourceHeartbeat;
  if (!getEnvironmentSourceManifest(heartbeat.source_id)) {
    return res.status(404).json({ ok: false, error: "unknown_environment_source" });
  }
  const audit = auditEnvironmentSourceContract({ subject: heartbeat });
  if (!audit.ok) return res.status(400).json({ ok: false, audit });
  const recorded = recordEnvironmentSourceHeartbeat(heartbeat);
  return res.json({ ok: true, heartbeat: recorded, audit });
});

environmentSourceRouter.get("/sources/:source_id/probes/pending", (req, res) => {
  const sourceId = req.params.source_id;
  if (!getEnvironmentSourceManifest(sourceId)) {
    return res.status(404).json({ ok: false, error: "unknown_environment_source" });
  }
  const limit = Number.isFinite(Number(req.query.limit)) ? Math.max(1, Math.min(16, Number(req.query.limit))) : 8;
  const requests = listPendingEnvironmentProbeRequests({ sourceId, limit });
  return res.json({ ok: true, source_id: sourceId, probe_requests: requests });
});

environmentSourceRouter.post("/sources/:source_id/probes/result", (req, res) => {
  const sourceId = req.params.source_id;
  if (!getEnvironmentSourceManifest(sourceId)) {
    return res.status(404).json({ ok: false, error: "unknown_environment_source" });
  }
  const result = req.body as HelixEnvironmentProbeResult;
  if (result.source_id !== sourceId) {
    return res.status(400).json({ ok: false, error: "source_id_mismatch" });
  }
  const recorded = recordEnvironmentProbeResult(result);
  if (!recorded.audit.ok) return res.status(400).json({ ok: false, ...recorded });
  return res.json({ ok: true, ...recorded });
});

environmentSourceRouter.get("/sources/:source_id/status", (req, res) => {
  const sourceId = req.params.source_id;
  const status = projectEnvironmentSourceAvailability({
    sourceId,
    requiredModalities: ["environment_state"],
    requiredSnapshotSections: ["actor_state", "inventory_state"],
    requiredProbeTypes: ["route_feasibility", "reachability", "inventory_check"],
  });
  const httpStatus = status.availability === "unavailable" && status.heartbeat_status === "missing" ? 404 : 200;
  return res.status(httpStatus).json({ ok: httpStatus === 200, status });
});
