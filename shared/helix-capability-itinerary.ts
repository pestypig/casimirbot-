import type { HelixToolCallAdmissionFamily } from "./helix-tool-call-admission";

export const HELIX_CAPABILITY_ITINERARY_SCHEMA =
  "helix.capability_itinerary.v1" as const;

export type HelixCapabilityItineraryFamily =
  | HelixToolCallAdmissionFamily
  | "visual_capture"
  | "live_source_mail"
  | "live_source_decision"
  | "voice_delivery"
  | "zen_graph_reflection"
  | "civilization_bounds"
  | "workstation";

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
  requested_capability?: string | null;
  runtime_capability?: string | null;
  compound_subgoal_id?: string | null;
  args_hint?: Record<string, unknown>;
  purpose: string;
  execution_group: HelixCapabilityItineraryExecutionGroup;
  required_observation_kinds: string[];
  contribution_role?: string | null;
  terminal_contribution_kind?: string | null;
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
    required_capabilities?: string[];
    allowed_terminal_artifact_kinds: string[];
    forbidden_terminal_artifact_kinds?: string[];
    compound_terminal_policy?: string;
    requires_post_observation_synthesis: boolean;
    typed_failure_codes: string[];
  };
  compound_capability_contract?: Record<string, unknown>;
  execution_state?: {
    required_observation_families: HelixCapabilityItineraryFamily[];
    required_observation_kinds?: string[];
    required_capabilities?: string[];
    admitted_tool_families: HelixCapabilityItineraryFamily[];
    observed_families: HelixCapabilityItineraryFamily[];
    missing_observation_families: HelixCapabilityItineraryFamily[];
    missing_required_observation_kinds?: string[];
    next_missing_required_observation_kind?: string | null;
    missing_compound_subgoal_ids?: string[];
    missing_required_capabilities?: string[];
    compound_subgoal_ledger?: Array<Record<string, unknown>>;
    next_missing_subgoal_id?: string | null;
    complete: boolean;
  };
  authority: "planning_only";
  not_terminal: true;
  assistant_answer: false;
  raw_content_included: false;
};
