import type {
  HelixCapabilityLaneDescriptor,
  HelixCapabilityLaneId,
  HelixCapabilityLaneManifest,
  HelixCapabilityLaneModelVisibleHint,
  HelixCapabilityLaneResolveTrace,
} from "@shared/helix-capability-lane";
import {
  HELIX_CAPABILITY_LANE_IDS,
} from "@shared/helix-capability-lane";
import type { HelixAgentProvider } from "../agent-providers/types";
import {
  HELIX_LANE_BACKEND_SELECTION_POLICY,
  backendPermissionStatus,
  backendProvidersFor,
  buildBackendSelectionDecision,
  liveTranslationExternalBackendsEnabled,
  liveTranslationOpenAiCompatibleConfigured,
  readBooleanEnv,
} from "./backend-provider-config";
import { codeTextLaneTemplate } from "./code-text";
import { deliberateTextLaneTemplate } from "./deliberate-text";
import { interactiveTextLaneTemplate } from "./interactive-text";
import type { HelixCapabilityLaneTemplate } from "./lane-template";
import { liveTranslationLaneTemplate } from "./live-translation-descriptor";
import { speechToTextLaneTemplate } from "./speech-to-text-descriptor";
import { textToSpeechLaneTemplate } from "./text-to-speech-descriptor";
import { utilityTextLaneTemplate } from "./utility-text-descriptor";
import { visualAnalysisLaneTemplate } from "./visual-analysis";
import { workstationToolReferenceLaneTemplate } from "./workstation-tool-reference-descriptor";

const defaultCapabilityModelVisibleHint = (
  capabilityId: string,
): HelixCapabilityLaneDescriptor["capabilities"][number]["model_visible_hint"] => ({
  required_input_fields: [],
  optional_input_fields: ["requested_backend_provider"],
  when_to_use: "Use only when this governed lane capability directly matches the user's requested task.",
  when_not_to_use:
    "Do not use from contextual, negated, future, historical, quoted, or screen-visible mentions. Lane output is observation-only and must re-enter Helix before terminal authority.",
  request_shape_hint: {
    capability_lane_call: {
      capability: capabilityId,
    },
  },
});

const normalizeCapabilityModelVisibleHint = (
  capabilityId: string,
  hint?: HelixCapabilityLaneModelVisibleHint,
): HelixCapabilityLaneModelVisibleHint => {
  const fallback = defaultCapabilityModelVisibleHint(capabilityId);
  const optionalInputFields = new Set([
    ...(hint?.optional_input_fields ?? fallback.optional_input_fields),
    "requested_backend_provider",
  ]);

  return {
    ...fallback,
    ...hint,
    optional_input_fields: Array.from(optionalInputFields),
    when_not_to_use: hint?.when_not_to_use ?? fallback.when_not_to_use,
  };
};

const laneTemplates: HelixCapabilityLaneTemplate[] = [
  utilityTextLaneTemplate,
  interactiveTextLaneTemplate,
  deliberateTextLaneTemplate,
  codeTextLaneTemplate,
  speechToTextLaneTemplate,
  textToSpeechLaneTemplate,
  liveTranslationLaneTemplate,
  visualAnalysisLaneTemplate,
  workstationToolReferenceLaneTemplate,
];

const laneSet = new Set<string>(HELIX_CAPABILITY_LANE_IDS);

const laneEnabled = (
  laneId: HelixCapabilityLaneId,
  env: NodeJS.ProcessEnv,
): boolean =>
  readBooleanEnv(env.HELIX_CAPABILITY_LANES_ENABLED, true) &&
  readBooleanEnv(env[`HELIX_CAPABILITY_LANE_${laneId.toUpperCase()}_ENABLED`], true);

const laneStatus = (input: {
  template: HelixCapabilityLaneTemplate;
  provider: HelixAgentProvider;
  env: NodeJS.ProcessEnv;
}): HelixCapabilityLaneDescriptor["status"] => {
  if (!laneEnabled(input.template.lane_id, input.env)) return "disabled";
  if (
    input.template.lane_id === "workstation_tool_reference" &&
    !input.provider.supports.workstationTools
  ) {
    return "permission_blocked";
  }
  if (!input.template.configured(input.env)) return "unconfigured";
  if (input.template.lane_id === "workstation_tool_reference") return "available";
  return "dry_run";
};

