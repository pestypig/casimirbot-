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
  model_visible_capability_lane_manifest: HelixAgentModelVisibleCapabilityLaneManifest;
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

export type HelixAgentModelVisibleCapabilityLaneManifest = {
  schema: "helix.agent_model_visible_capability_lane_manifest.v1";
  source_schema: HelixCapabilityLaneManifest["schema"];
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  purpose: "model_visible_requestable_capability_lanes";
  lanes: HelixAgentModelVisibleCapabilityLane[];
  authority_rules: {
    helix_owns_backend_selection: true;
    selected_runtime_provider_remains_root: true;
    lane_outputs_are_observations_or_receipts: true;
    lane_outputs_require_reentry: true;
    lane_outputs_are_not_final_answers: true;
    terminal_authority_owner: "helix";
  };
  usage_notes: string[];
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixAgentModelVisibleCapabilityLane = {
  lane_id: string;
  label: string;
  status: string;
  requestable_by_runtime_provider: boolean;
  default_backend_provider: string | null;
  backend_provider_options: Array<{
    provider_id: string;
    availability_status: string;
    permission_status: string;
    cost_class: string;
    latency_class: string;
    privacy_class: string;
    fallback_backend_provider: string | null;
  }>;
  capabilities: Array<{
    capability_id: string;
    label: string;
    one_shot_status: string;
    session_status: string;
    required_input_fields: string[];
    optional_input_fields: string[];
    when_to_use: string;
    when_not_to_use?: string;
    request_shape_hint: Record<string, unknown>;
    session_call_shape_hint?: Record<string, unknown>;
    goal_binding_call_shape_hint?: Record<string, unknown>;
    result_authority: "observation_or_receipt_only";
    reentry_required: true;
    terminal_eligible: false;
    assistant_answer: false;
  }>;
};

export const buildModelVisibleCapabilityLaneManifest = (
  manifest: HelixCapabilityLaneManifest,
): HelixAgentModelVisibleCapabilityLaneManifest => {
  const lanes = manifest.lanes
    .filter((lane) => lane.requestable_by_runtime_provider)
    .map((lane) => ({
      lane_id: lane.lane_id,
      label: lane.label,
      status: lane.status,
      requestable_by_runtime_provider: lane.requestable_by_runtime_provider,
      default_backend_provider: lane.default_backend_provider,
      backend_provider_options: lane.backend_providers.map((provider) => ({
        provider_id: provider.provider_id,
        availability_status: provider.availability_status,
        permission_status: provider.permission_status,
        cost_class: provider.cost_class,
        latency_class: provider.latency_class,
        privacy_class: provider.privacy_class,
        fallback_backend_provider: provider.fallback_backend_provider,
      })),
      capabilities: lane.capabilities
        .filter((capability) =>
          capability.one_shot_status === "executable" ||
          capability.session_status === "supported")
        .map((capability) => {
          const hint = capability.model_visible_hint;
          return {
            capability_id: capability.capability_id,
            label: capability.label,
            one_shot_status: capability.one_shot_status,
            session_status: capability.session_status,
            required_input_fields: hint.required_input_fields,
            optional_input_fields: hint.optional_input_fields,
            when_to_use: hint.when_to_use,
            ...(hint.when_not_to_use ? { when_not_to_use: hint.when_not_to_use } : {}),
            request_shape_hint: hint.request_shape_hint,
            ...(capability.session_status === "supported"
              ? {
                  session_call_shape_hint: {
                    capability_lane_session_call: {
                      action: "start | pause | resume | stop | record_observation | list",
                      lane_id: lane.lane_id,
                      lane_session_id: "<stable lane session id>",
                      requested_backend_provider: "<optional backend provider preference>",
                      source_binding: {
                        source_id: "<source id>",
                        source_hash: "<optional source hash>",
                        source_text_hash: "<optional source text hash>",
                        source_text_char_count: "<optional source text character count>",
                        source_kind: "docs | docs_hover | docs_selection | audio | visual | ask_turn | unknown",
                        projection_target: "<optional projection target>",
                        account_locale: "<optional account/interface locale>",
                        target_language: "<optional target language>",
                      },
                      observation_ref: "<record_observation only: observation ref>",
                      receipt_ref: "<record_observation only: receipt ref>",
                    },
                  },
                }
              : {}),
            ...(lane.goal_binding_contract.supported
              ? {
                  goal_binding_call_shape_hint: {
                    capability_lane_goal_binding_call: {
                      action: "bind | update_attention | record_mail_loop | record_report | stop",
                      goal_id: "<goal id for bind>",
                      goal_binding_id: "<stable goal binding id after bind>",
                      lane_session_id: "<bound lane session id>",
                      activation_policy: "manual | while_goal_active | on_source_event",
                      attention_policy: "quiet_until_salient | report_each_observation | manual_review",
                      stop_condition: "manual_stop | goal_complete | source_stopped | session_stopped",
                      report_policy: "debug_only | terminal_authorized_summary | ask_on_salience",
                      quiet_behavior: "record_only | surface_badge | wake_on_salience",
                      mail_loop_summary: "<record_mail_loop only: Helix mail-loop debug summary>",
                      report_ref: "<record_report only: report receipt ref>",
                      terminal_authorized: false,
                    },
                  },
                }
              : {}),
            result_authority: "observation_or_receipt_only" as const,
            reentry_required: true as const,
            terminal_eligible: false as const,
            assistant_answer: false as const,
          };
        }),
    }))
    .filter((lane) => lane.capabilities.length > 0);

  return {
    schema: "helix.agent_model_visible_capability_lane_manifest.v1",
    source_schema: manifest.schema,
    selected_runtime_agent_provider: manifest.selected_runtime_agent_provider,
    purpose: "model_visible_requestable_capability_lanes",
    lanes,
    authority_rules: {
      helix_owns_backend_selection: true,
      selected_runtime_provider_remains_root: true,
      lane_outputs_are_observations_or_receipts: true,
      lane_outputs_require_reentry: true,
      lane_outputs_are_not_final_answers: true,
      terminal_authority_owner: "helix",
    },
    usage_notes: [
      "Capability lanes are requested by the runtime provider, but Helix admits the request and selects the backend provider.",
      "Lane output is observation/receipt evidence, not a final answer.",
      "For admitted microphone/audio capture, use speech_to_text.transcribe_audio to packetize transcripts as live-answer mail observations before goal-bound follow-up.",
      "For translation text/content requests, prefer live_translation.translate_text.",
      "Use docs-viewer.read_active_translation only to read an already-existing translated Docs surface.",
      "Ask for clarification when a lane request is missing required input fields.",
    ],
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
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
  const modelVisibleCapabilityLaneManifest = buildModelVisibleCapabilityLaneManifest(capabilityLaneManifest);
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
    model_visible_capability_lane_manifest: modelVisibleCapabilityLaneManifest,
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
      "Lane sessions may start, pause, resume, stop, or list only through Helix-governed session calls; session traffic remains observation-only.",
      "A capability lane may be requested by purpose, but Helix resolves backend provider/service policy and keeps the selected runtime agent provider unchanged.",
      "Model-visible capability lane manifest entries are requestable lane affordances, not proof that a lane has already run.",
      "Speech-to-text results are source observations; do not treat transcripts as submitted user prompts unless the turn or goal explicitly admits that handoff.",
      "For translation requests over text/content, prefer live_translation.translate_text; use docs-viewer.read_active_translation only for already-existing translated Docs surfaces.",
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
