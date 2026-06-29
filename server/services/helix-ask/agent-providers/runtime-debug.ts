import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import type { HelixWorkstationGatewayListResult } from "../workstation-tool-gateway/types";
import type { HelixAgentProvider, HelixAgentRunRoute } from "./types";

export type HelixAgentRuntimeSelectionTrace = {
  schema: "helix.agent_runtime_selection_trace.v1";
  route: HelixAgentRunRoute;
  requested_runtime: HelixAgentRuntimeId;
  selected_runtime: HelixAgentRuntimeId;
  fallback_used: boolean;
  fallback_reason: string | null;
  provider_enabled: boolean;
  selected_agent_provider: {
    id: HelixAgentRuntimeId;
    label: string;
    permission_profile: HelixAgentProvider["permissionProfile"];
    supports: HelixAgentProvider["supports"];
  };
  workstation_gateway: {
    manifest_schema: string | null;
    manifest_version: string | null;
    capability_ids: string[];
    tools_enabled_for_provider: boolean;
    code_mutation_enabled: boolean;
    shell_enabled: boolean;
    file_mutation_enabled: boolean;
    gateway_contract: "read_observe_act" | "provider_disabled";
  };
  evidence_reentry_status: "not_run_text_mode_adapter" | "pending_provider_reasoning" | "not_applicable";
  terminal_authority_status: "not_evaluated_provider_text_mode" | "pending_helix_terminal_authority" | "not_applicable";
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export const buildHelixAgentRuntimeSelectionTrace = (input: {
  route: HelixAgentRunRoute;
  requestedRuntime: HelixAgentRuntimeId;
  provider: HelixAgentProvider;
  fallbackReason?: string | null;
  gatewayManifest?: HelixWorkstationGatewayListResult | null;
}): HelixAgentRuntimeSelectionTrace => {
  const manifest = input.gatewayManifest ?? null;
  return {
    schema: "helix.agent_runtime_selection_trace.v1",
    route: input.route,
    requested_runtime: input.requestedRuntime,
    selected_runtime: input.provider.id,
    fallback_used: input.requestedRuntime !== input.provider.id,
    fallback_reason: input.fallbackReason ?? (input.requestedRuntime !== input.provider.id ? "requested_provider_unavailable" : null),
    provider_enabled: input.provider.enabled(),
    selected_agent_provider: {
      id: input.provider.id,
      label: input.provider.label,
      permission_profile: input.provider.permissionProfile,
      supports: input.provider.supports,
    },
    workstation_gateway: {
      manifest_schema: manifest?.schema ?? null,
      manifest_version: manifest?.manifest_version ?? null,
      capability_ids: manifest?.capabilities.map((capability) => capability.capability_id) ?? [],
      tools_enabled_for_provider: input.provider.supports.workstationTools,
      code_mutation_enabled: input.provider.permissionProfile.allows.codeMutation,
      shell_enabled: input.provider.permissionProfile.allows.shell,
      file_mutation_enabled: input.provider.permissionProfile.allows.write,
      gateway_contract: input.provider.supports.workstationTools ? "read_observe_act" : "provider_disabled",
    },
    evidence_reentry_status: input.provider.id === "codex" ? "not_run_text_mode_adapter" : "pending_provider_reasoning",
    terminal_authority_status:
      input.provider.id === "codex" ? "not_evaluated_provider_text_mode" : "pending_helix_terminal_authority",
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};
