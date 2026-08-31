import { Router } from "express";
import { buildHelixSharedRealtimeRoomResponse } from
  "../../services/helix-ask/realtime-room/room-response";
import { bindOwnerRealtimeSessionToSharedRoom } from
  "../../services/helix-ask/realtime-room/runtime-session-binding";
import {
  sendSharedRealtimeRoomParticipantContext,
  sendSharedRealtimeRoomParticipantContextIfBound,
} from "../../services/helix-ask/realtime-room/participant-context";
import {
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
  requireSharedRoomAccountContext,
  sharedRoomRoute,
  throwRuntimeError,
} from "./http-context";
import { buildSharedLiveRoomControlActorFromAccountContext } from
  "../../services/shared-live-room-control/service";
import { getSharedLiveRoomControlService } from
  "../../services/shared-live-room-control/default-service";

export const sharedRealtimeRoomRuntimeRouter = Router();
const sharedLiveRoomControlService = getSharedLiveRoomControlService();

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
    const projectedRoom = await readAuthorizedRoom(req.params.roomId, account);
    sendSharedRealtimeRoomParticipantContextIfBound({
      room: projectedRoom,
      reason: "participant_state_changed",
    });
    res.json(buildHelixSharedRealtimeRoomResponse({
      ok: true,
      message: result.created
        ? "The room's single shared-model slot is reserved."
        : "The room's shared-model reservation is already active.",
      room: projectedRoom,
    }));
  }),
);

sharedRealtimeRoomRuntimeRouter.post(
  "/realtime/rooms/:roomId/runtime/floor/release",
  sharedRoomRoute(async (req, res) => {
    const actor = buildSharedLiveRoomControlActorFromAccountContext(
      await requireSharedRoomAccountContext(req),
    );
    const floor = await sharedLiveRoomControlService.inspectFloor({
      actor,
      roomId: req.params.roomId,
    });
    const result = await sharedLiveRoomControlService.releaseOwnFloor({
      actor,
      request: {
        room_id: req.params.roomId,
        floor_epoch: floor.floor?.epoch ?? 0,
      },
    });
    res.json(buildHelixSharedRealtimeRoomResponse({
      ok: true,
      message: result.released
        ? "Speaking floor released."
        : "This participant did not own the speaking floor.",
      room: result.room,
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
    const projectedRoom = await readAuthorizedRoom(req.params.roomId, account);
    sendSharedRealtimeRoomParticipantContext({
      room: projectedRoom,
      realtimeSessionId,
      reason: "runtime_bound",
    });
    res.json(buildHelixSharedRealtimeRoomResponse({
      ok: true,
      message: "The owner's GPT Live transport is now the room's only shared model call.",
      room: projectedRoom,
    }));
  }),
);

sharedRealtimeRoomRuntimeRouter.post(
  "/realtime/rooms/:roomId/runtime/floor",
  sharedRoomRoute(async (req, res) => {
    const actor = buildSharedLiveRoomControlActorFromAccountContext(
      await requireSharedRoomAccountContext(req),
    );
    const room = await sharedLiveRoomControlService.acquireOwnFloorFromFirstPartyUi({
      actor,
      request: { room_id: req.params.roomId },
    });
    res.json(buildHelixSharedRealtimeRoomResponse({
      ok: true,
      message: "Speaking floor claimed for this participant.",
      room,
    }));
  }),
);
