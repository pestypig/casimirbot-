import type { HelixToolRuntimeShape } from "./helix-tool-surface";
import type {
  HelixCapabilityLaneBackendAvailabilityStatus,
  HelixCapabilityLaneBackendPermissionStatus,
  HelixCapabilityLaneBackendSelectionDecision,
  HelixCapabilityLaneCostClass,
  HelixCapabilityLaneId,
  HelixCapabilityLaneLatencyClass,
  HelixCapabilityLanePrivacyClass,
} from "./helix-capability-lane";
import type { HelixLiveTranslationProjectionReceipt } from "./helix-live-translation-lane";

export const HELIX_AGENT_STEP_DECISION_V2_SCHEMA = "helix.agent_step_decision.v2" as const;
export const HELIX_RUNTIME_TOOL_CALL_V1_SCHEMA = "helix.runtime_tool_call.v1" as const;
export const HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA = "helix.agent_step_observation_packet.v1" as const;
export const HELIX_PENDING_TOOL_STATE_SCHEMA = "helix.pending_tool_state.v1" as const;
export const HELIX_AGENT_STEP_COMMENTARY_V2_SCHEMA = "helix.agent_step_commentary.v2" as const;

export type HelixAgentStepDecisionV2 = {
  schema: typeof HELIX_AGENT_STEP_DECISION_V2_SCHEMA;
  turn_id: string;
  iteration: number;
  decision_id: string;
  decision_source?: "model" | "deterministic_fallback_due_to_invalid_model_output" | "deterministic_fallback";
  next_step: "use_capability" | "answer" | "ask_user" | "repair" | "fail_closed";
  chosen_capability?: string;
  runtime_tool_call?: {
    call_id: string;
    capability_key: string;
    panel_id: string;
    action: string;
    args: Record<string, unknown>;
  };
  expected_observation_schema?: string;
  public_commentary?: {
    status: "thinking" | "checking" | "using_tool" | "repairing" | "done";
    summary: string;
    expected_artifact?: string;
    done_condition?: string;
  };
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixRuntimeToolCallV1 = {
  schema: typeof HELIX_RUNTIME_TOOL_CALL_V1_SCHEMA;
  call_id: string;
  turn_id: string;
  decision_id: string;
  capability_key: string;
  panel_id: string;
  action: string;
  runtime_shape: HelixToolRuntimeShape;
  args: Record<string, unknown>;
  validation: {
    ok: boolean;
    violations: string[];
    repair_hint?: string;
  };
  policy: {
    mutating: boolean;
    manual_only: boolean;
    explicit_attachment_only: boolean;
    confirmation_required: boolean;
    terminal_eligible: false;
  };
  post_tool_model_step_required: true;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixRawToolResult = {
  ok: boolean;
  status?: "succeeded" | "blocked" | "missing_input" | "needs_confirmation" | "failed" | "client_pending";
  summary?: string;
  produced_artifact_refs?: string[];
  receipts?: Array<{
    receipt_ref: string;
    kind: string;
    status: string;
  }>;
  missing_requirements?: Array<{
    code: string;
    message: string;
    repair_action?: string;
    rejected_expression?: string | null;
    normalized_expression?: string | null;
    required_affordance_kind?: HelixWorkstationTypedAffordanceKind | null;
  }>;
  state_delta?: HelixAgentStepObservationPacket["state_delta"];
  raw?: unknown;
};

export type HelixWorkstationTypedAffordanceKind =
  | "source_ref"
  | "text_evidence"
  | "citation_evidence"
  | "numeric_value_evidence"
  | "theory_context"
  | "calculator_expression_template"
  | "claim_boundary"
  | "frontier_candidate"
  | "active_surface_ref"
  | "bound_calculator_expression"
  | "calculator_result"
  | "doc_path_ref"
  | "voice_text_evidence"
  | "voice_playback_receipt"
  | "mail_packet_ref"
  | "loop_health_evidence"
  | "prediction_evidence"
  | "stage_plan"
  | "micro_reasoner_eval"
  | "visual_observer_eval"
  | "system_status"
  | "ui_projection_receipt";

export type HelixWorkstationTypedAffordance = {
  schema: "helix.workstation_typed_affordance.v1";
  kind: HelixWorkstationTypedAffordanceKind;
  role: "producer" | "consumer" | "derived";
  source_capability: string;
  artifact_ref?: string;
  expression?: string;
  normalized_expression?: string;
  result?: string | null;
  variables?: string[];
  required_inputs?: string[];
  missing_inputs?: string[];
  source_refs?: string[];
  claim_boundary?: string | null;
  status: "available" | "required" | "blocked" | "missing";
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixAgentStepObservationPacket = {
  schema: typeof HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA;
  turn_id: string;
  iteration: number;
  call_id: string;
  decision_id: string;
  capability_key: string;
  panel_id: string;
  action: string;
  status: "succeeded" | "blocked" | "missing_input" | "needs_confirmation" | "failed" | "client_pending";
  produced_artifact_refs: string[];
  observation_summary: string;
  receipts: Array<{
    receipt_ref: string;
    kind: string;
    status: string;
  }>;
  missing_requirements: Array<{
    code: string;
    message: string;
    repair_action?: string;
    rejected_expression?: string | null;
    normalized_expression?: string | null;
    required_affordance_kind?: HelixWorkstationTypedAffordanceKind | null;
  }>;
  backend_selection_decision?: HelixCapabilityLaneBackendSelectionDecision | null;
  state_delta: {
    opened_panels?: string[];
    focused_panel?: string;
    attached_sources?: string[];
    created_constructs?: string[];
    updated_notes?: string[];
    live_translation_chunk?: {
      lane_session_id: string | null;
      source_id: string;
      chunk_id: string;
      chunk_index: number | null;
      dedupe_key: string;
      source_event_ms: number | null;
      observed_at_ms: number;
      freshness_status: "fresh" | "stale" | "unknown";
      projection_target:
        | "ask_turn"
        | "docs_hover"
        | "docs_selection"
        | "docs_chunk"
        | "audio_chunk"
        | "account_language"
        | "unknown";
      cancel_requested: boolean;
      observation_ref: string;
      terminal_eligible: false;
      assistant_answer: false;
      raw_content_included: false;
    };
    live_translation_projection_receipt?: HelixLiveTranslationProjectionReceipt;
    speech_to_text_observation?: unknown;
    speech_to_text_live_source_mail_item?: unknown;
    text_to_speech_receipt?: unknown;
    voice_playback_client_receipt?: unknown;
    capability_lane_shadow_execution?: {
      lane_id: HelixCapabilityLaneId;
      capability: string;
      requested_backend_provider: string | null;
      requested_backend_provider_known: boolean | null;
      selected_backend_provider: string | null;
      backend_selection_decision: HelixCapabilityLaneBackendSelectionDecision | null;
      selection_reason: string | null;
      availability_status: HelixCapabilityLaneBackendAvailabilityStatus | "unknown" | null;
      permission_status: HelixCapabilityLaneBackendPermissionStatus | "unknown" | null;
      cost_class: HelixCapabilityLaneCostClass | "unknown" | null;
      latency_class: HelixCapabilityLaneLatencyClass | "unknown" | null;
      privacy_class: HelixCapabilityLanePrivacyClass | "unknown" | null;
      fallback_backend_provider: string | null;
      execution_status: "not_executed_shadow_only";
      terminal_eligible: false;
      assistant_answer: false;
      raw_content_included: false;
    };
  };
  suggested_next_steps: Array<"answer" | "ask_user" | "use_another_tool" | "repair" | "fail_closed">;
  produced_affordances?: HelixWorkstationTypedAffordance[];
  consumed_affordances?: HelixWorkstationTypedAffordance[];
  typed_handoff_contract?: {
    schema: "helix.workstation_typed_handoff_contract.v1";
    producer_capability: string;
    consumer_capability?: string | null;
    required_affordance_kinds: HelixWorkstationTypedAffordanceKind[];
    produced_affordance_kinds: HelixWorkstationTypedAffordanceKind[];
    missing_affordance_kinds: HelixWorkstationTypedAffordanceKind[];
    terminal_eligible: false;
    assistant_answer: false;
    raw_content_included: false;
  };
  terminal_eligible: false;
  post_tool_model_step_required: true;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixPendingToolState = {
  schema: typeof HELIX_PENDING_TOOL_STATE_SCHEMA;
  turn_id: string;
  pending_tool_calls: Record<string, {
    call_id: string;
    capability_key: string;
    status:
      | "awaiting_client_result"
      | "awaiting_user_confirmation"
      | "awaiting_source_attachment"
      | "awaiting_manual_action";
    created_at: string;
    expires_at?: string;
  }>;
  assistant_answer_blocked: boolean;
  allowed_terminal_kind?: "request_user_input" | "typed_failure";
};

export type HelixAgentStepCommentaryV2 = {
  schema: typeof HELIX_AGENT_STEP_COMMENTARY_V2_SCHEMA;
  turn_id: string;
  timing: "before_tool" | "after_tool";
  call_id: string;
  public_summary: string;
  expected_artifact?: string;
  changed_state_refs?: string[];
  suggested_next_step?: "answer" | "ask_user" | "use_another_tool" | "repair" | "fail_closed";
  assistant_answer: false;
  raw_content_included: false;
};
