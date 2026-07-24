import { Router } from "express";
import { installSharedRealtimeRoomBoundSessionLifecycle } from
  "../../services/helix-ask/realtime-room/bound-session-lifecycle";
import { installSharedRealtimeRoomProviderFrameAcknowledgement } from
  "../../services/helix-ask/realtime-room/provider-frame-acknowledgement";
import { sharedRealtimeRoomDebugRouter } from "./debug-routes";
import { sharedRealtimeRoomParticipantRouter } from "./participant-routes";
import { sharedRealtimePersonalSessionGuardRouter } from "./personal-session-guard";
import { sharedRealtimeRoomLifecycleRouter } from "./room-lifecycle-routes";
import { sharedRealtimeRoomMediaSignalRouter } from "./media-signal-routes";
import { sharedRealtimeRoomRuntimeRouter } from "./runtime-routes";
import { sharedRealtimeRoomVisualFrameRouter } from "./visual-frame-routes";

installSharedRealtimeRoomBoundSessionLifecycle();
installSharedRealtimeRoomProviderFrameAcknowledgement();

export const sharedRealtimeRoomRouter = Router();

sharedRealtimeRoomRouter.use(sharedRealtimePersonalSessionGuardRouter);
sharedRealtimeRoomRouter.use(sharedRealtimeRoomLifecycleRouter);
sharedRealtimeRoomRouter.use(sharedRealtimeRoomParticipantRouter);
sharedRealtimeRoomRouter.use(sharedRealtimeRoomRuntimeRouter);
sharedRealtimeRoomRouter.use(sharedRealtimeRoomMediaSignalRouter);
sharedRealtimeRoomRouter.use(sharedRealtimeRoomVisualFrameRouter);
sharedRealtimeRoomRouter.use(sharedRealtimeRoomDebugRouter);
