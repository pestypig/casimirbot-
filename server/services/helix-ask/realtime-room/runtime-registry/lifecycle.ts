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
  findSharedRealtimeRoomRuntimeByRealtimeSessionId,
  markSharedRealtimeRoomTransportActive,
  readSharedRealtimeRoomRuntimeBinding,
} from "./transport-binding";

export {
  markSharedRealtimeRoomRuntimeState,
  releaseSharedRealtimeRoomTransportBinding,
  stopSharedRealtimeRoomRuntime,
} from "./runtime-state";
