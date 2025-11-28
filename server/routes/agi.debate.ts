import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { DebateConfig } from "@shared/essence-debate";
import { personaPolicy } from "../auth/policy";
import {
  getDebateOwner,
  getDebateSnapshot,
  getDebateTelemetry,
  listDebateEvents,
  resumeDebate,
  startDebate,
  subscribeToDebate,
  type DebateStreamEvent,
} from "../services/debate/orchestrator";

const debateRouter = Router();

const StreamQuery = z.object({
  debateId: z.string().min(4, "debateId is required"),
});

const TelemetryQuery = z.object({
  debateId: z.string().min(4, "debateId is required"),
});

export function resolveDebatePersonaId(req: Request, candidate?: string | null): string {
  let personaId = (candidate ?? "").trim();
  if (personaPolicy.shouldRestrictRequest(req.auth) && (!personaId || personaId === "default") && req.auth?.sub) {
    personaId = req.auth.sub;
  }
  if (!personaId) {
    personaId = "default";
  }
  return personaId;
}

debateRouter.post("/start", async (req, res) => {
  const payload = normalizeStartPayload(req.body);
  const parsed = DebateConfig.safeParse(payload);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const personaId = resolveDebatePersonaId(req, parsed.data.persona_id);
  if (!personaPolicy.canAccess(req.auth, personaId, "plan")) {
    return res.status(403).json({ error: "forbidden" });
  }
  const { debateId } = await startDebate({ ...parsed.data, persona_id: personaId });
  res.json({ debateId });
});

debateRouter.get("/stream", (req, res) => {
  const parsed = StreamQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const { debateId } = parsed.data;
  const ownerId = getDebateOwner(debateId);
  if (!ownerId) {
    return res.status(404).json({ error: "debate_not_found" });
  }
  if (!personaPolicy.canAccess(req.auth, ownerId, "plan")) {
    return res.status(403).json({ error: "forbidden" });
  }

  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();
  res.write(`retry: 5000\n\n`);

  const lastEventId = req.get("last-event-id") ?? req.get("Last-Event-ID");
  const sinceSeq = parseSequence(lastEventId);
  const backlog = listDebateEvents(debateId, sinceSeq);
  backlog.forEach((event) => sendEvent(res, event));

  const unsubscribe = subscribeToDebate(debateId, (event) => sendEvent(res, event));
  const ping = setInterval(() => {
    try {
      res.write(`event: ping\ndata: {}\n\n`);
    } catch {
      // ignore broken pipes; cleanup will run via close handler
    }
  }, 25000);

  const cleanup = () => {
    clearInterval(ping);
    unsubscribe();
    try {
      res.end();
    } catch {
      // ignore teardown errors
    }
  };
  req.on("close", cleanup);
  req.on("error", cleanup);
  resumeDebate(debateId);
});

debateRouter.get("/telemetry", (req, res) => {
  const parsed = TelemetryQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const { debateId } = parsed.data;
  const ownerId = getDebateOwner(debateId);
  if (!ownerId) {
    return res.status(404).json({ error: "debate_not_found" });
  }
  if (!personaPolicy.canAccess(req.auth, ownerId, "plan")) {
    return res.status(403).json({ error: "forbidden" });
  }
  const snapshot = getDebateTelemetry(debateId);
  if (!snapshot) {
    return res.status(404).json({ error: "debate_not_found" });
  }
  res.json(snapshot);
});

debateRouter.get("/:id", (req, res) => {
  const snapshot = getDebateSnapshot(req.params.id);
  if (!snapshot) {
    return res.status(404).json({ error: "debate_not_found" });
  }
  if (!personaPolicy.canAccess(req.auth, snapshot.persona_id, "plan")) {
    return res.status(403).json({ error: "forbidden" });
  }
  res.json(snapshot);
});

function normalizeStartPayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") {
    return {};
  }
  const input = raw as Record<string, unknown>;
  const goal = typeof input.goal === "string" ? input.goal : undefined;
  const persona_id =
    typeof input.persona_id === "string"
      ? input.persona_id
      : typeof input.personaId === "string"
        ? input.personaId
        : undefined;
  return {
    ...input,
    goal,
    persona_id,
  };
}

function sendEvent(res: Response, event: DebateStreamEvent): void {
  try {
    res.write(`id: ${event.seq}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
  } catch {
    // ignore broken pipes
  }
}

function parseSequence(value?: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export { debateRouter };
