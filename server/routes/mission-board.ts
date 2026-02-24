import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import {
  appendMissionBoardEvent,
  listMissionBoardEvents,
} from "../services/mission-overwatch/mission-board-store";
import { normalizeMissionEvent } from "../services/mission-overwatch/event-normalizer";

type MissionPhase =
  | "observe"
  | "plan"
  | "retrieve"
  | "gate"
  | "synthesize"
  | "verify"
  | "execute"
  | "debrief";
type MissionStatus = "active" | "degraded" | "blocked" | "complete" | "aborted";
type EventType = "state_change" | "threat_update" | "timer_update" | "action_required" | "debrief";
type EventClass = "info" | "warn" | "critical" | "action";

type MissionBoardEvent = {
  eventId: string;
  missionId: string;
  type: EventType;
  classification: EventClass;
  text: string;
  ts: string;
  fromState?: string;
  toState?: string;
  evidenceRefs: string[];
  timerId?: string;
  timerKind?: "countdown" | "deadline";
  timerStatus?: "scheduled" | "running" | "expired" | "cancelled" | "completed";
  timerDueTs?: string;
  derivedFromEventId?: string;
  ackRefId?: string;
  metrics?: {
    trigger_to_debrief_closed_ms?: number;
  };
};

type MissionBoardSnapshot = {
  missionId: string;
  phase: MissionPhase;
  status: MissionStatus;
  updatedAt: string;
  unresolvedCritical: number;
};

const missionBoardRouter = Router();
const DEBRIEF_CLOSURE_EVENT_PREFIX = "debrief:closure:";

const eventClassSchema = z.enum(["info", "warn", "critical", "action"]);
const eventTypeSchema = z.enum(["state_change", "threat_update", "timer_update", "action_required", "debrief"]);
const actionTypeSchema = z.enum([
  "clarify",
  "retrieve",
  "verify",
  "execute",
  "escalate",
  "abort",
  "ACK_AND_CONTINUE",
  "VERIFY_WITH_SENSOR",
  "NAVIGATE_TO",
  "ESCALATE_TO_COMMAND",
  "PAUSE_MISSION",
  "HOLD",
  "START_TIMER",
  "CANCEL_TIMER",
  "MARK_RISK_MITIGATED",
  "MARK_FALSE_ALARM",
]);

const actionSchema = z.object({
  actionId: z.string().trim().min(1).max(200).optional(),
  type: actionTypeSchema,
  status: z.enum(["pending", "accepted", "rejected", "completed"]).default("pending"),
  requestedBy: z.string().trim().max(200).optional(),
  requestedAt: z.string().datetime().optional(),
  evidenceRefs: z.array(z.string().trim().min(1).max(500)).max(32).default([]),
  payload: z.record(z.unknown()).optional(),
});



const timerPayloadSchema = z.object({
  timerId: z.string().trim().min(1).max(200),
  timerKind: z.enum(["countdown", "deadline"]).default("countdown"),
  status: z.enum(["scheduled", "running", "expired", "cancelled", "completed"]),
  dueTs: z.string().datetime(),
  derivedFromEventId: z.string().trim().min(1).max(200).optional(),
});

const contextEventSchema = z.object({
  eventId: z.string().trim().min(1).max(200).optional(),
  eventType: z.string().trim().min(1).max(80),
  classification: eventClassSchema.default("info"),
  text: z.string().trim().min(1).max(600),
  ts: z.string().datetime().optional(),
  tier: z.enum(["tier0", "tier1"]),
  sessionState: z.enum(["idle", "requesting", "active", "stopping", "error"]),
  traceId: z.string().trim().max(200).optional(),
  evidenceRefs: z.array(z.string().trim().min(1).max(500)).max(32).default([]),
  timer: timerPayloadSchema.optional(),
});

const ackSchema = z.object({
  eventId: z.string().trim().min(1).max(200),
  ackRefId: z.string().trim().min(1).max(200).optional(),
  actorId: z.string().trim().max(200).optional(),
  note: z.string().trim().max(600).optional(),
  ts: z.string().datetime().optional(),
});

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Tenant-Id, X-Customer-Id");
};

