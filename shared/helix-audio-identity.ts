export const HELIX_AUDIO_IDENTITY_SCHEMA = "helix.audio_identity.v1" as const;

export type HelixCaptureSource =
  | "mic"
  | "display_tab_audio"
  | "display_window_audio"
  | "display_screen_audio"
  | "system_loopback";

export type HelixSpeakerRole =
  | "owner"
  | "trusted_guest"
  | "guest"
  | "unknown"
  | "device_audio";

export type HelixSpeakerAuthority =
  | "command_allowed"
  | "command_confirm"
  | "transcribe_only"
  | "ignored";

export type HelixSpeakerAuthoritySource =
  | "absent"
  | "client_hint"
  | "session_registry"
  | "profile_enrollment"
  | "device_audio_policy"
  | "server_policy";

export type HelixSpeakerEnrollmentState = "none" | "session" | "profile" | "revoked";

export type HelixSpeakerPolicyMode =
  | "profile_only"
  | "trusted_session"
  | "any_speaker"
  | "transcribe_only";

export type HelixUnknownSpeakerBehavior =
  | "ignore"
  | "transcribe_only"
  | "ask_to_add";

export type HelixSpeakerLabel = {
  speaker_id: string;
  speaker_profile_id?: string;
  display_name: string;
  color_token: string;
  claimed_role?: HelixSpeakerRole;
  role: HelixSpeakerRole;
  authority: HelixSpeakerAuthority;
  authority_source?: HelixSpeakerAuthoritySource;
  authority_reason?: string;
  confidence: number;
  enrollment_state: HelixSpeakerEnrollmentState;
};

export type HelixSpeakerSegment = {
  segment_id: string;
  speaker_id: string;
  speaker_confidence: number;
  start_ms: number;
  end_ms: number;
  text?: string;
  language?: string;
  speech_probability?: number;
  snr_db?: number;
  overlap?: boolean;
  capture_source: HelixCaptureSource;
};

export type HelixAudioIdentityResult = {
  schema: typeof HELIX_AUDIO_IDENTITY_SCHEMA;
  capture_session_id: string;
  room_id?: string | null;
  thread_id?: string | null;
  primary_speaker_id?: string | null;
  speakers: HelixSpeakerLabel[];
  segments: HelixSpeakerSegment[];
  ambient_noise: {
    snr_db?: number | null;
    speech_probability?: number | null;
    noisy_environment: boolean;
  };
  policy: {
    command_authority: HelixSpeakerPolicyMode;
    command_authority_source?: HelixSpeakerAuthoritySource;
    unknown_speaker_behavior: HelixUnknownSpeakerBehavior;
  };
};

export type HelixAudioIdentitySessionSnapshot = {
  session_id: string;
  room_id?: string | null;
  thread_id?: string | null;
  speaker_count: number;
  speakers: HelixSpeakerLabel[];
  updated_at_ms: number;
};

export const HELIX_SPEAKER_COLOR_TOKENS = [
  "speaker-blue",
  "speaker-gold",
  "speaker-green",
  "speaker-rose",
  "speaker-violet",
  "speaker-cyan",
  "speaker-slate",
  "speaker-gray",
] as const;

export type HelixSpeakerColorToken = (typeof HELIX_SPEAKER_COLOR_TOKENS)[number] | string;

export const stableSpeakerPaletteHash = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const resolveHelixSpeakerColorToken = (
  roomId: string | null | undefined,
  speakerId: string,
): HelixSpeakerColorToken => {
  const key = `${roomId?.trim() || "global"}:${speakerId.trim() || "unknown"}`;
  const index = stableSpeakerPaletteHash(key) % HELIX_SPEAKER_COLOR_TOKENS.length;
  return HELIX_SPEAKER_COLOR_TOKENS[index] ?? "speaker-gray";
};
