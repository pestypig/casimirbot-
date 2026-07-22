import crypto from "node:crypto";
import {
  HELIX_SHARED_REALTIME_ROOM_VISUAL_FRAME_RECEIPT_SCHEMA,
  HELIX_SHARED_REALTIME_ROOM_VISUAL_FRAME_SCHEMA,
  type HelixSharedRealtimeRoomErrorCode,
  type HelixSharedRealtimeRoomFrameDelivery,
  type HelixSharedRealtimeRoomVisualFrame,
  type HelixSharedRealtimeRoomVisualFrameReceipt,
  type HelixSharedRealtimeRoomVisualSourceSurface,
} from "@shared/helix-shared-realtime-room";
import {
  SHARED_REALTIME_ROOM_FRAME_TTL_MS,
  SHARED_REALTIME_ROOM_MAX_PROVIDER_ITEMS,
  SHARED_REALTIME_ROOM_MAX_THUMBNAIL_CHARS,
  SHARED_REALTIME_ROOM_MAX_VISUAL_FRAMES,
  SHARED_REALTIME_ROOM_THUMBNAIL_TTL_MS,
  digest,
  ensureRuntimeRecord,
  iso,
  pruneFrames,
  readRef,
  readRuntimeRecord,
  type StoredVisualFrame,
} from "./state";

const validThumbnail = (value: string): boolean =>
  value.length <= SHARED_REALTIME_ROOM_MAX_THUMBNAIL_CHARS &&
  /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(value);

const cloneVisualFrame = (
  stored: StoredVisualFrame,
  includeAuthorizedThumbnail: boolean,
  nowMs: number,
): HelixSharedRealtimeRoomVisualFrame => {
  const previewActive =
    includeAuthorizedThumbnail &&
    Boolean(stored.frame.preview_data_url) &&
    Boolean(stored.frame.preview_expires_at) &&
    Date.parse(stored.frame.preview_expires_at as string) > nowMs;
  return {
    ...stored.frame,
    preview_data_url: previewActive ? stored.frame.preview_data_url : null,
    raw_content_included: previewActive,
  };
};

