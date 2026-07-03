type RecordLike = Record<string, unknown>;

type DocumentTranslationUnitLike = {
  unit_id: string;
  translatable?: boolean;
};

export type HelixLiveTranslationUiProjectionStatus =
  | "projected"
  | "stale"
  | "failed"
  | "cancelled";

export type HelixLiveTranslationTerminalAuthorityStatus =
  | "not_terminal_authority"
  | "pending_helix_terminal_authority";

export type HelixLiveTranslationUiProjection = {
  key: string;
  status: HelixLiveTranslationUiProjectionStatus;
  projectionTarget: string;
  sourceId: string;
  sourceHash?: string;
  sourceKind: string | null;
  accountLocale: string | null;
  chunkId: string;
  chunkIndex: number | null;
  dedupeKey: string | null;
  sourceEventId: string | null;
  targetLanguage: string;
  translatedText: string | null;
  observationRef: string | null;
  receiptRef: string | null;
  laneSessionId: string | null;
  selectedBackendProvider: string | null;
  observedAtMs: number | null;
  sourceEventMs: number | null;
  freshnessStatus: string;
  terminalAuthorityStatus: HelixLiveTranslationTerminalAuthorityStatus;
  stale: boolean;
  cancelRequested: boolean;
  terminalEligible: false;
  assistantAnswer: false;
  rawContentIncluded: false;
};

export type HelixLiveTranslationUiProjectionTrafficSummary = {
  sourceId: string;
  sourceHash?: string;
  sourceKind: string | null;
  accountLocale: string | null;
  projectionTarget: string;
  targetLanguage: string;
  chunkCount: number;
  projectedCount: number;
  staleCount: number;
  cancelledCount: number;
  failedCount: number;
  latestChunkId: string | null;
  latestChunkIndex: number | null;
  latestObservedAtMs: number | null;
  latestSourceEventMs: number | null;
  latestFreshnessStatus: string;
  latestTerminalAuthorityStatus: HelixLiveTranslationTerminalAuthorityStatus;
  latestObservationRef: string | null;
  latestReceiptRef: string | null;
  latestLaneSessionId: string | null;
  selectedBackendProvider: string | null;
  terminalEligible: false;
  assistantAnswer: false;
  rawContentIncluded: false;
};

export type HelixLiveTranslationUiProjectionSelectionStatus =
  | HelixLiveTranslationUiProjectionStatus
  | "missing";

export type HelixLiveTranslationUiProjectionSelection = {
  status: HelixLiveTranslationUiProjectionSelectionStatus;
  reason: string;
  projection: HelixLiveTranslationUiProjection | null;
  displayText: string | null;
  sourceId: string;
  sourceKind: string | null;
  accountLocale: string | null;
  projectionTarget: string | null;
  targetLanguage: string | null;
  observationRef: string | null;
  receiptRef: string | null;
  laneSessionId: string | null;
  selectedBackendProvider: string | null;
  terminalAuthorityStatus: HelixLiveTranslationTerminalAuthorityStatus;
  terminalEligible: false;
  assistantAnswer: false;
  rawContentIncluded: false;
};

export type SelectHelixLiveTranslationUiProjectionInput = {
  projections: HelixLiveTranslationUiProjection[];
  sourceId: string;
  sourceHash?: string | null;
  projectionTarget?: string | null;
  targetLanguage?: string | null;
  chunkId?: string | null;
  dedupeKey?: string | null;
  allowStaleDisplayText?: boolean;
};

export type HelixLiveTranslationInlineUnitState = {
  status: "ready" | "error";
  text?: string;
  error?: string;
  observationRef: string | null;
  receiptRef: string | null;
  laneSessionId: string | null;
  selectedBackendProvider: string | null;
  terminalAuthorityStatus: HelixLiveTranslationTerminalAuthorityStatus;
  projectionStatus: HelixLiveTranslationUiProjectionSelectionStatus;
  chunkId: string | null;
  chunkIndex: number | null;
  dedupeKey: string | null;
  sourceEventId: string | null;
  sourceEventMs: number | null;
  observedAtMs: number | null;
  freshnessStatus: string;
  sourceId: string | null;
  sourceHash?: string | null;
  sourceKind: string | null;
  accountLocale: string | null;
  projectionTarget: string | null;
  targetLanguage: string | null;
  cancelRequested: boolean;
  terminalEligible: false;
  assistantAnswer: false;
  rawContentIncluded: false;
};

