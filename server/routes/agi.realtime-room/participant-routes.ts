import { Router } from "express";
import type { HelixSharedRealtimeRoomConsentPatch } from
  "@shared/helix-shared-realtime-room";
import { buildHelixSharedRealtimeRoomResponse } from
  "../../services/helix-ask/realtime-room/room-response";
import {
  patchOwnSharedRealtimeRoomConsent,
  SharedRealtimeRoomDomainError,
  updateSharedRealtimeRoomPresence,
} from "../../services/helix-ask/realtime-room/room-store";
import {
  degradeSharedRealtimeRoomRuntimeForReadiness,
  reconcileSharedRealtimeRoomVisualConsent,
} from
  "../../services/helix-ask/realtime-room/room-runtime-reconciliation";
import { sendSharedRealtimeRoomParticipantContextIfBound } from
  "../../services/helix-ask/realtime-room/participant-context";
import {
  readRecord,
  readString,
  requireSharedRoomAccount,
  sharedRoomRoute,
  withRuntimeProjection,
} from "./http-context";

export const sharedRealtimeRoomParticipantRouter = Router();

sharedRealtimeRoomParticipantRouter.patch(
  "/realtime/rooms/:roomId/consent",
  sharedRoomRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    const consent = readRecord(
      readRecord(req.body).consent,
    ) as HelixSharedRealtimeRoomConsentPatch;
    const room = await patchOwnSharedRealtimeRoomConsent({
      roomId: req.params.roomId,
      profileId: account.profileId,
      consentPatch: consent,
    });
    degradeSharedRealtimeRoomRuntimeForReadiness(room);
    reconcileSharedRealtimeRoomVisualConsent({
      room,
      participantId: room.self_participant_id,
    });
    const projectedRoom = withRuntimeProjection(room);
    sendSharedRealtimeRoomParticipantContextIfBound({
      room: projectedRoom,
      reason: "participant_state_changed",
    });
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
