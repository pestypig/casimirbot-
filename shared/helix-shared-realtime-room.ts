export const HELIX_SHARED_REALTIME_ROOM_SCHEMA =
  "helix.shared_realtime_room.v1" as const;
export const HELIX_SHARED_REALTIME_ROOM_RESPONSE_SCHEMA =
  "helix.shared_realtime_room.response.v1" as const;
export const HELIX_SHARED_REALTIME_ROOM_CONSENT_SCHEMA =
  "helix.shared_realtime_room.consent.v1" as const;
export const HELIX_SHARED_REALTIME_ROOM_VISUAL_FRAME_SCHEMA =
  "helix.shared_realtime_room.visual_frame.v1" as const;
export const HELIX_SHARED_REALTIME_ROOM_VISUAL_FRAME_RECEIPT_SCHEMA =
  "helix.shared_realtime_room.visual_frame_receipt.v1" as const;
export const HELIX_SHARED_REALTIME_ROOM_DEBUG_SCHEMA =
  "helix.shared_realtime_room.debug.v1" as const;

export const HELIX_SHARED_REALTIME_ROOM_MAX_PARTICIPANTS = 2 as const;

export type HelixSharedRealtimeRoomRole = "owner" | "participant";
export type HelixSharedRealtimeRoomPresence = "present" | "away" | "left";
export type HelixSharedRealtimeRoomStatus =
  | "waiting_for_participant"
  | "waiting_for_consent"
  | "ready"
  | "active"
  | "closed";

/**
 * Every grant controls data owned by one participant. A room owner cannot
 * grant or revoke consent for somebody else.
 */
export type HelixSharedRealtimeRoomConsent = {
  schema: typeof HELIX_SHARED_REALTIME_ROOM_CONSENT_SCHEMA;
  microphone_to_room: boolean;
  microphone_to_model: boolean;
  transcript_to_room: boolean;
  screen_to_model: boolean;
  screen_thumbnail_to_room: boolean;
  model_audio_output: boolean;
  consent_version: number;
  consent_receipt_ref: string | null;
  updated_at: string | null;
};

export type HelixSharedRealtimeRoomConsentPatch = Partial<Pick<
  HelixSharedRealtimeRoomConsent,
  | "microphone_to_room"
  | "microphone_to_model"
  | "transcript_to_room"
  | "screen_to_model"
  | "screen_thumbnail_to_room"
  | "model_audio_output"
>>;

export type HelixSharedRealtimeRoomParticipant = {
  participant_id: string;
  display_name: string;
  role: HelixSharedRealtimeRoomRole;
  presence: HelixSharedRealtimeRoomPresence;
  consent: HelixSharedRealtimeRoomConsent;
  joined_at: string;
  last_seen_at: string;
};

export type HelixSharedRealtimeRoomRuntimeState =
  | "idle"
  | "reserved"
  | "host_transport_active"
  | "bridge_active"
  | "degraded"
  | "stopping"
  | "closed"
  | "error";

export type HelixSharedRealtimeRoomTransportOwner =
  | "unbound"
  | "host_browser"
  | "room_media_bridge";

export type HelixSharedRealtimeRoomRuntime = {
  runtime_id: string | null;
  state: HelixSharedRealtimeRoomRuntimeState;
  topology: "single_shared_model";
  transport_owner: HelixSharedRealtimeRoomTransportOwner;
  model: string | null;
  active_speaker_participant_id: string | null;
  provider_session_ref_hash: string | null;
  realtime_session_ref_hash: string | null;
  reserved_by_participant_id: string | null;
  started_at: string | null;
  updated_at: string;
  limitations: string[];
};

export type HelixSharedRealtimeRoomReadiness = {
  participant_count: number;
  required_participant_count: typeof HELIX_SHARED_REALTIME_ROOM_MAX_PARTICIPANTS;
  ready: boolean;
  missing_participant_count: number;
  missing_consent_by_participant: Record<string, Array<keyof HelixSharedRealtimeRoomConsentPatch>>;
};