export type BuildHelixLiveTranslationInlineUnitStateInput = {
  projections: HelixLiveTranslationUiProjection[];
  units: DocumentTranslationUnitLike[];
  sourceId: string;
  sourceHash?: string | null;
  projectionTarget: string;
  targetLanguage: string;
  allowStaleDisplayText?: boolean;
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const normalizeKeyText = (value: unknown): string =>
  readString(value).toLowerCase();

const localeMatches = (candidate: string | null, locale: string | null): boolean => {
  const normalizedCandidate = normalizeKeyText(candidate);
  const normalizedLocale = normalizeKeyText(locale);
  return !normalizedCandidate ||
    !normalizedLocale ||
    normalizedCandidate === normalizedLocale ||
    normalizedCandidate.startsWith(`${normalizedLocale}-`) ||
    normalizedLocale.startsWith(`${normalizedCandidate}-`);
};

const readNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
};

const readBoolean = (value: unknown): boolean =>
  value === true;

const readTerminalAuthorityStatus = (
  value: unknown,
): HelixLiveTranslationTerminalAuthorityStatus =>
  readString(value) === "pending_helix_terminal_authority"
    ? "pending_helix_terminal_authority"
    : "not_terminal_authority";

const projectionSourceHashMatches = (
  projection: HelixLiveTranslationUiProjection,
  sourceHash: string | null,
): boolean =>
  !sourceHash ? true : projection.sourceHash === sourceHash;

const sortLatestProjectionFirst = (
  left: HelixLiveTranslationUiProjection,
  right: HelixLiveTranslationUiProjection,
): number => {
  const observedDelta = (right.observedAtMs ?? Number.MIN_SAFE_INTEGER) -
    (left.observedAtMs ?? Number.MIN_SAFE_INTEGER);
  if (observedDelta !== 0) return observedDelta;
  const sourceDelta = (right.sourceEventMs ?? Number.MIN_SAFE_INTEGER) -
    (left.sourceEventMs ?? Number.MIN_SAFE_INTEGER);
  if (sourceDelta !== 0) return sourceDelta;
  const indexDelta = (right.chunkIndex ?? Number.MIN_SAFE_INTEGER) -
    (left.chunkIndex ?? Number.MIN_SAFE_INTEGER);
  if (indexDelta !== 0) return indexDelta;
  return right.chunkId.localeCompare(left.chunkId);
};

const readArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  const record = readRecord(value);
  return Array.isArray(record?.sample) ? record.sample : [];
};

const readDebug = (payload: RecordLike): RecordLike | null =>
  readRecord(payload.debug);

const readProjectionReceipt = (value: unknown): RecordLike | null => {
  const record = readRecord(value);
  if (!record) return null;
  const schema = readString(record.schema);
  const laneId = readString(record.lane_id);
  const capability = readString(record.capability ?? record.capability_key);
  if (
    schema !== "helix.live_translation.projection_receipt.v1" &&
    laneId !== "live_translation" &&
    capability !== "live_translation.translate_text"
  ) {
    return null;
  }
  return record;
};

const readReceiptsFromPackets = (packets: unknown[]): RecordLike[] =>
  packets
    .map((entry) => readRecord(entry))
    .map((packet) => readProjectionReceipt(readRecord(packet?.state_delta)?.live_translation_projection_receipt))
    .filter((entry): entry is RecordLike => Boolean(entry));

const readReceiptsFromCallResults = (results: unknown[]): RecordLike[] =>
  results
    .map((entry) => readRecord(entry))
    .flatMap((result) => {
      const packetReceipt = readProjectionReceipt(
        readRecord(readRecord(result?.observation_packet)?.state_delta)?.live_translation_projection_receipt,
      );
      const observation = readRecord(result?.observation);
      if (packetReceipt) return [packetReceipt];
      if (!observation || readString(observation.capability) !== "live_translation.translate_text") return [];
      return [{
        schema: "helix.live_translation.projection_receipt.v1",
        receipt_ref: null,
        observation_ref: observation.observation_ref,
        lane_session_id: observation.lane_session_id,
        selected_backend_provider: observation.selected_backend_provider,
        lane_id: "live_translation",
        capability: "live_translation.translate_text",
        projection_target: observation.projection_target,
        projection_status: observation.freshness_status === "stale" ? "stale" : "projected",
        source_id: observation.source_id,
        source_hash: observation.source_hash,
        source_kind: observation.source_kind,
        account_locale: observation.account_locale,
        chunk_id: observation.chunk_id,
        chunk_index: observation.chunk_index,
        dedupe_key: observation.dedupe_key,
        source_event_id: observation.source_event_id,
        source_event_ms: observation.source_event_ms,
        observed_at_ms: observation.observed_at_ms,
        freshness_status: observation.freshness_status,
        target_language: observation.target_language,
        source_text_hash: observation.source_text_hash ?? null,
        source_text_char_count: observation.source_text_char_count ?? null,
        translated_text: observation.translated_text,
        stale: observation.freshness_status === "stale",
        cancel_requested: false,
        terminal_authority_status: readTerminalAuthorityStatus(observation.terminal_authority_status),
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }];
    })
    .filter((entry): entry is RecordLike => Boolean(entry));

