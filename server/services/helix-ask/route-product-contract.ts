import type { HelixAskSourceTargetIntent } from "@shared/helix-ask-source-target-intent";
import {
  HELIX_ROUTE_PRODUCT_CONTRACT_SCHEMA,
  type HelixRouteProductContract,
  type HelixRouteProductSourceTarget,
} from "@shared/helix-route-product-contract";
import { isSceneEpochReplayPrompt } from "./scene-epoch-replay-intent";
import { matchProcedureRecallPrompt } from "./procedure-memory-recall-router";
import { hasUnknownSourceArtifactDiscoveryIntent } from "./tool-call-admission";

export const CORE_TERMINAL_PRODUCTS = [
  "situation_context_pack",
  "procedure_epoch_replay",
  "visual_scene_comparison_result",
  "live_environment_binding_diagnosis",
  "live_environment_tool_observation",
  "live_pipeline_receipt",
  "doc_location_result",
  "repo_code_evidence_answer",
  "compound_research_locator_answer",
  "scholarly_research_answer",
  "internet_search_answer",
  "process_graph_overview",
  "audio_transcript_context_pack",
  "note_context_pack",
  "note_location_result",
  "calculator_stream_result",
  "calculation_trace",
  "process_node_detail",
  "source_binding_status",
  "source_binding_repair_candidate",
] as const;

export const UNIVERSAL_TERMINAL_PRODUCTS = [
  "request_user_input",
  "typed_failure",
] as const;

export const AUXILIARY_TERMINAL_PRODUCTS = [
  "active_doc_identity",
  "doc_summary",
  "doc_location_matches",
  "doc_evidence_location",
  "docs_viewer_receipt",
  "visual_frame_evidence",
  "visual_context_pack",
  "situation_context_pack_with_epoch_evidence",
  "procedure_memory_recall",
  "answer_distillation_expansion",
  "selected_visual_scene_set",
  "live_card_projection",
  "live_pipeline_receipt",
  "workspace_action_receipt",
  "tool_evaluation",
  "workstation_tool_evaluation",
  "repo_entity_definition",
  "direct_answer_text",
  "model_synthesized_answer",
  "no_tool_direct",
  "model_only_concept",
  "client_projection",
  "panel_generated_answer",
  "ask_debug_history_summary",
] as const;

export const ALL_ROUTE_TERMINAL_PRODUCTS = [
  ...CORE_TERMINAL_PRODUCTS,
  ...UNIVERSAL_TERMINAL_PRODUCTS,
  ...AUXILIARY_TERMINAL_PRODUCTS,
] as const;

