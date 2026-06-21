export const HELIX_ROUTE_PRODUCT_CONTRACT_SCHEMA =
  "helix.route_product_contract.v1" as const;

export type HelixRouteProductSourceTarget =
  | "visual_capture"
  | "active_doc"
  | "docs_viewer"
  | "audio_transcript"
  | "active_note"
  | "calculator_stream"
  | "repo_code"
  | "scholarly_research"
  | "internet_search"
  | "runtime_evidence"
  | "workspace_directory"
  | "workspace_diagnostic"
  | "theory_locator"
  | "context_reflection"
  | "live_pipeline"
  | "live_environment"
  | "live_source_mailbox"
  | "situation_epoch"
  | "visual_scene_memory"
  | "process_graph"
  | "workstation_state"
  | "workstation_panel"
  | "general_background"
  | "procedure_memory"
  | "conversation_memory"
  | "world_event"
  | "workspace_action"
  | "model_only"
  | "unknown";

export type HelixRouteProductContract = {
  schema: typeof HELIX_ROUTE_PRODUCT_CONTRACT_SCHEMA;
  turn_id: string;
  thread_id: string;
  source_target: HelixRouteProductSourceTarget;
  allowed_terminal_artifact_kinds: string[];
  forbidden_terminal_artifact_kinds: string[];
  side_artifact_kinds_allowed?: string[];
  required_artifact_refs: string[];
  precedence_reason: string;
  assistant_answer: false;
  raw_content_included: false;
};
