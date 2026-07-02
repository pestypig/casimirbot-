import type { HelixAgentRunRoute, HelixAgentProvider } from "./types";
import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import type {
  HelixCapabilityLaneDescriptor,
  HelixCapabilityLaneManifest,
  HelixCapabilityLaneResolveTrace,
} from "@shared/helix-capability-lane";
import type {
  HelixWorkstationCapabilityManifest,
  HelixWorkstationGatewayMode,
  HelixWorkstationGatewayListResult,
} from "../workstation-tool-gateway/types";
import { listWorkstationGatewayCapabilities } from "../workstation-tool-gateway/registry";
import {
  listHelixCapabilityLanes,
  resolveHelixCapabilityLaneRequest,
} from "../capability-lanes/registry";
import {
  buildHelixAgentRuntimeSelectionTrace,
  type HelixAgentRuntimeSelectionTrace,
} from "./runtime-debug";

const permissionRank: Record<HelixWorkstationCapabilityManifest["permission_profile_required"], number> = {
  observe: 1,
  read: 2,
  act: 3,
  write: 4,
  danger: 5,
};

const modeRank: Record<HelixWorkstationGatewayMode, number> = {
  observe: 2,
  read: 2,
  act: 3,
  verify: 2,
};

const providerPermissionRank = (provider: HelixAgentProvider): number => {
  if (provider.permissionProfile.allows.write) return permissionRank.write;
  if (provider.permissionProfile.allows.act) return permissionRank.act;
  if (provider.permissionProfile.allows.read) return permissionRank.read;
  if (provider.permissionProfile.allows.observe) return permissionRank.observe;
  return 0;
};

const admittedCapabilityIds = (
  manifest: HelixWorkstationGatewayListResult,
  provider: HelixAgentProvider,
): string[] =>
  manifest.capabilities
    .filter((capability: HelixWorkstationCapabilityManifest) => {
      const requiredRank = permissionRank[capability.permission_profile_required];
      return modeRank[manifest.mode] >= requiredRank && providerPermissionRank(provider) >= requiredRank;
    })
    .map((capability: HelixWorkstationCapabilityManifest) => capability.capability_id);

const projectionReceiptCapabilityIds = (manifest: HelixWorkstationGatewayListResult): string[] =>
  manifest.capabilities
    .filter((capability: HelixWorkstationCapabilityManifest) =>
      capability.permission_profile_required === "act" &&
      Boolean(capability.panel_id || capability.action_id),
    )
    .map((capability: HelixWorkstationCapabilityManifest) => capability.capability_id);

const blockedCapabilityIds = (
  manifest: HelixWorkstationGatewayListResult,
  provider: HelixAgentProvider,
): string[] => {
  const admitted = new Set(admittedCapabilityIds(manifest, provider));
  const projectionReceipts = new Set(projectionReceiptCapabilityIds(manifest));
  return manifest.capabilities
    .map((capability: HelixWorkstationCapabilityManifest) => capability.capability_id)
    .filter((capabilityId: string) => !admitted.has(capabilityId) && !projectionReceipts.has(capabilityId));
};

