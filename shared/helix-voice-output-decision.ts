export const HELIX_VOICE_OUTPUT_DECISION_SCHEMA =
  "helix.voice_output_decision.v1" as const;

export type HelixVoiceOutputAction =
  | "remain_silent"
  | "journal_only"
  | "show_text"
  | "voice_on_confirm"
  | "voice_now";

export type HelixVoiceOutputDecision = {
  schema: typeof HELIX_VOICE_OUTPUT_DECISION_SCHEMA;
  action: HelixVoiceOutputAction;
  reason:
    | "voice_output_disabled"
    | "ambient_context"
    | "direct_address"
    | "command_candidate"
    | "critical_commentary"
    | "voice_confirmation_required"
    | "companion_text_surface"
    | "debug_text_surface"
    | "silent_policy";
  speakable: boolean;
  requires_confirmation: boolean;
  assistant_answer: false;
  raw_audio_included: false;
  raw_transcript_included: false;
  context_policy: "compact_context_pack_only";
};
