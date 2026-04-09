type HelixAskSurfaceRequestMetadata = {
  source_language?: string | null;
  language_detected?: string | null;
  language_confidence?: number | null;
  code_mixed?: boolean;
  pivot_confidence?: number | null;
  translated?: boolean;
  response_language?: string | null;
  lang_schema_version?: string | null;
  thread_id?: string | null;
};

type HelixAskSurfaceRequestData = {
  interpreter?: Record<string, unknown> | null;
  interpreter_schema_version?: string | null;
  interpreterStatus?: string | null;
  interpreterError?: string | null;
  sourceQuestion?: string | null;
  question?: string | null;
};

type HelixAskSurfaceRollout = {
  stage: string;
  active: boolean;
  shadow: boolean;
  canaryHit: boolean;
  activePercent: number;
  promotionFrozen: boolean;
};

type HelixAskSurfaceRuntimeState = {
  stage: string;
  killSwitch: boolean;
  consecutive15mBreaches: number;
  freezePromotionUntilMs?: number | null;
  lastRollbackReason?: string | null;
};

type HelixAskSurfaceMetrics = {
  recordHelixAskMultilangTranslation: (value: boolean) => void;
  recordHelixAskMultilangLanguageMatch: (value: boolean) => void;
  recordHelixAskMultilangFallback: (value: boolean) => void;
  recordHelixAskMultilangCanonicalTerm: (value: boolean) => void;
  observeHelixAskMultilangAddedLatency: (value: number) => void;
};

export type HelixAskSuccessSurfaceArgs = {
  payload: Record<string, unknown>;
  requestMetadata: HelixAskSurfaceRequestMetadata;
  requestData: HelixAskSurfaceRequestData;
  includeMultilangMetadata: boolean;
  dispatchState: string | null;
  multilangRollout: HelixAskSurfaceRollout;
  threadId: string;
  turnId: string;
  outputContractVersion: string;
  interpreterSchemaVersion: string;
  buildMemoryCitation: (args: {
    evidenceRefs: unknown;
    rolloutIds: string[];
  }) => unknown;
  extractResponseEvidenceRefs: (payload: Record<string, unknown>) => unknown;
  extractMemoryCitationRolloutIds: (args: {
    payload: Record<string, unknown>;
    requestMetadata: HelixAskSurfaceRequestMetadata;
    turnId: string;
  }) => string[];
  clampNumber: (value: number, min: number, max: number) => number;
  normalizeLanguageTag: (value: unknown) => string | null;
  isEnglishLikeLanguage: (value: string) => boolean;
  canonicalTermPreservationRatio: (sourceText: string, pivotText: string) => number;
  metrics: HelixAskSurfaceMetrics;
  multilangRuntimeState: HelixAskSurfaceRuntimeState;
  multilangPromotionSlo: number;
  multilangRollback15mSlo: number;
  multilangRollback24hSlo: number;
  recordMultilangObservation: (entry: {
    tsMs: number;
    translationMiss: boolean;
    languageMismatch: boolean;
    fallbackUsed: boolean;
    addedLatencyMs: number;
    canonicalTermCorruption: boolean;
  }) => void;
};

const coerceObjectRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const coerceTrimmedString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const resolveGroundedAnswerCompletionFloor = (
  payload: Record<string, unknown>,
): { text: string; source: "envelope_answer" | "envelope_sections" | "memory_citation" } | null => {
  const envelope = coerceObjectRecord(payload.envelope);
  const envelopeAnswer = coerceTrimmedString(envelope?.answer);
  if (envelopeAnswer) {
    return { text: envelopeAnswer, source: "envelope_answer" };
  }

  if (Array.isArray(envelope?.sections)) {
    const sectionBlocks: string[] = [];
    for (const entry of envelope.sections) {
      const section = coerceObjectRecord(entry);
      if (!section) continue;
      const body = coerceTrimmedString(section.body);
      if (!body) continue;
      const title = coerceTrimmedString(section.title);
      sectionBlocks.push(title ? `${title}\n${body}` : body);
      if (sectionBlocks.length >= 3) break;
    }
    if (sectionBlocks.length > 0) {
      return {
        text: sectionBlocks.join("\n\n").slice(0, 1600).trim(),
        source: "envelope_sections",
      };
    }
  }

  const memoryCitation = coerceObjectRecord(payload.memory_citation);
  if (Array.isArray(memoryCitation?.entries)) {
    const citedPaths = Array.from(
      new Set(
        memoryCitation.entries
          .map((entry) => coerceTrimmedString(coerceObjectRecord(entry)?.path))
          .filter(Boolean),
      ),
    ).slice(0, 3);
    if (citedPaths.length > 0) {
      return {
        text: `Sources: ${citedPaths.join(", ")}`,
        source: "memory_citation",
      };
    }
  }

  return null;
};