const buildFrameReceipt = (input: {
  ok: boolean;
  error: HelixSharedRealtimeRoomErrorCode | null;
  roomId: string;
  frame?: HelixSharedRealtimeRoomVisualFrame | null;
  participantId?: string | null;
  delivery: HelixSharedRealtimeRoomFrameDelivery;
}): HelixSharedRealtimeRoomVisualFrameReceipt => ({
  schema: HELIX_SHARED_REALTIME_ROOM_VISUAL_FRAME_RECEIPT_SCHEMA,
  ok: input.ok,
  error: input.error,
  frame_ref: input.frame?.frame_ref ?? null,
  room_id: input.roomId,
  participant_id: input.frame?.participant_id ?? input.participantId ?? null,
  runtime_id: input.frame?.runtime_id ?? null,
  image_hash: input.frame?.image_hash ?? null,
  provider_delivery: input.delivery,
  carousel_visible: Boolean(input.frame?.preview_data_url),
  context_role: "tool_evidence",
  reentry_required: true,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

export type SharedRealtimeRoomVisualFrameAdmission = {
  ok: boolean;
  error: HelixSharedRealtimeRoomErrorCode | null;
  duplicate: boolean;
  frame: HelixSharedRealtimeRoomVisualFrame | null;
  receipt: HelixSharedRealtimeRoomVisualFrameReceipt;
  /** Internal control ID; do not serialize into room/debug responses. */
  providerItemId: string | null;
  /** Delete this item before creating providerItemId. Internal only. */
  prunedProviderItemId: string | null;
};

/**
 * Retains metadata and an optional room-authorized thumbnail only. The input
 * deliberately has no full-image field, and unknown object properties are not
 * copied into storage.
 */
export const admitSharedRealtimeRoomVisualFrame = (input: {
  roomId: string;
  participantId: string;
  participantDisplayName: string;
  sourceId: string;
  sourceSurface: HelixSharedRealtimeRoomVisualSourceSurface;
  sequence: number;
  capturedAtMs: number;
  imageHash: string;
  consentReceiptRef: string;
  screenToModelAuthorized: boolean;
  thumbnailToRoomAuthorized: boolean;
  authorizedThumbnailDataUrl?: string | null;
  providerDeliveryAvailable?: boolean;
  nowMs?: number;
}): SharedRealtimeRoomVisualFrameAdmission => {
  const nowMs = input.nowMs ?? Date.now();
  const roomId = readRef(input.roomId) ?? "invalid-room";
  const participantId = readRef(input.participantId);
  const participantDisplayName = readRef(input.participantDisplayName, 120);
  const sourceId = readRef(input.sourceId);
  const imageHash = readRef(input.imageHash, 160);
  const consentReceiptRef = readRef(input.consentReceiptRef, 260);
  const capturedAtMs = Number.isFinite(input.capturedAtMs)
    ? Math.trunc(input.capturedAtMs)
    : Number.NaN;
  const sequence = Number.isFinite(input.sequence) ? Math.trunc(input.sequence) : -1;
  const validCaptureTime =
    Number.isFinite(capturedAtMs) &&
    capturedAtMs <= nowMs + 60_000 &&
    capturedAtMs > nowMs - SHARED_REALTIME_ROOM_FRAME_TTL_MS;
  if (
    roomId === "invalid-room" ||
    !participantId ||
    !participantDisplayName ||
    !sourceId ||
    !imageHash ||
    !consentReceiptRef ||
    sequence < 0 ||
    !validCaptureTime
  ) {
    const receipt = buildFrameReceipt({
      ok: false,
      error: "shared_realtime_room_visual_frame_invalid",
      roomId,
      participantId,
      delivery: "runtime_not_bound",
    });
    return {
      ok: false,
      error: receipt.error,
      duplicate: false,
      frame: null,
      receipt,
      providerItemId: null,
      prunedProviderItemId: null,
    };
  }
  if (!input.screenToModelAuthorized && !input.thumbnailToRoomAuthorized) {
    const receipt = buildFrameReceipt({
      ok: false,
      error: "shared_realtime_room_consent_required",
      roomId,
      participantId,
      delivery: "blocked_by_consent",
    });
    return {
      ok: false,
      error: receipt.error,
      duplicate: false,
      frame: null,
      receipt,
      providerItemId: null,
      prunedProviderItemId: null,
    };
  }

  const record = ensureRuntimeRecord(roomId, nowMs);
  pruneFrames(record, nowMs);
  const duplicate = record.frames.find((entry) =>
    entry.frame.participant_id === participantId &&
    entry.frame.source_id === sourceId &&
    entry.frame.image_hash === imageHash);
  if (duplicate) {
    const frame = cloneVisualFrame(duplicate, input.thumbnailToRoomAuthorized, nowMs);
    const receipt = buildFrameReceipt({
      ok: true,
      error: null,
      roomId,
      frame,
      delivery: "duplicate",
    });
    return {
      ok: true,
      error: null,
      duplicate: true,
      frame,
      receipt,
      providerItemId: null,
      prunedProviderItemId: null,
    };
  }

  const thumbnail =
    input.thumbnailToRoomAuthorized &&
    typeof input.authorizedThumbnailDataUrl === "string" &&
    validThumbnail(input.authorizedThumbnailDataUrl)
      ? input.authorizedThumbnailDataUrl
      : null;
  const runtimeId = record.runtime.runtime_id && record.runtime.state !== "closed"
    ? record.runtime.runtime_id
    : null;
  const canOfferProviderItem =
    input.screenToModelAuthorized &&
    input.providerDeliveryAvailable === true &&
    Boolean(runtimeId) &&
    Boolean(record.admittedRealtimeSessionId) &&
    Boolean(record.providerCallId);
  const providerItemId = canOfferProviderItem
    ? `item_room_visual_${digest([
        roomId,
        runtimeId,
        participantId,
        sourceId,
        String(sequence),
        imageHash,
        crypto.randomUUID(),
      ].join(":" )).slice(0, 24)}`
    : null;
  let prunedProviderItemId: string | null = null;
  if (providerItemId && record.providerItems.length >= SHARED_REALTIME_ROOM_MAX_PROVIDER_ITEMS) {
    prunedProviderItemId = record.providerItems.shift()?.itemId ?? null;
  }
  const frameRef = `room-visual-frame:${digest([
    roomId,
    runtimeId,
    participantId,
    sourceId,
    String(sequence),
    imageHash,
    String(capturedAtMs),
  ].join(":" )).slice(0, 24)}`;
  if (providerItemId) {
    record.providerItems.push({ itemId: providerItemId, frameRef });
  }
  const delivery: HelixSharedRealtimeRoomFrameDelivery = !input.screenToModelAuthorized
    ? "blocked_by_consent"
    : providerItemId
      ? "sideband_unavailable"
      : "runtime_not_bound";
  const frame: HelixSharedRealtimeRoomVisualFrame = {
    schema: HELIX_SHARED_REALTIME_ROOM_VISUAL_FRAME_SCHEMA,
    frame_ref: frameRef,
    room_id: roomId,
    runtime_id: runtimeId,
    participant_id: participantId,
    participant_display_name: participantDisplayName,
    source_id: sourceId,
    source_surface: input.sourceSurface,
    captured_at: iso(capturedAtMs),
    sequence,
    image_hash: imageHash,
    preview_hash: thumbnail ? `sha256:${digest(thumbnail)}` : null,
    preview_data_url: thumbnail,
    preview_expires_at: thumbnail
      ? iso(nowMs + SHARED_REALTIME_ROOM_THUMBNAIL_TTL_MS)
      : null,
    provider_delivery: delivery,
    consent_receipt_ref: consentReceiptRef,
    provenance: "participant_claimed_browser_capture",
    content_role: "observation_not_assistant_answer",
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: Boolean(thumbnail),
  };
  record.frames.push({
    frame,
    expiresAtMs: capturedAtMs + SHARED_REALTIME_ROOM_FRAME_TTL_MS,
    providerItemId,
  });
  if (record.frames.length > SHARED_REALTIME_ROOM_MAX_VISUAL_FRAMES) {
    record.frames.splice(0, record.frames.length - SHARED_REALTIME_ROOM_MAX_VISUAL_FRAMES);
  }
  const responseFrame = cloneVisualFrame(
    record.frames[record.frames.length - 1]!,
    input.thumbnailToRoomAuthorized,
    nowMs,
  );
  const receipt = buildFrameReceipt({
    ok: true,
    error: null,
    roomId,
    frame: responseFrame,
    delivery,
  });
  return {
    ok: true,
    error: null,
    duplicate: false,
    frame: responseFrame,
    receipt,
    providerItemId,
    prunedProviderItemId,
  };
};

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
  return cloneVisualFrame(stored, false, input.nowMs ?? Date.now());
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
    cloneVisualFrame(entry, input.includeAuthorizedThumbnails === true, nowMs));
};

/** Removes retained participant pixels/metadata and returns private provider IDs for best-effort deletion. */
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
