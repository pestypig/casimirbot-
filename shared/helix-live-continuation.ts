export const HELIX_LIVE_SOURCE_ADMISSION_RECEIPT_SCHEMA =
  "helix.live_source_admission_receipt.v1" as const;

export const HELIX_LIVE_SOURCE_EVENT_OBSERVATION_SCHEMA =
  "helix.live_source_event_observation.v1" as const;

export const HELIX_LIVE_CONTINUATION_TICK_SCHEMA =
  "helix.live_continuation_tick.v1" as const;

export const HELIX_WORKER_LANE_RECEIPT_SCHEMA =
  "helix.worker_lane_receipt.v1" as const;

export const HELIX_GOAL_EVALUATION_RECEIPT_SCHEMA =
  "helix.goal_evaluation_receipt.v1" as const;

export const HELIX_CALLOUT_CANDIDATE_SCHEMA =
  "helix.callout_candidate.v1" as const;

export const HELIX_LIVE_CONTINUATION_CONTEXT_ROLES = [
  "observation_not_assistant_answer",
  "receipt_not_assistant_answer",
  "hypothesis_not_assistant_answer",
] as const;

export type HelixLiveContinuationContextRole =
  (typeof HELIX_LIVE_CONTINUATION_CONTEXT_ROLES)[number];

export type HelixLiveContinuationAntiPoisonFields<
  TContextRole extends HelixLiveContinuationContextRole,
> = {
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
  context_role: TContextRole;
  post_tool_model_step_required: true;
  evidence_refs: string[];
};

export const helixReceiptNotAnswerFlags = {
  terminal_eligible: false,
  assistant_answer: false,
  raw_content_included: false,
  context_role: "receipt_not_assistant_answer",
  post_tool_model_step_required: true,
} as const;

export const helixObservationNotAnswerFlags = {
  terminal_eligible: false,
  assistant_answer: false,
  raw_content_included: false,
  context_role: "observation_not_assistant_answer",
  post_tool_model_step_required: true,
} as const;

export const helixHypothesisNotAnswerFlags = {
  terminal_eligible: false,
  assistant_answer: false,
  raw_content_included: false,
  context_role: "hypothesis_not_assistant_answer",
  post_tool_model_step_required: true,
} as const;

export type HelixLiveSourceAdmissionReceipt =
  HelixLiveContinuationAntiPoisonFields<"receipt_not_assistant_answer"> & {
    schema: typeof HELIX_LIVE_SOURCE_ADMISSION_RECEIPT_SCHEMA;
    receipt_id: string;
    thread_id: string;
    room_id: string;
    environment_id?: string | null;
    contract_id?: string | null;
    source_id: string;
    source_kind:
      | "minecraft_world_events"
      | "mic_audio"
      | "screen_capture"
      | "browser_audio"
      | "operator_text";
    transport?: "cloudflarelink" | "local_panel" | "browser" | "manual" | "unknown";
    source_identity: {
      world_id?: string | null;
      server_id?: string | null;
      player_id?: string | null;
      profile_id?: string | null;
    };
    freshness: {
      status: "connected" | "missing" | "stale" | "blocked" | "unknown";
      last_seen_at?: string | null;
      stale_after_ms?: number | null;
    };
    trust_level: "admitted_live_source" | "unverified" | "blocked";
  };

export type HelixLiveSourceEventObservation =
  HelixLiveContinuationAntiPoisonFields<"observation_not_assistant_answer"> & {
    schema: typeof HELIX_LIVE_SOURCE_EVENT_OBSERVATION_SCHEMA;
    observation_id: string;
    thread_id?: string | null;
    room_id: string;
    environment_id?: string | null;
    source_id: string;
    world_event_id: string;
    signal_id?: string | null;
    event_type: string;
    salience?: {
      reason?: string | null;
      priority?: "info" | "warn" | "critical" | "action" | null;
      should_notify_helix?: boolean;
      should_speak?: boolean;
    };
    produced_refs: string[];
    missing_evidence: string[];
  };

