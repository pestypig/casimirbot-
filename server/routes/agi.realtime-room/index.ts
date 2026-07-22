import { Router } from "express";
import { installSharedRealtimeRoomBoundSessionLifecycle } from
  "../../services/helix-ask/realtime-room/bound-session-lifecycle";
import { sharedRealtimeRoomDebugRouter } from "./debug-routes";
import { sharedRealtimeRoomParticipantRouter } from "./participant-routes";
import { sharedRealtimePersonalSessionGuardRouter } from "./personal-session-guard";
import { sharedRealtimeRoomLifecycleRouter } from "./room-lifecycle-routes";
import { sharedRealtimeRoomRuntimeRouter } from "./runtime-routes";
import { sharedRealtimeRoomVisualFrameRouter } from "./visual-frame-routes";

installSharedRealtimeRoomBoundSessionLifecycle();

export const sharedRealtimeRoomRouter = Router();

sharedRealtimeRoomRouter.use(sharedRealtimePersonalSessionGuardRouter);
sharedRealtimeRoomRouter.use(sharedRealtimeRoomLifecycleRouter);
sharedRealtimeRoomRouter.use(sharedRealtimeRoomParticipantRouter);
sharedRealtimeRoomRouter.use(sharedRealtimeRoomRuntimeRouter);
sharedRealtimeRoomRouter.use(sharedRealtimeRoomVisualFrameRouter);
sharedRealtimeRoomRouter.use(sharedRealtimeRoomDebugRouter);
