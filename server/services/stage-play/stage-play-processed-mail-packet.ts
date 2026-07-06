import crypto from "node:crypto";
import { performance } from "node:perf_hooks";
import {
  STAGE_PLAY_DOCUMENT_INLINE_TRANSLATION_OUTPUT_SCHEMA,
  STAGE_PLAY_MICRO_REASONER_RUN_SCHEMA,
  STAGE_PLAY_PROCESSED_MAIL_PACKET_SCHEMA,
  type StagePlayDocumentInlineTranslationOutputV1,
  type LiveSourceCausalTraceV1,
  type StagePlayAxiomFrameV1,
  type StagePlayEffortEstimateV1,
  type StagePlayEvidenceLeadV1,
  type StagePlayGoalBasedActionPredictionV1,
  type StagePlayHypothesisArbiterV1,
  type StagePlayLiveSourceImmersionStateV1,
  type StagePlayLiveSourceMailItemV1,
  type StagePlayLiveSourcePredictionValidationRecommendedNextV1,
  type StagePlayLiveSourcePredictionValidationV1,
  type StagePlayMicroReasonerDeckTraceV1,
  type StagePlayMicroReasonerRoleV1,
  type StagePlayMicroReasonerPromptPresetV1,
  type StagePlayMicroReasonerRunV1,
  type StagePlayProcessedMailEvidenceHandlesV1,
  type StagePlayProcessedMailPacketV1,
  type StagePlaySceneBeatHypothesisV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import { HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_CHUNK } from "@shared/helix-live-translation-projection-target";
import type {
  StagePlayLiveSourceInterpreterProfileComparisonV1,
  StagePlayLiveSourceInterpreterProfileV1,
} from "@shared/contracts/stage-play-live-source-interpreter-profile.v1";
import { compareMailToInterpreterProfile } from "./stage-play-live-source-interpreter-profile-comparison";
import { extractStagePlayLiveSourceDelta } from "./stage-play-live-source-delta-extractor";
import {
  getActiveStagePlayMicroReasonerPromptForRole,
  getActiveStagePlayMicroReasonerPromptPresetForSource,
  getStagePlayPromptedMicroReasonerRolesForSource,
  getStagePlayMicroReasonerRun,
  getStagePlayProcessedMailPacket,
  recordStagePlayMicroReasonerRun,
  recordStagePlayProcessedMailPacket,
} from "./stage-play-processed-mail-packet-store";
import { llmHttpHandler } from "../../skills/llm.http";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export type StagePlayProcessedMailPacketTimingEntry = {
  stage: string;
  durationMs: number;
};

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const deckRunPlanFor = (input: {
  preset: StagePlayMicroReasonerPromptPresetV1 | null;
  prompted: boolean;
  roles?: StagePlayMicroReasonerRoleV1[];
}): StagePlayMicroReasonerDeckTraceV1["deckRunPlan"] => {
  if (input.preset?.deckRunPlan) return input.preset.deckRunPlan;
  const roles = input.roles ?? input.preset?.promptedRoles ?? [];
  if (
    input.prompted &&
    roles.length === 1 &&
    roles[0] === "hypothesis_arbiter"
  ) {
    return "minimal_prompted_arbiter";
  }
  if (input.preset?.domain === "custom") return "custom";
  return input.prompted ? "baseline_plus_prompted" : "full_baseline";
};

const deckTraceFor = (input: {
  preset: StagePlayMicroReasonerPromptPresetV1 | null;
  sourceId: string;
  deckRunPlan: StagePlayMicroReasonerDeckTraceV1["deckRunPlan"];
}): StagePlayMicroReasonerDeckTraceV1 | undefined => {
  if (!input.preset) return undefined;
  return {
    presetId: input.preset.presetId,
    presetTitle: input.preset.title,
    domain: input.preset.domain,
    outputPolicy: input.preset.outputPolicy,
    promptedRoles: input.preset.promptedRoles,
    baselineRoles: input.preset.baselineRoles,
    rolePromptIds: input.preset.rolePromptIds,
    sourceId: input.sourceId,
    appliedAt: input.preset.updatedAt,
    deckRunPlan: input.deckRunPlan,
    wakeCoalescingPolicy: input.preset.wakeCoalescingPolicy,
    presetUpdatedAt: input.preset.updatedAt ?? null,
  };
};

const applyDeckTraceToRun = (
  run: StagePlayMicroReasonerRunV1,
  deck: StagePlayMicroReasonerDeckTraceV1 | undefined,
  roleOrder?: StagePlayMicroReasonerRoleV1[],
): StagePlayMicroReasonerRunV1 => {
  if (!deck) return run;
  const promptedRoleIndex = roleOrder?.indexOf(run.role) ?? deck.promptedRoles.indexOf(run.role);
  const roleIsPrompted = promptedRoleIndex >= 0;
  return recordStagePlayMicroReasonerRun({
    ...run,
    deckPresetId: deck.presetId,
    deckPresetTitle: deck.presetTitle,
    deckRunPlan: deck.deckRunPlan,
    deckRoleIndex: roleIsPrompted ? promptedRoleIndex : null,
    deckRoleCount: roleOrder?.length ?? deck.promptedRoles.length,
    deckExecutionMode: roleIsPrompted
      ? deckExecutionModeForRole(deck, run.role)
      : "baseline_fallback",
    deckProductRole: isDeckProductRole(deck, run.role),
  });
};

const isDeckProductRole = (
  deck: StagePlayMicroReasonerDeckTraceV1 | undefined,
  role: StagePlayMicroReasonerRoleV1,
): boolean => {
  if (!deck) return false;
  if ((deck.outputPolicy === "earbud_translation" || deck.outputPolicy === "inline_document_translation") && role === "packet_composer") {
    return true;
  }
  if (deck.outputPolicy === "ask_prompt_delegation" && role === "prompt_router") return true;
  if (deck.outputPolicy === "tool_call_candidate" && role === "decision_selector") return true;
  if (deck.outputPolicy === "voice_candidate" && role === "voice_callout_drafter") return true;
  return false;
};

const deckExecutionModeForRole = (
  deck: StagePlayMicroReasonerDeckTraceV1 | undefined,
  role: StagePlayMicroReasonerRoleV1,
): StagePlayMicroReasonerRunV1["deckExecutionMode"] => {
  if (!deck) return null;
  if (deck.outputPolicy === "inline_document_translation") {
    return role === "claim_extractor" ? "independent" : "uses_prior_outputs";
  }
  if (deck.outputPolicy === "earbud_translation") {
    return role === "packet_composer" ? "independent" : "uses_prior_outputs";
  }
  if (role === "decision_selector" || role === "hypothesis_arbiter" || role === "voice_callout_drafter") {
    return "uses_prior_outputs";
  }
  return "independent";
};

const markRunSkippedByDeckPlan = (input: {
  run: StagePlayMicroReasonerRunV1;
  deck: StagePlayMicroReasonerDeckTraceV1 | undefined;
  now: string;
}): StagePlayMicroReasonerRunV1 => {
  const deckTitle = input.deck?.presetTitle ?? "selected MicroDeck";
  return recordStagePlayMicroReasonerRun({
    ...input.run,
    deckPresetId: input.deck?.presetId ?? input.run.deckPresetId ?? null,
    deckPresetTitle: input.deck?.presetTitle ?? input.run.deckPresetTitle ?? null,
    deckRunPlan: input.deck?.deckRunPlan ?? input.run.deckRunPlan ?? null,
    deckRoleIndex: input.run.deckRoleIndex ?? null,
    deckRoleCount: input.run.deckRoleCount ?? input.deck?.promptedRoles.length ?? null,
    deckExecutionMode: input.run.deckExecutionMode ?? "baseline_fallback",
    deckProductRole: input.run.deckProductRole ?? false,
    outputRefs: uniqueStrings([
      ...input.run.outputRefs,
      "skipped_by_deck_run_plan",
      input.deck?.deckRunPlan,
    ]),
    outputPreview: `Skipped by ${deckTitle}; role is not active for this deck run plan.`,
    status: "skipped",
    reasoningMode: "micro_live_interval",
    selectedDecision: null,
    voiceCandidate: null,
    recommendedNextTool: null,
    confidence: null,
    latencyMs: 0,
    tokenEstimateOut: null,
    error: null,
    completedAt: input.now,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    context_role: "micro_reasoner_evidence",
  });
};

const clipText = (value: string | null | undefined, limit = 260): string => {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...` : normalized;
};

const DEFAULT_PROMPTED_MICRO_REASONER_ROLES: StagePlayMicroReasonerRoleV1[] = [
  "claim_extractor",
  "observation_classifier",
  "salience_scorer",
  "hypothesis_arbiter",
  "decision_selector",
];

type PromptedMicroReasonerOutput = {
  ok: boolean;
  text: string;
  json?: Record<string, unknown> | null;
  model?: string | null;
  latencyMs?: number | null;
  tokenEstimateIn?: number | null;
  tokenEstimateOut?: number | null;
  error?: string | null;
};

export type StagePlayPromptedMicroReasonerExecutor = (input: {
  role: StagePlayMicroReasonerRoleV1;
  promptId: string;
  promptTitle: string;
  promptTemplate: string;
  outputSchemaName: string;
  maxOutputTokens?: number | null;
  inputPreview: string;
  baselineOutputPreview: string;
  packet: StagePlayProcessedMailPacketV1;
  priorOutputs: Record<string, unknown>;
  mailItems: StagePlayLiveSourceMailItemV1[];
}) => Promise<PromptedMicroReasonerOutput>;

export type StagePlayPromptedMicroReasonerOptions = {
  enabled?: boolean;
  roles?: StagePlayMicroReasonerRoleV1[];
  executor?: StagePlayPromptedMicroReasonerExecutor;
};

const readPromptedRoleList = (): StagePlayMicroReasonerRoleV1[] => {
  const raw = process.env.STAGE_PLAY_MICRO_REASONER_LLM_ROLES?.trim();
  if (!raw) return DEFAULT_PROMPTED_MICRO_REASONER_ROLES;
  const allowed = new Set<StagePlayMicroReasonerRoleV1>([
    "claim_extractor",
    "observation_classifier",
    "effort_estimator",
    "axiom_extractor",
    "hypothesis_generator",
    "profile_comparator",
    "delta_extractor",
    "prediction_validator",
    "salience_scorer",
    "hypothesis_arbiter",
    "prompt_router",
    "packet_composer",
    "decision_selector",
    "voice_callout_drafter",
  ]);
  const parsed = raw.split(",")
    .map((entry) => entry.trim())
    .filter((entry): entry is StagePlayMicroReasonerRoleV1 => allowed.has(entry as StagePlayMicroReasonerRoleV1));
  return parsed.length > 0 ? parsed : DEFAULT_PROMPTED_MICRO_REASONER_ROLES;
};

const promptedMicroReasonersEnabled = (options?: StagePlayPromptedMicroReasonerOptions): boolean => {
  if (options?.enabled === false) return false;
  if (options?.enabled === true) return true;
  if (String(process.env.STAGE_PLAY_MICRO_REASONER_LLM_ENABLED ?? "1").trim() === "0") return false;
  return Boolean(process.env.OPENAI_API_KEY?.trim());
};

const promptedRolesForSource = (
  sourceId: string,
  options?: StagePlayPromptedMicroReasonerOptions,
): StagePlayMicroReasonerRoleV1[] => {
  if (options?.roles) return options.roles;
  if (process.env.STAGE_PLAY_MICRO_REASONER_LLM_ROLES?.trim()) return readPromptedRoleList();
  return getStagePlayPromptedMicroReasonerRolesForSource({ sourceId });
};

const parseJsonObjectFromText = (text: string): Record<string, unknown> | null => {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
};

const promptedMicroReasonerJsonFailureCode = (text: string): string => {
  const trimmed = text.trim();
  if (!trimmed) return "prompted_micro_reasoner_empty_response";
  if (trimmed.startsWith("[") || (trimmed.includes("[") && !trimmed.includes("{"))) {
    return "prompted_micro_reasoner_json_array_response";
  }
  if (!trimmed.includes("{") || !trimmed.includes("}")) return "prompted_micro_reasoner_non_json_response";
  return "prompted_micro_reasoner_malformed_json_object";
};

const readStringArrayFromJson = (record: Record<string, unknown> | null | undefined, key: string): string[] => {
  const value = record?.[key];
  if (!Array.isArray(value)) return [];
  return uniqueStrings(value.map((entry) => typeof entry === "string" ? entry : JSON.stringify(entry)));
};

const readStringFromJson = (record: Record<string, unknown> | null | undefined, key: string): string | null => {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

const readBooleanFromJson = (record: Record<string, unknown> | null | undefined, key: string): boolean | null => {
  const value = record?.[key];
  return typeof value === "boolean" ? value : null;
};

const readNumberFromJson = (record: Record<string, unknown> | null | undefined, key: string): number | null => {
  const value = record?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const readConfidence = (value: unknown): StagePlayMicroReasonerRunV1["confidence"] => {
  if (value === "low" || value === "medium" || value === "high") return value;
  return null;
};

type DocumentMarkdownVisibleUnit = {
  unit_id: string;
  kind: string;
  source_markdown: string;
  translatable: boolean;
  protected_spans: string[];
};

type DocumentMarkdownVisibleUnitsPayload = {
  docPath: string | null;
  sourceHash: string | null;
  sourceTextHash: string | null;
  sourceTextCharCount: number | null;
  receiptRef: string | null;
  chunkId: string | null;
  chunkIndex: number | null;
  laneSessionId: string | null;
  sessionControlKey: string | null;
  sourceBindingKey: string | null;
  sourceIdentityKey: string | null;
  latestSourceIdentityKey: string | null;
  mailLoopObservationKey: string | null;
  dedupeKey: string | null;
  sourceEventId: string | null;
  sourceEventMs: number | null;
  locale: string;
  targetLanguage: string;
  accountLocale: string;
  translationContractVersion: string | null;
  projectionTarget: string;
  freshnessStatus: string;
  units: DocumentMarkdownVisibleUnit[];
};

const readDocumentMarkdownVisibleUnitsPayload = (
  mailItems: StagePlayLiveSourceMailItemV1[],
): DocumentMarkdownVisibleUnitsPayload => {
  const sourceRefs = mailItems.find((item) =>
    item.sourceKind === "document_markdown" && item.sourceRefs.sourceIdentityKey
  )?.sourceRefs;
  const parsed = mailItems
    .map((item: StagePlayLiveSourceMailItemV1) => parseStructuredObserverOutput(item.summary.text))
    .find((record: Record<string, unknown> | null) => record?.schema === "stage_play.document_markdown_visible_units.v1");
  const rawUnits: unknown[] = Array.isArray(parsed?.units) ? parsed.units : [];
  const units = rawUnits
        .map((entry: unknown) => readRecord(entry))
        .filter((entry): entry is Record<string, unknown> => Boolean(entry))
        .map((entry): DocumentMarkdownVisibleUnit => ({
          unit_id: readStringFromJson(entry, "unit_id") ?? readStringFromJson(entry, "unitId") ?? "",
          kind: readStringFromJson(entry, "kind") ?? "paragraph",
          source_markdown: readStringFromJson(entry, "source_markdown") ?? readStringFromJson(entry, "sourceMarkdown") ?? "",
          translatable: entry.translatable !== false,
          protected_spans: Array.isArray(entry.protected_spans)
            ? (entry.protected_spans as unknown[]).filter((value: unknown): value is string => typeof value === "string")
            : Array.isArray(entry.protectedSpans)
              ? (entry.protectedSpans as unknown[]).filter((value: unknown): value is string => typeof value === "string")
              : [],
        }))
        .filter((unit: DocumentMarkdownVisibleUnit) => unit.unit_id.length > 0);
  const locale = readStringFromJson(parsed, "locale") ?? "und";
  return {
    docPath: readStringFromJson(parsed, "doc_path") ?? readStringFromJson(parsed, "docPath"),
    sourceHash: readStringFromJson(parsed, "source_hash") ?? readStringFromJson(parsed, "sourceHash"),
    sourceTextHash: readStringFromJson(parsed, "source_text_hash") ?? readStringFromJson(parsed, "sourceTextHash"),
    sourceTextCharCount:
      readNumberFromJson(parsed, "source_text_char_count") ?? readNumberFromJson(parsed, "sourceTextCharCount"),
    receiptRef:
      readStringFromJson(parsed, "receipt_ref") ??
      readStringFromJson(parsed, "receiptRef") ??
      sourceRefs?.receiptRef ??
      null,
    chunkId: readStringFromJson(parsed, "chunk_id") ?? readStringFromJson(parsed, "chunkId"),
    chunkIndex: readNumberFromJson(parsed, "chunk_index") ?? readNumberFromJson(parsed, "chunkIndex"),
    laneSessionId: readStringFromJson(parsed, "lane_session_id") ?? readStringFromJson(parsed, "laneSessionId"),
    sessionControlKey:
      readStringFromJson(parsed, "session_control_key") ??
      readStringFromJson(parsed, "sessionControlKey") ??
      readStringFromJson(parsed, "lane_session_control_key") ??
      readStringFromJson(parsed, "laneSessionControlKey") ??
      sourceRefs?.sessionControlKey ??
      null,
    sourceBindingKey:
      readStringFromJson(parsed, "source_binding_key") ??
      readStringFromJson(parsed, "sourceBindingKey") ??
      sourceRefs?.sourceBindingKey ??
      null,
    sourceIdentityKey:
      readStringFromJson(parsed, "source_identity_key") ??
      readStringFromJson(parsed, "sourceIdentityKey") ??
      sourceRefs?.sourceIdentityKey ??
      null,
    latestSourceIdentityKey:
      readStringFromJson(parsed, "latest_source_identity_key") ??
      readStringFromJson(parsed, "latestSourceIdentityKey") ??
      sourceRefs?.latestSourceIdentityKey ??
      sourceRefs?.sourceIdentityKey ??
      null,
    mailLoopObservationKey:
      readStringFromJson(parsed, "mail_loop_observation_key") ??
      readStringFromJson(parsed, "mailLoopObservationKey") ??
      readStringFromJson(parsed, "latest_mail_loop_observation_key") ??
      readStringFromJson(parsed, "latestMailLoopObservationKey") ??
      sourceRefs?.mailLoopObservationKey ??
      null,
    dedupeKey: readStringFromJson(parsed, "dedupe_key") ?? readStringFromJson(parsed, "dedupeKey"),
    sourceEventId: readStringFromJson(parsed, "source_event_id") ?? readStringFromJson(parsed, "sourceEventId"),
    sourceEventMs: readNumberFromJson(parsed, "source_event_ms") ?? readNumberFromJson(parsed, "sourceEventMs"),
    locale,
    targetLanguage: readStringFromJson(parsed, "target_language") ?? readStringFromJson(parsed, "targetLanguage") ?? locale,
    accountLocale: readStringFromJson(parsed, "account_locale") ?? readStringFromJson(parsed, "accountLocale") ?? locale,
    translationContractVersion:
      readStringFromJson(parsed, "translation_contract_version") ??
      readStringFromJson(parsed, "translationContractVersion"),
    projectionTarget: readStringFromJson(parsed, "projection_target") ?? readStringFromJson(parsed, "projectionTarget") ?? HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_CHUNK,
    freshnessStatus: readStringFromJson(parsed, "freshness_status") ?? readStringFromJson(parsed, "freshnessStatus") ?? "fresh",
    units,
  };
};

const readDocumentTranslationItems = (
  json: Record<string, unknown> | null,
): StagePlayDocumentInlineTranslationOutputV1["translations"] => {
  const translations: unknown[] = Array.isArray(json?.translations) ? json.translations : [];
  return translations
    .map((entry: unknown) => readRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .map((entry: Record<string, unknown>) => ({
      unit_id: readStringFromJson(entry, "unit_id") ?? readStringFromJson(entry, "unitId") ?? "",
      translated_markdown:
        readStringFromJson(entry, "translated_markdown") ??
        readStringFromJson(entry, "translatedMarkdown") ??
        readStringFromJson(entry, "translation") ??
        "",
      confidence: readConfidence(entry.confidence) ?? "medium",
      warnings: readStringArrayFromJson(entry, "warnings"),
    }))
    .filter((entry: StagePlayDocumentInlineTranslationOutputV1["translations"][number]) =>
      entry.unit_id.length > 0 && entry.translated_markdown.trim().length > 0);
};

const readDocumentUnitErrors = (
  json: Record<string, unknown> | null,
): StagePlayDocumentInlineTranslationOutputV1["unit_errors"] => {
  const errors: unknown[] = Array.isArray(json?.unit_errors)
    ? json.unit_errors
    : Array.isArray(json?.unitErrors)
      ? json.unitErrors
      : [];
  return errors
    .map((entry: unknown) => readRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .map((entry: Record<string, unknown>) => ({
      unit_id: readStringFromJson(entry, "unit_id") ?? readStringFromJson(entry, "unitId") ?? "",
      reason: readStringFromJson(entry, "reason") ?? "translation_unavailable",
    }))
    .filter((entry: StagePlayDocumentInlineTranslationOutputV1["unit_errors"][number]) => entry.unit_id.length > 0);
};

const readDocumentQualityChecks = (
  json: Record<string, unknown> | null,
  fallbackStatus: "pass" | "warn" | "fail",
  fallbackDetail: string,
): StagePlayDocumentInlineTranslationOutputV1["qualityChecks"] => {
  const checks: unknown[] = Array.isArray(json?.qualityChecks) ? json.qualityChecks : [];
  const parsed = checks
    .map((entry: unknown) => readRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .map((entry: Record<string, unknown>) => {
      const status = entry.status === "pass" || entry.status === "warn" || entry.status === "fail"
        ? entry.status
        : fallbackStatus;
      return {
        name: readStringFromJson(entry, "name") ?? "document_translation_contract",
        status,
        detail: readStringFromJson(entry, "detail") ?? fallbackDetail,
      };
    });
  return parsed.length > 0
    ? parsed
    : [{
        name: "document_translation_contract",
        status: fallbackStatus,
        detail: fallbackDetail,
      }];
};

const buildDocumentInlineTranslationOutput = (input: {
  sourceId: string;
  mailItems: StagePlayLiveSourceMailItemV1[];
  json?: Record<string, unknown> | null;
  now: string;
  fallbackReason?: string | null;
}): StagePlayDocumentInlineTranslationOutputV1 => {
  const visible = readDocumentMarkdownVisibleUnitsPayload(input.mailItems);
  const translations = readDocumentTranslationItems(input.json ?? null);
  const explicitErrors = readDocumentUnitErrors(input.json ?? null);
  const fallbackUnitErrors = translations.length === 0 && explicitErrors.length === 0 && input.fallbackReason
    ? visible.units
        .filter((unit: DocumentMarkdownVisibleUnit) => unit.translatable)
        .map((unit: DocumentMarkdownVisibleUnit) => ({
          unit_id: unit.unit_id,
          reason: input.fallbackReason ?? "translation_unavailable",
        }))
    : [];
  const unitErrors = uniqueStrings([...explicitErrors, ...fallbackUnitErrors].map((entry) => JSON.stringify(entry)))
    .map((entry: string) => JSON.parse(entry) as StagePlayDocumentInlineTranslationOutputV1["unit_errors"][number]);
  const fallbackStatus: "pass" | "warn" | "fail" = translations.length > 0 ? "pass" : input.fallbackReason ? "fail" : "warn";
  const fallbackDetail = translations.length > 0
    ? "Structured document translation candidates are available."
    : input.fallbackReason ?? "No structured document translation candidates were returned.";
  const locale = readStringFromJson(input.json ?? null, "locale") ?? visible.locale;
  const targetLanguage =
    readStringFromJson(input.json ?? null, "target_language") ??
    readStringFromJson(input.json ?? null, "targetLanguage") ??
    visible.targetLanguage ??
    locale;
  const accountLocale =
    readStringFromJson(input.json ?? null, "account_locale") ??
    readStringFromJson(input.json ?? null, "accountLocale") ??
    visible.accountLocale ??
    locale;
  const projectionStatus =
    translations.length > 0
      ? "projected"
      : input.fallbackReason
        ? "failed"
        : "stale";
  const observedAtMs = Date.parse(input.now);
  return {
    schema: STAGE_PLAY_DOCUMENT_INLINE_TRANSLATION_OUTPUT_SCHEMA,
    schemaVersion: STAGE_PLAY_DOCUMENT_INLINE_TRANSLATION_OUTPUT_SCHEMA,
    sourceKind: "document_markdown",
    sourceId: input.sourceId,
    docPath: visible.docPath,
    sourceHash: visible.sourceHash,
    sourceTextHash: visible.sourceTextHash,
    sourceTextCharCount: visible.sourceTextCharCount,
    receiptRef: visible.receiptRef,
    chunkId: visible.chunkId,
    chunkIndex: visible.chunkIndex,
    laneSessionId: visible.laneSessionId,
    sessionControlKey: visible.sessionControlKey,
    sourceBindingKey: visible.sourceBindingKey,
    sourceIdentityKey: visible.sourceIdentityKey,
    latestSourceIdentityKey: visible.latestSourceIdentityKey,
    mailLoopObservationKey: visible.mailLoopObservationKey,
    latestMailLoopObservationKey: visible.mailLoopObservationKey,
    dedupeKey: visible.dedupeKey,
    sourceEventId: visible.sourceEventId,
    sourceEventMs: visible.sourceEventMs,
    locale,
    targetLanguage,
    accountLocale,
    translationContractVersion: visible.translationContractVersion,
    projectionTarget: visible.projectionTarget,
    projectionStatus,
    freshnessStatus: visible.freshnessStatus,
    translations,
    unit_errors: unitErrors,
    qualityChecks: readDocumentQualityChecks(input.json ?? null, fallbackStatus, fallbackDetail),
    evidenceRefs: uniqueStrings([
      ...input.mailItems.flatMap((item: StagePlayLiveSourceMailItemV1) => item.evidenceRefs),
      ...readStringArrayFromJson(input.json ?? null, "evidenceRefs"),
      ...visible.units.map((unit: DocumentMarkdownVisibleUnit) => `${input.sourceId}:unit:${unit.unit_id}`),
    ]),
    observedAtMs: Number.isFinite(observedAtMs) ? observedAtMs : null,
    createdAt: input.now,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    context_role: "micro_reasoner_evidence",
  };
};

const documentInlineTranslationOutputPreview = (input: {
  sourceId: string;
  mailItems: StagePlayLiveSourceMailItemV1[];
  json?: Record<string, unknown> | null;
  now: string;
  fallbackReason?: string | null;
}): string =>
  JSON.stringify(buildDocumentInlineTranslationOutput(input));

const isRecommendedNext = (value: unknown): value is StagePlayLiveSourcePredictionValidationRecommendedNextV1 =>
  value === "wait_for_next_summary" ||
  value === "record_interpretation" ||
  value === "draft_text_answer" ||
  value === "request_voice_callout" ||
  value === "request_more_evidence" ||
  value === "request_stage_play_checkpoint";

const recommendedNextNeedsAsk = (
  value: StagePlayLiveSourcePredictionValidationRecommendedNextV1 | null | undefined,
): boolean =>
  value === "draft_text_answer" ||
  value === "request_voice_callout" ||
  value === "request_more_evidence" ||
  value === "request_stage_play_checkpoint";

const promptedOutputPreview = (role: StagePlayMicroReasonerRoleV1, json: Record<string, unknown> | null, fallback: string): string => {
  if (!json) return fallback;
  if (role === "claim_extractor") {
    return clipText([
      ...readStringArrayFromJson(json, "observedFacts").slice(0, 3),
      ...readStringArrayFromJson(json, "uncertainties").slice(0, 2).map((entry) => `uncertain: ${entry}`),
    ].join(" | ") || fallback, 320);
  }
  if (role === "observation_classifier") {
    return clipText([
      ...readStringArrayFromJson(json, "changedFacts").slice(0, 3),
      ...readStringArrayFromJson(json, "contradictions").slice(0, 2).map((entry) => `contradiction: ${entry}`),
    ].join(" | ") || fallback, 320);
  }
  if (role === "salience_scorer") {
    return clipText(`${readStringFromJson(json, "salienceLevel") ?? "unknown"}; voice ${readBooleanFromJson(json, "voiceCandidate") ? "candidate" : "no"}; recommended ${readStringFromJson(json, "recommendedNext") ?? "none"}; ${readStringArrayFromJson(json, "reasons").slice(0, 3).join(" | ")}`, 320);
  }
  if (role === "hypothesis_arbiter") {
    return clipText(`${readStringFromJson(json, "recommendedNext") ?? "unknown"}; wake ${readBooleanFromJson(json, "wakeAsk") ? "yes" : "no"}; ${readStringFromJson(json, "reason") ?? fallback}`, 320);
  }
  if (role === "prompt_router") {
    return clipText(`${readStringFromJson(json, "selectedCandidateId") ?? "none"}; confidence ${readStringFromJson(json, "confidence") ?? "unknown"}; ${readStringFromJson(json, "reason") ?? fallback}`, 320);
  }
  if (role === "decision_selector") {
    return clipText(`${readStringFromJson(json, "selectedDecision") ?? "unknown"}; next tool ${readStringFromJson(json, "recommendedNextTool") ?? "none"}; ${readStringArrayFromJson(json, "reasons").slice(0, 3).join(" | ")}`, 320);
  }
  return clipText(JSON.stringify(json).replace(/\s+/g, " "), 320) || fallback;
};

const defaultPromptedMicroReasonerExecutor: StagePlayPromptedMicroReasonerExecutor = async (input) => {
  const startedAt = performance.now();
  const result = await llmHttpHandler({
    model: process.env.STAGE_PLAY_MICRO_REASONER_LLM_MODEL ?? process.env.LLM_HTTP_MODEL ?? "gpt-4o-mini",
    temperature: Number(process.env.STAGE_PLAY_MICRO_REASONER_LLM_TEMPERATURE ?? 0.1),
    max_tokens: Number(input.maxOutputTokens ?? process.env.STAGE_PLAY_MICRO_REASONER_LLM_MAX_TOKENS ?? 420),
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          input.promptTemplate,
          "",
          "You are a bounded Stage Play micro-reasoner, not the Ask agent.",
          "Return JSON only. Use the requested schema and only the provided mail/packet evidence.",
          "Do not answer the user, do not call tools, and do not claim voice output happened.",
          "If the evidence is uncertain or contradicts the baseline, make that explicit.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          role: input.role,
          promptId: input.promptId,
          outputSchemaName: input.outputSchemaName,
          inputPreview: input.inputPreview,
          baselineOutputPreview: input.baselineOutputPreview,
          packet: {
            packetId: input.packet.packetId,
            mailIds: input.packet.mailIds,
            observedFacts: input.packet.observedFacts,
            inferredFacts: input.packet.inferredFacts,
            uncertainties: input.packet.uncertainties,
            changedFacts: input.packet.changedFacts,
            salience: input.packet.salience,
            recommendedNext: input.packet.recommendedNext,
            predictionValidation: input.packet.predictionValidation,
            arbiter: input.packet.arbiter,
          },
          priorMicroReasonerOutputs: input.priorOutputs,
          mail: input.mailItems.map((item) => ({
            mailId: item.mailId,
            sourceId: item.sourceId,
            sourceKind: item.sourceKind,
            summary: item.summary,
            evidenceRefs: item.evidenceRefs,
          })),
        }),
      },
    ],
    traceId: `stage_play_micro_reasoner:${input.role}:${input.packet.packetId}`,
  }, { personaId: "stage_play_micro_reasoner" }) as Record<string, unknown>;
  const text = typeof result.text === "string" ? result.text : "";
  return {
    ok: Boolean(text.trim()),
    text,
    json: parseJsonObjectFromText(text),
    model: typeof result.model === "string" ? result.model : "llm.http.generate",
    latencyMs: typeof result.__llm_timeout_ms === "number"
      ? Math.max(0, Math.round(performance.now() - startedAt))
      : Math.max(0, Math.round(performance.now() - startedAt)),
    tokenEstimateIn: typeof result.__llm_usage_prompt_tokens === "number"
      ? result.__llm_usage_prompt_tokens
      : typeof result.__llm_prompt_tokens_estimate === "number" ? result.__llm_prompt_tokens_estimate : null,
    tokenEstimateOut: typeof result.__llm_usage_completion_tokens === "number" ? result.__llm_usage_completion_tokens : null,
    error: null,
  };
};

const tokenTags = (values: string[], terms: string[]): string[] => {
  const text = values.join("\n").toLowerCase();
  return uniqueStrings(terms.filter((term) => text.includes(term.toLowerCase())));
};

const sceneTagsFor = (facts: string[]): string[] =>
  tokenTags(facts, [
    "interior",
    "base",
    "outdoor",
    "forest",
    "cave",
    "mining",
    "inventory",
    "combat",
    "damage",
    "building",
    "crafting",
    "transition",
  ]);

const objectTagsFor = (mailItems: StagePlayLiveSourceMailItemV1[], facts: string[]): string[] =>
  tokenTags([
    ...mailItems.map((item) => item.summary.text || item.summary.preview),
    ...facts,
  ], [
    "player",
    "chest",
    "inventory",
    "crafting",
    "furnace",
    "torch",
    "sword",
    "pickaxe",
    "fire",
    "lava",
    "mob",
    "creeper",
    "zombie",
    "skeleton",
    "ore",
    "diamond",
    "tree",
  ]);

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

const parseStructuredObserverOutput = (value: unknown): Record<string, unknown> | null => {
  const direct = readRecord(value);
  if (direct) return direct;
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return readRecord(JSON.parse(text.slice(start, end + 1)));
  } catch {
    return null;
  }
};

const readStructuredString = (record: Record<string, unknown>, key: string): string | null => {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

const readStructuredStringArray = (record: Record<string, unknown>, key: string): string[] => {
  const value = record[key];
  if (!Array.isArray(value)) return [];
  return uniqueStrings(value.map((entry) => {
    if (typeof entry === "string") return entry;
    if (entry && typeof entry === "object") return JSON.stringify(entry);
    return String(entry ?? "");
  }));
};

const readStructuredValueTexts = (record: Record<string, unknown>, key: string): string[] => {
  const value = record[key];
  if (typeof value === "string" && value.trim()) return [value.trim()];
  if (Array.isArray(value)) {
    return uniqueStrings(value.map((entry) => {
      if (typeof entry === "string") return entry;
      if (entry && typeof entry === "object") return JSON.stringify(entry);
      return String(entry ?? "");
    }));
  }
  if (value && typeof value === "object") return [JSON.stringify(value)];
  return [];
};

const readNestedStringArray = (
  record: Record<string, unknown>,
  objectKey: string,
  listKey: string,
): string[] => {
  const nested = readRecord(record[objectKey]);
  if (!nested) return [];
  return readStructuredStringArray(nested, listKey);
};

const readSalienceCandidateEntries = (
  record: Record<string, unknown>,
  key: "risks" | "opportunities",
): string[] => {
  const salience = readRecord(record.salience_candidates);
  if (!salience) return [];
  const values = salience[key];
  if (!Array.isArray(values)) return [];
  return uniqueStrings(values.map((entry) => {
    if (typeof entry === "string") return entry;
    const candidate = readRecord(entry);
    if (!candidate) return String(entry ?? "");
    const label = readStructuredString(candidate, "label") ?? "";
    const evidence = readStructuredString(candidate, "evidence") ?? "";
    return [label, evidence].filter(Boolean).join(": ");
  }));
};

const structuredObserverFactsFor = (input: {
  mailItems: StagePlayLiveSourceMailItemV1[];
}): {
  observedFacts: string[];
  inferredFacts: string[];
  changedFacts: string[];
  uncertainties: string[];
  sceneTags: string[];
  activityTags: string[];
  objectTags: string[];
  riskMatches: string[];
  opportunityMatches: string[];
  voiceCalloutMatches: string[];
  watchNext: string[];
} => {
  const records = input.mailItems
    .map((item) => ({
      mailId: item.mailId,
      record: parseStructuredObserverOutput(item.summary.text) ?? parseStructuredObserverOutput(item.summary.preview),
    }))
    .filter((entry): entry is { mailId: string; record: Record<string, unknown> } => Boolean(entry.record));
  const observedFacts: string[] = [];
  const inferredFacts: string[] = [];
  const changedFacts: string[] = [];
  const uncertainties: string[] = [];
  const sceneTags: string[] = [];
  const activityTags: string[] = [];
  const objectTags: string[] = [];
  const riskMatches: string[] = [];
  const opportunityMatches: string[] = [];
  const watchNext: string[] = [];

  for (const { mailId, record } of records) {
    for (const key of [
      "scene",
      "hud",
      "hotbar",
      "selected_item",
      "crosshair_target",
      "current_action",
      "frame_overview",
      "near_field",
      "mid_field",
      "far_field",
      "visual_features",
      "text_read",
      "minecraft_objects",
      "affordances",
    ]) {
      for (const value of readStructuredValueTexts(record, key)) {
        observedFacts.push(`${mailId} ${key}: ${value}`);
      }
    }
    for (const entity of readStructuredStringArray(record, "visible_entities")) {
      observedFacts.push(`${mailId} visible_entity: ${entity}`);
      objectTags.push(entity);
    }
    for (const entity of readNestedStringArray(record, "minecraft_objects", "entities")) {
      observedFacts.push(`${mailId} visible_entity: ${entity}`);
      objectTags.push(entity);
    }
    for (const block of readNestedStringArray(record, "minecraft_objects", "blocks")) objectTags.push(block);
    for (const item of readNestedStringArray(record, "minecraft_objects", "items")) objectTags.push(item);
    for (const workstation of readNestedStringArray(record, "minecraft_objects", "workstations")) objectTags.push(workstation);
    for (const container of readNestedStringArray(record, "minecraft_objects", "containers")) objectTags.push(container);
    for (const change of readStructuredStringArray(record, "changed_since_last_frame")) {
      changedFacts.push(`${mailId}: ${change}`);
    }
    for (const uncertainty of readStructuredStringArray(record, "uncertainty")) {
      uncertainties.push(`${mailId}: ${uncertainty}`);
    }
    for (const risk of readStructuredStringArray(record, "risk_cues")) {
      riskMatches.push(risk);
    }
    riskMatches.push(...readSalienceCandidateEntries(record, "risks"));
    for (const opportunity of readStructuredStringArray(record, "opportunity_cues")) {
      opportunityMatches.push(opportunity);
    }
    opportunityMatches.push(...readSalienceCandidateEntries(record, "opportunities"));
    const prediction = readStructuredString(record, "next_10s_prediction");
    if (prediction) {
      inferredFacts.push(`${mailId} next_10s_prediction: ${prediction}`);
      watchNext.push(prediction);
    }
    const sceneTexts = [
      ...readStructuredValueTexts(record, "scene"),
      ...readStructuredValueTexts(record, "frame_overview"),
      ...readStructuredValueTexts(record, "near_field"),
      ...readStructuredValueTexts(record, "mid_field"),
      ...readStructuredValueTexts(record, "far_field"),
    ];
    if (sceneTexts.length > 0) sceneTags.push(...sceneTagsFor(sceneTexts));
    const action = readStructuredString(record, "current_action");
    if (action) activityTags.push(action);
    for (const key of ["hud", "hotbar", "selected_item", "crosshair_target", "text_read", "minecraft_objects"]) {
      for (const value of readStructuredValueTexts(record, key)) {
        if (!/\b(?:uncertain|not clear|unclear|not visible|unknown|unreadable|ambiguous)\b/i.test(value)) continue;
        uncertainties.push(`${mailId} ${key}: ${value}`);
      }
    }
  }

  const voiceCalloutMatches = tokenTags(riskMatches, [
    "fire",
    "damage",
    "hostile",
    "mob",
    "creeper",
    "zombie",
    "skeleton",
    "lava",
    "low health",
    "danger",
  ]);
  return {
    observedFacts: uniqueStrings(observedFacts),
    inferredFacts: uniqueStrings(inferredFacts),
    changedFacts: uniqueStrings(changedFacts),
    uncertainties: uniqueStrings(uncertainties),
    sceneTags: uniqueStrings(sceneTags),
    activityTags: uniqueStrings(activityTags),
    objectTags: uniqueStrings(objectTags),
    riskMatches: uniqueStrings(riskMatches),
    opportunityMatches: uniqueStrings(opportunityMatches),
    voiceCalloutMatches,
    watchNext: uniqueStrings(watchNext),
  };
};

const recommendedNextFor = (input: {
  comparison?: StagePlayLiveSourceInterpreterProfileComparisonV1 | null;
  validation: StagePlayLiveSourcePredictionValidationV1;
  immersionState: StagePlayLiveSourceImmersionStateV1;
  structuredRiskMatches?: string[];
  structuredVoiceCalloutMatches?: string[];
}): StagePlayLiveSourcePredictionValidationRecommendedNextV1 => {
  if (input.comparison?.recommendedDecision === "request_voice_callout") return "request_voice_callout";
  if (input.comparison?.recommendedDecision === "request_more_evidence") return "request_more_evidence";
  if (input.comparison?.recommendedDecision === "request_stage_play_checkpoint") return "request_stage_play_checkpoint";
  if ((input.structuredVoiceCalloutMatches?.length ?? 0) > 0) return "request_voice_callout";
  if (
    input.immersionState.salience.voiceCandidate &&
    (input.immersionState.salience.level === "high" || input.immersionState.salience.level === "urgent")
  ) {
    return "request_voice_callout";
  }
  if (input.validation.recommendedNext !== "wait_for_next_summary") return input.validation.recommendedNext;
  if (input.comparison?.recommendedDecision === "record_interpretation") return "record_interpretation";
  if (input.comparison?.recommendedDecision === "draft_text_answer") return "draft_text_answer";
  return "wait_for_next_summary";
};

const evidenceMatching = (values: string[], pattern: RegExp, limit = 4): string[] =>
  values.filter((value) => pattern.test(value)).slice(0, limit);

const minecraftImmediateHazardPattern =
  /\b(?:on fire|fire damage|burning|damage|damaged|low health|hostile(?: mob)?|creeper|zombie|skeleton|combat|attack|lava)\b/i;

const minecraftCaveExplorationPattern =
  /\b(?:cave|underground|mining|mine|dark cave|ore|lava)\b/i;

const estimateEffort = (input: {
  observedFacts: string[];
  inferredFacts: string[];
  changedFacts: string[];
  structured: ReturnType<typeof structuredObserverFactsFor>;
  immersionState: StagePlayLiveSourceImmersionStateV1;
  priorImmersionState?: StagePlayLiveSourceImmersionStateV1 | null;
}): StagePlayEffortEstimateV1 => {
  const facts = uniqueStrings([
    ...input.observedFacts,
    ...input.changedFacts,
    ...input.structured.riskMatches,
    ...input.structured.opportunityMatches,
    input.immersionState.currentActivity,
  ]);
  const text = facts.join("\n").toLowerCase();
  const matches = (pattern: RegExp) => evidenceMatching(facts, pattern);
  const effort =
    minecraftImmediateHazardPattern.test(text) || /\b(?:recover|retreat)\b/i.test(text)
      ? "combat_or_recovery"
      : minecraftCaveExplorationPattern.test(text)
        ? "cave_exploration"
        : /\b(?:tree|forest|outdoor|surface|plains|sky|daylight|night)\b/i.test(text)
          ? "surface_exploration"
          : /\b(?:travel|navigation|route|moving|walking|bridge|path)\b/i.test(text)
            ? "travel_or_navigation"
            : /\b(?:chest|inventory|storage|sort|ui|menu)\b/i.test(text)
              ? "inventory_management"
              : /\b(?:craft|furnace|building|build|place block|workbench)\b/i.test(text)
          ? "building_or_crafting"
              : "unknown";
  const evidenceFor = matches(
    effort === "combat_or_recovery" ? /\b(?:on fire|fire damage|burning|damage|damaged|low health|hostile(?: mob)?|creeper|zombie|skeleton|combat|attack|lava|recover|retreat)\b/i :
      effort === "inventory_management" ? /\b(?:chest|inventory|storage|sort|ui|menu)\b/i :
      effort === "building_or_crafting" ? /\b(?:craft|furnace|building|build|place block|workbench)\b/i :
      effort === "cave_exploration" ? minecraftCaveExplorationPattern :
      effort === "surface_exploration" ? /\b(?:tree|forest|outdoor|surface|plains|sky|daylight|night)\b/i :
      /\b(?:travel|navigation|route|moving|walking|bridge|path)\b/i,
  );
  const nextLikelyEfforts = effort === "inventory_management"
    ? ["continue_inventory_management", "exit_to_explore", "craft_or_equip"]
    : effort === "cave_exploration"
      ? ["continue_cave_exploration", "place_torches_or_check_mobs", "mine_or_collect_resource"]
      : effort === "combat_or_recovery"
        ? ["recover_or_retreat", "continue_combat", "seek_safety"]
        : effort === "building_or_crafting"
          ? ["continue_building_or_crafting", "collect_missing_materials"]
          : effort === "surface_exploration"
            ? ["continue_surface_exploration", "return_to_base", "collect_surface_resources"]
            : ["continue_current_activity", "wait_for_clearer_evidence"];
  return {
    currentEffort: effort,
    evidenceFor: evidenceFor.length > 0 ? evidenceFor : facts.slice(0, 2),
    evidenceAgainst: input.structured.uncertainties.slice(0, 3),
    confidence: effort === "unknown" ? 0.38 : Math.min(0.86, 0.55 + evidenceFor.length * 0.08),
    nextLikelyEfforts,
  };
};

const extractAxioms = (input: {
  effort: StagePlayEffortEstimateV1;
  observedFacts: string[];
  structured: ReturnType<typeof structuredObserverFactsFor>;
  immersionState: StagePlayLiveSourceImmersionStateV1;
}): StagePlayAxiomFrameV1 => {
  const facts = uniqueStrings([
    ...input.observedFacts,
    ...input.immersionState.currentSceneFacts,
    ...input.structured.riskMatches,
    ...input.structured.opportunityMatches,
  ]);
  const text = facts.join("\n").toLowerCase();
  const axioms = uniqueStrings([
    input.effort.currentEffort !== "unknown" ? `current effort: ${input.effort.currentEffort}` : null,
    /\b(?:base|interior|chest)\b/i.test(text) ? "location/interface: base or inventory context visible" : null,
    minecraftCaveExplorationPattern.test(text) ? "location: cave or underground exploration context" : null,
    /\b(?:outdoor|forest|surface|sky|tree)\b/i.test(text) ? "location: surface/outdoor context" : null,
    minecraftImmediateHazardPattern.test(text) ? "hazard: immediate risk cue present" : null,
    /\b(?:pickaxe|sword|torch|hotbar|selected_item|selected item)\b/i.test(text) ? "gear/interface: selected item or hotbar evidence present" : null,
    /\b(?:ore|diamond|resource)\b/i.test(text) ? "opportunity: resource cue present" : null,
  ]);
  const missingAxioms = uniqueStrings([
    /\b(?:health|hud)\b/i.test(text) && !/\b(?:uncertain|unknown|not visible)\b/i.test(text) ? null : "exact health/hunger state",
    /\b(?:armor)\b/i.test(text) ? null : "armor/protection state",
    /\b(?:torch|light|dark|night)\b/i.test(text) ? null : "lighting and safe-route margin",
    /\b(?:inventory|hotbar|selected_item|selected item|pickaxe|sword)\b/i.test(text) ? null : "full inventory/tool durability",
  ]);
  return {
    axioms: axioms.length > 0 ? axioms : ["current visible state is too sparse for strong action constraints"],
    missingAxioms,
    predictionRelevantVariables: uniqueStrings([
      "currentEffort",
      "location",
      "health/hunger",
      "selected item",
      "nearby hazards",
      "nearby opportunities",
      "next 10s scene transition",
    ]),
  };
};

const generateHypotheses = (input: {
  effort: StagePlayEffortEstimateV1;
  axioms: StagePlayAxiomFrameV1;
  predictionValidation: StagePlayLiveSourcePredictionValidationV1;
  structured: ReturnType<typeof structuredObserverFactsFor>;
}): StagePlaySceneBeatHypothesisV1[] => {
  const effort = input.effort.currentEffort;
  const base: StagePlaySceneBeatHypothesisV1[] =
    effort === "inventory_management"
      ? [
          {
            label: "continue_inventory_management",
            prediction: "Player remains in inventory/chest/base management for the next observation window.",
            confidence: 0.5,
            validationSignals: ["chest or inventory UI remains visible", "hotbar/inventory stays central"],
            whatWouldContradictIt: ["outdoor or cave movement replaces inventory UI"],
          },
          {
            label: "exit_to_explore",
            prediction: "Player leaves the base/interface context and resumes movement or exploration.",
            confidence: 0.32,
            validationSignals: ["door/outdoor/cave view appears", "movement action replaces inventory interaction"],
            whatWouldContradictIt: ["stable inventory or chest UI persists"],
          },
        ]
      : effort === "cave_exploration"
        ? [
            {
              label: "continue_cave_exploration",
              prediction: "Player continues through the cave while watching light, mobs, and terrain hazards.",
              confidence: 0.52,
              validationSignals: ["cave/underground view persists", "darkness, ore, lava, or mining cues remain"],
              whatWouldContradictIt: ["surface/base scene appears"],
            },
            {
              label: "resource_or_hazard_contact",
              prediction: "A resource or hazard becomes the next operational focus.",
              confidence: 0.38,
              validationSignals: ["ore, lava, mob, fire, or damage cue becomes prominent"],
              whatWouldContradictIt: ["routine safe traversal with no new cues"],
            },
          ]
        : effort === "combat_or_recovery"
          ? [
              {
                label: "recover_or_create_distance",
                prediction: "Player likely needs to recover, retreat, or create distance from the hazard.",
                confidence: 0.62,
                validationSignals: ["fire, damage, low health, hostile mob, or retreat movement continues"],
                whatWouldContradictIt: ["hazard disappears and health/risk indicators stabilize"],
              },
              {
                label: "continue_engagement",
                prediction: "Player may continue combat or hazard navigation if tool/weapon control is maintained.",
                confidence: 0.28,
                validationSignals: ["weapon selected", "hostile entity remains visible", "forward movement continues"],
                whatWouldContradictIt: ["pause, retreat, shelter, or inventory recovery action appears"],
              },
            ]
          : [
              {
                label: "continue_current_activity",
                prediction: "Player continues the current visible effort unless a new scene transition appears.",
                confidence: 0.44,
                validationSignals: input.effort.nextLikelyEfforts.slice(0, 3),
                whatWouldContradictIt: ["clear scene transition", "new hazard", "new UI or route state"],
              },
              {
                label: "state_shift_pending",
                prediction: "The next frame may clarify whether the player is changing goals.",
                confidence: 0.32,
                validationSignals: ["new changed_since_last_frame cue", "new selected item or location"],
                whatWouldContradictIt: ["same scene and same activity repeat"],
              },
            ];
  const validationHypothesis = input.predictionValidation.result !== "no_prior_prediction"
    ? [{
        label: `prior_prediction_${input.predictionValidation.result}`,
        prediction: `Prior prediction is ${input.predictionValidation.result}; watch validation signals before changing the objective.`,
        confidence: input.predictionValidation.result === "supported" ? 0.56 : 0.42,
        validationSignals: uniqueStrings([
          ...input.predictionValidation.supportedSignals,
          ...input.predictionValidation.newSignals,
        ]).slice(0, 5),
        whatWouldContradictIt: input.predictionValidation.contradictedSignals.slice(0, 5),
      }]
    : [];
  return [...base, ...validationHypothesis].slice(0, 4);
};

const arbitrateHypotheses = (input: {
  baselineRecommendedNext: StagePlayLiveSourcePredictionValidationRecommendedNextV1;
  effort: StagePlayEffortEstimateV1;
  axioms: StagePlayAxiomFrameV1;
  hypotheses: StagePlaySceneBeatHypothesisV1[];
  validation: StagePlayLiveSourcePredictionValidationV1;
  immersionState: StagePlayLiveSourceImmersionStateV1;
  calloutDraft: string | null;
  comparison?: StagePlayLiveSourceInterpreterProfileComparisonV1 | null;
}): StagePlayHypothesisArbiterV1 => {
  const urgentVoice =
    input.baselineRecommendedNext === "request_voice_callout" ||
    (
      input.immersionState.salience.voiceCandidate &&
      (input.immersionState.salience.level === "high" || input.immersionState.salience.level === "urgent")
    );
  const recommendation: StagePlayLiveSourcePredictionValidationRecommendedNextV1 = urgentVoice
    ? "request_voice_callout"
    : input.validation.result === "contradicted" || input.validation.result === "partially_supported"
      ? "record_interpretation"
      : input.baselineRecommendedNext;
  const missingEvidence = uniqueStrings([
    ...input.axioms.missingAxioms.slice(0, 4),
    input.comparison ? null : "active_interpreter_profile_comparison",
    input.validation.result === "no_prior_prediction" ? "prior_prediction_for_validation" : null,
  ]);
  const selectedHypothesis = input.hypotheses
    .slice()
    .sort((left, right) => right.confidence - left.confidence)[0]?.label ?? null;
  const reason = urgentVoice
    ? "urgent/high-salience risk or voice policy match requires a decision receipt before any voice tool"
    : recommendation === "wait_for_next_summary"
      ? `routine ${input.effort.currentEffort} evidence does not justify waking Ask`
      : input.validation.result === "contradicted" || input.validation.result === "partially_supported"
        ? `prediction ${input.validation.result}; record interpretation to update the continuing effort`
        : `${input.effort.currentEffort} evidence supports ${recommendation}`;
  const wakeAsk =
    urgentVoice ||
    recommendation === "request_more_evidence" ||
    recommendation === "request_stage_play_checkpoint" ||
    recommendation === "draft_text_answer";
  return {
    recommendedNext: recommendation,
    wakeAsk,
    reason,
    confidence: urgentVoice || missingEvidence.length === 0 ? "high" : missingEvidence.length <= 2 ? "medium" : "low",
    selectedHypothesis,
    voiceCandidate: urgentVoice,
    calloutDraft: urgentVoice ? input.calloutDraft : null,
    missingEvidence,
  };
};

const monotonicMsForMailItem = (item: StagePlayLiveSourceMailItemV1, firstCreatedMs: number): number => {
  const createdMs = Date.parse(item.createdAt);
  if (!Number.isFinite(createdMs) || !Number.isFinite(firstCreatedMs)) return 0;
  return Math.max(0, createdMs - firstCreatedMs);
};

const buildProcessedMailEvidenceHandles = (input: {
  sourceId: string;
  mailItems: StagePlayLiveSourceMailItemV1[];
  observedFacts: string[];
  changedFacts: string[];
  watchNext: string[];
}): StagePlayProcessedMailEvidenceHandlesV1 => {
  const firstCreatedMs = Date.parse(input.mailItems[0]?.createdAt ?? "");
  const sourceReceipts = input.mailItems.map((item) => ({
    receiptId: item.mailId,
    sourceId: item.sourceId,
    sourceKind: item.sourceKind,
    mailId: item.mailId,
    capturedAt: item.createdAt,
    monotonicTimeMs: monotonicMsForMailItem(item, firstCreatedMs),
    evidenceRefs: uniqueStrings([
      item.mailId,
      ...item.evidenceRefs,
      item.sourceRefs.frameRef,
      item.sourceRefs.evidenceRef,
      item.sourceRefs.observationRef,
      item.sourceRefs.receiptRef,
    ]),
    frameRef: item.sourceRefs.frameRef ?? null,
    observationRef: item.sourceRefs.observationRef ?? null,
    receiptRef: item.sourceRefs.receiptRef ?? null,
  }));
  const visualItems = input.mailItems.filter((item) => item.sourceRefs.frameRef || item.sourceKind === "visual_frame");
  const frameReceipts = visualItems.map((item, index) => {
    const receiptId = item.sourceRefs.frameRef ?? `frame:${item.mailId}`;
    return {
      receiptId,
      sourceId: item.sourceId,
      sourceKind: item.sourceKind,
      capturedAt: item.createdAt,
      monotonicTimeMs: monotonicMsForMailItem(item, firstCreatedMs),
      frameIndex: index,
      hash: hashShort([
        item.sourceRefs.frameRef,
        item.sourceRefs.evidenceRef,
        item.summary.preview,
        item.createdAt,
      ]),
      previousFrameId: index > 0
        ? visualItems[index - 1]?.sourceRefs.frameRef ?? `frame:${visualItems[index - 1]?.mailId}`
        : null,
      nextFrameId: index < visualItems.length - 1
        ? visualItems[index + 1]?.sourceRefs.frameRef ?? `frame:${visualItems[index + 1]?.mailId}`
        : null,
      parentMailId: item.mailId,
      evidenceRefs: uniqueStrings([
        item.mailId,
        ...item.evidenceRefs,
        item.sourceRefs.frameRef,
        item.sourceRefs.evidenceRef,
        item.sourceRefs.observationRef,
      ]),
    };
  });
  const frameIntervals = frameReceipts.length > 0
    ? [{
        intervalId: `stage_play_frame_interval:${hashShort([
          input.sourceId,
          frameReceipts[0]?.receiptId,
          frameReceipts.at(-1)?.receiptId,
          input.mailItems.map((item) => item.mailId),
        ])}`,
        sourceId: input.sourceId,
        sourceKind: input.mailItems[0]?.sourceKind ?? "visual_frame",
        startFrameId: frameReceipts[0]!.receiptId,
        endFrameId: frameReceipts.at(-1)!.receiptId,
        startTimeMs: frameReceipts[0]!.monotonicTimeMs,
        endTimeMs: frameReceipts.at(-1)!.monotonicTimeMs,
        strideMs: input.mailItems
          .map((item) => item.hints?.elapsedMsSincePrevious)
          .find((elapsed): elapsed is number => typeof elapsed === "number" && elapsed > 0) ?? null,
        keyFrameIds: frameReceipts.map((receipt) => receipt.receiptId),
        reasonCaptured: uniqueStrings([
          ...input.changedFacts,
          ...input.watchNext.map((target) => `watch: ${target}`),
        ]).slice(0, 3).join("; ") || "processed live-source visual mail interval",
        evidenceRefs: uniqueStrings(frameReceipts.flatMap((receipt) => receipt.evidenceRefs)),
      }]
    : [];
  const situationSlices = input.mailItems.map((item) => ({
    sliceId: `stage_play_situation_slice:${hashShort([item.mailId, item.sourceId])}`,
    timeMs: monotonicMsForMailItem(item, firstCreatedMs),
    sources: {
      screen: item.sourceKind === "visual_frame" ? item.sourceRefs.frameRef ?? item.mailId : null,
      audio: item.sourceKind === "audio_transcript" ? item.mailId : null,
      game: item.sourceKind === "minecraft_world_event" ? item.mailId : null,
      source: item.mailId,
    },
    knownDeltas: uniqueStrings([
      ...input.changedFacts,
      item.hints?.deterministicChangeHint ? `mail hint: ${item.hints.deterministicChangeHint}` : null,
    ]).slice(0, 6),
    evidenceRefs: uniqueStrings([
      item.mailId,
      ...item.evidenceRefs,
      item.sourceRefs.frameRef,
      item.sourceRefs.evidenceRef,
      item.sourceRefs.observationRef,
    ]),
  }));
  return {
    sourceReceipts,
    frameReceipts,
    frameIntervals,
    lensProducts: [],
    situationSlices,
  };
};

const predictionBasisFor = (input: {
  effort: StagePlayEffortEstimateV1;
  hypothesis: StagePlaySceneBeatHypothesisV1;
  packetRecommendedNext: StagePlayLiveSourcePredictionValidationRecommendedNextV1;
  validation: StagePlayLiveSourcePredictionValidationV1;
  salienceLevel: StagePlayLiveSourceImmersionStateV1["salience"]["level"];
}): StagePlayGoalBasedActionPredictionV1["basis"] => uniqueStrings([
  input.hypothesis.label.includes("prior_prediction") || input.validation.result !== "no_prior_prediction"
    ? "prediction_validation"
    : null,
  input.effort.currentEffort === "combat_or_recovery" ? "recovery_pattern" : null,
  input.effort.currentEffort === "inventory_management" ? "tool_affordance" : null,
  input.packetRecommendedNext === "request_voice_callout" || input.salienceLevel === "high" || input.salienceLevel === "urgent"
    ? "salience"
    : null,
  input.hypothesis.label.includes("state_shift") ? "surface_cue" : null,
  "goal_object",
]) as StagePlayGoalBasedActionPredictionV1["basis"];

const buildGoalBasedActionPredictions = (input: {
  packetId: string;
  sourceId: string;
  mailIds: string[];
  observedFacts: string[];
  changedFacts: string[];
  inferredFacts: string[];
  uncertainties: string[];
  visualEvidenceRefs: string[];
  evidenceHandles: StagePlayProcessedMailEvidenceHandlesV1;
  effortEstimate: StagePlayEffortEstimateV1;
  hypotheses: StagePlaySceneBeatHypothesisV1[];
  recommendedNext: StagePlayLiveSourcePredictionValidationRecommendedNextV1;
  validation: StagePlayLiveSourcePredictionValidationV1;
  salienceLevel: StagePlayLiveSourceImmersionStateV1["salience"]["level"];
}): StagePlayGoalBasedActionPredictionV1[] => {
  const frameIntervalRefs = input.evidenceHandles.frameIntervals.map((interval) => interval.intervalId);
  const sourceSliceRefs = input.evidenceHandles.situationSlices.map((slice) => slice.sliceId);
  return input.hypotheses.slice(0, 4).map((hypothesis) => ({
    predictionId: `stage_play_action_prediction:${hashShort([
      input.packetId,
      hypothesis.label,
      input.recommendedNext,
    ])}`,
    actorId: input.sourceId,
    predictedAction: hypothesis.prediction,
    basis: predictionBasisFor({
      effort: input.effortEstimate,
      hypothesis,
      packetRecommendedNext: input.recommendedNext,
      validation: input.validation,
      salienceLevel: input.salienceLevel,
    }),
    worldStateClaims: uniqueStrings([
      ...input.observedFacts,
      ...input.changedFacts.map((fact) => `Changed: ${fact}`),
    ]).slice(0, 8),
    actorBeliefClaims: uniqueStrings([
      `current effort: ${input.effortEstimate.currentEffort}`,
      ...input.effortEstimate.nextLikelyEfforts.map((effort) => `possible next effort: ${effort}`),
      ...input.inferredFacts.slice(0, 3),
    ]).slice(0, 8),
    decisiveUncertainties: uniqueStrings([
      ...input.uncertainties,
      ...input.effortEstimate.evidenceAgainst,
    ]).slice(0, 8),
    frameIntervalRefs,
    lensRefs: input.evidenceHandles.lensProducts.map((product) => product.lensReceiptId),
    sourceSliceRefs,
    confidence: Math.max(0, Math.min(1, hypothesis.confidence)),
    disconfirmers: hypothesis.whatWouldContradictIt,
    recommendedNext: input.recommendedNext,
    evidenceRefs: uniqueStrings([
      input.packetId,
      ...input.mailIds,
      ...input.visualEvidenceRefs,
      ...frameIntervalRefs,
      ...sourceSliceRefs,
    ]),
  }));
};

const buildEvidenceLeads = (input: {
  packetId: string;
  sourceId: string;
  actionPredictions: StagePlayGoalBasedActionPredictionV1[];
  evidenceHandles: StagePlayProcessedMailEvidenceHandlesV1;
  arbiter: StagePlayHypothesisArbiterV1;
  predictionValidation: StagePlayLiveSourcePredictionValidationV1;
  uncertainties: string[];
  recommendedNext: StagePlayLiveSourcePredictionValidationRecommendedNextV1;
}): StagePlayEvidenceLeadV1[] => {
  const frameInterval = input.evidenceHandles.frameIntervals[0] ?? null;
  const affectedPredictionIds = input.actionPredictions.map((prediction) => prediction.predictionId);
  const baseRequest = {
    sourceId: input.sourceId,
    around: frameInterval?.reasonCaptured ?? "latest processed live-source packet",
    beforeMs: 3000,
    afterMs: 1500,
    strideMs: frameInterval?.strideMs ?? 250,
    lensPresets: ["raw_thumbnail", "motion_delta", "object_track", "occlusion_map"],
  };
  const leads: StagePlayEvidenceLeadV1[] = [];
  if (
    input.recommendedNext === "request_more_evidence" ||
    input.predictionValidation.result === "contradicted" ||
    input.predictionValidation.result === "partially_supported"
  ) {
    leads.push({
      leadId: `stage_play_evidence_lead:${hashShort([input.packetId, "prediction_validation"])}`,
      question: "Which frame interval explains why the prior prediction was not fully supported?",
      whyItMatters: "Goal-based action prediction should repair contradicted or partially supported predictions before waking Ask.",
      affectedPredictionIds,
      neededSources: [input.sourceId],
      suggestedFrameIntervals: [baseRequest],
      urgency: input.predictionValidation.result === "contradicted" ? "high" : "medium",
      evidenceRefs: uniqueStrings([
        input.packetId,
        input.predictionValidation.validationId,
        frameInterval?.intervalId,
      ]),
    });
  }
  if (input.arbiter.missingEvidence.length > 0 || input.uncertainties.length > 0) {
    leads.push({
      leadId: `stage_play_evidence_lead:${hashShort([input.packetId, "missing_evidence"])}`,
      question: `Can the synchronized frame/source history resolve ${uniqueStrings([
        ...input.arbiter.missingEvidence,
        ...input.uncertainties,
      ]).slice(0, 2).join(" and ")}?`,
      whyItMatters: "The first-pass packet has prediction-relevant uncertainty that should be checked against retrievable perceptual evidence.",
      affectedPredictionIds,
      neededSources: [input.sourceId],
      suggestedFrameIntervals: [baseRequest],
      urgency: input.recommendedNext === "request_voice_callout" ? "high" : "medium",
      evidenceRefs: uniqueStrings([
        input.packetId,
        frameInterval?.intervalId,
        ...input.arbiter.missingEvidence,
      ]),
    });
  }
  if (input.recommendedNext === "draft_text_answer" || input.recommendedNext === "request_voice_callout") {
    leads.push({
      leadId: `stage_play_evidence_lead:${hashShort([input.packetId, "pre_output_check"])}`,
      question: "Do raw frames and source slices support the output-shaping prediction?",
      whyItMatters: "User-facing text or voice should be grounded in raw/source receipts, with lens products only as support.",
      affectedPredictionIds,
      neededSources: [input.sourceId],
      suggestedFrameIntervals: [baseRequest],
      urgency: "high",
      evidenceRefs: uniqueStrings([
        input.packetId,
        frameInterval?.intervalId,
        ...input.actionPredictions.flatMap((prediction) => prediction.evidenceRefs),
      ]),
    });
  }
  return leads.slice(0, 4);
};

const makeRun = (input: {
  role: StagePlayMicroReasonerRunV1["role"];
  jobId: string;
  sourceId: string;
  mailIds: string[];
  inputRefs: string[];
  outputRefs: string[];
  inputPreview: string;
  outputPreview: string;
  now: string;
  selectedDecision?: StagePlayMicroReasonerRunV1["selectedDecision"];
  salienceLevel?: StagePlayMicroReasonerRunV1["salienceLevel"];
  voiceCandidate?: StagePlayMicroReasonerRunV1["voiceCandidate"];
  recommendedNextTool?: string | null;
  confidence?: StagePlayMicroReasonerRunV1["confidence"];
  latencyBudgetMs?: number | null;
  tokenBudget?: number | null;
  missingEvidence?: string[];
  causalTrace?: LiveSourceCausalTraceV1;
  preserveOutputPreview?: boolean;
}): StagePlayMicroReasonerRunV1 => {
  const activePrompt = getActiveStagePlayMicroReasonerPromptForRole(input.role, { sourceId: input.sourceId });
  const activePreset = getActiveStagePlayMicroReasonerPromptPresetForSource({ sourceId: input.sourceId });
  const deck = deckTraceFor({
    preset: activePreset,
    sourceId: input.sourceId,
    deckRunPlan: deckRunPlanFor({
      preset: activePreset,
      prompted: false,
    }),
  });
  return recordStagePlayMicroReasonerRun({
    artifactId: "stage_play_micro_reasoner_run",
    schemaVersion: STAGE_PLAY_MICRO_REASONER_RUN_SCHEMA,
    runId: `stage_play_micro_reasoner_run:${hashShort([
      input.role,
      input.jobId,
      input.mailIds,
      input.outputRefs,
      input.now,
    ])}`,
    promptId: activePrompt?.promptId ?? null,
    deckPresetId: deck?.presetId ?? null,
    deckPresetTitle: deck?.presetTitle ?? null,
    deckRunPlan: deck?.deckRunPlan ?? null,
    role: input.role,
    jobId: input.jobId,
    sourceId: input.sourceId,
    mailIds: input.mailIds,
    inputRefs: uniqueStrings(input.inputRefs),
    outputRefs: uniqueStrings(input.outputRefs),
    inputPreview: clipText(input.inputPreview, 320),
    outputPreview: input.preserveOutputPreview ? input.outputPreview : clipText(input.outputPreview, 320),
    status: "completed",
    reasoningMode: "micro_live_interval",
    selectedDecision: input.selectedDecision ?? null,
    salienceLevel: input.salienceLevel ?? null,
    voiceCandidate: input.voiceCandidate ?? null,
    recommendedNextTool: input.recommendedNextTool ?? null,
    confidence: input.confidence ?? null,
    latencyBudgetMs: input.latencyBudgetMs ?? 250,
    tokenBudget: input.tokenBudget ?? null,
    missingEvidence: uniqueStrings(input.missingEvidence ?? []),
    modelUsed: "deterministic",
    latencyMs: 0,
    tokenEstimateIn: input.tokenBudget ?? null,
    tokenEstimateOut: null,
    error: null,
    startedAt: input.now,
    completedAt: input.now,
    causalTrace: input.causalTrace,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    context_role: "micro_reasoner_evidence",
  });
};

export function buildStagePlayProcessedMailPacket(input: {
  jobId: string;
  sourceId: string;
  mailItems: StagePlayLiveSourceMailItemV1[];
  priorImmersionState?: StagePlayLiveSourceImmersionStateV1 | null;
  immersionState: StagePlayLiveSourceImmersionStateV1;
  predictionValidation: StagePlayLiveSourcePredictionValidationV1;
  activeProfile?: StagePlayLiveSourceInterpreterProfileV1 | null;
  causalTrace?: LiveSourceCausalTraceV1;
  now?: string;
}): {
  packet: StagePlayProcessedMailPacketV1;
  comparison: StagePlayLiveSourceInterpreterProfileComparisonV1 | null;
  microReasonerRuns: StagePlayMicroReasonerRunV1[];
  timing: StagePlayProcessedMailPacketTimingEntry[];
} {
  const now = input.now ?? new Date().toISOString();
  const timing: StagePlayProcessedMailPacketTimingEntry[] = [];
  const timed = <T>(stage: string, fn: () => T): T => {
    const start = performance.now();
    try {
      return fn();
    } finally {
      timing.push({
        stage,
        durationMs: performance.now() - start,
      });
    }
  };
  const mailIds = input.mailItems.map((item) => item.mailId);
  const sourceId = input.sourceId || input.mailItems[0]?.sourceId || "unknown_source";
  const activeMicroReasonerPromptPreset = getActiveStagePlayMicroReasonerPromptPresetForSource({ sourceId });
  const microReasonerDeck = deckTraceFor({
    preset: activeMicroReasonerPromptPreset,
    sourceId,
    deckRunPlan: deckRunPlanFor({
      preset: activeMicroReasonerPromptPreset,
      prompted: false,
    }),
  });
  const activePromptSignature = activeMicroReasonerPromptPreset
    ? [
        activeMicroReasonerPromptPreset.presetId,
        activeMicroReasonerPromptPreset.updatedAt,
        activeMicroReasonerPromptPreset.promptedRoles,
        activeMicroReasonerPromptPreset.rolePromptIds,
      ]
    : null;
  const packetId = `stage_play_processed_mail_packet:${hashShort([
    input.jobId,
    sourceId,
    mailIds,
    input.activeProfile?.profileId ?? null,
    input.activeProfile?.updatedAt ?? null,
    activePromptSignature,
  ])}`;
  const existingPacket = getStagePlayProcessedMailPacket(packetId);
  if (existingPacket) {
    return {
      packet: existingPacket,
      comparison: null,
      microReasonerRuns: existingPacket.microReasonerRunRefs
        .map((runId) => getStagePlayMicroReasonerRun(runId))
        .filter((run): run is StagePlayMicroReasonerRunV1 => Boolean(run)),
      timing: [{
        stage: "processed_packet_reused",
        durationMs: 0,
      }],
    };
  }
  const visualEvidenceRefs = uniqueStrings(input.mailItems.flatMap((item) => [
    item.sourceRefs.evidenceRef,
    item.sourceRefs.frameRef,
    ...item.evidenceRefs,
  ]));
  const delta = timed("delta_extractor", () => extractStagePlayLiveSourceDelta({
    latestMailItems: input.mailItems,
    priorImmersionState: input.priorImmersionState ?? null,
    activeProfile: input.activeProfile ?? null,
  }));
  const comparison = timed("profile_comparator", () => input.activeProfile
    ? compareMailToInterpreterProfile({
        profile: input.activeProfile,
        mailItems: input.mailItems,
        jobId: input.jobId,
        policyId: input.immersionState.policyId ?? null,
        createdAt: now,
      })
    : null);
  const structured = timed("structured_observer_parser", () => structuredObserverFactsFor({ mailItems: input.mailItems }));
  const observedFacts = timed("observed_fact_assembly", () => uniqueStrings([
    ...structured.observedFacts,
    ...input.mailItems.map((item) => `${item.mailId}: ${clipText(item.summary.text || item.summary.preview, 240)}`),
    ...input.immersionState.currentSceneFacts,
  ]));
  const inferredFacts = timed("inferred_fact_assembly", () => uniqueStrings([
    ...structured.inferredFacts,
    ...input.immersionState.changedFacts.map((fact) => `Changed: ${fact}`),
    ...input.immersionState.salience.reasons.map((reason) => `Salience: ${reason}`),
    ...(comparison?.inferredMeaning ?? []),
  ]));
  const baselineRecommendedNext = timed("baseline_decision_selector", () => recommendedNextFor({
    comparison,
    validation: input.predictionValidation,
    immersionState: input.immersionState,
    structuredRiskMatches: structured.riskMatches,
    structuredVoiceCalloutMatches: structured.voiceCalloutMatches,
  }));
  const calloutDraft = baselineRecommendedNext === "request_voice_callout"
    ? input.immersionState.salience.reasons[0] ??
      structured.voiceCalloutMatches[0] ??
      structured.riskMatches[0] ??
      comparison?.voiceCalloutMatches[0] ??
      "High-salience live-source update detected."
    : null;
  const effortEstimate = timed("effort_estimator", () => estimateEffort({
    observedFacts,
    inferredFacts,
    changedFacts: uniqueStrings([...input.immersionState.changedFacts, ...structured.changedFacts]),
    structured,
    immersionState: input.immersionState,
    priorImmersionState: input.priorImmersionState ?? null,
  }));
  const axioms = timed("axiom_extractor", () => extractAxioms({
    effort: effortEstimate,
    observedFacts,
    structured,
    immersionState: input.immersionState,
  }));
  const hypotheses = timed("hypothesis_generator", () => generateHypotheses({
    effort: effortEstimate,
    axioms,
    predictionValidation: input.predictionValidation,
    structured,
  }));
  const arbiter = timed("hypothesis_arbiter", () => arbitrateHypotheses({
    baselineRecommendedNext,
    effort: effortEstimate,
    axioms,
    hypotheses,
    validation: input.predictionValidation,
    immersionState: input.immersionState,
    calloutDraft,
    comparison,
  }));
  const recommendedNext = arbiter.recommendedNext;
  const watchNext = uniqueStrings([...delta.watchTargets, ...structured.watchNext]);
  const evidenceHandles = timed("evidence_handle_assembly", () => buildProcessedMailEvidenceHandles({
    sourceId,
    mailItems: input.mailItems,
    observedFacts,
    changedFacts: uniqueStrings([...input.immersionState.changedFacts, ...structured.changedFacts]),
    watchNext,
  }));
  const actionPredictions = timed("goal_action_prediction_assembly", () => buildGoalBasedActionPredictions({
    packetId,
    sourceId,
    mailIds,
    observedFacts,
    changedFacts: uniqueStrings([...input.immersionState.changedFacts, ...structured.changedFacts]),
    inferredFacts,
    uncertainties: uniqueStrings([...input.immersionState.uncertainties, ...structured.uncertainties]),
    visualEvidenceRefs,
    evidenceHandles,
    effortEstimate,
    hypotheses,
    recommendedNext,
    validation: input.predictionValidation,
    salienceLevel: input.immersionState.salience.level,
  }));
  const unresolvedLeads = timed("evidence_lead_extractor", () => buildEvidenceLeads({
    packetId,
    sourceId,
    actionPredictions,
    evidenceHandles,
    arbiter,
    predictionValidation: input.predictionValidation,
    uncertainties: uniqueStrings([...input.immersionState.uncertainties, ...structured.uncertainties]),
    recommendedNext,
  }));
  const microReasonerRuns = timed("micro_reasoner_run_composition", () => [
    makeRun({
      role: "claim_extractor",
      jobId: input.jobId,
      sourceId,
      mailIds,
      inputRefs: mailIds,
      outputRefs: observedFacts,
      inputPreview: input.mailItems.map((item) => item.summary.preview).join(" | "),
      outputPreview: observedFacts.slice(0, 4).join(" | "),
      now,
      causalTrace: input.causalTrace,
    }),
    makeRun({
      role: "observation_classifier",
      jobId: input.jobId,
      sourceId,
      mailIds,
      inputRefs: uniqueStrings([...observedFacts, ...inferredFacts, ...input.immersionState.stableFacts]),
      outputRefs: uniqueStrings([
        ...input.immersionState.stableFacts,
        ...input.immersionState.changedFacts,
        ...input.immersionState.uncertainties,
        ...structured.changedFacts,
        ...structured.uncertainties,
      ]),
      inputPreview: `observed ${observedFacts.length}; inferred ${inferredFacts.length}; prior stable ${input.immersionState.stableFacts.length}`,
      outputPreview: `stable ${input.immersionState.stableFacts.slice(0, 2).join(" | ") || "none"}; changed ${uniqueStrings([...input.immersionState.changedFacts, ...structured.changedFacts]).slice(0, 2).join(" | ") || "none"}`,
      now,
      causalTrace: input.causalTrace,
    }),
    makeRun({
      role: "effort_estimator",
      jobId: input.jobId,
      sourceId,
      mailIds,
      inputRefs: uniqueStrings([...observedFacts, ...inferredFacts, ...structured.changedFacts]),
      outputRefs: uniqueStrings([
        effortEstimate.currentEffort,
        ...effortEstimate.evidenceFor,
        ...effortEstimate.nextLikelyEfforts,
      ]),
      inputPreview: `observed ${observedFacts.length}; changed ${structured.changedFacts.length}; activity ${input.immersionState.currentActivity || "unknown"}`,
      outputPreview: `${effortEstimate.currentEffort}; confidence ${effortEstimate.confidence.toFixed(2)}; next ${effortEstimate.nextLikelyEfforts.slice(0, 3).join(" | ")}`,
      salienceLevel: input.immersionState.salience.level,
      confidence: effortEstimate.confidence >= 0.7 ? "high" : effortEstimate.confidence >= 0.5 ? "medium" : "low",
      latencyBudgetMs: 120,
      tokenBudget: 120,
      missingEvidence: effortEstimate.evidenceAgainst,
      now,
      causalTrace: input.causalTrace,
    }),
    makeRun({
      role: "axiom_extractor",
      jobId: input.jobId,
      sourceId,
      mailIds,
      inputRefs: uniqueStrings([effortEstimate.currentEffort, ...observedFacts, ...input.immersionState.currentSceneFacts]),
      outputRefs: uniqueStrings([...axioms.axioms, ...axioms.predictionRelevantVariables]),
      inputPreview: `${effortEstimate.currentEffort}; observed ${observedFacts.length}; profile ${input.activeProfile?.profileId ?? "none"}`,
      outputPreview: `${axioms.axioms.slice(0, 3).join(" | ") || "no strong axioms"}; missing ${axioms.missingAxioms.slice(0, 3).join(" | ") || "none"}`,
      confidence: axioms.missingAxioms.length <= 2 ? "high" : "medium",
      latencyBudgetMs: 120,
      tokenBudget: 140,
      missingEvidence: axioms.missingAxioms,
      now,
      causalTrace: input.causalTrace,
    }),
    makeRun({
      role: "delta_extractor",
      jobId: input.jobId,
      sourceId,
      mailIds,
      inputRefs: uniqueStrings([input.priorImmersionState?.immersionStateId, ...mailIds]),
      outputRefs: uniqueStrings([input.immersionState.immersionStateId, ...input.immersionState.changedFacts]),
      inputPreview: input.priorImmersionState?.immersionStateId ?? "no prior immersion state",
      outputPreview: input.immersionState.changedFacts.join(" | ") || "no changed facts",
      now,
      causalTrace: input.causalTrace,
    }),
    makeRun({
      role: "prediction_validator",
      jobId: input.jobId,
      sourceId,
      mailIds,
      inputRefs: uniqueStrings([input.priorImmersionState?.prediction?.predictionId, ...mailIds]),
      outputRefs: [input.predictionValidation.validationId],
      inputPreview: input.priorImmersionState?.prediction?.text ?? "no prior prediction",
      outputPreview: `${input.predictionValidation.result}; recommended ${input.predictionValidation.recommendedNext}`,
      now,
      causalTrace: input.causalTrace,
    }),
    makeRun({
      role: "hypothesis_generator",
      jobId: input.jobId,
      sourceId,
      mailIds,
      inputRefs: uniqueStrings([
        effortEstimate.currentEffort,
        ...axioms.axioms,
        input.predictionValidation.validationId,
        input.priorImmersionState?.prediction?.predictionId,
      ]),
      outputRefs: hypotheses.map((hypothesis) => hypothesis.label),
      inputPreview: `${effortEstimate.currentEffort}; axioms ${axioms.axioms.length}; validation ${input.predictionValidation.result}`,
      outputPreview: hypotheses.map((hypothesis) => `${hypothesis.label}:${hypothesis.confidence.toFixed(2)}`).join(" | "),
      confidence: hypotheses.length >= 2 ? "medium" : "low",
      latencyBudgetMs: 140,
      tokenBudget: 180,
      missingEvidence: hypotheses.length >= 2 ? [] : ["multiple_scene_beat_hypotheses"],
      now,
      causalTrace: input.causalTrace,
    }),
    ...(comparison ? [makeRun({
      role: "profile_comparator",
      jobId: input.jobId,
      sourceId,
      mailIds,
      inputRefs: uniqueStrings([input.activeProfile?.profileId, ...mailIds]),
      outputRefs: [comparison.comparisonId],
      inputPreview: input.activeProfile?.title ?? "active profile",
      outputPreview: `matched ${comparison.matchedCriteria.length}; voice ${comparison.voiceCalloutMatches.length}; recommended ${comparison.recommendedDecision}`,
      now,
      causalTrace: input.causalTrace,
    })] : []),
    makeRun({
      role: "salience_scorer",
      jobId: input.jobId,
      sourceId,
      mailIds,
      inputRefs: uniqueStrings([
        ...input.immersionState.changedFacts,
        ...structured.changedFacts,
        ...structured.riskMatches,
        ...structured.opportunityMatches,
        ...structured.voiceCalloutMatches,
        ...(comparison?.riskMatches ?? []),
        ...(comparison?.opportunityMatches ?? []),
        ...(comparison?.voiceCalloutMatches ?? []),
        input.predictionValidation.validationId,
      ]),
      outputRefs: uniqueStrings([
        input.immersionState.salience.level,
        ...input.immersionState.salience.reasons,
        ...structured.riskMatches,
        ...structured.voiceCalloutMatches,
        baselineRecommendedNext,
        calloutDraft,
      ]),
      inputPreview: `changed ${uniqueStrings([...input.immersionState.changedFacts, ...structured.changedFacts]).length}; risks ${uniqueStrings([...(comparison?.riskMatches ?? []), ...structured.riskMatches]).length}; validation ${input.predictionValidation.result}`,
      outputPreview: `${input.immersionState.salience.level}; voice ${input.immersionState.salience.voiceCandidate ? "candidate" : "no"}; recommended ${baselineRecommendedNext}${calloutDraft ? `; ${calloutDraft}` : ""}`,
      now,
      causalTrace: input.causalTrace,
    }),
  ]);
  const arbiterRun = makeRun({
    role: "hypothesis_arbiter",
    jobId: input.jobId,
    sourceId,
    mailIds,
    inputRefs: uniqueStrings([
      baselineRecommendedNext,
      effortEstimate.currentEffort,
      ...axioms.axioms,
      ...hypotheses.map((hypothesis) => hypothesis.label),
      input.predictionValidation.validationId,
      comparison?.comparisonId,
      ...microReasonerRuns.map((run) => run.runId),
    ]),
    outputRefs: uniqueStrings([
      arbiter.recommendedNext,
      arbiter.wakeAsk ? "wake_ask" : "local_wait",
      arbiter.selectedHypothesis,
      arbiter.voiceCandidate ? "voice_candidate" : "no_voice_candidate",
      ...arbiter.missingEvidence,
    ]),
    inputPreview: `baseline ${baselineRecommendedNext}; effort ${effortEstimate.currentEffort}; hypotheses ${hypotheses.length}; salience ${input.immersionState.salience.level}`,
    outputPreview: `${arbiter.recommendedNext}; wake ${arbiter.wakeAsk ? "yes" : "no"}; ${arbiter.reason}`,
    selectedDecision: arbiter.recommendedNext,
    salienceLevel: input.immersionState.salience.level,
    voiceCandidate: arbiter.voiceCandidate,
    recommendedNextTool: arbiter.wakeAsk ? "live_env.record_live_source_mail_decision" : null,
    confidence: arbiter.confidence,
    latencyBudgetMs: 150,
    tokenBudget: 160,
    missingEvidence: arbiter.missingEvidence,
    now,
    causalTrace: input.causalTrace,
  });
  microReasonerRuns.push(arbiterRun);
  const decisionSelectorMissingEvidence = uniqueStrings([
    ...arbiter.missingEvidence,
    visualEvidenceRefs.length === 0 ? "visual_evidence_ref" : null,
  ]);
  const decisionSelectorRun = makeRun({
    role: "decision_selector",
    jobId: input.jobId,
    sourceId,
    mailIds,
    inputRefs: uniqueStrings([
      recommendedNext,
      input.immersionState.salience.level,
      input.predictionValidation.validationId,
      comparison?.comparisonId,
      arbiterRun.runId,
      ...visualEvidenceRefs,
      ...microReasonerRuns.map((run) => run.runId),
    ]),
    outputRefs: uniqueStrings([
      recommendedNext,
      recommendedNext === "wait_for_next_summary" ? "no_operator_action_required" : "decision_receipt_required",
      recommendedNext === "request_voice_callout" ? "voice_decision_before_voice_tool" : null,
      ...decisionSelectorMissingEvidence,
    ]),
    inputPreview: `packet candidate: ${recommendedNext}; salience ${input.immersionState.salience.level}; voice ${input.immersionState.salience.voiceCandidate ? "candidate" : "no"}`,
    outputPreview: `${recommendedNext}; next tool ${recommendedNext === "wait_for_next_summary" ? "none" : "live_env.record_live_source_mail_decision"}; confidence ${
      arbiter.confidence
    }`,
    selectedDecision: recommendedNext,
    salienceLevel: input.immersionState.salience.level,
    voiceCandidate: input.immersionState.salience.voiceCandidate || recommendedNext === "request_voice_callout",
    recommendedNextTool: recommendedNext === "wait_for_next_summary"
      ? null
      : "live_env.record_live_source_mail_decision",
    confidence: decisionSelectorMissingEvidence.length > 0 ? "medium" : "high",
    latencyBudgetMs: 150,
    tokenBudget: 160,
    missingEvidence: decisionSelectorMissingEvidence,
    now,
    causalTrace: input.causalTrace,
  });
  microReasonerRuns.push(decisionSelectorRun);
  if (recommendedNext === "request_voice_callout") {
    microReasonerRuns.push(makeRun({
      role: "voice_callout_drafter",
      jobId: input.jobId,
      sourceId,
      mailIds,
      inputRefs: uniqueStrings([
        decisionSelectorRun.runId,
        ...input.immersionState.salience.reasons,
        ...structured.voiceCalloutMatches,
        ...(comparison?.voiceCalloutMatches ?? []),
      ]),
      outputRefs: uniqueStrings([
        calloutDraft,
        ...input.immersionState.salience.reasons,
        ...structured.voiceCalloutMatches,
        ...(comparison?.voiceCalloutMatches ?? []),
      ]),
      inputPreview: `voice candidate: ${input.immersionState.salience.level}; ${input.immersionState.salience.reasons.slice(0, 2).join(" | ") || "no salience reason"}`,
      outputPreview: calloutDraft ?? "voice callout draft unavailable",
      selectedDecision: recommendedNext,
      salienceLevel: input.immersionState.salience.level,
      voiceCandidate: true,
      recommendedNextTool: "live_env.request_interim_voice_callout",
      confidence: calloutDraft ? "high" : "low",
      latencyBudgetMs: 150,
      tokenBudget: 120,
      missingEvidence: calloutDraft ? [] : ["voice_callout_draft"],
      now,
      causalTrace: input.causalTrace,
    }));
  }
  const packet = timed("processed_packet_record", () => recordStagePlayProcessedMailPacket({
    artifactId: "stage_play_processed_mail_packet",
    schemaVersion: STAGE_PLAY_PROCESSED_MAIL_PACKET_SCHEMA,
    packetId,
    jobId: input.jobId,
    sourceId,
    mailIds,
    visualEvidenceRefs,
    observedFacts,
    inferredFacts,
    uncertainties: uniqueStrings([...input.immersionState.uncertainties, ...structured.uncertainties]),
    stableFactsUsed: input.immersionState.stableFacts,
    changedFacts: uniqueStrings([...input.immersionState.changedFacts, ...structured.changedFacts]),
    sceneTags: uniqueStrings([...sceneTagsFor(input.immersionState.currentSceneFacts), ...structured.sceneTags]),
    activityTags: uniqueStrings([input.immersionState.currentActivity, ...structured.activityTags]),
    objectTags: uniqueStrings([...objectTagsFor(input.mailItems, input.immersionState.currentSceneFacts), ...structured.objectTags]),
    profileRef: input.activeProfile?.profileId ?? null,
    microReasonerDeck,
    matchedCriteria: comparison?.matchedCriteria ?? [],
    suppressedCriteria: comparison?.suppressedCriteria ?? [],
    riskMatches: uniqueStrings([...(comparison?.riskMatches ?? []), ...structured.riskMatches]),
    opportunityMatches: uniqueStrings([...(comparison?.opportunityMatches ?? []), ...structured.opportunityMatches]),
    voiceCalloutMatches: uniqueStrings([...(comparison?.voiceCalloutMatches ?? []), ...structured.voiceCalloutMatches]),
    priorPredictionRef: input.priorImmersionState?.prediction?.predictionId ?? null,
    predictionValidation: {
      result: input.predictionValidation.result,
      supportedSignals: input.predictionValidation.supportedSignals,
      contradictedSignals: input.predictionValidation.contradictedSignals,
      newSignals: input.predictionValidation.newSignals,
    },
    salience: {
      level: input.immersionState.salience.level,
      reasons: input.immersionState.salience.reasons,
      voiceCandidate: input.immersionState.salience.voiceCandidate,
      calloutDraft,
    },
    evidenceHandles,
    actionPredictions,
    unresolvedLeads,
    pursuedLeads: [],
    effortEstimate,
    axioms,
    hypotheses,
    arbiter,
    recommendedNext,
    watchNext,
    resolutionState: recommendedNext === "request_voice_callout"
      ? "voice_candidate_prepared"
      : "processed_packet_ready",
    microReasonerRunRefs: microReasonerRuns.map((run) => run.runId),
    evidenceRefs: uniqueStrings([
      packetId,
      ...mailIds,
      ...visualEvidenceRefs,
      input.immersionState.immersionStateId,
      input.predictionValidation.validationId,
      comparison?.comparisonId,
      input.activeProfile?.profileId,
      microReasonerDeck?.presetId,
      ...evidenceHandles.sourceReceipts.map((receipt) => receipt.receiptId),
      ...evidenceHandles.sourceReceipts.flatMap((receipt) => receipt.evidenceRefs),
      ...evidenceHandles.frameReceipts.map((receipt) => receipt.receiptId),
      ...evidenceHandles.frameIntervals.map((interval) => interval.intervalId),
      ...evidenceHandles.situationSlices.map((slice) => slice.sliceId),
      ...actionPredictions.map((prediction) => prediction.predictionId),
      ...unresolvedLeads.map((lead) => lead.leadId),
      ...microReasonerRuns.map((run) => run.runId),
    ]),
    causalTrace: input.causalTrace,
    createdAt: now,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  }));
  const composerRun = timed("packet_composer", () => makeRun({
    role: "packet_composer",
    jobId: input.jobId,
    sourceId,
    mailIds,
    inputRefs: packet.evidenceRefs.filter((ref) => ref !== packet.packetId),
    outputRefs: [packet.packetId],
    inputPreview: microReasonerRuns.map((run) => run.outputPreview).join(" | "),
    outputPreview: microReasonerDeck?.outputPolicy === "inline_document_translation"
      ? documentInlineTranslationOutputPreview({
          sourceId,
          mailItems: input.mailItems,
          now,
          fallbackReason: "document_translation_model_output_unavailable",
        })
      : `${packet.recommendedNext}; ${packet.salience.level}; ${packet.observedFacts.slice(0, 2).join(" | ")}`,
    now,
    causalTrace: input.causalTrace,
    preserveOutputPreview: microReasonerDeck?.outputPolicy === "inline_document_translation",
  }));
  const finalPacket = timed("final_packet_record", () => recordStagePlayProcessedMailPacket({
    ...packet,
    microReasonerRunRefs: uniqueStrings([...packet.microReasonerRunRefs, composerRun.runId]),
    evidenceRefs: uniqueStrings([...packet.evidenceRefs, composerRun.runId]),
  }));
  return {
    packet: finalPacket,
    comparison,
    microReasonerRuns: [...microReasonerRuns, composerRun],
    timing,
  };
}

const mergePromptedRun = (input: {
  run: StagePlayMicroReasonerRunV1;
  output: PromptedMicroReasonerOutput;
  outputPreview: string;
  outputRefs: string[];
  selectedDecision?: StagePlayMicroReasonerRunV1["selectedDecision"] | null;
  salienceLevel?: StagePlayMicroReasonerRunV1["salienceLevel"] | null;
  voiceCandidate?: boolean | null;
  recommendedNextTool?: string | null;
  confidence?: StagePlayMicroReasonerRunV1["confidence"];
  missingEvidence?: string[];
  now: string;
}): StagePlayMicroReasonerRunV1 => {
  const updated: StagePlayMicroReasonerRunV1 = {
    ...input.run,
    outputRefs: uniqueStrings([...input.run.outputRefs, ...input.outputRefs]),
    outputPreview: input.outputPreview,
    selectedDecision: input.selectedDecision ?? input.run.selectedDecision ?? null,
    salienceLevel: input.salienceLevel ?? input.run.salienceLevel ?? null,
    voiceCandidate: input.voiceCandidate ?? input.run.voiceCandidate ?? null,
    recommendedNextTool: input.recommendedNextTool !== undefined ? input.recommendedNextTool : input.run.recommendedNextTool ?? null,
    confidence: input.confidence ?? input.run.confidence ?? null,
    missingEvidence: uniqueStrings([...(input.run.missingEvidence ?? []), ...(input.missingEvidence ?? [])]),
    modelUsed: input.output.model ?? input.run.modelUsed ?? "prompted_micro_reasoner",
    latencyMs: input.output.latencyMs ?? input.run.latencyMs ?? null,
    tokenEstimateIn: input.output.tokenEstimateIn ?? input.run.tokenEstimateIn ?? null,
    tokenEstimateOut: input.output.tokenEstimateOut ?? input.run.tokenEstimateOut ?? null,
    error: input.output.error ?? null,
    completedAt: input.now,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    context_role: "micro_reasoner_evidence",
  };
  return recordStagePlayMicroReasonerRun(updated);
};

const salienceLevelFromJson = (
  json: Record<string, unknown> | null,
  fallback: StagePlayProcessedMailPacketV1["salience"]["level"],
): StagePlayProcessedMailPacketV1["salience"]["level"] => {
  const value = readStringFromJson(json, "salienceLevel");
  return value === "low" || value === "medium" || value === "high" || value === "urgent" ? value : fallback;
};

const applyPromptedMicroReasonerOutput = (input: {
  packet: StagePlayProcessedMailPacketV1;
  role: StagePlayMicroReasonerRoleV1;
  json: Record<string, unknown> | null;
}): StagePlayProcessedMailPacketV1 => {
  const { packet, role, json } = input;
  if (!json) return packet;
  if (role === "claim_extractor") {
    const observedFacts = readStringArrayFromJson(json, "observedFacts");
    const inferredFacts = readStringArrayFromJson(json, "inferredFacts");
    const uncertainties = readStringArrayFromJson(json, "uncertainties");
    return {
      ...packet,
      observedFacts: observedFacts.length > 0 ? uniqueStrings([...observedFacts, ...packet.observedFacts]) : packet.observedFacts,
      inferredFacts: inferredFacts.length > 0 ? uniqueStrings([...inferredFacts, ...packet.inferredFacts]) : packet.inferredFacts,
      uncertainties: uncertainties.length > 0 ? uniqueStrings([...uncertainties, ...packet.uncertainties]) : packet.uncertainties,
      sceneTags: uniqueStrings([...packet.sceneTags, ...readStringArrayFromJson(json, "sceneTags")]),
      activityTags: uniqueStrings([...packet.activityTags, ...readStringArrayFromJson(json, "activityTags")]),
      objectTags: uniqueStrings([...packet.objectTags, ...readStringArrayFromJson(json, "objectTags")]),
      riskMatches: uniqueStrings([...packet.riskMatches, ...readStringArrayFromJson(json, "riskTags")]),
      opportunityMatches: uniqueStrings([...packet.opportunityMatches, ...readStringArrayFromJson(json, "opportunityTags")]),
    };
  }
  if (role === "observation_classifier") {
    return {
      ...packet,
      stableFactsUsed: uniqueStrings([...packet.stableFactsUsed, ...readStringArrayFromJson(json, "stableFactsUsed")]),
      changedFacts: uniqueStrings([...readStringArrayFromJson(json, "changedFacts"), ...packet.changedFacts]),
      uncertainties: uniqueStrings([
        ...packet.uncertainties,
        ...readStringArrayFromJson(json, "uncertainties"),
        ...readStringArrayFromJson(json, "contradictions").map((entry) => `Contradiction: ${entry}`),
      ]),
    };
  }
  if (role === "salience_scorer") {
    const recommendedNext = readStringFromJson(json, "recommendedNext");
    const calloutDraft = readStringFromJson(json, "calloutDraft");
    return {
      ...packet,
      recommendedNext: isRecommendedNext(recommendedNext) ? recommendedNext : packet.recommendedNext,
      salience: {
        level: salienceLevelFromJson(json, packet.salience.level),
        reasons: uniqueStrings([...readStringArrayFromJson(json, "reasons"), ...packet.salience.reasons]),
        voiceCandidate: readBooleanFromJson(json, "voiceCandidate") ?? packet.salience.voiceCandidate,
        calloutDraft: calloutDraft ?? packet.salience.calloutDraft ?? null,
      },
    };
  }
  if (role === "hypothesis_arbiter") {
    const recommendedNext = readStringFromJson(json, "recommendedNext");
    const next = isRecommendedNext(recommendedNext) ? recommendedNext : packet.recommendedNext;
    const currentEffort = readStringFromJson(json, "currentEffort");
    const axioms = readStringArrayFromJson(json, "axioms");
    return {
      ...packet,
      recommendedNext: next,
      effortEstimate: currentEffort
        ? {
            currentEffort,
            evidenceFor: packet.effortEstimate?.evidenceFor ?? [],
            evidenceAgainst: packet.effortEstimate?.evidenceAgainst ?? [],
            confidence: packet.effortEstimate?.confidence ?? 0.5,
            nextLikelyEfforts: packet.effortEstimate?.nextLikelyEfforts ?? [],
          }
        : packet.effortEstimate,
      axioms: axioms.length > 0
        ? {
            axioms,
            missingAxioms: packet.axioms?.missingAxioms ?? [],
            predictionRelevantVariables: packet.axioms?.predictionRelevantVariables ?? axioms,
          }
        : packet.axioms,
      arbiter: {
        recommendedNext: next,
        wakeAsk: readBooleanFromJson(json, "wakeAsk") ?? packet.arbiter?.wakeAsk ?? recommendedNextNeedsAsk(next),
        reason: readStringFromJson(json, "reason") ?? packet.arbiter?.reason ?? "Prompted micro-reasoner arbiter selected the next mail-loop action.",
        confidence: readConfidence(json.confidence) ?? packet.arbiter?.confidence ?? "medium",
        selectedHypothesis: readStringFromJson(json, "selectedHypothesis") ?? packet.arbiter?.selectedHypothesis ?? null,
        voiceCandidate: readBooleanFromJson(json, "voiceCandidate") ?? packet.arbiter?.voiceCandidate ?? false,
        calloutDraft: readStringFromJson(json, "calloutDraft") ?? packet.arbiter?.calloutDraft ?? null,
        missingEvidence: uniqueStrings(readStringArrayFromJson(json, "missingEvidence")),
      },
    };
  }
  if (role === "decision_selector") {
    const selectedDecision = readStringFromJson(json, "selectedDecision");
    const next = isRecommendedNext(selectedDecision) ? selectedDecision : packet.recommendedNext;
    return {
      ...packet,
      recommendedNext: next,
      resolutionState: next === "request_voice_callout" ? "voice_candidate_prepared" : "processed_packet_ready",
    };
  }
  return packet;
};

const outputRefsFromPromptedJson = (
  role: StagePlayMicroReasonerRoleV1,
  json: Record<string, unknown> | null,
): string[] => {
  if (!json) return [];
  if (role === "claim_extractor") {
    return uniqueStrings([
      ...readStringArrayFromJson(json, "observedFacts"),
      ...readStringArrayFromJson(json, "inferredFacts"),
      ...readStringArrayFromJson(json, "uncertainties"),
    ]).slice(0, 12);
  }
  if (role === "observation_classifier") {
    return uniqueStrings([
      ...readStringArrayFromJson(json, "stableFactsUsed"),
      ...readStringArrayFromJson(json, "changedFacts"),
      ...readStringArrayFromJson(json, "contradictions"),
      ...readStringArrayFromJson(json, "uncertainties"),
    ]).slice(0, 12);
  }
  if (role === "salience_scorer") {
    return uniqueStrings([
      readStringFromJson(json, "salienceLevel"),
      readStringFromJson(json, "recommendedNext"),
      readBooleanFromJson(json, "voiceCandidate") ? "voice_candidate" : "no_voice_candidate",
      ...readStringArrayFromJson(json, "reasons"),
    ]).slice(0, 12);
  }
  if (role === "hypothesis_arbiter") {
    return uniqueStrings([
      readStringFromJson(json, "recommendedNext"),
      readBooleanFromJson(json, "wakeAsk") ? "wake_ask" : "local_wait",
      readStringFromJson(json, "selectedHypothesis"),
      ...readStringArrayFromJson(json, "missingEvidence"),
    ]).slice(0, 12);
  }
  if (role === "decision_selector") {
    return uniqueStrings([
      readStringFromJson(json, "selectedDecision"),
      readStringFromJson(json, "recommendedNextTool"),
      ...readStringArrayFromJson(json, "missingEvidence"),
    ]).slice(0, 12);
  }
  if (
    role === "packet_composer" &&
    (Array.isArray(json.translations) || Array.isArray(json.unit_errors) || Array.isArray(json.unitErrors))
  ) {
    return uniqueStrings([
      STAGE_PLAY_DOCUMENT_INLINE_TRANSLATION_OUTPUT_SCHEMA,
      ...readDocumentTranslationItems(json).map((entry) => `translated:${entry.unit_id}`),
      ...readDocumentUnitErrors(json).map((entry) => `translation_error:${entry.unit_id}`),
    ]).slice(0, 24);
  }
  return uniqueStrings(Object.values(json).map((value) => typeof value === "string" ? value : JSON.stringify(value))).slice(0, 12);
};

export async function buildStagePlayProcessedMailPacketWithPromptedReasoners(input: {
  jobId: string;
  sourceId: string;
  mailItems: StagePlayLiveSourceMailItemV1[];
  priorImmersionState?: StagePlayLiveSourceImmersionStateV1 | null;
  immersionState: StagePlayLiveSourceImmersionStateV1;
  predictionValidation: StagePlayLiveSourcePredictionValidationV1;
  activeProfile?: StagePlayLiveSourceInterpreterProfileV1 | null;
  causalTrace?: LiveSourceCausalTraceV1;
  now?: string;
  promptedMicroReasoners?: StagePlayPromptedMicroReasonerOptions;
}): Promise<{
  packet: StagePlayProcessedMailPacketV1;
  comparison: StagePlayLiveSourceInterpreterProfileComparisonV1 | null;
  microReasonerRuns: StagePlayMicroReasonerRunV1[];
  timing: StagePlayProcessedMailPacketTimingEntry[];
}> {
  const baseline = buildStagePlayProcessedMailPacket(input);
  if (!promptedMicroReasonersEnabled(input.promptedMicroReasoners)) return baseline;

  const now = input.now ?? new Date().toISOString();
  const executor = input.promptedMicroReasoners?.executor ?? defaultPromptedMicroReasonerExecutor;
  const sourceId = input.sourceId || input.mailItems[0]?.sourceId || "unknown_source";
  const requestedRoles = promptedRolesForSource(sourceId, input.promptedMicroReasoners);
  const activeMicroReasonerPromptPreset = getActiveStagePlayMicroReasonerPromptPresetForSource({ sourceId });
  const microReasonerDeck = deckTraceFor({
    preset: activeMicroReasonerPromptPreset,
    sourceId,
    deckRunPlan: deckRunPlanFor({
      preset: activeMicroReasonerPromptPreset,
      prompted: true,
      roles: requestedRoles,
    }),
  });
  const runByRole = new Map(baseline.microReasonerRuns.map((run) => [run.role, run]));
  const promptedOutputs: Record<string, unknown> = {};
  let packet = baseline.packet;
  let runs = baseline.microReasonerRuns.slice();
  const timing = baseline.timing.slice();

  for (const role of requestedRoles) {
    const run = runByRole.get(role);
    const prompt = getActiveStagePlayMicroReasonerPromptForRole(role, { sourceId });
    if (!run || !prompt) continue;
    const startedAt = performance.now();
    let output: PromptedMicroReasonerOutput;
    try {
      output = await executor({
        role,
        promptId: prompt.promptId,
        promptTitle: prompt.title,
        promptTemplate: prompt.template,
        outputSchemaName: prompt.outputSchemaName,
        maxOutputTokens: prompt.maxOutputTokens ?? null,
        inputPreview: run.inputPreview,
        baselineOutputPreview: run.outputPreview,
        packet,
        priorOutputs: promptedOutputs,
        mailItems: input.mailItems,
      });
    } catch (error) {
      output = {
        ok: false,
        text: "",
        json: null,
        model: run.modelUsed ?? "deterministic_fallback",
        latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      timing.push({
        stage: `prompted_micro_reasoner:${role}`,
        durationMs: performance.now() - startedAt,
      });
    }
    const json = output.json ?? parseJsonObjectFromText(output.text);
    if (!output.ok || !json) {
      const failureCode = output.error ?? promptedMicroReasonerJsonFailureCode(output.text);
      const isDocumentInlineProductRun =
        role === "packet_composer" &&
        microReasonerDeck?.outputPolicy === "inline_document_translation";
      const fallbackRun = recordStagePlayMicroReasonerRun({
        ...run,
        status: "failed",
        outputPreview: isDocumentInlineProductRun
          ? documentInlineTranslationOutputPreview({
              sourceId,
              mailItems: input.mailItems,
              now,
              fallbackReason: failureCode,
            })
          : clipText(`Prompted ${role} failed: ${failureCode}`, 320),
        modelUsed: output.model ?? run.modelUsed ?? "deterministic_fallback",
        latencyMs: output.latencyMs ?? run.latencyMs ?? null,
        error: failureCode,
        completedAt: now,
      });
      runs.splice(runs.findIndex((entry) => entry.runId === run.runId), 1, fallbackRun);
      runByRole.set(role, fallbackRun);
      continue;
    }

    packet = applyPromptedMicroReasonerOutput({ packet, role, json });
    promptedOutputs[role] = json;
    const selectedDecision = role === "decision_selector" && isRecommendedNext(readStringFromJson(json, "selectedDecision"))
      ? readStringFromJson(json, "selectedDecision") as StagePlayLiveSourcePredictionValidationRecommendedNextV1
      : role === "hypothesis_arbiter" && isRecommendedNext(readStringFromJson(json, "recommendedNext"))
        ? readStringFromJson(json, "recommendedNext") as StagePlayLiveSourcePredictionValidationRecommendedNextV1
        : run.selectedDecision ?? null;
    const isDocumentInlineProductRun =
      role === "packet_composer" &&
      microReasonerDeck?.outputPolicy === "inline_document_translation";
    const updatedRun = mergePromptedRun({
      run,
      output: {
        ...output,
        json,
        model: output.model ?? prompt.modelPreference,
        latencyMs: output.latencyMs ?? Math.max(0, Math.round(performance.now() - startedAt)),
      },
      outputPreview: isDocumentInlineProductRun
        ? documentInlineTranslationOutputPreview({
            sourceId,
            mailItems: input.mailItems,
            json,
            now,
          })
        : promptedOutputPreview(role, json, run.outputPreview),
      outputRefs: outputRefsFromPromptedJson(role, json),
      selectedDecision,
      salienceLevel: role === "salience_scorer" ? salienceLevelFromJson(json, packet.salience.level) : run.salienceLevel,
      voiceCandidate: role === "salience_scorer" || role === "hypothesis_arbiter"
        ? readBooleanFromJson(json, "voiceCandidate") ?? run.voiceCandidate ?? null
        : run.voiceCandidate,
      recommendedNextTool: role === "decision_selector"
        ? readStringFromJson(json, "recommendedNextTool")
        : readStringFromJson(json, "recommendedNextTool") ?? run.recommendedNextTool ?? null,
      confidence: readConfidence(json.confidence) ?? run.confidence ?? null,
      missingEvidence: readStringArrayFromJson(json, "missingEvidence"),
      now,
    });
    runs.splice(runs.findIndex((entry) => entry.runId === run.runId), 1, updatedRun);
    runByRole.set(role, updatedRun);
  }

  const minimalPromptedArbiter = microReasonerDeck?.deckRunPlan === "minimal_prompted_arbiter";
  const requestedRoleSet = new Set<StagePlayMicroReasonerRoleV1>(requestedRoles);
  const baselineRunIds = new Set(baseline.microReasonerRuns.map((run) => run.runId));
  const explicitBaselineRoles = Array.isArray(microReasonerDeck?.baselineRoles)
    ? microReasonerDeck.baselineRoles
    : null;
  const activeDeckRoleSet = explicitBaselineRoles
    ? new Set<StagePlayMicroReasonerRoleV1>([...requestedRoles, ...explicitBaselineRoles])
    : null;
  const activeDeckRuns = runs
    .filter((run) => {
      if (minimalPromptedArbiter) return requestedRoleSet.has(run.role);
      if (activeDeckRoleSet) return activeDeckRoleSet.has(run.role);
      return true;
    })
    .map((run) => applyDeckTraceToRun(run, microReasonerDeck, requestedRoles));
  const skippedDeckRuns = minimalPromptedArbiter
    ? runs
        .filter((run) => !requestedRoleSet.has(run.role))
        .map((run) => markRunSkippedByDeckPlan({ run, deck: microReasonerDeck, now }))
    : [];
  runs = [...activeDeckRuns, ...skippedDeckRuns];
  const activeDeckRunIds = new Set(activeDeckRuns.map((run) => run.runId));
  const packetEvidenceRefs = minimalPromptedArbiter || explicitBaselineRoles
    ? packet.evidenceRefs.filter((ref) => !baselineRunIds.has(ref) || activeDeckRunIds.has(ref))
    : packet.evidenceRefs;

  const finalPacket = recordStagePlayProcessedMailPacket({
    ...packet,
    microReasonerDeck,
    microReasonerRunRefs: uniqueStrings(activeDeckRuns.map((run) => run.runId)),
    evidenceRefs: uniqueStrings([
      ...packetEvidenceRefs,
      microReasonerDeck?.presetId,
      ...activeDeckRuns.map((run) => run.runId),
      ...Object.keys(promptedOutputs).map((role) => `prompted_micro_reasoner:${role}`),
    ]),
    resolutionState: packet.recommendedNext === "request_voice_callout" ? "voice_candidate_prepared" : "processed_packet_ready",
  });

  return {
    packet: finalPacket,
    comparison: baseline.comparison,
    microReasonerRuns: runs,
    timing,
  };
}