const normalizeProjection = (receipt: RecordLike): HelixLiveTranslationUiProjection | null => {
  const payload = readRecord(receipt.payload);
  const projectionTarget = readString(receipt.projection_target) || readString(payload?.projection_target) || "unknown";
  const sourceId = readString(receipt.source_id) || readString(payload?.source_id) || "unknown_source";
  const sourceHash =
    readString(receipt.source_hash) ||
    readString(receipt.sourceHash) ||
    readString(payload?.source_hash) ||
    readString(payload?.sourceHash) ||
    null;
  const chunkId =
    readString(receipt.chunk_id) ||
    readString(payload?.chunk_id) ||
    readString(receipt.observation_ref) ||
    "unknown_chunk";
  const targetLanguage = readString(receipt.target_language) || readString(payload?.target_language);
  const rawStatus = (
    readString(receipt.projection_status) ||
    readString(payload?.projection_status) ||
    readString(receipt.status)
  ).toLowerCase();
  const status: HelixLiveTranslationUiProjectionStatus =
    rawStatus === "cancelled" || readBoolean(receipt.cancel_requested) || readBoolean(payload?.cancel_requested)
      ? "cancelled"
      : rawStatus === "failed"
        ? "failed"
        : rawStatus === "stale" || readBoolean(receipt.stale) || readBoolean(payload?.stale)
          ? "stale"
          : "projected";
  const translatedText = status === "cancelled" || status === "failed"
    ? null
    : readString(receipt.translated_text) || readString(payload?.translated_text) || null;
  return {
    key: [
      projectionTarget,
      sourceId,
      sourceHash,
      chunkId,
      targetLanguage,
      readString(receipt.dedupe_key) || readString(payload?.dedupe_key),
      readString(receipt.source_event_id) || readString(payload?.source_event_id),
    ].filter(Boolean).join("|"),
    status,
    projectionTarget,
    sourceId,
    ...(sourceHash ? { sourceHash } : {}),
    sourceKind: readString(receipt.source_kind) || readString(payload?.source_kind) || null,
    accountLocale: readString(receipt.account_locale) || readString(payload?.account_locale) || null,
    chunkId,
    chunkIndex: readNumber(receipt.chunk_index) ?? readNumber(payload?.chunk_index),
    dedupeKey: readString(receipt.dedupe_key) || readString(payload?.dedupe_key) || null,
    sourceEventId: readString(receipt.source_event_id) || readString(payload?.source_event_id) || null,
    targetLanguage,
    translatedText,
    observationRef: readString(receipt.observation_ref) || null,
    receiptRef: readString(receipt.receipt_ref) || null,
    laneSessionId: readString(receipt.lane_session_id) || readString(payload?.lane_session_id) || null,
    selectedBackendProvider:
      readString(receipt.selected_backend_provider) || readString(payload?.selected_backend_provider) || null,
    observedAtMs: readNumber(receipt.observed_at_ms) ?? readNumber(payload?.observed_at_ms),
    sourceEventMs: readNumber(receipt.source_event_ms) ?? readNumber(payload?.source_event_ms),
    freshnessStatus: readString(receipt.freshness_status) || readString(payload?.freshness_status) || "unknown",
    terminalAuthorityStatus: readTerminalAuthorityStatus(
      receipt.terminal_authority_status ?? payload?.terminal_authority_status,
    ),
    stale: status === "stale",
    cancelRequested: status === "cancelled",
    terminalEligible: false,
    assistantAnswer: false,
    rawContentIncluded: false,
  };
};

