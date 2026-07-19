import crypto from "node:crypto";
import {
  HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
  type HelixAgentStepObservationPacket,
} from "@shared/helix-agent-step-observation-packet";
import type {
  HelixCapabilityLaneBackendSelectionDecision,
  HelixCapabilityLaneResolveTrace,
} from "@shared/helix-capability-lane";
import {
  HELIX_WORKSTATION_TOOL_REFERENCE_LIST_OBSERVATION_SCHEMA,
  HELIX_WORKSTATION_TOOL_REFERENCE_LIST_RESULT_SCHEMA,
  HELIX_WORKSTATION_TOOL_REFERENCE_VISIBLE_TRANSLATION_TARGETS_OBSERVATION_SCHEMA,
  HELIX_WORKSTATION_TOOL_REFERENCE_VISIBLE_TRANSLATION_TARGETS_RESULT_SCHEMA,
  type HelixWorkstationToolReferenceCapabilitySummary,
  type HelixWorkstationToolReferenceListObservation,
  type HelixWorkstationToolReferenceListRequest,
  type HelixWorkstationToolReferenceListResult,
  type HelixWorkstationToolReferenceMode,
  type HelixWorkstationToolReferenceVisibleTranslationTargetsObservation,
  type HelixWorkstationToolReferenceVisibleTranslationTargetsRequest,
  type HelixWorkstationToolReferenceVisibleTranslationTargetsResult,
} from "@shared/helix-workstation-tool-reference-lane";
import type {
  HelixVisibleTranslationTarget,
  HelixVisibleTranslationTargetSourceKind,
} from "@shared/helix-live-translation-lane";
import {
  HELIX_VISIBLE_TRANSLATION_TARGET_BATCH_SCHEMA,
  HELIX_VISIBLE_TRANSLATION_TARGET_SCHEMA,
  HELIX_WORKSTATION_TOOL_REFERENCE_VISIBLE_TRANSLATION_TARGETS_CAPABILITY,
  HELIX_WORKSTATION_VISIBLE_TEXT_TRANSLATION_TARGETS_CAPABILITY,
  type HelixVisibleTranslationTargetCollectorCapability,
} from "@shared/helix-live-translation-lane";
import type { HelixLiveTranslationProjectionTarget } from "@shared/helix-live-translation-projection-target";
import type { HelixAgentProvider } from "../agent-providers/types";
import {
  callWorkstationGatewayCapability,
  listWorkstationGatewayCapabilities,
} from "../workstation-tool-gateway/registry";
import type {
  HelixWorkstationGatewayCallResult,
  HelixWorkstationGatewayMode,
} from "../workstation-tool-gateway/types";
import { HELIX_THEORY_CONTEXT_REFLECTION_CAPABILITY } from "../theory-congruence/capability-contract";
import { resolveHelixCapabilityLaneRequest } from "./registry";

const CAPABILITY_ID = "workstation_tool_reference.list_capabilities" as const;
const COLLECT_VISIBLE_TRANSLATION_TARGETS_CAPABILITY_ID =
  HELIX_WORKSTATION_TOOL_REFERENCE_VISIBLE_TRANSLATION_TARGETS_CAPABILITY;
const THEORY_CONTEXT_REFLECTION_CAPABILITY_ID =
  HELIX_THEORY_CONTEXT_REFLECTION_CAPABILITY;

