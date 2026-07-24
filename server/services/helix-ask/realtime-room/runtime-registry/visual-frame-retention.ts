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
    | "transport_sent"
    | "sent_to_shared_model"
    | "provider_rejected"
    | "sideband_unavailable"
    | "runtime_not_bound"
  >;
  nowMs?: number;
}): HelixSharedRealtimeRoomVisualFrame | null => {
  const record = readRuntimeRecord(input.roomId, input.nowMs);
  const frameRef = readRef(input.frameRef);
  const providerItemId = readRef(input.providerItemId);
  if (!record || !frameRef || !providerItemId) return null;
  const stored = record.frames.find((entry) => entry.frame.frame_ref === frameRef);
  if (!stored || stored.providerItemId !== providerItemId) return null;
  if (
    stored.frame.provider_delivery === "sent_to_shared_model" &&
    input.delivery !== "sent_to_shared_model"
  ) {
    return null;
  }
  stored.frame = { ...stored.frame, provider_delivery: input.delivery };
  if (
    input.delivery !== "sent_to_shared_model" &&
    input.delivery !== "transport_sent"
  ) {
    record.providerItems = record.providerItems.filter((entry) => entry.itemId !== providerItemId);
    stored.providerItemId = null;
  }
  return cloneSharedRealtimeRoomVisualFrame(stored, false, input.nowMs ?? Date.now());
};

export const registerSharedRealtimeRoomVisualFrameProviderEvent = (input: {
  roomId: string;
  providerItemId: string;
  providerEventId: string;
  nowMs?: number;
}): boolean => {
  const record = readRuntimeRecord(input.roomId, input.nowMs);
  const providerItemId = readRef(input.providerItemId);
  const providerEventId = readRef(input.providerEventId);
  if (!record || !providerItemId || !providerEventId) return false;
  const providerItem = record.providerItems.find((entry) => entry.itemId === providerItemId);
  if (!providerItem) return false;
  providerItem.eventId = providerEventId;
  return true;
};

export const updateSharedRealtimeRoomVisualFrameByProviderItem = (input: {
  roomId: string;
  providerItemId: string;
  delivery: "sent_to_shared_model" | "provider_rejected";
  nowMs?: number;
}): HelixSharedRealtimeRoomVisualFrame | null => {
  const record = readRuntimeRecord(input.roomId, input.nowMs);
  const providerItemId = readRef(input.providerItemId);
  if (!record || !providerItemId) return null;
  const providerItem = record.providerItems.find((entry) => entry.itemId === providerItemId);
  if (!providerItem) return null;
  return updateSharedRealtimeRoomVisualFrameProviderDelivery({
    roomId: input.roomId,
    frameRef: providerItem.frameRef,
    providerItemId,
    delivery: input.delivery,
    nowMs: input.nowMs,
  });
};

export const rejectSharedRealtimeRoomVisualFrameByProviderEvent = (input: {
  roomId: string;
  providerEventId: string;
  nowMs?: number;
}): HelixSharedRealtimeRoomVisualFrame | null => {
  const record = readRuntimeRecord(input.roomId, input.nowMs);
  const providerEventId = readRef(input.providerEventId);
  if (!record || !providerEventId) return null;
  const providerItem = record.providerItems.find((entry) => entry.eventId === providerEventId);
  if (!providerItem) return null;
  return updateSharedRealtimeRoomVisualFrameProviderDelivery({
    roomId: input.roomId,
    frameRef: providerItem.frameRef,
    providerItemId: providerItem.itemId,
    delivery: "provider_rejected",
    nowMs: input.nowMs,
  });
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
