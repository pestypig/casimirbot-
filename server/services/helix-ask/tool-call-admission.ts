import type { HelixAskSourceTargetIntent } from "@shared/helix-ask-source-target-intent";
import type { HelixRouteProductContract } from "@shared/helix-route-product-contract";
import {
  HELIX_TOOL_CALL_ADMISSION_DECISION_SCHEMA,
  type HelixToolCallAdmissionDecision,
  type HelixToolCallAdmissionFamily,
  type HelixToolCallAdmissionMode,
} from "@shared/helix-tool-call-admission";
import {
  contextualToolSuppressionBlocksFamily,
  detectContextualToolAdmissionSuppression,
} from "./contextual-tool-admission";
import { buildToolUseRestatement, detectInternetSearchIntent } from "./internet-search-intent";
import { buildTurnOperationalConstraints } from "./operational-constraints";
import { detectRepoCodeEvidenceIntent } from "./repo-code-intent-detector";
import { detectScholarlyResearchIntent } from "./scholarly-research-intent";
import {
  isStagePlayCheckpointRequestPrompt,
  isStagePlayJobPlanningPrompt,
  isStagePlayReflectionPrompt,
} from "./stage-play-prompt-intent";
import { isWorkspaceOsStatusPrompt } from "./workspace-os-status-intent";

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const HARD_SOURCE_TARGETS = new Set([
  "visual_capture",
  "procedure_memory",
  "situation_epoch",
  "visual_scene_memory",
  "repo_code",
  "scholarly_research",
  "internet_search",
  "runtime_evidence",
  "workspace_diagnostic",
  "docs_viewer",
  "workspace_directory",
  "active_doc",
  "process_graph",
  "live_pipeline",
  "live_environment",
  "live_source_mailbox",
  "world_event",
  "active_note",
  "workspace_panel",
  "workstation_panel",
  "workspace_action",
  "calculator",
  "calculator_solve",
  "calculator_stream",
]);

const sourceTargetToolFamilies = (
  sourceTarget: string,
  promptText = "",
  sourceTargetIntent?: HelixAskSourceTargetIntent | Record<string, unknown> | null,
): string[] => {
  if (sourceTarget === "docs_viewer" || sourceTarget === "active_doc") return ["docs_viewer"];
  if (sourceTarget === "scholarly_research") return ["scholarly_research"];
  if (sourceTarget === "internet_search") return ["internet_search"];
  if (sourceTarget === "repo_code") return ["repo_code"];
  if (sourceTarget === "live_environment" || sourceTarget === "live_source_mailbox") return ["live_environment"];
  if (sourceTarget === "active_note") return ["notes"];
  if (sourceTarget === "calculator" || sourceTarget === "calculator_solve" || sourceTarget === "calculator_stream") {
    return ["calculator", "workstation_action"];
  }
  if (sourceTarget === "workspace_panel" || sourceTarget === "workstation_panel" || sourceTarget === "workspace_action") {
    const joined = [
      promptText,
      ...(
        Array.isArray((sourceTargetIntent as Record<string, unknown> | null | undefined)?.explicit_cues)
          ? (sourceTargetIntent as Record<string, unknown>).explicit_cues as string[]
          : []
      ),
      ...(
        Array.isArray((sourceTargetIntent as Record<string, unknown> | null | undefined)?.reasons)
          ? (sourceTargetIntent as Record<string, unknown>).reasons as string[]
          : []
      ),
      ...(
        Array.isArray((sourceTargetIntent as Record<string, unknown> | null | undefined)?.requested_outputs)
          ? (sourceTargetIntent as Record<string, unknown>).requested_outputs as string[]
          : []
      ),
    ].join(" ");
    if (/theory_context_reflection|reflect_theory_context|theory\s+badge\s+graph|theory\s+graph|badge\s+graph|scale\s+bands?|uncertainty\s+mode/i.test(joined)) {
      return ["theory_locator"];
    }
    return ["workstation_action"];
  }
  return [sourceTarget];
};