const errorEnvelope = (
  res: Response,
  status: number,
  error: string,
  message: string,
  details?: Record<string, unknown>,
) => {
  return res.status(status).json({
    error,
    message,
    ...(details ? { details } : {}),
  });
};

const missionIdFromReq = (req: Request): string => req.params.missionId?.trim();

const parseLimit = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(200, Math.max(1, Math.floor(parsed)));
};

const missionBoardUnavailable = (res: Response, error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return errorEnvelope(
    res,
    503,
    "mission_board_unavailable",
    "Mission board storage is unavailable.",
    { reason: message },
  );
};

const getMissionEvents = async (missionId: string): Promise<MissionBoardEvent[]> => {
  const events = await listMissionBoardEvents(missionId);
  const normalized: MissionBoardEvent[] = [];
  for (const event of events) {
    const typeResult = eventTypeSchema.safeParse(event.type);
    const classResult = eventClassSchema.safeParse(event.classification);
    if (!typeResult.success || !classResult.success) {
      continue;
    }
    normalized.push({
      eventId: event.eventId,
      missionId: event.missionId,
      type: typeResult.data,
      classification: classResult.data,
      text: event.text,
      ts: event.ts,
      fromState: event.fromState,
      toState: event.toState,
      evidenceRefs: event.evidenceRefs,
      timerId: event.timerId,
      timerKind: event.timerKind,
      timerStatus: event.timerStatus,
      timerDueTs: event.timerDueTs,
      derivedFromEventId: event.derivedFromEventId,
      ackRefId: event.ackRefId,
      metrics: event.metrics,
    });
  }
  return normalized.sort((a, b) => {
    const tsDiff = Date.parse(a.ts) - Date.parse(b.ts);
    return tsDiff !== 0 ? tsDiff : a.eventId.localeCompare(b.eventId);
  });
};


const computeTriggerToDebriefClosedMs = (events: MissionBoardEvent[], derivedFromEventId: string, closureTs: string): number | null => {
  const trigger = events.find((event) => event.eventId === derivedFromEventId);
  if (!trigger) return null;
  const delta = Date.parse(closureTs) - Date.parse(trigger.ts);
  if (!Number.isFinite(delta)) return null;
  return Math.max(0, Math.floor(delta));
};

const foldMissionSnapshot = (events: MissionBoardEvent[], missionId: string): MissionBoardSnapshot => {
  let phase: MissionPhase = "observe";
  let status: MissionStatus = "active";
  const unresolvedCriticalIds = new Set<string>();
  let updatedAt = new Date().toISOString();

  for (const event of events) {
    updatedAt = event.ts;
    if (event.classification === "critical") {
      unresolvedCriticalIds.add(event.eventId);
    }

    const isAckEvent =
      event.type === "state_change" &&
      event.eventId.startsWith("ack:") &&
      event.evidenceRefs.length > 0;
    if (isAckEvent) {
      for (const evidenceRef of event.evidenceRefs) {
        const ref = evidenceRef.trim();
        if (ref) {
          unresolvedCriticalIds.delete(ref);
        }
      }
    }

    if (event.type === "state_change" && event.toState) {
      const next = event.toState as MissionPhase | MissionStatus;
      if (
        next === "observe" ||
        next === "plan" ||
        next === "retrieve" ||
        next === "gate" ||
        next === "synthesize" ||
        next === "verify" ||
        next === "execute" ||
        next === "debrief"
      ) {
        phase = next;
      } else if (
        next === "active" ||
        next === "degraded" ||
        next === "blocked" ||
        next === "complete" ||
        next === "aborted"
      ) {
        status = next;
      }
    }

    const isDebriefClosure =
      event.type === "debrief" &&
      event.eventId.startsWith(DEBRIEF_CLOSURE_EVENT_PREFIX);
    if (event.type === "debrief" && !isDebriefClosure) {
      phase = "debrief";
    }
  }
  const unresolvedCritical = unresolvedCriticalIds.size;
  if (
    unresolvedCritical > 0 &&
    status !== "blocked" &&
    status !== "complete" &&
    status !== "aborted"
  ) {
    status = "degraded";
  }

  return {
    missionId,
    phase,
    status,
    updatedAt,
    unresolvedCritical,
  };
};

