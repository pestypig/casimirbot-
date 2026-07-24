export const HELIX_REALTIME_PROVISIONAL_RESPONSE_SCHEMA =
  "helix.realtime_provisional_response.v1" as const;

export type HelixRealtimeProvisionalResponseKindV1 =
  | "conversation_local"
  | "parallel_conversation"
  | "worker_dispatch_status"
  | "worker_dispatch_failure";

export type HelixRealtimeProvisionalResponseStatusV1 =
  | "queued"
  | "response_requested"
  | "speaking"
  | "delivered"
  | "suppressed"
  | "interrupted"
  | "cancelled"
  | "failed";

export type HelixRealtimeProvisionalResponseV1 = {
  schema: typeof HELIX_REALTIME_PROVISIONAL_RESPONSE_SCHEMA;
  provisional_response_id: string;
  realtime_session_id: string;
  thread_id: string;
  handoff_id: string;
  worker_admission_id: string;
  kind: HelixRealtimeProvisionalResponseKindV1;
  status: HelixRealtimeProvisionalResponseStatusV1;
  status_reason: string;
  utterance_code: string;
  selected_route: string | null;
  selected_runtime_agent_provider: string | null;
  requested_after_admission: true;
  requested_after_worker_dispatch_receipt: boolean;
  worker_dispatch_receipt_ref: string | null;
  provider_event_ref: string | null;
  provider_response_ref: string | null;
  playback_receipt_ref: string | null;
  response_created: boolean;
  response_completed: boolean;
  created_at_ms: number;
  updated_at_ms: number;
  completed_at_ms: number | null;
  failure_code: string | null;
  workstation_action_executed: false;
  realtime_provider_tool_executed: false;
  provider_payload_included: false;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};
