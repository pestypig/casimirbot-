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
  projectionKey?: string | null;
  status: HelixLiveTranslationUiProjectionStatus;
  projectionTarget: string;
  sourceId: string;
  sourceHash?: string;
  sourceKind: string | null;
  sourceTextHash?: string | null;
  sourceTextCharCount?: number | null;
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
  observationLaneSessionId: string | null;
  goalBindingId: string | null;
  sessionControlKey?: string | null;
  sourceBindingKey?: string | null;
  latestObservationKey?: string | null;
  latestMailLoopObservationKey?: string | null;
  goalBindingKey?: string | null;
  latestEventId: string | null;
  hasObservation: boolean;
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
  latestSourceTextHash?: string | null;
  latestSourceTextCharCount?: number | null;
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
  latestObservationLaneSessionId: string | null;
  latestGoalBindingId: string | null;
  latestSessionControlKey?: string | null;
  latestSourceBindingKey?: string | null;
  latestObservationKey?: string | null;
  latestMailLoopObservationKey?: string | null;
  latestGoalBindingKey?: string | null;
  latestEventId: string | null;
  latestHasObservation: boolean;
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
  sourceTextHash?: string | null;
  sourceTextCharCount?: number | null;
  accountLocale: string | null;
  projectionTarget: string | null;
  targetLanguage: string | null;
  observationRef: string | null;
  receiptRef: string | null;
  laneSessionId: string | null;
  observationLaneSessionId: string | null;
  goalBindingId: string | null;
  sessionControlKey?: string | null;
  sourceBindingKey?: string | null;
  latestObservationKey?: string | null;
  latestMailLoopObservationKey?: string | null;
  goalBindingKey?: string | null;
  latestEventId: string | null;
  hasObservation: boolean;
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
  sourceTextHash?: string | null;
  sourceTextCharCount?: number | null;
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
  projectionKey?: string | null;
  observationRef: string | null;
  receiptRef: string | null;
  laneSessionId: string | null;
  observationLaneSessionId: string | null;
  goalBindingId: string | null;
  sourceBindingKey?: string | null;
  latestObservationKey?: string | null;
  latestMailLoopObservationKey?: string | null;
  goalBindingKey?: string | null;
  latestEventId: string | null;
  hasObservation: boolean;
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
  sourceTextHash?: string | null;
  sourceTextCharCount?: number | null;
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

const readOptionalBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

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

