import {
  HELIX_SHARED_REALTIME_ROOM_RESPONSE_SCHEMA,
  type HelixSharedRealtimeRoom,
  type HelixSharedRealtimeRoomDebug,
  type HelixSharedRealtimeRoomErrorCode,
  type HelixSharedRealtimeRoomResponse,
  type HelixSharedRealtimeRoomVisualFrame,
  type HelixSharedRealtimeRoomVisualFrameReceipt,
} from "@shared/helix-shared-realtime-room";

export const buildHelixSharedRealtimeRoomResponse = (input: {
  ok: boolean;
  error?: HelixSharedRealtimeRoomErrorCode | null;
  message: string;
  room?: HelixSharedRealtimeRoom | null;
  rooms?: HelixSharedRealtimeRoom[];
  frames?: HelixSharedRealtimeRoomVisualFrame[];
  frameReceipt?: HelixSharedRealtimeRoomVisualFrameReceipt | null;
  debug?: HelixSharedRealtimeRoomDebug | null;
  inviteCode?: string | null;
  inviteExpiresAt?: string | null;
}): HelixSharedRealtimeRoomResponse => {
  const frames = input.frames;
  return {
    schema: HELIX_SHARED_REALTIME_ROOM_RESPONSE_SCHEMA,
    ok: input.ok,
    error: input.error ?? null,
    message: input.message,
    room: input.room ?? null,
    ...(input.rooms ? { rooms: input.rooms } : {}),
    ...(frames ? { frames } : {}),
    ...(input.frameReceipt !== undefined ? { frame_receipt: input.frameReceipt } : {}),
    ...(input.debug !== undefined ? { debug: input.debug } : {}),
    ...(input.inviteCode !== undefined ? { invite_code: input.inviteCode } : {}),
    ...(input.inviteExpiresAt !== undefined
      ? { invite_expires_at: input.inviteExpiresAt }
      : {}),
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: Boolean(
      frames?.some((frame) => frame.preview_data_url !== null),
    ),
  };
};
