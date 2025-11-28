import { Router } from "express";
import { z } from "zod";
import { createStarClient } from "../../modules/star-client";
import { collapseConfidence, decideCoherenceAction } from "../../modules/policies/coherence-governor";
import { personaPolicy } from "../auth/policy";
import { getDebateOwner, getDebateTelemetry } from "../services/debate/orchestrator";
import {
  persistCoherenceTelemetrySnapshot,
  type CoherenceSessionType,
  type CoherenceTelemetrySnapshot,
} from "../services/debate/telemetry-store";
import { isStarTelemetryEnabled } from "../services/debate/star-bridge";

const starTelemetryRouter = Router();

const TelemetryQuery = z.object({
  sessionId: z.string().min(3, "sessionId is required"),
  sessionType: z.string().optional(),
});

const sessionTypeFromQuery = (value?: string): CoherenceSessionType => {
  if (!value) return "debate";
  const normalized = value.trim().toLowerCase();
  if (normalized === "lab" || normalized === "planner" || normalized === "agent") {
    return normalized as CoherenceSessionType;
  }
  return (value.trim() as CoherenceSessionType) || "debate";
};

starTelemetryRouter.get("/telemetry", async (req, res) => {
  const parsed = TelemetryQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const sessionId = parsed.data.sessionId;
  const sessionType = sessionTypeFromQuery(parsed.data.sessionType);
  const viewerId = req.auth?.sub ?? "default";

  if (sessionType === "debate") {
    const ownerId = getDebateOwner(sessionId);
    if (!ownerId) {
      return res.status(404).json({ error: "session_not_found" });
    }
    if (!personaPolicy.canAccess(req.auth, ownerId, "plan")) {
      return res.status(403).json({ error: "forbidden" });
    }
    const snapshot = getDebateTelemetry(sessionId);
    if (!snapshot) {
      return res.status(404).json({ error: "session_not_found" });
    }
    return res.json(snapshot);
  }

  if (!personaPolicy.canAccess(req.auth, viewerId, "plan")) {
    return res.status(403).json({ error: "forbidden" });
  }

  if (!isStarTelemetryEnabled()) {
    return res.status(503).json({ error: "telemetry_disabled" });
  }

  const host = req.get("x-forwarded-host") ?? req.get("host");
  const proto = req.get("x-forwarded-proto") ?? req.protocol ?? "http";
  const port = process.env.PORT ?? "3000";
  const fallbackBaseUrl = host ? `${proto}://${host}/api/star` : `http://127.0.0.1:${port}/api/star`;
  const client = createStarClient({ baseUrl: process.env.STAR_SERVICE_URL ?? fallbackBaseUrl });
  try {
    const snapshot = await client.getTelemetry(sessionId, sessionType);
    const action = decideCoherenceAction(snapshot);
    const confidence = collapseConfidence(snapshot);
    const response: CoherenceTelemetrySnapshot = {
      sessionId,
      sessionType,
      telemetry: snapshot,
      action,
      confidence,
      updatedAt: snapshot.updated_at ? new Date(snapshot.updated_at).toISOString() : new Date().toISOString(),
    };
    void persistCoherenceTelemetrySnapshot(response).catch((error) => {
      console.warn("[coherence] failed to persist telemetry snapshot", error);
    });
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(502).json({ error: "telemetry_unavailable", message });
  }
});

export { starTelemetryRouter };
