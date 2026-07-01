import type { HelixAgentRuntimeId } from "./helix-agent-runtime";
import type { HelixAgentStepObservationPacket } from "./helix-agent-step-observation-packet";
import type {
  HelixCapabilityLaneBackendSelectionDecision,
  HelixCapabilityLaneResolveTrace,
} from "./helix-capability-lane";

export const HELIX_UTILITY_TEXT_NORMALIZE_REQUEST_SCHEMA =
  "helix.utility_text.normalize_request.v1" as const;
export const HELIX_UTILITY_TEXT_NORMALIZE_OBSERVATION_SCHEMA =
  "helix.utility_text.normalize_observation.v1" as const;
export const HELIX_UTILITY_TEXT_NORMALIZE_RESULT_SCHEMA =
  "helix.utility_text.normalize_result.v1" as const;

export type HelixUtilityTextNormalizeMode =
  | "compact_whitespace"
  | "lowercase"
  | "trim"
  | "sentence_case";

export type HelixUtilityTextNormalizeRequest = {
  schema: typeof HELIX_UTILITY_TEXT_NORMALIZE_REQUEST_SCHEMA;
  capability: "utility_text.normalize_text";
  text: string;
  normalization_mode?: HelixUtilityTextNormalizeMode | null;
  requested_backend_provider?: string | null;
  turn_id?: string | null;
  assistant_answer: false;
  terminal_eligible: false;
};

export type HelixUtilityTextNormalizeObservation = {
  schema: typeof HELIX_UTILITY_TEXT_NORMALIZE_OBSERVATION_SCHEMA;
  observation_id: string;
  observation_ref: string;
  lane_id: "utility_text";
  capability: "utility_text.normalize_text";
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  requested_backend_provider: string | null;
  selected_backend_provider: string | null;
  selection_reason: string;
  backend_selection_decision: HelixCapabilityLaneBackendSelectionDecision;
  normalization_mode: HelixUtilityTextNormalizeMode;
  source_text_hash: string;
  source_text_char_count: number;
  normalized_text: string;
  deterministic: true;
  reentry_required: true;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixUtilityTextNormalizeResult = {
  schema: typeof HELIX_UTILITY_TEXT_NORMALIZE_RESULT_SCHEMA;
  ok: boolean;
  lane_id: "utility_text";
  capability: "utility_text.normalize_text";
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  lane_resolve_trace: HelixCapabilityLaneResolveTrace;
  observation: HelixUtilityTextNormalizeObservation | null;
  observation_packet: HelixAgentStepObservationPacket;
  artifact_refs: string[];
  normalized_text?: string;
  error?: string;
  reentry_required: true;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};
