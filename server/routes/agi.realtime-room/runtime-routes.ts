import { Router } from "express";
import { buildHelixSharedRealtimeRoomResponse } from
  "../../services/helix-ask/realtime-room/room-response";
import { bindOwnerRealtimeSessionToSharedRoom } from
  "../../services/helix-ask/realtime-room/runtime-session-binding";
import {
  claimSharedRealtimeRoomSpeakerFloor,
  readSharedRealtimeRoomRuntime,
  reserveSharedRealtimeRoomRuntime,
} from "../../services/helix-ask/realtime-room/runtime-registry";
import { SharedRealtimeRoomDomainError } from
  "../../services/helix-ask/realtime-room/room-store";
import {
  readAuthorizedRoom,
  readMembership,
  readRecord,
  readString,
  requireOwner,
  requirePresent,
  requireSharedRoomAccount,
  sharedRoomRoute,
  throwRuntimeError,
} from "./http-context";

export const sharedRealtimeRoomRuntimeRouter = Router();

sharedRealtimeRoomRuntimeRouter.post(
  "/realtime/rooms/:roomId/runtime/reserve",
  sharedRoomRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    const membership = await readMembership(req.params.roomId, account);
    requireOwner(membership);
    requirePresent(membership);
    const room = await readAuthorizedRoom(req.params.roomId, account);
    if (!room.readiness.ready) {
      throw new SharedRealtimeRoomDomainError(
        "shared_realtime_room_not_ready",
        409,
        "Both room members must be present and grant the required voice consent before reservation.",
      );
    }
    const model = readString(readRecord(req.body).model) ?? "gpt-realtime-2.1";
    const result = reserveSharedRealtimeRoomRuntime({
      roomId: room.room_id,
      reservedByParticipantId: membership.participantId,
      model,
      transportOwner: "host_browser",
    });
    if (!result.ok) throwRuntimeError(result.error);
    res.json(buildHelixSharedRealtimeRoomResponse({
      ok: true,
      message: result.created
        ? "The room's single shared-model slot is reserved."
        : "The room's shared-model reservation is already active.",
      room: await readAuthorizedRoom(req.params.roomId, account),
    }));
  }),
);

sharedRealtimeRoomRuntimeRouter.post(
  "/realtime/rooms/:roomId/runtime/bind",
  sharedRoomRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    const membership = await readMembership(req.params.roomId, account);
    requireOwner(membership);
    requirePresent(membership);
    const room = await readAuthorizedRoom(req.params.roomId, account);
    if (!room.readiness.ready) {
      throw new SharedRealtimeRoomDomainError(
        "shared_realtime_room_not_ready",
        409,
        "Both room members must remain present and consented before binding GPT Live.",
      );
    }
    const realtimeSessionId = readString(readRecord(req.body).realtime_session_id);
    const runtime = readSharedRealtimeRoomRuntime({ roomId: req.params.roomId });
    if (!realtimeSessionId || !runtime?.runtime_id || runtime.state === "closed") {
      throw new SharedRealtimeRoomDomainError(
        "shared_realtime_room_realtime_session_invalid",
        409,
        "Reserve the room and start the owner's GPT Live session before binding it.",
      );
    }
    const binding = bindOwnerRealtimeSessionToSharedRoom({
      roomId: req.params.roomId,
      runtimeId: runtime.runtime_id,
      realtimeSessionId,
      requesterSessionId: account.sessionId,
      participantId: membership.participantId,
    });
    if (binding.error) throwRuntimeError(binding.error);
    res.json(buildHelixSharedRealtimeRoomResponse({
      ok: true,
      message: "The owner's GPT Live transport is now the room's only shared model call.",
      room: await readAuthorizedRoom(req.params.roomId, account),
    }));
  }),
);

sharedRealtimeRoomRuntimeRouter.post(
  "/realtime/rooms/:roomId/runtime/floor",
  sharedRoomRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    const membership = await readMembership(req.params.roomId, account);
    requirePresent(membership);
    const runtime = readSharedRealtimeRoomRuntime({ roomId: req.params.roomId });
    if (!runtime?.runtime_id) {
      throw new SharedRealtimeRoomDomainError(
        "shared_realtime_room_not_ready",
        409,
        "The room runtime has not been reserved.",
      );
    }
    if (runtime.transport_owner === "host_browser" && membership.role !== "owner") {
      throw new SharedRealtimeRoomDomainError(
        "shared_realtime_room_not_ready",
        409,
        "The participant speaking floor requires the room media bridge; the current host-browser transport carries only the owner's audio.",
      );
    }
    const result = claimSharedRealtimeRoomSpeakerFloor({
      roomId: req.params.roomId,
      runtimeId: runtime.runtime_id,
      participantId: membership.participantId,
      microphoneToModelAuthorized: membership.consent.microphone_to_model,
    });
    if (!result.ok) throwRuntimeError(result.error);
    res.json(buildHelixSharedRealtimeRoomResponse({
      ok: true,
      message: "Speaking floor claimed for this participant.",
      room: await readAuthorizedRoom(req.params.roomId, account),
    }));
  }),
);
