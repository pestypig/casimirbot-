export const HELIX_REALTIME_WORKER_ADMISSION_V2_SCHEMA =
  "helix.realtime_worker_admission.v2" as const;

export const HELIX_REALTIME_WORKER_DISPATCH_V2_SCHEMA =
  "helix.realtime_worker_dispatch.v2" as const;

export type HelixRealtimeWorkerAdmissionOutcomeV2 =
  | "conversation_local"
  | "worker_grounded"
  | "durable_goal_bound"
  | "action_candidate";

export type HelixRealtimeWorkerDispatchKindV2 =
  | "none"
  | "ask_runtime"
  | "goal_wake"
  | "ask_runtime_read_only";

export type HelixRealtimeWorkerDispatchStateV2 =
  | "not_required"
  | "requested"
  | "completed"
  | "failed";

export type HelixRealtimeWorkerDispatchV2 = {
  schema: typeof HELIX_REALTIME_WORKER_DISPATCH_V2_SCHEMA;
  kind: HelixRealtimeWorkerDispatchKindV2;
  state: HelixRealtimeWorkerDispatchStateV2;
  requested: boolean;
  completed: boolean;
  target_runtime_agent_provider: string | null;
  runtime_selection_source: "goal_binding" | "ask_ui_selected_runtime" | "none";
  goal_id: string | null;
  runtime_goal_session_ref: string | null;
  suppress_parallel_ask_turn: boolean;
  read_only: true;
  workstation_action_execution_allowed: false;
  realtime_provider_tool_execution_allowed: false;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixRealtimeWorkerAdmissionV2 = {
  schema: typeof HELIX_REALTIME_WORKER_ADMISSION_V2_SCHEMA;
  admission_id: string;
  handoff_id: string;
  realtime_session_id: string;
  thread_id: string;
  decision_phase: "transcript_handoff" | "solver_final";
  outcome: HelixRealtimeWorkerAdmissionOutcomeV2;
  reason_codes: string[];
  selected_primary_intent: string | null;
  selected_route: string | null;
  selected_runtime_agent_provider: string | null;
  selected_model: string | null;
  candidate_readonly_capability_ids: string[];
  observed_readonly_capability_ids: string[];
  action_candidate_capability_ids: string[];
  dispatch: HelixRealtimeWorkerDispatchV2;
  worker_turn_dispatched: boolean;
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
