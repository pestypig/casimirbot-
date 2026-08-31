import { Router } from "express";
import type { HelixSharedRealtimeRoomConsentPatch } from
  "@shared/helix-shared-realtime-room";
import { buildHelixSharedRealtimeRoomResponse } from
  "../../services/helix-ask/realtime-room/room-response";
import {
  SharedRealtimeRoomDomainError,
  updateSharedRealtimeRoomPresence,
} from "../../services/helix-ask/realtime-room/room-store";
import {
  degradeSharedRealtimeRoomRuntimeForReadiness,
} from
  "../../services/helix-ask/realtime-room/room-runtime-reconciliation";
import { sendSharedRealtimeRoomParticipantContextIfBound } from
  "../../services/helix-ask/realtime-room/participant-context";
import {
  readRecord,
  readString,
  requireSharedRoomAccount,
  requireSharedRoomAccountContext,
  sharedRoomRoute,
  withRuntimeProjection,
} from "./http-context";
import { buildSharedLiveRoomControlActorFromAccountContext } from
  "../../services/shared-live-room-control/service";
import { getSharedLiveRoomControlService } from
  "../../services/shared-live-room-control/default-service";

export const sharedRealtimeRoomParticipantRouter = Router();
const sharedLiveRoomControlService = getSharedLiveRoomControlService();

sharedRealtimeRoomParticipantRouter.patch(
  "/realtime/rooms/:roomId/consent",
  sharedRoomRoute(async (req, res) => {
    const actor = buildSharedLiveRoomControlActorFromAccountContext(
      await requireSharedRoomAccountContext(req),
    );
    const consent = readRecord(
      readRecord(req.body).consent,
    ) as HelixSharedRealtimeRoomConsentPatch;
    const room = await sharedLiveRoomControlService.updateOwnConsentFromFirstPartyUi({
      actor,
      roomId: req.params.roomId,
      consentPatch: consent,
    });
    const projectedRoom = withRuntimeProjection(room);
    res.json(buildHelixSharedRealtimeRoomResponse({
      ok: true,
      message: "Your room consent was updated.",
      room: projectedRoom,
    }));
  }),
);

sharedRealtimeRoomParticipantRouter.post(
  "/realtime/rooms/:roomId/presence",
  sharedRoomRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    const presence = readString(readRecord(req.body).presence);
    if (presence !== "present" && presence !== "away") {
      throw new SharedRealtimeRoomDomainError(
        "shared_realtime_room_invalid_request",
        400,
        "Presence must be present or away.",
      );
    }
    const room = await updateSharedRealtimeRoomPresence({
      roomId: req.params.roomId,
      profileId: account.profileId,
      presence,
    });
    degradeSharedRealtimeRoomRuntimeForReadiness(room);
    const projectedRoom = withRuntimeProjection(room);
    sendSharedRealtimeRoomParticipantContextIfBound({
      room: projectedRoom,
      reason: "participant_state_changed",
    });
    res.json(buildHelixSharedRealtimeRoomResponse({
      ok: true,
      message: "Room presence updated.",
      room: projectedRoom,
    }));
  }),
);