export type HelixWorkstationTheoryContextReflectionBridgeResult = {
  schema: "helix.workstation_tool_reference.gateway_bridge_result.v1";
  ok: boolean;
  lane_id: "workstation_tool_reference";
  capability: typeof THEORY_CONTEXT_REFLECTION_CAPABILITY_ID;
  delegated_capability_id: typeof THEORY_CONTEXT_REFLECTION_CAPABILITY_ID;
  delegation_status: "gateway_executed" | "blocked_before_gateway";
  selected_runtime_agent_provider: HelixAgentProvider["id"];
  lane_resolve_trace: HelixCapabilityLaneResolveTrace;
  delegated_gateway_call_result: HelixWorkstationGatewayCallResult | null;
  gateway_admission: HelixWorkstationGatewayCallResult["gateway_admission"] | null;
  tool_lifecycle_trace: HelixWorkstationGatewayCallResult["tool_lifecycle_trace"] | null;
  tool_followup_decision: HelixWorkstationGatewayCallResult["tool_followup_decision"] | null;
  observation: unknown;
  observation_packet: HelixAgentStepObservationPacket;
  artifact_refs: string[];
  resolved_source_ref: string | null;
  resolved_text_hash: string | null;
  semantic_prompt_source: string | null;
  semantic_prompt_argument_source:
    | "current_user_request"
    | "runtime_semantic_prompt"
    | "runtime_resolved_referent"
    | "helix_resolved_referent"
    | null;
  semantic_prompt_text_hash: string | null;
  runtime_requested_prompt_hash: string | null;
  runtime_prompt_differed_from_bound_semantic_prompt: boolean;
  error?: string;
  reentry_required: true;
  answer_authority: false;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const readText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const targetLanguageFromAccountLocale = (value: unknown): string => {
  const locale = readText(value);
  if (!locale) return "";
  const [language] = locale.split(/[-_]/);
  return readText(language).toLowerCase() || locale;
};

const readBool = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const readTimestampMs = (value: unknown): number =>
  Math.max(0, Math.trunc(readNumber(value) ?? Date.now()));

const hashText = (value: string): string =>
  `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;

const clipText = (value: unknown, max = 2400): string => {
  const text = readText(value).replace(/\s+\n/g, "\n").trim();
  return text.length > max ? text.slice(0, max).trimEnd() : text;
};

const normalizeMode = (value: unknown): HelixWorkstationToolReferenceMode => {
  const normalized = readText(value).toLowerCase();
  if (
    normalized === "read" ||
    normalized === "observe" ||
    normalized === "act" ||
    normalized === "verify"
  ) {
    return normalized;
  }
  return "observe";
};

const normalizeSourceKind = (value: unknown, panelId: string | null): HelixVisibleTranslationTargetSourceKind => {
  const normalized = readText(value).toLowerCase();
  if (
    normalized === "docs_viewer" ||
    normalized === "panel_text" ||
    normalized === "button_label" ||
    normalized === "note" ||
    normalized === "selection" ||
    normalized === "hover_region"
  ) {
    return normalized;
  }
  return panelId === "docs-viewer" ? "docs_viewer" : "panel_text";
};

const normalizeExistingProjectionStatus = (
  value: unknown,
): HelixVisibleTranslationTarget["existing_projection_status"] => {
  const normalized = readText(value).toLowerCase();
  return normalized === "projected" ||
    normalized === "stale" ||
    normalized === "cancelled" ||
    normalized === "failed"
    ? normalized
    : null;
};

const normalizeExistingFreshnessStatus = (
  value: unknown,
): HelixVisibleTranslationTarget["existing_freshness_status"] => {
  const normalized = readText(value).toLowerCase();
  return normalized === "fresh" || normalized === "stale" || normalized === "unknown"
    ? normalized
    : null;
};

const normalizeExistingTerminalAuthorityStatus = (
  value: unknown,
): HelixVisibleTranslationTarget["existing_terminal_authority_status"] => {
  const normalized = readText(value).toLowerCase();
  return normalized === "not_terminal_authority" ||
    normalized === "pending_helix_terminal_authority" ||
    normalized === "terminal_authority_rejected"
    ? normalized
    : null;
};

const normalizeProjectionTarget = (value: unknown): HelixLiveTranslationProjectionTarget => {
  const normalized = readText(value);
  if (
    normalized === "ask_turn" ||
    normalized === "docs_hover" ||
    normalized === "docs_selection" ||
    normalized === "docs_chunk" ||
    normalized === "audio_chunk" ||
    normalized === "account_language" ||
    normalized === "unknown"
  ) {
    return normalized;
  }
  if (normalized === "docs_viewer.inline_translation") return "docs_chunk";
  return "account_language";
};

const normalizeRequestedCollectorCapability = (
  value: unknown,
): HelixVisibleTranslationTargetCollectorCapability | null => {
  const normalized = readText(value);
  if (
    normalized === HELIX_WORKSTATION_TOOL_REFERENCE_VISIBLE_TRANSLATION_TARGETS_CAPABILITY ||
    normalized === HELIX_WORKSTATION_VISIBLE_TEXT_TRANSLATION_TARGETS_CAPABILITY
  ) {
    return normalized;
  }
  return null;
};

const documentMarkdownSourceId = (docPath: string): string =>
  `document_markdown:${docPath}`;

const readRecordArray = (value: unknown): Array<Record<string, unknown>> =>
  Array.isArray(value)
    ? value.map(readRecord).filter((entry): entry is Record<string, unknown> => Boolean(entry))
    : [];

const readWorkspaceContextSnapshot = (
  request: HelixWorkstationToolReferenceVisibleTranslationTargetsRequest,
): Record<string, unknown> | null =>
  readRecord(request.workspace_context_snapshot ?? request.workspaceContextSnapshot);

const readActiveDocVisibleTranslationContext = (
  request: HelixWorkstationToolReferenceVisibleTranslationTargetsRequest,
): Record<string, unknown> | null => {
  const workspaceSnapshot = readWorkspaceContextSnapshot(request);
  return readRecord(
    request.active_doc_visible_translation_context ??
    request.activeDocVisibleTranslationContext ??
    request.visible_translation_context ??
    request.visibleTranslationContext ??
    workspaceSnapshot?.active_doc_visible_translation_context ??
    workspaceSnapshot?.activeDocVisibleTranslationContext ??
    workspaceSnapshot?.visible_translation_context ??
    workspaceSnapshot?.visibleTranslationContext,
  );
};

const contextMatchesRequestedDoc = (
  request: HelixWorkstationToolReferenceVisibleTranslationTargetsRequest,
  context?: Record<string, unknown> | null,
): boolean => {
  if (!context) return true;
  const requestedDocPath = readText(request.doc_path ?? request.docPath);
  const contextDocPath = readText(context.doc_path ?? context.docPath);
  return !requestedDocPath || !contextDocPath || requestedDocPath === contextDocPath;
};

const collectUiTextRegionChunks = (
  request: HelixWorkstationToolReferenceVisibleTranslationTargetsRequest,
  context?: Record<string, unknown> | null,
): Array<Record<string, unknown>> => {
  const contextRegions = contextMatchesRequestedDoc(request, context)
    ? [
      ...readRecordArray(context?.ui_text_regions ?? context?.uiTextRegions),
      ...readRecordArray(context?.panel_text_regions ?? context?.panelTextRegions),
      ...readRecordArray(context?.visible_ui_text_regions ?? context?.visibleUiTextRegions),
    ]
    : [];
  return [
    ...readRecordArray(request.ui_text_regions ?? request.uiTextRegions),
    ...readRecordArray(request.panel_text_regions ?? request.panelTextRegions),
    ...readRecordArray(request.visible_ui_text_regions ?? request.visibleUiTextRegions),
    ...contextRegions,
  ].map((region, index) => {
    const regionId =
      readText(region.region_id ?? region.regionId) ||
      readText(region.id) ||
      `ui-region-${index + 1}`;
    return {
      ...region,
      visible_text:
        readText(region.visible_text ?? region.visibleText ?? region.text ?? region.label) ||
        region.visible_text,
      source_kind: readText(region.source_kind ?? region.sourceKind) || "panel_text",
      region_id: regionId,
      chunk_id: readText(region.chunk_id ?? region.chunkId) || regionId,
      projection_target:
        readText(region.projection_target ?? region.projectionTarget) ||
        "account_language",
    };
  });
};

const collectRawVisibleChunks = (
  request: HelixWorkstationToolReferenceVisibleTranslationTargetsRequest,
): Array<Record<string, unknown>> => {
  const context = readActiveDocVisibleTranslationContext(request);
  const provided = Array.isArray(request.visible_text_chunks) ? request.visible_text_chunks : [];
  const fromProvided = provided
    .map(readRecord)
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
  const fromContext = contextMatchesRequestedDoc(request, context) && Array.isArray(context?.chunks)
    ? context.chunks
        .map(readRecord)
        .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    : [];
  const fromUiRegions = collectUiTextRegionChunks(request, context);
  const fallbackChunks: Array<Record<string, unknown>> = [];
  const titleText = clipText(request.title_text, 700);
  const bodyText = clipText(request.body_text, 2400);
  const selectedText = clipText(
    request.selected_text ??
    request.selectedText ??
    request.selection_text ??
    request.selectionText,
    2400,
  );
  const selectionRef = readText(request.selection_ref ?? request.selectionRef);
  const hoverText = clipText(
    request.hover_text ??
    request.hoverText ??
    request.hover_region_text ??
    request.hoverRegionText ??
    request.active_region_text ??
    request.activeRegionText,
    2400,
  );
  const hoverRef = readText(
    request.hover_ref ??
    request.hoverRef ??
    request.active_region_ref ??
    request.activeRegionRef,
  );
  const visibleText = clipText(request.visible_text, 2400);
  if (selectedText) {
    fallbackChunks.push({
      visible_text: selectedText,
      source_kind: "selection",
      region_id: selectionRef || "selection",
      chunk_id: selectionRef || "selection",
      projection_target: "docs_selection",
    });
  }
  if (!selectedText && hoverText) {
    fallbackChunks.push({
      visible_text: hoverText,
      source_kind: "hover_region",
      region_id: hoverRef || "hover_region",
      chunk_id: hoverRef || "hover_region",
      projection_target: "docs_hover",
    });
  }
  if (titleText) fallbackChunks.push({ visible_text: titleText, source_kind: "docs_viewer", region_id: "title" });
  if (bodyText) fallbackChunks.push({ visible_text: bodyText, source_kind: "docs_viewer", region_id: "body" });
  if (!selectedText && !hoverText && !titleText && !bodyText && visibleText) fallbackChunks.push({ visible_text: visibleText });
  if (fromProvided.length > 0) return [...fromProvided, ...fromUiRegions];
  if (fromContext.length > 0) return [...fromContext, ...fromUiRegions];
  if (fromUiRegions.length > 0) return fromUiRegions;
  return fallbackChunks;
};

const buildVisibleTranslationTargets = (input: {
  request: HelixWorkstationToolReferenceVisibleTranslationTargetsRequest;
  maxChunks: number;
  observedAtMs: number;
}): HelixVisibleTranslationTarget[] => {
  const request = input.request;
  const context = readActiveDocVisibleTranslationContext(request);
  const panelId = readText(request.active_panel_id) || readText(context?.panel_id ?? context?.panelId) || "docs-viewer";
  const docPath = readText(request.doc_path) || readText(context?.doc_path ?? context?.docPath) || null;
  const accountLocale = readText(request.account_locale) || readText(context?.account_locale ?? context?.accountLocale) || null;
  const targetLanguage =
    readText(request.target_language) ||
    readText(context?.target_language ?? context?.targetLanguage) ||
    targetLanguageFromAccountLocale(accountLocale) ||
    "es";
  const projectionTarget = normalizeProjectionTarget(
    request.projection_target ?? context?.projection_target ?? context?.projectionTarget,
  );
  const sourceBase = docPath
    ? documentMarkdownSourceId(docPath)
    : panelId || "visible-workstation";
  const sourceHash = readText(request.source_hash) || readText(context?.source_hash ?? context?.sourceHash) || hashText(sourceBase);
  return collectRawVisibleChunks(request)
    .slice(0, input.maxChunks)
    .map((chunk, index) => {
      const visibleText =
        clipText(chunk.visible_text ?? chunk.visibleText ?? chunk.text ?? chunk.source_text ?? chunk.sourceText, 2400);
      if (!visibleText) return null;
      const chunkId = readText(chunk.chunk_id ?? chunk.chunkId) || `visible-chunk-${index + 1}`;
      const sourceId = readText(chunk.source_id ?? chunk.sourceId) || `${sourceBase}#${chunkId}`;
      const sourceTextHash = readText(chunk.source_text_hash ?? chunk.sourceTextHash) || hashText(visibleText);
      const sourceTextCharCount =
        readNumber(chunk.source_text_char_count ?? chunk.sourceTextCharCount) ?? visibleText.length;
      const sourceEventId =
        readText(chunk.source_event_id ?? chunk.sourceEventId) ||
        `${sourceId}:${sourceTextHash}:${chunkId}:${targetLanguage}`;
      const sourceEventMs = readNumber(chunk.source_event_ms ?? chunk.sourceEventMs) ?? input.observedAtMs;
      const observedAtMs = readNumber(chunk.observed_at_ms ?? chunk.observedAtMs) ?? input.observedAtMs;
      const sourceKind = normalizeSourceKind(chunk.source_kind ?? chunk.sourceKind, panelId);
      const targetProjectionTarget = normalizeProjectionTarget(
        chunk.projection_target ?? chunk.projectionTarget ?? projectionTarget,
      );
      const regionId = readText(chunk.region_id ?? chunk.regionId) || null;
      const dedupeKey =
        readText(chunk.dedupe_key ?? chunk.dedupeKey) ||
        `${sourceId}:${sourceTextHash}:${targetLanguage}:${chunkId}`;
      const existingReceiptRef =
        readText(
          chunk.existing_receipt_ref ??
          chunk.existingReceiptRef ??
          chunk.existing_translation_receipt_ref ??
          chunk.existingTranslationReceiptRef,
        ) || null;
      const target: HelixVisibleTranslationTarget = {
        schema: HELIX_VISIBLE_TRANSLATION_TARGET_SCHEMA,
        source_kind: sourceKind,
        panel_id: readText(chunk.panel_id ?? chunk.panelId) || panelId,
        doc_path: readText(chunk.doc_path ?? chunk.docPath) || docPath,
        document_source_kind: (
          readText(chunk.document_source_kind ?? chunk.documentSourceKind) ||
          readText(context?.document_source_kind ?? context?.documentSourceKind) ||
          null
        ) as HelixVisibleTranslationTarget["document_source_kind"],
        document_ref:
          readText(chunk.document_ref ?? chunk.documentRef) ||
          readText(context?.document_ref ?? context?.documentRef) ||
          null,
        private_source:
          (chunk.private_source ?? chunk.privateSource ?? context?.private_source ?? context?.privateSource) === true,
        source_id: sourceId,
        source_hash: readText(chunk.source_hash ?? chunk.sourceHash) || sourceHash,
        source_text_hash: sourceTextHash,
        source_text_char_count: sourceTextCharCount,
        source_event_id: sourceEventId,
        source_event_ms: sourceEventMs,
        observed_at_ms: observedAtMs,
        visible_text: visibleText,
        chunk_id: chunkId,
        chunk_index: readNumber(chunk.chunk_index ?? chunk.chunkIndex) ?? index,
        region_id: regionId,
        bbox: readRecord(chunk.bbox ?? chunk.bbox_px ?? chunk.bboxPx),
        dedupe_key: dedupeKey,
        projection_target: targetProjectionTarget,
        account_locale: accountLocale,
        target_language: targetLanguage,
        existing_observation_ref:
          readText(chunk.existing_observation_ref ?? chunk.existingObservationRef) || null,
        existing_receipt_ref: existingReceiptRef,
        existing_translation_receipt_ref: existingReceiptRef,
        existing_projection_status: normalizeExistingProjectionStatus(
          chunk.existing_projection_status ?? chunk.existingProjectionStatus,
        ),
        existing_freshness_status: normalizeExistingFreshnessStatus(
          chunk.existing_freshness_status ?? chunk.existingFreshnessStatus,
        ),
        existing_terminal_authority_status: normalizeExistingTerminalAuthorityStatus(
          chunk.existing_terminal_authority_status ?? chunk.existingTerminalAuthorityStatus,
        ),
        existing_source_event_ms: readNumber(
          chunk.existing_source_event_ms ?? chunk.existingSourceEventMs,
        ),
        existing_observed_at_ms: readNumber(
          chunk.existing_observed_at_ms ?? chunk.existingObservedAtMs,
        ),
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        reentry_required: true,
      };
      return target;
    })
    .filter((target): target is HelixVisibleTranslationTarget => target !== null);
};

