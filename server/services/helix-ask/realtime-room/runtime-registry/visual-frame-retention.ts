import type {
  HelixSharedRealtimeRoomFrameDelivery,
  HelixSharedRealtimeRoomVisualFrame,
} from "@shared/helix-shared-realtime-room";
import { readRef, readRuntimeRecord } from "./state";
import { cloneSharedRealtimeRoomVisualFrame } from "./visual-frame-projection";

export const updateSharedRealtimeRoomVisualFrameProviderDelivery = (input: {
  roomId: string;
  frameRef: string;
  providerItemId: string;
  delivery: Extract<
    HelixSharedRealtimeRoomFrameDelivery,
    "sent_to_shared_model" | "sideband_unavailable" | "runtime_not_bound"
  >;
  nowMs?: number;
}): HelixSharedRealtimeRoomVisualFrame | null => {
  const record = readRuntimeRecord(input.roomId, input.nowMs);
  const frameRef = readRef(input.frameRef);
  const providerItemId = readRef(input.providerItemId);
  if (!record || !frameRef || !providerItemId) return null;
  const stored = record.frames.find((entry) => entry.frame.frame_ref === frameRef);
  if (!stored || stored.providerItemId !== providerItemId) return null;
  stored.frame = { ...stored.frame, provider_delivery: input.delivery };
  if (input.delivery !== "sent_to_shared_model") {
    record.providerItems = record.providerItems.filter((entry) => entry.itemId !== providerItemId);
    stored.providerItemId = null;
  }
  return cloneSharedRealtimeRoomVisualFrame(stored, false, input.nowMs ?? Date.now());
};

export const listSharedRealtimeRoomVisualFrames = (input: {
  roomId: string;
  includeAuthorizedThumbnails?: boolean;
  nowMs?: number;
}): HelixSharedRealtimeRoomVisualFrame[] => {
  const nowMs = input.nowMs ?? Date.now();
  const record = readRuntimeRecord(input.roomId, nowMs);
  if (!record) return [];
  return record.frames.map((entry) =>
    cloneSharedRealtimeRoomVisualFrame(
      entry,
      input.includeAuthorizedThumbnails === true,
      nowMs,
    ));
};

/** Removes retained pixels/metadata and returns provider IDs for deletion. */
export const purgeSharedRealtimeRoomVisualFrames = (input: {
  roomId: string;
  participantId?: string | null;
  nowMs?: number;
}): { removedFrameCount: number; providerItemIds: string[] } => {
  const record = readRuntimeRecord(input.roomId, input.nowMs);
  if (!record) return { removedFrameCount: 0, providerItemIds: [] };
  const participantId = input.participantId == null ? null : readRef(input.participantId);
  if (input.participantId != null && !participantId) {
    return { removedFrameCount: 0, providerItemIds: [] };
  }
  const removed = record.frames.filter((entry) =>
    participantId === null || entry.frame.participant_id === participantId);
  if (removed.length === 0) return { removedFrameCount: 0, providerItemIds: [] };
  const removedFrameRefs = new Set(removed.map((entry) => entry.frame.frame_ref));
  const providerItemIds = record.providerItems
    .filter((entry) => removedFrameRefs.has(entry.frameRef))
    .map((entry) => entry.itemId);
  record.frames = record.frames.filter((entry) => !removedFrameRefs.has(entry.frame.frame_ref));
  record.providerItems = record.providerItems.filter((entry) => !removedFrameRefs.has(entry.frameRef));
  return { removedFrameCount: removed.length, providerItemIds };
};