const projectionSourceTextIdentityMatches = (
  projection: HelixLiveTranslationUiProjection,
  input: Pick<SelectHelixLiveTranslationUiProjectionInput, "sourceTextHash" | "sourceTextCharCount">,
): boolean => {
  const sourceTextHash = readString(input.sourceTextHash) || null;
  const sourceTextCharCount = readNumber(input.sourceTextCharCount);
  if (sourceTextHash && projection.sourceTextHash !== sourceTextHash) return false;
  if (sourceTextCharCount !== null && projection.sourceTextCharCount !== sourceTextCharCount) return false;
  return true;
};

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
        session_control_key: observation.session_control_key,
        source_binding_key: observation.source_binding_key,
        latest_observation_key: observation.latest_observation_key,
        latest_mail_loop_observation_key: observation.latest_mail_loop_observation_key,
        goal_binding_key: observation.goal_binding_key,
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
  const projectionTarget =
    readString(receipt.projection_target) ||
    readString(receipt.projectionTarget) ||
    readString(payload?.projection_target) ||
    readString(payload?.projectionTarget) ||
    "unknown";
  const sourceId =
    readString(receipt.source_id) ||
    readString(receipt.sourceId) ||
    readString(payload?.source_id) ||
    readString(payload?.sourceId) ||
    "unknown_source";
  const sourceHash =
    readString(receipt.source_hash) ||
    readString(receipt.sourceHash) ||
    readString(payload?.source_hash) ||
    readString(payload?.sourceHash) ||
    null;
  const chunkId =
    readString(receipt.chunk_id) ||
    readString(receipt.chunkId) ||
    readString(payload?.chunk_id) ||
    readString(payload?.chunkId) ||
    readString(receipt.observation_ref) ||
    readString(receipt.observationRef) ||
    "unknown_chunk";
  const targetLanguage =
    readString(receipt.target_language) ||
    readString(receipt.targetLanguage) ||
    readString(payload?.target_language) ||
    readString(payload?.targetLanguage);
  const rawStatus = (
    readString(receipt.projection_status) ||
    readString(receipt.projectionStatus) ||
    readString(payload?.projection_status) ||
    readString(payload?.projectionStatus) ||
    readString(receipt.status)
  ).toLowerCase();
  const status: HelixLiveTranslationUiProjectionStatus =
    rawStatus === "cancelled" ||
      readBoolean(receipt.cancel_requested) ||
      readBoolean(receipt.cancelRequested) ||
      readBoolean(payload?.cancel_requested) ||
      readBoolean(payload?.cancelRequested)
      ? "cancelled"
      : rawStatus === "failed"
        ? "failed"
        : rawStatus === "stale" ||
            readBoolean(receipt.stale) ||
            readBoolean(receipt.isStale) ||
            readBoolean(payload?.stale) ||
            readBoolean(payload?.isStale)
          ? "stale"
          : "projected";
  const translatedText = status === "cancelled" || status === "failed"
    ? null
    : readString(receipt.translated_text) ||
      readString(receipt.translatedText) ||
      readString(payload?.translated_text) ||
      readString(payload?.translatedText) ||
      null;
  const observationRef = readString(receipt.observation_ref) || readString(receipt.observationRef) || null;
  const receiptRef = readString(receipt.receipt_ref) || readString(receipt.receiptRef) || null;
  const hasObservation =
    readOptionalBoolean(receipt.has_observation) ??
    readOptionalBoolean(receipt.hasObservation) ??
    readOptionalBoolean(payload?.has_observation) ??
    readOptionalBoolean(payload?.hasObservation) ??
    Boolean(observationRef);
  const sourceBindingKey =
    readString(receipt.source_binding_key) || readString(receipt.sourceBindingKey) ||
    readString(payload?.source_binding_key) || readString(payload?.sourceBindingKey) || null;
  const sessionControlKey =
    readString(receipt.session_control_key) || readString(receipt.sessionControlKey) ||
    readString(receipt.lane_session_control_key) || readString(receipt.laneSessionControlKey) ||
    readString(payload?.session_control_key) || readString(payload?.sessionControlKey) ||
    readString(payload?.lane_session_control_key) || readString(payload?.laneSessionControlKey) || null;
  const latestObservationKey =
    readString(receipt.latest_observation_key) || readString(receipt.latestObservationKey) ||
    readString(payload?.latest_observation_key) || readString(payload?.latestObservationKey) || null;
  const latestMailLoopObservationKey =
    readString(receipt.latest_mail_loop_observation_key) || readString(receipt.latestMailLoopObservationKey) ||
    readString(payload?.latest_mail_loop_observation_key) || readString(payload?.latestMailLoopObservationKey) || null;
  const goalBindingKey =
    readString(receipt.goal_binding_key) || readString(receipt.goalBindingKey) ||
    readString(payload?.goal_binding_key) || readString(payload?.goalBindingKey) || null;
  const projectionKey =
    readString(receipt.projection_key) || readString(receipt.projectionKey) ||
    readString(payload?.projection_key) || readString(payload?.projectionKey) || null;
  return {
    key: [
      projectionTarget,
      sourceId,
      sourceHash,
      chunkId,
      targetLanguage,
      readString(receipt.dedupe_key) || readString(receipt.dedupeKey) ||
        readString(payload?.dedupe_key) || readString(payload?.dedupeKey),
      readString(receipt.source_event_id) || readString(receipt.sourceEventId) ||
      readString(payload?.source_event_id) || readString(payload?.sourceEventId),
    ].filter(Boolean).join("|"),
    ...(projectionKey ? { projectionKey } : {}),
    status,
    projectionTarget,
    sourceId,
    ...(sourceHash ? { sourceHash } : {}),
    sourceKind:
      readString(receipt.source_kind) || readString(receipt.sourceKind) ||
      readString(payload?.source_kind) || readString(payload?.sourceKind) || null,
    ...(readString(receipt.source_text_hash) || readString(receipt.sourceTextHash) ||
      readString(payload?.source_text_hash) || readString(payload?.sourceTextHash)
      ? {
        sourceTextHash:
          readString(receipt.source_text_hash) || readString(receipt.sourceTextHash) ||
          readString(payload?.source_text_hash) || readString(payload?.sourceTextHash),
      }
      : {}),
    ...(typeof (
      readNumber(receipt.source_text_char_count) ?? readNumber(receipt.sourceTextCharCount) ??
      readNumber(payload?.source_text_char_count) ?? readNumber(payload?.sourceTextCharCount)
    ) === "number"
      ? {
        sourceTextCharCount:
          readNumber(receipt.source_text_char_count) ?? readNumber(receipt.sourceTextCharCount) ??
          readNumber(payload?.source_text_char_count) ?? readNumber(payload?.sourceTextCharCount),
      }
      : {}),
    accountLocale:
      readString(receipt.account_locale) || readString(receipt.accountLocale) ||
      readString(payload?.account_locale) || readString(payload?.accountLocale) || null,
    chunkId,
    chunkIndex:
      readNumber(receipt.chunk_index) ?? readNumber(receipt.chunkIndex) ??
      readNumber(payload?.chunk_index) ?? readNumber(payload?.chunkIndex),
    dedupeKey:
      readString(receipt.dedupe_key) || readString(receipt.dedupeKey) ||
      readString(payload?.dedupe_key) || readString(payload?.dedupeKey) || null,
    sourceEventId:
      readString(receipt.source_event_id) || readString(receipt.sourceEventId) ||
      readString(payload?.source_event_id) || readString(payload?.sourceEventId) || null,
    targetLanguage,
    translatedText,
    observationRef,
    receiptRef,
    laneSessionId:
      readString(receipt.lane_session_id) || readString(receipt.laneSessionId) ||
      readString(payload?.lane_session_id) || readString(payload?.laneSessionId) || null,
    observationLaneSessionId:
      readString(receipt.observation_lane_session_id) || readString(receipt.observationLaneSessionId) ||
      readString(payload?.observation_lane_session_id) || readString(payload?.observationLaneSessionId) || null,
    goalBindingId:
      readString(receipt.goal_binding_id) || readString(receipt.goalBindingId) ||
      readString(payload?.goal_binding_id) || readString(payload?.goalBindingId) || null,
    ...(sessionControlKey ? { sessionControlKey } : {}),
    ...(sourceBindingKey ? { sourceBindingKey } : {}),
    ...(latestObservationKey ? { latestObservationKey } : {}),
    ...(latestMailLoopObservationKey ? { latestMailLoopObservationKey } : {}),
    ...(goalBindingKey ? { goalBindingKey } : {}),
    latestEventId:
      readString(receipt.latest_event_id) || readString(receipt.latestEventId) ||
      readString(payload?.latest_event_id) || readString(payload?.latestEventId) || null,
    hasObservation,
    selectedBackendProvider:
      readString(receipt.selected_backend_provider) || readString(receipt.selectedBackendProvider) ||
      readString(payload?.selected_backend_provider) || readString(payload?.selectedBackendProvider) || null,
    observedAtMs:
      readNumber(receipt.observed_at_ms) ?? readNumber(receipt.observedAtMs) ??
      readNumber(payload?.observed_at_ms) ?? readNumber(payload?.observedAtMs),
    sourceEventMs:
      readNumber(receipt.source_event_ms) ?? readNumber(receipt.sourceEventMs) ??
      readNumber(payload?.source_event_ms) ?? readNumber(payload?.sourceEventMs),
    freshnessStatus:
      readString(receipt.freshness_status) || readString(receipt.freshnessStatus) ||
      readString(payload?.freshness_status) || readString(payload?.freshnessStatus) || "unknown",
    terminalAuthorityStatus: readTerminalAuthorityStatus(
      receipt.terminal_authority_status ??
        receipt.terminalAuthorityStatus ??
        payload?.terminal_authority_status ??
        payload?.terminalAuthorityStatus,
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
      ...(latest?.sourceTextHash ? { latestSourceTextHash: latest.sourceTextHash } : {}),
      ...(typeof latest?.sourceTextCharCount === "number" ? { latestSourceTextCharCount: latest.sourceTextCharCount } : {}),
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
      latestObservationLaneSessionId: latest?.observationLaneSessionId ?? null,
      latestGoalBindingId: latest?.goalBindingId ?? null,
      ...(latest?.sessionControlKey ? { latestSessionControlKey: latest.sessionControlKey } : {}),
      ...(latest?.sourceBindingKey ? { latestSourceBindingKey: latest.sourceBindingKey } : {}),
      ...(latest?.latestObservationKey ? { latestObservationKey: latest.latestObservationKey } : {}),
      ...(latest?.latestMailLoopObservationKey
        ? { latestMailLoopObservationKey: latest.latestMailLoopObservationKey }
        : {}),
      ...(latest?.goalBindingKey ? { latestGoalBindingKey: latest.goalBindingKey } : {}),
      latestEventId: latest?.latestEventId ?? null,
      latestHasObservation: latest?.hasObservation ?? false,
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
    .filter((projection) => projectionSourceTextIdentityMatches(projection, input))
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
      observationLaneSessionId: null,
      goalBindingId: null,
      latestEventId: null,
      hasObservation: false,
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
    ...(projection.sourceTextHash ? { sourceTextHash: projection.sourceTextHash } : {}),
    ...(typeof projection.sourceTextCharCount === "number" ? { sourceTextCharCount: projection.sourceTextCharCount } : {}),
    accountLocale: projection.accountLocale,
    projectionTarget: projection.projectionTarget,
    targetLanguage: projection.targetLanguage,
    observationRef: projection.observationRef,
    receiptRef: projection.receiptRef,
    laneSessionId: projection.laneSessionId,
    observationLaneSessionId: projection.observationLaneSessionId,
    goalBindingId: projection.goalBindingId,
    ...(projection.sessionControlKey ? { sessionControlKey: projection.sessionControlKey } : {}),
    ...(projection.sourceBindingKey ? { sourceBindingKey: projection.sourceBindingKey } : {}),
    ...(projection.latestObservationKey ? { latestObservationKey: projection.latestObservationKey } : {}),
    ...(projection.latestMailLoopObservationKey
      ? { latestMailLoopObservationKey: projection.latestMailLoopObservationKey }
      : {}),
    ...(projection.goalBindingKey ? { goalBindingKey: projection.goalBindingKey } : {}),
    latestEventId: projection.latestEventId,
    hasObservation: projection.hasObservation,
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
    ...(projection.sourceTextHash ? { sourceTextHash: projection.sourceTextHash } : {}),
    ...(typeof projection.sourceTextCharCount === "number" ? { sourceTextCharCount: projection.sourceTextCharCount } : {}),
    accountLocale: projection.accountLocale,
    projectionTarget: projection.projectionTarget,
    targetLanguage: projection.targetLanguage,
    observationRef: projection.observationRef,
    receiptRef: projection.receiptRef,
    laneSessionId: projection.laneSessionId,
    observationLaneSessionId: projection.observationLaneSessionId,
    goalBindingId: projection.goalBindingId,
    ...(projection.sessionControlKey ? { sessionControlKey: projection.sessionControlKey } : {}),
    ...(projection.sourceBindingKey ? { sourceBindingKey: projection.sourceBindingKey } : {}),
    ...(projection.latestObservationKey ? { latestObservationKey: projection.latestObservationKey } : {}),
    ...(projection.latestMailLoopObservationKey
      ? { latestMailLoopObservationKey: projection.latestMailLoopObservationKey }
      : {}),
    ...(projection.goalBindingKey ? { goalBindingKey: projection.goalBindingKey } : {}),
    latestEventId: projection.latestEventId,
    hasObservation: projection.hasObservation,
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
        ...(resolved.projection?.projectionKey ? { projectionKey: resolved.projection.projectionKey } : {}),
        observationRef: resolved.observationRef,
        receiptRef: resolved.receiptRef,
        laneSessionId: resolved.laneSessionId,
        observationLaneSessionId: resolved.observationLaneSessionId,
        goalBindingId: resolved.goalBindingId,
        ...(resolved.sessionControlKey ? { sessionControlKey: resolved.sessionControlKey } : {}),
        ...(resolved.sourceBindingKey ? { sourceBindingKey: resolved.sourceBindingKey } : {}),
        ...(resolved.latestObservationKey ? { latestObservationKey: resolved.latestObservationKey } : {}),
        ...(resolved.latestMailLoopObservationKey
          ? { latestMailLoopObservationKey: resolved.latestMailLoopObservationKey }
          : {}),
        ...(resolved.goalBindingKey ? { goalBindingKey: resolved.goalBindingKey } : {}),
        latestEventId: resolved.latestEventId,
        hasObservation: resolved.hasObservation,
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
        ...(resolved.projection?.sourceTextHash ? { sourceTextHash: resolved.projection.sourceTextHash } : {}),
        ...(typeof resolved.projection?.sourceTextCharCount === "number"
          ? { sourceTextCharCount: resolved.projection.sourceTextCharCount }
          : {}),
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
      ...(resolved.projection?.projectionKey ? { projectionKey: resolved.projection.projectionKey } : {}),
      observationRef: resolved.observationRef,
      receiptRef: resolved.receiptRef,
      laneSessionId: resolved.laneSessionId,
      observationLaneSessionId: resolved.observationLaneSessionId,
      goalBindingId: resolved.goalBindingId,
      ...(resolved.sessionControlKey ? { sessionControlKey: resolved.sessionControlKey } : {}),
      ...(resolved.sourceBindingKey ? { sourceBindingKey: resolved.sourceBindingKey } : {}),
      ...(resolved.latestObservationKey ? { latestObservationKey: resolved.latestObservationKey } : {}),
      ...(resolved.latestMailLoopObservationKey
        ? { latestMailLoopObservationKey: resolved.latestMailLoopObservationKey }
        : {}),
      ...(resolved.goalBindingKey ? { goalBindingKey: resolved.goalBindingKey } : {}),
      latestEventId: resolved.latestEventId,
      hasObservation: resolved.hasObservation,
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
      ...(resolved.projection?.sourceTextHash ? { sourceTextHash: resolved.projection.sourceTextHash } : {}),
      ...(typeof resolved.projection?.sourceTextCharCount === "number"
        ? { sourceTextCharCount: resolved.projection.sourceTextCharCount }
        : {}),
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
