import type { HelixEvidenceObservation } from "./helix-evidence-observation";
import type { HelixVoiceSourceSurface } from "./helix-voice-lane-event";

export const HELIX_LIVE_TRANSLATION_PROCEDURE_SCHEMA =
  "helix.live_translation_procedure.v1" as const;
export const HELIX_TRANSLATION_OBSERVATION_SCHEMA =
  "helix.translation_observation.v1" as const;

export type HelixLiveTranslationProcedureStatus =
  | "active"
  | "paused"
  | "completed"
  | "error";

export type HelixTranslationSpeakerRole =
  | "owner"
  | "trusted_guest"
  | "guest"
  | "unknown"
  | "device_audio";

export type HelixTranslationSpeakerAuthority =
  | "command_allowed"
  | "command_confirm"
  | "transcribe_only"
  | "ignored";

export type HelixTranslationConsentState =
  | "requested"
  | "granted"
  | "revoked"
  | "not_required";

export type HelixLiveTranslationSourceBinding = {
  source_id: string;
  source_surface: Extract<
    HelixVoiceSourceSurface,
    "room_mic" | "discord_user_stream" | "discord_mixed_stream"
  >;
  speaker_id: string;
  display_name?: string | null;
  role: HelixTranslationSpeakerRole;
  authority: HelixTranslationSpeakerAuthority;
  input_language: string | "auto";
  output_language: string;
  consent_state: HelixTranslationConsentState;
};

export type HelixLiveTranslationProcedure = {
  schema: typeof HELIX_LIVE_TRANSLATION_PROCEDURE_SCHEMA;
  procedure_id: string;
  thread_id: string;
  room_id: string;
  status: HelixLiveTranslationProcedureStatus;
  source_bindings: HelixLiveTranslationSourceBinding[];
  output_policy: {
    render_text: boolean;
    speak_translation: boolean;
    voice_profile?: string | null;
    require_confirm_for_unknown_speaker: boolean;
    suppress_overlap: boolean;
  };
  evidence_refs: string[];
  created_at: string;
  updated_at: string;
  context_policy: "compact_context_pack_only";
  assistant_answer: false;
  raw_audio_included: false;
  raw_transcript_included: false;
};

export type HelixTranslationObservation = {
  schema: typeof HELIX_TRANSLATION_OBSERVATION_SCHEMA;
  observation_id: string;
  procedure_id: string;
  thread_id: string;
  source_id: string;
  speaker_id: string;
  source_language: string;
  target_language: string;
  speaker_role: HelixTranslationSpeakerRole;
  speaker_authority: HelixTranslationSpeakerAuthority;
  consent_state: HelixTranslationConsentState;
  source_text: string;
  translated_text: string;
  transcript_confidence: number;
  language_confidence: number;
  speaker_confidence: number;
  translation_confidence: number;
  dispatch_state: "auto" | "confirm" | "blocked";
  evidence_observation: HelixEvidenceObservation;
  evidence_refs: string[];
  content_role: "observation_not_assistant_answer";
  context_policy: "compact_context_pack_only";
  assistant_answer: false;
  raw_audio_included: false;
  raw_transcript_included: false;
};

export type HelixTranslationVoiceRelayGate = {
  schema: "helix.translation_voice_relay_gate.v1";
  procedure_id: string;
  observation_id: string;
  allowed: boolean;
  reason:
    | "allowed"
    | "procedure_voice_disabled"
    | "voice_output_not_speakable"
    | "translation_blocked"
    | "speaker_not_authorized";
  assistant_answer: false;
  raw_audio_included: false;
  raw_transcript_included: false;
};
