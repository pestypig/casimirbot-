import {
  HELIX_WORKSTATION_AFFORDANCE_SCHEMA,
  type HelixWorkstationAffordance,
  type HelixWorkstationAffordanceFamily,
} from "./helix-workstation-affordance";

export type WorkstationDynamicToolRisk = "low" | "medium" | "high";

export type WorkstationDynamicToolActionDefinition = {
  panel_id: string;
  action_id: string;
  title?: string;
  description?: string;
  risk?: WorkstationDynamicToolRisk;
  aliases?: string[];
  required_args?: string[];
  optional_args?: string[];
  requires_confirmation?: boolean;
  returns_artifact?: boolean;
};

export type WorkspaceActionRegistryEntry = {
  action_key: string;
  family:
    | "panel_control"
    | "docs_viewer"
    | "notes"
    | "clipboard"
    | "situation_room"
    | "timeline"
    | "storage"
    | "task_history"
    | "calculator"
    | "console";
  target_id: string;
  action_id: string;
  label: string;
  aliases: string[];
  terminal_receipt_required: true;
  source: "static_registry" | "desktop_panel_manifest" | "shared_dynamic_tool_registry";
  enabled: boolean;
};

export type WorkspaceActionManifestEntry = Omit<WorkspaceActionRegistryEntry, "source"> & {
  client_handler_key: string;
  source: "desktop_panel_manifest" | "shared_dynamic_tool_registry" | "static_backstop";
};

export type WorkspaceActionRegistryAudit = {
  manifest_version: string;
  visible_panels: string[];
  registry_targets: string[];
  client_handlers: string[];
  missing_from_registry: string[];
  missing_client_handler: string[];
  stale_registry_entries: string[];
  verdict: "clean" | "warning" | "violation";
};

export type WorkstationDynamicToolSpec = {
  namespace: "workstation";
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  deferLoading: boolean;
  risk: WorkstationDynamicToolRisk;
  returns_artifact: boolean;
  requires_confirmation: boolean;
  panel_id: string;
  action_id: string;
  terminal_artifact_kind: string | null;
  attachment_policy?: "manual_only";
  context_injection?: "explicit_attachment_only";
};

export type WorkstationDynamicToolCallMapping =
  | {
      ok: true;
      action: {
        schema_version: "helix.workstation.action/v1";
        action: "open_panel" | "focus_panel";
        panel_id: string;
      };
    }
  | {
      ok: true;
      action: {
        schema_version: "helix.workstation.action/v1";
        action: "run_panel_action";
        panel_id: string;
        action_id: string;
        args?: Record<string, unknown>;
      };
    }
  | {
      ok: false;
      reason: "unknown_tool" | "missing_required_args";
      missing_required_args: string[];
    };

type PanelCapabilitiesLike = Record<
  string,
  {
    actions: Array<{
      id: string;
      title?: string;
      description?: string;
      risk?: WorkstationDynamicToolRisk;
      aliases?: string[];
      required_args?: string[];
      optional_args?: string[];
      requires_confirmation?: boolean;
      returns_artifact?: boolean;
    }>;
  }
>;

const SITUATION_ROOM_MANUAL_ONLY_ACTIONS = new Set([
  "situation-room-pipelines.setup_from_prompt",
  "situation-room-pipelines.create_job",
  "situation-room-pipelines.run_job",
  "situation-room-pipelines.attach_job_to_helix_ask",
  "situation-room-pipelines.create_graph",
  "situation-room-pipelines.create_graph_from_recipe",
  "situation-room-pipelines.create_translation_pair",
  "situation-room-pipelines.attach_graph_to_helix_ask",
  "situation-room-pipelines.attach_standby_to_helix_thread",
  "situation-room-pipelines.start_situation_goal_session",
  "situation-room-pipelines.create_live_answer_environment",
  "situation-room-pipelines.set_live_commentary_policy",
  "situation-room-pipelines.request_agentic_review",
  "situation-room-pipelines.set_companion_policy",
  "situation-room-pipelines.construct.create_from_recipe",
  "situation-room-pipelines.construct.query",
  "situation-room-pipelines.construct.explain",
  "situation-room-pipelines.construct.set_operating_prompt",
  "situation-room-pipelines.construct.detach",
  "situation-room-pipelines.construct.activate",
  "situation-room-pipelines.construct.attach_source",
  "situation-room-pipelines.construct.bind_output",
  "situation-room-pipelines.construct.list_recipes",
  "situation-room-pipelines.dottie.manifest",
  "situation-room-pipelines.observer.attach",
  "situation-room-pipelines.observer.detach",
  "situation-room-pipelines.observer.query",
  "situation-room-pipelines.create_live_workstation_pipeline",
  "situation-room-pipelines.pause_live_workstation_pipeline",
  "situation-room-pipelines.resume_live_workstation_pipeline",
  "situation-room-pipelines.stop_live_workstation_pipeline",
  "situation-room-pipelines.set_pipeline_transform",
  "situation-room-pipelines.set_pipeline_sink",
  "situation-room-pipelines.attach_pipeline_to_live_answer_environment",
  "situation-room-pipelines.mission_memory.refresh",
  "situation-room-pipelines.interjection_investigator.review_latest",
  "situation-room-pipelines.episode_timeline.summarize_window",
  "situation-room-pipelines.goal_ledger.set_objective",
  "situation-room-pipelines.goal_ledger.mark_complete",
  "situation-room-pipelines.goal_ledger.mark_blocked",
  "situation-room-pipelines.goal.evaluate",
  "situation-room-pipelines.situation_context.attach_to_ask",
  "situation-room-pipelines.callout_policy.set_mode",
  "situation-room-pipelines.voice_delivery.propose_from_trace",
  "situation-room-pipelines.voice_delivery.confirm_speak",
  "situation-room-pipelines.live_continuation.start",
  "situation-room-pipelines.live_continuation.tick",
  "situation-room-pipelines.live_continuation.query",
  "situation-room-pipelines.live_continuation.pause",
  "situation-room-pipelines.live_continuation.resume",
  "situation-room-pipelines.live_continuation.stop",
  "situation-room-pipelines.worker_lane.run",
  "situation-room-pipelines.source_health.query",
  "situation-room-pipelines.start_categorization_job",
  "situation-room-pipelines.pause_categorization_job",
  "situation-room-pipelines.resume_categorization_job",
  "situation-room-pipelines.stop_categorization_job",
  "situation-room-pipelines.archive_categorization_session",
  "situation-room-pipelines.query_categorization_job",
  "situation-room-pipelines.query_event_window",
  "situation-room-pipelines.query_synthetic_evidence",
  "situation-room-pipelines.visual-source.start_capture",
  "situation-room-pipelines.visual-source.capture_frame_now",
  "situation-room-pipelines.visual-source.set_cadence",
  "situation-room-pipelines.visual-source.pause",
  "situation-room-pipelines.visual-source.resume",
  "situation-room-pipelines.visual-source.stop",
  "situation-room-pipelines.visual-source.analyze_latest_frame",
  "situation-room-pipelines.visual-source.align_latest_with_event_window",
  "situation-room-pipelines.live-source.set_rate",
]);

