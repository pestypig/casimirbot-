export const HELIX_SITUATION_CAPTURE_CONTEXT_SCHEMA = "helix.situation_capture_context.v1" as const;

export type SituationCaptureContextSourceKind =
  | "discord_call"
  | "browser_call"
  | "meeting"
  | "voice_chat"
  | "mic_room"
  | "display_audio"
  | "unknown";

export type SituationCaptureContextAppHint =
  | "discord"
  | "browser"
  | "zoom"
  | "teams"
  | "google_meet"
  | "unknown";

export type SituationCapturePermissionState = {
  capture_granted: boolean;
  transcript_context_granted: boolean;
  voice_output_granted: boolean;
};

export type SituationCaptureClassifiedContext = {
  source_kind: SituationCaptureContextSourceKind;
  app_hint?: SituationCaptureContextAppHint;
  contains_remote_participant_audio: boolean | "unknown";
  contains_user_audio: boolean | "unknown";
  transcript_available: boolean;
  transcript_attached_to_helix: false;
};

export type SituationCaptureSourceSnapshot = {
  source_id: string;
  capture_source:
    | "browser_tab_audio"
    | "display_tab_audio"
    | "display_window_audio"
    | "display_screen_audio"
    | "mic"
    | "system_loopback";
  label?: string;
  status: "active" | "requesting" | "error" | "stopped" | "permission_denied";
  capture_session_id?: string | null;
  classified_context: SituationCaptureClassifiedContext;
  permission_state: SituationCapturePermissionState;
};

export type SituationRoomCaptureContext = {
  schema: typeof HELIX_SITUATION_CAPTURE_CONTEXT_SCHEMA;
  room_id?: string | null;
  source_ids: string[];
  sources: SituationCaptureSourceSnapshot[];
  context_policy: "explicit_attachment_only";
  command_lane_enabled: false;
};
