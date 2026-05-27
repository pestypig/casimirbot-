export const SITUATION_ROOM_LIVE_JOB_CONTRACT_SCHEMA =
  "helix.situation_room_live_job_contract.v1" as const;

export type SituationRoomLiveJobPurpose =
  | "voice_witness"
  | "route_watch"
  | "translation"
  | "transcription"
  | "source_health_watch"
  | "visual_observation"
  | "world_event_watch"
  | "custom";

export type SituationRoomVoicePolicy =
  | "muted"
  | "propose_only"
  | "confirm_speak_required"
  | "automatic_when_policy_allows";

export type SituationRoomAuthorityPolicy = {
  assistant_answer: false;
  construct_answer_authority: "none" | "evidence_only" | "witness_only";
  helix_ask_terminal_authority_required: true;
};

export type SituationRoomLiveJobContract = {
  schema: typeof SITUATION_ROOM_LIVE_JOB_CONTRACT_SCHEMA;
  contract_id: string;
  turn_id: string;
  name: string;
  purpose: SituationRoomLiveJobPurpose;
  selected_recipe: string;
  operating_prompt: string;
  operating_prompt_history: Array<{
    prompt: string;
    changed_at: string;
    changed_by: "user" | "helix_ask" | "system";
    reason: string;
  }>;
  compiled_policy: {
    callout_style?: "short" | "tactical" | "verbose" | "silent";
    interruption_policy?: "never" | "direct_questions_only" | "important_events_only" | "policy_triggered";
    evidence_threshold?: "observed" | "likely" | "confirmed";
    cadence?: "event_driven" | "interval" | "manual";
    suppress_until_trigger?: boolean;
    trigger_rules: string[];
    stop_conditions: string[];
  };
  source_requirements: Array<{
    source_kind:
      | "minecraft_world_events"
      | "mic_audio"
      | "browser_audio"
      | "screen_capture"
      | "world_event"
      | "operator_text";
    required: boolean;
    status: "connected" | "missing" | "stale" | "blocked" | "unknown";
    binding_id?: string;
    missing_reason?: string;
  }>;
  output_bindings: Array<{
    output_kind:
      | "typed_commentary"
      | "voice_proposal"
      | "transcript_stream"
      | "translated_transcript"
      | "translated_speech"
      | "live_answers_card"
      | "route_evidence"
      | "source_health_status";
    status: "planned" | "bound" | "blocked" | "disabled";
    policy: Record<string, unknown>;
  }>;
  voice_policy: SituationRoomVoicePolicy;
  authority_policy: SituationRoomAuthorityPolicy;
  runtime_status:
    | "draft"
    | "proposed"
    | "active"
    | "paused"
    | "blocked"
    | "stale"
    | "stopped";
  diagnostics: Array<{
    code: string;
    severity: "info" | "warning" | "error";
    message: string;
    repair_action?: string;
  }>;
  assistant_answer: false;
  raw_content_included: false;
};
