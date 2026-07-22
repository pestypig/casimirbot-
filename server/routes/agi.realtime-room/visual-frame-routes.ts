import { Router } from "express";
import { buildHelixSharedRealtimeRoomResponse } from
  "../../services/helix-ask/realtime-room/room-response";
import { listSharedRealtimeRoomVisualFrames } from
  "../../services/helix-ask/realtime-room/runtime-registry";
import { ingestSharedRealtimeRoomVisualFrame } from
  "../../services/helix-ask/realtime-room/visual-frame-ingress";
import {
  readMembership,
  requirePresent,
  requireSharedRoomAccount,
  sharedRoomRoute,
  throwRuntimeError,
} from "./http-context";

export const sharedRealtimeRoomVisualFrameRouter = Router();

sharedRealtimeRoomVisualFrameRouter.get(
  "/realtime/rooms/:roomId/visual-frames",
  sharedRoomRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    await readMembership(req.params.roomId, account);
    const frames = listSharedRealtimeRoomVisualFrames({
      roomId: req.params.roomId,
      includeAuthorizedThumbnails: true,
    });
    res.json(buildHelixSharedRealtimeRoomResponse({
      ok: true,
      message: "Participant visual lanes loaded.",
      frames,
    }));
  }),
);

sharedRealtimeRoomVisualFrameRouter.post(
  "/realtime/rooms/:roomId/visual-frames",
  sharedRoomRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    const membership = await readMembership(req.params.roomId, account);
    requirePresent(membership);
    const ingress = ingestSharedRealtimeRoomVisualFrame({
      roomId: req.params.roomId,
      membership,
      payload: req.body,
    });
    if (ingress.error) throwRuntimeError(ingress.error);
    res.json(buildHelixSharedRealtimeRoomResponse({
      ok: true,
      message: ingress.message,
      frameReceipt: ingress.receipt,
    }));
  }),
);
