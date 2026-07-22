import type { RuntimeRecord } from "./state";

/** Detaches provider-private item state while keeping carousel observations. */
export const detachSharedRealtimeRoomProviderFrameState = (
  record: RuntimeRecord,
): void => {
  record.providerItems = [];
  record.frames = record.frames.map((entry) => ({
    ...entry,
    providerItemId: null,
    frame: entry.frame.provider_delivery === "sent_to_shared_model"
      ? { ...entry.frame, provider_delivery: "runtime_not_bound" }
      : entry.frame,
  }));
};
