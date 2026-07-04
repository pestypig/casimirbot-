import type { HelixAgentRuntimeId } from "./helix-agent-runtime";
import type { HelixAgentStepObservationPacket } from "./helix-agent-step-observation-packet";
import type {
  HelixCapabilityLaneBackendSelectionDecision,
  HelixCapabilityLaneResolveTrace,
} from "./helix-capability-lane";
import type { HelixVisibleTranslationTargetBatch } from "./helix-live-translation-lane";

export const HELIX_WORKSTATION_TOOL_REFERENCE_LIST_REQUEST_SCHEMA =
  "helix.workstation_tool_reference.list_request.v1" as const;
export const HELIX_WORKSTATION_TOOL_REFERENCE_LIST_OBSERVATION_SCHEMA =
  "helix.workstation_tool_reference.list_observation.v1" as const;
export const HELIX_WORKSTATION_TOOL_REFERENCE_LIST_RESULT_SCHEMA =
  "helix.workstation_tool_reference.list_result.v1" as const;
export const HELIX_WORKSTATION_TOOL_REFERENCE_VISIBLE_TRANSLATION_TARGETS_REQUEST_SCHEMA =
  "helix.workstation_tool_reference.visible_translation_targets_request.v1" as const;
export const HELIX_WORKSTATION_TOOL_REFERENCE_VISIBLE_TRANSLATION_TARGETS_OBSERVATION_SCHEMA =
  "helix.workstation_tool_reference.visible_translation_targets_observation.v1" as const;
export const HELIX_WORKSTATION_TOOL_REFERENCE_VISIBLE_TRANSLATION_TARGETS_RESULT_SCHEMA =
  "helix.workstation_tool_reference.visible_translation_targets_result.v1" as const;

export type HelixWorkstationToolReferenceMode =
  | "read"
  | "observe"
  | "act"
  | "verify";

export type HelixWorkstationToolReferenceCapabilitySummary = {
  capability_id: string;
  label: string;
  panel_id: string | null;
  action_id: string;
  mode: HelixWorkstationToolReferenceMode;
  permission_profile_required: "observe" | "read" | "act" | "write" | "danger";
  requires_confirmation: boolean;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixWorkstationToolReferenceListRequest = {
  schema: typeof HELIX_WORKSTATION_TOOL_REFERENCE_LIST_REQUEST_SCHEMA;
  capability: "workstation_tool_reference.list_capabilities";
  mode?: HelixWorkstationToolReferenceMode | null;
  requested_backend_provider?: string | null;
  turn_id?: string | null;
  assistant_answer: false;
  terminal_eligible: false;
};

export type HelixWorkstationToolReferenceListObservation = {
  schema: typeof HELIX_WORKSTATION_TOOL_REFERENCE_LIST_OBSERVATION_SCHEMA;
  observation_id: string;
  observation_ref: string;
  lane_id: "workstation_tool_reference";
  capability: "workstation_tool_reference.list_capabilities";
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  requested_backend_provider: string | null;
  selected_backend_provider: string | null;
  selection_reason: string;
  backend_selection_decision: HelixCapabilityLaneBackendSelectionDecision;
  gateway_manifest_version: string;
  gateway_mode: HelixWorkstationToolReferenceMode;
  capability_count: number;
  capability_ids: string[];
  capabilities: HelixWorkstationToolReferenceCapabilitySummary[];
  deterministic: true;
  reentry_required: true;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixWorkstationToolReferenceListResult = {
  schema: typeof HELIX_WORKSTATION_TOOL_REFERENCE_LIST_RESULT_SCHEMA;
  ok: boolean;
  lane_id: "workstation_tool_reference";
  capability: "workstation_tool_reference.list_capabilities";
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  lane_resolve_trace: HelixCapabilityLaneResolveTrace;
  observation: HelixWorkstationToolReferenceListObservation | null;
  observation_packet: HelixAgentStepObservationPacket;
  artifact_refs: string[];
  capability_count?: number;
  error?: string;
  reentry_required: true;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixWorkstationToolReferenceVisibleTranslationTargetsRequest = {
  schema: typeof HELIX_WORKSTATION_TOOL_REFERENCE_VISIBLE_TRANSLATION_TARGETS_REQUEST_SCHEMA;
  capability: "workstation_tool_reference.collect_visible_translation_targets";
  active_panel_id?: string | null;
  doc_path?: string | null;
  projection_target?: string | null;
  account_locale?: string | null;
  target_language?: string | null;
  max_chunks?: number | null;
  visible_only?: boolean | null;
  visible_text?: string | null;
  title_text?: string | null;
  body_text?: string | null;
  visible_text_chunks?: Array<Record<string, unknown>> | null;
  requested_backend_provider?: string | null;
  turn_id?: string | null;
  assistant_answer: false;
  terminal_eligible: false;
};

export type HelixWorkstationToolReferenceVisibleTranslationTargetsObservation = {
  schema: typeof HELIX_WORKSTATION_TOOL_REFERENCE_VISIBLE_TRANSLATION_TARGETS_OBSERVATION_SCHEMA;
  observation_id: string;
  observation_ref: string;
  lane_id: "workstation_tool_reference";
  capability: "workstation_tool_reference.collect_visible_translation_targets";
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  requested_backend_provider: string | null;
  selected_backend_provider: string | null;
  selection_reason: string;
  backend_selection_decision: HelixCapabilityLaneBackendSelectionDecision;
  target_batch: HelixVisibleTranslationTargetBatch;
  deterministic: true;
  reentry_required: true;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixWorkstationToolReferenceVisibleTranslationTargetsResult = {
  schema: typeof HELIX_WORKSTATION_TOOL_REFERENCE_VISIBLE_TRANSLATION_TARGETS_RESULT_SCHEMA;
  ok: boolean;
  lane_id: "workstation_tool_reference";
  capability: "workstation_tool_reference.collect_visible_translation_targets";
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  lane_resolve_trace: HelixCapabilityLaneResolveTrace;
  observation: HelixWorkstationToolReferenceVisibleTranslationTargetsObservation | null;
  observation_packet: HelixAgentStepObservationPacket;
  artifact_refs: string[];
  target_count?: number;
  error?: string;
  reentry_required: true;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};
