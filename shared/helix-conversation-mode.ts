export const HELIX_CONVERSATION_MODE_CLASSIFICATION_SCHEMA =
  "helix.conversation_mode_classification.v1" as const;
export const HELIX_COMPANION_POLICY_SCHEMA =
  "helix.companion_policy.v1" as const;

export type HelixConversationMode =
  | "ambient_listening"
  | "direct_address"
  | "command_mode"
  | "active_companion"
  | "translation_mediator"
  | "game_master"
  | "debug_trace";

export type HelixVoiceTranscriptKind =
  | "ambient"
  | "direct_address"
  | "command_candidate"
  | "translation_context"
  | "debug";

export type HelixCompanionMode =
  | "off"
  | "direct_address_only"
  | "active_companion"
  | "critical_voice"
  | "debug_trace";

export type HelixCompanionPolicy = {
  schema: typeof HELIX_COMPANION_POLICY_SCHEMA;
  thread_id: string;
  voice_input_active: boolean;
  voice_output_enabled: boolean;
  companion_mode: HelixCompanionMode;
  commentary_mode:
    | "off"
    | "milestones_only"
    | "anomalies_and_milestones"
    | "windowed_companion"
    | "active_dialogue"
    | "continuous_debug";
  direct_address_names: string[];
  allowed_outputs: Array<
    | "silent_keep_in_context"
    | "show_text"
    | "voice_on_confirm"
    | "request_agentic_review"
    | "start_user_turn"
  >;
  context_policy: "compact_context_pack_only";
  raw_audio_included: false;
  raw_transcript_included: false;
  updated_at: string;
};

export type HelixConversationModeClassification = {
  schema: typeof HELIX_CONVERSATION_MODE_CLASSIFICATION_SCHEMA;
  classification_id: string;
  thread_id: string;
  source_id: string;
  transcript_kind: HelixVoiceTranscriptKind;
  conversation_mode: HelixConversationMode;
  direct_addressed: boolean;
  command_candidate: boolean;
  active_companion_requested: boolean;
  speaker_authority:
    | "unknown"
    | "ambient"
    | "authorized_user"
    | "untrusted_speaker";
  confidence: number;
  reason: string;
  evidence_refs: string[];
  model_invoked: false;
  deterministic: true;
  context_policy: "compact_context_pack_only";
  raw_audio_included: false;
  raw_transcript_included: false;
  ts: string;
};
