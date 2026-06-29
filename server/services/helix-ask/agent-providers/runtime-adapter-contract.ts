import type { HelixAgentRunRoute, HelixAgentProvider } from "./types";
import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import type {
  HelixWorkstationCapabilityManifest,
  HelixWorkstationGatewayMode,
  HelixWorkstationGatewayListResult,
} from "../workstation-tool-gateway/types";
import { listWorkstationGatewayCapabilities } from "../workstation-tool-gateway/registry";
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
    .filter((capability) => {
      const requiredRank = permissionRank[capability.permission_profile_required];
      return modeRank[manifest.mode] >= requiredRank && providerPermissionRank(provider) >= requiredRank;
    })
    .map((capability) => capability.capability_id);

const projectionReceiptCapabilityIds = (manifest: HelixWorkstationGatewayListResult): string[] =>
  manifest.capabilities
    .filter((capability) =>
      capability.permission_profile_required === "act" &&
      Boolean(capability.panel_id || capability.action_id),
    )
    .map((capability) => capability.capability_id);

const blockedCapabilityIds = (
  manifest: HelixWorkstationGatewayListResult,
  provider: HelixAgentProvider,
): string[] => {
  const admitted = new Set(admittedCapabilityIds(manifest, provider));
  const projectionReceipts = new Set(projectionReceiptCapabilityIds(manifest));
  return manifest.capabilities
    .map((capability) => capability.capability_id)
    .filter((capabilityId) => !admitted.has(capabilityId) && !projectionReceipts.has(capabilityId));
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
  workstation_gateway_manifest: HelixWorkstationGatewayListResult;
  workstation_gateway_capability_ids: string[];
  workstation_gateway_admitted_capability_ids: string[];
  workstation_gateway_projection_receipt_capability_ids: string[];
  workstation_gateway_blocked_capability_ids: string[];
  runtime_selection_trace: HelixAgentRuntimeSelectionTrace;
  adapter_invariants: {
    runtime_glue_owned_by_provider: true;
    helix_owns_tool_admission: true;
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
    workstation_gateway_manifest: gatewayManifest,
    workstation_gateway_capability_ids: gatewayManifest.capabilities.map((capability) => capability.capability_id),
    workstation_gateway_admitted_capability_ids: admittedCapabilityIds(gatewayManifest, input.provider),
    workstation_gateway_projection_receipt_capability_ids: projectionReceiptCapabilityIds(gatewayManifest),
    workstation_gateway_blocked_capability_ids: blockedCapabilityIds(gatewayManifest, input.provider),
    runtime_selection_trace: runtimeSelectionTrace,
    adapter_invariants: {
      runtime_glue_owned_by_provider: true,
      helix_owns_tool_admission: true,
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
      "Do not claim a workstation tool or UI action ran unless a Helix observation packet or action receipt is present.",
      "Receipts and observations are not final answers; they must re-enter provider reasoning before any terminal candidate.",
      "Helix gates answer authority but does not rewrite, shorten, bulletize, or otherwise impose answer style on the provider terminal candidate.",
      "Do not mutate files, run shell commands, or perform code mutation through this adapter contract.",
    ],
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};
