import type { HelixRealtimeWorkerAdmissionV2 } from "./helix-realtime-worker-dispatch.v2";

export const HELIX_REALTIME_WORKER_ADMISSION_SCHEMA =
  "helix.realtime_worker_admission.v1" as const;

export const HELIX_REALTIME_GROUNDED_RELAY_SCHEMA =
  "helix.realtime_grounded_relay.v1" as const;

export const HELIX_REALTIME_TERMINAL_RELAY_CONTRACT =
  "helix.realtime_terminal_relay.v1" as const;

export type HelixRealtimeTerminalRelayBasisV1 =
  | "model_direct_terminal"
  | "grounded_capability_terminal";

export type HelixRealtimeTerminalSpeechAuthorityStatusV1 =
  | "not_evaluated"
  | "validated"
  | "rejected";

export type HelixRealtimeRelayGroundingStatusV1 =
  | "not_evaluated"
  | "not_required"
  | "validated"
  | "rejected";

export type HelixRealtimeWorkerAdmissionOutcomeV1 =
  | "conversation_local"
  | "worker_grounded"
  | "durable_goal_bound"
  | "action_candidate";

export type HelixRealtimeWorkerAdmissionV1 = {
  schema: typeof HELIX_REALTIME_WORKER_ADMISSION_SCHEMA;
  admission_id: string;
  handoff_id: string;
  realtime_session_id: string;
  thread_id: string;
  decision_phase: "transcript_handoff" | "solver_final";
  outcome: HelixRealtimeWorkerAdmissionOutcomeV1;
  reason_codes: string[];
  selected_primary_intent: string | null;
  selected_route: string | null;
  selected_runtime_agent_provider: string | null;
  selected_model: string | null;
  candidate_readonly_capability_ids: string[];
  observed_readonly_capability_ids: string[];
  action_candidate_capability_ids: string[];
  worker_turn_dispatched: true;
  spoken_relay_eligible: boolean;
  workstation_action_execution_allowed: false;
  realtime_provider_tool_execution_allowed: false;
  evidence_refs: string[];
  decided_at_ms: number;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixRealtimeWorkerAdmission =
  | HelixRealtimeWorkerAdmissionV1
  | HelixRealtimeWorkerAdmissionV2;

export type HelixRealtimeGroundedRelayStatusV1 =
  | "worker_running"
  | "result_ready"
  | "relay_queued_busy"
  | "response_requested"
  | "provider_acknowledged"
  | "speaking"
  | "delivered"
  | "suppressed"
  | "superseded"
  | "stale"
  | "interrupted"
  | "cancelled"
  | "failed";

export type HelixRealtimeGroundedRelayV1 = {
  schema: typeof HELIX_REALTIME_GROUNDED_RELAY_SCHEMA;
  terminal_relay_contract: typeof HELIX_REALTIME_TERMINAL_RELAY_CONTRACT;
  relay_id: string;
  realtime_session_id: string;
  thread_id: string;
  handoff_id: string;
  worker_admission: HelixRealtimeWorkerAdmission;
  feedback_id: string | null;
  ask_turn_id: string | null;
  selected_runtime_agent_provider: string | null;
  selected_model: string | null;
  relay_basis: HelixRealtimeTerminalRelayBasisV1 | null;
  terminal_speech_authority_status: HelixRealtimeTerminalSpeechAuthorityStatusV1;
  grounding_required: boolean;
  grounding_status: HelixRealtimeRelayGroundingStatusV1;
  terminal_artifact_ref: string | null;
  terminal_text_hash: string | null;
  grounding_authority_ref: string | null;
  relay_idempotency_key: string | null;
  status: HelixRealtimeGroundedRelayStatusV1;
  status_reason: string | null;
  answer_projection_hash: string | null;
  answer_projection_char_count: number;
  answer_projection_truncated: boolean;
  answer_projection_redacted: boolean;
  evidence_refs: string[];
  scientific_evidence_closure_identities: import(
    "./helix-scientific-evidence-closure-grounding.v1"
  ).HelixScientificEvidenceClosureGroundingIdentityV1[];
  provider_event_ref: string | null;
  provider_response_ref: string | null;
  playback_receipt_ref: string | null;
  response_created: boolean;
  delivery_attempt_count: number;
  last_delivery_failure: string | null;
  provider_payload_included: false;
  created_at_ms: number;
  updated_at_ms: number;
  completed_at_ms: number | null;
  fresh_until_ms: number;
  failure_code: string | null;
  canonical_answer_authority: "helix_ask_terminal_answer";
  workstation_action_executed: false;
  realtime_provider_tool_executed: false;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export const isTerminalHelixRealtimeGroundedRelayStatus = (
  status: HelixRealtimeGroundedRelayStatusV1,
): boolean => [
  "delivered",
  "suppressed",
  "superseded",
  "stale",
  "interrupted",
  "cancelled",
  "failed",
].includes(status);