export const WORKSTATION_DYNAMIC_TOOL_ACTIONS: WorkstationDynamicToolActionDefinition[] = [
  { panel_id: "docs-viewer", action_id: "open", required_args: [], optional_args: [] },
  {
    panel_id: "docs-viewer",
    action_id: "open_directory",
    title: "Open docs directory",
    description: "Open the Docs & Papers panel and show the document directory.",
    aliases: [
      "show the docs directory",
      "open docs directory",
      "show document directory",
      "open document tree",
      "show docs tree",
      "open papers directory",
    ],
    required_args: [],
    optional_args: [],
  },
  { panel_id: "docs-viewer", action_id: "open_doc", required_args: ["path"], optional_args: ["anchor"], returns_artifact: true },
  { panel_id: "docs-viewer", action_id: "open_doc_by_path", required_args: ["path"], optional_args: ["anchor"], returns_artifact: true },
  { panel_id: "docs-viewer", action_id: "open_latest_doc_by_topic", required_args: ["topic"], optional_args: ["path"], returns_artifact: true },
  { panel_id: "docs-viewer", action_id: "search_docs", required_args: ["query"], optional_args: ["limit"], returns_artifact: true },
  { panel_id: "docs-viewer", action_id: "validate_doc_candidates", required_args: ["query"], optional_args: ["limit"], returns_artifact: true },
  { panel_id: "docs-viewer", action_id: "verify_active_doc", required_args: [], optional_args: [], returns_artifact: true },
  { panel_id: "docs-viewer", action_id: "open_doc_and_read", required_args: ["path"], optional_args: ["anchor"], returns_artifact: true },
  { panel_id: "docs-viewer", action_id: "identify_current_doc", required_args: [], optional_args: [], returns_artifact: true },
  { panel_id: "docs-viewer", action_id: "locate_in_doc", required_args: ["query"], optional_args: ["path", "anchor"], returns_artifact: true },
  { panel_id: "docs-viewer", action_id: "summarize_doc", required_args: [], optional_args: ["path", "anchor", "selected_text"], returns_artifact: true },
  { panel_id: "docs-viewer", action_id: "summarize_section", required_args: [], optional_args: ["path", "anchor", "selected_text"], returns_artifact: true },
  { panel_id: "docs-viewer", action_id: "explain_paper", required_args: [], optional_args: ["path", "anchor", "selected_text"], returns_artifact: true },
  { panel_id: "mission-ethos", action_id: "open", required_args: [], optional_args: [] },
  {
    panel_id: "mission-ethos",
    action_id: "open_node",
    title: "Open Ideology Node",
    description: "Open the Ideology & Zen panel at a specific framework node.",
    aliases: ["open ideology node", "show zen node", "open mission ethos node"],
    required_args: [],
    optional_args: ["node_id", "slug"],
    returns_artifact: true,
  },
  {
    panel_id: "mission-ethos",
    action_id: "search_nodes",
    title: "Search Ideology Nodes",
    description: "Search the ideology tree for compact framework nodes relevant to a query.",
    aliases: ["search ideology", "search zen framework", "find ethos node"],
    required_args: ["query"],
    optional_args: ["limit"],
    returns_artifact: true,
  },
  {
    panel_id: "mission-ethos",
    action_id: "build_context",
    title: "Build Ideology Context",
    description: "Build a compact ideology context pack from a node, slug, or query.",
    aliases: ["build ideology context", "attach zen context", "use ethos framework"],
    required_args: [],
    optional_args: ["node_id", "slug", "query", "limit"],
    returns_artifact: true,
  },
  {
    panel_id: "mission-ethos",
    action_id: "compare_motive_to_zen",
    title: "Compare Motive To Zen",
    description: "Retrieve compact ideology/Zen framework evidence for comparing a motive without making the framework an action authority.",
    aliases: ["compare motive to zen", "evaluate motive with zen", "compare motives to ideology", "zen motive check"],
    required_args: ["motive"],
    optional_args: ["framework", "node_ids", "query", "active_pressures"],
    returns_artifact: true,
  },
  { panel_id: "workstation-notes", action_id: "open", required_args: [], optional_args: [] },
  { panel_id: "workstation-notes", action_id: "create_note", required_args: [], optional_args: ["title", "topic", "body", "note_id"], returns_artifact: true },
  { panel_id: "workstation-notes", action_id: "append_to_note", required_args: ["text"], optional_args: ["note_id", "title"], returns_artifact: true },
  { panel_id: "workstation-notes", action_id: "create_live_note_sink", required_args: [], optional_args: ["note_id", "title", "topic"], returns_artifact: true },
  { panel_id: "workstation-notes", action_id: "append_live_note_chunk", required_args: ["chunk_text"], optional_args: ["note_id", "title", "topic", "trace_id"], returns_artifact: true },
  { panel_id: "workstation-notes", action_id: "set_active_note", required_args: [], optional_args: ["note_id", "title"], returns_artifact: true },
  { panel_id: "workstation-notes", action_id: "rename_note", required_args: ["title"], optional_args: ["note_id", "from_title"], returns_artifact: true },
  { panel_id: "workstation-notes", action_id: "delete_note", required_args: [], optional_args: ["note_id", "title", "confirmed"], requires_confirmation: true, returns_artifact: true },
  { panel_id: "workstation-notes", action_id: "list_notes", required_args: [], optional_args: ["active_note_title", "title", "active_note_id", "note_id"], returns_artifact: true },
  { panel_id: "workstation-clipboard-history", action_id: "open", required_args: [], optional_args: [] },
  { panel_id: "workstation-clipboard-history", action_id: "read_clipboard", required_args: [], optional_args: [], returns_artifact: true },
  { panel_id: "workstation-clipboard-history", action_id: "write_clipboard", required_args: ["text"], optional_args: ["source"], returns_artifact: true },
  { panel_id: "workstation-clipboard-history", action_id: "clear_history", required_args: [], optional_args: ["confirmed"], requires_confirmation: true, returns_artifact: true },
  { panel_id: "workstation-clipboard-history", action_id: "copy_receipt_to_clipboard", required_args: [], optional_args: ["receipt_id"], returns_artifact: true },
  { panel_id: "workstation-clipboard-history", action_id: "copy_receipt_to_note", required_args: [], optional_args: ["receipt_id", "note_id", "note_title"], returns_artifact: true },
  { panel_id: "workstation-clipboard-history", action_id: "copy_selection_to_note", required_args: [], optional_args: ["note_id", "note_title"], returns_artifact: true },
  { panel_id: "image-lens", action_id: "open", required_args: [], optional_args: [] },
  {
    panel_id: "image-lens",
    action_id: "image_lens.focus_regions",
    title: "Run Image Lens Focus Regions",
    description: "Submit one or more Image Lens crop regions into Live Answer visual evidence. Observation only.",
    aliases: ["focus image lens regions", "inspect cropped regions", "crop areas of interest", "send focus regions to visual capture"],
    required_args: ["sourceId", "regions"],
    optional_args: ["mode", "maxRegions"],
    risk: "medium",
    returns_artifact: true,
  },
  { panel_id: "document-image-lens", action_id: "open", required_args: [], optional_args: [] },
  {
    panel_id: "document-image-lens",
    action_id: "image_lens.focus_regions",
    title: "Run Image Lens Focus Regions",
    description: "Submit one or more legacy Image Lens crop regions into Live Answer visual evidence. Observation only.",
    required_args: ["sourceId", "regions"],
    optional_args: ["mode", "maxRegions"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "live-answer-environment",
    action_id: "image_lens.focus_regions",
    title: "Run Image Lens Focus Regions",
    description: "Use Image Lens to crop source regions and submit them as Live Answer visual evidence. Observation only.",
    aliases: ["route image lens focus to live answer", "send crop focus to live answer"],
    required_args: ["sourceId", "regions"],
    optional_args: ["mode", "maxRegions"],
    risk: "medium",
    returns_artifact: true,
  },
  { panel_id: "situation-room-sources", action_id: "open", required_args: [], optional_args: [] },
  { panel_id: "situation-room-sources", action_id: "attach_display_audio_source", required_args: [], optional_args: ["room_id", "label"], risk: "medium", returns_artifact: true },
  { panel_id: "situation-room-sources", action_id: "attach_mic_audio_source", required_args: [], optional_args: ["room_id", "label"], risk: "medium", returns_artifact: true },
  { panel_id: "situation-room-sources", action_id: "save_room_as_note", required_args: [], optional_args: ["room_id"], returns_artifact: true },
  { panel_id: "situation-room-sources", action_id: "attach_room_to_helix_ask", required_args: [], optional_args: ["room_id", "source_id"], returns_artifact: true },
  { panel_id: "situation-room-sources", action_id: "stop_room", required_args: [], optional_args: ["room_id"], risk: "medium", returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "open", required_args: [], optional_args: [] },
  {
    panel_id: "situation-room-pipelines",
    action_id: "setup_from_prompt",
    required_args: ["intent"],
    optional_args: [
      "capture_preference",
      "room_id",
      "source_ids",
      "speaker_a_id",
      "speaker_b_id",
      "speaker_a_native_language",
      "speaker_b_native_language",
      "output_mode",
    ],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "create_job",
    required_args: ["kind"],
    optional_args: [
      "room_id",
      "source_ids",
      "target_language",
      "native_language",
      "input_text_policy",
      "output_render_policy",
      "chunk_ranges",
      "attachment_policy",
      "context_injection",
      "derived_outputs_auto_attach",
      "command_lane_enabled",
    ],
    risk: "medium",
    returns_artifact: true,
  },
  { panel_id: "situation-room-pipelines", action_id: "run_job", required_args: ["job_id"], optional_args: [], risk: "medium", returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "attach_job_to_helix_ask", required_args: ["job_id"], optional_args: [], returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "save_job_as_note", required_args: ["job_id"], optional_args: [], returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "stop_job", required_args: ["job_id"], optional_args: [], risk: "medium", returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "create_graph", required_args: [], optional_args: ["room_id", "title"], returns_artifact: true },
  {
    panel_id: "situation-room-pipelines",
    action_id: "create_graph_from_recipe",
    required_args: ["recipe_id", "bindings"],
    optional_args: ["room_id", "source_ids", "title"],
    risk: "medium",
    returns_artifact: true,
  },
  { panel_id: "situation-room-pipelines", action_id: "add_node", required_args: ["graph_id", "type", "title"], optional_args: ["column", "status", "source_id", "speaker_id", "job_id"], returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "connect_nodes", required_args: ["graph_id", "from_node_id", "to_node_id", "lane"], optional_args: ["from_port", "to_port"], returns_artifact: true },
  {
    panel_id: "situation-room-pipelines",
    action_id: "create_translation_pair",
    required_args: ["speaker_a_id", "speaker_b_id", "speaker_a_native_language", "speaker_b_native_language"],
    optional_args: ["graph_id", "room_id", "source_ids", "render_policy", "voice_output", "title"],
    risk: "medium",
    returns_artifact: true,
  },
  { panel_id: "situation-room-pipelines", action_id: "attach_graph_to_helix_ask", required_args: ["graph_id"], optional_args: [], returns_artifact: true },
  {
    panel_id: "situation-room-pipelines",
    action_id: "attach_standby_to_helix_thread",
    required_args: ["room_id", "thread_id"],
    optional_args: ["source_id", "graph_id", "world_id", "turn_id", "session_id", "trace_id", "append_policy"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "start_categorization_job",
    title: "Start Categorization Job",
    description: "Start a thread-owned continuous categorization job that builds compact evidence from a live source.",
    aliases: ["start continuous categorization", "keep categorizing this source", "start minecraft categorizer"],
    required_args: ["thread_id", "source_family"],
    optional_args: ["profile_id", "room_id", "source_ids", "world_id", "objective", "archive_on_stop", "surface_policy"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "pause_categorization_job",
    required_args: ["job_id"],
    optional_args: ["thread_id"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "resume_categorization_job",
    required_args: ["job_id"],
    optional_args: ["thread_id"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "stop_categorization_job",
    required_args: ["job_id"],
    optional_args: ["thread_id", "archive_on_stop"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "archive_categorization_session",
    required_args: ["job_id"],
    optional_args: ["profile_id", "thread_id"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "query_categorization_job",
    required_args: [],
    optional_args: ["job_id", "thread_id", "room_id", "status"],
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "query_event_window",
    required_args: [],
    optional_args: ["thread_id", "room_id", "source_id", "world_id", "event_types", "from_ts", "to_ts", "limit", "include_raw_events"],
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "query_synthetic_evidence",
    required_args: ["thread_id"],
    optional_args: ["limit"],
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "visual-source.start_capture",
    required_args: ["thread_id"],
    optional_args: ["room_id", "session_id", "profile_id", "source_id", "source_family", "capture_mode", "source_surface", "cadence_ms", "raw_image_storage_policy"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "visual-source.capture_frame_now",
    required_args: ["source_id"],
    optional_args: ["thread_id", "room_id", "image_ref", "image_sha256", "mime_type", "player_position", "related_event_refs"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "visual-source.set_cadence",
    required_args: ["source_id", "cadence_ms"],
    optional_args: ["capture_mode", "status"],
    risk: "medium",
    returns_artifact: true,
  },
  { panel_id: "situation-room-pipelines", action_id: "visual-source.pause", required_args: ["source_id"], optional_args: [], risk: "medium", returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "visual-source.resume", required_args: ["source_id"], optional_args: [], risk: "medium", returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "visual-source.stop", required_args: ["source_id"], optional_args: [], risk: "medium", returns_artifact: true },
  {
    panel_id: "situation-room-pipelines",
    action_id: "visual-source.analyze_latest_frame",
    required_args: ["thread_id"],
    optional_args: ["frame_id", "summary", "detected_objects", "detected_scene_relations", "uncertainty", "supports_claims", "image_model"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "visual-source.align_latest_with_event_window",
    required_args: ["thread_id"],
    optional_args: ["frame_ids", "event_refs", "place_id", "summary", "confidence", "missing_evidence"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "start_situation_goal_session",
    required_args: ["thread_id"],
    optional_args: ["room_id", "source_id", "world_id", "graph_id", "objective", "mode", "standby_mode", "append_policy"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "create_live_answer_environment",
    required_args: ["objective"],
    optional_args: ["thread_id", "room_id", "source_ids", "graph_id", "preset", "line_schema", "mode", "source_config"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "create_live_workstation_pipeline",
    required_args: ["objective"],
    optional_args: ["thread_id", "source_ids", "source_id", "environment_id", "mode", "line_schema"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "pause_live_workstation_pipeline",
    required_args: ["pipeline_id"],
    optional_args: ["thread_id"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "resume_live_workstation_pipeline",
    required_args: ["pipeline_id"],
    optional_args: ["thread_id"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "stop_live_workstation_pipeline",
    required_args: ["pipeline_id"],
    optional_args: ["thread_id"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "set_pipeline_transform",
    required_args: ["pipeline_id", "transform_id"],
    optional_args: ["params", "model_policy"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "set_pipeline_sink",
    required_args: ["pipeline_id", "sink_id"],
    optional_args: ["params", "write_policy"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "attach_pipeline_to_live_answer_environment",
    required_args: ["pipeline_id", "environment_id"],
    optional_args: ["thread_id"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "attach_live_source",
    required_args: ["environment_id", "source_id"],
    optional_args: ["thread_id", "source_family", "kind", "panel_id"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "pause_live_answer_environment",
    required_args: ["environment_id"],
    optional_args: ["thread_id"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "resume_live_answer_environment",
    required_args: ["environment_id"],
    optional_args: ["thread_id"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "stop_live_answer_environment",
    required_args: ["environment_id"],
    optional_args: ["thread_id"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "set_live_line_schema",
    required_args: ["environment_id", "line_schema"],
    optional_args: ["thread_id"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "set_live_answer_line_schema",
    required_args: ["environment_id", "line_schema"],
    optional_args: ["thread_id"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "set_live_commentary_policy",
    title: "Set Live Commentary Policy",
    description: "Enable, pause, or adjust Codex-style live commentary for an active live answer environment.",
    aliases: [
      "enable live commentary",
      "turn on commentary",
      "talk me through this live answer",
      "narrate the live situation",
      "show codex style commentary",
      "set commentary cadence",
    ],
    required_args: [],
    optional_args: ["thread_id", "environment_id", "cadence", "status", "voice_mode"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "request_agentic_review",
    title: "Request Agentic Review",
    description: "Ask Helix Ask to review the latest compact live environment state without treating commentary as an answer.",
    aliases: [
      "run agentic review",
      "review this live answer",
      "explain latest equation result",
      "explain the latest live update",
      "what did the commentary mean",
      "why did the live card update",
    ],
    required_args: [],
    optional_args: ["thread_id", "environment_id", "question", "trigger"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "set_companion_policy",
    title: "Set Companion Policy",
    description: "Configure voice-aware companion mode without starting hidden Ask turns for every mic transcript.",
    aliases: [
      "set companion policy",
      "enable active companion",
      "keep me company",
      "turn on dottie mode",
      "set mic conversation mode",
    ],
    required_args: [],
    optional_args: [
      "thread_id",
      "voice_input_active",
      "voice_output_enabled",
      "companion_mode",
      "commentary_mode",
      "direct_address_names",
    ],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "construct.create_from_recipe",
    title: "Create Situation Construct",
    description: "Create a visible Situation Room construct from a recipe.",
    aliases: [
      "create construct",
      "build dottie",
      "manifest dottie",
      "start transcriber",
      "create route watcher",
      "make live agent",
    ],
    required_args: ["recipe_id"],
    optional_args: [
      "thread_id",
      "room_id",
      "source_ids",
      "target_run_id",
      "environment_id",
      "mode",
      "voice_mode",
      "commentary_cadence",
      "output",
    ],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "construct.list_recipes",
    title: "List Construct Recipes",
    description: "List available Situation Room construct recipes.",
    aliases: ["list construct recipes", "show dottie recipe", "show transcriber recipe"],
    required_args: [],
    optional_args: ["recipe_id"],
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "construct.query",
    title: "Query Constructs",
    description: "Query visible Situation Room constructs and recipe runs.",
    aliases: ["show constructs", "query construct", "what constructs exist"],
    required_args: [],
    optional_args: ["thread_id", "room_id", "construct_id", "recipe_id", "type", "status"],
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "construct.explain",
    title: "Explain Construct",
    description: "Explain a Situation Room construct using its evidence-only receipts and bindings.",
    aliases: ["explain construct", "explain dottie construct", "why does this construct exist"],
    required_args: ["construct_id"],
    optional_args: ["thread_id", "room_id"],
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "construct.set_operating_prompt",
    title: "Set Live Job Prompt",
    description: "Update a visible live job operating prompt without granting answer authority.",
    aliases: ["change live job prompt", "edit dottie prompt", "set operating prompt"],
    required_args: ["contract_id", "operating_prompt"],
    optional_args: ["thread_id", "room_id", "reason"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "construct.detach",
    title: "Detach Construct",
    description: "Mark a Situation Room construct as detached without deleting its receipts.",
    aliases: ["detach construct", "stop construct", "detach dottie construct"],
    required_args: ["construct_id"],
    optional_args: ["thread_id", "room_id"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "construct.activate",
    title: "Activate Construct",
    description: "Mark a planned or receipt-only Situation Room construct as active.",
    aliases: ["activate construct", "start construct", "activate dottie construct"],
    required_args: ["construct_id"],
    optional_args: ["thread_id", "room_id"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "construct.attach_source",
    title: "Attach Source To Construct",
    description: "Attach a Situation Room source to an existing construct.",
    aliases: ["attach source to construct", "add source to dottie", "bind source to transcriber"],
    required_args: ["construct_id", "source_ids"],
    optional_args: ["thread_id", "room_id"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "construct.bind_output",
    title: "Bind Construct Output",
    description: "Bind an output surface such as transcript stream, typed commentary, voice proposal, or live answer projection to a construct.",
    aliases: ["bind construct output", "send construct to live answers", "bind dottie voice proposal"],
    required_args: ["construct_id", "output"],
    optional_args: ["thread_id", "room_id", "artifact_ref", "environment_id", "status"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "dottie.manifest",
    title: "Manifest Dottie",
    description: "Create a witness-only Auntie Dottie observer preset for the active Situation Room.",
    aliases: [
      "manifest dottie",
      "start auntie dottie",
      "build dottie observer",
      "make dottie watch this room",
    ],
    required_args: [],
    optional_args: [
      "thread_id",
      "room_id",
      "source_ids",
      "mode",
      "voice_mode",
      "commentary_cadence",
      "target_run_id",
      "objective",
      "max_chars",
    ],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "observer.attach",
    title: "Attach Observer",
    description: "Attach a witness-only observer, such as Auntie Dottie, to a Helix Ask run's public commentary events.",
    aliases: [
      "attach dottie observer",
      "have dottie watch this ask turn",
      "watch helix ask with dottie",
      "start dottie witness mode",
    ],
    required_args: ["target_run_id", "observer_profile"],
    optional_args: ["thread_id", "target_turn_id", "target_agent_id", "voice_mode", "max_chars", "event_filter"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "observer.detach",
    title: "Detach Observer",
    description: "Detach a witness-only observer subscription without changing the target Helix Ask run.",
    aliases: ["detach dottie observer", "stop dottie watching", "remove observer subscription"],
    required_args: ["observer_id"],
    optional_args: ["thread_id", "target_run_id"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "observer.query",
    title: "Query Observers",
    description: "List witness-only observer subscriptions and their public commentary targets.",
    aliases: ["show dottie observers", "list observer subscriptions", "what is dottie watching"],
    required_args: [],
    optional_args: ["thread_id", "target_run_id", "observer_profile"],
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "live-source.set_rate",
    title: "Set Live Source Rate",
    description: "Set the cadence/rate policy for an active live source producer, such as visual screen capture.",
    aliases: [
      "set interval on visual capture",
      "set visual capture interval",
      "set cadence on screen capture",
      "keep checking every 10 seconds",
      "capture every 10 seconds",
    ],
    required_args: ["cadence_ms"],
    optional_args: ["thread_id", "source_id", "producer_id", "modality", "capture_mode", "environment_id", "pipeline_id"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "pause_live_source",
    required_args: ["source_id"],
    optional_args: ["thread_id"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "resume_live_source",
    required_args: ["source_id"],
    optional_args: ["thread_id"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "stop_live_source",
    required_args: ["source_id"],
    optional_args: ["thread_id"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "set_live_source_tick_rate",
    required_args: ["source_id", "tick_rate_ms"],
    optional_args: ["thread_id"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "mission_memory.refresh",
    required_args: ["thread_id"],
    optional_args: ["room_id", "session_id"],
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "interjection_investigator.review_latest",
    required_args: ["thread_id"],
    optional_args: ["trigger", "room_id"],
    risk: "medium",
    returns_artifact: true,
  },
  { panel_id: "situation-room-pipelines", action_id: "episode_timeline.summarize_window", required_args: ["thread_id"], optional_args: ["room_id", "window_ms"], returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "goal_ledger.set_objective", required_args: ["thread_id", "objective"], optional_args: ["room_id"], returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "goal_ledger.mark_complete", required_args: ["thread_id", "goal"], optional_args: ["room_id"], returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "goal_ledger.mark_blocked", required_args: ["thread_id", "goal"], optional_args: ["room_id", "reason"], returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "goal.evaluate", required_args: ["thread_id"], optional_args: ["room_id", "job_id", "objective", "evidence_refs"], returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "situation_context.attach_to_ask", required_args: ["thread_id"], optional_args: ["room_id", "session_id"], returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "callout_policy.set_mode", required_args: ["thread_id", "mode"], optional_args: ["room_id"], risk: "medium", returns_artifact: true },
  {
    panel_id: "situation-room-pipelines",
    action_id: "voice_delivery.propose_from_trace",
    required_args: ["source_event_id"],
    optional_args: ["observer_id", "voice_mode", "max_chars", "source_text", "source_event_schema", "target_turn_id", "target_agent_id"],
    risk: "medium",
    returns_artifact: true,
  },
  { panel_id: "situation-room-pipelines", action_id: "voice_delivery.confirm_speak", required_args: ["thread_id"], optional_args: ["proposal_id", "delivery_id"], risk: "medium", returns_artifact: true },
  {
    panel_id: "situation-room-pipelines",
    action_id: "live_continuation.start",
    required_args: ["thread_id", "room_id", "objective"],
    optional_args: ["environment_id", "contract_id", "source_ids", "source_id", "voice_policy", "evidence_threshold", "lanes_enabled", "min_tick_interval_ms"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "live_continuation.tick",
    required_args: [],
    optional_args: ["job_id", "thread_id", "room_id", "trigger"],
    risk: "medium",
    returns_artifact: true,
  },
  { panel_id: "situation-room-pipelines", action_id: "live_continuation.query", required_args: [], optional_args: ["job_id", "thread_id", "room_id", "source_id", "status"], returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "live_continuation.pause", required_args: ["job_id"], optional_args: ["thread_id"], risk: "medium", returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "live_continuation.resume", required_args: ["job_id"], optional_args: ["thread_id"], risk: "medium", returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "live_continuation.stop", required_args: ["job_id"], optional_args: ["thread_id"], risk: "medium", returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "worker_lane.run", required_args: ["lane"], optional_args: ["thread_id", "room_id", "job_id", "evidence_refs"], risk: "medium", returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "source_health.query", required_args: [], optional_args: ["thread_id", "room_id", "source_id", "job_id"], returns_artifact: true },
  { panel_id: "workstation-workflow-timeline", action_id: "open", required_args: [], optional_args: [] },
  { panel_id: "workstation-process-graph", action_id: "open", required_args: [], optional_args: [] },
  { panel_id: "workstation-task-manager", action_id: "open", required_args: [], optional_args: [] },
  { panel_id: "workstation-storage-map", action_id: "open", required_args: [], optional_args: [] },
  { panel_id: "workstation-process-graph", action_id: "get_snapshot", required_args: [], optional_args: ["scope", "max_nodes", "include_timeline", "include_artifacts"], returns_artifact: true },
  { panel_id: "workstation-process-graph", action_id: "get_context_pack", required_args: [], optional_args: ["max_nodes", "max_artifacts", "max_timeline", "include_timeline"], returns_artifact: true },
  { panel_id: "workstation-process-graph", action_id: "query_snapshot", required_args: ["query"], optional_args: ["max_nodes", "include_timeline", "include_artifacts"], returns_artifact: true },
  { panel_id: "workstation-process-graph", action_id: "focus_node", required_args: ["node_id"], optional_args: [], returns_artifact: true },
  { panel_id: "workstation-process-graph", action_id: "filter_view", required_args: [], optional_args: ["filter"], returns_artifact: true },
  { panel_id: "workstation-process-graph", action_id: "export_svg", required_args: [], optional_args: ["mode", "max_nodes"], returns_artifact: true },
  { panel_id: "workstation-process-graph", action_id: "clear_historical", required_args: [], optional_args: [], returns_artifact: true },
  { panel_id: "agi-essence-console", action_id: "open", required_args: [], optional_args: [] },
  { panel_id: "account-session", action_id: "open", required_args: [], optional_args: [] },
  {
    panel_id: "account-session",
    action_id: "set_interface_language",
    title: "Set Interface Language",
    description: "Change the workstation interface language preference.",
    aliases: [
      "set interface language",
      "change interface language",
      "switch ui language",
      "switch interface to hawaiian",
      "set ui to hawaiian",
    ],
    required_args: ["language"],
    optional_args: [],
    returns_artifact: true,
  },
  { panel_id: "agi-task-history", action_id: "open", required_args: [], optional_args: [] },
  { panel_id: "scientific-calculator", action_id: "open", required_args: [], optional_args: [] },
  {
    panel_id: "scientific-calculator",
    action_id: "ingest_latex",
    required_args: ["latex"],
    optional_args: ["source_path", "anchor", "calculator_setup"],
    returns_artifact: true,
  },
  {
    panel_id: "scientific-calculator",
    action_id: "solve_expression",
    required_args: ["latex"],
    optional_args: ["source_path", "anchor", "calculator_setup"],
    returns_artifact: true,
  },
  {
    panel_id: "scientific-calculator",
    action_id: "solve_with_steps",
    required_args: ["latex"],
    optional_args: ["source_path", "anchor", "calculator_setup"],
    returns_artifact: true,
  },
  {
    panel_id: "scientific-calculator",
    action_id: "start_equation_live_source",
    required_args: [],
    optional_args: [
      "equation",
      "latex",
      "expression",
      "equation_context",
      "environment_id",
      "source_id",
      "tick_rate_ms",
      "max_ticks",
      "calculator_setup",
    ],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "scientific-calculator",
    action_id: "start_prime_stream",
    required_args: [],
    optional_args: ["environment_id", "source_id", "tick_rate_ms", "max_ticks", "start"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "scientific-calculator",
    action_id: "stop_live_source",
    required_args: [],
    optional_args: ["source_id"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "scientific-calculator",
    action_id: "restart_live_source",
    required_args: [],
    optional_args: ["environment_id", "source_id", "tick_rate_ms", "max_ticks", "start"],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "scientific-calculator",
    action_id: "emit_live_tick",
    required_args: [],
    optional_args: ["environment_id", "source_id"],
    risk: "medium",
    returns_artifact: true,
  },
];

export const WORKSPACE_ACTION_REGISTRY: WorkspaceActionRegistryEntry[] = [
  {
    action_key: "docs-viewer.open",
    family: "docs_viewer",
    target_id: "docs-viewer",
    action_id: "open",
    label: "Docs & Papers",
    aliases: ["open the docs and papers panel", "open docs viewer", "show docs and papers"],
    terminal_receipt_required: true,
    source: "shared_dynamic_tool_registry",
    enabled: true,
  },
  {
    action_key: "docs-viewer.open_directory",
    family: "docs_viewer",
    target_id: "docs-viewer",
    action_id: "open_directory",
    label: "Docs Directory",
    aliases: [
      "show the docs directory",
      "open docs directory",
      "show document directory",
      "open document tree",
      "show docs tree",
      "open papers directory",
    ],
    terminal_receipt_required: true,
    source: "shared_dynamic_tool_registry",
    enabled: true,
  },
  {
    action_key: "workstation-notes.open",
    family: "notes",
    target_id: "workstation-notes",
    action_id: "open",
    label: "Workstation Notes",
    aliases: ["open workstation notes", "show notes", "open my notes"],
    terminal_receipt_required: true,
    source: "shared_dynamic_tool_registry",
    enabled: true,
  },
  {
    action_key: "mission-ethos.open",
    family: "console",
    target_id: "mission-ethos",
    action_id: "open",
    label: "Ideology & Zen",
    aliases: ["open ideology panel", "open ideology and zen", "show mission ethos", "open zen framework"],
    terminal_receipt_required: true,
    source: "shared_dynamic_tool_registry",
    enabled: true,
  },
  {
    action_key: "workstation-clipboard-history.open",
    family: "clipboard",
    target_id: "workstation-clipboard-history",
    action_id: "open",
    label: "Clipboard History",
    aliases: ["open clipboard history", "show clipboard history", "open clipboard"],
    terminal_receipt_required: true,
    source: "shared_dynamic_tool_registry",
    enabled: true,
  },
  {
    action_key: "situation-room-sources.open",
    family: "situation_room",
    target_id: "situation-room-sources",
    action_id: "open",
    label: "Situation Room Sources",
    aliases: ["open situation room sources", "show situation room sources", "open room sources"],
    terminal_receipt_required: true,
    source: "shared_dynamic_tool_registry",
    enabled: true,
  },
  {
    action_key: "situation-room-pipelines.open",
    family: "situation_room",
    target_id: "situation-room-pipelines",
    action_id: "open",
    label: "Situation Room Pipelines",
    aliases: ["open situation room pipelines", "show situation room pipelines", "open room pipelines"],
    terminal_receipt_required: true,
    source: "shared_dynamic_tool_registry",
    enabled: true,
  },
  {
    action_key: "situation-room.live-source.set_rate",
    family: "situation_room",
    target_id: "situation-room-pipelines",
    action_id: "live-source.set_rate",
    label: "Set Live Source Rate",
    aliases: [
      "set interval on visual capture",
      "set visual capture interval",
      "set cadence on screen capture",
      "capture every 10 seconds",
    ],
    terminal_receipt_required: true,
    source: "shared_dynamic_tool_registry",
    enabled: true,
  },
  {
    action_key: "workstation-workflow-timeline.open",
    family: "timeline",
    target_id: "workstation-workflow-timeline",
    action_id: "open",
    label: "Workflow Timeline",
    aliases: ["open workflow timeline", "show workflow timeline", "open workstation workflow timeline"],
    terminal_receipt_required: true,
    source: "desktop_panel_manifest",
    enabled: true,
  },
  {
    action_key: "workstation-process-graph.open",
    family: "timeline",
    target_id: "workstation-process-graph",
    action_id: "open",
    label: "Process Graph",
    aliases: ["open process graph", "show process graph", "open workstation process graph"],
    terminal_receipt_required: true,
    source: "desktop_panel_manifest",
    enabled: true,
  },
  {
    action_key: "workstation-task-manager.open",
    family: "task_history",
    target_id: "workstation-task-manager",
    action_id: "open",
    label: "Task Manager",
    aliases: ["open task manager", "show task manager", "open workstation task manager", "show memory usage"],
    terminal_receipt_required: true,
    source: "desktop_panel_manifest",
    enabled: true,
  },
  {
    action_key: "workstation-storage-map.open",
    family: "storage",
    target_id: "workstation-storage-map",
    action_id: "open",
    label: "Storage Map",
    aliases: ["open storage map", "show storage map", "open saved memory map", "show disk memory", "show saved memory usage"],
    terminal_receipt_required: true,
    source: "desktop_panel_manifest",
    enabled: true,
  },
  {
    action_key: "agi-essence-console.open",
    family: "console",
    target_id: "agi-essence-console",
    action_id: "open",
    label: "Essence Console",
    aliases: ["open essence console", "open helix console", "show essence console"],
    terminal_receipt_required: true,
    source: "desktop_panel_manifest",
    enabled: true,
  },
  {
    action_key: "account-session.open",
    family: "panel_control",
    target_id: "account-session",
    action_id: "open",
    label: "Account Sessions",
    aliases: ["open account", "show sessions", "show token usage", "open profile"],
    terminal_receipt_required: true,
    source: "shared_dynamic_tool_registry",
    enabled: true,
  },
  {
    action_key: "account-session.set_interface_language",
    family: "panel_control",
    target_id: "account-session",
    action_id: "set_interface_language",
    label: "Set Interface Language",
    aliases: [
      "set interface language",
      "change interface language",
      "switch ui language",
      "switch interface to hawaiian",
      "set ui to hawaiian",
    ],
    terminal_receipt_required: true,
    source: "shared_dynamic_tool_registry",
    enabled: true,
  },
  {
    action_key: "agi-task-history.open",
    family: "task_history",
    target_id: "agi-task-history",
    action_id: "open",
    label: "Task History",
    aliases: ["open task history", "show task history", "open agi task history"],
    terminal_receipt_required: true,
    source: "desktop_panel_manifest",
    enabled: true,
  },
  {
    action_key: "scientific-calculator.open",
    family: "calculator",
    target_id: "scientific-calculator",
    action_id: "open",
    label: "Scientific Calculator",
    aliases: ["open scientific calculator", "show scientific calculator", "open calculator"],
    terminal_receipt_required: true,
    source: "desktop_panel_manifest",
    enabled: true,
  },
];

export const WORKSPACE_ACTION_MANIFEST_VERSION = "e67.workspace-action-manifest.v1";

export const WORKSPACE_ACTION_VISIBLE_PANEL_IDS = [
  "docs-viewer",
  "workstation-notes",
  "mission-ethos",
  "workstation-clipboard-history",
  "situation-room-sources",
  "situation-room-pipelines",
  "workstation-workflow-timeline",
  "workstation-process-graph",
  "workstation-task-manager",
  "workstation-storage-map",
  "agi-essence-console",
  "account-session",
  "agi-task-history",
  "scientific-calculator",
] as const;

export const WORKSPACE_ACTION_MANIFEST: WorkspaceActionManifestEntry[] = WORKSPACE_ACTION_REGISTRY.map((entry: WorkspaceActionRegistryEntry) => ({
  action_key: entry.action_key,
  family: entry.family,
  target_id: entry.target_id,
  action_id: entry.action_id,
  label: entry.label,
  aliases: entry.aliases,
  terminal_receipt_required: entry.terminal_receipt_required,
  client_handler_key: entry.action_key,
  source: entry.source === "static_registry" ? "static_backstop" : entry.source,
  enabled: entry.enabled,
}));

export const WORKSPACE_ACTION_CLIENT_HANDLER_KEYS = WORKSPACE_ACTION_MANIFEST.map((entry: WorkspaceActionManifestEntry) => entry.client_handler_key);

export function buildWorkspaceActionRegistryAudit(args?: {
  visiblePanels?: readonly string[];
  registry?: readonly WorkspaceActionRegistryEntry[];
  manifest?: readonly WorkspaceActionManifestEntry[];
  clientHandlers?: readonly string[];
}): WorkspaceActionRegistryAudit {
  const visiblePanels = [...(args?.visiblePanels ?? WORKSPACE_ACTION_VISIBLE_PANEL_IDS)];
  const registry = [...(args?.registry ?? WORKSPACE_ACTION_REGISTRY)];
  const manifest = [...(args?.manifest ?? WORKSPACE_ACTION_MANIFEST)];
  const clientHandlers = [...(args?.clientHandlers ?? WORKSPACE_ACTION_CLIENT_HANDLER_KEYS)];
  const enabledManifest = manifest.filter((entry: WorkspaceActionManifestEntry) => entry.enabled);
  const registryKeys = new Set(registry.filter((entry: WorkspaceActionRegistryEntry) => entry.enabled).map((entry: WorkspaceActionRegistryEntry) => entry.action_key));
  const registryTargets = registry
    .filter((entry: WorkspaceActionRegistryEntry) => entry.enabled)
    .map((entry: WorkspaceActionRegistryEntry) => entry.action_key);
  const manifestKeys = new Set(enabledManifest.map((entry: WorkspaceActionManifestEntry) => entry.action_key));
  const manifestTargets = new Set(enabledManifest.map((entry: WorkspaceActionManifestEntry) => entry.target_id));
  const clientHandlerKeys = new Set(clientHandlers);
  const missingVisiblePanels = visiblePanels
    .filter((panelId: string) => !manifestTargets.has(panelId))
    .map((panelId: string) => `${panelId}.*`);
  const missingManifestActions = enabledManifest
    .filter((entry: WorkspaceActionManifestEntry) => !registryKeys.has(entry.action_key))
    .map((entry: WorkspaceActionManifestEntry) => entry.action_key);
  const missingClientHandler = enabledManifest
    .filter((entry: WorkspaceActionManifestEntry) => !clientHandlerKeys.has(entry.client_handler_key))
    .map((entry: WorkspaceActionManifestEntry) => entry.action_key);
  const staleRegistryEntries = registry
    .filter((entry: WorkspaceActionRegistryEntry) => entry.enabled && !manifestKeys.has(entry.action_key))
    .map((entry: WorkspaceActionRegistryEntry) => entry.action_key);
  const missingFromRegistry = [...missingVisiblePanels, ...missingManifestActions];
  const verdict =
    missingFromRegistry.length > 0 || missingClientHandler.length > 0
      ? "violation"
      : staleRegistryEntries.length > 0
        ? "warning"
        : "clean";

  return {
    manifest_version: WORKSPACE_ACTION_MANIFEST_VERSION,
    visible_panels: visiblePanels,
    registry_targets: registryTargets,
    client_handlers: clientHandlers,
    missing_from_registry: missingFromRegistry,
    missing_client_handler: missingClientHandler,
    stale_registry_entries: staleRegistryEntries,
    verdict,
  };
}

function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function argSchema(arg: string): Record<string, unknown> {
  if (arg.endsWith("_ids") || arg === "source_ids") return { type: "array", items: { type: "string" } };
  if (arg === "active_pressures" || arg === "event_filter") return { type: "array", items: { type: "string" } };
  if (arg === "regions") {
    return {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          regionId: { type: "string" },
          bboxPct: {
            type: "object",
            additionalProperties: false,
            properties: {
              x: { type: "number" },
              y: { type: "number" },
              width: { type: "number" },
              height: { type: "number" },
            },
            required: ["x", "y", "width", "height"],
          },
          reason: { type: "string" },
          priority: { type: "number" },
        },
        required: ["bboxPct", "reason"],
      },
    };
  }
  if (arg === "chunk_ranges") {
    return {
      type: "array",
      items: {
        type: "object",
        properties: {
          source_id: { type: "string" },
          from_chunk: { type: "number" },
          to_chunk: { type: "number" },
        },
        required: ["source_id", "from_chunk", "to_chunk"],
      },
    };
  }
  if (arg === "confirmed" || arg === "derived_outputs_auto_attach" || arg === "command_lane_enabled") {
    return { type: "boolean" };
  }
  if (arg === "limit" || arg === "max_nodes" || arg === "max_artifacts" || arg === "max_timeline" || arg === "max_chars" || arg === "maxRegions") return { type: "number" };
  if (arg === "recipe_id") {
    return {
      enum: [
        "auntie_dottie_witness",
        "browser_audio_transcriber",
        "minecraft_route_watcher",
        "live_source_summarizer",
        "translation_pair",
        "source_health_watch",
      ],
    };
  }
  if (arg === "kind") return { enum: ["translate", "rolling_summary", "action_items", "prompt_composer"] };
  if (arg === "intent") return { enum: ["translate_conversation", "monitor_conversation", "summarize_conversation"] };
  if (arg === "capture_preference") return { enum: ["existing_source", "browser_tab_audio", "display_audio", "mic", "unknown"] };
  if (arg === "output_mode") return { enum: ["visual_only", "voice_on_confirm", "voice_auto_direct_address"] };
  if (arg === "input_text_policy") return { enum: ["transcript_text", "source_text_preferred", "source_text_only"] };
  if (arg === "output_render_policy") return { enum: ["target_language", "native_language", "dual"] };
  if (arg === "render_policy") return { enum: ["target_language", "native_language", "dual"] };
  if (arg === "voice_output") return { enum: ["off", "on_confirm", "auto_when_direct_addressed"] };
  if (arg === "lane") return { enum: ["audio", "speaker_identity", "transcript", "translation", "context", "command", "voice_output"] };
  if (arg === "attachment_policy") return { enum: ["manual_only"] };
  if (arg === "context_injection") return { enum: ["explicit_attachment_only"] };
  if (arg === "language") return { enum: ["en", "haw"] };
  if (arg === "source_family") return { enum: ["minecraft_world", "calculator_stream", "physics_simulation", "browser_audio", "screen_summary", "manual_debug"] };
  if (arg === "modality") return { enum: ["visual_frame", "audio_transcript", "world_event", "environment_state", "environment_affordance", "procedure_graph", "calculator_stream", "simulation_stream"] };
  if (arg === "capture_mode") return { enum: ["interval", "manual", "salience_triggered", "push", "on_change"] };
  if (arg === "mode") return { enum: ["regions_only", "broad_then_regions"] };
  if (arg === "cadence") return { enum: ["off", "milestones_only", "anomalies_and_milestones", "windowed_companion", "active_dialogue", "continuous_debug"] };
  if (arg === "commentary_cadence") return { enum: ["milestones_only", "salience_only", "manual"] };
  if (arg === "status") return { enum: ["active", "paused", "stopped", "planned", "blocked", "detached", "receipt_only", "stale", "completed"] };
  if (arg === "voice_mode") return { enum: ["off", "propose_only", "on_confirm", "text_only", "voice_on_confirm", "critical_voice", "direct_address_only"] };
  if (arg === "observer_profile") return { enum: ["auntie_dottie", "dottie", "custom"] };
  if (arg === "output") {
    return {
      enum: [
        "live_answer_environment",
        "transcript_stream",
        "typed_commentary",
        "voice_proposal",
        "route_evidence_view",
        "note",
      ],
    };
  }
  if (arg === "framework") return { enum: ["zen", "mission_ethos", "custom"] };
  if (arg === "calculator_setup") {
    const physicalDimensionSchema = {
      type: "object",
      properties: {
        length: { type: "number" },
        mass: { type: "number" },
        time: { type: "number" },
        electric_current: { type: "number" },
        thermodynamic_temperature: { type: "number" },
        amount_of_substance: { type: "number" },
        luminous_intensity: { type: "number" },
      },
      additionalProperties: false,
    };
    return {
      type: "object",
      additionalProperties: true,
      properties: {
        schema: { const: "helix.calculator_setup_context.v1" },
        expression: { type: "string" },
        display_latex: { type: "string" },
        subgoal: { type: "string" },
        domain: { enum: ["photon_energy", "kinetic_energy", "wavelength", "generic"] },
        equation: { type: "string" },
        variables: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: true,
            properties: {
              symbol: { type: "string" },
              value: { type: "string" },
              unit: { type: "string" },
              meaning: { type: "string" },
              quantity: { type: "string" },
              dimension: physicalDimensionSchema,
              dimension_signature: { type: "string" },
            },
            required: ["symbol", "value"],
          },
        },
        quantity: { type: "string" },
        unit_system: { enum: ["SI", "custom"] },
        input_units: {
          type: "object",
          additionalProperties: { type: "string" },
        },
        result_unit: { type: "string" },
        result_quantity: { type: "string" },
        result_dimension: physicalDimensionSchema,
        result_dimension_signature: { type: "string" },
        assumptions: { type: "array", items: { type: "string" } },
        unit_options: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: true,
            properties: {
              symbol: { type: "string" },
              label: { type: "string" },
              quantity: { type: "string" },
              dimension: physicalDimensionSchema,
              si_factor: { type: "number" },
              aliases: { type: "array", items: { type: "string" } },
            },
            required: ["symbol", "label", "quantity", "dimension", "si_factor"],
          },
        },
      },
      required: ["schema", "expression", "display_latex", "subgoal", "domain"],
    };
  }
  if (arg === "tick_rate_ms" || arg === "max_ticks" || arg === "start" || arg === "cadence_ms") return { type: "number" };
  return { type: "string" };
}

export function buildWorkstationToolName(panelId: string, actionId: string): string {
  return `${normalizeIdentifier(panelId)}.${normalizeIdentifier(actionId)}`;
}

export function buildWorkstationToolInputSchema(action: WorkstationDynamicToolActionDefinition): Record<string, unknown> {
  const required = action.required_args ?? [];
  const optional = action.optional_args ?? [];
  const properties: Record<string, unknown> = {};
  for (const arg of [...required, ...optional]) properties[arg] = argSchema(arg);
  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}

export function resolveWorkstationToolTerminalArtifactKind(panelId: string, actionId: string): string | null {
  if (actionId === "open") return "workspace_action_receipt";
  if (actionId === "image_lens.focus_regions") return "image_lens_focus_run_result";
  if (panelId === "docs-viewer" && actionId === "open_directory") return "workspace_action_receipt";
  if (panelId === "account-session" && actionId === "set_interface_language") return "workspace_action_receipt";
  if (panelId === "situation-room-pipelines" && actionId === "setup_from_prompt") return "situation_room_setup_execution_receipt";
  if (panelId === "situation-room-sources") return "situation_room_context";
  if (panelId === "situation-room-pipelines" && actionId === "create_job") return "situation_room_job";
  if (panelId === "situation-room-pipelines" && actionId === "create_graph_from_recipe") return "situation_room_graph_execution_receipt";
  if (panelId === "situation-room-pipelines" && actionId === "create_graph") return "situation_room_graph";
  if (panelId === "situation-room-pipelines" && actionId === "add_node") return "situation_room_graph";
  if (panelId === "situation-room-pipelines" && actionId === "connect_nodes") return "situation_room_graph";
  if (panelId === "situation-room-pipelines" && actionId === "create_translation_pair") return "situation_room_graph";
  if (panelId === "situation-room-pipelines" && actionId === "attach_graph_to_helix_ask") return "situation_room_graph_attachment";
  if (panelId === "situation-room-pipelines" && actionId === "attach_standby_to_helix_thread") return "situation_thread_binding_receipt";
  if (panelId === "situation-room-pipelines" && actionId === "start_situation_goal_session") return "situation_goal_session_receipt";
  if (panelId === "situation-room-pipelines" && actionId === "create_live_answer_environment") return "live_answer_environment_receipt";
  if (panelId === "situation-room-pipelines" && actionId === "create_live_workstation_pipeline") return "live_workstation_pipeline_receipt";
  if (panelId === "situation-room-pipelines" && ["pause_live_workstation_pipeline", "resume_live_workstation_pipeline", "stop_live_workstation_pipeline", "set_pipeline_transform", "set_pipeline_sink", "attach_pipeline_to_live_answer_environment"].includes(actionId)) return "live_workstation_pipeline_receipt";
  if (panelId === "situation-room-pipelines" && actionId === "attach_live_source") return "helix_live_source_admission_receipt";
  if (panelId === "situation-room-pipelines" && ["pause_live_answer_environment", "resume_live_answer_environment", "stop_live_answer_environment", "set_live_line_schema", "set_live_answer_line_schema"].includes(actionId)) return "live_answer_environment_receipt";
  if (panelId === "situation-room-pipelines" && actionId === "set_live_commentary_policy") return "live_commentary_session_receipt";
  if (panelId === "situation-room-pipelines" && actionId === "request_agentic_review") return "live_agentic_review_receipt";
  if (panelId === "situation-room-pipelines" && actionId === "set_companion_policy") return "companion_policy_receipt";
  if (panelId === "situation-room-pipelines" && actionId === "construct.create_from_recipe") return "situation_construct_recipe_run";
  if (panelId === "situation-room-pipelines" && actionId === "construct.list_recipes") return "situation_construct_recipe_registry";
  if (panelId === "situation-room-pipelines" && actionId === "construct.query") return "situation_construct_query_result";
  if (panelId === "situation-room-pipelines" && actionId === "construct.explain") return "situation_construct_explanation";
  if (panelId === "situation-room-pipelines" && actionId === "construct.set_operating_prompt") return "situation_live_job_prompt_update_receipt";
  if (
    panelId === "situation-room-pipelines" &&
    ["construct.detach", "construct.activate", "construct.attach_source", "construct.bind_output"].includes(actionId)
  ) return "situation_construct_update_receipt";
  if (panelId === "situation-room-pipelines" && actionId === "dottie.manifest") return "dottie_manifest_preset_receipt";
  if (panelId === "situation-room-pipelines" && ["observer.attach", "observer.detach"].includes(actionId)) return "dottie_observer_subscription_receipt";
  if (panelId === "situation-room-pipelines" && actionId === "observer.query") return "dottie_observer_query_receipt";
  if (panelId === "situation-room-pipelines" && actionId === "live-source.set_rate") return "visual_producer_cadence_receipt";
  if (panelId === "situation-room-pipelines" && ["pause_live_source", "resume_live_source", "stop_live_source", "set_live_source_tick_rate"].includes(actionId)) return "workstation_live_source_receipt";
  if (panelId === "scientific-calculator" && ["ingest_latex", "solve_expression", "solve_with_steps"].includes(actionId)) return "workspace_action_receipt";
  if (
    panelId === "scientific-calculator" &&
    ["start_equation_live_source", "start_prime_stream", "stop_live_source", "restart_live_source", "emit_live_tick"].includes(actionId)
  ) return "workstation_live_source_receipt";
  if (panelId === "situation-room-pipelines" && actionId === "mission_memory.refresh") return "mission_memory_update";
  if (panelId === "situation-room-pipelines" && actionId === "interjection_investigator.review_latest") return "interjection_decision";
  if (panelId === "situation-room-pipelines" && actionId === "situation_context.attach_to_ask") return "situation_context_pack";
  if (panelId === "situation-room-pipelines" && actionId.startsWith("goal_ledger.")) return "situation_goal_ledger_receipt";
  if (panelId === "situation-room-pipelines" && actionId === "goal.evaluate") return "helix_goal_evaluation_receipt";
  if (panelId === "situation-room-pipelines" && actionId === "episode_timeline.summarize_window") return "situation_episode_summary";
  if (panelId === "situation-room-pipelines" && actionId === "callout_policy.set_mode") return "standby_callout_policy_receipt";
  if (panelId === "situation-room-pipelines" && actionId === "voice_delivery.propose_from_trace") return "dottie_voice_receipt";
  if (panelId === "situation-room-pipelines" && actionId === "voice_delivery.confirm_speak") return "standby_callout_delivery_receipt";
  if (panelId === "situation-room-pipelines" && actionId.startsWith("live_continuation.")) return "helix_live_continuation_receipt";
  if (panelId === "situation-room-pipelines" && actionId === "worker_lane.run") return "helix_worker_lane_receipt";
  if (panelId === "situation-room-pipelines" && actionId === "source_health.query") return "helix_live_source_admission_receipt";
  if (panelId === "workstation-process-graph" && actionId !== "open") {
    if (actionId === "export_svg") return "workstation_process_graph_svg";
    if (actionId === "get_context_pack") return "workstation_process_graph_context_pack";
    return "workstation_process_graph_snapshot";
  }
  if (panelId === "situation-room-pipelines" && actionId === "attach_job_to_helix_ask") return "situation_room_job_attachment";
  if (panelId === "situation-room-pipelines" && actionId === "save_job_as_note") return "workstation_note";
  if (panelId === "mission-ethos" && actionId === "compare_motive_to_zen") return "ideology_motive_comparison_receipt";
  if (panelId === "mission-ethos" && actionId !== "open") return "ideology_context_receipt";
  if (panelId === "workstation-notes" && ["create_note", "append_to_note", "rename_note", "delete_note"].includes(actionId)) {
    return "note_update_receipt";
  }
  if (panelId === "workstation-notes" && ["create_live_note_sink", "append_live_note_chunk"].includes(actionId)) return "live_output_sink_receipt";
  if (panelId === "docs-viewer" && actionId !== "open") return "doc_context";
  if (panelId === "workstation-clipboard-history" && actionId !== "open") return "clipboard_context";
  return null;
}

export function buildWorkstationDynamicToolSpec(action: WorkstationDynamicToolActionDefinition): WorkstationDynamicToolSpec {
  const key = `${action.panel_id}.${action.action_id}`;
  const manualOnly = SITUATION_ROOM_MANUAL_ONLY_ACTIONS.has(key);
  return {
    namespace: "workstation",
    name: buildWorkstationToolName(action.panel_id, action.action_id),
    description:
      action.description ??
      `${action.action_id.replace(/_/g, " ")} on ${action.panel_id.replace(/-/g, " ")}.`,
    inputSchema: buildWorkstationToolInputSchema(action),
    deferLoading: action.panel_id.startsWith("situation-room") || action.panel_id === "docs-viewer",
    risk: action.risk ?? "low",
    returns_artifact: action.returns_artifact ?? action.action_id !== "open",
    requires_confirmation: action.requires_confirmation ?? false,
    panel_id: action.panel_id,
    action_id: action.action_id,
    terminal_artifact_kind: resolveWorkstationToolTerminalArtifactKind(action.panel_id, action.action_id),
    ...(manualOnly
      ? {
          attachment_policy: "manual_only" as const,
          context_injection: "explicit_attachment_only" as const,
        }
      : {}),
  };
}

export const WORKSTATION_AFFORDANCE_VERSION = "e301.workstation-affordance.v1";

function resolveAffordanceFamily(panelId: string, actionId: string): HelixWorkstationAffordanceFamily {
  if (panelId === "scientific-calculator") {
    return actionId.includes("live") || actionId.includes("stream") || actionId.includes("tick")
      ? "live_source"
      : "calculation";
  }
  if (panelId === "workstation-notes") return "notes";
  if (panelId === "docs-viewer") return "documents";
  if (panelId === "mission-ethos") return "ideology";
  if (panelId === "workstation-clipboard-history") return "clipboard";
  if (panelId === "workstation-storage-map") return "storage";
  if (panelId === "workstation-workflow-timeline" || panelId === "workstation-process-graph" || panelId === "workstation-task-manager" || panelId === "agi-task-history") return "history";
  if (panelId === "agi-essence-console") return "debug";
  if (panelId === "situation-room-sources") return "live_source";
  if (panelId === "situation-room-pipelines") {
    if (actionId.startsWith("live_continuation.") || actionId === "worker_lane.run" || actionId === "goal.evaluate" || actionId === "source_health.query") return "situation_room";
    if (actionId.includes("live_answer") || actionId.includes("line_schema")) return "live_answer_environment";
    if (actionId.includes("live_source") || actionId.includes("live-source") || actionId === "attach_live_source") return "live_source";
    return "situation_room";
  }
  return "admin";
}

function resolveAffordanceExecutionTarget(panelId: string, actionId: string): HelixWorkstationAffordance["execution_target"] {
  if (panelId.startsWith("situation-room")) return "hybrid";
  if (panelId === "scientific-calculator" && (actionId.includes("stream") || actionId.includes("live") || actionId.includes("tick"))) {
    return "hybrid";
  }
  return "client";
}

function resolveAffordanceBackendEndpoint(panelId: string, actionId: string): string | null {
  if (panelId === "situation-room-pipelines" && actionId === "create_live_answer_environment") {
    return "/api/agi/situation/live-answer-environment/create";
  }
  if (panelId === "situation-room-pipelines" && actionId === "create_live_workstation_pipeline") {
    return "/api/agi/situation/live-workstation-pipeline/create";
  }
  if (panelId === "situation-room-pipelines" && actionId === "start_situation_goal_session") {
    return "/api/agi/situation/goal-session/start";
  }
  if (panelId === "situation-room-pipelines" && actionId === "set_live_commentary_policy") {
    return "/api/agi/situation/live-commentary/session";
  }
  if (panelId === "situation-room-pipelines" && actionId === "request_agentic_review") {
    return "/api/agi/situation/live-agentic-review/request";
  }
  if (panelId === "situation-room-pipelines" && actionId === "set_companion_policy") {
    return "/api/agi/situation/companion-policy";
  }
  if (panelId === "situation-room-pipelines" && actionId === "live-source.set_rate") {
    return "/api/agi/situation/live-source/producer/set-cadence";
  }
  if (panelId === "situation-room-pipelines" && actionId.startsWith("live_continuation.")) {
    return `/api/agi/situation/live-continuation/${actionId.slice("live_continuation.".length)}`;
  }
  if (panelId === "situation-room-pipelines" && actionId === "worker_lane.run") {
    return "/api/agi/situation/live-continuation/worker-lane/run";
  }
  if (panelId === "situation-room-pipelines" && actionId === "goal.evaluate") {
    return "/api/agi/situation/live-continuation/goal/evaluate";
  }
  if (panelId === "situation-room-pipelines" && actionId === "source_health.query") {
    return "/api/agi/situation/live-continuation/source-health/query";
  }
  if (panelId === "scientific-calculator" && (actionId.includes("stream") || actionId.includes("live") || actionId.includes("tick"))) {
    return "/api/agi/situation/live-source/event";
  }
  return null;
}

function resolveExpectedStateChange(panelId: string, actionId: string): HelixWorkstationAffordance["expected_state_change"] {
  if (panelId === "scientific-calculator" && (actionId === "ingest_latex" || actionId === "solve_expression" || actionId === "solve_with_steps")) {
    return { store: "useScientificCalculatorStore", selector_hint: "lastSolve", proof_key: "trace" };
  }
  if (panelId === "scientific-calculator" && (actionId.includes("stream") || actionId.includes("live") || actionId.includes("tick"))) {
    return { store: "useScientificCalculatorLiveSourceStore", selector_hint: "latestTick/status", proof_key: "workstation_live_source_receipt" };
  }
  if (panelId === "workstation-notes") {
    return { store: "useWorkstationNotesStore", selector_hint: "notes/order/active_note_id", proof_key: "note_id" };
  }
  if (panelId === "mission-ethos") {
    return { store: "IdeologyPanel/useIdeology", selector_hint: "selected node/context receipt", proof_key: "ideology_context_receipt" };
  }
  if (panelId.startsWith("situation-room")) {
    return { store: "situation-room-runtime", selector_hint: "receipt or active artifact", proof_key: "expected_receipt_kind" };
  }
  return null;
}

function resolveAffordanceContextPolicy(panelId: string, actionId: string): HelixWorkstationAffordance["context_policy"] {
  if (SITUATION_ROOM_MANUAL_ONLY_ACTIONS.has(`${panelId}.${actionId}`)) return "explicit_attachment_only";
  if (panelId === "agi-essence-console" || actionId.includes("debug")) return "debug_only";
  return "compact_context_only";
}

export function buildWorkstationAffordance(action: WorkstationDynamicToolActionDefinition): HelixWorkstationAffordance {
  const tool = buildWorkstationDynamicToolSpec(action);
  const key = `${action.panel_id}.${action.action_id}`;
  const risk = action.risk ?? "low";
  return {
    schema: HELIX_WORKSTATION_AFFORDANCE_SCHEMA,
    affordance_id: key,
    panel_id: action.panel_id,
    action_id: action.action_id,
    label: action.title ?? action.action_id.replace(/_/g, " "),
    family: resolveAffordanceFamily(action.panel_id, action.action_id),
    description: action.description ?? tool.description,
    input_schema: tool.inputSchema,
    output_schema: tool.terminal_artifact_kind
      ? {
          type: "object",
          required: ["ok"],
          properties: {
            ok: { type: "boolean" },
            kind: { const: tool.terminal_artifact_kind },
          },
        }
      : undefined,
    risk,
    confirmation_policy: action.requires_confirmation ? "always" : risk === "high" ? "on_high_risk" : "never",
    execution_target: resolveAffordanceExecutionTarget(action.panel_id, action.action_id),
    backend_endpoint: resolveAffordanceBackendEndpoint(action.panel_id, action.action_id),
    client_handler_key: key,
    expected_receipt_kind: tool.terminal_artifact_kind ?? "workspace_action_receipt",
    expected_state_change: resolveExpectedStateChange(action.panel_id, action.action_id),
    context_policy: resolveAffordanceContextPolicy(action.panel_id, action.action_id),
    deterministic_content_role: "observation_not_assistant_answer",
  };
}

export function buildWorkstationAffordances(
  actions: WorkstationDynamicToolActionDefinition[] = WORKSTATION_DYNAMIC_TOOL_ACTIONS,
): HelixWorkstationAffordance[] {
  return actions.map(buildWorkstationAffordance);
}

export const WORKSTATION_AFFORDANCES: HelixWorkstationAffordance[] = buildWorkstationAffordances();

export function findWorkstationAffordance(
  panelId: string,
  actionId: string,
  affordances: readonly HelixWorkstationAffordance[] = WORKSTATION_AFFORDANCES,
): HelixWorkstationAffordance | null {
  const key = `${panelId}.${actionId}`;
  return affordances.find((affordance) => affordance.affordance_id === key) ?? null;
}

export function buildWorkstationDynamicTools(
  actions: WorkstationDynamicToolActionDefinition[] = WORKSTATION_DYNAMIC_TOOL_ACTIONS,
): WorkstationDynamicToolSpec[] {
  return actions.map(buildWorkstationDynamicToolSpec);
}

export function buildWorkstationDynamicToolsFromCapabilities(
  capabilities: PanelCapabilitiesLike,
): WorkstationDynamicToolSpec[] {
  const actions = Object.entries(capabilities).flatMap(([panelId, capability]: [string, PanelCapabilitiesLike[string]]) =>
    capability.actions.map((action: PanelCapabilitiesLike[string]["actions"][number]) => ({
      panel_id: panelId,
      action_id: action.id,
      title: action.title,
      description: action.description,
      risk: action.risk,
      aliases: action.aliases,
      required_args: action.required_args ?? [],
      optional_args: action.optional_args ?? [],
      requires_confirmation: action.requires_confirmation,
      returns_artifact: action.returns_artifact,
    })),
  );
  return buildWorkstationDynamicTools(actions);
}

export function findWorkstationDynamicTool(
  toolName: string,
  tools: WorkstationDynamicToolSpec[] = buildWorkstationDynamicTools(),
): WorkstationDynamicToolSpec | null {
  const normalized = normalizeIdentifier(toolName);
  return tools.find((tool: WorkstationDynamicToolSpec) => normalizeIdentifier(tool.name) === normalized) ?? null;
}

export function mapWorkstationDynamicToolCallToAction(
  toolName: string,
  args: Record<string, unknown> | undefined,
  tools: WorkstationDynamicToolSpec[] = buildWorkstationDynamicTools(),
): WorkstationDynamicToolCallMapping {
  const tool = findWorkstationDynamicTool(toolName, tools);
  if (!tool) return { ok: false, reason: "unknown_tool", missing_required_args: [] };
  const required = Array.isArray(tool.inputSchema.required) ? tool.inputSchema.required.filter((arg: unknown): arg is string => typeof arg === "string") : [];
  const missing = required.filter((arg: string) => args?.[arg] === undefined || args?.[arg] === null || args?.[arg] === "");
  if (missing.length > 0) {
    return { ok: false, reason: "missing_required_args", missing_required_args: missing };
  }
  if (tool.action_id === "open") {
    return {
      ok: true,
      action: {
        schema_version: "helix.workstation.action/v1",
        action: "open_panel",
        panel_id: tool.panel_id,
      },
    };
  }
  return {
    ok: true,
    action: {
      schema_version: "helix.workstation.action/v1",
      action: "run_panel_action",
      panel_id: tool.panel_id,
      action_id: tool.action_id,
      args,
    },
  };
}