const theoryLocatorRequested = (promptText: string): boolean => {
  const prompt = promptText.trim();
  if (!prompt) return false;
  if (/\b(?:do\s+not|don't|dont|never|without|no)\b[^.!?;\n]{0,120}\b(?:theory\s+badge\s+graph|badge\s+graph|theory\s+graph|theory_context_reflection|reflect_theory_context|scale\s+bands?|uncertainty\s+mode)\b/i.test(prompt)) {
    return false;
  }
  return /\b(?:theory\s+badge\s+graph|theory\s+badges?|badge\s+graph|physics\s+graph|theory\s+graph|theory_context_reflection|reflect_theory_context|helix_ask\.reflect_theory_context|graph\s+placement|scale\s+bands?|semantic\s+chunks?|uncertainty\s+mode|locate\b[\s\S]{0,80}\b(?:theory|badge|graph)|place\b[\s\S]{0,80}\b(?:theory|badge|graph|claims?)|map\b[\s\S]{0,80}\b(?:theory|badge|graph)|where\s+(?:does|do)\b[\s\S]{0,100}\b(?:fit|land|map))\b/i.test(prompt);
};

const calculatorSolveRequested = (
  promptText: string,
  sourceTargetIntent?: HelixAskSourceTargetIntent | Record<string, unknown> | null,
): boolean => {
  const prompt = promptText.trim();
  if (!prompt) return false;
  const sourceTargetRecord = sourceTargetIntent as Record<string, unknown> | null | undefined;
  const joined = [
    prompt,
    String(sourceTargetRecord?.target_source ?? ""),
    String(sourceTargetRecord?.target_kind ?? ""),
    ...(
      Array.isArray(sourceTargetRecord?.explicit_cues)
        ? sourceTargetRecord.explicit_cues as string[]
        : []
    ),
    ...(
      Array.isArray(sourceTargetRecord?.reasons)
        ? sourceTargetRecord.reasons as string[]
        : []
    ),
    ...(
      Array.isArray(sourceTargetRecord?.requested_outputs)
        ? sourceTargetRecord.requested_outputs as string[]
        : []
    ),
  ].join(" ");
  if (/\b(?:calculator_stream|calculator_solve|scientific_calculator_solve|scientific-calculator\.solve_expression|calculator_receipt)\b/i.test(joined)) {
    return true;
  }
  if (/\b(?:scientific\s+calculator|calculator)\b[\s\S]{0,80}\b(?:solve|evaluate|calculate|compute)\b/i.test(prompt)) {
    return true;
  }
  if (/\b(?:solve|evaluate|calculate|compute)\b[\s\S]{0,80}\b(?:scientific\s+calculator|calculator|expression|equation)\b/i.test(prompt)) {
    return true;
  }
  if (/\b(?:solve|evaluate|calculate|compute)\b[\s\S]{0,120}(?:\d|[=+\-*/^()]|\\frac|\\sqrt|\bsqrt\s*\(|\bln\s*\(|\blog\s*\(|\bsin\s*\(|\bcos\s*\(|\btan\s*\()/i.test(prompt)) {
    return true;
  }
  return false;
};

const contextualForbiddenToolFamilies = (
  suppression: ReturnType<typeof detectContextualToolAdmissionSuppression>,
): string[] => {
  if (!suppression) return [];
  return [
    contextualToolSuppressionBlocksFamily(suppression, "docs_viewer") ? "docs_viewer" : "",
    contextualToolSuppressionBlocksFamily(suppression, "calculator") ||
    contextualToolSuppressionBlocksFamily(suppression, "scientific_calculator") ? "calculator" : "",
    contextualToolSuppressionBlocksFamily(suppression, "scholarly_research") ? "scholarly_research" : "",
    contextualToolSuppressionBlocksFamily(suppression, "internet_search") ? "internet_search" : "",
    contextualToolSuppressionBlocksFamily(suppression, "theory_locator") ? "theory_locator" : "",
    contextualToolSuppressionBlocksFamily(suppression, "workstation_action") ? "workstation_action" : "",
    contextualToolSuppressionBlocksFamily(suppression, "notes") ? "notes" : "",
    contextualToolSuppressionBlocksFamily(suppression, "repo_code") ? "repo_code" : "",
    contextualToolSuppressionBlocksFamily(suppression, "live_environment") ? "live_environment" : "",
  ].filter(Boolean);
};

export const hasUnknownSourceArtifactDiscoveryIntent = (promptText: string): boolean => {
  const prompt = promptText.trim();
  if (!prompt) return false;
  const retrievalAction =
    /\b(?:find|locate|look\s+for|search\s+for|retrieve|get|pull\s+up|open|show|bring\s+up|read)\b/i.test(prompt);
  const artifactCue =
    /\b(?:white\s*paper|whitepaper|paper|doc(?:ument)?|file|report|memo|artifact|source|note|path|where)\b/i.test(prompt);
  const namedSubjectCue =
    /\b[A-Z][A-Z0-9-]{2,}\b/.test(prompt) ||
    /\b[A-Z][A-Za-z0-9-]{2,}\s+(?:theory|spec|design|paper|doc|report|memo|file)\b/.test(prompt);
  const explicitExternalScope =
    /\b(?:arxiv|doi|journal|peer[-\s]?reviewed|pubmed|openalex|semantic\s+scholar|crossref|citations?|bibliograph(?:y|ies)|published|web|internet|online|google|bing|scholarly\s+(?:paper|article|source)|research\s+papers?)\b/i.test(prompt);
  return retrievalAction && (artifactCue || namedSubjectCue) && !explicitExternalScope;
};

export function buildToolCallAdmissionDecision(input: {
  turnId: string;
  sourceTargetIntent?: HelixAskSourceTargetIntent | Record<string, unknown> | null;
  routeProductContract?: HelixRouteProductContract | Record<string, unknown> | null;
  promptText?: string | null;
}): HelixToolCallAdmissionDecision {
  const intentSourceTarget = String(
    (input.sourceTargetIntent as Record<string, unknown> | null | undefined)?.target_source ??
    "",
  );
  const contractSourceTarget = String(
    (input.routeProductContract as Record<string, unknown> | null | undefined)?.source_target ??
    "",
  );
  const sourceTarget = String(
    (intentSourceTarget && intentSourceTarget !== "unknown" ? intentSourceTarget : null) ??
    (contractSourceTarget && contractSourceTarget !== "unknown" ? contractSourceTarget : null) ??
    intentSourceTarget ??
    contractSourceTarget ??
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
  const operationalConstraints = buildTurnOperationalConstraints({
    turnId: input.turnId,
    promptText,
  });
  const operationalFields = {
    operational_constraints_ref: `${input.turnId}:turn_operational_constraints`,
    forbidden_tools: operationalConstraints.forbidden_tools,
    forbidden_tool_families: operationalConstraints.forbidden_tool_families,
    required_surface: operationalConstraints.required_surface,
  };
  const contextualSuppression = detectContextualToolAdmissionSuppression(promptText);
  const toolUseRestatement = buildToolUseRestatement(promptText);
  const calculatorSolveIntent = calculatorSolveRequested(promptText, input.sourceTargetIntent);
  const effectiveSourceTarget =
    sourceTarget === "unknown" && toolUseRestatement.requiredToolFamilies.includes("docs_viewer")
      ? "docs_viewer"
      : sourceTarget === "unknown" && toolUseRestatement.requiredToolFamilies.includes("internet_search")
      ? "internet_search"
      : sourceTarget === "unknown" && calculatorSolveIntent
      ? "calculator_stream"
      : sourceTarget === "calculator" || sourceTarget === "calculator_solve"
      ? "calculator_stream"
      : sourceTarget;
  const contextualSuppressionBlocksSelectedTarget =
    Boolean(contextualSuppression) &&
    (
      effectiveSourceTarget === "unknown" ||
      effectiveSourceTarget === "model_only" ||
      effectiveSourceTarget === "general_background" ||
      sourceTargetToolFamilies(effectiveSourceTarget, promptText, input.sourceTargetIntent).some((family) =>
        contextualToolSuppressionBlocksFamily(contextualSuppression, family),
      )
    );
  if (contextualSuppressionBlocksSelectedTarget && contextualSuppression) {
    return {
      schema: HELIX_TOOL_CALL_ADMISSION_DECISION_SCHEMA,
      turn_id: input.turnId,
      source_target: "model_only",
      required: false,
      admitted_tool_families: ["model_only"],
      forbidden_terminal_artifact_kinds: [],
      forbidden_routes: [],
      reason: "contextual_tool_reference_suppressed",
      tool_admission_suppressed: true,
      suppression_reason: contextualSuppression.suppression_reason,
      ...operationalFields,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  let required = HARD_SOURCE_TARGETS.has(effectiveSourceTarget);
  let admittedToolFamilies: HelixToolCallAdmissionFamily[] = [];
  let extraForbiddenTerminalKinds: string[] = [];
  let extraForbiddenRoutes: string[] = [];
  let extraForbiddenTools: string[] = [];
  let extraForbiddenToolFamilies: string[] = [];
  let admissionMode: HelixToolCallAdmissionMode = "direct";
  let discoveryPolicy: HelixToolCallAdmissionDecision["discovery_policy"] | undefined;
  let reason = "source_target_requires_evidence_path";
  const isStagePlayLiveEnvironmentPrompt =
    sourceTarget === "live_environment" &&
    (
      isStagePlayCheckpointRequestPrompt(promptText) ||
      isStagePlayJobPlanningPrompt(promptText) ||
      isStagePlayReflectionPrompt(promptText)
    );

  if (effectiveSourceTarget === "docs_viewer") {
    admittedToolFamilies = ["docs_viewer"];
    extraForbiddenTerminalKinds = ["situation_context_pack", "visual_context_pack", "live_card_projection", "no_tool_direct", "model_only_concept"];
    extraForbiddenRoutes = ["situation_context_question", "visual_deictic"];
    reason = "docs_viewer_requires_document_tool_path";
  } else if (effectiveSourceTarget === "scholarly_research") {
    admittedToolFamilies = ["scholarly_research"];
    extraForbiddenTerminalKinds = [
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
    ];
    extraForbiddenRoutes = [
      "active_doc_identity",
      "active_doc_summary",
      "doc_open_best",
      "repo_code_evidence_question",
      "model_only_concept",
      "no_tool_direct",
    ];
    reason = "scholarly_research_requires_external_paper_evidence_path";
  } else if (effectiveSourceTarget === "internet_search") {
    admittedToolFamilies = ["internet_search"];
    extraForbiddenTerminalKinds = [
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
      "scholarly_research_answer",
      "repo_entity_definition",
    ];
    extraForbiddenRoutes = [
      "active_doc_identity",
      "active_doc_summary",
      "doc_open_best",
      "repo_code_evidence_question",
      "scholarly_research_lookup",
      "model_only_concept",
      "no_tool_direct",
    ];
    reason = "internet_search_requires_external_web_evidence_path";
  } else if (sourceTarget === "unknown" && hasUnknownSourceArtifactDiscoveryIntent(promptText)) {
    required = true;
    admittedToolFamilies = ["workspace_directory", "docs_viewer", "repo_code", "runtime_evidence"];
    extraForbiddenTerminalKinds = [
      "direct_answer_text",
      "situation_context_pack",
      "visual_context_pack",
      "live_card_projection",
      "client_projection",
      "panel_generated_answer",
      "workspace_action_receipt",
      "live_pipeline_receipt",
      "scholarly_research_answer",
      "internet_search_answer",
      "no_tool_direct",
      "model_only_concept",
    ];
    extraForbiddenRoutes = [
      "situation_context_question",
      "visual_deictic",
      "scholarly_research_lookup",
      "internet_search_lookup",
      "model_only_concept",
      "no_tool_direct",
    ];
    extraForbiddenTools = ["docs-viewer.open", "docs-viewer.open_doc_by_path"];
    extraForbiddenToolFamilies = ["scholarly_research", "internet_search"];
    admissionMode = "unknown_source_discovery";
    discoveryPolicy = {
      state: "bounded_readonly",
      first_pass_tool_families: ["workspace_directory", "docs_viewer", "repo_code", "runtime_evidence"],
      forbidden_external_tool_families: ["scholarly_research", "internet_search"],
      on_not_found: "ask_or_explain_searched_scope",
    };
    reason = "unknown_source_artifact_request_requires_bounded_readonly_discovery";
  } else if (sourceTarget === "workspace_diagnostic" || isWorkspaceOsStatusPrompt(promptText)) {
    required = true;
    admittedToolFamilies = ["workspace_diagnostic"];
    extraForbiddenTerminalKinds = [
      "direct_answer_text",
      "workspace_action_receipt",
      "live_pipeline_receipt",
      "docs_viewer_receipt",
      "doc_open_receipt",
      "doc_summary",
      "active_doc_identity",
      "situation_context_pack",
      "visual_context_pack",
      "client_projection",
      "panel_generated_answer",
      "no_tool_direct",
      "model_only_concept",
    ];
    extraForbiddenRoutes = [
      "workspace_panel",
      "workstation_panel",
      "workstation_action",
      "active_doc_identity",
      "active_doc_summary",
      "doc_open_best",
      "visual_deictic",
      "visual_frame_evidence",
      "model_only_concept",
      "no_tool_direct",
    ];
    reason = "workspace_diagnostic_requires_workspace_os_status_tool_path";
  } else if (sourceTarget === "workspace_panel" || sourceTarget === "workstation_panel" || sourceTarget === "workspace_action") {
    const workspacePanelFamilies = sourceTargetToolFamilies(sourceTarget, promptText, input.sourceTargetIntent);
    admittedToolFamilies = workspacePanelFamilies.includes("theory_locator")
      ? ["theory_locator"]
      : ["workstation_action"];
    extraForbiddenTerminalKinds = ["situation_context_pack", "visual_context_pack", "live_pipeline_receipt", "active_doc_identity", "doc_open_receipt", "doc_summary", "no_tool_direct", "model_only_concept"];
    extraForbiddenRoutes = ["situation_context_question", "visual_deictic", "visual_frame_evidence", "active_doc_identity", "active_doc_summary", "doc_open_best", "model_only_concept", "no_tool_direct"];
    reason = workspacePanelFamilies.includes("theory_locator")
      ? "theory_locator_requires_readonly_locator_path"
      : "workspace_panel_requires_workstation_action_path";
  } else if (effectiveSourceTarget === "calculator_stream") {
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
  } else if (sourceTarget === "live_environment" || sourceTarget === "live_source_mailbox") {
    admittedToolFamilies = ["live_environment"];
    extraForbiddenTerminalKinds = isStagePlayLiveEnvironmentPrompt
      ? ["situation_context_pack", "doc_summary", "active_doc_identity", "live_card_projection", "live_pipeline_receipt", "client_projection", "panel_generated_answer", "no_tool_direct", "model_only_concept"]
      : ["direct_answer_text", "situation_context_pack", "doc_summary", "active_doc_identity", "live_card_projection", "panel_generated_answer", "no_tool_direct", "model_only_concept"];
    extraForbiddenRoutes = ["situation_context_question", "active_doc_identity", "model_only_concept", "no_tool_direct", "panel_generated_answer"];
    reason = sourceTarget === "live_source_mailbox"
      ? "live_source_mailbox_requires_mail_read_then_decision"
      : isStagePlayLiveEnvironmentPrompt
      ? "stage_play_live_environment_requires_tool_observation_then_model_synthesis"
      : "live_environment_requires_tool_evidence_path";
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

  const forbiddenFamiliesForTurn = unique([
    ...operationalFields.forbidden_tool_families,
    ...extraForbiddenToolFamilies,
    ...contextualForbiddenToolFamilies(contextualSuppression),
  ]);
  const familyAllowed = (family: HelixToolCallAdmissionFamily): boolean =>
    !forbiddenFamiliesForTurn.includes(family) &&
    !contextualToolSuppressionBlocksFamily(contextualSuppression, family);
  const compoundPromptFamilies: HelixToolCallAdmissionFamily[] = [];
  if (detectScholarlyResearchIntent(promptText).researchRequested && familyAllowed("scholarly_research")) {
    compoundPromptFamilies.push("scholarly_research");
  }
  if (
    (
      detectInternetSearchIntent(promptText).searchRequested ||
      toolUseRestatement.requiredToolFamilies.includes("internet_search")
    ) &&
    familyAllowed("internet_search")
  ) {
    compoundPromptFamilies.push("internet_search");
  }
  if (detectRepoCodeEvidenceIntent(promptText).repoEvidenceRequested && familyAllowed("repo_code")) {
    compoundPromptFamilies.push("repo_code");
  }
  if (toolUseRestatement.requiredToolFamilies.includes("docs_viewer") && familyAllowed("docs_viewer")) {
    compoundPromptFamilies.push("docs_viewer");
  }
  if (theoryLocatorRequested(promptText) && familyAllowed("theory_locator")) {
    compoundPromptFamilies.push("theory_locator");
  }
  const uniqueCompoundPromptFamilies = unique(compoundPromptFamilies);
  if (uniqueCompoundPromptFamilies.length > 1) {
    const nextFamilies = unique([
      ...admittedToolFamilies.filter((family) => family !== "model_only"),
      ...uniqueCompoundPromptFamilies,
    ]);
    if (nextFamilies.length > admittedToolFamilies.filter((family) => family !== "model_only").length) {
      admittedToolFamilies = nextFamilies;
      required = true;
      reason = `${reason}+compound_evidence_families_required`;
    }
  }

  const compoundLocatorRequired =
    theoryLocatorRequested(promptText) &&
    familyAllowed("theory_locator") &&
    (
      effectiveSourceTarget === "scholarly_research" ||
      effectiveSourceTarget === "internet_search" ||
      effectiveSourceTarget === "repo_code" ||
      admittedToolFamilies.includes("scholarly_research") ||
      admittedToolFamilies.includes("internet_search") ||
      admittedToolFamilies.includes("repo_code")
    );
  if (compoundLocatorRequired && !admittedToolFamilies.includes("theory_locator")) {
    admittedToolFamilies = [...admittedToolFamilies.filter((family) => family !== "model_only"), "theory_locator"];
    required = true;
    reason = `${reason}+compound_theory_locator_required`;
  }

  return {
    schema: HELIX_TOOL_CALL_ADMISSION_DECISION_SCHEMA,
    turn_id: input.turnId,
    source_target: effectiveSourceTarget,
    ...(admissionMode !== "direct" ? { admission_mode: admissionMode } : {}),
    ...(discoveryPolicy ? { discovery_policy: discoveryPolicy } : {}),
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
    operational_constraints_ref: operationalFields.operational_constraints_ref,
    forbidden_tools: unique([
      ...operationalFields.forbidden_tools,
      ...extraForbiddenTools,
    ]),
    forbidden_tool_families: unique([
      ...operationalFields.forbidden_tool_families,
      ...extraForbiddenToolFamilies,
      ...forbiddenFamiliesForTurn,
    ]),
    required_surface: operationalFields.required_surface,
    reason,
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function ensureToolCallAdmissionDecisionForPayload(input: {
  payload: Record<string, unknown>;
  turnId: string;
  promptText?: string | null;
}): Record<string, unknown> {
  const existing = readRecord(input.payload.tool_call_admission_decision);
  if (existing) return existing;
  const decision = buildToolCallAdmissionDecision({
    turnId: input.turnId,
    promptText: input.promptText,
    sourceTargetIntent: readRecord(input.payload.source_target_intent),
    routeProductContract: readRecord(input.payload.route_product_contract),
  });
  input.payload.tool_call_admission_decision = decision;
  return decision;
}