const statusReason = (
  status: HelixCapabilityLaneDescriptor["status"],
): string => {
  switch (status) {
    case "available":
      return "existing_governed_gateway_available_without_lane_reroute";
    case "dry_run":
      return "configured_but_shadow_catalog_only";
    case "unconfigured":
      return "backend_provider_key_or_endpoint_not_configured";
    case "permission_blocked":
      return "selected_runtime_provider_permission_does_not_allow_lane";
    case "disabled":
      return "capability_lane_disabled_by_policy";
  }
  return "capability_lane_status_unknown";
};

const terminalPolicy = {
  schema: "helix.capability_lane.terminal_policy.v1" as const,
  lane_output_can_be_final_answer: false as const,
  terminal_authority_owner: "helix" as const,
  requires_evidence_reentry: true as const,
  preserves_runtime_provider_root: true as const,
};

const laneContractsFor = (template: HelixCapabilityLaneTemplate) => ({
  backend_selection_policy: HELIX_LANE_BACKEND_SELECTION_POLICY,
  one_shot_call_contract: {
    schema: "helix.capability_lane.one_shot_call_contract.v1" as const,
    supported: template.one_shot_supported,
    request_schema_ref: `helix.${template.lane_id}.one_shot_request.v1`,
    response_schema_ref: `helix.${template.lane_id}.one_shot_response.v1`,
    output_role: "observation_or_receipt" as const,
    reentry_required: true as const,
    terminal_eligible: false as const,
    assistant_answer: false as const,
  },
  session_contract: {
    schema: "helix.capability_lane.session_contract.v1" as const,
    supported: template.session_supported,
    lifecycle: ["start", "stop", "pause", "resume"] as Array<"start" | "stop" | "pause" | "resume">,
    requires_source_binding: template.session_supported,
    emits_observations: true as const,
    terminal_eligible: false as const,
  },
  goal_binding_contract: {
    schema: "helix.capability_lane.goal_binding_contract.v1" as const,
    supported: template.goal_binding_supported,
    binding_fields: [
      "goal_id",
      "lane_session_id",
      "activation_policy",
      "attention_policy",
      "stop_condition",
      "report_policy",
      "quiet_behavior",
    ] as Array<
      | "goal_id"
      | "lane_session_id"
      | "activation_policy"
      | "attention_policy"
      | "stop_condition"
      | "report_policy"
      | "quiet_behavior"
    >,
    backend_provider_becomes_root_agent: false as const,
    final_reports_require_terminal_authority: true as const,
  },
  observation_contract: {
    schema: "helix.capability_lane.observation_contract.v1" as const,
    observation_schema_ref: `helix.${template.lane_id}.observation.v1`,
    assistant_answer: false as const,
    terminal_eligible: false as const,
    raw_content_included: false as const,
    reentry_required: true as const,
  },
  receipt_contract: {
    schema: "helix.capability_lane.receipt_contract.v1" as const,
    receipt_schema_ref: `helix.${template.lane_id}.receipt.v1`,
    assistant_answer: false as const,
    terminal_eligible: false as const,
    raw_content_included: false as const,
    reentry_required: true as const,
  },
  terminal_policy: terminalPolicy,
});

const laneCapabilitiesFor = (template: HelixCapabilityLaneTemplate) =>
  template.capabilities.map((capability) => ({
    schema: "helix.capability_lane.capability_descriptor.v1" as const,
    capability_id: capability.capability_id,
    label: capability.label,
    lane_id: template.lane_id,
    one_shot_status: capability.one_shot_status,
    session_status: capability.session_status,
    backend_provider_required: capability.backend_provider_required,
    model_visible_hint: normalizeCapabilityModelVisibleHint(
      capability.capability_id,
      capability.model_visible_hint,
    ),
    result_authority: "observation_or_receipt_only" as const,
    reentry_required: true as const,
    terminal_eligible: false as const,
    assistant_answer: false as const,
    raw_content_included: false as const,
  }));

const canSelectRequestedLiveBackend = (input: {
  lane: HelixCapabilityLaneDescriptor;
  requestedBackend: HelixCapabilityLaneDescriptor["backend_providers"][number] | null;
  env: NodeJS.ProcessEnv;
}): boolean =>
  input.lane.lane_id === "live_translation" &&
  liveTranslationExternalBackendsEnabled(input.env) &&
  input.requestedBackend?.provider_id === "live_translation.openai_compatible" &&
  input.requestedBackend.configuration_status === "configured" &&
  input.requestedBackend.availability_status === "dry_run" &&
  input.requestedBackend.permission_status === "admitted";

const liveBackendExecutionEnabledFor = (input: {
  lane: HelixCapabilityLaneDescriptor;
  selectedBackend: HelixCapabilityLaneDescriptor["backend_providers"][number] | null;
  env: NodeJS.ProcessEnv;
}): boolean =>
  input.lane.lane_id === "live_translation" &&
  liveTranslationExternalBackendsEnabled(input.env) &&
  input.selectedBackend?.provider_id === "live_translation.openai_compatible";