export function buildHelixLiveTranslationUiProjections(payload: unknown): HelixLiveTranslationUiProjection[] {
  const record = readRecord(payload);
  if (!record) return [];
  const debug = readDebug(record);
  const receipts = [
    ...readArray(record.capability_lane_projection_receipts),
    ...readArray(debug?.capability_lane_projection_receipts),
    ...readReceiptsFromPackets([
      ...readArray(record.capability_lane_observation_packets),
      ...readArray(debug?.capability_lane_observation_packets),
    ]),
    ...readReceiptsFromCallResults([
      ...readArray(record.capability_lane_call_results),
      ...readArray(debug?.capability_lane_call_results),
    ]),
  ];
  const byKey = new Map<string, HelixLiveTranslationUiProjection>();
  for (const receipt of receipts) {
    const projection = normalizeProjection(receipt);
    if (!projection) continue;
    const previous = byKey.get(projection.key);
    const previousObserved = previous?.observedAtMs ?? -1;
    const nextObserved = projection.observedAtMs ?? -1;
    if (!previous || nextObserved >= previousObserved) {
      byKey.set(projection.key, projection);
    }
  }
  return Array.from(byKey.values()).sort((left, right) => {
    const sourceDelta = left.sourceId.localeCompare(right.sourceId);
    if (sourceDelta !== 0) return sourceDelta;
    const leftIndex = left.chunkIndex ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = right.chunkIndex ?? Number.MAX_SAFE_INTEGER;
    if (leftIndex !== rightIndex) return leftIndex - rightIndex;
    return left.chunkId.localeCompare(right.chunkId);
  });
}

export function summarizeHelixLiveTranslationUiProjectionTraffic(
  projections: HelixLiveTranslationUiProjection[],
): HelixLiveTranslationUiProjectionTrafficSummary[] {
  const bySource = new Map<string, HelixLiveTranslationUiProjection[]>();
  for (const projection of projections) {
    const key = [
      projection.sourceId,
      projection.sourceHash ?? "",
      projection.projectionTarget,
      projection.targetLanguage,
    ].join("|");
    bySource.set(key, [...(bySource.get(key) ?? []), projection]);
  }

  return Array.from(bySource.values()).map((sourceProjections) => {
    const ordered = [...sourceProjections].sort((left, right) => {
      const leftObserved = left.observedAtMs ?? Number.MIN_SAFE_INTEGER;
      const rightObserved = right.observedAtMs ?? Number.MIN_SAFE_INTEGER;
      if (leftObserved !== rightObserved) return leftObserved - rightObserved;
      const leftIndex = left.chunkIndex ?? Number.MIN_SAFE_INTEGER;
      const rightIndex = right.chunkIndex ?? Number.MIN_SAFE_INTEGER;
      if (leftIndex !== rightIndex) return leftIndex - rightIndex;
      return left.chunkId.localeCompare(right.chunkId);
    });
    const latest = ordered.at(-1);
    return {
      sourceId: latest?.sourceId ?? "unknown_source",
      ...(latest?.sourceHash ? { sourceHash: latest.sourceHash } : {}),
      sourceKind: latest?.sourceKind ?? null,
      accountLocale: latest?.accountLocale ?? null,
      projectionTarget: latest?.projectionTarget ?? "unknown",
      targetLanguage: latest?.targetLanguage ?? "",
      chunkCount: ordered.length,
      projectedCount: ordered.filter((entry) => entry.status === "projected").length,
      staleCount: ordered.filter((entry) => entry.status === "stale").length,
      cancelledCount: ordered.filter((entry) => entry.status === "cancelled").length,
      failedCount: ordered.filter((entry) => entry.status === "failed").length,
      latestChunkId: latest?.chunkId ?? null,
      latestChunkIndex: latest?.chunkIndex ?? null,
      latestObservedAtMs: latest?.observedAtMs ?? null,
      latestSourceEventMs: latest?.sourceEventMs ?? null,
      latestFreshnessStatus: latest?.freshnessStatus ?? "unknown",
      latestTerminalAuthorityStatus: latest?.terminalAuthorityStatus ?? "not_terminal_authority",
      latestObservationRef: latest?.observationRef ?? null,
      latestReceiptRef: latest?.receiptRef ?? null,
      latestLaneSessionId: latest?.laneSessionId ?? null,
      selectedBackendProvider: latest?.selectedBackendProvider ?? null,
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    };
  }).sort((left, right) => {
    const sourceDelta = left.sourceId.localeCompare(right.sourceId);
    if (sourceDelta !== 0) return sourceDelta;
    const hashDelta = (left.sourceHash ?? "").localeCompare(right.sourceHash ?? "");
    if (hashDelta !== 0) return hashDelta;
    const targetDelta = left.projectionTarget.localeCompare(right.projectionTarget);
    if (targetDelta !== 0) return targetDelta;
    return left.targetLanguage.localeCompare(right.targetLanguage);
  });
}

