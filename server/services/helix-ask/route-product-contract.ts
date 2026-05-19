import type { HelixAskSourceTargetIntent } from "@shared/helix-ask-source-target-intent";
import {
  HELIX_ROUTE_PRODUCT_CONTRACT_SCHEMA,
  type HelixRouteProductContract,
  type HelixRouteProductSourceTarget,
} from "@shared/helix-route-product-contract";
import { isSceneEpochReplayPrompt } from "./scene-epoch-replay-intent";

const DOC_VIEWER_ALLOWED_TERMINAL_PRODUCTS = [
  "doc_location_result",
  "docs_viewer_receipt",
  "doc_evidence_location",
  "doc_location_matches",
  "workspace_action_receipt",
  "workstation_tool_evaluation",
  "tool_evaluation",
  "request_user_input",
  "typed_failure",
];

const DOC_VIEWER_FORBIDDEN_TERMINAL_PRODUCTS = [
  "situation_context_pack",
  "visual_context_pack",
  "visual_frame_evidence",
  "live_card_projection",
  "no_tool_direct",
  "model_only_concept",
];

const VISUAL_ALLOWED_TERMINAL_PRODUCTS = [
  "live_visual_answer",
  "live_source_typed_failure",
  "situation_context_pack",
  "procedure_epoch_replay",
  "visual_frame_evidence",
  "request_user_input",
  "typed_failure",
];

const VISUAL_FORBIDDEN_TERMINAL_PRODUCTS = [
  "doc_location_result",
  "doc_evidence_location",
  "doc_location_matches",
  "doc_summary",
  "active_doc_identity",
  "live_pipeline_receipt",
  "client_projection",
  "model_only_concept",
  "no_tool_direct",
  "panel_generated_answer",
];

const PROCEDURE_ALLOWED_TERMINAL_PRODUCTS = [
  "interpretation_epoch_delta",
  "live_interpretation_delta",
  "procedure_epoch_replay",
  "procedure_memory_recall",
  "visual_scene_comparison_result",
  "selected_visual_scene_set",
  "situation_context_pack",
  "situation_context_pack_with_epoch_evidence",
  "request_user_input",
  "typed_failure",
  "procedure_memory_unavailable",
  "procedure_epoch_previous_unavailable",
];

const PROCEDURE_FORBIDDEN_TERMINAL_PRODUCTS = [
  "process_graph_overview",
  "docs_viewer_receipt",
  "doc_location_result",
  "active_doc_identity",
  "active_doc_summary",
  "workspace_action_receipt",
  "live_pipeline_receipt",
  "live_environment_binding_diagnosis",
  "no_tool_direct",
  "model_only_concept",
];

const PROCEDURE_EPOCH_REPLAY_ALLOWED_TERMINAL_PRODUCTS = [
  "interpretation_epoch_delta",
  "live_interpretation_delta",
  "procedure_epoch_replay",
  "typed_failure",
];

const PROCEDURE_EPOCH_REPLAY_FORBIDDEN_TERMINAL_PRODUCTS = [
  "process_graph_overview",
  "doc_location_result",
  "active_doc_identity",
  "active_doc_summary",
  "workspace_action_receipt",
  "live_pipeline_receipt",
  "live_environment_binding_diagnosis",
  "visual_scene_comparison_result",
  "selected_visual_scene_set",
  "situation_context_pack",
  "situation_context_pack_with_epoch_evidence",
  "procedure_memory_recall",
  "procedure_memory_unavailable",
  "procedure_epoch_previous_unavailable",
  "no_tool_direct",
  "model_only_concept",
];

const REPO_CODE_ALLOWED_TERMINAL_PRODUCTS = [
  "repo_code_evidence_answer",
  "repo_entity_definition",
  "tool_evaluation",
  "workstation_tool_evaluation",
  "request_user_input",
  "typed_failure",
];

const REPO_CODE_FORBIDDEN_TERMINAL_PRODUCTS = [
  "direct_answer_text",
  "no_tool_direct",
  "model_only_concept",
  "process_graph_overview",
  "situation_context_pack",
  "visual_context_pack",
  "visual_frame_evidence",
  "live_card_projection",
  "active_doc_identity",
  "doc_summary",
  "doc_location_matches",
  "doc_evidence_location",
];

const LIVE_PIPELINE_ALLOWED_TERMINAL_PRODUCTS = [
  "live_pipeline_receipt",
  "live_environment_binding_diagnosis",
  "visual_producer_cadence_receipt",
  "live_workstation_pipeline_receipt",
  "workspace_action_receipt",
  "workstation_tool_evaluation",
  "tool_evaluation",
  "request_user_input",
  "typed_failure",
];

