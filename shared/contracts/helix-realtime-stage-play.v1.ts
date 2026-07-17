import type {
  HelixRealtimeGroundedRelayV1,
  HelixRealtimeWorkerAdmissionV1,
} from "./helix-realtime-worker-relay.v1";

export const HELIX_REALTIME_STAGE_PLAY_CONTEXT_PACK_SCHEMA =
  "helix.realtime_stage_play.context_pack.v1" as const;

export const HELIX_REALTIME_STAGE_PLAY_ASK_HANDOFF_SCHEMA =
  "helix.realtime_stage_play.ask_handoff.v1" as const;

export const HELIX_REALTIME_STAGE_PLAY_CONTEXT_SYNC_SCHEMA =
  "helix.realtime_stage_play.context_sync.v1" as const;

export const HELIX_REALTIME_STAGE_PLAY_DEBUG_SCHEMA =
  "helix.realtime_stage_play.debug.v1" as const;

export type HelixRealtimeStagePlayContextItemV1 = {
  ref: string;
  summary: string;
  observed_at_ms: number | null;
  evidence_refs: string[];
};

export type HelixRealtimeStagePlaySourceIdentityV1 = {
  source_ref: string;
  source_kind: string;
  status: string;
  observed_at_ms: number | null;
  evidence_refs: string[];
};

export type HelixRealtimeStagePlayGoalBindingV1 = {
  goal_id: string;
  status: "draft" | "active" | "paused" | "blocked" | "satisfied" | "stopped" | "failed";
  runtime_session_ref: string | null;
  runtime_agent_provider: string | null;
  source_refs: string[];
  evidence_refs: string[];
  answer_authority: false;
  terminal_eligible: false;
};

export type HelixRealtimeStagePlayRejectedRefV1 = {
  ref: string;
  reason:
    | "stale"
    | "blocked"
    | "unknown_freshness"
    | "unsupported_source"
    | "limit_exceeded"
    | "unsafe_identity";
};

export type HelixRealtimeStagePlayContextPackV1 = {
  schema: typeof HELIX_REALTIME_STAGE_PLAY_CONTEXT_PACK_SCHEMA;
  context_pack_id: string;
  context_hash: string;
  realtime_session_id: string;
  thread_id: string;
  generated_at_ms: number;
  fresh_until_ms: number;
  freshness_status: "fresh" | "empty";
  active_goal_binding: HelixRealtimeStagePlayGoalBindingV1 | null;
  objective: string | null;
  current_goal: string | null;
  active_constraints: HelixRealtimeStagePlayContextItemV1[];
  recent_questions: HelixRealtimeStagePlayContextItemV1[];
  grounded_answers: HelixRealtimeStagePlayContextItemV1[];
  workstation_goal_summaries: HelixRealtimeStagePlayContextItemV1[];
  workstation_sources: HelixRealtimeStagePlaySourceIdentityV1[];
  source_health: HelixRealtimeStagePlayContextItemV1[];
  known_risks: string[];
  known_unknowns: string[];
  confidence_notes: string[];
  evidence_refs: string[];
  selected_refs: string[];
  rejected_refs: HelixRealtimeStagePlayRejectedRefV1[];
  limits: {
    max_constraints: number;
    max_questions: number;
    max_answers: number;
    max_goal_summaries: number;
    max_sources: number;
    max_evidence_refs: number;
    max_summary_chars: number;
  };
  context_policy: "bounded_stage_play_projection";
  workstation_text_trusted: false;
  raw_audio_included: false;
  raw_logs_included: false;
  raw_transcript_included: false;
  secrets_included: false;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
};

export type HelixRealtimeStagePlayAskHandoffV1 = {
  schema: typeof HELIX_REALTIME_STAGE_PLAY_ASK_HANDOFF_SCHEMA;
  handoff_id: string;
  realtime_session_id: string;
  thread_id: string;
  provider_event_ref: string;
  transcript_observation_ref: string;
  stage_play_event_ref: string;
  context_pack_id: string;
  context_hash: string;
  transcript_text_hash: string;
  transcript_text_char_count: number;
  goal_id: string | null;
  runtime_goal_session_ref: string | null;
  runtime_agent_provider: string | null;
  required_grounding_capability_ids: string[];
  worker_admission: HelixRealtimeWorkerAdmissionV1;
  created_at_ms: number;
  route_metadata: Record<string, unknown>;
  read_only: true;
  transcript_is_user_intent_after_admission: true;
  reentry_required: true;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixRealtimeStagePlayContextSyncReasonV1 =
  | "session_start"
  | "stage_play_update"
  | "grounded_answer"
  | "objective_or_source_change"
  | "lifecycle_idle";

export type HelixRealtimeStagePlayContextSyncV1 = {
  schema: typeof HELIX_REALTIME_STAGE_PLAY_CONTEXT_SYNC_SCHEMA;
  sync_id: string;
  realtime_session_id: string;
  provider_call_ref: string | null;
  reason: HelixRealtimeStagePlayContextSyncReasonV1;
  status:
    | "not_connected"
    | "connecting"
    | "queued_busy"
    | "sent"
    | "deduped"
    | "failed";
  context_pack_id: string | null;
  context_hash: string | null;
  selected_refs: string[];
  rejected_refs: HelixRealtimeStagePlayRejectedRefV1[];
  requested_at_ms: number;
  completed_at_ms: number | null;
  failure_code: string | null;
  provider_event_type: "session.update" | null;
  provider_payload_included: false;
  response_created: false;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixRealtimeStagePlayGroundedAnswerV1 = {
  feedback_id: string;
  handoff_id: string;
  realtime_session_id: string;
  thread_id: string;
  goal_id: string | null;
  ask_turn_id: string | null;
  stage_play_event_ref: string;
  answer_text_hash: string;
  answer_text_char_count: number;
  final_answer_source: string;
  terminal_artifact_kind: string;
  evidence_refs: string[];
  required_grounding_capability_ids: string[];
  grounding_evidence_satisfied: true;
  recorded_at_ms: number;
  completed_solver_path: true;
  server_authoritative: true;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixRealtimeStagePlayDebugV1 = {
  schema: typeof HELIX_REALTIME_STAGE_PLAY_DEBUG_SCHEMA;
  realtime_session_id: string;
  thread_id: string;
  bound_goal_id: string | null;
  bound_runtime_session_ref: string | null;
  bound_runtime_agent_provider: string | null;
  provider_call_ref: string | null;
  handoffs: Array<{
    handoff_id: string;
    provider_event_ref: string;
    transcript_observation_ref: string;
    stage_play_event_ref: string;
    context_pack_id: string;
    context_hash: string;
    goal_id: string | null;
    runtime_goal_session_ref: string | null;
    runtime_agent_provider: string | null;
    required_grounding_capability_ids: string[];
    worker_admission: HelixRealtimeWorkerAdmissionV1;
    created_at_ms: number;
    grounded_answer: HelixRealtimeStagePlayGroundedAnswerV1 | null;
    grounded_relay: HelixRealtimeGroundedRelayV1 | null;
  }>;
  latest_context_sync: HelixRealtimeStagePlayContextSyncV1 | null;
  latest_grounded_relay: HelixRealtimeGroundedRelayV1 | null;
  authority: {
    realtime_answer_authority: false;
    workstation_action_authority: false;
    terminal_answer_authority: false;
    grounded_answer_requires_completed_solver_path: true;
    grounded_answer_requires_route_evidence: true;
    spoken_relay_requires_server_authoritative_grounded_answer: true;
    realtime_relay_answer_authority: false;
  };
  provider_call_id_included: false;
  provider_payload_included: false;
  raw_content_included: false;
};
