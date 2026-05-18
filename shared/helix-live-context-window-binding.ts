export const HELIX_LIVE_CONTEXT_WINDOW_BINDING_SCHEMA =
  "helix.live_context_window_binding.v1" as const;

export type HelixLiveContextWindowAnchorKind =
  | "typed_user_prompt"
  | "voice_direct_address"
  | "discord_direct_address"
  | "procedure_review_request"
  | "manual_refresh";

export type HelixLiveContextWindowAnchorPolicy =
  | "speech_end"
  | "speech_start"
  | "typed_submit"
  | "server_receive_fallback"
  | "manual";

export type HelixLiveContextWindowTailPolicy =
  | "strict_past"
  | "live_tail_explicit"
  | "procedure_continuation";

export type HelixLiveContextWindowExclusionReason =
  | "after_anchor"
  | "before_window"
  | "stale_source"
  | "low_confidence"
  | "missing_consent"
  | "wrong_speaker"
  | "raw_content_disallowed"
  | "not_available_before_answer";

export type HelixLiveContextWindowBinding = {
  schema: typeof HELIX_LIVE_CONTEXT_WINDOW_BINDING_SCHEMA;
  binding_id: string;
  thread_id: string;
  turn_id: string;
  anchor: {
    anchor_event_id: string;
    anchor_source_id: string;
    anchor_kind: HelixLiveContextWindowAnchorKind;
    question_text?: string | null;
    speech_start_at?: string | null;
    speech_end_at?: string | null;
    submitted_at?: string | null;
    anchor_ts: string;
    anchor_policy: HelixLiveContextWindowAnchorPolicy;
  };
  window: {
    from_ts: string;
    to_ts: string;
    lookback_ms: number;
    tail_policy: HelixLiveContextWindowTailPolicy;
    late_evidence_cutoff_at: string;
  };
  source_watermarks: Array<{
    source_id: string;
    source_kind: string;
    latest_observed_at?: string | null;
    latest_ingested_at?: string | null;
    latest_seq?: number | null;
    stale: boolean;
    freshness_ms?: number | null;
  }>;
  included_observation_refs: string[];
  excluded_observation_refs: Array<{
    ref: string;
    reason: HelixLiveContextWindowExclusionReason;
  }>;
  created_at: string;
  answer_started_at?: string | null;
  context_policy: "compact_context_pack_only";
  raw_audio_included: false;
  raw_transcript_included: false;
  assistant_answer: false;
};

export type HelixLiveProcedureTemporalCursor = {
  procedure_id: string;
  procedure_kind: string;
  room_id: string;
  thread_id: string;
  last_included_observed_at?: string | null;
  last_included_seq?: number | null;
  latest_observed_at?: string | null;
  latest_available_at?: string | null;
  source_watermarks: Array<{
    source_id: string;
    latest_observed_at?: string | null;
    latest_seq?: number | null;
  }>;
  updated_at: string;
};