const defaultBackendProviderFor = (input: {
  template: HelixCapabilityLaneTemplate;
  backendProviders: HelixCapabilityLaneDescriptor["backend_providers"];
  env: NodeJS.ProcessEnv;
}): string | null => {
  if (
    input.template.lane_id === "live_translation" &&
    liveTranslationExternalBackendsEnabled(input.env) &&
    liveTranslationOpenAiCompatibleConfigured(input.env) &&
    input.backendProviders.some((provider) =>
      provider.provider_id === "live_translation.openai_compatible" &&
      provider.configuration_status === "configured" &&
      provider.permission_status === "admitted"
    )
  ) {
    return "live_translation.openai_compatible";
  }
  return input.template.default_backend_provider ?? input.backendProviders[0]?.provider_id ?? null;
};

const descriptorFor = (input: {
  template: HelixCapabilityLaneTemplate;
  provider: HelixAgentProvider;
  env: NodeJS.ProcessEnv;
}): HelixCapabilityLaneDescriptor => {
  const status = laneStatus(input);
  const backendProviders = backendProvidersFor({
    template: input.template,
    laneStatus: status,
    env: input.env,
  });
  const defaultBackendProvider = defaultBackendProviderFor({
    template: input.template,
    backendProviders,
    env: input.env,
  });
  const contracts = laneContractsFor(input.template);
  return {
    schema: "helix.capability_lane.descriptor.v1",
    lane_id: input.template.lane_id,
    family: input.template.family,
    label: input.template.label,
    description: input.template.description,
    status,
    status_reason: statusReason(status),
    shadow_only: true,
    backend_family: input.template.backend_family,
    model_or_service_ref: input.template.model_or_service_ref,
    backend_providers: backendProviders,
    default_backend_provider: defaultBackendProvider,
    ...contracts,
    capabilities: laneCapabilitiesFor(input.template),
    requestable_by_runtime_provider: status === "available" || status === "dry_run",
    result_authority: "observation_or_receipt_only",
    reentry_required: true,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
    safety_tags: input.template.safety_tags,
  };
};

