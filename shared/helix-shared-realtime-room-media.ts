export const HELIX_SHARED_REALTIME_ROOM_MEDIA_SIGNAL_SCHEMA =
  "helix.shared_realtime_room.media_signal.v1" as const;
export const HELIX_SHARED_REALTIME_ROOM_MEDIA_SIGNAL_RESPONSE_SCHEMA =
  "helix.shared_realtime_room.media_signal.response.v1" as const;

export type HelixSharedRealtimeRoomMediaSignalKind =
  | "offer"
  | "answer"
  | "ice_candidate"
  | "hangup";

export type HelixSharedRealtimeRoomMediaSignal = {
  schema: typeof HELIX_SHARED_REALTIME_ROOM_MEDIA_SIGNAL_SCHEMA;
  signal_id: string;
  room_id: string;
  runtime_id: string;
  negotiation_id: string;
  sender_participant_id: string;
  target_participant_id: string;
  kind: HelixSharedRealtimeRoomMediaSignalKind;
  description: RTCSessionDescriptionInit | null;
  candidate: RTCIceCandidateInit | null;
  created_at: string;
  expires_at: string;
};

export type HelixSharedRealtimeRoomMediaSignalResponse = {
  schema: typeof HELIX_SHARED_REALTIME_ROOM_MEDIA_SIGNAL_RESPONSE_SCHEMA;
  ok: boolean;
  error: string | null;
  message: string | null;
  signal: HelixSharedRealtimeRoomMediaSignal | null;
  signals: HelixSharedRealtimeRoomMediaSignal[];
};