const appendEvent = async (missionId: string, event: MissionBoardEvent) => {
  await appendMissionBoardEvent(missionId, event);
};

const nowIso = () => new Date().toISOString();

missionBoardRouter.options("/:missionId", (_req, res) => {
  setCors(res);
  res.status(200).end();
});
missionBoardRouter.options("/:missionId/events", (_req, res) => {
  setCors(res);
  res.status(200).end();
});
missionBoardRouter.options("/:missionId/actions", (_req, res) => {
  setCors(res);
  res.status(200).end();
});
missionBoardRouter.options("/:missionId/ack", (_req, res) => {
  setCors(res);
  res.status(200).end();
});
missionBoardRouter.options("/:missionId/context-events", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

missionBoardRouter.get("/:missionId", async (req, res) => {
  setCors(res);
  const missionId = missionIdFromReq(req);
  if (!missionId) {
    return errorEnvelope(res, 400, "mission_board_invalid_request", "missionId is required.");
  }
  try {
    const snapshot = foldMissionSnapshot(await getMissionEvents(missionId), missionId);
    return res.json({ snapshot });
  } catch (error) {
    return missionBoardUnavailable(res, error);
  }
});

missionBoardRouter.get("/:missionId/events", async (req, res) => {
  setCors(res);
  const missionId = missionIdFromReq(req);
  if (!missionId) {
    return errorEnvelope(res, 400, "mission_board_invalid_request", "missionId is required.");
  }

  const limit = parseLimit(req.query.limit, 50);
  const cursorRaw = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  const cursor = cursorRaw ? Number(cursorRaw) : 0;
  const offset = Number.isFinite(cursor) ? Math.max(0, Math.floor(cursor)) : 0;

  try {
    const events = await getMissionEvents(missionId);
    const slice = events.slice(offset, offset + limit);
    const nextCursor = offset + slice.length < events.length ? offset + slice.length : null;

    return res.json({
      missionId,
      events: slice,
      cursor: offset,
      nextCursor,
    });
  } catch (error) {
    return missionBoardUnavailable(res, error);
  }
});

missionBoardRouter.post("/:missionId/actions", async (req, res) => {
  setCors(res);
  const missionId = missionIdFromReq(req);
  if (!missionId) {
    return errorEnvelope(res, 400, "mission_board_invalid_request", "missionId is required.");
  }

  const parsed = actionSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return errorEnvelope(
      res,
      400,
      "mission_board_invalid_request",
      "Invalid mission action payload.",
      { issues: parsed.error.flatten() },
    );
  }

  const payload = parsed.data;
  const actionId = payload.actionId?.trim() || `action:${missionId}:${Date.now()}`;
  const ts = payload.requestedAt ?? nowIso();

  try {
    await appendEvent(missionId, {
      eventId: actionId,
      missionId,
      type: "action_required",
      classification: payload.type.includes("ESCALATE") || payload.type.includes("abort") ? "critical" : "action",
      text: `Action ${payload.type} (${payload.status})`,
      ts,
      evidenceRefs: payload.evidenceRefs,
    });

    const snapshot = foldMissionSnapshot(await getMissionEvents(missionId), missionId);
    return res.status(200).json({
      receipt: { actionId, missionId, ts, status: payload.status },
      snapshot,
    });
  } catch (error) {
    return missionBoardUnavailable(res, error);
  }
});


