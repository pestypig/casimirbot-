export type HelixApiParitySeedKind =
  | "active_visual_situation_run"
  | "active_run_with_unbound_visual_source"
  | "live_source_identity_missing_environment_source"
  | "live_source_identity_no_situation_run"
  | "live_source_identity_no_field_evaluations"
  | "live_source_identity_stale_interpretation"
  | "live_source_identity_wrong_environment"
  | "visual_source_available"
  | "visual_frame_with_start_button"
  | "none";

export type HelixApiParityExpected = {
  source_target?: string;
  target_kind?: string;
  terminal_artifact_kind?: string;
  allowed_tool_calls?: string[];
  forbidden_routes?: string[];
  forbidden_terminal_artifacts?: string[];
  forbidden_tool_calls?: string[];
  forbidden_tool_families?: string[];
  forbidden_capability_ids?: string[];
  selected_primary_intent?: string;
  required_contextual_tool_mentions?: string[];
  executable_operator_commands_count?: number;
  required_trace_flags_absent?: string[];
  forbidden_trace_flags?: string[];
  solver_completed?: boolean;
  live_source_identity_diagnosis?: string;
  live_source_identity_ok?: boolean;
};

export type HelixApiParityScenario = {
  id: string;
  description: string;
  enabled: boolean;
  seed: HelixApiParitySeedKind;
  prompt: string;
  expected: HelixApiParityExpected;
};