export function selectHelixLiveTranslationUiProjection(
  input: SelectHelixLiveTranslationUiProjectionInput,
): HelixLiveTranslationUiProjectionSelection {
  const sourceId = readString(input.sourceId);
  const sourceHash = readString(input.sourceHash) || null;
  const projectionTarget = readString(input.projectionTarget) || null;
  const targetLanguage = normalizeKeyText(input.targetLanguage) || null;
  const chunkId = readString(input.chunkId) || null;
  const dedupeKey = readString(input.dedupeKey) || null;

  const candidates = input.projections
    .filter((projection) => projection.sourceId === sourceId)
    .filter((projection) => projectionSourceHashMatches(projection, sourceHash))
    .filter((projection) => !projectionTarget || projection.projectionTarget === projectionTarget)
    .filter((projection) => !targetLanguage || localeMatches(projection.targetLanguage, targetLanguage))
    .filter((projection) => !chunkId || projection.chunkId === chunkId)
    .filter((projection) => !dedupeKey || projection.dedupeKey === dedupeKey)
    .sort(sortLatestProjectionFirst);

  const projection = candidates[0] ?? null;
  if (!projection) {
    return {
      status: "missing",
      reason: "translation_projection_missing",
      projection: null,
      displayText: null,
      sourceId,
      sourceKind: null,
      accountLocale: null,
      projectionTarget,
      targetLanguage,
      observationRef: null,
      receiptRef: null,
      laneSessionId: null,
      selectedBackendProvider: null,
      terminalAuthorityStatus: "not_terminal_authority",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    };
  }

  const canDisplay =
    projection.status === "projected" ||
    (projection.status === "stale" && input.allowStaleDisplayText === true);

  return {
    status: projection.status,
    reason: canDisplay
      ? "translation_projection_selected"
      : `translation_projection_${projection.status}`,
    projection,
    displayText: canDisplay ? projection.translatedText : null,
    sourceId: projection.sourceId,
    sourceKind: projection.sourceKind,
    accountLocale: projection.accountLocale,
    projectionTarget: projection.projectionTarget,
    targetLanguage: projection.targetLanguage,
    observationRef: projection.observationRef,
    receiptRef: projection.receiptRef,
    laneSessionId: projection.laneSessionId,
    selectedBackendProvider: projection.selectedBackendProvider,
    terminalAuthorityStatus: projection.terminalAuthorityStatus,
    terminalEligible: false,
    assistantAnswer: false,
    rawContentIncluded: false,
  };
}

function buildHelixLiveTranslationUiProjectionSelectionFromProjection(
  projection: HelixLiveTranslationUiProjection,
  allowStaleDisplayText: boolean | undefined,
): HelixLiveTranslationUiProjectionSelection {
  const canDisplay =
    projection.status === "projected" ||
    (projection.status === "stale" && allowStaleDisplayText === true);
  return {
    status: projection.status,
    reason: canDisplay
      ? "translation_projection_selected"
      : `translation_projection_${projection.status}`,
    projection,
    displayText: canDisplay ? projection.translatedText : null,
    sourceId: projection.sourceId,
    sourceKind: projection.sourceKind,
    accountLocale: projection.accountLocale,
    projectionTarget: projection.projectionTarget,
    targetLanguage: projection.targetLanguage,
    observationRef: projection.observationRef,
    receiptRef: projection.receiptRef,
    laneSessionId: projection.laneSessionId,
    selectedBackendProvider: projection.selectedBackendProvider,
    terminalAuthorityStatus: projection.terminalAuthorityStatus,
    terminalEligible: false,
    assistantAnswer: false,
    rawContentIncluded: false,
  };
}