export const listHelixCapabilityLanes = (input: {
  provider: HelixAgentProvider;
  env?: NodeJS.ProcessEnv;
}): HelixCapabilityLaneManifest => {
  const env = input.env ?? process.env;
  const lanes = laneTemplates.map((template: HelixCapabilityLaneTemplate) => descriptorFor({
    template,
    provider: input.provider,
    env,
  }));
  return {
    schema: "helix.capability_lane_manifest.v1",
    manifest_version: "2026-06-30.shadow.v1",
    selected_runtime_agent_provider: input.provider.id,
    policy_mode: "shadow",
    lanes,
    lane_ids: lanes.map((lane: HelixCapabilityLaneDescriptor) => lane.lane_id),
    backend_selection_policy: HELIX_LANE_BACKEND_SELECTION_POLICY,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

export const resolveHelixCapabilityLaneRequest = (input: {
  provider: HelixAgentProvider;
  requestedLane?: string | null;
  requestedBackendProvider?: string | null;
  env?: NodeJS.ProcessEnv;
}): HelixCapabilityLaneResolveTrace => {
  const requestedLane = typeof input.requestedLane === "string" && input.requestedLane.trim()
    ? input.requestedLane.trim()
    : null;
  const requestedBackendProvider =
    typeof input.requestedBackendProvider === "string" && input.requestedBackendProvider.trim()
      ? input.requestedBackendProvider.trim()
      : null;
  const manifest = listHelixCapabilityLanes({
    provider: input.provider,
    env: input.env,
  });
  const env = input.env ?? process.env;
  const lane = requestedLane && laneSet.has(requestedLane)
    ? manifest.lanes.find((candidate: HelixCapabilityLaneDescriptor) => candidate.lane_id === requestedLane)
    : undefined;

  if (!requestedLane || !lane) {
    const decision = buildBackendSelectionDecision({
      admitted: false,
      laneStatusReason: "blocked_unknown_or_missing_capability_lane",
      requestedBackendProvider,
      requestedBackend: null,
      selectedBackend: null,
    });
    return {
      schema: "helix.capability_lane_resolve_trace.v1",
      selected_runtime_agent_provider: input.provider.id,
      requested_lane: requestedLane,
      admission_status: "blocked",
      lane_status: "unknown",
      requested_backend_provider: requestedBackendProvider,
      requested_backend_provider_known: false,
      requested_backend_configuration_status: requestedBackendProvider ? "unknown" : null,
      requested_backend_availability_status: requestedBackendProvider ? "unknown" : null,
      requested_backend_permission_status: requestedBackendProvider ? "unknown" : null,
      requested_backend_cost_class: requestedBackendProvider ? "unknown" : null,
      requested_backend_latency_class: requestedBackendProvider ? "unknown" : null,
      requested_backend_privacy_class: requestedBackendProvider ? "unknown" : null,
      requested_backend_fallback_provider: null,
      selected_backend_provider: null,
      backend_selection_decision: decision,
      selection_reason: decision.reason,
      availability_status: "unknown",
      permission_status: "unknown",
      cost_class: "unknown",
      latency_class: "unknown",
      privacy_class: "unknown",
      fallback_backend_provider: null,
      resolved_backend_provider: null,
      resolved_model_or_service: null,
      result_ref: null,
      observation_ref: null,
      receipt_ref: null,
      terminal_policy: terminalPolicy,
      reentry_required: true,
      execution_status: "not_executed_shadow_only",
      blocked_reason: requestedLane ? "unknown_capability_lane" : "missing_capability_lane",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }

  const admitted = lane.requestable_by_runtime_provider;
  const requestedBackend = requestedBackendProvider
    ? lane.backend_providers.find((candidate) =>
      candidate.provider_id === requestedBackendProvider ||
      candidate.backend_family === requestedBackendProvider
    ) ?? null
    : null;
  const defaultBackend = lane.default_backend_provider
    ? lane.backend_providers.find((candidate) => candidate.provider_id === lane.default_backend_provider) ?? null
    : null;
  const selectedBackend = admitted
    ? canSelectRequestedLiveBackend({ lane, requestedBackend, env })
      ? requestedBackend
      : defaultBackend ?? lane.backend_providers[0] ?? null
    : null;
  const backendSelectionDecision = buildBackendSelectionDecision({
    admitted,
    laneStatusReason: lane.status_reason,
    requestedBackendProvider,
    requestedBackend,
    selectedBackend,
    liveBackendExecutionEnabled: selectedBackend
      ? liveBackendExecutionEnabledFor({ lane, selectedBackend, env })
      : false,
  });
  return {
    schema: "helix.capability_lane_resolve_trace.v1",
    selected_runtime_agent_provider: input.provider.id,
    requested_lane: lane.lane_id,
    admission_status: admitted ? "admitted_shadow_only" : "blocked",
    lane_status: lane.status,
    requested_backend_provider: requestedBackendProvider,
    requested_backend_provider_known: requestedBackendProvider ? Boolean(requestedBackend) : false,
    requested_backend_configuration_status:
      requestedBackendProvider ? requestedBackend?.configuration_status ?? "unknown" : null,
    requested_backend_availability_status:
      requestedBackendProvider ? requestedBackend?.availability_status ?? "unknown" : null,
    requested_backend_permission_status:
      requestedBackendProvider ? requestedBackend?.permission_status ?? "unknown" : null,
    requested_backend_cost_class:
      requestedBackendProvider ? requestedBackend?.cost_class ?? "unknown" : null,
    requested_backend_latency_class:
      requestedBackendProvider ? requestedBackend?.latency_class ?? "unknown" : null,
    requested_backend_privacy_class:
      requestedBackendProvider ? requestedBackend?.privacy_class ?? "unknown" : null,
    requested_backend_fallback_provider: requestedBackend?.fallback_backend_provider ?? null,
    selected_backend_provider: selectedBackend?.provider_id ?? null,
    backend_selection_decision: backendSelectionDecision,
    selection_reason: backendSelectionDecision.reason,
    availability_status: selectedBackend?.availability_status ?? lane.status,
    permission_status: selectedBackend?.permission_status ?? backendPermissionStatus(lane.status),
    cost_class: selectedBackend?.cost_class ?? "unknown",
    latency_class: selectedBackend?.latency_class ?? "unknown",
    privacy_class: selectedBackend?.privacy_class ?? "unknown",
    fallback_backend_provider: selectedBackend?.fallback_backend_provider ?? null,
    resolved_backend_provider: admitted ? selectedBackend?.backend_family ?? lane.backend_family : null,
    resolved_model_or_service: admitted ? selectedBackend?.model_or_service_ref ?? lane.model_or_service_ref : null,
    result_ref: null,
    observation_ref: null,
    receipt_ref: null,
    terminal_policy: lane.terminal_policy,
    reentry_required: true,
    execution_status: "not_executed_shadow_only",
    blocked_reason: admitted ? null : lane.status_reason,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};
