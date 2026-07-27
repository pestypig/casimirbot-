import crypto from "node:crypto";
import { Router } from "express";
import { buildHelixSharedRealtimeRoomResponse } from
  "../../services/helix-ask/realtime-room/room-response";
import {
  createSharedRealtimeRoomInvite,
  joinSharedRealtimeRoom,
  leaveOrCloseSharedRealtimeRoom,
  SharedRealtimeRoomDomainError,
} from "../../services/helix-ask/realtime-room/room-store";
import {
  buildSharedLiveRoomControlActorFromAccountContext,
} from "../../services/shared-live-room-control/service";
import { getSharedLiveRoomControlService } from
  "../../services/shared-live-room-control/default-service";
import { reconcileSharedRealtimeRoomRuntimeAfterLeave } from
  "../../services/helix-ask/realtime-room/room-runtime-reconciliation";
import { sendSharedRealtimeRoomParticipantContextIfBound } from
  "../../services/helix-ask/realtime-room/participant-context";
import {
  buildRealtimeRequesterRef,
  listAdmittedRealtimeSessions,
} from "../../services/helix-ask/realtime-session/session-registry";
import { buildRuntimeGoalProfileRef } from
  "../../services/helix-ask/runtime-goals/runtime-goal-account-binding";
import { runWithSharedRealtimeProfileAdmissionLock } from
  "../../services/helix-ask/realtime-room/profile-admission-lock";
import {
  readAuthorizedRoom,
  readMembership,
  readRecord,
  readString,
  requireSharedRoomAccount,
  requireSharedRoomAccountContext,
  sharedRoomRoute,
  withRuntimeProjection,
} from "./http-context";

export const sharedRealtimeRoomLifecycleRouter = Router();
const sharedLiveRoomControlService = getSharedLiveRoomControlService();

sharedRealtimeRoomLifecycleRouter.get("/realtime/rooms", sharedRoomRoute(async (req, res) => {
  const actor = buildSharedLiveRoomControlActorFromAccountContext(
    await requireSharedRoomAccountContext(req),
  );
  const receipt = await sharedLiveRoomControlService.listRooms({ actor });
  res.json(buildHelixSharedRealtimeRoomResponse({
    ok: true,
    message: "Shared Realtime rooms listed.",
    rooms: receipt.rooms,
  }));
}));

sharedRealtimeRoomLifecycleRouter.post("/realtime/rooms", sharedRoomRoute(async (req, res) => {
  const context = await requireSharedRoomAccountContext(req);
  const actor = buildSharedLiveRoomControlActorFromAccountContext(context);
  const body = readRecord(req.body);
  const suppliedIdempotencyKey =
    req.get("idempotency-key")?.trim() ||
    req.get("x-idempotency-key")?.trim() ||
    "";
  const created = await sharedLiveRoomControlService.createRoom({
    actor,
    idempotencyKey:
      suppliedIdempotencyKey || `legacy-room-create:${crypto.randomUUID()}`,
    request: {
      ...(readString(body.title) ? { title: readString(body.title) } : {}),
    },
  });
  res.status(201).json(buildHelixSharedRealtimeRoomResponse({
    ok: true,
    message: "Shared Realtime room created.",
    room: created.body.room,
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
    const room = await runWithSharedRealtimeProfileAdmissionLock(
      account.profileId,
      async () => {
        const requesterRef = buildRealtimeRequesterRef(account.sessionId);
        const profileRef = buildRuntimeGoalProfileRef(account.profileId);
        const hasPersonalRealtimeSession = listAdmittedRealtimeSessions()
          .some((session) =>
            session.requesterRef === requesterRef ||
            session.runtimeGoalAccountScope?.profile_ref === profileRef);
        if (hasPersonalRealtimeSession) {
          throw new SharedRealtimeRoomDomainError(
            "shared_realtime_room_personal_session_blocked",
            409,
            "Stop your personal GPT Live session before joining a one-model room.",
          );
        }
        return withRuntimeProjection(await joinSharedRealtimeRoom({
          profileId: account.profileId,
          inviteCode,
        }));
      },
    );
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
    const projectedRoom = result.room ? withRuntimeProjection(result.room) : null;
    if (projectedRoom) {
      sendSharedRealtimeRoomParticipantContextIfBound({
        room: projectedRoom,
        reason: "participant_state_changed",
      });
    }

    res.json(buildHelixSharedRealtimeRoomResponse({
      ok: true,
      message: result.action === "closed"
        ? "Shared Realtime room closed."
        : "Left Shared Realtime room.",
      room: projectedRoom,
    }));
  }),
);