const isMicroDeckQueryPrompt = (promptText: string): boolean =>
  !(
    /["'`][^"'`]*(?:live_env\.query_micro_reasoner_presets|micro[-\s]?deck|micro[-\s]?reasoner(?:s)?|prompt\s+(?:preset|deck)|source\s+deck\s+assembly)[^"'`]*["'`]/i.test(promptText) ||
    /\b(?:in\s+the\s+future|future|later|eventually|hypothetically|would|could|might)\b[\s\S]{0,140}\b(?:live_env\.query_micro_reasoner_presets|micro[-\s]?deck|micro[-\s]?reasoner(?:s)?|prompt\s+(?:preset|deck)|source\s+deck\s+assembly)\b/i.test(promptText) ||
    /\b(?:previously|earlier|last\s+time|before|already|historically|was|were|had)\b[\s\S]{0,140}\b(?:ran|run|used|queried|viewed|inspected|showed|listed|checked|read|called)?\b[\s\S]{0,120}\b(?:live_env\.query_micro_reasoner_presets|micro[-\s]?deck|micro[-\s]?reasoner(?:s)?|prompt\s+(?:preset|deck)|source\s+deck\s+assembly)\b/i.test(promptText) ||
    /\b(?:screen|page|button|label|ui|text|menu|dropdown)\b[\s\S]{0,90}\b(?:says|shows|reads|contains|labeled|labelled|called|named)\b[\s\S]{0,120}\b(?:live_env\.query_micro_reasoner_presets|micro[-\s]?deck|micro[-\s]?reasoner(?:s)?|prompt\s+(?:preset|deck)|source\s+deck\s+assembly)\b/i.test(promptText) ||
    /\b(?:do\s+not|don't|dont|without|not\s+asking\s+to|for\s+now)\b[\s\S]{0,140}\b(?:run|execute|use|query|view|inspect|show|list|check|read)?\b[\s\S]{0,120}\b(?:live_env\.query_micro_reasoner_presets|micro[-\s]?deck|micro[-\s]?reasoner(?:s)?|prompt\s+(?:preset|deck)|source\s+deck\s+assembly)\b/i.test(promptText)
  ) &&
  (
    /\blive_env\.query_micro_reasoner_presets\b/i.test(promptText) ||
    /\b(?:query|view|inspect|show|list|get|check|read)\b[\s\S]{0,120}\b(?:micro[-\s]?deck|micro[-\s]?reasoner(?:s)?|prompt\s+(?:preset|deck)s?|active\s+(?:micro[-\s]?deck|preset|deck)|source\s+deck\s+assembly)\b/i.test(promptText) ||
    /\b(?:micro[-\s]?deck|micro[-\s]?reasoner(?:s)?|prompt\s+(?:preset|deck)s?|source\s+deck\s+assembly)\b[\s\S]{0,120}\b(?:query|view|inspect|show|list|get|check|read|active|assembled|enabled|using)\b/i.test(promptText)
  );

type CoreTerminalProduct = (typeof CORE_TERMINAL_PRODUCTS)[number];

function completeContract(
  allowedCore: CoreTerminalProduct[],
  allowedExtra: string[] = [],
  forbiddenExtra: string[] = [],
): Pick<HelixRouteProductContract, "allowed_terminal_artifact_kinds" | "forbidden_terminal_artifact_kinds"> {
  const allowed = [...allowedCore, ...UNIVERSAL_TERMINAL_PRODUCTS];
  const allowedSet = new Set([...allowed, ...allowedExtra]);
  return {
    allowed_terminal_artifact_kinds: Array.from(allowedSet),
    forbidden_terminal_artifact_kinds: [
      ...ALL_ROUTE_TERMINAL_PRODUCTS.filter((kind: string) => !allowedSet.has(kind)),
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
  if (sourceTarget === "workspace_panel") return "workstation_panel";
  if (
    sourceTarget === "visual_capture" ||
    sourceTarget === "audio_transcript" ||
    sourceTarget === "active_doc" ||
    sourceTarget === "docs_viewer" ||
    sourceTarget === "live_pipeline" ||
    sourceTarget === "live_environment" ||
    sourceTarget === "live_source_mailbox" ||
    sourceTarget === "active_note" ||
    sourceTarget === "calculator_stream" ||
    sourceTarget === "repo_code" ||
    sourceTarget === "scholarly_research" ||
    sourceTarget === "internet_search" ||
    sourceTarget === "runtime_evidence" ||
    sourceTarget === "workspace_diagnostic" ||
    sourceTarget === "situation_epoch" ||
    sourceTarget === "visual_scene_memory" ||
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
  const naturalDocsPathCue =
    /(?:^|\s)\/?docs\/[^\s"'`<>]+\.md\b/i.test(prompt) &&
    /\b(?:from|in|using|with|via|open|read|summari[sz]e|explain|locate|find|where|search)\b[\s\S]{0,80}\bdocs?\b/i.test(prompt);
  const naturalDocsTopicCue =
    /\b(?:summari[sz]e|explain|locate|find|where|search)\b[\s\S]{0,80}\bdocs?\s+(?:about|for|on)\b/i.test(prompt) ||
    /\bdocs?\s+(?:about|for|on)\b[\s\S]{0,80}\b(?:summari[sz]e|explain|locate|find|where|search)\b/i.test(prompt);
  const structuredPathCue = /^\s*Document\s+path\s*:/im.test(prompt);
  const locateQueryCue = /^\s*Locate\s+query\s*:/im.test(prompt);
  const locationsListCue =
    /\bReturn\s+a\s+short\s+"?Locations:"?\s+list\b/i.test(prompt) ||
    /\banchors?\/sections?\b/i.test(prompt) ||
    /\bevidence\s+snippets?\b/i.test(prompt);
  if (naturalDocsPathCue || naturalDocsTopicCue) return true;
  return (docsViewerCue && (structuredPathCue || locateQueryCue || locationsListCue)) ||
    (structuredPathCue && locateQueryCue && locationsListCue);
};

const isActiveDocSummaryPrompt = (promptText: string): boolean =>
  /\b(?:summari[sz]e|explain|what\s+is|what's)\b[\s\S]{0,100}\b(?:this|current)\s+(?:NHM2\s+)?(?:doc|document|paper)\b/i.test(promptText) ||
  /\bcurrent\s+(?:NHM2\s+)?(?:doc|document|paper)\b[\s\S]{0,80}\b(?:summar|explain|about)\b/i.test(promptText);

const isExplicitLiveBindingDiagnosisPrompt = (promptText: string): boolean =>
  /\b(?:worker\s+lanes?|lanes?\s+(?:not\s+)?updating|not\s+updating|live\s+answer\s+readiness|capture\s+(?:health|bound|binding|adopted|adoption|running)|visual\s+capture\s+(?:health|bound|binding|adopted|adoption|running)|producer\s+(?:stale|fresh|status)|client\s+adoption|scene_procedure_ready|active\s+live\s+answer\s+environment)\b/i.test(promptText);

const isVisualContentRequestPrompt = (promptText: string): boolean =>
  /\b(?:review|describe|explain|summari[sz]e|what|compare|answer)\b[\s\S]{0,140}\b(?:happening|visible|shown|showing|see|seeing|looking\s+at|screen|capture|frame|image|picture|window|visual)\b/i.test(promptText) ||
  /\b(?:current|latest|right\s+now)\s+(?:screen|capture|frame|image|picture|window|visual)\b/i.test(promptText) ||
  /\blive\s+(?:capture|screen|visual)\b/i.test(promptText);

const isNoteMutationPrompt = (promptText: string): boolean =>
  /\b(?:create|append|add|write|save|store|copy)\b[\s\S]{0,120}\b(?:note|workstation\s+notes?)\b/i.test(promptText) ||
  /\b(?:note|workstation\s+notes?)\b[\s\S]{0,120}\b(?:create|append|add|write|save|store|copy)\b/i.test(promptText);

const isSituationRoomDottieActionPrompt = (promptText: string): boolean =>
  /\b(?:manifest|materiali[sz]e|create|start|set\s+up|build|attach|query|watch|witness)\b[\s\S]{0,140}\b(?:auntie\s+dottie|dottie|observer|voice\s+delivery|voice_delivery)\b/i.test(promptText) ||
  /\b(?:auntie\s+dottie|dottie|observer|voice\s+delivery|voice_delivery)\b[\s\S]{0,140}\b(?:manifest|materiali[sz]e|preset|attach|query|watch|witness|propose|speak)\b/i.test(promptText) ||
  /\bsituation-room-pipelines\.(?:dottie|observer|voice_delivery)\./i.test(promptText) ||
  /\b(?:dottie\.manifest|observer\.(?:attach|detach|query)|voice_delivery\.propose_from_trace)\b/i.test(promptText);

const isLiveAnswerEnvironmentStatePrompt = (promptText: string): boolean => {
  const mentionsLiveAnswer =
    /\b(?:live\s+(?:answer\s+)?environment|live\s+answer\s+card|live\s+card|active\s+live\s+(?:answer\s+)?(?:environment|source|job)|live\s+calculator\s+(?:source|job|environment)|calculator\s+live\s+(?:source|job|environment))\b/i.test(
      promptText,
    );
  if (!mentionsLiveAnswer) return false;
  return /\b(?:latest|current|result|value|equation|line|quiet|silent|threshold|cross(?:ed|es|ing)?|changed|state|status|why)\b/i.test(
    promptText,
  );
};

export function buildRouteProductContract(input: {
  turnId: string;
  threadId?: string | null;
  sourceTargetIntent?: HelixAskSourceTargetIntent | Record<string, unknown> | null;
  promptText?: string | null;
}): HelixRouteProductContract {
  const promptText = input.promptText ?? "";
  const sourceTargetRecord = input.sourceTargetIntent as Record<string, unknown> | null | undefined;
  const requestedOutputs = Array.isArray(sourceTargetRecord?.requested_outputs)
    ? sourceTargetRecord.requested_outputs
    : [];
  const stagePlayReflectionTarget =
    requestedOutputs.includes("stage_play_badge_graph") ||
    requestedOutputs.includes("stage_play_output_lane_projection") ||
    requestedOutputs.includes("stage_play_live_answer_projection");
  const sourceTarget = stagePlayReflectionTarget
    ? "live_environment"
    : isStructuredDocsViewerPrompt(promptText)
    ? "docs_viewer"
    : isActiveDocSummaryPrompt(promptText)
      ? "active_doc"
      : isSituationRoomDottieActionPrompt(promptText)
        ? "workstation_panel"
        : isLiveAnswerEnvironmentStatePrompt(promptText)
          ? /\b(?:calculator|equation|result|threshold|cross(?:ed|es|ing)?)\b/i.test(promptText)
            ? "calculator_stream"
            : "live_pipeline"
          : normalizeSourceTarget((input.sourceTargetIntent as Record<string, unknown> | null | undefined)?.target_source);
  const targetKind = normalizeSourceTarget(sourceTargetRecord?.target_kind);
  const procedureRecallRule = matchProcedureRecallPrompt(promptText);
  const explicitAskDebugHistorySummary =
    (
      /\b(?:last|latest|previous|prior)\s+(?:helix\s+ask\s+)?turn\b/i.test(promptText) ||
      /\b(?:inspect|summari[sz]e|summary)\b[\s\S]{0,80}\b(?:helix\s+ask|ask)\s+turn\b/i.test(promptText)
    ) &&
    /\b(?:debug|trace|route|tool|receipt|final\s+source|source|artifact|work\s*log)\b/i.test(promptText);
  const strictProcedureEpochReplay =
    (sourceTarget === "procedure_memory" || sourceTarget === "situation_epoch") &&
    targetKind === "situation_epoch" &&
    (requestedOutputs.includes("procedure_epoch_replay") || isSceneEpochReplayPrompt(promptText));
  const visualSceneMemoryTarget =
    sourceTarget === "visual_scene_memory" ||
    targetKind === "visual_scene_memory";
  const zenGraphReflectionTarget =
    requestedOutputs.includes("ideology_context_reflection/v1") ||
    requestedOutputs.includes("procedural_zen_classification/v1") ||
    requestedOutputs.includes("zen_badge_locator/v1") ||
    requestedOutputs.includes("fruition_procedure_expression/v1") ||
    /\b(?:zen\s*(?:badge\s*)?graph|zen\s*batch\s*graph|zengraph|procedural\s+zen|inner[-\s]?practice|fruition\s+(?:calculator|solve|expression)|ideology\s+(?:tree|graph|map))\b/i.test(promptText);

  if (zenGraphReflectionTarget && sourceTarget === "workstation_panel") {
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget: "workstation_panel",
      allowedCore: [],
      allowedExtra: ["workstation_tool_evaluation", "tool_evaluation", "model_synthesized_answer"],
      forbiddenExtra: [
        "active_doc_identity",
        "client_projection",
        "direct_answer_text",
        "doc_open_receipt",
        "doc_summary",
        "live_pipeline_receipt",
        "model_only_concept",
        "no_tool_direct",
        "panel_generated_answer",
        "workspace_action_receipt",
      ],
      sideArtifactKindsAllowed: [
        "ideology_context_reflection/v1",
        "procedural_zen_classification/v1",
        "zen_badge_locator/v1",
        "fruition_procedure_expression/v1",
        "helix_recommended_action_admission/v1",
      ],
      precedenceReason: "zen_graph_reflection_requires_evidence_reentry_before_terminal_synthesis",
    });
  }

  if (explicitAskDebugHistorySummary) {
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget: "runtime_evidence",
      allowedCore: [],
      allowedExtra: ["ask_debug_history_summary"],
      forbiddenExtra: [
        "direct_answer_text",
        "no_tool_direct",
        "model_only_concept",
        "model_synthesized_answer",
        "client_projection",
        "panel_generated_answer",
      ],
      precedenceReason: "explicit_prior_ask_debug_summary_allows_read_only_debug_history_product",
      sideArtifactKindsAllowed: ["ask_debug_history_summary"],
    });
  }

  if (sourceTarget === "docs_viewer" || sourceTarget === "active_doc") {
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget,
      allowedCore: ["doc_location_result"],
      allowedExtra: ["active_doc_identity", "doc_open_receipt", "doc_location_matches", "doc_evidence_location", "doc_summary", "docs_viewer_receipt", "workspace_action_receipt", "source_binding_status", "source_binding_repair_candidate", "tool_evaluation", "workstation_tool_evaluation", "model_synthesized_answer"],
      forbiddenExtra: ["situation_context_pack_with_epoch_evidence", "visual_context_pack", "visual_frame_evidence", "live_card_projection", "no_tool_direct", "model_only_concept"],
      sideArtifactKindsAllowed: ["doc_equation_context", "doc_equation_context/v1"],
      precedenceReason: "docs_source_target_allows_only_document_terminal_products",
    });
  }

  if (sourceTarget === "unknown" && hasUnknownSourceArtifactDiscoveryIntent(promptText)) {
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget: "unknown",
      allowedCore: ["doc_location_result", "repo_code_evidence_answer"],
      allowedExtra: [
        "source_binding_status",
        "source_binding_repair_candidate",
        "tool_evaluation",
        "workstation_tool_evaluation",
        "model_synthesized_answer",
      ],
      forbiddenExtra: [
        "direct_answer_text",
        "scholarly_research_answer",
        "internet_search_answer",
        "docs_viewer_receipt",
        "workspace_action_receipt",
        "live_pipeline_receipt",
        "client_projection",
        "panel_generated_answer",
        "no_tool_direct",
        "model_only_concept",
      ],
      precedenceReason: "unknown_source_discovery_allows_bounded_readonly_evidence_products",
      sideArtifactKindsAllowed: [
        "doc_search_results",
        "workspace_directory_resolution",
        "doc_equation_context",
        "doc_equation_context/v1",
        "doc_candidate_validation",
        "doc_location_result",
        "repo_code_evidence_observation",
        "repo_evidence_synthesis_attempt",
        "helix.agent_step_observation_packet",
      ],
    });
  }

  if (sourceTarget === "visual_capture") {
    const explicitBindingDiagnosis = isExplicitLiveBindingDiagnosisPrompt(promptText);
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget: "visual_capture",
      allowedCore: targetKind === "situation_epoch"
        ? ["situation_context_pack", "procedure_epoch_replay"]
        : explicitBindingDiagnosis
          ? ["situation_context_pack", "live_environment_binding_diagnosis"]
          : ["situation_context_pack"],
      allowedExtra: ["live_visual_answer", "live_source_typed_failure", "typed_failure", "visual_frame_evidence", "source_binding_status", "source_binding_repair_candidate"],
      forbiddenExtra: ["active_doc_identity", "doc_summary", "doc_location_matches", "doc_evidence_location", "client_projection", "no_tool_direct", "model_only_concept", "panel_generated_answer", "process_graph_overview"],
      precedenceReason: "visual_source_target_allows_current_situation_terminal_products",
    });
  }

  if (sourceTarget === "visual_scene_memory" || visualSceneMemoryTarget) {
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget: sourceTarget === "visual_scene_memory" ? "visual_scene_memory" : "procedure_memory",
      allowedCore: ["procedure_epoch_replay", "visual_scene_comparison_result"],
      allowedExtra: ["selected_visual_scene_set"],
      forbiddenExtra: ["process_graph_overview", "live_environment_binding_diagnosis", "live_pipeline_receipt", "situation_context_pack", "no_tool_direct", "model_only_concept"],
      precedenceReason: "visual_scene_memory_source_target_allows_only_selected_scene_products",
    });
  }

  if (procedureRecallRule && (sourceTarget === "procedure_memory" || sourceTarget === "situation_epoch")) {
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget,
      allowedCore: procedureRecallRule.mode === "epoch_replay" ? ["procedure_epoch_replay"] : [],
      allowedExtra: [
        "procedure_memory_recall",
        "answer_distillation_expansion",
        "procedure_memory_unavailable",
        "procedure_epoch_previous_unavailable",
      ],
      forbiddenExtra: [
        "process_graph_overview",
        "workspace_action_receipt",
        "live_pipeline_receipt",
        "live_environment_binding_diagnosis",
        "situation_context_pack",
        "generic_context_pack",
        "legacy_context_pack",
        "raw_logs",
        "raw_audio",
        "raw_image",
        "raw_frame",
        "no_tool_direct",
        "model_only_concept",
      ],
      precedenceReason: "procedure_recall_prompt_allows_only_recall_terminal_products",
      sideArtifactKindsAllowed: ["situation_context_pack_with_epoch_evidence"],
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
      forbiddenExtra: ["process_graph_overview", "active_doc_identity", "active_doc_summary", "workspace_action_receipt", "live_pipeline_receipt", "live_environment_binding_diagnosis", "no_tool_direct", "model_only_concept"],
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
      sourceTarget,
      allowedCore: ["repo_code_evidence_answer"],
      allowedExtra: [],
      forbiddenExtra: [
        "direct_answer_text",
        "no_tool_direct",
        "model_only_concept",
        "client_projection",
        "panel_generated_answer",
        "workspace_action_receipt",
        "live_pipeline_receipt",
        "docs_viewer_receipt",
      ],
      precedenceReason: "repo_code_source_target_allows_only_repo_evidence_terminal_products",
      sideArtifactKindsAllowed: [
        "repo_code_evidence_observation",
        "repo_evidence_synthesis_attempt",
        "repo_evidence_synthesis_repair_observation",
        "repo_answer_text_quality_gate",
        "repo_claim_support",
        "repo_claim_observation_gate",
      ],
    });
  }

  if (sourceTarget === "scholarly_research") {
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget,
      allowedCore: ["scholarly_research_answer", "compound_research_locator_answer"],
      allowedExtra: [],
      forbiddenExtra: [
        "direct_answer_text",
        "no_tool_direct",
        "model_only_concept",
        "client_projection",
        "panel_generated_answer",
        "workspace_action_receipt",
        "live_pipeline_receipt",
        "docs_viewer_receipt",
        "active_doc_identity",
        "doc_open_receipt",
        "doc_summary",
        "doc_location_result",
        "repo_code_evidence_answer",
        "repo_entity_definition",
      ],
      precedenceReason: "scholarly_research_source_target_allows_only_external_paper_evidence_terminal_products",
      sideArtifactKindsAllowed: [
        "scholarly_research_observation",
        "scholarly_full_text_observation",
        "scholarly_pdf_page_image_observation",
        "scholarly_research_synthesis_attempt",
        "scholarly_research_claim_support",
        "helix_theory_context_reflection_tool_receipt",
      ],
    });
  }

  if (sourceTarget === "internet_search") {
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget,
      allowedCore: ["internet_search_answer", "compound_research_locator_answer"],
      allowedExtra: [],
      forbiddenExtra: [
        "direct_answer_text",
        "no_tool_direct",
        "model_only_concept",
        "client_projection",
        "panel_generated_answer",
        "workspace_action_receipt",
        "live_pipeline_receipt",
        "docs_viewer_receipt",
        "active_doc_identity",
        "doc_open_receipt",
        "doc_summary",
        "doc_location_result",
        "repo_code_evidence_answer",
        "repo_entity_definition",
        "scholarly_research_answer",
      ],
      precedenceReason: "internet_search_source_target_allows_only_external_web_evidence_terminal_products",
      sideArtifactKindsAllowed: [
        "internet_search_observation",
        "internet_search_synthesis_attempt",
        "internet_search_claim_support",
        "helix_theory_context_reflection_tool_receipt",
      ],
    });
  }

  if (sourceTarget === "runtime_evidence") {
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget,
      allowedCore: ["repo_code_evidence_answer"],
      allowedExtra: ["repo_entity_definition", "tool_evaluation", "workstation_tool_evaluation", "ask_debug_history_summary"],
      forbiddenExtra: ["direct_answer_text", "no_tool_direct", "model_only_concept", "process_graph_overview", "situation_context_pack", "visual_context_pack", "visual_frame_evidence", "live_card_projection", "active_doc_identity", "doc_summary", "doc_location_matches", "doc_evidence_location"],
      precedenceReason: "runtime_evidence_source_target_allows_repo_and_runtime_evidence_products",
      sideArtifactKindsAllowed: [
        "ask_debug_history_summary",
        "repo_code_evidence_observation",
        "repo_evidence_synthesis_attempt",
        "repo_evidence_synthesis_repair_observation",
        "repo_answer_text_quality_gate",
        "repo_claim_support",
        "repo_claim_observation_gate",
      ],
    });
  }

  if (sourceTarget === "workspace_diagnostic") {
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget: "workspace_diagnostic",
      allowedCore: [],
      allowedExtra: ["model_synthesized_answer", "typed_failure", "request_user_input"],
      forbiddenExtra: [
        "direct_answer_text",
        "workspace_action_receipt",
        "live_pipeline_receipt",
        "docs_viewer_receipt",
        "active_doc_identity",
        "doc_open_receipt",
        "doc_summary",
        "situation_context_pack",
        "visual_context_pack",
        "client_projection",
        "panel_generated_answer",
        "no_tool_direct",
        "model_only_concept",
      ],
      precedenceReason: "workspace_diagnostic_requires_workspace_os_status_observation_then_model_synthesis",
      sideArtifactKindsAllowed: [
        "workspace_os_status_observation",
        "helix.workspace_os_status_observation.v1",
        "helix.workspace_os.status.v1",
        "helix.agent_step_observation_packet",
      ],
    });
  }

  if (sourceTarget === "live_pipeline") {
    if (isVisualContentRequestPrompt(promptText) || isSceneEpochReplayPrompt(promptText)) {
      return makeContract({
        turnId: input.turnId,
        threadId: input.threadId,
        sourceTarget: "live_pipeline",
        allowedCore: [],
        allowedExtra: ["live_source_typed_failure"],
        forbiddenExtra: [
          "live_pipeline_receipt",
          "visual_producer_cadence_receipt",
          "live_workstation_pipeline_receipt",
          "workspace_action_receipt",
          "process_graph_overview",
          "client_projection",
          "no_tool_direct",
          "model_only_concept",
          "panel_generated_answer",
        ],
        precedenceReason: "live_pipeline_receipt_rejected_for_visual_or_procedure_content_request",
      });
    }
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

  if (sourceTarget === "live_environment" || sourceTarget === "live_source_mailbox") {
    if (isMicroDeckQueryPrompt(promptText)) {
      return makeContract({
        turnId: input.turnId,
        threadId: input.threadId,
        sourceTarget,
        allowedCore: [],
        allowedExtra: ["model_synthesized_answer"],
        forbiddenExtra: [
          "live_environment_tool_observation",
          "direct_answer_text",
          "turn_final_text",
          "tool_receipt",
          "live_pipeline_receipt",
          "visual_producer_cadence_receipt",
          "workspace_action_receipt",
          "visual_context_pack",
          "situation_context_pack",
          "doc_summary",
          "active_doc_identity",
          "doc_location_matches",
          "doc_evidence_location",
          "process_graph_overview",
          "no_tool_direct",
          "model_only_concept",
          "panel_generated_answer",
        ],
        sideArtifactKindsAllowed: [
          "stage_play_micro_reasoner_prompt_preset_query_result",
        ],
        precedenceReason: "microdeck_query_requires_tool_observation_then_model_synthesis",
      });
    }
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget,
      allowedCore: ["live_environment_tool_observation"],
      allowedExtra: ["direct_answer_text", "model_synthesized_answer", "turn_final_text", "tool_receipt", "source_binding_status", "source_binding_repair_candidate"],
      forbiddenExtra: [
        "live_pipeline_receipt",
        "visual_producer_cadence_receipt",
        "workspace_action_receipt",
        "visual_context_pack",
        "situation_context_pack",
        "doc_summary",
        "active_doc_identity",
        "doc_location_matches",
        "doc_evidence_location",
        "process_graph_overview",
        "no_tool_direct",
        "model_only_concept",
        "panel_generated_answer",
      ],
      sideArtifactKindsAllowed: [
        "stage_play_badge_graph",
        "stage_play_output_lane_projection",
        "live_answer_environment_delta",
      ],
      precedenceReason: sourceTarget === "live_source_mailbox"
        ? "live_source_mailbox_requires_mail_read_then_decision"
        : "live_environment_source_target_requires_tool_observation_then_model_synthesis",
    });
  }

  if (sourceTarget === "process_graph") {
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget: "process_graph",
      allowedCore: ["process_graph_overview"],
      allowedExtra: ["process_node_detail", "source_binding_status", "source_binding_repair_candidate", "workstation_tool_evaluation"],
      forbiddenExtra: ["procedure_epoch_replay", "visual_scene_comparison_result", "repo_code_evidence_answer", "doc_location_result", "situation_context_pack", "no_tool_direct", "model_only_concept"],
      precedenceReason: "process_graph_source_target_allows_only_workstation_process_products",
    });
  }

  if (sourceTarget === "workstation_panel" || sourceTarget === "workspace_action" || sourceTarget === "workstation_state") {
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget,
      allowedCore: [],
      allowedExtra: [
        "helix.tool_surface_packet",
        "helix.agent_step_decision",
        "helix.runtime_tool_call",
        "helix.agent_step_observation_packet",
        "helix.agent_step_commentary",
        "pending_tool_state",
        "workspace_action_receipt",
        "workstation_tool_evaluation",
        "tool_evaluation",
        "model_synthesized_answer",
        "note_context_pack",
        "source_binding_status",
        "source_binding_repair_candidate",
      ],
      forbiddenExtra: ["visual_frame_evidence", "doc_location_result", "note_update_receipt", "note_action_receipt", "note_create_receipt", "no_tool_direct", "model_only_concept"],
      sideArtifactKindsAllowed: ["workspace_action_receipt", "note_update_receipt", "note_action_receipt", "note_create_receipt"],
      precedenceReason: "workstation_panel_source_target_allows_workspace_and_note_action_side_artifacts",
    });
  }

  if (isNoteMutationPrompt(promptText)) {
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget: sourceTarget === "unknown" ? "workstation_panel" : sourceTarget,
      allowedCore: [],
      allowedExtra: [
        "helix.tool_surface_packet",
        "helix.agent_step_decision",
        "helix.runtime_tool_call",
        "helix.agent_step_observation_packet",
        "helix.agent_step_commentary",
        "pending_tool_state",
        "workspace_action_receipt",
        "workstation_tool_evaluation",
        "tool_evaluation",
        "model_synthesized_answer",
        "note_context_pack",
        "source_binding_status",
        "source_binding_repair_candidate",
      ],
      forbiddenExtra: ["visual_frame_evidence", "doc_location_result", "note_update_receipt", "note_action_receipt", "note_create_receipt", "no_tool_direct", "model_only_concept"],
      sideArtifactKindsAllowed: ["note_update_receipt", "note_action_receipt", "note_create_receipt", "workspace_action_receipt"],
      precedenceReason: "note_mutation_prompt_requires_model_synthesized_terminal_after_note_receipt",
    });
  }

  if (sourceTarget === "audio_transcript" || sourceTarget === "workstation_state") {
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget,
      allowedCore: ["situation_context_pack"],
      allowedExtra: ["audio_transcript_context_pack", "source_binding_status", "source_binding_repair_candidate"],
      forbiddenExtra: ["visual_frame_evidence", "doc_location_result", "process_graph_overview", "no_tool_direct", "model_only_concept"],
      precedenceReason: "audio_transcript_source_target_allows_transcript_context_products",
    });
  }

  if (sourceTarget === "active_note") {
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget: "active_note",
      allowedCore: [],
      allowedExtra: ["note_context_pack", "note_location_result", "note_update_receipt", "source_binding_status", "source_binding_repair_candidate"],
      forbiddenExtra: ["situation_context_pack", "visual_frame_evidence", "doc_location_result", "process_graph_overview", "no_tool_direct", "model_only_concept"],
      precedenceReason: "notes_source_target_allows_note_terminal_products",
    });
  }

  if (sourceTarget === "calculator_stream") {
    return makeContract({
      turnId: input.turnId,
      threadId: input.threadId,
      sourceTarget: "calculator_stream",
      allowedCore: ["situation_context_pack", "live_environment_tool_observation", "workspace_action_receipt", "workstation_tool_evaluation"],
      allowedExtra: [
        "calculator_receipt",
        "calculator_result_trace",
        "calculator_stream_result",
        "calculation_trace",
        "tool_evaluation",
        "turn_final_text",
        "model_synthesized_answer",
        "source_binding_status",
        "source_binding_repair_candidate",
      ],
      forbiddenExtra: ["visual_frame_evidence", "doc_location_result", "process_graph_overview", "no_tool_direct", "model_only_concept"],
      precedenceReason: "calculator_source_target_allows_calculator_stream_products",
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
    allowedExtra: sourceTarget === "model_only" || sourceTarget === "general_background" || sourceTarget === "unknown"
      ? ["direct_answer_text", "model_synthesized_answer", "source_binding_status", "source_binding_repair_candidate"]
      : ["direct_answer_text", "model_synthesized_answer", "workspace_action_receipt", "workstation_tool_evaluation", "tool_evaluation", "active_doc_identity", "doc_summary", "doc_open_receipt", "doc_location_matches", "doc_evidence_location", "composite_turn_receipt", "pending_server_request"],
    forbiddenExtra: ["no_tool_direct", "model_only_concept", "client_projection", "panel_generated_answer"],
    precedenceReason: "default_terminal_product_contract_allows_loop_owned_products",
  });
}
