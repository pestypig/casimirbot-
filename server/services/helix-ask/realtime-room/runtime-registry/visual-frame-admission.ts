import crypto from "node:crypto";
import {
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
  SHARED_REALTIME_ROOM_MAX_VISUAL_FRAMES,
  SHARED_REALTIME_ROOM_THUMBNAIL_TTL_MS,
  digest,
  ensureRuntimeRecord,
  iso,
  pruneFrames,
  readRef,
} from "./state";
import {
  buildSharedRealtimeRoomVisualFrameReceipt,
  cloneSharedRealtimeRoomVisualFrame,
  validAuthorizedThumbnailDataUrl,
} from "./visual-frame-projection";

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

/** Retains metadata plus an optional authorized preview, never the full image. */
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
    const receipt = buildSharedRealtimeRoomVisualFrameReceipt({
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
    const receipt = buildSharedRealtimeRoomVisualFrameReceipt({
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
  const retryUndeliveredProviderFrame = Boolean(
    duplicate &&
    input.screenToModelAuthorized &&
    input.providerDeliveryAvailable === true &&
    duplicate.frame.provider_delivery !== "sent_to_shared_model",
  );
  if (duplicate && !retryUndeliveredProviderFrame) {
    const frame = cloneSharedRealtimeRoomVisualFrame(
      duplicate,
      input.thumbnailToRoomAuthorized,
      nowMs,
    );
    const receipt = buildSharedRealtimeRoomVisualFrameReceipt({
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
  if (duplicate) {
    record.frames = record.frames.filter((entry) => entry !== duplicate);
    record.providerItems = record.providerItems.filter(
      (entry) => entry.frameRef !== duplicate.frame.frame_ref,
    );
  }

  const thumbnail =
    input.thumbnailToRoomAuthorized &&
    typeof input.authorizedThumbnailDataUrl === "string" &&
    validAuthorizedThumbnailDataUrl(input.authorizedThumbnailDataUrl)
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
      ].join(":")).slice(0, 24)}`
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
  ].join(":")).slice(0, 24)}`;
  if (providerItemId) record.providerItems.push({ itemId: providerItemId, frameRef });
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
  const responseFrame = cloneSharedRealtimeRoomVisualFrame(
    record.frames[record.frames.length - 1]!,
    input.thumbnailToRoomAuthorized,
    nowMs,
  );
  const receipt = buildSharedRealtimeRoomVisualFrameReceipt({
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
