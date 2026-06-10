export const HELIX_TOOL_CALL_ADMISSION_DECISION_SCHEMA =
  "helix.tool_call_admission_decision.v1" as const;

export type HelixToolCallAdmissionFamily =
  | "situation_run"
  | "procedure_memory"
  | "visual_scene_memory"
  | "docs_viewer"
  | "repo_code"
  | "scholarly_research"
  | "internet_search"
  | "runtime_evidence"
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
  tool_admission_suppressed?: boolean;
  suppression_reason?: string;
  assistant_answer: false;
  raw_content_included: false;
};
