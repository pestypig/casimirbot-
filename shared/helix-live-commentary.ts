import type { LiveAnswerEnvironmentMode } from "./helix-live-answer-environment";

export const HELIX_LIVE_COMMENTARY_SESSION_SCHEMA =
  "helix.live_commentary_session.v1" as const;
export const HELIX_LIVE_COMMENTARY_CANDIDATE_SCHEMA =
  "helix.live_commentary_candidate.v1" as const;
export const HELIX_LIVE_COMMENTARY_PROPOSAL_SCHEMA =
  "helix.live_commentary_proposal.v1" as const;
export const HELIX_LIVE_COMMENTARY_DELIVERY_RECEIPT_SCHEMA =
  "helix.live_commentary_delivery_receipt.v1" as const;
export const HELIX_LIVE_COMMENTARY_TRACE_STEP_SCHEMA =
  "helix.live_commentary_trace_step.v1" as const;

export type LiveCommentaryCadence =
  | "off"
  | "milestones_only"
  | "anomalies_and_milestones"
  | "windowed_companion"
  | "active_dialogue"
  | "continuous_debug";

export type LiveCommentaryMode = LiveCommentaryCadence;

export type LiveCommentaryDecision =
  | "silent_keep_in_context"
  | "show_text"
  | "voice_on_confirm"
  | "request_user_input";

export type LiveCommentaryCandidateDecision =
  | "suppress"
  | "show_text"
  | "voice_on_confirm"
  | "request_agentic_review";

export type LiveCommentaryTraceStepKind =
  | "goal_frame"
  | "subgoal_assigned"
  | "source_observed"
  | "line_updated"
  | "evaluation_question"
  | "evaluation_result"
  | "commentary_proposed"
  | "delivery_decided";

export type LiveCommentaryTraceStep = {
  schema: typeof HELIX_LIVE_COMMENTARY_TRACE_STEP_SCHEMA;
  step_id: string;
  proposal_id: string;
  session_id: string;
  thread_id: string;
  environment_id: string;
  delta_id: string;
  kind: LiveCommentaryTraceStepKind;
  label: string;
  summary: string;
  status: "completed" | "skipped";
  evidence_refs: string[];
  model_invoked: boolean;
  deterministic: boolean;
  context_policy: "compact_context_pack_only";
  raw_logs_included: false;
  ts: string;
};

export type LiveCommentarySession = {
  schema: typeof HELIX_LIVE_COMMENTARY_SESSION_SCHEMA;
  session_id: string;
  thread_id: string;
  environment_id: string;
  objective: string;
  status: "active" | "paused" | "stopped";
  cadence: LiveCommentaryCadence;
  voice_mode: LiveAnswerEnvironmentMode;
  created_at: string;
  updated_at: string;
  last_commentary_turn_id?: string | null;
  context_policy: "compact_context_pack_only";
  raw_logs_included: false;
  deterministic_content_role: "observation_not_assistant_answer";
};

export type LiveCommentaryCandidate = {
  schema: typeof HELIX_LIVE_COMMENTARY_CANDIDATE_SCHEMA;
  candidate_id: string;
  environment_id: string;
  thread_id: string;
  source_event_ids: string[];
  line_keys: string[];
  trigger:
    | "line_update"
    | "milestone"
    | "anomaly"
    | "window_summary"
    | "salience"
    | "manual_review";
  text: string;
  rationale: string;
  priority: "info" | "warn" | "critical" | "action";
  mode: LiveCommentaryMode;
  decision: LiveCommentaryCandidateDecision;
  evidence_refs: string[];
  model_invoked: false;
  deterministic: true;
  context_policy: "compact_context_pack_only";
  raw_logs_included: false;
  created_at: string;
};

export type LiveCommentaryProposal = {
  schema: typeof HELIX_LIVE_COMMENTARY_PROPOSAL_SCHEMA;
  proposal_id: string;
  session_id: string;
  thread_id: string;
  environment_id: string;
  delta_id: string;
  turn_id?: string | null;
  decision: LiveCommentaryDecision;
  priority: "info" | "warn" | "critical" | "action";
  text: string;
  voice_text?: string | null;
  reason:
    | "environment_started"
    | "prime_found"
    | "anomaly_detected"
    | "stability_reached"
    | "milestone"
    | "window_summary"
    | "continuous_debug"
    | "suppressed_routine";
  cadence: LiveCommentaryCadence;
  evidence_refs: string[];
  dedupe_key: string;
  cooldown_ms: number;
  model_invoked: boolean;
  deterministic: boolean;
  user_visible: boolean;
  trace_steps: LiveCommentaryTraceStep[];
  context_policy: "compact_context_pack_only";
  raw_logs_included: false;
  ts: string;
};

export type LiveCommentaryDeliveryReceipt = {
  schema: typeof HELIX_LIVE_COMMENTARY_DELIVERY_RECEIPT_SCHEMA;
  delivery_id: string;
  proposal_id: string;
  thread_id: string;
  environment_id: string;
  delivered: boolean;
  channel: "none" | "ui_text" | "voice" | "voice_on_confirm";
  reason:
    | "delivered"
    | "awaiting_confirmation"
    | "suppressed_policy"
    | "suppressed_cooldown"
    | "voice_not_enabled"
    | "silent_keep_in_context";
  evidence_refs: string[];
  audio_event_id?: string | null;
  ts: string;
};
