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
  HELIX_LIVE_TRANSLATION_ONE_SHOT_OBSERVATION_SCHEMA,
  HELIX_LIVE_TRANSLATION_PROJECTION_RECEIPT_SCHEMA,
  HELIX_LIVE_TRANSLATION_ONE_SHOT_RESULT_SCHEMA,
  type HelixLiveTranslationChunkFreshnessStatus,
  type HelixLiveTranslationOneShotObservation,
  type HelixLiveTranslationOneShotRequest,
  type HelixLiveTranslationProjectionReceipt,
  type HelixLiveTranslationProjectionTarget,
  type HelixLiveTranslationOneShotResult,
} from "@shared/helix-live-translation-lane";
import type { HelixAgentProvider } from "../agent-providers/types";
import { resolveHelixCapabilityLaneRequest } from "./registry";

const CAPABILITY_ID = "live_translation.translate_text" as const;

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const normalizeLanguage = (value: unknown): string =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const normalizeOptionalText = (value: unknown): string | null => {
  const text = normalizeText(value);
  return text || null;
};

const normalizeNonNegativeInteger = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.trunc(value));
};

const normalizeProjectionTarget = (value: unknown): HelixLiveTranslationProjectionTarget => {
  const normalized = normalizeText(value).toLowerCase();
  if (
    normalized === "ask_turn" ||
    normalized === "docs_hover" ||
    normalized === "docs_selection" ||
    normalized === "docs_chunk" ||
    normalized === "audio_chunk" ||
    normalized === "account_language"
  ) {
    return normalized;
  }
  return "ask_turn";
};

const freshnessStatusFor = (input: {
  sourceEventMs: number | null;
  observedAtMs: number;
}): HelixLiveTranslationChunkFreshnessStatus => {
  if (input.sourceEventMs === null) return "unknown";
  return input.observedAtMs - input.sourceEventMs > 30_000 ? "stale" : "fresh";
};

const deterministicPhraseTranslations: Record<string, Record<string, string>> = {
  es: {
    hello: "hola",
    "hello.": "hola.",
    "hello?": "hola?",
    "good morning": "buenos dias",
    "thank you": "gracias",
    "the result is 72.": "el resultado es 72.",
  },
  fr: {
    hello: "bonjour",
    "hello.": "bonjour.",
    "hello?": "bonjour?",
    "good morning": "bonjour",
    "thank you": "merci",
    "the result is 72.": "le resultat est 72.",
  },
};

const deterministicTranslate = (input: {
  text: string;
  targetLanguage: string;
}): string => {
  const target = input.targetLanguage.toLowerCase();
  const table = deterministicPhraseTranslations[target] ?? {};
  const exact = table[input.text.toLowerCase()];
  if (exact) return exact;
  return `[${target || "target"} deterministic translation] ${input.text}`;
};

