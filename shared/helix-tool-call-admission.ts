export const HELIX_TOOL_CALL_ADMISSION_DECISION_SCHEMA =
  "helix.tool_call_admission_decision.v1" as const;

export type HelixToolCallAdmissionFamily =
  | "situation_run"
  | "procedure_memory"
  | "visual_scene_memory"
  | "docs_viewer"
  | "workspace_directory"
  | "repo_code"
  | "scholarly_research"
  | "internet_search"
  | "theory_locator"
  | "runtime_evidence"
  | "context_reflection"
  | "workspace_diagnostic"
  | "live_environment"
  | "live_pipeline"
  | "process_graph"
  | "world_event"
  | "calculator"
  | "notes"
  | "workstation_action"
  | "model_only";

export type HelixToolCallAdmissionMode =
  | "direct"
  | "unknown_source_discovery";

export type HelixToolCallAdmissionRouteArbitration = {
  schema: "helix.tool_call_admission_route_arbitration.v1";
  guard_version: "E80" | "E82";
  original_source_target: string;
  effective_source_target: string;
  canonical_goal_kind: string | null;
  mandatory_next_tool_name: string | null;
  mandatory_capability_family: HelixToolCallAdmissionFamily | null;
  mandatory_capability_admitted: boolean;
  admitted_tool_families_before_mandatory_override: HelixToolCallAdmissionFamily[];
  admitted_tool_families_after_mandatory_override: HelixToolCallAdmissionFamily[];
  calculator_goal_overrode_repo_source_target: boolean;
  repo_code_preserved_as_secondary_context: boolean;
  requested_capability?: string | null;
  requested_capability_family?: HelixToolCallAdmissionFamily | string | null;
  requested_capability_source?: string | null;
  requested_capability_confidence?: number | null;
  required_observation_kinds_for_requested_capability?: string[];
  explicit_capability_overrode_source_target?: boolean;
  secondary_source_targets: string[];
  tool_admission_reason: string;
  tool_admission_dominance_reason: string | null;
  selected_capability: string | null;
  runtime_capability_rejection_reason: string | null;
  first_broken_rail: "capability_execution" | null;
  repair_target: "tool_admission" | null;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixToolCallAdmissionDecision = {
  schema: typeof HELIX_TOOL_CALL_ADMISSION_DECISION_SCHEMA;
  turn_id: string;
  source_target: string;
  admission_mode?: HelixToolCallAdmissionMode;
  discovery_policy?: {
    state: "bounded_readonly";
    first_pass_tool_families: HelixToolCallAdmissionFamily[];
    forbidden_external_tool_families: HelixToolCallAdmissionFamily[];
    on_not_found: "ask_or_explain_searched_scope";
  };
  required: boolean;
  admitted_tool_families: HelixToolCallAdmissionFamily[];
  forbidden_terminal_artifact_kinds: string[];
  forbidden_routes: string[];
  forbidden_tools?: string[];
  forbidden_tool_families?: string[];
  operational_constraints_ref?: string;
  required_surface?: string | null;
  reason: string;
  route_arbitration_guard_version?: "E80" | "E82";
  original_source_target?: string;
  effective_source_target?: string;
  canonical_goal_kind?: string | null;
  mandatory_next_tool_name?: string | null;
  mandatory_capability_family?: HelixToolCallAdmissionFamily | null;
  mandatory_capability_admitted?: boolean;
  admitted_tool_families_before_mandatory_override?: HelixToolCallAdmissionFamily[];
  admitted_tool_families_after_mandatory_override?: HelixToolCallAdmissionFamily[];
  calculator_goal_overrode_repo_source_target?: boolean;
  repo_code_preserved_as_secondary_context?: boolean;
  capability_contract_guard_version?: "E82";
  requested_capability?: string | null;
  requested_capability_family?: HelixToolCallAdmissionFamily | string | null;
  requested_capability_source?: string | null;
  requested_capability_confidence?: number | null;
  required_observation_kinds_for_requested_capability?: string[];
  explicit_capability_overrode_source_target?: boolean;
  secondary_source_targets?: string[];
  tool_admission_reason?: string;
  tool_admission_dominance_reason?: string | null;
  selected_capability?: string | null;
  executed_capability?: string | null;
  runtime_capability_rejection_reason?: string | null;
  first_broken_rail?: "capability_execution" | null;
  repair_target?: "tool_admission" | null;
  route_arbitration?: HelixToolCallAdmissionRouteArbitration;
  tool_admission_suppressed?: boolean;
  suppression_reason?: string;
  assistant_answer: false;
  raw_content_included: false;
};