export type HelixAgentRuntimeAdapterContract = {
  schema: "helix.agent_runtime_adapter_contract.v1";
  adapter_boundary: "helix_agent_provider_edge";
  route: HelixAgentRunRoute;
  requested_runtime: HelixAgentRuntimeId;
  selected_runtime: HelixAgentRuntimeId;
  selected_agent_provider: {
    id: HelixAgentRuntimeId;
    label: string;
    permission_profile: HelixAgentProvider["permissionProfile"];
    supports: HelixAgentProvider["supports"];
  };
  supports: HelixAgentProvider["supports"];
  workstation_gateway_manifest: HelixWorkstationGatewayListResult;
  workstation_gateway_capability_ids: string[];
  workstation_gateway_admitted_capability_ids: string[];
  workstation_gateway_projection_receipt_capability_ids: string[];
  workstation_gateway_blocked_capability_ids: string[];
  capability_lane_manifest: HelixCapabilityLaneManifest;
  capability_lane_ids: HelixCapabilityLaneManifest["lane_ids"];
  capability_lane_statuses: Record<string, string>;
  capability_lane_resolve_trace_shape: HelixCapabilityLaneResolveTrace;
  runtime_selection_trace: HelixAgentRuntimeSelectionTrace;
  adapter_invariants: {
    runtime_glue_owned_by_provider: true;
    helix_owns_tool_admission: true;
    helix_owns_capability_lane_admission: true;
    capability_lanes_are_not_root_agents: true;
    capability_lane_one_shot_execution_enabled: true;
    capability_lane_sessions_enabled: true;
    capability_lane_sessions_are_observation_only: true;
    helix_owns_observation_packets: true;
    helix_owns_terminal_authority: true;
    receipts_are_not_answers: true;
    non_mutating_ui_actions_are_receipts_only: true;
    observations_require_reentry_before_final_answer: true;
    helix_preserves_provider_answer_style: true;
    helix_style_rewrite_enabled: false;
    shell_access_enabled: false;
    file_mutation_enabled: false;
    code_mutation_enabled: false;
  };
  prompt_policy_lines: string[];
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export const buildHelixAgentRuntimeAdapterContract = (input: {
  route: HelixAgentRunRoute;
  requestedRuntime: HelixAgentRuntimeId;
  provider: HelixAgentProvider;
  gatewayMode: HelixWorkstationGatewayMode;
  fallbackReason?: string | null;
}): HelixAgentRuntimeAdapterContract => {
  const gatewayManifest = listWorkstationGatewayCapabilities({
    agentRuntime: input.provider.id,
    mode: input.gatewayMode,
  });
  const capabilityLaneManifest = listHelixCapabilityLanes({
    provider: input.provider,
  });
  const capabilityLaneTraceShape = resolveHelixCapabilityLaneRequest({
    provider: input.provider,
    requestedLane: null,
  });
  const runtimeSelectionTrace = buildHelixAgentRuntimeSelectionTrace({
    route: input.route,
    requestedRuntime: input.requestedRuntime,
    provider: input.provider,
    fallbackReason: input.fallbackReason,
    gatewayManifest,
  });
  const selectedProvider = {
    id: input.provider.id,
    label: input.provider.label,
    permission_profile: input.provider.permissionProfile,
    supports: input.provider.supports,
  };

  return {
    schema: "helix.agent_runtime_adapter_contract.v1",
    adapter_boundary: "helix_agent_provider_edge",
    route: input.route,
    requested_runtime: input.requestedRuntime,
    selected_runtime: input.provider.id,
    selected_agent_provider: selectedProvider,
    supports: input.provider.supports,
    workstation_gateway_manifest: gatewayManifest,
    workstation_gateway_capability_ids: gatewayManifest.capabilities.map(
      (capability: HelixWorkstationCapabilityManifest) => capability.capability_id,
    ),
    workstation_gateway_admitted_capability_ids: admittedCapabilityIds(gatewayManifest, input.provider),
    workstation_gateway_projection_receipt_capability_ids: projectionReceiptCapabilityIds(gatewayManifest),
    workstation_gateway_blocked_capability_ids: blockedCapabilityIds(gatewayManifest, input.provider),
    capability_lane_manifest: capabilityLaneManifest,
    capability_lane_ids: capabilityLaneManifest.lane_ids,
    capability_lane_statuses: Object.fromEntries(
      capabilityLaneManifest.lanes.map((lane: HelixCapabilityLaneDescriptor) => [lane.lane_id, lane.status]),
    ),
    capability_lane_resolve_trace_shape: capabilityLaneTraceShape,
    runtime_selection_trace: runtimeSelectionTrace,
    adapter_invariants: {
      runtime_glue_owned_by_provider: true,
      helix_owns_tool_admission: true,
      helix_owns_capability_lane_admission: true,
      capability_lanes_are_not_root_agents: true,
      capability_lane_one_shot_execution_enabled: true,
      capability_lane_sessions_enabled: true,
      capability_lane_sessions_are_observation_only: true,
      helix_owns_observation_packets: true,
      helix_owns_terminal_authority: true,
      receipts_are_not_answers: true,
      non_mutating_ui_actions_are_receipts_only: true,
      observations_require_reentry_before_final_answer: true,
      helix_preserves_provider_answer_style: true,
      helix_style_rewrite_enabled: false,
      shell_access_enabled: false,
      file_mutation_enabled: false,
      code_mutation_enabled: false,
    },
    prompt_policy_lines: [
      "Adapter boundary: helix_agent_provider_edge.",
      "Runtime-specific protocol glue stays inside the selected provider adapter.",
      "Use only Helix workstation gateway capabilities admitted for this turn.",
      "Capability lanes may execute only through Helix-governed one-shot lane calls or lane sessions admitted for this turn.",
      "Lane sessions may start, pause, resume, or stop only through Helix-governed session calls; session traffic remains observation-only.",
      "A capability lane may be requested by purpose, but Helix resolves backend provider/service policy and keeps the selected runtime agent provider unchanged.",
      "Do not claim a workstation tool or UI action ran unless a Helix observation packet or action receipt is present.",
      "Do not claim an AI service lane ran unless a Helix lane observation or receipt is present.",
      "Receipts and observations are not final answers; they must re-enter provider reasoning before any terminal candidate.",
      "Helix gates answer authority but does not rewrite, shorten, bulletize, or otherwise impose answer style on the provider terminal candidate.",
      "Do not mutate files, run shell commands, or perform code mutation through this adapter contract.",
    ],
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};