const LIVE_PIPELINE_FORBIDDEN_TERMINAL_PRODUCTS = [
  "situation_context_pack",
  "procedure_epoch_replay",
  "visual_context_pack",
  "doc_location_result",
  "doc_evidence_location",
  "doc_location_matches",
  "doc_summary",
  "active_doc_identity",
  "no_tool_direct",
  "model_only_concept",
];

const WORLD_ALLOWED_TERMINAL_PRODUCTS = [
  "situation_context_pack",
  "source_binding_status",
  "source_binding_repair_candidate",
  "source_binding_procedure",
  "workspace_action_receipt",
  "workstation_tool_evaluation",
  "request_user_input",
  "typed_failure",
];

const DEFAULT_ALLOWED_TERMINAL_PRODUCTS = [
  "direct_answer_text",
  "workspace_action_receipt",
  "workstation_tool_evaluation",
  "tool_evaluation",
  "request_user_input",
  "typed_failure",
  "active_doc_identity",
  "doc_summary",
  "doc_open_receipt",
  "doc_location_matches",
  "doc_evidence_location",
  "situation_context_pack",
  "visual_frame_evidence",
  "composite_turn_receipt",
  "pending_server_request",
];

const normalizeSourceTarget = (
  sourceTarget: unknown,
): HelixRouteProductSourceTarget => {
  if (
    sourceTarget === "visual_capture" ||
    sourceTarget === "active_doc" ||
    sourceTarget === "docs_viewer" ||
    sourceTarget === "live_pipeline" ||
    sourceTarget === "active_note" ||
    sourceTarget === "repo_code" ||
    sourceTarget === "situation_epoch" ||
    sourceTarget === "process_graph" ||
    sourceTarget === "workstation_state" ||
    sourceTarget === "workstation_panel" ||
    sourceTarget === "general_background" ||
    sourceTarget === "procedure_memory" ||
    sourceTarget === "world_event" ||
    sourceTarget === "workspace_action" ||
    sourceTarget === "model_only" ||
    sourceTarget === "unknown"
  ) {
    return sourceTarget;
  }
  return "unknown";
};

export const isStructuredDocsViewerPrompt = (promptText: string): boolean => {
  const prompt = promptText.trim();
  const docsViewerCue =
    /\bcurrent\s+docs?\s+viewer\s+context\b/i.test(prompt) ||
    /\bdocs?\s+viewer\b/i.test(prompt);
  const structuredPathCue = /^\s*Document\s+path\s*:/im.test(prompt);
  const locateQueryCue = /^\s*Locate\s+query\s*:/im.test(prompt);
  const locationsListCue =
    /\bReturn\s+a\s+short\s+"?Locations:"?\s+list\b/i.test(prompt) ||
    /\banchors?\/sections?\b/i.test(prompt) ||
    /\bevidence\s+snippets?\b/i.test(prompt);
  return (docsViewerCue && (structuredPathCue || locateQueryCue || locationsListCue)) ||
    (structuredPathCue && locateQueryCue && locationsListCue);
};

