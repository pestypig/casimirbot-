import { Router } from "express";
import { buildHelixSharedRealtimeRoomResponse } from
  "../../services/helix-ask/realtime-room/room-response";
import {
  createSharedRealtimeRoom,
  createSharedRealtimeRoomInvite,
  joinSharedRealtimeRoom,
  leaveOrCloseSharedRealtimeRoom,
  listSharedRealtimeRooms,
  SharedRealtimeRoomDomainError,
} from "../../services/helix-ask/realtime-room/room-store";
import { reconcileSharedRealtimeRoomRuntimeAfterLeave } from
  "../../services/helix-ask/realtime-room/room-runtime-reconciliation";
import {
  buildRealtimeRequesterRef,
  listAdmittedRealtimeSessions,
} from "../../services/helix-ask/realtime-session/session-registry";
import {
  readAuthorizedRoom,
  readMembership,
  readRecord,
  readString,
  requireSharedRoomAccount,
  sharedRoomRoute,
  withRuntimeProjection,
} from "./http-context";

export const sharedRealtimeRoomLifecycleRouter = Router();

sharedRealtimeRoomLifecycleRouter.get("/realtime/rooms", sharedRoomRoute(async (req, res) => {
  const account = await requireSharedRoomAccount(req);
  const rooms = (await listSharedRealtimeRooms({ profileId: account.profileId }))
    .map(withRuntimeProjection);
  res.json(buildHelixSharedRealtimeRoomResponse({
    ok: true,
    message: "Shared Realtime rooms listed.",
    rooms,
  }));
}));

sharedRealtimeRoomLifecycleRouter.post("/realtime/rooms", sharedRoomRoute(async (req, res) => {
  const account = await requireSharedRoomAccount(req);
  const body = readRecord(req.body);
  const room = withRuntimeProjection(await createSharedRealtimeRoom({
    ownerProfileId: account.profileId,
    title: readString(body.title),
  }));
  res.status(201).json(buildHelixSharedRealtimeRoomResponse({
    ok: true,
    message: "Shared Realtime room created.",
    room,
  }));
}));

sharedRealtimeRoomLifecycleRouter.post(
  "/realtime/rooms/join",
  sharedRoomRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    const inviteCode = readString(readRecord(req.body).invite_code);
    if (!inviteCode) {
      throw new SharedRealtimeRoomDomainError(
        "shared_realtime_room_invite_invalid",
        400,
        "An invite code is required.",
      );
    }
    const requesterRef = buildRealtimeRequesterRef(account.sessionId);
    const hasPersonalRealtimeSession = listAdmittedRealtimeSessions()
      .some((session) => session.requesterRef === requesterRef);
    if (hasPersonalRealtimeSession) {
      throw new SharedRealtimeRoomDomainError(
        "shared_realtime_room_personal_session_blocked",
        409,
        "Stop your personal GPT Live session before joining a one-model room.",
      );
    }
    const room = withRuntimeProjection(await joinSharedRealtimeRoom({
      profileId: account.profileId,
      inviteCode,
    }));
    res.json(buildHelixSharedRealtimeRoomResponse({
      ok: true,
      message: "Joined Shared Realtime room.",
      room,
    }));
  }),
);

sharedRealtimeRoomLifecycleRouter.get(
  "/realtime/rooms/:roomId",
  sharedRoomRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    const room = await readAuthorizedRoom(req.params.roomId, account);
    res.json(buildHelixSharedRealtimeRoomResponse({
      ok: true,
      message: "Shared Realtime room loaded.",
      room,
    }));
  }),
);

sharedRealtimeRoomLifecycleRouter.post(
  "/realtime/rooms/:roomId/invites",
  sharedRoomRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    const invitation = await createSharedRealtimeRoomInvite({
      roomId: req.params.roomId,
      ownerProfileId: account.profileId,
    });
    res.status(201).json(buildHelixSharedRealtimeRoomResponse({
      ok: true,
      message: "One-time room invitation created.",
      room: withRuntimeProjection(invitation.room),
      inviteCode: invitation.inviteCode,
      inviteExpiresAt: invitation.inviteExpiresAt,
    }));
  }),
);

sharedRealtimeRoomLifecycleRouter.post(
  "/realtime/rooms/:roomId/leave",
  sharedRoomRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    const membership = await readMembership(req.params.roomId, account);
    const result = await leaveOrCloseSharedRealtimeRoom({
      roomId: req.params.roomId,
      profileId: account.profileId,
    });

    reconcileSharedRealtimeRoomRuntimeAfterLeave({
      roomId: req.params.roomId,
      memberRole: membership.role,
      participantId: membership.participantId,
      requesterSessionId: account.sessionId,
    });

    res.json(buildHelixSharedRealtimeRoomResponse({
      ok: true,
      message: result.action === "closed"
        ? "Shared Realtime room closed."
        : "Left Shared Realtime room.",
      room: result.room ? withRuntimeProjection(result.room) : null,
    }));
  }),
);
