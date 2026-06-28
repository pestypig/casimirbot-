import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import type { HelixAgentStepObservationPacket } from "@shared/helix-agent-step-observation-packet";

export type HelixWorkstationGatewayMode = "read" | "observe" | "act" | "verify";

export type HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1";
  capability_id: string;
  label: string;
  description: string;
  mode: "read_only" | "observe_only";
  mutating: false;
  code_mutation: false;
  shell_access: false;
  terminal_eligible: false;
  post_tool_model_step_required: true;
  input_schema: Record<string, unknown>;
  observation_schema: string;
  safety_tags: string[];
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixWorkstationGatewayListInput = {
  agentRuntime?: HelixAgentRuntimeId | string | null;
  mode?: HelixWorkstationGatewayMode | string | null;
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

export type HelixWorkstationGatewayCallResult = {
  schema: "helix.workstation_tool_gateway.call_result.v1";
  ok: boolean;
  agent_runtime: string;
  capability_id: string;
  mode: HelixWorkstationGatewayMode;
  observation_packet: HelixAgentStepObservationPacket;
  observation: unknown;
  artifact_refs: string[];
  terminal_eligible: false;
  post_tool_model_step_required: true;
  assistant_answer: false;
  raw_content_included: false;
  error?: string;
};