export type HelixSharedRealtimeRoom = {
  schema: typeof HELIX_SHARED_REALTIME_ROOM_SCHEMA;
  room_id: string;
  title: string;
  status: HelixSharedRealtimeRoomStatus;
  max_participants: typeof HELIX_SHARED_REALTIME_ROOM_MAX_PARTICIPANTS;
  self_participant_id: string;
  participants: HelixSharedRealtimeRoomParticipant[];
  readiness: HelixSharedRealtimeRoomReadiness;
  runtime: HelixSharedRealtimeRoomRuntime;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixSharedRealtimeRoomVisualSourceSurface =
  | "browser_tab"
  | "desktop_window"
  | "screen_share_window"
  | "device_camera"
  | "manual_upload";

export type HelixSharedRealtimeRoomFrameDelivery =
  | "sent_to_shared_model"
  | "runtime_not_bound"
  | "sideband_unavailable"
  | "duplicate"
  | "blocked_by_consent";

/**
 * Authorized room members may request an ephemeral thumbnail projection for
 * the participant carousel. Debug exports use the separate metadata-only
 * contract below and never include this data URL.
 */
export type HelixSharedRealtimeRoomVisualFrame = {
  schema: typeof HELIX_SHARED_REALTIME_ROOM_VISUAL_FRAME_SCHEMA;
  frame_ref: string;
  room_id: string;
  runtime_id: string | null;
  participant_id: string;
  participant_display_name: string;
  source_id: string;
  source_surface: HelixSharedRealtimeRoomVisualSourceSurface;
  captured_at: string;
  sequence: number;
  image_hash: string;
  preview_hash: string | null;
  preview_data_url: string | null;
  preview_expires_at: string | null;
  provider_delivery: HelixSharedRealtimeRoomFrameDelivery;
  consent_receipt_ref: string;
  provenance: "participant_claimed_browser_capture";
  content_role: "observation_not_assistant_answer";
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: boolean;
};

export type HelixSharedRealtimeRoomVisualFrameReceipt = {
  schema: typeof HELIX_SHARED_REALTIME_ROOM_VISUAL_FRAME_RECEIPT_SCHEMA;
  ok: boolean;
  error: HelixSharedRealtimeRoomErrorCode | null;
  frame_ref: string | null;
  room_id: string;
  participant_id: string | null;
  runtime_id: string | null;
  image_hash: string | null;
  provider_delivery: HelixSharedRealtimeRoomFrameDelivery;
  carousel_visible: boolean;
  context_role: "tool_evidence";
  reentry_required: true;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixSharedRealtimeRoomDebugFrame = Omit<
  HelixSharedRealtimeRoomVisualFrame,
  "preview_data_url" | "participant_display_name" | "raw_content_included"
> & {
  raw_content_included: false;
};

export type HelixSharedRealtimeRoomDebug = {
  schema: typeof HELIX_SHARED_REALTIME_ROOM_DEBUG_SCHEMA;
  room_id: string;
  room_status: HelixSharedRealtimeRoomStatus;
  participant_count: number;
  participants: Array<{
    participant_id: string;
    role: HelixSharedRealtimeRoomRole;
    presence: HelixSharedRealtimeRoomPresence;
    consent: HelixSharedRealtimeRoomConsent;
  }>;
  readiness: HelixSharedRealtimeRoomReadiness;
  runtime: HelixSharedRealtimeRoomRuntime;
  visual_frames: HelixSharedRealtimeRoomDebugFrame[];
  visual_frame_count: number;
  invite_count: number;
  audit_event_count: number;
  source_admission: "room_membership_and_participant_consent_required";
  content_role: "debug_observation_not_assistant_answer";
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixSharedRealtimeRoomErrorCode =
  | "shared_realtime_room_auth_required"
  | "shared_realtime_room_locked_by_account_policy"
  | "shared_realtime_room_not_found"
  | "shared_realtime_room_forbidden"
  | "shared_realtime_room_closed"
  | "shared_realtime_room_full"
  | "shared_realtime_room_invite_invalid"
  | "shared_realtime_room_invite_expired"
  | "shared_realtime_room_invite_redeemed"
  | "shared_realtime_room_invalid_request"
  | "shared_realtime_room_consent_required"
  | "shared_realtime_room_not_ready"
  | "shared_realtime_room_runtime_conflict"
  | "shared_realtime_room_personal_session_blocked"
  | "shared_realtime_room_realtime_session_invalid"
  | "shared_realtime_room_visual_frame_invalid"
  | "shared_realtime_room_unavailable";

export type HelixSharedRealtimeRoomResponse = {
  schema: typeof HELIX_SHARED_REALTIME_ROOM_RESPONSE_SCHEMA;
  ok: boolean;
  error: HelixSharedRealtimeRoomErrorCode | null;
  message: string;
  room: HelixSharedRealtimeRoom | null;
  invite_code?: string | null;
  invite_expires_at?: string | null;
  rooms?: HelixSharedRealtimeRoom[];
  frames?: HelixSharedRealtimeRoomVisualFrame[];
  frame_receipt?: HelixSharedRealtimeRoomVisualFrameReceipt | null;
  debug?: HelixSharedRealtimeRoomDebug | null;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: boolean;
};

export const buildDefaultHelixSharedRealtimeRoomConsent = (): HelixSharedRealtimeRoomConsent => ({
  schema: HELIX_SHARED_REALTIME_ROOM_CONSENT_SCHEMA,
  microphone_to_room: false,
  microphone_to_model: false,
  transcript_to_room: false,
  screen_to_model: false,
  screen_thumbnail_to_room: false,
  model_audio_output: false,
  consent_version: 0,
  consent_receipt_ref: null,
  updated_at: null,
});

export const HELIX_SHARED_REALTIME_ROOM_REQUIRED_VOICE_CONSENTS = [
  "microphone_to_room",
  "microphone_to_model",
  "transcript_to_room",
  "model_audio_output",
] as const satisfies ReadonlyArray<keyof HelixSharedRealtimeRoomConsentPatch>;
