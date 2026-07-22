import {
  readRef,
  readRuntimeRecord,
} from "./state";

export type SharedRealtimeRoomVisualConsentReconciliation = {
  removedFrameCount: number;
  strippedPreviewCount: number;
  providerItemIds: string[];
};

/**
 * Applies the participant's current visual grants to content already retained
 * by the room registry. Full images are never stored here; this handles the
 * ephemeral preview and provider conversation item references.
 */
export const reconcileSharedRealtimeRoomVisualFramesForConsent = (input: {
  roomId: string;
  participantId: string;
  screenToModelAuthorized: boolean;
  thumbnailToRoomAuthorized: boolean;
  nowMs?: number;
}): SharedRealtimeRoomVisualConsentReconciliation => {
  const record = readRuntimeRecord(input.roomId, input.nowMs);
  const participantId = readRef(input.participantId);
  if (!record || !participantId) {
    return { removedFrameCount: 0, strippedPreviewCount: 0, providerItemIds: [] };
  }

  const participantFrames = record.frames.filter(
    (entry) => entry.frame.participant_id === participantId,
  );
  if (participantFrames.length === 0) {
    return { removedFrameCount: 0, strippedPreviewCount: 0, providerItemIds: [] };
  }

  const participantFrameRefs = new Set(
    participantFrames.map((entry) => entry.frame.frame_ref),
  );
  const providerItemIds = new Set<string>();
  if (!input.screenToModelAuthorized) {
    for (const entry of participantFrames) {
      if (entry.providerItemId) providerItemIds.add(entry.providerItemId);
    }
    for (const item of record.providerItems) {
      if (participantFrameRefs.has(item.frameRef)) providerItemIds.add(item.itemId);
    }
  }

  if (!input.screenToModelAuthorized && !input.thumbnailToRoomAuthorized) {
    record.frames = record.frames.filter(
      (entry) => entry.frame.participant_id !== participantId,
    );
    record.providerItems = record.providerItems.filter(
      (item) => !participantFrameRefs.has(item.frameRef),
    );
    return {
      removedFrameCount: participantFrames.length,
      strippedPreviewCount: participantFrames.filter((entry) => entry.frame.preview_data_url).length,
      providerItemIds: [...providerItemIds],
    };
  }

  let strippedPreviewCount = 0;
  for (const entry of participantFrames) {
    if (!input.thumbnailToRoomAuthorized && entry.frame.preview_data_url) {
      strippedPreviewCount += 1;
      entry.frame = {
        ...entry.frame,
        preview_hash: null,
        preview_data_url: null,
        preview_expires_at: null,
        raw_content_included: false,
      };
    }
    if (!input.screenToModelAuthorized) {
      entry.providerItemId = null;
      entry.frame = {
        ...entry.frame,
        provider_delivery: "blocked_by_consent",
      };
    }
  }
  if (!input.screenToModelAuthorized) {
    record.providerItems = record.providerItems.filter(
      (item) => !participantFrameRefs.has(item.frameRef),
    );
  }
  return {
    removedFrameCount: 0,
    strippedPreviewCount,
    providerItemIds: [...providerItemIds],
  };
};