export function buildRouteProductContract(input: {
  turnId: string;
  threadId?: string | null;
  sourceTargetIntent?: HelixAskSourceTargetIntent | Record<string, unknown> | null;
  promptText?: string | null;
}): HelixRouteProductContract {
  const promptText = input.promptText ?? "";
  const sourceTarget = isStructuredDocsViewerPrompt(promptText)
    ? "docs_viewer"
    : normalizeSourceTarget((input.sourceTargetIntent as Record<string, unknown> | null | undefined)?.target_source);
  const sourceTargetRecord = input.sourceTargetIntent as Record<string, unknown> | null | undefined;
  const requestedOutputs = Array.isArray(sourceTargetRecord?.requested_outputs)
    ? sourceTargetRecord.requested_outputs
    : [];
  const targetKind = normalizeSourceTarget(sourceTargetRecord?.target_kind);
  const strictProcedureEpochReplay =
    (sourceTarget === "procedure_memory" || sourceTarget === "situation_epoch") &&
    targetKind === "situation_epoch" &&
    (requestedOutputs.includes("procedure_epoch_replay") || isSceneEpochReplayPrompt(promptText));

  if (sourceTarget === "docs_viewer") {
    return {
      schema: HELIX_ROUTE_PRODUCT_CONTRACT_SCHEMA,
      turn_id: input.turnId,
      thread_id: input.threadId ?? "",
      source_target: "docs_viewer",
      allowed_terminal_artifact_kinds: DOC_VIEWER_ALLOWED_TERMINAL_PRODUCTS,
      forbidden_terminal_artifact_kinds: DOC_VIEWER_FORBIDDEN_TERMINAL_PRODUCTS,
      required_artifact_refs: [],
      precedence_reason: "docs_viewer_source_target_allows_only_document_terminal_products",
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (sourceTarget === "visual_capture") {
    return {
      schema: HELIX_ROUTE_PRODUCT_CONTRACT_SCHEMA,
      turn_id: input.turnId,
      thread_id: input.threadId ?? "",
      source_target: "visual_capture",
      allowed_terminal_artifact_kinds: VISUAL_ALLOWED_TERMINAL_PRODUCTS,
      forbidden_terminal_artifact_kinds: VISUAL_FORBIDDEN_TERMINAL_PRODUCTS,
      required_artifact_refs: [],
      precedence_reason: "visual_source_target_allows_only_visual_terminal_products",
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (sourceTarget === "procedure_memory" || sourceTarget === "situation_epoch") {
    if (strictProcedureEpochReplay) {
      return {
        schema: HELIX_ROUTE_PRODUCT_CONTRACT_SCHEMA,
        turn_id: input.turnId,
        thread_id: input.threadId ?? "",
        source_target: sourceTarget,
        allowed_terminal_artifact_kinds: PROCEDURE_EPOCH_REPLAY_ALLOWED_TERMINAL_PRODUCTS,
        forbidden_terminal_artifact_kinds: PROCEDURE_EPOCH_REPLAY_FORBIDDEN_TERMINAL_PRODUCTS,
        side_artifact_kinds_allowed: ["live_environment_binding_diagnosis"],
        required_artifact_refs: [],
        precedence_reason: "procedure_memory_situation_epoch_requires_epoch_replay_or_typed_failure",
        assistant_answer: false,
        raw_content_included: false,
      };
    }
    return {
      schema: HELIX_ROUTE_PRODUCT_CONTRACT_SCHEMA,
      turn_id: input.turnId,
      thread_id: input.threadId ?? "",
      source_target: sourceTarget,
      allowed_terminal_artifact_kinds: PROCEDURE_ALLOWED_TERMINAL_PRODUCTS,
      forbidden_terminal_artifact_kinds: PROCEDURE_FORBIDDEN_TERMINAL_PRODUCTS,
      side_artifact_kinds_allowed: ["live_environment_binding_diagnosis"],
      required_artifact_refs: [],
      precedence_reason: "procedure_memory_source_target_allows_only_epoch_recall_terminal_products",
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (sourceTarget === "repo_code") {
    return {
      schema: HELIX_ROUTE_PRODUCT_CONTRACT_SCHEMA,
      turn_id: input.turnId,
      thread_id: input.threadId ?? "",
      source_target: "repo_code",
      allowed_terminal_artifact_kinds: REPO_CODE_ALLOWED_TERMINAL_PRODUCTS,
      forbidden_terminal_artifact_kinds: REPO_CODE_FORBIDDEN_TERMINAL_PRODUCTS,
      required_artifact_refs: [],
      precedence_reason: "repo_code_source_target_allows_only_repo_evidence_terminal_products",
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (sourceTarget === "live_pipeline") {
    return {
      schema: HELIX_ROUTE_PRODUCT_CONTRACT_SCHEMA,
      turn_id: input.turnId,
      thread_id: input.threadId ?? "",
      source_target: "live_pipeline",
      allowed_terminal_artifact_kinds: LIVE_PIPELINE_ALLOWED_TERMINAL_PRODUCTS,
      forbidden_terminal_artifact_kinds: LIVE_PIPELINE_FORBIDDEN_TERMINAL_PRODUCTS,
      required_artifact_refs: [],
      precedence_reason: "live_pipeline_source_target_allows_only_receipt_terminal_products",
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (sourceTarget === "world_event") {
    return {
      schema: HELIX_ROUTE_PRODUCT_CONTRACT_SCHEMA,
      turn_id: input.turnId,
      thread_id: input.threadId ?? "",
      source_target: "world_event",
      allowed_terminal_artifact_kinds: WORLD_ALLOWED_TERMINAL_PRODUCTS,
      forbidden_terminal_artifact_kinds: ["active_doc_identity", "doc_location_matches", "doc_evidence_location"],
      required_artifact_refs: [],
      precedence_reason: "world_event_source_target_allows_world_and_binding_terminal_products",
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  return {
    schema: HELIX_ROUTE_PRODUCT_CONTRACT_SCHEMA,
    turn_id: input.turnId,
    thread_id: input.threadId ?? "",
    source_target: sourceTarget,
    allowed_terminal_artifact_kinds: DEFAULT_ALLOWED_TERMINAL_PRODUCTS,
    forbidden_terminal_artifact_kinds: [],
    required_artifact_refs: [],
    precedence_reason: "default_terminal_product_contract",
    assistant_answer: false,
    raw_content_included: false,
  };
}
