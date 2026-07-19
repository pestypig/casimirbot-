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
import {
  HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_ASK_TURN,
  normalizeHelixLiveTranslationProjectionTarget,
} from "@shared/helix-live-translation-projection-target";
import type { HelixAgentProvider } from "../agent-providers/types";
import { resolveHelixCapabilityLaneRequest } from "./registry";

const CAPABILITY_ID = "live_translation.translate_text" as const;
const DEFAULT_OPENAI_BASE = "https://api.openai.com";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_EXTERNAL_TRANSLATION_TIMEOUT_MS = 20_000;

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
  return normalizeHelixLiveTranslationProjectionTarget(
    normalizeText(value).toLowerCase(),
    HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_ASK_TURN,
  );
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

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === "AbortError";

const parseProviderTranslation = (content: string): string => {
  const trimmed = content.trim();
  if (!trimmed) return "";
  try {
    const parsed = JSON.parse(trimmed) as { translated_text?: unknown; translation?: unknown };
    const translatedText = typeof parsed.translated_text === "string"
      ? parsed.translated_text
      : typeof parsed.translation === "string"
        ? parsed.translation
        : "";
    return translatedText.trim();
  } catch {
    return trimmed.replace(/^["']|["']$/g, "").trim();
  }
};

const externalTranslationTimeoutMs = (env: NodeJS.ProcessEnv): number => {
  const parsed = Number(env.HELIX_LIVE_TRANSLATION_EXTERNAL_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0
    ? Math.floor(parsed)
    : DEFAULT_EXTERNAL_TRANSLATION_TIMEOUT_MS;
};

const runOpenAiCompatibleTranslation = async (input: {
  text: string;
  sourceLanguage: string | null;
  targetLanguage: string;
  env: NodeJS.ProcessEnv;
}): Promise<string> => {
  const providerBase = (
    input.env.LIVE_TRANSLATION_OPENAI_BASE ||
    input.env.DOC_TRANSLATION_BASE ||
    input.env.LLM_HTTP_BASE ||
    DEFAULT_OPENAI_BASE
  ).trim();
  const apiKey = (
    input.env.LIVE_TRANSLATION_OPENAI_API_KEY ||
    input.env.DOC_TRANSLATION_API_KEY ||
    input.env.OPENAI_API_KEY ||
    input.env.LLM_HTTP_API_KEY ||
    ""
  ).trim();
  const model = (
    input.env.LIVE_TRANSLATION_OPENAI_MODEL ||
    input.env.DOC_TRANSLATION_MODEL ||
    input.env.LLM_HTTP_MODEL ||
    DEFAULT_OPENAI_MODEL
  ).trim();
  const endpoint = `${providerBase.replace(/\/+$/, "")}/v1/chat/completions`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), externalTranslationTimeoutMs(input.env));
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Translate the provided text. Return only compact JSON with a translated_text string. Preserve named entities, code, numbers, URLs, and file paths exactly.",
          },
          {
            role: "user",
            content: JSON.stringify({
              schema: "helix.live_translation.openai_compatible_request.v1",
              source_language: input.sourceLanguage,
              target_language: input.targetLanguage,
              text: input.text,
            }),
          },
        ],
      }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`translation_provider_http_${response.status}${text ? `: ${text.slice(0, 240)}` : ""}`);
    }
    const body = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = body.choices?.[0]?.message?.content;
    const translated = typeof content === "string" ? parseProviderTranslation(content) : "";
    if (!translated) throw new Error("translation_provider_empty_content");
    return translated;
  } catch (error) {
    if (isAbortError(error)) throw new Error("translation_provider_timeout");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const translateWithSelectedBackend = async (input: {
  text: string;
  targetLanguage: string;
  sourceLanguage: string | null;
  selectedBackendProvider: string | null;
  env: NodeJS.ProcessEnv;
}): Promise<{ translatedText: string; deterministic: boolean }> => {
  if (input.selectedBackendProvider === "live_translation.openai_compatible") {
    return {
      translatedText: await runOpenAiCompatibleTranslation({
        text: input.text,
        sourceLanguage: input.sourceLanguage,
        targetLanguage: input.targetLanguage,
        env: input.env,
      }),
      deterministic: false,
    };
  }
  return {
    translatedText: deterministicTranslate({
      text: input.text,
      targetLanguage: input.targetLanguage,
    }),
    deterministic: true,
  };
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
    sessionControlKey: string | null;
    sourceBindingKey: string | null;
    sourceIdentityKey: string | null;
    latestSourceIdentityKey: string | null;
    latestObservationKey: string | null;
    latestMailLoopObservationKey: string | null;
    goalBindingId: string | null;
    goalBindingKey: string | null;
    sourceId: string;
    panelId: string | null;
    regionId: string | null;
    bbox: Record<string, unknown> | null;
    docPath: string | null;
    documentSourceKind: "canonical_docs" | "research_library" | null;
    documentRef: string | null;
    privateSource: boolean;
    sourceHash: string | null;
    sourceKind: string | null;
    accountLocale: string | null;
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
          session_control_key: input.chunk.sessionControlKey,
          source_binding_key: input.chunk.sourceBindingKey,
          source_identity_key: input.chunk.sourceIdentityKey,
          latest_source_identity_key: input.chunk.latestSourceIdentityKey,
          latest_observation_key: input.chunk.latestObservationKey,
          latest_mail_loop_observation_key: input.chunk.latestMailLoopObservationKey,
          goal_binding_id: input.chunk.goalBindingId,
          goal_binding_key: input.chunk.goalBindingKey,
          source_id: input.chunk.sourceId,
          panel_id: input.chunk.panelId,
          region_id: input.chunk.regionId,
          bbox: input.chunk.bbox,
          doc_path: input.chunk.docPath,
          document_source_kind: input.chunk.documentSourceKind,
          document_ref: input.chunk.documentRef,
          private_source: input.chunk.privateSource,
          source_hash: input.chunk.sourceHash,
          source_kind: input.chunk.sourceKind,
          account_locale: input.chunk.accountLocale,
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
    sessionControlKey: string | null;
    sourceBindingKey: string | null;
    sourceIdentityKey: string | null;
    latestSourceIdentityKey: string | null;
    latestObservationKey: string | null;
    latestMailLoopObservationKey: string | null;
    goalBindingId: string | null;
    goalBindingKey: string | null;
    sourceId: string;
    panelId: string | null;
    regionId: string | null;
    bbox: Record<string, unknown> | null;
    docPath: string | null;
    documentSourceKind: "canonical_docs" | "research_library" | null;
    documentRef: string | null;
    privateSource: boolean;
    sourceHash: string | null;
    sourceKind: string | null;
    accountLocale: string | null;
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
}): HelixLiveTranslationProjectionReceipt => {
  const receiptRef = `${input.observationRef}:projection:${hashShort({
    projectionTarget: input.chunk.projectionTarget,
    dedupeKey: input.chunk.dedupeKey,
    targetLanguage: input.targetLanguage,
  })}`;
  return {
    schema: HELIX_LIVE_TRANSLATION_PROJECTION_RECEIPT_SCHEMA,
    receipt_ref: receiptRef,
    observation_ref: input.observationRef,
    projection_key: [
      input.chunk.sourceId,
      input.sourceTextHash,
      input.chunk.projectionTarget,
      input.chunk.accountLocale,
      input.targetLanguage,
      input.chunk.chunkId,
      receiptRef,
    ].join("::"),
    lane_id: "live_translation",
    capability: CAPABILITY_ID,
    lane_session_id: input.chunk.laneSessionId,
    session_control_key: input.chunk.sessionControlKey,
    source_binding_key: input.chunk.sourceBindingKey,
    source_identity_key: input.chunk.sourceIdentityKey,
    latest_source_identity_key: input.chunk.latestSourceIdentityKey,
    latest_observation_key: input.chunk.latestObservationKey,
    latest_mail_loop_observation_key: input.chunk.latestMailLoopObservationKey,
    goal_binding_id: input.chunk.goalBindingId,
    goal_binding_key: input.chunk.goalBindingKey,
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
    panel_id: input.chunk.panelId,
    region_id: input.chunk.regionId,
    bbox: input.chunk.bbox,
    doc_path: input.chunk.docPath,
    document_source_kind: input.chunk.documentSourceKind,
    document_ref: input.chunk.documentRef,
    private_source: input.chunk.privateSource,
    source_hash: input.chunk.sourceHash,
    source_kind: input.chunk.sourceKind,
    account_locale: input.chunk.accountLocale,
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
    answer_authority: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

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

export const runLiveTranslationTranslateText = async (input: {
  provider: HelixAgentProvider;
  request: HelixLiveTranslationOneShotRequest;
  turnId?: string | null;
  iteration?: number | null;
  env?: NodeJS.ProcessEnv;
  nowMs?: number | null;
}): Promise<HelixLiveTranslationOneShotResult> => {
  const env = input.env ?? process.env;
  const turnId = normalizeText(input.turnId) || normalizeText(input.request.turn_id) || "ask:lane:live_translation";
  const iteration = typeof input.iteration === "number" && Number.isFinite(input.iteration)
    ? Math.max(0, Math.trunc(input.iteration))
    : 0;
  const text = normalizeText(input.request.text);
  const targetLanguage = normalizeLanguage(input.request.target_language);
  const sourceLanguage = normalizeLanguage(input.request.source_language) || null;
  const laneSessionId = normalizeOptionalText(input.request.lane_session_id);
  const sessionControlKey = normalizeOptionalText(input.request.session_control_key);
  const sourceBindingKey = normalizeOptionalText(input.request.source_binding_key);
  const sourceIdentityKey = normalizeOptionalText(input.request.source_identity_key);
  const latestSourceIdentityKey = normalizeOptionalText(input.request.latest_source_identity_key);
  const latestObservationKey = normalizeOptionalText(input.request.latest_observation_key);
  const latestMailLoopObservationKey = normalizeOptionalText(input.request.latest_mail_loop_observation_key);
  const goalBindingId = normalizeOptionalText(input.request.goal_binding_id);
  const goalBindingKey = normalizeOptionalText(input.request.goal_binding_key);
  const sourceId = normalizeOptionalText(input.request.source_id) ?? "ask_turn";
  const panelId = normalizeOptionalText(input.request.panel_id);
  const regionId = normalizeOptionalText(input.request.region_id);
  const bbox =
    input.request.bbox && typeof input.request.bbox === "object" && !Array.isArray(input.request.bbox)
      ? input.request.bbox
      : null;
  const docPath = normalizeOptionalText(input.request.doc_path);
  const requestedDocumentSourceKind = normalizeOptionalText(input.request.document_source_kind);
  const documentSourceKind = requestedDocumentSourceKind === "canonical_docs" || requestedDocumentSourceKind === "research_library"
    ? requestedDocumentSourceKind
    : null;
  const documentRef = normalizeOptionalText(input.request.document_ref);
  const privateSource = input.request.private_source === true;
  const sourceHash = normalizeOptionalText(input.request.source_hash);
  const sourceKind = normalizeOptionalText(input.request.source_kind);
  const sourceTextHash = normalizeOptionalText(input.request.source_text_hash) ?? hashShort(text);
  const sourceTextCharCount = normalizeNonNegativeInteger(input.request.source_text_char_count) ?? text.length;
  const accountLocale = normalizeOptionalText(input.request.account_locale);
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
  const observedAtMs = normalizeNonNegativeInteger(input.nowMs) ?? Date.now();
  const projectionTarget = normalizeProjectionTarget(input.request.projection_target);
  const cancelRequested = input.request.cancel_requested === true;
  const freshnessStatus = freshnessStatusFor({ sourceEventMs, observedAtMs });
  const chunk = {
    laneSessionId,
    sessionControlKey,
    sourceBindingKey,
    sourceIdentityKey,
    latestSourceIdentityKey,
    latestObservationKey,
    latestMailLoopObservationKey,
    goalBindingId,
    goalBindingKey,
    sourceId,
    panelId,
    regionId,
    bbox,
    docPath,
    documentSourceKind,
    documentRef,
    privateSource,
    sourceHash,
    sourceKind,
    accountLocale,
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
    env,
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
      sourceTextHash,
      sourceTextCharCount,
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

  let translatedText = "";
  let deterministic = true;
  try {
    const translation = await translateWithSelectedBackend({
      text,
      targetLanguage,
      sourceLanguage,
      selectedBackendProvider: trace.selected_backend_provider,
      env,
    });
    translatedText = translation.translatedText;
    deterministic = translation.deterministic;
  } catch (error) {
    const failReason = error instanceof Error ? error.message : "translation_provider_failed";
    const observationRef = `${turnId}:capability_lane:${CAPABILITY_ID}:${hashShort({
      status: "provider_failed",
      failReason,
      targetLanguage,
      sourceId,
      chunkId,
    })}`;
    const projectionReceipt = buildProjectionReceipt({
      observationRef,
      chunk,
      targetLanguage,
      sourceTextHash,
      sourceTextCharCount,
      translatedText: null,
      selectedBackendProvider: trace.selected_backend_provider,
    });
    const packet = buildLaneObservationPacket({
      turnId,
      iteration,
      status: "failed",
      summary: `Translation provider failed: ${failReason}.`,
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
        blockedReason: failReason,
      }),
      observation: null,
      observation_packet: packet,
      artifact_refs: packet.produced_artifact_refs,
      error: failReason,
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  const observationRef = `${turnId}:capability_lane:${CAPABILITY_ID}:${hashShort({
    text,
    targetLanguage,
    sourceLanguage,
    sourceId,
    panelId,
    regionId,
    bbox,
    sourceHash,
    sourceKind,
    accountLocale,
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
    session_control_key: sessionControlKey,
    source_binding_key: sourceBindingKey,
    source_identity_key: sourceIdentityKey,
    latest_source_identity_key: latestSourceIdentityKey,
    latest_observation_key: latestObservationKey,
    latest_mail_loop_observation_key: latestMailLoopObservationKey,
    goal_binding_id: goalBindingId,
    goal_binding_key: goalBindingKey,
    source_language: sourceLanguage,
    target_language: targetLanguage,
    source_id: sourceId,
    panel_id: panelId,
    region_id: regionId,
    bbox,
    doc_path: docPath,
    document_source_kind: documentSourceKind,
    document_ref: documentRef,
    private_source: privateSource,
    source_hash: sourceHash,
    source_kind: sourceKind,
    account_locale: accountLocale,
    chunk_id: chunkId,
    chunk_index: chunkIndex,
    dedupe_key: dedupeKey,
    source_event_id: sourceEventId,
    source_event_ms: sourceEventMs,
    observed_at_ms: observedAtMs,
    freshness_status: freshnessStatus,
    projection_target: projectionTarget,
    cancel_requested: false,
    source_text_hash: sourceTextHash,
    source_text_char_count: sourceTextCharCount,
    translated_text: translatedText,
    deterministic,
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
      sourceTextHash,
      sourceTextCharCount,
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
