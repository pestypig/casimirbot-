export const VOICE_INTERPRETATION_CONTEXT_SCHEMA =
  "helix.voice_interpretation_context.v1" as const;

export type VoiceInterpretationScope =
  | "turn"
  | "chat_session"
  | "live_environment";

export type VoiceInterpretationJob =
  | "operator_witness"
  | "caveat_reader"
  | "status_callout"
  | "risk_watch"
  | "answer_summary"
  | "manual_read_style";

export type VoiceInterpretationOutputMode =
  | "no_voice"
  | "voice_lane_only"
  | "manual_read_style"
  | "critical_voice"
  | "propose_only";

export type VoiceInterpretationSaliencePolicy =
  | "manual_only"
  | "caveats_only"
  | "warnings_and_blockers"
  | "state_changes_only"
  | "operator_requested";

export type VoiceInterpretationSpeakPolicy =
  | "muted"
  | "manual_only"
  | "confirm_required"
  | "automatic_when_policy_allows";

export type VoiceInterpretationCertaintyCeiling =
  | "source_answer_snapshot"
  | "terminal_answer_authority";

export type VoiceInterpretationAppliesUntil =
  | "turn_end"
  | "session_end"
  | "explicit_cancel"
  | "next_mode_change";

export type VoiceInterpretationContext = {
  schema: typeof VOICE_INTERPRETATION_CONTEXT_SCHEMA;
  context_id: string;
  scope: VoiceInterpretationScope;
  thread_id: string;
  turn_id?: string | null;

  persona_profile: "none" | "auntie_dottie" | "operator_neutral" | string;
  interpretation_job: VoiceInterpretationJob;

  output_mode: VoiceInterpretationOutputMode;
  salience_policy: VoiceInterpretationSaliencePolicy;
  speak_policy: VoiceInterpretationSpeakPolicy;

  max_chars: number;
  certainty_ceiling: VoiceInterpretationCertaintyCeiling;
  applies_until: VoiceInterpretationAppliesUntil;

  evidence_refs: string[];
  reason_codes: string[];

  assistant_answer: false;
  raw_content_included: false;
  output_authority: "steering_context";
  instruction_authority: "none";
  context_role: "tool_evidence";
};

export type VoiceInterpretationContextDebugSummary = Pick<
  VoiceInterpretationContext,
  | "schema"
  | "context_id"
  | "scope"
  | "thread_id"
  | "turn_id"
  | "persona_profile"
  | "interpretation_job"
  | "output_mode"
  | "salience_policy"
  | "speak_policy"
  | "max_chars"
  | "certainty_ceiling"
  | "applies_until"
  | "evidence_refs"
  | "reason_codes"
  | "assistant_answer"
  | "raw_content_included"
  | "output_authority"
  | "instruction_authority"
  | "context_role"
>;
