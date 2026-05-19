export const HELIX_ASK_SOURCE_TARGET_INTENT_SCHEMA =
  "helix.ask_source_target_intent.v1" as const;

export type HelixAskSourceTarget =
  | "visual_capture"
  | "world_event"
  | "docs_viewer"
  | "active_doc"
  | "active_note"
  | "repo_code"
  | "live_pipeline"
  | "situation_epoch"
  | "process_graph"
  | "workstation_state"
  | "workstation_panel"
  | "general_background"
  | "workspace_panel"
  | "procedure_memory"
  | "model_only"
  | "unknown";

export type HelixAskSourceTargetStrength = "none" | "soft" | "hard";

export type HelixAskSourceTargetRequestedOutput =
  | "current_visual_state"
  | "field_evaluation_refs"
  | "interpretation_refs"
  | "procedure_epoch_replay"
  | "repo_code"
  | "file_path"
  | "line_backed_source"
  | "implementation_location"
  | "route_trace"
  | "tool_call_eligibility"
  | "terminal_contract"
  | "codex_comparison"
  | "live_pipeline_receipt"
  | "process_overview"
  | "visual_scene_query_intent"
  | "selected_visual_scene_set"
  | "visual_scene_comparison_result"
  | "typed_failure";

export type HelixAskSourceTargetIntent = {
  schema: typeof HELIX_ASK_SOURCE_TARGET_INTENT_SCHEMA;
  turn_id: string;
  thread_id: string;
  target_source: HelixAskSourceTarget;
  target_kind: HelixAskSourceTarget;
  strength: HelixAskSourceTargetStrength;
  explicit_cues: string[];
  reasons: string[];
  requested_outputs: HelixAskSourceTargetRequestedOutput[];
  suppressed_routes: string[];
  precedence_reason: string;
  must_enter_backend_ask: boolean;
  allow_client_shortcut: boolean;
  allow_no_tool_direct: boolean;
  confidence: number;
  assistant_answer: false;
  raw_content_included: false;
};
