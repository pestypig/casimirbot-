/** Stable visual-frame barrel; admission and retention mutate separate concerns. */
export {
  admitSharedRealtimeRoomVisualFrame,
} from "./visual-frame-admission";
export type {
  SharedRealtimeRoomVisualFrameAdmission,
} from "./visual-frame-admission";

export {
  listSharedRealtimeRoomVisualFrames,
  purgeSharedRealtimeRoomVisualFrames,
  rejectSharedRealtimeRoomVisualFrameByProviderEvent,
  registerSharedRealtimeRoomVisualFrameProviderEvent,
  updateSharedRealtimeRoomVisualFrameProviderDelivery,
  updateSharedRealtimeRoomVisualFrameByProviderItem,
} from "./visual-frame-retention";