missionBoardRouter.post("/:missionId/context-events", async (req, res) => {
  setCors(res);
  const missionId = missionIdFromReq(req);
  if (!missionId) {
    return errorEnvelope(res, 400, "mission_board_invalid_request", "Mission id is required.");
  }

  const parsed = contextEventSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return errorEnvelope(res, 400, "mission_board_invalid_request", "Invalid context event payload.", {
      issues: parsed.error.flatten(),
    });
  }

  const payload = parsed.data;
  const normalized = normalizeMissionEvent({
    eventId: payload.eventId,
    missionId,
    source: "telemetry",
    eventType: payload.eventType,
    classification: payload.classification,
    text: payload.text,
    ts: payload.ts,
    evidenceRefs: payload.evidenceRefs,
    contextTier: payload.tier,
    sessionState: payload.sessionState,
    traceId: payload.traceId,
  });

  if (payload.eventType === "timer_update" && !payload.timer) {
    return errorEnvelope(res, 400, "mission_board_invalid_request", "timer_update requires timer payload.");
  }

  const missionEvent: MissionBoardEvent = {
    eventId: normalized.eventId,
    missionId,
    type: eventTypeSchema.safeParse(payload.eventType).success ? (payload.eventType as EventType) : "state_change",
    classification: payload.classification,
    text: `[context:${payload.tier}/${payload.sessionState}] ${payload.text}`,
    ts: normalized.ts,
    evidenceRefs: payload.evidenceRefs,
    timerId: payload.timer?.timerId,
    timerKind: payload.timer?.timerKind,
    timerStatus: payload.timer?.status,
    timerDueTs: payload.timer?.dueTs,
    derivedFromEventId: payload.timer?.derivedFromEventId,
  };

  try {
    await appendEvent(missionId, missionEvent);
    const events = await getMissionEvents(missionId);
    return res.status(200).json({
      event: missionEvent,
      snapshot: foldMissionSnapshot(events, missionId),
      traceId: payload.traceId ?? null,
    });
  } catch (error) {
    return missionBoardUnavailable(res, error);
  }
});

missionBoardRouter.post("/:missionId/ack", async (req, res) => {
  setCors(res);
  const missionId = missionIdFromReq(req);
  if (!missionId) {
    return errorEnvelope(res, 400, "mission_board_invalid_request", "missionId is required.");
  }

  const parsed = ackSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return errorEnvelope(
      res,
      400,
      "mission_board_invalid_request",
      "Invalid mission acknowledgment payload.",
      { issues: parsed.error.flatten() },
    );
  }

  const payload = parsed.data;
  const ts = payload.ts ?? nowIso();
  const ackRefId = payload.ackRefId ?? payload.eventId;
  try {
    const existingEvents = await getMissionEvents(missionId);
    const triggerToDebriefClosedMs = computeTriggerToDebriefClosedMs(existingEvents, payload.eventId, ts);

    await appendEvent(missionId, {
      eventId: `ack:${payload.eventId}:${Date.parse(ts) || Date.now()}`,
      missionId,
      type: "state_change",
      classification: eventClassSchema.parse("info"),
      text: payload.note?.trim() || `Acknowledged ${payload.eventId}`,
      ts,
      fromState: "pending",
      toState: "active",
      evidenceRefs: [payload.eventId],
      derivedFromEventId: payload.eventId,
      ackRefId,
    });

    await appendEvent(missionId, {
      eventId: `${DEBRIEF_CLOSURE_EVENT_PREFIX}${payload.eventId}:${Date.parse(ts) || Date.now()}`,
      missionId,
      type: "debrief",
      classification: eventClassSchema.parse("info"),
      text: `Debrief closed for ${payload.eventId}`,
      ts,
      evidenceRefs: [payload.eventId],
      derivedFromEventId: payload.eventId,
      ackRefId,
      metrics: triggerToDebriefClosedMs === null ? undefined : { trigger_to_debrief_closed_ms: triggerToDebriefClosedMs },
    });

    const updatedEvents = await getMissionEvents(missionId);
    const snapshot = foldMissionSnapshot(updatedEvents, missionId);
    return res.status(200).json({
      receipt: {
        missionId,
        eventId: payload.eventId,
        ackRefId,
        actorId: payload.actorId ?? null,
        ts,
      },
      metrics: triggerToDebriefClosedMs === null ? {} : { trigger_to_debrief_closed_ms: triggerToDebriefClosedMs },
      snapshot,
    });
  } catch (error) {
    return missionBoardUnavailable(res, error);
  }
});

export {
  missionBoardRouter,
  foldMissionSnapshot,
  eventTypeSchema,
  eventClassSchema,
};
