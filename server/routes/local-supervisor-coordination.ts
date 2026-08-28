import express, { Router, type Request, type Response } from "express";
import { ZodError } from "zod";
import {
  HelixLocalSupervisorCoordinationError,
  HelixLocalSupervisorCoordinationStore,
} from "../services/local-supervisor/local-supervisor-coordination";
import { requireSharedRoomAccount } from "./agi.realtime-room/http-context";

const flags = {
  credential_included: false as const,
  private_endpoint_included: false as const,
  hidden_reasoning_included: false as const,
  answer_authority: false as const,
  assistant_answer: false as const,
  terminal_eligible: false as const,
  raw_content_included: false as const,
};

const respondError = (res: Response, error: unknown): void => {
  if (error instanceof HelixLocalSupervisorCoordinationError) {
    res.status(error.status).json({ ok: false, error: error.code, ...flags });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({ ok: false, error: "supervisor_coordination_invalid_request", ...flags });
    return;
  }
  const candidate = error as { statusCode?: unknown; code?: unknown; message?: unknown };
  if (typeof candidate?.statusCode === "number") {
    res.status(candidate.statusCode).json({
      ok: false,
      error: typeof candidate.code === "string" ? candidate.code : "supervisor_coordination_forbidden",
      ...flags,
    });
    return;
  }
  console.warn("[local-supervisor-coordination] request failed", error instanceof Error ? error.message : "unknown");
  res.status(503).json({ ok: false, error: "supervisor_coordination_unavailable", ...flags });
};

const route = (handler: (req: Request, res: Response) => Promise<void> | void) =>
  (req: Request, res: Response): void => {
    Promise.resolve(handler(req, res)).catch((error) => respondError(res, error));
  };

export const buildLocalSupervisorCoordinationSnapshot = (input: {
  serviceInstanceRef: string;
  store: HelixLocalSupervisorCoordinationStore;
}) => ({
  ok: true,
  schema: "helix.local_supervisor_coordination_snapshot.v1" as const,
  service_instance_ref: input.serviceInstanceRef,
  presence: input.store.listPresence(),
  relay_recommendations: input.store.listRecommendations(),
  relay_vocabulary: [
    "status_update",
    "coordination_request",
    "handoff_request",
    "collision_notice",
    "release_notice",
  ] as const,
  content_role: "supervisor_coordination_advisory" as const,
  ...flags,
});

export const createLocalSupervisorCoordinationRouter = (input: {
  serviceInstanceRef: string;
  store?: HelixLocalSupervisorCoordinationStore;
}): Router => {
  const router = Router();
  const store = input.store ?? new HelixLocalSupervisorCoordinationStore(input.serviceInstanceRef);
  router.use(express.json({ limit: "32kb" }));

  router.get("/coordination", route(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    const clientSessionRef = typeof req.query.client_session_ref === "string"
      ? req.query.client_session_ref.trim()
      : "";
    store.authenticateClient({
      profileRef: account.profileId,
      accountSessionId: account.sessionId,
      clientSessionRef,
    });
    res.json(buildLocalSupervisorCoordinationSnapshot({
      serviceInstanceRef: input.serviceInstanceRef,
      store,
    }));
  }));

  router.put("/coordination/presence", route(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    const presence = store.registerOrHeartbeat({
      profileRef: account.profileId,
      accountSessionId: account.sessionId,
      presence: req.body,
    });
    res.json({ ok: true, presence, ...flags });
  }));

  router.post("/coordination/presence/:clientSessionRef/disconnect", route(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    const presence = store.disconnect({
      profileRef: account.profileId,
      accountSessionId: account.sessionId,
      clientSessionRef: req.params.clientSessionRef,
    });
    res.json({ ok: true, presence, ...flags });
  }));

  router.post("/coordination/relays", route(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    const relay = store.publishRelay({
      profileRef: account.profileId,
      accountSessionId: account.sessionId,
      relay: req.body,
    });
    res.status(201).json({ ok: true, relay, ...flags });
  }));

  router.get("/coordination/relays", route(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    const clientSessionRef = typeof req.query.client_session_ref === "string"
      ? req.query.client_session_ref.trim()
      : "";
    const after = typeof req.query.after === "string" ? Number(req.query.after) : 0;
    const relays = store.listRelays({
      profileRef: account.profileId,
      accountSessionId: account.sessionId,
      clientSessionRef,
      afterCursor: Number.isFinite(after) ? Math.max(0, Math.floor(after)) : 0,
    });
    res.json({ ok: true, relays, ...flags });
  }));

  router.post("/coordination/relays/:messageRef/ack", route(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    const relay = store.acknowledgeRelay({
      profileRef: account.profileId,
      accountSessionId: account.sessionId,
      messageRef: req.params.messageRef,
      acknowledgement: req.body,
    });
    res.json({ ok: true, relay, ...flags });
  }));

  return router;
};
