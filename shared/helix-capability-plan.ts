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
  | "process_graph"
  | "debug_export"
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
  mutating: boolean;

  operator_command_required: boolean;
  operator_command_present: boolean;

  source_target: string;
  goal_kind: string;
  required_terminal_kind: string | null;

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
