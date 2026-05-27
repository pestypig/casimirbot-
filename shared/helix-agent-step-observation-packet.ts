import type { HelixToolRuntimeShape } from "./helix-tool-surface";

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
  }>;
  state_delta?: HelixAgentStepObservationPacket["state_delta"];
  raw?: unknown;
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
  }>;
  state_delta: {
    opened_panels?: string[];
    focused_panel?: string;
    attached_sources?: string[];
    created_constructs?: string[];
    updated_notes?: string[];
  };
  suggested_next_steps: Array<"answer" | "ask_user" | "use_another_tool" | "repair" | "fail_closed">;
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