export function buildHelixLiveTranslationInlineUnitStates(
  input: BuildHelixLiveTranslationInlineUnitStateInput,
): Record<string, HelixLiveTranslationInlineUnitState> {
  const next: Record<string, HelixLiveTranslationInlineUnitState> = {};
  for (const unit of input.units) {
    const unitId = readString(unit.unit_id);
    if (!unitId || unit.translatable === false) continue;
    const selection =
      selectHelixLiveTranslationUiProjection({
        projections: input.projections,
        sourceId: input.sourceId,
        sourceHash: input.sourceHash,
        projectionTarget: input.projectionTarget,
        targetLanguage: input.targetLanguage,
        chunkId: unitId,
        allowStaleDisplayText: input.allowStaleDisplayText,
      });
    const fallbackByDedupe = selection.status === "missing"
      ? selectHelixLiveTranslationUiProjection({
        projections: input.projections,
        sourceId: input.sourceId,
        sourceHash: input.sourceHash,
        projectionTarget: input.projectionTarget,
        targetLanguage: input.targetLanguage,
        dedupeKey: unitId,
        allowStaleDisplayText: input.allowStaleDisplayText,
      })
      : selection;
    const fallbackByEmbeddedDedupe = fallbackByDedupe.status === "missing"
      ? input.projections
        .filter((projection) => projection.sourceId === input.sourceId)
        .filter((projection) => projectionSourceHashMatches(projection, readString(input.sourceHash) || null))
        .filter((projection) => projection.projectionTarget === input.projectionTarget)
        .filter((projection) => localeMatches(projection.targetLanguage, input.targetLanguage))
        .filter((projection) => projection.dedupeKey?.includes(unitId))
        .sort(sortLatestProjectionFirst)
        .map((projection) =>
          buildHelixLiveTranslationUiProjectionSelectionFromProjection(
            projection,
            input.allowStaleDisplayText,
          ))
        [0] ?? fallbackByDedupe
      : fallbackByDedupe;
    const resolved = fallbackByEmbeddedDedupe;
    if (resolved.status === "missing") continue;
    if (resolved.displayText) {
      next[unitId] = {
        status: "ready",
        text: resolved.displayText,
        observationRef: resolved.observationRef,
        receiptRef: resolved.receiptRef,
        laneSessionId: resolved.laneSessionId,
        selectedBackendProvider: resolved.selectedBackendProvider,
        terminalAuthorityStatus: resolved.terminalAuthorityStatus,
        projectionStatus: resolved.status,
        chunkId: resolved.projection?.chunkId ?? null,
        chunkIndex: resolved.projection?.chunkIndex ?? null,
        dedupeKey: resolved.projection?.dedupeKey ?? null,
        sourceEventId: resolved.projection?.sourceEventId ?? null,
        sourceEventMs: resolved.projection?.sourceEventMs ?? null,
        observedAtMs: resolved.projection?.observedAtMs ?? null,
        freshnessStatus: resolved.projection?.freshnessStatus ?? "unknown",
        sourceId: resolved.projection?.sourceId ?? input.sourceId,
        ...(resolved.projection?.sourceHash ? { sourceHash: resolved.projection.sourceHash } : {}),
        sourceKind: resolved.projection?.sourceKind ?? null,
        accountLocale: resolved.projection?.accountLocale ?? null,
        projectionTarget: resolved.projectionTarget,
        targetLanguage: resolved.targetLanguage,
        cancelRequested: resolved.projection?.cancelRequested ?? resolved.status === "cancelled",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      };
      continue;
    }
    next[unitId] = {
      status: "error",
      error: resolved.reason,
      observationRef: resolved.observationRef,
      receiptRef: resolved.receiptRef,
      laneSessionId: resolved.laneSessionId,
      selectedBackendProvider: resolved.selectedBackendProvider,
      terminalAuthorityStatus: resolved.terminalAuthorityStatus,
      projectionStatus: resolved.status,
      chunkId: resolved.projection?.chunkId ?? null,
      chunkIndex: resolved.projection?.chunkIndex ?? null,
      dedupeKey: resolved.projection?.dedupeKey ?? null,
      sourceEventId: resolved.projection?.sourceEventId ?? null,
      sourceEventMs: resolved.projection?.sourceEventMs ?? null,
      observedAtMs: resolved.projection?.observedAtMs ?? null,
      freshnessStatus: resolved.projection?.freshnessStatus ?? "unknown",
      sourceId: resolved.projection?.sourceId ?? input.sourceId,
      ...(resolved.projection?.sourceHash ? { sourceHash: resolved.projection.sourceHash } : {}),
      sourceKind: resolved.projection?.sourceKind ?? null,
      accountLocale: resolved.projection?.accountLocale ?? null,
      projectionTarget: resolved.projectionTarget,
      targetLanguage: resolved.targetLanguage,
      cancelRequested: resolved.projection?.cancelRequested ?? resolved.status === "cancelled",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    };
  }
  return next;
}
