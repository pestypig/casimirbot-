import type { HelixAskSourceTargetIntent } from "@shared/helix-ask-source-target-intent";
import type { HelixRouteProductContract } from "@shared/helix-route-product-contract";
import {
  HELIX_TOOL_CALL_ADMISSION_DECISION_SCHEMA,
  type HelixToolCallAdmissionDecision,
  type HelixToolCallAdmissionFamily,
} from "@shared/helix-tool-call-admission";

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

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
  const contractForbidden = Array.isArray((input.routeProductContract as Record<string, unknown> | null | undefined)?.forbidden_terminal_artifact_kinds)
    ? (input.routeProductContract as Record<string, unknown>).forbidden_terminal_artifact_kinds as string[]
    : [];
  const sourceForbiddenRoutes = Array.isArray((input.sourceTargetIntent as Record<string, unknown> | null | undefined)?.suppressed_routes)
    ? (input.sourceTargetIntent as Record<string, unknown>).suppressed_routes as string[]
    : [];

  let required = sourceTarget !== "unknown" && sourceTarget !== "model_only" && sourceTarget !== "general_background";
  let admittedToolFamilies: HelixToolCallAdmissionFamily[] = [];
  let extraForbiddenTerminalKinds: string[] = [];
  let extraForbiddenRoutes: string[] = [];
  let reason = "source_target_requires_evidence_path";

  if (sourceTarget === "docs_viewer") {
    admittedToolFamilies = ["docs_viewer"];
    extraForbiddenTerminalKinds = ["situation_context_pack", "visual_context_pack", "live_card_projection", "no_tool_direct", "model_only_concept"];
    extraForbiddenRoutes = ["situation_context_question", "visual_deictic"];
    reason = "docs_viewer_requires_document_tool_path";
  } else if (sourceTarget === "visual_capture") {
    admittedToolFamilies = ["situation_run"];
    extraForbiddenTerminalKinds = ["active_doc_identity", "doc_summary", "doc_location_matches", "live_pipeline_receipt", "client_projection", "no_tool_direct", "model_only_concept", "panel_generated_answer"];
    extraForbiddenRoutes = ["active_doc_identity", "active_doc_summary", "doc_open_best", "live_pipeline_receipt", "client_projection", "model_only_concept", "no_tool_direct", "panel_generated_answer"];
    reason = "visual_capture_requires_situation_run_path";
  } else if (sourceTarget === "procedure_memory" || sourceTarget === "situation_epoch") {
    admittedToolFamilies = ["procedure_memory", "situation_run"];
    extraForbiddenTerminalKinds = ["process_graph_overview", "docs_viewer_receipt", "doc_location_result", "active_doc_identity", "active_doc_summary", "workspace_action_receipt", "live_pipeline_receipt", "live_environment_binding_diagnosis", "no_tool_direct", "model_only_concept"];
    extraForbiddenRoutes = ["process_graph_overview", "active_doc_identity"];
    reason = "procedure_memory_requires_epoch_replay_path";
  } else if (sourceTarget === "repo_code") {
    admittedToolFamilies = ["repo_code"];
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
    forbidden_terminal_artifact_kinds: unique([...contractForbidden, ...extraForbiddenTerminalKinds]),
    forbidden_routes: unique([...sourceForbiddenRoutes, ...extraForbiddenRoutes]),
    reason,
    assistant_answer: false,
    raw_content_included: false,
  };
}
