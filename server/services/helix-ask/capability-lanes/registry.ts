import type {
  HelixCapabilityLaneBackendFamily,
  HelixCapabilityLaneDescriptor,
  HelixCapabilityLaneId,
  HelixCapabilityLaneManifest,
  HelixCapabilityLaneResolveTrace,
} from "@shared/helix-capability-lane";
import {
  HELIX_CAPABILITY_LANE_IDS,
} from "@shared/helix-capability-lane";
import type { HelixAgentProvider } from "../agent-providers/types";

type LaneTemplate = {
  lane_id: HelixCapabilityLaneId;
  family: HelixCapabilityLaneDescriptor["family"];
  label: string;
  description: string;
  backend_family: HelixCapabilityLaneBackendFamily;
  model_or_service_ref: string | null;
  safety_tags: string[];
  configured(env: NodeJS.ProcessEnv): boolean;
};

const readBooleanEnv = (
  value: string | undefined,
  defaultValue: boolean,
): boolean => {
  if (value === undefined) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return defaultValue;
  if (["0", "false", "no", "off", "disabled"].includes(normalized)) return false;
  if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true;
  return defaultValue;
};

const hasAny = (env: NodeJS.ProcessEnv, names: string[]): boolean =>
  names.some((name: string) => typeof env[name] === "string" && Boolean(env[name]?.trim()));

const textConfigured = (env: NodeJS.ProcessEnv): boolean =>
  hasAny(env, ["OPENAI_API_KEY", "LLM_HTTP_BASE", "LLM_HTTP_MODEL"]);

const laneTemplates: LaneTemplate[] = [
  {
    lane_id: "utility_text",
    family: "text_inference",
    label: "Utility text",
    description: "Small classification, extraction, normalization, and compact summary calls.",
    backend_family: "openai_compatible",
    model_or_service_ref: "utility_text_default",
    safety_tags: ["shadow_only", "no_raw_model_id", "observation_only"],
    configured: textConfigured,
  },
  {
    lane_id: "interactive_text",
    family: "text_inference",
    label: "Interactive text",
    description: "Low-latency conversational and tool-backed text inference.",
    backend_family: "openai_compatible",
    model_or_service_ref: "interactive_text_default",
    safety_tags: ["shadow_only", "no_raw_model_id", "observation_only"],
    configured: textConfigured,
  },
  {
    lane_id: "deliberate_text",
    family: "text_inference",
    label: "Deliberate text",
    description: "Higher-effort synthesis, planning, and final consistency review.",
    backend_family: "openai_compatible",
    model_or_service_ref: "deliberate_text_default",
    safety_tags: ["shadow_only", "no_raw_model_id", "observation_only"],
    configured: textConfigured,
  },
  {
    lane_id: "code_text",
    family: "code_inference",
    label: "Code text",
    description: "Code-oriented reasoning or review as text; no filesystem mutation authority.",
    backend_family: "openai_compatible",
    model_or_service_ref: "code_text_default",
    safety_tags: ["shadow_only", "no_code_mutation", "observation_only"],
    configured: textConfigured,
  },
  {
    lane_id: "speech_to_text",
    family: "speech_to_text",
    label: "Speech to text",
    description: "Audio transcription lane for future governed speech observations.",
    backend_family: "openai_compatible",
    model_or_service_ref: "speech_to_text_default",
    safety_tags: ["shadow_only", "audio", "observation_only"],
    configured: (env) => hasAny(env, ["OPENAI_API_KEY", "STT_API_KEY"]),
  },
  {
    lane_id: "text_to_speech",
    family: "text_to_speech",
    label: "Text to speech",
    description: "Narration and callout audio generation as non-terminal receipts/artifacts.",
    backend_family: "elevenlabs",
    model_or_service_ref: "text_to_speech_default",
    safety_tags: ["shadow_only", "audio", "receipt_only"],
    configured: (env) => hasAny(env, ["ELEVENLABS_API_KEY"]),
  },
  {
    lane_id: "live_translation",
    family: "live_translation",
    label: "Live translation",
    description: "Low-latency translation service lane for future transcript/audio observations.",
    backend_family: "google_gemini",
    model_or_service_ref: "live_translation_default",
    safety_tags: ["shadow_only", "audio", "translation", "observation_only"],
    configured: (env) => hasAny(env, ["GOOGLE_GEMINI_API_KEY", "GEMINI_API_KEY"]),
  },
  {
    lane_id: "visual_analysis",
    family: "visual_analysis",
    label: "Visual analysis",
    description: "Image or screen analysis lane for future governed visual observations.",
    backend_family: "openai_compatible",
    model_or_service_ref: "visual_analysis_default",
    safety_tags: ["shadow_only", "visual", "observation_only"],
    configured: textConfigured,
  },
  {
    lane_id: "workstation_tool_reference",
    family: "workstation_tool_reference",
    label: "Workstation tool reference",
    description: "Reference lane for the existing workstation gateway catalog; no tool migration occurs here.",
    backend_family: "helix_workstation_gateway",
    model_or_service_ref: "workstation_gateway_existing",
    safety_tags: ["existing_gateway_reference", "no_lane_reroute", "observation_or_receipt_only"],
    configured: () => true,
  },
];

