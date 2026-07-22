/**
 * Compatibility barrel for the shared Realtime room runtime registry.
 *
 * Keep consumers on this stable import path while implementation concerns stay
 * isolated in bounded modules under `runtime-registry/`.
 */
export {
  SHARED_REALTIME_ROOM_FRAME_TTL_MS,
  SHARED_REALTIME_ROOM_MAX_PROVIDER_ITEMS,
  SHARED_REALTIME_ROOM_MAX_THUMBNAIL_CHARS,
  SHARED_REALTIME_ROOM_MAX_VISUAL_FRAMES,
  SHARED_REALTIME_ROOM_THUMBNAIL_TTL_MS,
} from "./runtime-registry/state";

export {
  bindSharedRealtimeRoomAdmittedSession,
  bindSharedRealtimeRoomProviderCall,
  bindSharedRealtimeRoomTransport,
  findSharedRealtimeRoomRuntimeByRealtimeSessionId,
  markSharedRealtimeRoomRuntimeState,
  markSharedRealtimeRoomTransportActive,
  readSharedRealtimeRoomRuntime,
  readSharedRealtimeRoomRuntimeBinding,
  releaseSharedRealtimeRoomTransportBinding,
  reserveSharedRealtimeRoomRuntime,
  resetSharedRealtimeRoomRuntimeRegistryForTests,
  stopSharedRealtimeRoomRuntime,
} from "./runtime-registry/lifecycle";
export type {
  SharedRealtimeRoomRuntimeSessionBinding,
} from "./runtime-registry/state";

export {
  claimSharedRealtimeRoomSpeakerFloor,
  readSharedRealtimeRoomSpeakerFloor,
  releaseSharedRealtimeRoomSpeakerFloor,
} from "./runtime-registry/speaker-floor";
export type {
  SharedRealtimeRoomFloorProjection,
} from "./runtime-registry/speaker-floor";

export {
  admitSharedRealtimeRoomVisualFrame,
  listSharedRealtimeRoomVisualFrames,
  purgeSharedRealtimeRoomVisualFrames,
  updateSharedRealtimeRoomVisualFrameProviderDelivery,
} from "./runtime-registry/visual-frames";
export type {
  SharedRealtimeRoomVisualFrameAdmission,
} from "./runtime-registry/visual-frames";

export {
  reconcileSharedRealtimeRoomVisualFramesForConsent,
} from "./runtime-registry/visual-consent";
export type {
  SharedRealtimeRoomVisualConsentReconciliation,
} from "./runtime-registry/visual-consent";

export {
  buildSharedRealtimeRoomRuntimeDebugProjection,
} from "./runtime-registry/debug";
export type {
  SharedRealtimeRoomRuntimeDebugProjection,
} from "./runtime-registry/debug";
