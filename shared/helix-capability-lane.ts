import type { HelixAgentRuntimeId } from "./helix-agent-runtime";

export const HELIX_CAPABILITY_LANE_IDS = [
  "utility_text",
  "interactive_text",
  "deliberate_text",
  "code_text",
  "speech_to_text",
  "text_to_speech",
  "live_translation",
  "visual_analysis",
  "workstation_tool_reference",
] as const;

export type HelixCapabilityLaneId = (typeof HELIX_CAPABILITY_LANE_IDS)[number];

export type HelixCapabilityLaneFamily =
  | "text_inference"
  | "code_inference"
  | "speech_to_text"
  | "text_to_speech"
  | "live_translation"
  | "visual_analysis"
  | "workstation_tool_reference";

export type HelixCapabilityLaneStatus =
  | "available"
  | "unconfigured"
  | "permission_blocked"
  | "dry_run"
  | "disabled";

export type HelixCapabilityLaneBackendFamily =
  | "openai_compatible"
  | "google_gemini"
  | "elevenlabs"
  | "local_runtime"
  | "helix_workstation_gateway"
  | "none";

export type HelixCapabilityLaneDescriptor = {
  schema: "helix.capability_lane.descriptor.v1";
  lane_id: HelixCapabilityLaneId;
  family: HelixCapabilityLaneFamily;
  label: string;
  description: string;
  status: HelixCapabilityLaneStatus;
  status_reason: string;
  shadow_only: true;
  backend_family: HelixCapabilityLaneBackendFamily;
  model_or_service_ref: string | null;
  requestable_by_runtime_provider: boolean;
  result_authority: "observation_or_receipt_only";
  reentry_required: true;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
  safety_tags: string[];
};

export type HelixCapabilityLaneManifest = {
  schema: "helix.capability_lane_manifest.v1";
  manifest_version: "2026-06-30.shadow.v1";
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  policy_mode: "shadow";
  lanes: HelixCapabilityLaneDescriptor[];
  lane_ids: HelixCapabilityLaneId[];
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneResolveTrace = {
  schema: "helix.capability_lane_resolve_trace.v1";
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  requested_lane: HelixCapabilityLaneId | string | null;
  admission_status: "admitted_shadow_only" | "blocked";
  lane_status: HelixCapabilityLaneStatus | "unknown";
  resolved_backend_provider: HelixCapabilityLaneBackendFamily | null;
  resolved_model_or_service: string | null;
  result_ref: null;
  reentry_required: true;
  execution_status: "not_executed_shadow_only";
  blocked_reason: string | null;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};
