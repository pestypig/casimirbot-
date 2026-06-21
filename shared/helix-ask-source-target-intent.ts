export const HELIX_ASK_SOURCE_TARGET_INTENT_SCHEMA =
  "helix.ask_source_target_intent.v1" as const;

export type HelixAskSourceTarget =
  | "visual_capture"
  | "world_event"
  | "docs_viewer"
  | "audio_transcript"
  | "active_doc"
  | "active_note"
  | "calculator_stream"
  | "repo_code"
  | "scholarly_research"
  | "internet_search"
  | "runtime_evidence"
  | "workspace_directory"
  | "theory_locator"
  | "context_reflection"
  | "workspace_diagnostic"
  | "live_pipeline"
  | "live_environment"
  | "live_source_mailbox"
  | "situation_epoch"
  | "visual_scene_memory"
  | "process_graph"
  | "workstation_state"
  | "workstation_panel"
  | "general_background"
  | "workspace_panel"
  | "procedure_memory"
  | "conversation_memory"
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
  | "scholarly_paper_refs"
  | "doi_metadata"
  | "citation_graph"
  | "scholarly_full_text"
  | "web_search_results"
  | "web_page_snippets"
  | "source_links"
  | "workspace_os_status"
  | "paper_pdf_pages"
  | "route_trace"
  | "tool_call_eligibility"
  | "terminal_contract"
  | "workspace_directory_resolution"
  | "theory_context_reflection"
  | "theory_frontier_vector_field"
  | "context_attachment_reflection"
  | "bounded_context_reference"
  | "civilization_bounds_roadmap"
  | "civilization_scenario_frame"
  | "codex_comparison"
  | "live_pipeline_receipt"
  | "stage_play_badge_graph"
  | "stage_play_output_lane_projection"
  | "stage_play_live_answer_projection"
  | "stage_play_live_source_mail_read_result"
  | "stage_play_live_source_mail_decision"
  | "stage_play_live_source_narrative_state"
  | "stage_play_live_source_current_state"
  | "stage_play_live_source_quality"
  | "stage_play_live_source_interpreter_profile"
  | "stage_play_live_source_interpreter_profile_comparison"
  | "ideology_context_reflection"
  | "zen_badge_locator"
  | "fruition_procedure_expression"
  | "procedural_zen_classification"
  | "theory_ideology_bridge"
  | "workstation_tool_evaluation"
  | "process_overview"
  | "visual_scene_query_intent"
  | "selected_visual_scene_set"
  | "visual_scene_comparison_result"
  | "conversation_memory_answer"
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
