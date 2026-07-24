/** Stable lifecycle barrel; implementation is split by mutation authority. */
export {
  readSharedRealtimeRoomRuntime,
  reserveSharedRealtimeRoomRuntime,
  resetSharedRealtimeRoomRuntimeRegistryForTests,
} from "./reservation";

export {
  bindSharedRealtimeRoomAdmittedSession,
  bindSharedRealtimeRoomProviderCall,
  bindSharedRealtimeRoomTransport,
  demoteSharedRealtimeRoomMediaBridge,
  findSharedRealtimeRoomRuntimeByRealtimeSessionId,
  markSharedRealtimeRoomTransportActive,
  promoteSharedRealtimeRoomMediaBridge,
  readSharedRealtimeRoomRuntimeBinding,
} from "./transport-binding";

export {
  markSharedRealtimeRoomRuntimeState,
  releaseSharedRealtimeRoomTransportBinding,
  stopSharedRealtimeRoomRuntime,
} from "./runtime-state";