export const API_PARITY_SCENARIOS: HelixApiParityScenario[] = [
  {
    id: "visual_content_active_source",
    description: "A current-screen question must use visual/SituationRun evidence, not pipeline status.",
    enabled: true,
    seed: "active_visual_situation_run",
    prompt: "What is happening right now in the visual screen capture?",
    expected: {
      source_target: "visual_capture",
      target_kind: "visual_capture",
      terminal_artifact_kind: "situation_context_pack",
      forbidden_routes: ["live_pipeline_control", "process_graph_overview", "no_tool_direct"],
      forbidden_terminal_artifacts: ["live_pipeline_receipt", "client_projection", "process_graph_overview"],
      required_trace_flags_absent: ["receipt_promoted_to_answer", "tool_called_without_admission"],
    },
  },
  {
    id: "visual_content_negated_cadence",
    description: "A visual question containing a negated interval mention must not admit cadence control.",
    enabled: true,
    seed: "active_visual_situation_run",
    prompt: "Can you review what is happening in the screen capture? I haven't started the interval 10 seconds yet.",
    expected: {
      source_target: "visual_capture",
      target_kind: "visual_capture",
      selected_primary_intent: "content_question",
      required_contextual_tool_mentions: ["interval"],
      executable_operator_commands_count: 0,
      forbidden_routes: ["live_pipeline_control"],
      forbidden_terminal_artifacts: ["live_pipeline_receipt", "visual_producer_cadence_receipt"],
      forbidden_tool_calls: ["situation-room.live-source.set_rate"],
      forbidden_capability_ids: ["situation-room.live-source.set_rate"],
      required_trace_flags_absent: ["receipt_promoted_to_answer", "tool_called_without_admission"],
    },
  },
  {
    id: "visual_content_original_interval_regression",
    description: "The original interval-10s screen-review regression must stay on the visual evidence path.",
    enabled: true,
    seed: "active_visual_situation_run",
    prompt: "all right cool can you review what is happening right now in the screen capture I haven't started the interval 10 seconds yet",
    expected: {
      source_target: "visual_capture",
      target_kind: "visual_capture",
      selected_primary_intent: "content_question",
      required_contextual_tool_mentions: ["interval"],
      executable_operator_commands_count: 0,
      forbidden_routes: ["live_pipeline_control"],
      forbidden_terminal_artifacts: ["live_pipeline_receipt", "visual_producer_cadence_receipt"],
      forbidden_tool_calls: ["situation-room.live-source.set_rate"],
      forbidden_capability_ids: ["situation-room.live-source.set_rate"],
      required_trace_flags_absent: ["receipt_promoted_to_answer", "tool_called_without_admission"],
    },
  },
  {
    id: "procedure_epoch_interval_status",
    description: "A visual-delta plus interval-status question must keep the procedure/visual route primary.",
    enabled: true,
    seed: "active_visual_situation_run",
    prompt: "What changed since the previous visual capture, and was the 10 second interval running?",
    expected: {
      source_target: "procedure_memory",
      forbidden_routes: ["live_pipeline_control"],
      forbidden_terminal_artifacts: ["live_pipeline_receipt", "process_graph_overview"],
      forbidden_tool_calls: ["situation-room.live-source.set_rate"],
      required_trace_flags_absent: ["receipt_promoted_to_answer", "tool_called_without_admission"],
    },
  },
  {
    id: "affirmative_cadence_control",
    description: "An affirmative cadence command may terminate as a live-pipeline control receipt.",
    enabled: true,
    seed: "visual_source_available",
    prompt: "Set the visual capture interval to 10 seconds.",
    expected: {
      source_target: "live_pipeline",
      target_kind: "live_pipeline",
      terminal_artifact_kind: "live_pipeline_receipt",
      allowed_tool_calls: ["situation-room.live-source.set_rate"],
      forbidden_trace_flags: ["receipt_promoted_to_answer", "tool_called_without_admission"],
    },
  },
  {
    id: "contextual_click",
    description: "A contextual click mention inside a screen-review prompt must not become a workstation action.",
    enabled: true,
    seed: "active_visual_situation_run",
    prompt: "Review the current screen before I click Start.",
    expected: {
      source_target: "visual_capture",
      target_kind: "visual_capture",
      forbidden_tool_families: ["workstation_action"],
      forbidden_terminal_artifacts: ["workspace_action_receipt"],
      required_trace_flags_absent: ["tool_called_without_admission", "receipt_promoted_to_answer"],
    },
  },
  {
    id: "capability_catalog_runtime",
    description: "A request for available Helix Ask tools must inspect the runtime capability catalog instead of answering from model-only text.",
    enabled: true,
    seed: "none",
    prompt: "What tools are available for the helix ask to use?",
    expected: {
      source_target: "runtime_evidence",
      terminal_artifact_kind: "capability_help_summary",
      forbidden_routes: ["model_only_concept", "no_tool_direct"],
      forbidden_terminal_artifacts: [
        "direct_answer_text",
        "model_only_concept",
        "model_synthesized_answer",
        "no_tool_direct",
      ],
      forbidden_trace_flags: ["receipt_promoted_to_answer", "tool_called_without_admission"],
    },
  },
  {
    id: "screen_text_start_button",
    description: "Screen text that names a Start button is visual evidence, not an operator command; disabled until input-integrity screen-text policy is separated from route parity.",
    enabled: false,
    seed: "visual_frame_with_start_button",
    prompt: "In the visual screen capture, the screen shows a Start button. Can you explain what is visible?",
    expected: {
      source_target: "visual_capture",
      target_kind: "visual_capture",
      forbidden_tool_calls: ["start", "click"],
      forbidden_tool_families: ["workstation_action", "live_pipeline"],
      forbidden_terminal_artifacts: ["workspace_action_receipt", "live_pipeline_receipt"],
      required_trace_flags_absent: ["tool_called_without_admission", "receipt_promoted_to_answer"],
    },
  },
  {
    id: "historical_tool_mention",
    description: "Historical tool-call diagnosis requires a prior debug-export seed before it can be stable.",
    enabled: false,
    seed: "none",
    prompt: "Why did the last turn call set_rate?",
    expected: {
      source_target: "runtime_evidence",
      forbidden_tool_calls: ["situation-room.live-source.set_rate"],
      forbidden_terminal_artifacts: ["live_pipeline_receipt"],
    },
  },
  {
    id: "live_source_identity_active_bound",
    description: "A visual question with reconciled active environment, producer, SituationRun, field evaluations, and interpretation may answer from visual evidence.",
    enabled: true,
    seed: "active_visual_situation_run",
    prompt: "What is happening right now in the visual screen capture?",
    expected: {
      source_target: "visual_capture",
      target_kind: "visual_capture",
      terminal_artifact_kind: "situation_context_pack",
      forbidden_terminal_artifacts: ["live_pipeline_receipt", "process_graph_overview", "no_tool_direct"],
      live_source_identity_diagnosis: "ok",
      live_source_identity_ok: true,
      solver_completed: true,
    },
  },
  {
    id: "live_source_identity_fresh_unbound",
    description: "A fresh visual source outside the active environment must be diagnosed instead of becoming a pipeline receipt; disabled until the current explicit visual route stops auto-binding this topology before audit capture.",
    enabled: false,
    seed: "active_run_with_unbound_visual_source",
    prompt: "What is happening right now in the visual screen capture?",
    expected: {
      source_target: "visual_capture",
      target_kind: "visual_capture",
      forbidden_terminal_artifacts: ["live_pipeline_receipt", "process_graph_overview", "no_tool_direct"],
      live_source_identity_ok: false,
      solver_completed: false,
    },
  },
  {
    id: "live_source_identity_wrong_environment",
    description: "A fresh visual chunk from the wrong Live Answer environment must remain an identity diagnosis.",
    enabled: true,
    seed: "live_source_identity_wrong_environment",
    prompt: "What is happening right now in the visual screen capture?",
    expected: {
      source_target: "visual_capture",
      target_kind: "visual_capture",
      forbidden_terminal_artifacts: ["live_pipeline_receipt", "process_graph_overview", "no_tool_direct"],
      live_source_identity_diagnosis: "fresh_source_wrong_environment",
      live_source_identity_ok: false,
      solver_completed: false,
    },
  },
  {
    id: "live_source_identity_missing_environment_source",
    description: "An active Live Answer environment without a visual source binding cannot answer as if capture identity were reconciled; top-level Ask may attach the source, so the remaining enabled gate is field evaluation availability.",
    enabled: true,
    seed: "live_source_identity_missing_environment_source",
    prompt: "What is happening right now in the visual screen capture?",
    expected: {
      source_target: "visual_capture",
      target_kind: "visual_capture",
      forbidden_terminal_artifacts: ["live_pipeline_receipt", "process_graph_overview", "no_tool_direct"],
      live_source_identity_diagnosis: "field_evaluations_missing",
      live_source_identity_ok: false,
      solver_completed: false,
    },
  },
  {
    id: "live_source_identity_no_situation_run",
    description: "A bound visual source without a SituationRun is not visual answer authority; top-level Ask may create the SituationRun, so the remaining enabled gate is field evaluation availability.",
    enabled: true,
    seed: "live_source_identity_no_situation_run",
    prompt: "What is happening right now in the visual screen capture?",
    expected: {
      source_target: "visual_capture",
      target_kind: "visual_capture",
      forbidden_terminal_artifacts: ["live_pipeline_receipt", "process_graph_overview", "no_tool_direct"],
      live_source_identity_diagnosis: "field_evaluations_missing",
      live_source_identity_ok: false,
      solver_completed: false,
    },
  },
  {
    id: "live_source_identity_no_field_evaluations",
    description: "A SituationRun without current field evaluations remains non-terminal visual evidence.",
    enabled: true,
    seed: "live_source_identity_no_field_evaluations",
    prompt: "What is happening right now in the visual screen capture?",
    expected: {
      source_target: "visual_capture",
      target_kind: "visual_capture",
      forbidden_terminal_artifacts: ["live_pipeline_receipt", "process_graph_overview", "no_tool_direct"],
      live_source_identity_diagnosis: "field_evaluations_missing",
      live_source_identity_ok: false,
      solver_completed: false,
    },
  },
  {
    id: "live_source_identity_stale_interpretation",
    description: "Stale interpretation availability must be visible as missing interpretation authority.",
    enabled: true,
    seed: "live_source_identity_stale_interpretation",
    prompt: "What is happening right now in the visual screen capture?",
    expected: {
      source_target: "visual_capture",
      target_kind: "visual_capture",
      forbidden_terminal_artifacts: ["live_pipeline_receipt", "process_graph_overview", "no_tool_direct"],
      live_source_identity_diagnosis: "interpretations_missing",
      live_source_identity_ok: false,
      solver_completed: false,
    },
  },
];

export const getEnabledApiParityScenarios = (includeDisabled = false): HelixApiParityScenario[] =>
  API_PARITY_SCENARIOS.filter((scenario: HelixApiParityScenario) => includeDisabled || scenario.enabled);
