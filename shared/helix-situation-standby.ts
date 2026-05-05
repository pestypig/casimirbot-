export const HELIX_SITUATION_EVENT_SIGNAL_SCHEMA = "helix.situation_event_signal.v1" as const;
export const HELIX_SITUATION_STATE_PROJECTION_SCHEMA = "helix.situation_state_projection.v1" as const;
export const HELIX_SITUATION_GOAL_HYPOTHESIS_SCHEMA = "helix.situation_goal_hypothesis.v1" as const;
export const HELIX_SITUATION_SALIENCE_RECEIPT_SCHEMA = "helix.situation_salience_receipt.v1" as const;
export const HELIX_SITUATION_INTERJECTION_PROPOSAL_SCHEMA =
  "helix.situation_interjection_proposal.v1" as const;

export type SituationStandbyMode =
  | "off"
  | "direct_address_only"
  | "high_salience"
  | "translation_mediator"
  | "game_master"
  | "research_assistant";

export type SituationEventSignalSource =
  | "voice_transcript"
  | "speaker_identity"
  | "screen_summary"
  | "minecraft_event"
  | "browser_audio"
  | "device_audio"
  | "graph_runtime"
  | "manual_marker";

export type SituationEventSignal = {
  schema: typeof HELIX_SITUATION_EVENT_SIGNAL_SCHEMA;
  signal_id: string;
  room_id: string;
  graph_id?: string | null;
  source_id?: string | null;
  source: SituationEventSignalSource;
  event_type: string;
  ts: string;
  text?: string | null;
  actor?: string | null;
  speaker_id?: string | null;
  world_entity_id?: string | null;
  location?: Record<string, unknown> | null;
  evidence_refs: string[];
  meta?: Record<string, unknown> | null;
};

export type SituationStateProjection = {
  schema: typeof HELIX_SITUATION_STATE_PROJECTION_SCHEMA;
  projection_id: string;
  room_id: string;
  graph_id?: string | null;
  updated_at: string;
  window: { from_ts: string; to_ts: string; event_count: number };
  speakers: Array<{ speaker_id: string; display_name?: string; native_language?: string; authority?: string }>;
  active_sources: Array<{ source_id: string; status: string; source_kind?: string }>;
  world_state?: Record<string, unknown> | null;
  recent_facts: Array<{ fact_id: string; text: string; evidence_refs: string[] }>;
};

export type SituationGoalHypothesis = {
  schema: typeof HELIX_SITUATION_GOAL_HYPOTHESIS_SCHEMA;
  hypothesis_id: string;
  room_id: string;
  graph_id?: string | null;
  goal_label: string;
  confidence: number;
  status: "hypothesis" | "active" | "completed" | "blocked";
  evidence_refs: string[];
  derived_from_signal_ids: string[];
  updated_at: string;
};

export type SituationSalienceReason =
  | "direct_address"
  | "risk_detected"
  | "goal_progress"
  | "goal_blocked"
  | "contradiction"
  | "opportunity"
  | "user_confusion"
  | "translation_mediation"
  | "permission_needed"
  | "source_health"
  | "dedupe_cooldown"
  | "rate_limited"
  | "context_ineligible";

export type SituationSalienceReceipt = {
  schema: typeof HELIX_SITUATION_SALIENCE_RECEIPT_SCHEMA;
  receipt_id: string;
  room_id: string;
  graph_id?: string | null;
  signal_ids: string[];
  priority: "info" | "warn" | "critical" | "action";
  reason: SituationSalienceReason;
  should_notify_helix: boolean;
  should_speak: boolean;
  should_request_user_input: boolean;
  dedupe_key: string;
  cooldown_ms: number;
  summary: string;
  evidence_refs: string[];
  ts: string;
};

export type SituationInterjectionProposal = {
  schema: typeof HELIX_SITUATION_INTERJECTION_PROPOSAL_SCHEMA;
  proposal_id: string;
  room_id: string;
  graph_id?: string | null;
  salience_receipt_id: string;
  mode: SituationStandbyMode;
  text: string;
  voice_output: "off" | "on_confirm" | "auto_when_allowed";
  requires_confirmation: boolean;
  evidence_refs: string[];
  ts: string;
};