const buildLaneObservationPacket = (input: {
  turnId: string;
  iteration: number;
  status: HelixAgentStepObservationPacket["status"];
  summary: string;
  observationRef: string;
  backendSelectionDecision: HelixCapabilityLaneBackendSelectionDecision;
  mode: HelixWorkstationToolReferenceMode;
  capabilityId?: typeof CAPABILITY_ID | typeof COLLECT_VISIBLE_TRANSLATION_TARGETS_CAPABILITY_ID;
  visibleTranslationTargetBatch?: HelixAgentStepObservationPacket["state_delta"]["visible_translation_target_batch"];
}): HelixAgentStepObservationPacket => {
  const capabilityId = input.capabilityId ?? CAPABILITY_ID;
  const isVisibleTargetCollector = capabilityId === COLLECT_VISIBLE_TRANSLATION_TARGETS_CAPABILITY_ID;
  return {
    schema: HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
    turn_id: input.turnId,
    iteration: input.iteration,
    call_id: `${input.turnId}:capability_lane:${capabilityId}:call`,
    decision_id: `${input.turnId}:capability_lane:${capabilityId}:decision`,
    capability_key: capabilityId,
    panel_id: "capability_lane",
    action: isVisibleTargetCollector
      ? "collect_visible_translation_targets"
      : "list_capabilities",
    status: input.status,
    produced_artifact_refs: [input.observationRef],
    observation_summary: input.summary,
    receipts: [],
    missing_requirements: [],
    backend_selection_decision: input.backendSelectionDecision,
    state_delta: {
      workstation_tool_reference: {
        gateway_mode: input.mode,
        observation_ref: input.observationRef,
        answer_authority: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      ...(input.visibleTranslationTargetBatch
        ? { visible_translation_target_batch: input.visibleTranslationTargetBatch }
        : {}),
    },
    suggested_next_steps:
      input.status === "succeeded"
        ? ["answer", "use_another_tool"]
        : ["repair", "fail_closed"],
    produced_affordances: [],
    consumed_affordances: [],
    typed_handoff_contract: {
      schema: "helix.workstation_typed_handoff_contract.v1",
      producer_capability: capabilityId,
      consumer_capability: isVisibleTargetCollector
        ? "live_translation.translate_text"
        : null,
      required_affordance_kinds: [],
      produced_affordance_kinds: isVisibleTargetCollector
        ? ["visible_translation_targets"]
        : ["system_status"],
      missing_affordance_kinds: [],
      terminal_eligible: false,
      answer_authority: false,
      assistant_answer: false,
      raw_content_included: false,
    },
    answer_authority: false,
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  };
};

const withExecutionTrace = (input: {
  trace: HelixCapabilityLaneResolveTrace;
  observationRef: string | null;
  status: "executed_observation_only" | "not_executed_shadow_only";
  blockedReason?: string | null;
}): HelixCapabilityLaneResolveTrace => ({
  ...input.trace,
  execution_status: input.status,
  result_ref: input.observationRef,
  observation_ref: input.observationRef,
  receipt_ref: null,
  blocked_reason: input.blockedReason ?? input.trace.blocked_reason,
});

const readStringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map(readText).filter(Boolean)
    : [];

const isUnresolvedTheoryDeicticPrompt = (value: string): boolean =>
  /^(?:this|that|it)[\s.!?,;:]*$/i.test(value.trim());

const buildTheoryBridgeGatewayArguments = (input: {
  call: Record<string, unknown>;
  prompt: string;
}): Record<string, unknown> => {
  const call = input.call;
  const args: Record<string, unknown> = { prompt: input.prompt };
  const stringFields = [
    "conversation_context",
    "operation",
    "target",
    "target_observable",
    "coordinate_frame",
    "formal_system",
    "requested_precision",
    "evidence_maturity_ceiling",
  ] as const;
  for (const field of stringFields) {
    const value = readText(call[field]);
    if (value) args[field] = value;
  }
  const mentionedEquations = readStringList(call.mentioned_equations ?? call.mentionedEquations);
  const mentionedSymbols = readStringList(call.mentioned_symbols ?? call.mentionedSymbols);
  const mentionedDomains = readStringList(call.mentioned_domains ?? call.mentionedDomains);
  const initialBoundaryConditions = readStringList(
    call.initial_boundary_conditions ?? call.initialBoundaryConditions,
  );
  if (mentionedEquations.length > 0) args.mentioned_equations = mentionedEquations;
  if (mentionedSymbols.length > 0) args.mentioned_symbols = mentionedSymbols;
  if (mentionedDomains.length > 0) args.mentioned_domains = mentionedDomains;
  if (initialBoundaryConditions.length > 0) {
    args.initial_boundary_conditions = initialBoundaryConditions;
  }
  if (typeof call.build_explanation_plan === "boolean") {
    args.build_explanation_plan = call.build_explanation_plan;
  } else if (typeof call.buildExplanationPlan === "boolean") {
    args.build_explanation_plan = call.buildExplanationPlan;
  }
  const numberFields = ["limit", "scale_min_log10_m", "scale_max_log10_m"] as const;
  for (const field of numberFields) {
    const value = readNumber(call[field]);
    if (value !== null) args[field] = value;
  }
  return args;
};

const buildTheoryBridgeBlockedResult = (input: {
  provider: HelixAgentProvider;
  turnId: string;
  iteration: number;
  trace: HelixCapabilityLaneResolveTrace;
  reason: string;
  summary: string;
  prompt: string;
  resolvedSourceRef: string | null;
  resolvedTextHash: string | null;
  semanticPromptSource: string | null;
}): HelixWorkstationTheoryContextReflectionBridgeResult => {
  const observationRef = `${input.turnId}:capability_lane:${THEORY_CONTEXT_REFLECTION_CAPABILITY_ID}:${hashShort({
    reason: input.reason,
    prompt: input.prompt,
    resolved_source_ref: input.resolvedSourceRef,
    resolved_text_hash: input.resolvedTextHash,
  })}`;
  const observation = {
    schema: "helix.workstation_tool_reference.theory_reflection_bridge_observation.v1",
    capability_key: THEORY_CONTEXT_REFLECTION_CAPABILITY_ID,
    status: "blocked",
    blocked_reason: input.reason,
    requested_prompt: input.prompt,
    resolved_source_ref: input.resolvedSourceRef,
    resolved_text_hash: input.resolvedTextHash,
    semantic_prompt_source: input.semanticPromptSource,
    answer_authority: false,
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  } as const;
  const packet: HelixAgentStepObservationPacket = {
    schema: HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
    turn_id: input.turnId,
    iteration: input.iteration,
    call_id: `${input.turnId}:capability_lane:${THEORY_CONTEXT_REFLECTION_CAPABILITY_ID}:call`,
    decision_id: `${input.turnId}:capability_lane:${THEORY_CONTEXT_REFLECTION_CAPABILITY_ID}:decision`,
    capability_key: THEORY_CONTEXT_REFLECTION_CAPABILITY_ID,
    panel_id: "capability_lane",
    action: "reflect_theory_context",
    status: "blocked",
    produced_artifact_refs: [observationRef],
    observation_summary: input.summary,
    receipts: [],
    missing_requirements: [{
      code: input.reason,
      message: input.summary,
      repair_action: input.reason === "referent_resolution_required"
        ? "supply_resolved_semantic_prompt_and_source_provenance"
        : "use_configured_lane_backend_or_supported_capability",
    }],
    backend_selection_decision: input.trace.backend_selection_decision,
    state_delta: {
      workstation_tool_reference: {
        gateway_mode: "read",
        observation_ref: observationRef,
        answer_authority: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    },
    suggested_next_steps: input.reason === "referent_resolution_required"
      ? ["repair", "ask_user"]
      : ["repair", "fail_closed"],
    produced_affordances: [],
    consumed_affordances: [],
    typed_handoff_contract: {
      schema: "helix.workstation_typed_handoff_contract.v1",
      producer_capability: THEORY_CONTEXT_REFLECTION_CAPABILITY_ID,
      consumer_capability: null,
      required_affordance_kinds: [],
      produced_affordance_kinds: [],
      missing_affordance_kinds: [],
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    },
    answer_authority: false,
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  return {
    schema: "helix.workstation_tool_reference.gateway_bridge_result.v1",
    ok: false,
    lane_id: "workstation_tool_reference",
    capability: THEORY_CONTEXT_REFLECTION_CAPABILITY_ID,
    delegated_capability_id: THEORY_CONTEXT_REFLECTION_CAPABILITY_ID,
    delegation_status: "blocked_before_gateway",
    selected_runtime_agent_provider: input.provider.id,
    lane_resolve_trace: withExecutionTrace({
      trace: input.trace,
      observationRef,
      status: "not_executed_shadow_only",
      blockedReason: input.reason,
    }),
    delegated_gateway_call_result: null,
    gateway_admission: null,
    tool_lifecycle_trace: null,
    tool_followup_decision: null,
    observation,
    observation_packet: packet,
    artifact_refs: packet.produced_artifact_refs,
    resolved_source_ref: input.resolvedSourceRef,
    resolved_text_hash: input.resolvedTextHash,
    semantic_prompt_source: input.semanticPromptSource,
    semantic_prompt_argument_source: null,
    semantic_prompt_text_hash: input.prompt ? `sha256:${hashShort(input.prompt)}` : null,
    runtime_requested_prompt_hash: input.prompt ? `sha256:${hashShort(input.prompt)}` : null,
    runtime_prompt_differed_from_bound_semantic_prompt: false,
    error: input.reason,
    reentry_required: true,
    answer_authority: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

/**
 * Thin runtime-callable adapter for the canonical theory reflection gateway.
 * It performs lane admission and referent safety checks, then delegates to the
 * existing workstation gateway instead of reproducing graph/reflection logic.
 */
export const runWorkstationToolReferenceTheoryContextReflection = async (input: {
  provider: HelixAgentProvider;
  call: Record<string, unknown>;
  turnId?: string | null;
  iteration?: number | null;
  env?: NodeJS.ProcessEnv;
}): Promise<HelixWorkstationTheoryContextReflectionBridgeResult> => {
  const turnId = input.turnId?.trim() || readText(input.call.turn_id ?? input.call.turnId) ||
    "ask:lane:theory_context_reflection";
  const iteration = typeof input.iteration === "number" && Number.isFinite(input.iteration)
    ? Math.max(0, Math.trunc(input.iteration))
    : 0;
  const requestedBackendProvider = readText(
    input.call.requested_backend_provider ?? input.call.requestedBackendProvider,
  ) || null;
  const trace = resolveHelixCapabilityLaneRequest({
    provider: input.provider,
    requestedLane: "workstation_tool_reference",
    requestedBackendProvider,
    env: input.env,
  });
  const requestedPrompt = readText(input.call.prompt);
  const userSemanticPrompt = readText(
    input.call.user_semantic_prompt ?? input.call.userSemanticPrompt,
  );
  const resolvedReferentText = readText(
    input.call.resolved_referent_text ?? input.call.resolvedReferentText,
  );
  const resolvedSourceRef = readText(
    input.call.resolved_source_ref ?? input.call.resolvedSourceRef,
  ) || null;
  const resolvedTextHash = readText(
    input.call.resolved_text_hash ?? input.call.resolvedTextHash,
  ) || null;
  const semanticPromptSource = readText(
    input.call.semantic_prompt_source ?? input.call.semanticPromptSource,
  ) || null;
  const resolvedReferentAuthority = readText(
    input.call.resolved_referent_authority ?? input.call.resolvedReferentAuthority,
  ) || null;

  if (trace.admission_status !== "admitted_shadow_only") {
    const reason = trace.blocked_reason ?? "workstation_tool_reference_lane_blocked";
    return buildTheoryBridgeBlockedResult({
      provider: input.provider,
      turnId,
      iteration,
      trace,
      reason,
      summary: `Theory reflection gateway bridge blocked: ${reason}.`,
      prompt: requestedPrompt,
      resolvedSourceRef,
      resolvedTextHash,
      semanticPromptSource,
    });
  }

  const promptIsUnresolvedDeictic = isUnresolvedTheoryDeicticPrompt(requestedPrompt);
  const hasBoundResolvedReferent = Boolean(
    resolvedReferentText &&
    !isUnresolvedTheoryDeicticPrompt(resolvedReferentText) &&
    resolvedSourceRef &&
    resolvedTextHash,
  );
  if (promptIsUnresolvedDeictic && !hasBoundResolvedReferent) {
    return buildTheoryBridgeBlockedResult({
      provider: input.provider,
      turnId,
      iteration,
      trace,
      reason: "referent_resolution_required",
      summary:
        "Theory reflection requires a resolved semantic prompt plus resolved_source_ref and resolved_text_hash; a bare this/that/it prompt cannot be sent to the graph.",
      prompt: requestedPrompt,
      resolvedSourceRef,
      resolvedTextHash,
      semanticPromptSource,
    });
  }

  const semanticPrompt = hasBoundResolvedReferent
    ? resolvedReferentText
    : userSemanticPrompt || requestedPrompt;
  const semanticPromptArgumentSource = hasBoundResolvedReferent
    ? resolvedReferentAuthority === "helix_policy"
      ? "helix_resolved_referent" as const
      : "runtime_resolved_referent" as const
    : userSemanticPrompt
      ? "current_user_request" as const
      : "runtime_semantic_prompt" as const;
  const gatewayResult = await callWorkstationGatewayCapability({
    agentRuntime: input.provider.id,
    mode: "read",
    capabilityId: THEORY_CONTEXT_REFLECTION_CAPABILITY_ID,
    arguments: buildTheoryBridgeGatewayArguments({
      call: input.call,
      prompt: semanticPrompt,
    }),
    turnId,
    iteration,
  });
  const observationRef = gatewayResult.artifact_refs[0] ?? `${turnId}:capability_lane:${THEORY_CONTEXT_REFLECTION_CAPABILITY_ID}:${hashShort({
    ok: gatewayResult.ok,
    prompt: semanticPrompt,
  })}`;
  return {
    schema: "helix.workstation_tool_reference.gateway_bridge_result.v1",
    ok: gatewayResult.ok,
    lane_id: "workstation_tool_reference",
    capability: THEORY_CONTEXT_REFLECTION_CAPABILITY_ID,
    delegated_capability_id: THEORY_CONTEXT_REFLECTION_CAPABILITY_ID,
    delegation_status: "gateway_executed",
    selected_runtime_agent_provider: input.provider.id,
    lane_resolve_trace: withExecutionTrace({
      trace,
      observationRef,
      status: "executed_observation_only",
      blockedReason: gatewayResult.error ?? null,
    }),
    delegated_gateway_call_result: gatewayResult,
    gateway_admission: gatewayResult.gateway_admission,
    tool_lifecycle_trace: gatewayResult.tool_lifecycle_trace,
    tool_followup_decision: gatewayResult.tool_followup_decision,
    observation: gatewayResult.observation,
    observation_packet: gatewayResult.observation_packet,
    artifact_refs: gatewayResult.artifact_refs,
    resolved_source_ref: resolvedSourceRef,
    resolved_text_hash: resolvedTextHash,
    semantic_prompt_source: semanticPromptSource,
    semantic_prompt_argument_source: semanticPromptArgumentSource,
    semantic_prompt_text_hash: semanticPrompt ? `sha256:${hashShort(semanticPrompt)}` : null,
    runtime_requested_prompt_hash: requestedPrompt ? `sha256:${hashShort(requestedPrompt)}` : null,
    runtime_prompt_differed_from_bound_semantic_prompt:
      Boolean(requestedPrompt && semanticPrompt && requestedPrompt !== semanticPrompt),
    ...(gatewayResult.error ? { error: gatewayResult.error } : {}),
    reentry_required: true,
    answer_authority: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

const summarizeCapabilities = (
  capabilities: ReturnType<typeof listWorkstationGatewayCapabilities>["capabilities"],
): HelixWorkstationToolReferenceCapabilitySummary[] =>
  capabilities.map((capability) => ({
    capability_id: capability.capability_id,
    label: capability.label,
    panel_id: capability.panel_id,
    action_id: capability.action_id,
    mode: capability.mode,
    permission_profile_required: capability.permission_profile_required,
    requires_confirmation: capability.requires_confirmation,
    answer_authority: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  }));

export const runWorkstationToolReferenceListCapabilities = (input: {
  provider: HelixAgentProvider;
  request: HelixWorkstationToolReferenceListRequest;
  turnId?: string | null;
  iteration?: number | null;
  env?: NodeJS.ProcessEnv;
}): HelixWorkstationToolReferenceListResult => {
  const turnId = input.turnId?.trim() || input.request.turn_id?.trim() || "ask:lane:workstation_tool_reference";
  const iteration = typeof input.iteration === "number" && Number.isFinite(input.iteration)
    ? Math.max(0, Math.trunc(input.iteration))
    : 0;
  const mode = normalizeMode(input.request.mode);
  const trace = resolveHelixCapabilityLaneRequest({
    provider: input.provider,
    requestedLane: "workstation_tool_reference",
    requestedBackendProvider: input.request.requested_backend_provider,
    env: input.env,
  });

  if (trace.admission_status !== "admitted_shadow_only") {
    const observationRef = `${turnId}:capability_lane:${CAPABILITY_ID}:${hashShort({
      status: trace.admission_status,
      mode,
    })}`;
    const packet = buildLaneObservationPacket({
      turnId,
      iteration,
      status: "blocked",
      summary: `Workstation tool reference lane blocked: ${trace.blocked_reason ?? "not_admitted"}.`,
      observationRef,
      backendSelectionDecision: trace.backend_selection_decision,
      mode,
    });
    return {
      schema: HELIX_WORKSTATION_TOOL_REFERENCE_LIST_RESULT_SCHEMA,
      ok: false,
      lane_id: "workstation_tool_reference",
      capability: CAPABILITY_ID,
      selected_runtime_agent_provider: input.provider.id,
      lane_resolve_trace: withExecutionTrace({
        trace,
        observationRef,
        status: "not_executed_shadow_only",
        blockedReason: trace.blocked_reason,
      }),
      observation: null,
      observation_packet: packet,
      artifact_refs: packet.produced_artifact_refs,
      error: trace.blocked_reason ?? "workstation_tool_reference_lane_blocked",
      reentry_required: true,
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  const manifest = listWorkstationGatewayCapabilities({
    agentRuntime: input.provider.id,
    mode: mode as HelixWorkstationGatewayMode,
  });
  const capabilities = summarizeCapabilities(manifest.capabilities);
  const capabilityIds = capabilities.map((capability) => capability.capability_id);
  const observationRef = `${turnId}:capability_lane:${CAPABILITY_ID}:${hashShort({
    runtime: input.provider.id,
    mode,
    capabilityIds,
  })}`;
  const observation: HelixWorkstationToolReferenceListObservation = {
    schema: HELIX_WORKSTATION_TOOL_REFERENCE_LIST_OBSERVATION_SCHEMA,
    observation_id: `${turnId}:workstation_tool_reference:observation`,
    observation_ref: observationRef,
    lane_id: "workstation_tool_reference",
    capability: CAPABILITY_ID,
    selected_runtime_agent_provider: input.provider.id,
    requested_backend_provider: trace.requested_backend_provider,
    selected_backend_provider: trace.selected_backend_provider,
    selection_reason: trace.selection_reason,
    backend_selection_decision: trace.backend_selection_decision,
    gateway_manifest_version: manifest.manifest_version,
    gateway_mode: manifest.mode,
    capability_count: capabilities.length,
    capability_ids: capabilityIds,
    capabilities,
    deterministic: true,
    reentry_required: true,
    answer_authority: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
  const packet = buildLaneObservationPacket({
    turnId,
    iteration,
    status: "succeeded",
    summary: `Workstation gateway catalog ready: ${capabilities.length} capabilities.`,
    observationRef,
    backendSelectionDecision: trace.backend_selection_decision,
    mode,
  });

  return {
    schema: HELIX_WORKSTATION_TOOL_REFERENCE_LIST_RESULT_SCHEMA,
    ok: true,
    lane_id: "workstation_tool_reference",
    capability: CAPABILITY_ID,
    selected_runtime_agent_provider: input.provider.id,
    lane_resolve_trace: withExecutionTrace({
      trace,
      observationRef,
      status: "executed_observation_only",
    }),
    observation,
    observation_packet: packet,
    artifact_refs: packet.produced_artifact_refs,
    capability_count: capabilities.length,
    reentry_required: true,
    answer_authority: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const runWorkstationToolReferenceCollectVisibleTranslationTargets = (input: {
  provider: HelixAgentProvider;
  request: HelixWorkstationToolReferenceVisibleTranslationTargetsRequest;
  turnId?: string | null;
  iteration?: number | null;
  env?: NodeJS.ProcessEnv;
  nowMs?: number | null;
}): HelixWorkstationToolReferenceVisibleTranslationTargetsResult => {
  const turnId = input.turnId?.trim() || input.request.turn_id?.trim() || "ask:lane:visible_translation_targets";
  const iteration = typeof input.iteration === "number" && Number.isFinite(input.iteration)
    ? Math.max(0, Math.trunc(input.iteration))
    : 0;
  const maxChunks = typeof input.request.max_chunks === "number" && Number.isFinite(input.request.max_chunks)
    ? Math.max(1, Math.min(24, Math.trunc(input.request.max_chunks)))
    : 12;
  const trace = resolveHelixCapabilityLaneRequest({
    provider: input.provider,
    requestedLane: "workstation_tool_reference",
    requestedBackendProvider: input.request.requested_backend_provider,
    env: input.env,
  });

  const observedAtMs = readTimestampMs(input.nowMs);
  const targets = trace.admission_status === "admitted_shadow_only"
    ? buildVisibleTranslationTargets({ request: input.request, maxChunks, observedAtMs })
    : [];
  const batchRef = `${turnId}:capability_lane:${COLLECT_VISIBLE_TRANSLATION_TARGETS_CAPABILITY_ID}:batch:${hashShort({
    targets: targets.map((target) => ({
      doc_path: target.doc_path,
      source_id: target.source_id,
      source_hash: target.source_hash,
      source_text_hash: target.source_text_hash,
      source_event_id: target.source_event_id,
      chunk_id: target.chunk_id,
      chunk_index: target.chunk_index,
      dedupe_key: target.dedupe_key,
      projection_target: target.projection_target,
      account_locale: target.account_locale,
      target_language: target.target_language,
    })),
  })}`;
  const targetBatch = {
    schema: HELIX_VISIBLE_TRANSLATION_TARGET_BATCH_SCHEMA,
    batch_ref: batchRef,
    target_count: targets.length,
    targets,
    visible_only: readBool(input.request.visible_only, true),
    max_chunks: maxChunks,
    requested_collector_capability: normalizeRequestedCollectorCapability(
      input.request.requested_collector_capability ?? input.request.capability,
    ),
    collector_capability: COLLECT_VISIBLE_TRANSLATION_TARGETS_CAPABILITY_ID,
    translation_capability_required: "live_translation.translate_text",
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    reentry_required: true,
  } as const;
  const blockedReason = trace.admission_status !== "admitted_shadow_only"
    ? trace.blocked_reason ?? "visible_translation_target_collector_not_admitted"
    : targets.length === 0
      ? "visible_translation_targets_missing"
      : null;
  const observationRef = `${turnId}:capability_lane:${COLLECT_VISIBLE_TRANSLATION_TARGETS_CAPABILITY_ID}:${hashShort({
    blockedReason,
    batchRef,
  })}`;
  const packet = buildLaneObservationPacket({
    turnId,
    iteration,
    status: blockedReason ? "blocked" : "succeeded",
    summary: blockedReason
      ? `Visible translation target collection blocked: ${blockedReason}.`
      : `Visible translation target collection returned ${targets.length} chunk(s).`,
    observationRef,
    backendSelectionDecision: trace.backend_selection_decision,
    mode: "read",
    capabilityId: COLLECT_VISIBLE_TRANSLATION_TARGETS_CAPABILITY_ID,
    visibleTranslationTargetBatch: targetBatch,
  });

  if (blockedReason) {
    return {
      schema: HELIX_WORKSTATION_TOOL_REFERENCE_VISIBLE_TRANSLATION_TARGETS_RESULT_SCHEMA,
      ok: false,
      lane_id: "workstation_tool_reference",
      capability: COLLECT_VISIBLE_TRANSLATION_TARGETS_CAPABILITY_ID,
      selected_runtime_agent_provider: input.provider.id,
      lane_resolve_trace: withExecutionTrace({
        trace,
        observationRef,
        status: trace.admission_status === "admitted_shadow_only"
          ? "executed_observation_only"
          : "not_executed_shadow_only",
        blockedReason,
      }),
      observation: null,
      observation_packet: packet,
      artifact_refs: packet.produced_artifact_refs,
      target_count: 0,
      error: blockedReason,
      reentry_required: true,
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  const observation: HelixWorkstationToolReferenceVisibleTranslationTargetsObservation = {
    schema: HELIX_WORKSTATION_TOOL_REFERENCE_VISIBLE_TRANSLATION_TARGETS_OBSERVATION_SCHEMA,
    observation_id: `${turnId}:visible_translation_targets:observation`,
    observation_ref: observationRef,
    lane_id: "workstation_tool_reference",
    capability: COLLECT_VISIBLE_TRANSLATION_TARGETS_CAPABILITY_ID,
    selected_runtime_agent_provider: input.provider.id,
    requested_backend_provider: trace.requested_backend_provider,
    selected_backend_provider: trace.selected_backend_provider,
    selection_reason: trace.selection_reason,
    backend_selection_decision: trace.backend_selection_decision,
    target_batch: targetBatch,
    deterministic: true,
    reentry_required: true,
    answer_authority: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    schema: HELIX_WORKSTATION_TOOL_REFERENCE_VISIBLE_TRANSLATION_TARGETS_RESULT_SCHEMA,
    ok: true,
    lane_id: "workstation_tool_reference",
    capability: COLLECT_VISIBLE_TRANSLATION_TARGETS_CAPABILITY_ID,
    selected_runtime_agent_provider: input.provider.id,
    lane_resolve_trace: withExecutionTrace({
      trace,
      observationRef,
      status: "executed_observation_only",
    }),
    observation,
    observation_packet: packet,
    artifact_refs: packet.produced_artifact_refs,
    target_count: targets.length,
    reentry_required: true,
    answer_authority: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};
