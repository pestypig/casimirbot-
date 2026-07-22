import { Router } from "express";
import { buildHelixSharedRealtimeRoomResponse } from
  "../../services/helix-ask/realtime-room/room-response";
import {
  isSharedRealtimeRoomDomainError,
  listSharedRealtimeRooms,
} from "../../services/helix-ask/realtime-room/room-store";
import {
  requireSharedRoomAccount,
  sharedRoomRoute,
  withRuntimeProjection,
  type SharedRoomRequestAccount,
} from "./http-context";

export const sharedRealtimePersonalSessionGuardRouter = Router();

/**
 * A participant in an open room must use the room-owned model call. This
 * guard is mounted before the ordinary Realtime session router. Authentication
 * and policy failures deliberately fall through so the existing personal Live
 * endpoint retains authority for callers outside this feature.
 */
sharedRealtimePersonalSessionGuardRouter.post(
  "/realtime/session",
  sharedRoomRoute(async (req, res, next) => {
    let account: SharedRoomRequestAccount;
    try {
      account = await requireSharedRoomAccount(req);
    } catch (error) {
      if (isSharedRealtimeRoomDomainError(error)) {
        next();
        return;
      }
      throw error;
    }

    const rooms = await listSharedRealtimeRooms({ profileId: account.profileId });
    const blockedRoom = rooms.find((room) => {
      const self = room.participants.find((participant) =>
        participant.participant_id === room.self_participant_id);
      return self?.role === "participant" && room.status !== "closed";
    });

    if (!blockedRoom) {
      next();
      return;
    }

    res.status(409).json(buildHelixSharedRealtimeRoomResponse({
      ok: false,
      error: "shared_realtime_room_personal_session_blocked",
      message: "This account joined a one-model room; use the room session instead of starting a second GPT Live call.",
      room: withRuntimeProjection(blockedRoom),
    }));
  }),
);
