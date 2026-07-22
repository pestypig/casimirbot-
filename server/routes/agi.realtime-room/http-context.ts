import type { NextFunction, Request, Response } from "express";
import type {
  HelixSharedRealtimeRoom,
  HelixSharedRealtimeRoomErrorCode,
} from "@shared/helix-shared-realtime-room";
import { readHelixSessionCookie } from "../../services/helix-account/session-cookie";
import { resolveWorkstationGatewayAccountContext } from
  "../../services/helix-ask/workstation-tool-gateway/account-policy";
import {
  isSharedRealtimeRoomDomainError,
  readSharedRealtimeRoom,
  readSharedRealtimeRoomMembership,
  SharedRealtimeRoomDomainError,
  type SharedRealtimeRoomMembership,
} from "../../services/helix-ask/realtime-room/room-store";
import { readSharedRealtimeRoomRuntime } from
  "../../services/helix-ask/realtime-room/runtime-registry";
import { HelixSharedRoomVisualFramePayloadError } from
  "../../services/helix-ask/realtime-room/visual-frame-payload";
import { buildHelixSharedRealtimeRoomResponse } from
  "../../services/helix-ask/realtime-room/room-response";

export type SharedRoomRequestAccount = {
  sessionId: string;
  profileId: string;
  displayName: string;
};

export const readRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

export const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export const withRuntimeProjection = (
  room: HelixSharedRealtimeRoom,
): HelixSharedRealtimeRoom => {
  const runtime = readSharedRealtimeRoomRuntime({ roomId: room.room_id });
  if (!runtime) return room;
  const active = runtime.state === "host_transport_active" || runtime.state === "bridge_active";
  return {
    ...room,
    status: room.status === "closed" ? "closed" : active ? "active" : room.status,
    runtime,
  };
};

export const requireSharedRoomAccount = async (
  req: Request,
): Promise<SharedRoomRequestAccount> => {
  const sessionId = readHelixSessionCookie(req.headers.cookie);
  const context = await resolveWorkstationGatewayAccountContext(sessionId);
  if (
    !context.trusted_account_session ||
    !context.session_id ||
    !context.profile_id ||
    !context.account_session
  ) {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_auth_required",
      401,
      "Sign in before creating or joining a Shared GPT Live Room.",
    );
  }
  const policy = context.account_policy;
  if (
    policy.account_type !== "developer" ||
    !policy.feature_flags.includes("shared_realtime_rooms") ||
    policy.locked_features.includes("shared_realtime_rooms")
  ) {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_locked_by_account_policy",
      403,
      "Shared GPT Live Rooms are currently available to developer accounts only.",
    );
  }
  return {
    sessionId: context.session_id,
    profileId: context.profile_id,
    displayName: context.account_session.profile.display_name,
  };
};

const statusForRuntimeError = (
  error: HelixSharedRealtimeRoomErrorCode,
): 400 | 403 | 409 => {
  if (error === "shared_realtime_room_consent_required") return 403;
  if (
    error === "shared_realtime_room_not_ready" ||
    error === "shared_realtime_room_runtime_conflict" ||
    error === "shared_realtime_room_realtime_session_invalid"
  ) return 409;
  return 400;
};

export const throwRuntimeError = (
  error: HelixSharedRealtimeRoomErrorCode | null,
): never => {
  const code = error ?? "shared_realtime_room_unavailable";
  throw new SharedRealtimeRoomDomainError(
    code,
    code === "shared_realtime_room_unavailable" ? 503 : statusForRuntimeError(code),
    code.replaceAll("_", " "),
  );
};

const respondError = (res: Response, error: unknown): void => {
  if (isSharedRealtimeRoomDomainError(error)) {
    res.status(error.statusCode).json(buildHelixSharedRealtimeRoomResponse({
      ok: false,
      error: error.code,
      message: error.message,
    }));
    return;
  }
  if (error instanceof HelixSharedRoomVisualFramePayloadError) {
    res.status(400).json(buildHelixSharedRealtimeRoomResponse({
      ok: false,
      error: error.code,
      message: error.reason,
    }));
    return;
  }
  console.warn(
    "[shared-realtime-room] request failed",
    error instanceof Error ? error.message : "unknown",
  );
  res.status(503).json(buildHelixSharedRealtimeRoomResponse({
    ok: false,
    error: "shared_realtime_room_unavailable",
    message: "Shared GPT Live Room is temporarily unavailable.",
  }));
};

export const sharedRoomRoute = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) => (req: Request, res: Response, next: NextFunction): void => {
  void handler(req, res, next).catch((error) => respondError(res, error));
};

export const readMembership = async (
  roomId: string,
  account: SharedRoomRequestAccount,
): Promise<SharedRealtimeRoomMembership> => {
  const membership = await readSharedRealtimeRoomMembership({
    roomId,
    profileId: account.profileId,
  });
  if (!membership) {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_not_found",
      404,
      "Shared Realtime room not found.",
    );
  }
  return membership;
};

export const readAuthorizedRoom = async (
  roomId: string,
  account: SharedRoomRequestAccount,
): Promise<HelixSharedRealtimeRoom> => withRuntimeProjection(await readSharedRealtimeRoom({
  roomId,
  profileId: account.profileId,
}));

export const requireOwner = (membership: SharedRealtimeRoomMembership): void => {
  if (membership.role !== "owner") {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_forbidden",
      403,
      "Only the room owner can manage the shared model session.",
    );
  }
};

export const requirePresent = (membership: SharedRealtimeRoomMembership): void => {
  if (membership.presence !== "present") {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_not_ready",
      409,
      "Return to the room before using its live transport or visual context.",
    );
  }
};
