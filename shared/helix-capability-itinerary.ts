import type { HelixToolCallAdmissionFamily } from "./helix-tool-call-admission";

export const HELIX_CAPABILITY_ITINERARY_SCHEMA =
  "helix.capability_itinerary.v1" as const;

export type HelixCapabilityItineraryFamily =
  | HelixToolCallAdmissionFamily
  | "theory_locator";

export type HelixCapabilityItineraryStepStatus =
  | "admitted"
  | "planned"
  | "missing"
  | "forbidden"
  | "not_required";

export type HelixCapabilityItineraryExecutionGroup =
  | "preflight"
  | "evidence"
  | "locator"
  | "synthesis";

export type HelixCapabilityItineraryStep = {
  step_id: string;
  tool_family: HelixCapabilityItineraryFamily;
  capability_hint: string | null;
  purpose: string;
  execution_group: HelixCapabilityItineraryExecutionGroup;
  required_observation_kinds: string[];
  status: HelixCapabilityItineraryStepStatus;
  reason: string;
};

export type HelixCapabilityItineraryReasoningCriterion = {
  criterion_id: string;
  description: string;
  required_observation_families: HelixCapabilityItineraryFamily[];
};

export type HelixCapabilityItinerary = {
  schema: typeof HELIX_CAPABILITY_ITINERARY_SCHEMA;
  turn_id: string;
  planning_stage: "pre_execution";
  prompt_shape: "single_tool" | "compound_tool" | "model_only";
  relevant_tool_families: HelixCapabilityItineraryFamily[];
  admitted_tool_families: HelixCapabilityItineraryFamily[];
  forbidden_tool_families: HelixCapabilityItineraryFamily[];
  missing_tool_families: HelixCapabilityItineraryFamily[];
  planned_steps: HelixCapabilityItineraryStep[];
  reasoning_criteria: HelixCapabilityItineraryReasoningCriterion[];
  terminal_success_criteria: {
    required_observation_families: HelixCapabilityItineraryFamily[];
    allowed_terminal_artifact_kinds: string[];
    requires_post_observation_synthesis: boolean;
    typed_failure_codes: string[];
  };
  authority: "planning_only";
  not_terminal: true;
  assistant_answer: false;
  raw_content_included: false;
};
