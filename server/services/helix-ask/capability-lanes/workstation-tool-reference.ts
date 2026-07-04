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
} from "@shared/helix-live-translation-lane";
import type { HelixLiveTranslationProjectionTarget } from "@shared/helix-live-translation-projection-target";
import type { HelixAgentProvider } from "../agent-providers/types";
import { listWorkstationGatewayCapabilities } from "../workstation-tool-gateway/registry";
import type { HelixWorkstationGatewayMode } from "../workstation-tool-gateway/types";
import { resolveHelixCapabilityLaneRequest } from "./registry";

const CAPABILITY_ID = "workstation_tool_reference.list_capabilities" as const;
const COLLECT_VISIBLE_TRANSLATION_TARGETS_CAPABILITY_ID =
  "workstation_tool_reference.collect_visible_translation_targets" as const;

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const readText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const readBool = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

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

const collectRawVisibleChunks = (
  request: HelixWorkstationToolReferenceVisibleTranslationTargetsRequest,
): Array<Record<string, unknown>> => {
  const provided = Array.isArray(request.visible_text_chunks) ? request.visible_text_chunks : [];
  const fromProvided = provided
    .map(readRecord)
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
  const fallbackChunks: Array<Record<string, unknown>> = [];
  const titleText = clipText(request.title_text, 700);
  const bodyText = clipText(request.body_text, 2400);
  const visibleText = clipText(request.visible_text, 2400);
  if (titleText) fallbackChunks.push({ visible_text: titleText, source_kind: "docs_viewer", region_id: "title" });
  if (bodyText) fallbackChunks.push({ visible_text: bodyText, source_kind: "docs_viewer", region_id: "body" });
  if (!titleText && !bodyText && visibleText) fallbackChunks.push({ visible_text: visibleText });
  return fromProvided.length > 0 ? fromProvided : fallbackChunks;
};

const buildVisibleTranslationTargets = (input: {
  request: HelixWorkstationToolReferenceVisibleTranslationTargetsRequest;
  maxChunks: number;
}): HelixVisibleTranslationTarget[] => {
  const request = input.request;
  const panelId = readText(request.active_panel_id) || "docs-viewer";
  const docPath = readText(request.doc_path) || null;
  const accountLocale = readText(request.account_locale) || null;
  const targetLanguage = readText(request.target_language) || accountLocale || "es";
  const projectionTarget = normalizeProjectionTarget(request.projection_target);
  const sourceBase = docPath || panelId || "visible-workstation";
  const sourceHash = hashText(sourceBase);
  return collectRawVisibleChunks(request)
    .slice(0, input.maxChunks)
    .map((chunk, index) => {
      const visibleText =
        clipText(chunk.visible_text ?? chunk.visibleText ?? chunk.text ?? chunk.source_text ?? chunk.sourceText, 2400);
      if (!visibleText) return null;
      const chunkId = readText(chunk.chunk_id ?? chunk.chunkId) || `visible-chunk-${index + 1}`;
      const sourceId = readText(chunk.source_id ?? chunk.sourceId) || `${sourceBase}#${chunkId}`;
      const sourceTextHash = hashText(visibleText);
      const sourceKind = normalizeSourceKind(chunk.source_kind ?? chunk.sourceKind, panelId);
      const regionId = readText(chunk.region_id ?? chunk.regionId) || null;
      const dedupeKey =
        readText(chunk.dedupe_key ?? chunk.dedupeKey) ||
        `${sourceId}:${sourceTextHash}:${targetLanguage}:${chunkId}`;
      return {
        schema: HELIX_VISIBLE_TRANSLATION_TARGET_SCHEMA,
        source_kind: sourceKind,
        panel_id: readText(chunk.panel_id ?? chunk.panelId) || panelId,
        doc_path: readText(chunk.doc_path ?? chunk.docPath) || docPath,
        source_id: sourceId,
        source_hash: readText(chunk.source_hash ?? chunk.sourceHash) || sourceHash,
        source_text_hash: sourceTextHash,
        visible_text: visibleText,
        chunk_id: chunkId,
        chunk_index: readNumber(chunk.chunk_index ?? chunk.chunkIndex) ?? index,
        region_id: regionId,
        bbox: readRecord(chunk.bbox ?? chunk.bbox_px ?? chunk.bboxPx),
        dedupe_key: dedupeKey,
        projection_target: projectionTarget,
        account_locale: accountLocale,
        target_language: targetLanguage,
        existing_translation_receipt_ref:
          readText(chunk.existing_translation_receipt_ref ?? chunk.existingTranslationReceiptRef) || null,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        reentry_required: true,
      };
    })
    .filter((target): target is HelixVisibleTranslationTarget => Boolean(target));
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
}): HelixAgentStepObservationPacket => ({
  schema: HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
  turn_id: input.turnId,
  iteration: input.iteration,
  call_id: `${input.turnId}:capability_lane:${input.capabilityId ?? CAPABILITY_ID}:call`,
  decision_id: `${input.turnId}:capability_lane:${input.capabilityId ?? CAPABILITY_ID}:decision`,
  capability_key: input.capabilityId ?? CAPABILITY_ID,
  panel_id: "capability_lane",
  action: input.capabilityId === COLLECT_VISIBLE_TRANSLATION_TARGETS_CAPABILITY_ID
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
    producer_capability: CAPABILITY_ID,
    consumer_capability: null,
    required_affordance_kinds: [],
    produced_affordance_kinds: ["system_status"],
    missing_affordance_kinds: [],
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  },
  terminal_eligible: false,
  post_tool_model_step_required: true,
  assistant_answer: false,
  raw_content_included: false,
});

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

  const targets = trace.admission_status === "admitted_shadow_only"
    ? buildVisibleTranslationTargets({ request: input.request, maxChunks })
    : [];
  const batchRef = `${turnId}:capability_lane:${COLLECT_VISIBLE_TRANSLATION_TARGETS_CAPABILITY_ID}:batch:${hashShort({
    targets: targets.map((target) => ({
      source_id: target.source_id,
      source_text_hash: target.source_text_hash,
      chunk_id: target.chunk_id,
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
    collector_capability: COLLECT_VISIBLE_TRANSLATION_TARGETS_CAPABILITY_ID,
    translation_capability_required: "live_translation.translate_text",
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
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};
