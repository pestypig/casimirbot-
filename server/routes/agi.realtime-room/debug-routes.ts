import { Router } from "express";
import { buildHelixSharedRealtimeRoomResponse } from
  "../../services/helix-ask/realtime-room/room-response";
import { readSharedRealtimeRoomAuditSummary } from
  "../../services/helix-ask/realtime-room/room-store";
import { buildSharedRealtimeRoomRuntimeDebugProjection } from
  "../../services/helix-ask/realtime-room/runtime-registry";
import {
  readAuthorizedRoom,
  requireSharedRoomAccount,
  sharedRoomRoute,
} from "./http-context";

export const sharedRealtimeRoomDebugRouter = Router();

sharedRealtimeRoomDebugRouter.get(
  "/realtime/rooms/:roomId/debug",
  sharedRoomRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    const room = await readAuthorizedRoom(req.params.roomId, account);
    const summary = await readSharedRealtimeRoomAuditSummary({
      roomId: req.params.roomId,
      profileId: account.profileId,
    });
    const debug = buildSharedRealtimeRoomRuntimeDebugProjection({
      room,
      inviteCount: summary.inviteCount,
      auditEventCount: summary.auditEventCount,
    });
    res.json(buildHelixSharedRealtimeRoomResponse({
      ok: true,
      message: "Sanitized Shared Realtime room debug evidence loaded.",
      debug,
    }));
  }),
);
