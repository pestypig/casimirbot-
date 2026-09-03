import { Router, type Request, type Response } from "express";
import { helixOperatorActivityCursorSchema } from "@shared/helix-operator-activity";
import { getAccountSessionById } from "../services/helix-account/account-session-store";
import { readHelixSessionCookie } from "../services/helix-account/session-cookie";
import {
  HelixOperatorActivityStoreError,
  helixOperatorActivityOwnerForProfile,
  type HelixOperatorActivityStore,
} from "../services/helix-ask/operator-activity-store";

export const HELIX_OPERATOR_ACTIVITY_ERROR_SCHEMA =
  "helix.operator_activity_error.v1" as const;

type SessionRecord = {
  session_id: string;
  profile: { profile_id: string };
};

type ActivityStore = Pick<HelixOperatorActivityStore, "list" | "listStreams">;

export type OperatorActivityRouterDependencies = {
  activityStore: ActivityStore;
  resolveSession?: (sessionId?: string | null) => Promise<SessionRecord | null>;
};

const queryText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= 512 ? normalized : null;
};

const optionalQueryText = (value: unknown): string | null | undefined =>
  value === undefined ? undefined : queryText(value);

const optionalCursorText = (value: unknown): string | null | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= 8_192
    ? normalized
    : null;
};

const setPrivateHeaders = (res: Response): void => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
};

const fixedError = (
  res: Response,
  status: number,
  error: "session_required" | "invalid_request" | "not_found" | "forbidden" | "internal_error",
): Response => {
  const messages = {
    session_required: "Sign in to inspect Helix activity.",
    invalid_request: "Choose a valid activity stream and query scope.",
    not_found: "No activity stream is available for this profile and node.",
    forbidden: "This activity stream or cursor is not available to the signed-in profile.",
    internal_error: "Helix activity is temporarily unavailable.",
  } as const;
  setPrivateHeaders(res);
  return res.status(status).json({
    schema: HELIX_OPERATOR_ACTIVITY_ERROR_SCHEMA,
    ok: false,
    error,
    message: messages[error],
    credential_included: false,
    provider_thread_content_included: false,
    hidden_reasoning_included: false,
    answer_authority: false,
    terminal_eligible: false,
  });
};

const decodeCursor = (value: string | null) => {
  if (!value) return null;
  try {
    return helixOperatorActivityCursorSchema.parse(
      JSON.parse(Buffer.from(value, "base64url").toString("utf8")),
    );
  } catch {
    return null;
  }
};

export const encodeHelixOperatorActivityCursor = (value: unknown): string =>
  Buffer.from(
    JSON.stringify(helixOperatorActivityCursorSchema.parse(value)),
    "utf8",
  ).toString("base64url");

export const createOperatorActivityRouter = (
  dependencies: OperatorActivityRouterDependencies,
): Router => {
  const router = Router();
  const resolveSession = dependencies.resolveSession ?? getAccountSessionById;

  router.get("/session/operator-activity/streams", async (req: Request, res: Response) => {
    const cookieSessionId = readHelixSessionCookie(req.headers.cookie);
    if (!cookieSessionId) return fixedError(res, 401, "session_required");
    const session = await resolveSession(cookieSessionId).catch(() => null);
    if (!session) return fixedError(res, 401, "session_required");
    const limitNumber = req.query.limit === undefined ? undefined : Number(req.query.limit);
    if (
      limitNumber !== undefined &&
      (!Number.isInteger(limitNumber) || limitNumber < 1 || limitNumber > 100)
    ) {
      return fixedError(res, 400, "invalid_request");
    }
    try {
      const profileId = session.profile.profile_id;
      const streams = await dependencies.activityStore.listStreams({
        owner: helixOperatorActivityOwnerForProfile(profileId),
        profileRef: profileId,
        limit: limitNumber,
      });
      setPrivateHeaders(res);
      return res.status(200).json(streams);
    } catch {
      return fixedError(res, 500, "internal_error");
    }
  });

  router.get("/session/operator-activity", async (req: Request, res: Response) => {
    const cookieSessionId = readHelixSessionCookie(req.headers.cookie);
    if (!cookieSessionId) return fixedError(res, 401, "session_required");
    const session = await resolveSession(cookieSessionId).catch(() => null);
    if (!session) return fixedError(res, 401, "session_required");

    const streamRef = queryText(req.query.stream_ref);
    const nodeRef = queryText(req.query.node_ref);
    const runId = optionalQueryText(req.query.run_id);
    const providerThreadRef = optionalQueryText(req.query.provider_thread_ref);
    const providerThreadEpoch = optionalQueryText(req.query.provider_thread_epoch);
    const cursorText = optionalCursorText(req.query.cursor);
    const cursor = cursorText === undefined ? null : decodeCursor(cursorText ?? null);
    const limitNumber = req.query.limit === undefined
      ? undefined
      : Number(req.query.limit);
    if (
      !streamRef ||
      !nodeRef ||
      runId === null ||
      providerThreadRef === null ||
      providerThreadEpoch === null ||
      cursorText === null ||
      (cursorText !== undefined && !cursor) ||
      ((providerThreadRef === undefined) !== (providerThreadEpoch === undefined)) ||
      (limitNumber !== undefined &&
        (!Number.isInteger(limitNumber) || limitNumber < 1 || limitNumber > 100))
    ) {
      return fixedError(res, 400, "invalid_request");
    }

    try {
      const profileId = session.profile.profile_id;
      const page = await dependencies.activityStore.list({
        owner: helixOperatorActivityOwnerForProfile(profileId),
        stream: { streamRef, profileRef: profileId, nodeRef },
        runId: runId ?? null,
        providerThreadRef: providerThreadRef ?? null,
        providerThreadEpoch: providerThreadEpoch ?? null,
        cursor,
        limit: limitNumber,
      });
      setPrivateHeaders(res);
      return res.status(200).json(page);
    } catch (error) {
      if (error instanceof HelixOperatorActivityStoreError) {
        if (error.code === "activity_stream_not_found") {
          return fixedError(res, 404, "not_found");
        }
        return fixedError(res, 403, "forbidden");
      }
      return fixedError(res, 500, "internal_error");
    }
  });

  return router;
};