export type HelixLiveContinuationTick =
  HelixLiveContinuationAntiPoisonFields<"receipt_not_assistant_answer"> & {
    schema: typeof HELIX_LIVE_CONTINUATION_TICK_SCHEMA;
    tick_id: string;
    job_id: string;
    thread_id: string;
    room_id: string;
    environment_id?: string | null;
    contract_id?: string | null;
    trigger:
      | "world_event"
      | "salience"
      | "source_health"
      | "manual_refresh"
      | "agentic_review"
      | "cadence";
    status: "queued" | "running" | "completed" | "suppressed" | "blocked";
    selected_lanes: string[];
    worker_receipt_refs: string[];
    goal_evaluation_ref?: string | null;
    callout_candidate_ref?: string | null;
    next_step: "continue" | "ask_user" | "repair" | "fail_closed" | "silent";
  };

export type HelixWorkerLaneReceipt =
  HelixLiveContinuationAntiPoisonFields<"hypothesis_not_assistant_answer"> & {
    schema: typeof HELIX_WORKER_LANE_RECEIPT_SCHEMA;
    receipt_id: string;
    lane:
      | "source_health"
      | "world_state"
      | "risk_watch"
      | "objective_progress"
      | "route_watch"
      | "resource_status"
      | "prediction_reflection"
      | "voice_gate";
    status: "succeeded" | "missing_input" | "blocked" | "suppressed";
    summary: string;
    hypotheses: Array<{
      claim: string;
      confidence: number;
      evidence_refs: string[];
      missing_evidence: string[];
    }>;
    recommended_next_observations: string[];
  };

export type HelixGoalEvaluationReceipt =
  HelixLiveContinuationAntiPoisonFields<"receipt_not_assistant_answer"> & {
    schema: typeof HELIX_GOAL_EVALUATION_RECEIPT_SCHEMA;
    receipt_id: string;
    job_id: string;
    thread_id: string;
    room_id: string;
    environment_id?: string | null;
    objective_ref?: string | null;
    status:
      | "satisfied"
      | "needs_more_observation"
      | "ask_user"
      | "blocked"
      | "fail_closed";
    rationale_codes: string[];
    satisfied_evidence_refs: string[];
    missing_evidence: string[];
    next_step: "continue" | "ask_user" | "repair" | "fail_closed" | "silent";
  };

export type HelixCalloutCandidate =
  HelixLiveContinuationAntiPoisonFields<"hypothesis_not_assistant_answer"> & {
    schema: typeof HELIX_CALLOUT_CANDIDATE_SCHEMA;
    candidate_id: string;
    job_id: string;
    thread_id: string;
    room_id: string;
    environment_id?: string | null;
    source_tick_id?: string | null;
    priority: "info" | "warn" | "critical" | "action";
    certainty: "low" | "medium" | "high";
    callout_intent:
      | "status"
      | "warning"
      | "suggestion"
      | "question"
      | "silent";
    summary: string;
    claim_refs: string[];
    missing_evidence: string[];
    delivery_mode: "voice_proposal" | "text_only" | "suppress";
    requires_confirmation: boolean;
  };

export type HelixLiveContinuationArtifact =
  | HelixLiveSourceAdmissionReceipt
  | HelixLiveSourceEventObservation
  | HelixLiveContinuationTick
  | HelixWorkerLaneReceipt
  | HelixGoalEvaluationReceipt
  | HelixCalloutCandidate;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

export function validateHelixLiveContinuationAntiPoisonFields(
  value: unknown,
): string[] {
  if (!isRecord(value)) return ["artifact must be an object"];
  const issues: string[] = [];
  if (value.terminal_eligible !== false) issues.push("terminal_eligible must be false");
  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.raw_content_included !== false) issues.push("raw_content_included must be false");
  if (value.post_tool_model_step_required !== true) {
    issues.push("post_tool_model_step_required must be true");
  }
  if (
    !HELIX_LIVE_CONTINUATION_CONTEXT_ROLES.includes(
      value.context_role as HelixLiveContinuationContextRole,
    )
  ) {
    issues.push("context_role must be a live continuation non-answer role");
  }
  if (!isStringArray(value.evidence_refs)) issues.push("evidence_refs must be an array of strings");
  return issues;
}

export function isHelixLiveContinuationArtifact(
  value: unknown,
): value is HelixLiveContinuationArtifact {
  return validateHelixLiveContinuationAntiPoisonFields(value).length === 0;
}