const laneSet = new Set<string>(HELIX_CAPABILITY_LANE_IDS);

const laneEnabled = (
  laneId: HelixCapabilityLaneId,
  env: NodeJS.ProcessEnv,
): boolean =>
  readBooleanEnv(env.HELIX_CAPABILITY_LANES_ENABLED, true) &&
  readBooleanEnv(env[`HELIX_CAPABILITY_LANE_${laneId.toUpperCase()}_ENABLED`], true);

const laneStatus = (input: {
  template: LaneTemplate;
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

const descriptorFor = (input: {
  template: LaneTemplate;
  provider: HelixAgentProvider;
  env: NodeJS.ProcessEnv;
}): HelixCapabilityLaneDescriptor => {
  const status = laneStatus(input);
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
  const lanes = laneTemplates.map((template: LaneTemplate) => descriptorFor({
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
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

export const resolveHelixCapabilityLaneRequest = (input: {
  provider: HelixAgentProvider;
  requestedLane?: string | null;
  env?: NodeJS.ProcessEnv;
}): HelixCapabilityLaneResolveTrace => {
  const requestedLane = typeof input.requestedLane === "string" && input.requestedLane.trim()
    ? input.requestedLane.trim()
    : null;
  const manifest = listHelixCapabilityLanes({
    provider: input.provider,
    env: input.env,
  });
  const lane = requestedLane && laneSet.has(requestedLane)
    ? manifest.lanes.find((candidate: HelixCapabilityLaneDescriptor) => candidate.lane_id === requestedLane)
    : undefined;

  if (!requestedLane || !lane) {
    return {
      schema: "helix.capability_lane_resolve_trace.v1",
      selected_runtime_agent_provider: input.provider.id,
      requested_lane: requestedLane,
      admission_status: "blocked",
      lane_status: "unknown",
      resolved_backend_provider: null,
      resolved_model_or_service: null,
      result_ref: null,
      reentry_required: true,
      execution_status: "not_executed_shadow_only",
      blocked_reason: requestedLane ? "unknown_capability_lane" : "missing_capability_lane",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }

  const admitted = lane.requestable_by_runtime_provider;
  return {
    schema: "helix.capability_lane_resolve_trace.v1",
    selected_runtime_agent_provider: input.provider.id,
    requested_lane: lane.lane_id,
    admission_status: admitted ? "admitted_shadow_only" : "blocked",
    lane_status: lane.status,
    resolved_backend_provider: admitted ? lane.backend_family : null,
    resolved_model_or_service: admitted ? lane.model_or_service_ref : null,
    result_ref: null,
    reentry_required: true,
    execution_status: "not_executed_shadow_only",
    blocked_reason: admitted ? null : lane.status_reason,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};
