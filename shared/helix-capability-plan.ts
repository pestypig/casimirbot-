export const HELIX_CAPABILITY_PLAN_SCHEMA = "helix.capability_plan.v1" as const;

export type HelixCapabilityFamily =
  | "docs"
  | "workspace_directory"
  | "workstation_action"
  | "live_source"
  | "live_environment"
  | "visual_capture"
  | "procedure_memory"
  | "repo_evidence"
  | "scholarly_research"
  | "internet_search"
  | "theory_locator"
  | "process_graph"
  | "debug_export"
  | "context_reflection"
  | "zen_graph_reflection"
  | "civilization_bounds"
  | "capability_catalog"
  | "workspace_diagnostic"
  | "subagent_runtime_adapter";

export type HelixCapabilityAdmissionStatus =
  | "admitted"
  | "rejected"
  | "needs_evidence"
  | "needs_user_confirmation";

export type HelixCapabilityPlan = {
  schema: typeof HELIX_CAPABILITY_PLAN_SCHEMA;
  turn_id: string;

  capability_family: HelixCapabilityFamily;
  requested_action: string;
  requested_capability?: string | null;
  requested_capability_source?: string | null;
  requested_capability_contract_ref?: string | null;
  requested_selected_match?: boolean;
  mutating: boolean;

  operator_command_required: boolean;
  operator_command_present: boolean;

  source_target: string;
  goal_kind: string;
  required_terminal_kind: string | null;
  required_next_action?: string | null;
  required_observation_kinds?: string[];
  required_outputs?: string[];
  capability_contract_arbitration?: Record<string, unknown>;
  compound_capability_contract?: Record<string, unknown>;
  compound_requested_capabilities?: string[];
  compound_required_observation_kinds?: string[];

  admission_status: HelixCapabilityAdmissionStatus;
  rejection_reason?: string;
  selected_capability?: string | null;
  phase_repaired?: boolean;
  phase_violation_reason?: string;
  phase_constraint?: {
    phase?: string | null;
    allowed_tools: string[];
    forbidden_tools: string[];
    selected_before_repair?: string | null;
    selected_after_repair?: string | null;
  };
  tool_admission_suppressed?: boolean;
  suppression_reason?: string;

  assistant_answer: false;
  raw_content_included: false;
};
