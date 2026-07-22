import {
  HELIX_SHARED_REALTIME_ROOM_VISUAL_FRAME_RECEIPT_SCHEMA,
  type HelixSharedRealtimeRoomErrorCode,
  type HelixSharedRealtimeRoomFrameDelivery,
  type HelixSharedRealtimeRoomVisualFrame,
  type HelixSharedRealtimeRoomVisualFrameReceipt,
} from "@shared/helix-shared-realtime-room";
import {
  SHARED_REALTIME_ROOM_MAX_THUMBNAIL_CHARS,
  type StoredVisualFrame,
} from "./state";

export const validAuthorizedThumbnailDataUrl = (value: string): boolean =>
  value.length <= SHARED_REALTIME_ROOM_MAX_THUMBNAIL_CHARS &&
  /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(value);

export const cloneSharedRealtimeRoomVisualFrame = (
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

export const buildSharedRealtimeRoomVisualFrameReceipt = (input: {
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