export const applyHelixAskSuccessSurface = (
  args: HelixAskSuccessSurfaceArgs,
): Record<string, unknown> => {
  const typedPayload = args.payload;
  if (typedPayload.memory_citation === undefined) {
    const memoryCitation = args.buildMemoryCitation({
      evidenceRefs: args.extractResponseEvidenceRefs(typedPayload),
      rolloutIds: args.extractMemoryCitationRolloutIds({
        payload: typedPayload,
        requestMetadata: args.requestMetadata,
        turnId: args.turnId,
      }),
    });
    if (memoryCitation) {
      typedPayload.memory_citation = memoryCitation;
    }
  }
  if (typeof typedPayload.report_mode !== "boolean") {
    typedPayload.report_mode = false;
  }

  const existingVisibleText = coerceTrimmedString(
    typedPayload.text ?? typedPayload.answer ?? typedPayload.message,
  );
  if (!existingVisibleText && typedPayload.report_mode !== true && typedPayload.dry_run !== true) {
    const completionFloor = resolveGroundedAnswerCompletionFloor(typedPayload);
    if (completionFloor) {
      typedPayload.text = completionFloor.text;
      if (!coerceTrimmedString(typedPayload.answer)) {
        typedPayload.answer = completionFloor.text;
      }
      const typedEnvelope = coerceObjectRecord(typedPayload.envelope);
      if (typedEnvelope && !coerceTrimmedString(typedEnvelope.answer)) {
        typedEnvelope.answer = completionFloor.text;
      }
      const typedDebug = coerceObjectRecord(typedPayload.debug);
      if (typedDebug) {
        typedDebug.answer_completion_floor_applied = true;
        typedDebug.answer_completion_floor_source = completionFloor.source;
      }
    }
  }

  if (args.includeMultilangMetadata) {
    if (typedPayload.source_language === undefined && args.requestMetadata.source_language) {
      typedPayload.source_language = args.requestMetadata.source_language;
    }
    if (typedPayload.language_detected === undefined && args.requestMetadata.language_detected) {
      typedPayload.language_detected = args.requestMetadata.language_detected;
    }
    if (
      typedPayload.language_confidence === undefined &&
      typeof args.requestMetadata.language_confidence === "number"
    ) {
      typedPayload.language_confidence = args.requestMetadata.language_confidence;
    }
    if (
      typedPayload.code_mixed === undefined &&
      typeof args.requestMetadata.code_mixed === "boolean"
    ) {
      typedPayload.code_mixed = args.requestMetadata.code_mixed;
    }
    if (
      typedPayload.pivot_confidence === undefined &&
      typeof args.requestMetadata.pivot_confidence === "number"
    ) {
      typedPayload.pivot_confidence = args.requestMetadata.pivot_confidence;
    }
    if (
      typedPayload.interpreter_schema_version === undefined &&
      args.requestData.interpreter
    ) {
      typedPayload.interpreter_schema_version =
        args.requestData.interpreter_schema_version ?? args.interpreterSchemaVersion;
    }
    if (typedPayload.interpreter_status === undefined) {
      typedPayload.interpreter_status = args.requestData.interpreterStatus ?? null;
    }
    const requestInterpreter = coerceObjectRecord(args.requestData.interpreter);
    const selectedPivot = coerceObjectRecord(requestInterpreter?.selected_pivot);
    if (typedPayload.interpreter_confidence === undefined && selectedPivot) {
      const confidence = Number(selectedPivot.confidence);
      typedPayload.interpreter_confidence = Number.isFinite(confidence)
        ? args.clampNumber(confidence, 0, 1)
        : null;
    }
    if (typedPayload.interpreter_dispatch_state === undefined && requestInterpreter) {
      typedPayload.interpreter_dispatch_state =
        args.requestData.interpreterStatus === "ok"
          ? (requestInterpreter.dispatch_state as string | null | undefined) ?? null
          : null;
    }
    if (typedPayload.interpreter_confirm_prompt === undefined && requestInterpreter) {
      typedPayload.interpreter_confirm_prompt =
        (requestInterpreter.confirm_prompt as string | null | undefined) ?? null;
    }
    if (typedPayload.interpreter_term_ids === undefined && requestInterpreter) {
      typedPayload.interpreter_term_ids = Array.isArray(requestInterpreter.term_ids)
        ? requestInterpreter.term_ids
        : [];
    }
    if (typedPayload.interpreter_concept_ids === undefined && requestInterpreter) {
      typedPayload.interpreter_concept_ids = Array.isArray(requestInterpreter.concept_ids)
        ? requestInterpreter.concept_ids
        : [];
    }
    if (
      typedPayload.interpreter_error === undefined &&
      args.requestData.interpreterError
    ) {
      typedPayload.interpreter_error = args.requestData.interpreterError;
    }
    if (
      typedPayload.translated === undefined &&
      typeof args.requestMetadata.translated === "boolean"
    ) {
      typedPayload.translated = args.requestMetadata.translated;
    }
    if (
      typedPayload.response_language === undefined &&
      args.requestMetadata.response_language
    ) {
      typedPayload.response_language = args.requestMetadata.response_language;
    }
    if (typedPayload.dispatch_state === undefined) {
      typedPayload.dispatch_state = args.dispatchState;
    }
    if (
      typedPayload.lang_schema_version === undefined &&
      args.requestMetadata.lang_schema_version
    ) {
      typedPayload.lang_schema_version = args.requestMetadata.lang_schema_version;
    }
    if (
      (args.requestMetadata.lang_schema_version ||
        args.requestMetadata.source_language ||
        args.requestMetadata.language_detected) &&
      typedPayload.request_metadata === undefined
    ) {
      typedPayload.request_metadata = args.requestMetadata;
    }
    const requestMetadataRecord = coerceObjectRecord(typedPayload.request_metadata);
    if (requestMetadataRecord && requestMetadataRecord.thread_id === undefined) {
      requestMetadataRecord.thread_id = args.threadId;
    }
    if (
      (args.requestMetadata.lang_schema_version ||
        args.requestMetadata.source_language ||
        args.requestMetadata.language_detected) &&
      typedPayload.contract_version === undefined
    ) {
      typedPayload.contract_version = args.outputContractVersion;
    }
  }

  const typedDebug = coerceObjectRecord(typedPayload.debug);
  if (typedDebug && args.includeMultilangMetadata) {
    typedDebug.multilang_rollout_stage = args.multilangRollout.stage;
    typedDebug.multilang_rollout_active = args.multilangRollout.active;
    typedDebug.multilang_rollout_shadow = args.multilangRollout.shadow;
    typedDebug.multilang_rollout_canary_hit = args.multilangRollout.canaryHit;
    typedDebug.multilang_active_percent = args.multilangRollout.activePercent;
    typedDebug.multilang_promotion_frozen = args.multilangRollout.promotionFrozen;
    typedDebug.multilang_dispatch_state = args.dispatchState;
    typedDebug.interpreter_status = args.requestData.interpreterStatus ?? null;
    typedDebug.interpreter_error = args.requestData.interpreterError ?? null;
    const requestInterpreter = coerceObjectRecord(args.requestData.interpreter);
    typedDebug.interpreter_dispatch_state =
      args.requestData.interpreterStatus === "ok"
        ? (requestInterpreter?.dispatch_state as string | null | undefined) ?? null
        : null;
    const ambiguity = coerceObjectRecord(requestInterpreter?.ambiguity);
    typedDebug.interpreter_top2_gap =
      typeof ambiguity?.top2_gap === "number" ? ambiguity.top2_gap : null;
  }

  if (args.includeMultilangMetadata && args.multilangRollout.stage !== "off") {
    const sourceLanguage = args.requestMetadata.source_language;
    const translated = typedPayload.translated === true;
    const translationExpected = Boolean(
      sourceLanguage && !args.isEnglishLikeLanguage(sourceLanguage),
    );
    const translationMiss = translationExpected && !translated;
    const expectedResponseLanguage = args.requestMetadata.response_language ?? "en";
    const actualResponseLanguageRaw =
      typeof typedPayload.response_language === "string"
        ? typedPayload.response_language
        : null;
    const actualResponseLanguage =
      args.normalizeLanguageTag(actualResponseLanguageRaw) ?? expectedResponseLanguage;
    const languageMismatch = actualResponseLanguage !== expectedResponseLanguage;
    const fallbackUsed = Boolean(
      typeof typedPayload.fallback === "string" && typedPayload.fallback.trim().length > 0,
    );
    const sourceQuestion =
      typeof args.requestData.sourceQuestion === "string" ? args.requestData.sourceQuestion : "";
    const pivotQuestion =
      typeof args.requestData.question === "string" ? args.requestData.question : "";
    const canonicalRatio = args.canonicalTermPreservationRatio(
      sourceQuestion,
      pivotQuestion,
    );
    const canonicalCorrupted = canonicalRatio < 0.995;
    const addedLatencyMsRaw = Number(
      (typedPayload as { multilang_added_latency_ms?: unknown }).multilang_added_latency_ms,
    );
    const addedLatencyMs = Number.isFinite(addedLatencyMsRaw)
      ? Math.max(0, addedLatencyMsRaw)
      : 0;

    args.metrics.recordHelixAskMultilangTranslation(translationMiss);
    args.metrics.recordHelixAskMultilangLanguageMatch(languageMismatch);
    args.metrics.recordHelixAskMultilangFallback(fallbackUsed);
    args.metrics.recordHelixAskMultilangCanonicalTerm(canonicalCorrupted);
    args.metrics.observeHelixAskMultilangAddedLatency(addedLatencyMs);
    args.recordMultilangObservation({
      tsMs: Date.now(),
      translationMiss,
      languageMismatch,
      fallbackUsed,
      addedLatencyMs,
      canonicalTermCorruption: canonicalCorrupted,
    });

    if (typedDebug) {
      typedDebug.multilang_translation_miss = translationMiss;
      typedDebug.multilang_language_mismatch = languageMismatch;
      typedDebug.multilang_fallback_used = fallbackUsed;
      typedDebug.multilang_canonical_term_preservation = Number(
        canonicalRatio.toFixed(4),
      );
      typedDebug.multilang_stage_runtime = {
        stage: args.multilangRuntimeState.stage,
        kill_switch: args.multilangRuntimeState.killSwitch,
        consecutive_15m_breaches: args.multilangRuntimeState.consecutive15mBreaches,
        freeze_promotion_until: args.multilangRuntimeState.freezePromotionUntilMs
          ? new Date(args.multilangRuntimeState.freezePromotionUntilMs).toISOString()
          : null,
        last_rollback_reason: args.multilangRuntimeState.lastRollbackReason ?? null,
      };
      typedDebug.multilang_slo = {
        promotion: args.multilangPromotionSlo,
        rollback_15m: args.multilangRollback15mSlo,
        rollback_24h: args.multilangRollback24hSlo,
      };
    }
  }

  if (typedDebug && typeof typedDebug.report_mode !== "boolean") {
    typedDebug.report_mode = Boolean(typedPayload.report_mode);
  }

  return typedPayload;
};
