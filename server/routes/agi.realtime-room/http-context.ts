import type { NextFunction, Request, Response } from "express";
import type {
  HelixSharedRealtimeRoom,
  HelixSharedRealtimeRoomErrorCode,
} from "@shared/helix-shared-realtime-room";
import { readHelixSessionCookie } from "../../services/helix-account/session-cookie";
import { resolveWorkstationGatewayAccountContext } from
  "../../services/helix-ask/workstation-tool-gateway/account-policy";
import type { HelixWorkstationGatewayAccountContext } from
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
import { projectSharedRealtimeRoomParticipantContext } from
  "../../services/helix-ask/realtime-room/participant-context";
import { isGuestSharedRealtimeRoomHostingEnabled } from
  "../../services/helix-account/account-session-store";
import { listSharedRealtimeRoomPublicTerminalResults } from
  "../../services/helix-ask/realtime-room/public-terminal-results";
import { SharedLiveRoomControlError } from
  "../../services/shared-live-room-control/service";

export type SharedRoomRequestAccount = {
  sessionId: string;
  profileId: string;
  displayName: string;
  isGuest: boolean;
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
  const active = runtime?.state === "host_transport_active" || runtime?.state === "bridge_active";
  const projected = projectSharedRealtimeRoomParticipantContext(runtime ? {
      ...room,
      status: room.status === "closed" ? "closed" : active ? "active" : room.status,
      runtime,
    } : room);
  return {
    ...projected,
    public_terminal_results: listSharedRealtimeRoomPublicTerminalResults(room.room_id),
  };
};

export const requireSharedRoomAccount = async (
  req: Request,
): Promise<SharedRoomRequestAccount> => {
  const context = await requireSharedRoomAccountContext(req);
  return {
    sessionId: context.session_id!,
    profileId: context.profile_id!,
    displayName: context.account_session!.profile.display_name,
    isGuest: context.account_session!.profile.auth_mode === "guest",
  };
};

export const requireSharedRoomAccountContext = async (
  req: Request,
): Promise<HelixWorkstationGatewayAccountContext> => {
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
    !policy.feature_flags.includes("shared_realtime_rooms") ||
    policy.locked_features.includes("shared_realtime_rooms")
  ) {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_locked_by_account_policy",
      403,
      "Enable Shared Live Rooms in Account & Sessions before creating or joining a room.",
    );
  }
  return context;
};

export const requireSharedRoomHostingAllowed = (
  account: SharedRoomRequestAccount,
): void => {
  if (!account.isGuest || isGuestSharedRealtimeRoomHostingEnabled()) return;
  throw new SharedRealtimeRoomDomainError(
    "shared_realtime_room_forbidden",
    403,
    "Temporary guests can join invitations, but guest room creation is disabled on this server.",
  );
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
  if (error instanceof SharedLiveRoomControlError) {
    const legacyError: HelixSharedRealtimeRoomErrorCode =
      error.code === "unauthorized"
        ? "shared_realtime_room_auth_required"
        : error.code === "account_policy_blocked" ||
            error.code === "insufficient_scope"
          ? "shared_realtime_room_locked_by_account_policy"
          : error.code === "room_not_found"
            ? "shared_realtime_room_not_found"
            : error.code === "room_forbidden"
              ? "shared_realtime_room_forbidden"
              : error.code === "room_closed"
                ? "shared_realtime_room_closed"
                : error.code === "invalid_request"
                  ? "shared_realtime_room_invalid_request"
                  : error.code === "room_runtime_conflict" ||
                      error.code === "idempotency_conflict" ||
                      error.code === "idempotency_in_progress" ||
                      error.code === "outcome_unknown"
                    ? "shared_realtime_room_runtime_conflict"
                    : "shared_realtime_room_unavailable";
    res.status(error.status).json(buildHelixSharedRealtimeRoomResponse({
      ok: false,
      error: legacyError,
      message: error.message,
    }));
    return;
  }
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
