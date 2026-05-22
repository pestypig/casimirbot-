import type { HelixAskSourceTargetIntent } from "@shared/helix-ask-source-target-intent";
import type { HelixRouteProductContract } from "@shared/helix-route-product-contract";
import {
  HELIX_TOOL_CALL_ADMISSION_DECISION_SCHEMA,
  type HelixToolCallAdmissionDecision,
  type HelixToolCallAdmissionFamily,
} from "@shared/helix-tool-call-admission";

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const HARD_SOURCE_TARGETS = new Set([
  "visual_capture",
  "procedure_memory",
  "situation_epoch",
  "visual_scene_memory",
  "repo_code",
  "runtime_evidence",
  "docs_viewer",
  "active_doc",
  "process_graph",
  "live_pipeline",
  "world_event",
  "active_note",
  "workspace_panel",
  "workstation_panel",
  "workspace_action",
  "calculator_stream",
]);

export function buildToolCallAdmissionDecision(input: {
  turnId: string;
  sourceTargetIntent?: HelixAskSourceTargetIntent | Record<string, unknown> | null;
  routeProductContract?: HelixRouteProductContract | Record<string, unknown> | null;
  promptText?: string | null;
}): HelixToolCallAdmissionDecision {
  const sourceTarget = String(
    (input.sourceTargetIntent as Record<string, unknown> | null | undefined)?.target_source ??
    (input.routeProductContract as Record<string, unknown> | null | undefined)?.source_target ??
    "unknown",
  );
  const sourceTargetKind = String(
    (input.sourceTargetIntent as Record<string, unknown> | null | undefined)?.target_kind ?? "",
  );
  const contractForbidden = Array.isArray((input.routeProductContract as Record<string, unknown> | null | undefined)?.forbidden_terminal_artifact_kinds)
    ? (input.routeProductContract as Record<string, unknown>).forbidden_terminal_artifact_kinds as string[]
    : [];
  const sourceForbiddenRoutes = Array.isArray((input.sourceTargetIntent as Record<string, unknown> | null | undefined)?.suppressed_routes)
    ? (input.sourceTargetIntent as Record<string, unknown>).suppressed_routes as string[]
    : [];
  const promptText = String(input.promptText ?? "");

  let required = HARD_SOURCE_TARGETS.has(sourceTarget);
  let admittedToolFamilies: HelixToolCallAdmissionFamily[] = [];
  let extraForbiddenTerminalKinds: string[] = [];
  let extraForbiddenRoutes: string[] = [];
  let reason = "source_target_requires_evidence_path";

  if (sourceTarget === "docs_viewer") {
    admittedToolFamilies = ["docs_viewer"];
    extraForbiddenTerminalKinds = ["situation_context_pack", "visual_context_pack", "live_card_projection", "no_tool_direct", "model_only_concept"];
    extraForbiddenRoutes = ["situation_context_question", "visual_deictic"];
    reason = "docs_viewer_requires_document_tool_path";
  } else if (
    sourceTarget === "unknown" &&
    /\b(?:open|show|pull\s+up|bring\s+up)\b[\s\S]{0,120}\b(?:docs?|docks|document|white\s*paper|whitepaper|paper)\b/i.test(promptText)
  ) {
    required = true;
    admittedToolFamilies = ["docs_viewer"];
    extraForbiddenTerminalKinds = ["situation_context_pack", "visual_context_pack", "live_card_projection", "no_tool_direct", "model_only_concept"];
    extraForbiddenRoutes = ["situation_context_question", "visual_deictic"];
    reason = "document_open_prompt_requires_docs_viewer_path";
  } else if (sourceTarget === "workspace_panel" || sourceTarget === "workstation_panel" || sourceTarget === "workspace_action") {
    admittedToolFamilies = ["workstation_action"];
    extraForbiddenTerminalKinds = ["situation_context_pack", "visual_context_pack", "live_pipeline_receipt", "active_doc_identity", "doc_open_receipt", "doc_summary", "no_tool_direct", "model_only_concept"];
    extraForbiddenRoutes = ["situation_context_question", "visual_deictic", "visual_frame_evidence", "active_doc_identity", "active_doc_summary", "doc_open_best", "model_only_concept", "no_tool_direct"];
    reason = "workspace_panel_requires_workstation_action_path";
  } else if (sourceTarget === "calculator_stream") {
    admittedToolFamilies = ["calculator", "workstation_action"];
    extraForbiddenTerminalKinds = ["situation_context_pack", "visual_context_pack", "live_pipeline_receipt", "active_doc_identity", "doc_open_receipt", "doc_summary", "no_tool_direct", "model_only_concept", "direct_answer_text"];
    extraForbiddenRoutes = ["situation_context_question", "visual_deictic", "visual_frame_evidence", "active_doc_identity", "active_doc_summary", "doc_open_best", "model_only_concept", "no_tool_direct"];
    reason = "calculator_stream_requires_calculator_tool_path";
  } else if (
    /\b(?:create|add|append|store|save|write)\b[\s\S]{0,80}\b(?:workstation\s+)?notes?\b/i.test(promptText) ||
    /\b(?:workstation\s+)?notes?\b[\s\S]{0,80}\b(?:create|add|append|store|save|write)\b/i.test(promptText)
  ) {
    required = true;
    admittedToolFamilies = ["notes", "workstation_action"];
    extraForbiddenTerminalKinds = ["situation_context_pack", "visual_context_pack", "live_pipeline_receipt", "active_doc_identity", "doc_open_receipt", "doc_summary", "no_tool_direct", "model_only_concept", "direct_answer_text"];
    extraForbiddenRoutes = ["situation_context_question", "visual_deictic", "visual_frame_evidence", "active_doc_identity", "active_doc_summary", "doc_open_best", "model_only_concept", "no_tool_direct"];
    reason = "note_mutation_prompt_requires_notes_tool_path";
  } else if (sourceTarget === "visual_capture") {
    admittedToolFamilies = ["situation_run"];
    extraForbiddenTerminalKinds = ["active_doc_identity", "doc_summary", "doc_location_matches", "live_pipeline_receipt", "client_projection", "no_tool_direct", "model_only_concept", "panel_generated_answer"];
    extraForbiddenRoutes = ["active_doc_identity", "active_doc_summary", "doc_open_best", "live_pipeline_receipt", "client_projection", "model_only_concept", "no_tool_direct", "panel_generated_answer"];
    reason = "visual_capture_requires_situation_run_path";
  } else if (sourceTarget === "procedure_memory" || sourceTarget === "situation_epoch") {
    if (sourceTargetKind === "visual_scene_memory") {
      admittedToolFamilies = ["visual_scene_memory", "procedure_memory", "situation_run"];
      extraForbiddenTerminalKinds = ["process_graph_overview", "live_environment_binding_diagnosis", "live_pipeline_receipt", "situation_context_pack", "no_tool_direct", "model_only_concept"];
      extraForbiddenRoutes = ["process_graph_overview", "live_environment_binding_diagnosis", "model_only_concept", "no_tool_direct"];
      reason = "visual_scene_memory_requires_scene_memory_path";
    } else {
      admittedToolFamilies = ["procedure_memory", "situation_run"];
      extraForbiddenTerminalKinds = ["process_graph_overview", "docs_viewer_receipt", "doc_location_result", "active_doc_identity", "active_doc_summary", "workspace_action_receipt", "live_pipeline_receipt", "live_environment_binding_diagnosis", "no_tool_direct", "model_only_concept"];
      extraForbiddenRoutes = ["process_graph_overview", "active_doc_identity", "live_environment_binding_diagnosis", "model_only_concept", "no_tool_direct"];
      reason = "procedure_memory_requires_epoch_replay_path";
    }
  } else if (sourceTarget === "visual_scene_memory") {
    admittedToolFamilies = ["visual_scene_memory", "procedure_memory", "situation_run"];
    extraForbiddenTerminalKinds = ["process_graph_overview", "live_environment_binding_diagnosis", "live_pipeline_receipt", "situation_context_pack", "no_tool_direct", "model_only_concept"];
    extraForbiddenRoutes = ["process_graph_overview", "live_environment_binding_diagnosis", "model_only_concept", "no_tool_direct"];
    reason = "visual_scene_memory_requires_scene_memory_path";
  } else if (sourceTarget === "repo_code" || sourceTarget === "runtime_evidence") {
    admittedToolFamilies = sourceTarget === "runtime_evidence" ? ["repo_code", "runtime_evidence"] : ["repo_code"];
    extraForbiddenTerminalKinds = ["direct_answer_text", "no_tool_direct", "model_only_concept", "process_graph_overview", "situation_context_pack"];
    extraForbiddenRoutes = ["situation_context_question", "process_graph_overview", "model_only_concept"];
    reason = "repo_code_requires_repo_evidence_path";
  } else if (sourceTarget === "live_pipeline") {
    admittedToolFamilies = ["live_pipeline"];
    extraForbiddenTerminalKinds = ["situation_context_pack", "doc_summary", "active_doc_identity", "no_tool_direct", "model_only_concept"];
    extraForbiddenRoutes = ["situation_context_question", "active_doc_identity", "model_only_concept"];
    reason = "live_pipeline_requires_receipt_presentation_path";
  } else if (sourceTarget === "world_event") {
    admittedToolFamilies = ["world_event"];
    extraForbiddenTerminalKinds = ["active_doc_identity", "doc_location_matches", "no_tool_direct", "model_only_concept"];
    reason = "world_event_requires_world_source_path";
  } else if (sourceTarget === "active_note") {
    admittedToolFamilies = ["notes"];
    reason = "active_note_requires_note_tool_path";
  } else if (sourceTarget === "process_graph") {
    admittedToolFamilies = ["process_graph"];
    extraForbiddenTerminalKinds = ["procedure_epoch_replay", "visual_scene_comparison_result", "repo_code_evidence_answer", "doc_location_result", "situation_context_pack", "no_tool_direct", "model_only_concept"];
    extraForbiddenRoutes = ["situation_context_question", "procedure_epoch_replay_question", "visual_deictic", "model_only_concept", "no_tool_direct"];
    reason = "process_graph_requires_workstation_process_path";
  } else if (sourceTarget === "model_only" || sourceTarget === "general_background") {
    required = false;
    admittedToolFamilies = ["model_only"];
    reason = "model_only_direct_answer_allowed";
  } else {
    required = false;
    admittedToolFamilies = ["model_only"];
    reason = "no_hard_tool_path_admitted";
  }

  return {
    schema: HELIX_TOOL_CALL_ADMISSION_DECISION_SCHEMA,
    turn_id: input.turnId,
    source_target: sourceTarget,
    required,
    admitted_tool_families: unique(admittedToolFamilies),
    forbidden_terminal_artifact_kinds: unique([
      ...contractForbidden,
      ...extraForbiddenTerminalKinds,
      ...(required ? ["no_tool_direct", "model_only_concept"] : []),
    ]),
    forbidden_routes: unique([
      ...sourceForbiddenRoutes,
      ...extraForbiddenRoutes,
      ...(required ? ["model_only_concept", "no_tool_direct"] : []),
    ]),
    reason,
    assistant_answer: false,
    raw_content_included: false,
  };
}