const buildLaneObservationPacket = (input: {
  turnId: string;
  iteration: number;
  status: HelixAgentStepObservationPacket["status"];
  summary: string;
  observationRef: string;
  backendSelectionDecision: HelixCapabilityLaneBackendSelectionDecision;
  chunk?: {
    laneSessionId: string | null;
    sourceId: string;
    sourceHash: string | null;
    chunkId: string;
    chunkIndex: number | null;
    dedupeKey: string;
    sourceEventId: string | null;
    sourceEventMs: number | null;
    observedAtMs: number;
    freshnessStatus: HelixLiveTranslationChunkFreshnessStatus;
    projectionTarget: HelixLiveTranslationProjectionTarget;
    cancelRequested: boolean;
  };
  projectionReceipt?: HelixLiveTranslationProjectionReceipt;
  missingRequirements?: HelixAgentStepObservationPacket["missing_requirements"];
}): HelixAgentStepObservationPacket => {
  const receiptRef = input.projectionReceipt?.receipt_ref;
  return {
  schema: HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
  turn_id: input.turnId,
  iteration: input.iteration,
  call_id: `${input.turnId}:capability_lane:${CAPABILITY_ID}:call`,
  decision_id: `${input.turnId}:capability_lane:${CAPABILITY_ID}:decision`,
  capability_key: CAPABILITY_ID,
  panel_id: "capability_lane",
  action: "translate_text",
  status: input.status,
  produced_artifact_refs: [input.observationRef],
  observation_summary: input.summary,
  receipts: receiptRef
    ? [{
        receipt_ref: receiptRef,
        kind: "live_translation_projection",
        status: input.projectionReceipt?.projection_status ?? input.status,
      }]
    : [],
  missing_requirements: input.missingRequirements ?? [],
  backend_selection_decision: input.backendSelectionDecision,
  state_delta: input.chunk
    ? {
        live_translation_chunk: {
          lane_session_id: input.chunk.laneSessionId,
          source_id: input.chunk.sourceId,
          source_hash: input.chunk.sourceHash,
          chunk_id: input.chunk.chunkId,
          chunk_index: input.chunk.chunkIndex,
          dedupe_key: input.chunk.dedupeKey,
          source_event_id: input.chunk.sourceEventId,
          source_event_ms: input.chunk.sourceEventMs,
          observed_at_ms: input.chunk.observedAtMs,
          freshness_status: input.chunk.freshnessStatus,
          projection_target: input.chunk.projectionTarget,
          cancel_requested: input.chunk.cancelRequested,
          observation_ref: input.observationRef,
          terminal_authority_status: input.status === "succeeded"
            ? "pending_helix_terminal_authority"
            : "not_terminal_authority",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
        ...(input.projectionReceipt
          ? { live_translation_projection_receipt: input.projectionReceipt }
          : {}),
      }
    : {},
  suggested_next_steps:
    input.status === "succeeded"
      ? ["answer", "use_another_tool"]
      : input.status === "missing_input"
        ? ["ask_user", "repair"]
        : ["repair", "fail_closed"],
  produced_affordances: [],
  consumed_affordances: [],
  typed_handoff_contract: {
    schema: "helix.workstation_typed_handoff_contract.v1",
    producer_capability: CAPABILITY_ID,
    consumer_capability: null,
    required_affordance_kinds: [],
    produced_affordance_kinds: ["voice_text_evidence"],
    missing_affordance_kinds: [],
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  },
  terminal_eligible: false,
  post_tool_model_step_required: true,
  assistant_answer: false,
  raw_content_included: false,
  };
};

const buildProjectionReceipt = (input: {
  observationRef: string;
  chunk: {
    laneSessionId: string | null;
    sourceId: string;
    sourceHash: string | null;
    chunkId: string;
    chunkIndex: number | null;
    dedupeKey: string;
    sourceEventId: string | null;
    sourceEventMs: number | null;
    observedAtMs: number;
    freshnessStatus: HelixLiveTranslationChunkFreshnessStatus;
    projectionTarget: HelixLiveTranslationProjectionTarget;
    cancelRequested: boolean;
  };
  targetLanguage: string;
  sourceTextHash: string | null;
  sourceTextCharCount: number | null;
  translatedText: string | null;
  selectedBackendProvider: string | null;
}): HelixLiveTranslationProjectionReceipt => ({
  schema: HELIX_LIVE_TRANSLATION_PROJECTION_RECEIPT_SCHEMA,
  receipt_ref: `${input.observationRef}:projection:${hashShort({
    projectionTarget: input.chunk.projectionTarget,
    dedupeKey: input.chunk.dedupeKey,
    targetLanguage: input.targetLanguage,
  })}`,
  observation_ref: input.observationRef,
  lane_id: "live_translation",
  capability: CAPABILITY_ID,
  lane_session_id: input.chunk.laneSessionId,
  selected_backend_provider: input.selectedBackendProvider,
  projection_target: input.chunk.projectionTarget,
  projection_status: input.chunk.cancelRequested
    ? "cancelled"
    : input.translatedText === null
      ? "failed"
      : input.chunk.freshnessStatus === "stale"
        ? "stale"
        : "projected",
  source_id: input.chunk.sourceId,
  source_hash: input.chunk.sourceHash,
  chunk_id: input.chunk.chunkId,
  chunk_index: input.chunk.chunkIndex,
  dedupe_key: input.chunk.dedupeKey,
  source_event_id: input.chunk.sourceEventId,
  source_event_ms: input.chunk.sourceEventMs,
  observed_at_ms: input.chunk.observedAtMs,
  freshness_status: input.chunk.freshnessStatus,
  target_language: input.targetLanguage,
  source_text_hash: input.sourceTextHash,
  source_text_char_count: input.sourceTextCharCount,
  translated_text: input.translatedText,
  stale: input.chunk.freshnessStatus === "stale",
  cancel_requested: input.chunk.cancelRequested,
  reentry_required: true,
  terminal_authority_status: input.translatedText === null || input.chunk.cancelRequested
    ? "not_terminal_authority"
    : "pending_helix_terminal_authority",
  terminal_eligible: false,
  assistant_answer: false,
  raw_content_included: false,
});

const withExecutionTrace = (input: {
  trace: HelixCapabilityLaneResolveTrace;
  observationRef: string | null;
  receiptRef?: string | null;
  status: "executed_observation_only" | "not_executed_shadow_only";
  blockedReason?: string | null;
}): HelixCapabilityLaneResolveTrace => ({
  ...input.trace,
  execution_status: input.status,
  result_ref: input.observationRef,
  observation_ref: input.observationRef,
  receipt_ref: input.receiptRef ?? null,
  blocked_reason: input.blockedReason ?? input.trace.blocked_reason,
});

export const runLiveTranslationTranslateText = (input: {
  provider: HelixAgentProvider;
  request: HelixLiveTranslationOneShotRequest;
  turnId?: string | null;
  iteration?: number | null;
  env?: NodeJS.ProcessEnv;
}): HelixLiveTranslationOneShotResult => {
  const turnId = normalizeText(input.turnId) || normalizeText(input.request.turn_id) || "ask:lane:live_translation";
  const iteration = typeof input.iteration === "number" && Number.isFinite(input.iteration)
    ? Math.max(0, Math.trunc(input.iteration))
    : 0;
  const text = normalizeText(input.request.text);
  const targetLanguage = normalizeLanguage(input.request.target_language);
  const sourceLanguage = normalizeLanguage(input.request.source_language) || null;
  const laneSessionId = normalizeOptionalText(input.request.lane_session_id);
  const sourceId = normalizeOptionalText(input.request.source_id) ?? "ask_turn";
  const sourceHash = normalizeOptionalText(input.request.source_hash);
  const chunkId = normalizeOptionalText(input.request.chunk_id) ?? hashShort({
    sourceId,
    text,
    targetLanguage,
    sourceLanguage,
  });
  const chunkIndex = normalizeNonNegativeInteger(input.request.chunk_index);
  const dedupeKey = normalizeOptionalText(input.request.dedupe_key) ?? hashShort({
    sourceId,
    chunkId,
    targetLanguage,
    text,
  });
  const sourceEventId = normalizeOptionalText(input.request.source_event_id);
  const sourceEventMs = normalizeNonNegativeInteger(input.request.source_event_ms);
  const observedAtMs = Date.now();
  const projectionTarget = normalizeProjectionTarget(input.request.projection_target);
  const cancelRequested = input.request.cancel_requested === true;
  const freshnessStatus = freshnessStatusFor({ sourceEventMs, observedAtMs });
  const chunk = {
    laneSessionId,
    sourceId,
    sourceHash,
    chunkId,
    chunkIndex,
    dedupeKey,
    sourceEventId,
    sourceEventMs,
    observedAtMs,
    freshnessStatus,
    projectionTarget,
    cancelRequested,
  };
  const trace = resolveHelixCapabilityLaneRequest({
    provider: input.provider,
    requestedLane: "live_translation",
    requestedBackendProvider: input.request.requested_backend_provider,
    env: input.env,
  });

  const missingRequirements: HelixAgentStepObservationPacket["missing_requirements"] = [];
  if (!text) {
    missingRequirements.push({
      code: "missing_text",
      message: "live_translation.translate_text requires non-empty text.",
      repair_action: "provide_text",
    });
  }
  if (!targetLanguage) {
    missingRequirements.push({
      code: "missing_target_language",
      message: "live_translation.translate_text requires a target language.",
      repair_action: "provide_target_language",
    });
  }

  if (cancelRequested) {
    const observationRef = `${turnId}:capability_lane:${CAPABILITY_ID}:${hashShort({
      status: "cancelled",
      sourceId,
      chunkId,
      targetLanguage,
    })}`;
    const projectionReceipt = buildProjectionReceipt({
      observationRef,
      chunk,
      targetLanguage,
      sourceTextHash: hashShort(text),
      sourceTextCharCount: text.length,
      translatedText: null,
      selectedBackendProvider: trace.selected_backend_provider,
    });
    const packet = buildLaneObservationPacket({
      turnId,
      iteration,
      status: "blocked",
      summary: "Translation chunk cancelled before backend execution.",
      observationRef,
      backendSelectionDecision: trace.backend_selection_decision,
      chunk,
      projectionReceipt,
    });
    return {
      schema: HELIX_LIVE_TRANSLATION_ONE_SHOT_RESULT_SCHEMA,
      ok: false,
      lane_id: "live_translation",
      capability: CAPABILITY_ID,
      selected_runtime_agent_provider: input.provider.id,
      lane_resolve_trace: withExecutionTrace({
        trace,
        observationRef,
        receiptRef: projectionReceipt.receipt_ref,
        status: "not_executed_shadow_only",
        blockedReason: "translation_chunk_cancelled",
      }),
      observation: null,
      observation_packet: packet,
      artifact_refs: packet.produced_artifact_refs,
      error: "translation_chunk_cancelled",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (trace.admission_status !== "admitted_shadow_only" || missingRequirements.length > 0) {
    const observationRef = `${turnId}:capability_lane:${CAPABILITY_ID}:${hashShort({
      status: trace.admission_status,
      missingRequirements,
      targetLanguage,
    })}`;
    const packet = buildLaneObservationPacket({
      turnId,
      iteration,
      status: missingRequirements.length > 0 ? "missing_input" : "blocked",
      summary: missingRequirements.length > 0
        ? "Translation lane missing required input."
        : `Translation lane blocked: ${trace.blocked_reason ?? "not_admitted"}.`,
      observationRef,
      backendSelectionDecision: trace.backend_selection_decision,
      chunk,
      missingRequirements,
    });
    return {
      schema: HELIX_LIVE_TRANSLATION_ONE_SHOT_RESULT_SCHEMA,
      ok: false,
      lane_id: "live_translation",
      capability: CAPABILITY_ID,
      selected_runtime_agent_provider: input.provider.id,
      lane_resolve_trace: withExecutionTrace({
        trace,
        observationRef,
        status: "not_executed_shadow_only",
        blockedReason: missingRequirements[0]?.code ?? trace.blocked_reason,
      }),
      observation: null,
      observation_packet: packet,
      artifact_refs: packet.produced_artifact_refs,
      error: missingRequirements[0]?.code ?? trace.blocked_reason ?? "translation_lane_blocked",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  const translatedText = deterministicTranslate({ text, targetLanguage });
  const observationRef = `${turnId}:capability_lane:${CAPABILITY_ID}:${hashShort({
    text,
    targetLanguage,
    sourceLanguage,
    sourceId,
    sourceHash,
    chunkId,
    chunkIndex,
    dedupeKey,
    sourceEventId,
    translatedText,
  })}`;
  const observation: HelixLiveTranslationOneShotObservation = {
    schema: HELIX_LIVE_TRANSLATION_ONE_SHOT_OBSERVATION_SCHEMA,
    observation_id: observationRef,
    observation_ref: observationRef,
    lane_id: "live_translation",
    capability: CAPABILITY_ID,
    selected_runtime_agent_provider: input.provider.id,
    requested_backend_provider: trace.requested_backend_provider,
    selected_backend_provider: trace.selected_backend_provider,
    selection_reason: trace.selection_reason,
    backend_selection_decision: trace.backend_selection_decision,
    lane_session_id: laneSessionId,
    source_language: sourceLanguage,
    target_language: targetLanguage,
    source_id: sourceId,
    source_hash: sourceHash,
    chunk_id: chunkId,
    chunk_index: chunkIndex,
    dedupe_key: dedupeKey,
    source_event_id: sourceEventId,
    source_event_ms: sourceEventMs,
    observed_at_ms: observedAtMs,
    freshness_status: freshnessStatus,
    projection_target: projectionTarget,
    cancel_requested: false,
    source_text_hash: hashShort(text),
    source_text_char_count: text.length,
    translated_text: translatedText,
    deterministic: true,
    confidence: 0.62,
    reentry_required: true,
    terminal_authority_status: "pending_helix_terminal_authority",
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
  const packet = buildLaneObservationPacket({
    turnId,
    iteration,
    status: "succeeded",
    summary: `Translation observation ready for ${sourceLanguage ?? "auto"} -> ${targetLanguage}.`,
    observationRef,
    backendSelectionDecision: trace.backend_selection_decision,
    chunk,
    projectionReceipt: buildProjectionReceipt({
      observationRef,
      chunk,
      targetLanguage,
      sourceTextHash: hashShort(text),
      sourceTextCharCount: text.length,
      translatedText,
      selectedBackendProvider: trace.selected_backend_provider,
    }),
  });
  const projectionReceiptRef = packet.state_delta.live_translation_projection_receipt?.receipt_ref ?? null;

  return {
    schema: HELIX_LIVE_TRANSLATION_ONE_SHOT_RESULT_SCHEMA,
    ok: true,
    lane_id: "live_translation",
    capability: CAPABILITY_ID,
    selected_runtime_agent_provider: input.provider.id,
    lane_resolve_trace: withExecutionTrace({
      trace,
      observationRef,
      receiptRef: projectionReceiptRef,
      status: "executed_observation_only",
    }),
    observation,
    observation_packet: packet,
    artifact_refs: packet.produced_artifact_refs,
    translated_text: translatedText,
    reentry_required: true,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};
