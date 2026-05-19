import type { HelixAskSourceTargetIntent } from "@shared/helix-ask-source-target-intent";
import {
  HELIX_ROUTE_PRODUCT_CONTRACT_SCHEMA,
  type HelixRouteProductContract,
  type HelixRouteProductSourceTarget,
} from "@shared/helix-route-product-contract";
import { isSceneEpochReplayPrompt } from "./scene-epoch-replay-intent";

export const CORE_TERMINAL_PRODUCTS = [
  "situation_context_pack",
  "procedure_epoch_replay",
  "visual_scene_comparison_result",
  "live_environment_binding_diagnosis",
  "live_pipeline_receipt",
  "doc_location_result",
  "repo_code_evidence_answer",
] as const;

export const UNIVERSAL_TERMINAL_PRODUCTS = [
  "request_user_input",
  "typed_failure",
] as const;

export const ALL_ROUTE_TERMINAL_PRODUCTS = [
  ...CORE_TERMINAL_PRODUCTS,
  ...UNIVERSAL_TERMINAL_PRODUCTS,
] as const;

type CoreTerminalProduct = (typeof CORE_TERMINAL_PRODUCTS)[number];

function completeContract(
  allowedCore: CoreTerminalProduct[],
  allowedExtra: string[] = [],
  forbiddenExtra: string[] = [],
): Pick<HelixRouteProductContract, "allowed_terminal_artifact_kinds" | "forbidden_terminal_artifact_kinds"> {
  const allowed = [...allowedCore, ...UNIVERSAL_TERMINAL_PRODUCTS];
  return {
    allowed_terminal_artifact_kinds: [...allowed, ...allowedExtra],
    forbidden_terminal_artifact_kinds: [
      ...CORE_TERMINAL_PRODUCTS.filter((kind) => !allowed.includes(kind)),
      ...forbiddenExtra,
    ],
  };
}

function makeContract(input: {
  turnId: string;
  threadId?: string | null;
  sourceTarget: HelixRouteProductSourceTarget;
  allowedCore: CoreTerminalProduct[];
  allowedExtra?: string[];
  forbiddenExtra?: string[];
  precedenceReason: string;
  sideArtifactKindsAllowed?: string[];
}): HelixRouteProductContract {
  return {
    schema: HELIX_ROUTE_PRODUCT_CONTRACT_SCHEMA,
    turn_id: input.turnId,
    thread_id: input.threadId ?? "",
    source_target: input.sourceTarget,
    ...completeContract(input.allowedCore, input.allowedExtra, input.forbiddenExtra),
    ...(input.sideArtifactKindsAllowed ? { side_artifact_kinds_allowed: input.sideArtifactKindsAllowed } : {}),
    required_artifact_refs: [],
    precedence_reason: input.precedenceReason,
    assistant_answer: false,
    raw_content_included: false,
  };
}

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

  if (sourceTarget === "docs_viewer" || sourceTarget === "active_doc") {
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget,
      allowedCore: ["doc_location_result"],
      allowedExtra: ["active_doc_identity", "doc_location_matches", "doc_evidence_location", "doc_summary"],
      forbiddenExtra: ["situation_context_pack_with_epoch_evidence", "visual_context_pack", "visual_frame_evidence", "live_card_projection", "no_tool_direct", "model_only_concept"],
      precedenceReason: "docs_source_target_allows_only_document_terminal_products",
    });
  }

  if (sourceTarget === "visual_capture") {
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget: "visual_capture",
      allowedCore: ["situation_context_pack"],
      allowedExtra: ["live_visual_answer", "live_source_typed_failure", "visual_frame_evidence"],
      forbiddenExtra: ["active_doc_identity", "doc_summary", "doc_location_matches", "doc_evidence_location", "client_projection", "no_tool_direct", "model_only_concept", "panel_generated_answer"],
      precedenceReason: "visual_source_target_allows_current_situation_terminal_products",
    });
  }

  if (sourceTarget === "procedure_memory" || sourceTarget === "situation_epoch") {
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget,
      allowedCore: strictProcedureEpochReplay
        ? ["procedure_epoch_replay"]
        : ["procedure_epoch_replay", "visual_scene_comparison_result", "situation_context_pack"],
      allowedExtra: [
        "interpretation_epoch_delta",
        "live_interpretation_delta",
        "procedure_memory_recall",
        "selected_visual_scene_set",
        "situation_context_pack_with_epoch_evidence",
        "procedure_memory_unavailable",
        "procedure_epoch_previous_unavailable",
      ],
      forbiddenExtra: ["process_graph_overview", "active_doc_identity", "active_doc_summary", "workspace_action_receipt", "no_tool_direct", "model_only_concept"],
      precedenceReason: strictProcedureEpochReplay
        ? "procedure_memory_situation_epoch_requires_epoch_replay_or_scene_comparison"
        : "procedure_memory_source_target_allows_epoch_recall_terminal_products",
      sideArtifactKindsAllowed: ["live_environment_binding_diagnosis"],
    });
  }

  if (sourceTarget === "repo_code") {
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget: "repo_code",
      allowedCore: ["repo_code_evidence_answer"],
      allowedExtra: ["repo_entity_definition", "tool_evaluation", "workstation_tool_evaluation"],
      forbiddenExtra: ["direct_answer_text", "no_tool_direct", "model_only_concept", "process_graph_overview", "visual_context_pack", "visual_frame_evidence", "live_card_projection", "active_doc_identity", "doc_summary", "doc_location_matches", "doc_evidence_location"],
      precedenceReason: "repo_code_source_target_allows_only_repo_evidence_terminal_products",
    });
  }

  if (sourceTarget === "live_pipeline") {
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget: "live_pipeline",
      allowedCore: ["live_pipeline_receipt", "live_environment_binding_diagnosis"],
      allowedExtra: ["visual_producer_cadence_receipt", "live_workstation_pipeline_receipt", "workspace_action_receipt", "workstation_tool_evaluation", "tool_evaluation"],
      forbiddenExtra: ["visual_context_pack", "doc_summary", "active_doc_identity", "doc_location_matches", "doc_evidence_location", "no_tool_direct", "model_only_concept"],
      precedenceReason: "live_pipeline_source_target_allows_only_receipt_terminal_products",
    });
  }

  if (sourceTarget === "world_event") {
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget: "world_event",
      allowedCore: ["live_environment_binding_diagnosis", "situation_context_pack", "live_pipeline_receipt"],
      allowedExtra: ["source_binding_status", "source_binding_repair_candidate", "source_binding_procedure", "workspace_action_receipt", "workstation_tool_evaluation"],
      forbiddenExtra: ["active_doc_identity", "doc_location_matches", "doc_evidence_location"],
      precedenceReason: "world_event_source_target_allows_world_and_binding_terminal_products",
    });
  }

  return makeContract({
    turnId: input.turnId,
    threadId: input.threadId,
    sourceTarget,
    allowedCore: [],
    allowedExtra: ["direct_answer_text", "workspace_action_receipt", "workstation_tool_evaluation", "tool_evaluation", "active_doc_identity", "doc_summary", "doc_open_receipt", "doc_location_matches", "doc_evidence_location", "composite_turn_receipt", "pending_server_request"],
    precedenceReason: "default_terminal_product_contract_allows_only_universal_terminal_products",
  });
}
