import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import type { HelixAgentStepObservationPacket } from "@shared/helix-agent-step-observation-packet";
import type {
  HelixToolFollowupDecision,
  HelixToolLifecycleTrace,
} from "@shared/helix-tool-lifecycle";

export type HelixWorkstationGatewayMode = "read" | "observe" | "act" | "verify";

export type HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1";
  capability_id: string;
  label: string;
  description: string;
  mode: HelixWorkstationGatewayMode;
  mutating: false;
  code_mutation: false;
  shell_access: false;
  requires_confirmation: boolean;
  requires_source: boolean;
  terminal_eligible: false;
  permission_profile_required: "observe" | "read" | "act" | "write" | "danger";
  post_tool_model_step_required: true;
  input_schema: Record<string, unknown>;
  output_observation_schema: string;
  observation_schema: string;
  safety_tags: string[];
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixWorkstationGatewayListInput = {
  agentRuntime?: HelixAgentRuntimeId | string | null;
  mode?: HelixWorkstationGatewayMode | string | null;
};

export type HelixWorkstationGatewayListResult = {
  schema: "helix.workstation_tool_gateway.v1";
  manifest_version: string;
  agent_runtime: string;
  mode: HelixWorkstationGatewayMode;
  capabilities: HelixWorkstationCapabilityManifest[];
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixWorkstationGatewayCallInput = {
  agentRuntime?: HelixAgentRuntimeId | string | null;
  mode?: HelixWorkstationGatewayMode | string | null;
  capabilityId: string;
  arguments?: Record<string, unknown>;
  approvalToken?: string | null;
  turnId?: string | null;
  iteration?: number | null;
};

export type HelixWorkstationGatewayAdmissionRecord = {
  schema: "helix.workstation_tool_gateway.admission.v1";
  requested_capability: string;
  selected_agent_provider: string;
  permission_profile: "observe" | "read" | "act" | "write" | "danger";
  source_target_intent?: unknown;
  admission_status: "admitted" | "blocked";
  admission_reason: string;
  blocked_reason?: string;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixWorkstationGatewayCallResult = {
  schema: "helix.workstation_tool_gateway.call_result.v1";
  manifest_version: string;
  ok: boolean;
  agent_runtime: string;
  capability_id: string;
  mode: HelixWorkstationGatewayMode;
  gateway_admission: HelixWorkstationGatewayAdmissionRecord;
  observation_packet: HelixAgentStepObservationPacket;
  tool_lifecycle_trace: HelixToolLifecycleTrace;
  tool_followup_decision: HelixToolFollowupDecision;
  observation: unknown;
  artifact_refs: string[];
  terminal_eligible: false;
  post_tool_model_step_required: true;
  assistant_answer: false;
  raw_content_included: false;
  error?: string;
};
