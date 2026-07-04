import {
  normalizeHelixLiveTranslationSourceIdentityKey,
  normalizeHelixLiveTranslationSourceKind,
} from "@shared/helix-live-translation-source-kind";

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
  | "pending_helix_terminal_authority"
  | "terminal_authority_rejected";

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
  sessionDebugPhase?: string | null;
  sessionObservationStatus?: string | null;
  sessionControlKey?: string | null;
  sourceBindingKey?: string | null;
  latestSourceBindingKey?: string | null;
  sourceIdentityKey?: string | null;
  latestSourceIdentityKey?: string | null;
  laneSessionSourceBindingKey?: string | null;
  laneSessionSourceIdentityKey?: string | null;
  latestObservationKey?: string | null;
  latestMailLoopObservationKey?: string | null;
  goalBindingKey?: string | null;
  latestEventId: string | null;
  hasObservation: boolean;
  selectedRuntimeAgentProvider?: string | null;
  selectedBackendProvider: string | null;
  observedAtMs: number | null;
  sourceEventMs: number | null;
  freshnessStatus: string;
  terminalAuthorityStatus: HelixLiveTranslationTerminalAuthorityStatus;
  stale: boolean;
  cancelRequested: boolean;
  contextRole: "tool_evidence";
  answerAuthority: false;
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
  latestSourceEventId: string | null;
  latestObservedAtMs: number | null;
  latestSourceEventMs: number | null;
  latestFreshnessStatus: string;
  latestTerminalAuthorityStatus: HelixLiveTranslationTerminalAuthorityStatus;
  latestObservationRef: string | null;
  latestReceiptRef: string | null;
  latestLaneSessionId: string | null;
  latestObservationLaneSessionId: string | null;
  latestGoalBindingId: string | null;
  latestLaneSessionDebugPhase?: string | null;
  latestLaneSessionObservationStatus?: string | null;
  latestSessionControlKey?: string | null;
  latestSourceBindingKey?: string | null;
  latestSourceIdentityKey?: string | null;
  latestLaneSessionSourceBindingKey?: string | null;
  latestLaneSessionSourceIdentityKey?: string | null;
  latestObservationKey?: string | null;
  latestMailLoopObservationKey?: string | null;
  latestGoalBindingKey?: string | null;
  latestEventId: string | null;
  latestHasObservation: boolean;
  selectedRuntimeAgentProvider?: string | null;
  selectedBackendProvider: string | null;
  contextRole: "tool_evidence";
  answerAuthority: false;
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
  sourceHash?: string | null;
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
  sessionDebugPhase?: string | null;
  sessionObservationStatus?: string | null;
  sessionControlKey?: string | null;
  sourceBindingKey?: string | null;
  latestSourceBindingKey?: string | null;
  sourceIdentityKey?: string | null;
  latestSourceIdentityKey?: string | null;
  laneSessionSourceBindingKey?: string | null;
  laneSessionSourceIdentityKey?: string | null;
  latestObservationKey?: string | null;
  latestMailLoopObservationKey?: string | null;
  goalBindingKey?: string | null;
  latestEventId: string | null;
  hasObservation: boolean;
  selectedRuntimeAgentProvider?: string | null;
  selectedBackendProvider: string | null;
  terminalAuthorityStatus: HelixLiveTranslationTerminalAuthorityStatus;
  contextRole: "tool_evidence";
  answerAuthority: false;
  terminalEligible: false;
  assistantAnswer: false;
  rawContentIncluded: false;
};

export type SelectHelixLiveTranslationUiProjectionInput = {
  projections: HelixLiveTranslationUiProjection[];
  sourceId: string;
  sourceHash?: string | null;
  sourceIdentityKey?: string | null;
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
  sessionDebugPhase?: string | null;
  sessionObservationStatus?: string | null;
  sourceBindingKey?: string | null;
  latestSourceBindingKey?: string | null;
  sourceIdentityKey?: string | null;
  latestSourceIdentityKey?: string | null;
  laneSessionSourceBindingKey?: string | null;
  laneSessionSourceIdentityKey?: string | null;
  latestObservationKey?: string | null;
  latestMailLoopObservationKey?: string | null;
  goalBindingKey?: string | null;
  latestEventId: string | null;
  hasObservation: boolean;
  selectedRuntimeAgentProvider?: string | null;
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
  contextRole: "tool_evidence";
  answerAuthority: false;
  terminalEligible: false;
  assistantAnswer: false;
  rawContentIncluded: false;
};

export type BuildHelixLiveTranslationInlineUnitStateInput = {
  projections: HelixLiveTranslationUiProjection[];
  units: DocumentTranslationUnitLike[];
  sourceId: string;
  sourceHash?: string | null;
  sourceIdentityKey?: string | null;
  sourceTextHash?: string | null;
  sourceTextCharCount?: number | null;
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
    : readString(value) === "terminal_authority_rejected"
      ? "terminal_authority_rejected"
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

const projectionSourceIdentityKeyMatches = (
  projection: HelixLiveTranslationUiProjection,
  sourceIdentityKey: string | null,
): boolean =>
  !sourceIdentityKey
    ? true
    : normalizeHelixLiveTranslationSourceIdentityKey(projection.sourceIdentityKey) ===
      normalizeHelixLiveTranslationSourceIdentityKey(sourceIdentityKey);

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
        latest_source_binding_key: observation.latest_source_binding_key,
        source_identity_key: observation.source_identity_key,
        latest_source_identity_key: observation.latest_source_identity_key,
        lane_session_source_binding_key: observation.lane_session_source_binding_key,
        lane_session_source_identity_key: observation.lane_session_source_identity_key,
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
        context_role: "tool_evidence",
        answer_authority: false,
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
  const sourceKind = normalizeHelixLiveTranslationSourceKind(
    readString(receipt.source_kind) || readString(receipt.sourceKind) ||
      readString(payload?.source_kind) || readString(payload?.sourceKind),
    "",
  ) || null;
  const sourceTextHash =
    readString(receipt.source_text_hash) || readString(receipt.sourceTextHash) ||
    readString(payload?.source_text_hash) || readString(payload?.sourceTextHash);
  const sourceTextCharCount =
    readNumber(receipt.source_text_char_count) ?? readNumber(receipt.sourceTextCharCount) ??
    readNumber(payload?.source_text_char_count) ?? readNumber(payload?.sourceTextCharCount);
  const accountLocale =
    readString(receipt.account_locale) || readString(receipt.accountLocale) ||
    readString(payload?.account_locale) || readString(payload?.accountLocale) || null;
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
  const sourceBindingKey =
    readString(receipt.source_binding_key) || readString(receipt.sourceBindingKey) ||
    readString(payload?.source_binding_key) || readString(payload?.sourceBindingKey) || null;
  const latestSourceBindingKey =
    readString(receipt.latest_source_binding_key) || readString(receipt.latestSourceBindingKey) ||
    readString(payload?.latest_source_binding_key) || readString(payload?.latestSourceBindingKey) ||
    sourceBindingKey;
  const sourceIdentityKey =
    readString(receipt.source_identity_key) || readString(receipt.sourceIdentityKey) ||
    readString(payload?.source_identity_key) || readString(payload?.sourceIdentityKey) || null;
  const latestSourceIdentityKey =
    readString(receipt.latest_source_identity_key) || readString(receipt.latestSourceIdentityKey) ||
    readString(payload?.latest_source_identity_key) || readString(payload?.latestSourceIdentityKey) || null;
  const laneSessionSourceBindingKey =
    readString(receipt.lane_session_source_binding_key) ||
    readString(receipt.laneSessionSourceBindingKey) ||
    readString(payload?.lane_session_source_binding_key) ||
    readString(payload?.laneSessionSourceBindingKey) ||
    null;
  const laneSessionSourceIdentityKey =
    readString(receipt.lane_session_source_identity_key) ||
    readString(receipt.laneSessionSourceIdentityKey) ||
    readString(payload?.lane_session_source_identity_key) ||
    readString(payload?.laneSessionSourceIdentityKey) ||
    null;
  const sessionControlKey =
    readString(receipt.session_control_key) || readString(receipt.sessionControlKey) ||
    readString(receipt.lane_session_control_key) || readString(receipt.laneSessionControlKey) ||
    readString(payload?.session_control_key) || readString(payload?.sessionControlKey) ||
    readString(payload?.lane_session_control_key) || readString(payload?.laneSessionControlKey) || null;
  const sessionDebugPhase =
    readString(receipt.session_debug_phase) ||
    readString(receipt.sessionDebugPhase) ||
    readString(payload?.session_debug_phase) ||
    readString(payload?.sessionDebugPhase) ||
    null;
  const sessionObservationStatus =
    readString(receipt.session_observation_status) ||
    readString(receipt.sessionObservationStatus) ||
    readString(payload?.session_observation_status) ||
    readString(payload?.sessionObservationStatus) ||
    null;
  const latestObservationKey =
    readString(receipt.latest_observation_key) || readString(receipt.latestObservationKey) ||
    readString(payload?.latest_observation_key) || readString(payload?.latestObservationKey) || null;
  const latestMailLoopObservationKey =
    readString(receipt.latest_mail_loop_observation_key) || readString(receipt.latestMailLoopObservationKey) ||
    readString(payload?.latest_mail_loop_observation_key) || readString(payload?.latestMailLoopObservationKey) || null;
  const hasObservation =
    readOptionalBoolean(receipt.has_observation) ??
    readOptionalBoolean(receipt.hasObservation) ??
    readOptionalBoolean(payload?.has_observation) ??
    readOptionalBoolean(payload?.hasObservation) ??
    Boolean(observationRef || receiptRef || latestObservationKey || latestMailLoopObservationKey);
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
      sourceKind,
      sourceTextHash,
      typeof sourceTextCharCount === "number" ? String(sourceTextCharCount) : "",
      accountLocale,
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
    sourceKind,
    ...(sourceTextHash ? { sourceTextHash } : {}),
    ...(typeof sourceTextCharCount === "number" ? { sourceTextCharCount } : {}),
    accountLocale,
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
    ...(sessionDebugPhase ? { sessionDebugPhase } : {}),
    ...(sessionObservationStatus ? { sessionObservationStatus } : {}),
    ...(sessionControlKey ? { sessionControlKey } : {}),
    ...(sourceBindingKey ? { sourceBindingKey } : {}),
    ...(latestSourceBindingKey ? { latestSourceBindingKey } : {}),
    ...(sourceIdentityKey ? { sourceIdentityKey } : {}),
    ...(latestSourceIdentityKey ? { latestSourceIdentityKey } : {}),
    ...(laneSessionSourceBindingKey ? { laneSessionSourceBindingKey } : {}),
    ...(laneSessionSourceIdentityKey ? { laneSessionSourceIdentityKey } : {}),
    ...(latestObservationKey ? { latestObservationKey } : {}),
    ...(latestMailLoopObservationKey ? { latestMailLoopObservationKey } : {}),
    ...(goalBindingKey ? { goalBindingKey } : {}),
    latestEventId:
      readString(receipt.latest_event_id) || readString(receipt.latestEventId) ||
      readString(payload?.latest_event_id) || readString(payload?.latestEventId) || null,
    hasObservation,
    ...(
      readString(receipt.selected_runtime_agent_provider) || readString(receipt.selectedRuntimeAgentProvider) ||
      readString(payload?.selected_runtime_agent_provider) || readString(payload?.selectedRuntimeAgentProvider) ||
      readString(receipt.agent_runtime) || readString(receipt.agentRuntime) ||
      readString(payload?.agent_runtime) || readString(payload?.agentRuntime)
        ? {
          selectedRuntimeAgentProvider:
            readString(receipt.selected_runtime_agent_provider) || readString(receipt.selectedRuntimeAgentProvider) ||
            readString(payload?.selected_runtime_agent_provider) || readString(payload?.selectedRuntimeAgentProvider) ||
            readString(receipt.agent_runtime) || readString(receipt.agentRuntime) ||
            readString(payload?.agent_runtime) || readString(payload?.agentRuntime),
        }
        : {}
    ),
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
    contextRole: "tool_evidence",
    answerAuthority: false,
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
    if (!previous || sortLatestProjectionFirst(projection, previous) <= 0) {
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
      projection.sourceKind ?? "",
      projection.sourceTextHash ?? "",
      typeof projection.sourceTextCharCount === "number" ? String(projection.sourceTextCharCount) : "",
      projection.accountLocale ?? "",
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
      latestSourceEventId: latest?.sourceEventId ?? null,
      latestObservedAtMs: latest?.observedAtMs ?? null,
      latestSourceEventMs: latest?.sourceEventMs ?? null,
      latestFreshnessStatus: latest?.freshnessStatus ?? "unknown",
      latestTerminalAuthorityStatus: latest?.terminalAuthorityStatus ?? "not_terminal_authority",
      latestObservationRef: latest?.observationRef ?? null,
      latestReceiptRef: latest?.receiptRef ?? null,
      latestLaneSessionId: latest?.laneSessionId ?? null,
      latestObservationLaneSessionId: latest?.observationLaneSessionId ?? null,
      latestGoalBindingId: latest?.goalBindingId ?? null,
      ...(latest?.sessionDebugPhase ? { latestLaneSessionDebugPhase: latest.sessionDebugPhase } : {}),
      ...(latest?.sessionObservationStatus
        ? { latestLaneSessionObservationStatus: latest.sessionObservationStatus }
        : {}),
      ...(latest?.sessionControlKey ? { latestSessionControlKey: latest.sessionControlKey } : {}),
      ...(latest?.latestSourceBindingKey || latest?.sourceBindingKey
        ? { latestSourceBindingKey: latest.latestSourceBindingKey ?? latest.sourceBindingKey }
        : {}),
      ...(latest?.latestSourceIdentityKey || latest?.sourceIdentityKey
        ? { latestSourceIdentityKey: latest.latestSourceIdentityKey ?? latest.sourceIdentityKey }
        : {}),
      ...(latest?.laneSessionSourceBindingKey
        ? { latestLaneSessionSourceBindingKey: latest.laneSessionSourceBindingKey }
        : {}),
      ...(latest?.laneSessionSourceIdentityKey
        ? { latestLaneSessionSourceIdentityKey: latest.laneSessionSourceIdentityKey }
        : {}),
      ...(latest?.latestObservationKey ? { latestObservationKey: latest.latestObservationKey } : {}),
      ...(latest?.latestMailLoopObservationKey
        ? { latestMailLoopObservationKey: latest.latestMailLoopObservationKey }
        : {}),
      ...(latest?.goalBindingKey ? { latestGoalBindingKey: latest.goalBindingKey } : {}),
      latestEventId: latest?.latestEventId ?? null,
      latestHasObservation: latest?.hasObservation ?? false,
      ...(latest?.selectedRuntimeAgentProvider
        ? { selectedRuntimeAgentProvider: latest.selectedRuntimeAgentProvider }
        : {}),
      selectedBackendProvider: latest?.selectedBackendProvider ?? null,
      contextRole: "tool_evidence",
      answerAuthority: false,
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    };
  }).sort((left, right) => {
    const sourceDelta = left.sourceId.localeCompare(right.sourceId);
    if (sourceDelta !== 0) return sourceDelta;
    const hashDelta = (left.sourceHash ?? "").localeCompare(right.sourceHash ?? "");
    if (hashDelta !== 0) return hashDelta;
    const kindDelta = (left.sourceKind ?? "").localeCompare(right.sourceKind ?? "");
    if (kindDelta !== 0) return kindDelta;
    const textHashDelta = (left.latestSourceTextHash ?? "").localeCompare(right.latestSourceTextHash ?? "");
    if (textHashDelta !== 0) return textHashDelta;
    const textCharDelta = (left.latestSourceTextCharCount ?? -1) - (right.latestSourceTextCharCount ?? -1);
    if (textCharDelta !== 0) return textCharDelta;
    const localeDelta = (left.accountLocale ?? "").localeCompare(right.accountLocale ?? "");
    if (localeDelta !== 0) return localeDelta;
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
  const sourceIdentityKey = readString(input.sourceIdentityKey) || null;
  const projectionTarget = readString(input.projectionTarget) || null;
  const targetLanguage = normalizeKeyText(input.targetLanguage) || null;
  const chunkId = readString(input.chunkId) || null;
  const dedupeKey = readString(input.dedupeKey) || null;
  const sourceTextHash = readString(input.sourceTextHash) || null;
  const sourceTextCharCount = readNumber(input.sourceTextCharCount);

  const sourceTargetCandidates = input.projections
    .filter((projection) => projection.sourceId === sourceId)
    .filter((projection) => !projectionTarget || projection.projectionTarget === projectionTarget)
    .filter((projection) => !targetLanguage || localeMatches(projection.targetLanguage, targetLanguage))
    .filter((projection) => !chunkId || projection.chunkId === chunkId)
    .filter((projection) => !dedupeKey || projection.dedupeKey === dedupeKey);

  const candidates = sourceTargetCandidates
    .filter((projection) => projectionSourceHashMatches(projection, sourceHash))
    .filter((projection) => projectionSourceIdentityKeyMatches(projection, sourceIdentityKey))
    .filter((projection) => projectionSourceTextIdentityMatches(projection, input))
    .sort(sortLatestProjectionFirst);

  const projection = candidates[0] ?? null;
  if (!projection) {
    const hashMatchedCandidates = sourceTargetCandidates
      .filter((candidate) => projectionSourceHashMatches(candidate, sourceHash));
    const sourceIdentityMatchedCandidates = hashMatchedCandidates
      .filter((candidate) => projectionSourceIdentityKeyMatches(candidate, sourceIdentityKey));
    const reason =
      sourceHash && sourceTargetCandidates.length > 0 && hashMatchedCandidates.length === 0
        ? "translation_projection_source_hash_mismatch"
        : sourceIdentityKey &&
            hashMatchedCandidates.length > 0 &&
            sourceIdentityMatchedCandidates.length === 0
          ? "translation_projection_source_identity_mismatch"
        : (sourceTextHash || sourceTextCharCount !== null) &&
            sourceIdentityMatchedCandidates.length > 0 &&
            sourceIdentityMatchedCandidates.every((candidate) => !projectionSourceTextIdentityMatches(candidate, input))
          ? "translation_projection_source_text_mismatch"
          : "translation_projection_missing";
    const evidenceProjection =
      reason === "translation_projection_source_hash_mismatch"
        ? [...sourceTargetCandidates].sort(sortLatestProjectionFirst)[0] ?? null
        : reason === "translation_projection_source_identity_mismatch"
          ? [...hashMatchedCandidates].sort(sortLatestProjectionFirst)[0] ?? null
          : reason === "translation_projection_source_text_mismatch"
            ? [...sourceIdentityMatchedCandidates].sort(sortLatestProjectionFirst)[0] ?? null
            : null;
    return buildMissingHelixLiveTranslationUiProjectionSelection({
      reason,
      sourceId,
      sourceHash,
      sourceIdentityKey,
      sourceTextHash,
      sourceTextCharCount,
      projectionTarget,
      targetLanguage,
      evidenceProjection,
    });
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
    ...(projection.sourceHash ? { sourceHash: projection.sourceHash } : {}),
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
    ...(projection.sessionDebugPhase ? { sessionDebugPhase: projection.sessionDebugPhase } : {}),
    ...(projection.sessionObservationStatus ? { sessionObservationStatus: projection.sessionObservationStatus } : {}),
    ...(projection.sessionControlKey ? { sessionControlKey: projection.sessionControlKey } : {}),
    ...(projection.sourceBindingKey ? { sourceBindingKey: projection.sourceBindingKey } : {}),
    ...(projection.latestSourceBindingKey || projection.sourceBindingKey
      ? { latestSourceBindingKey: projection.latestSourceBindingKey ?? projection.sourceBindingKey }
      : {}),
    ...(projection.sourceIdentityKey ? { sourceIdentityKey: projection.sourceIdentityKey } : {}),
    ...(projection.latestSourceIdentityKey ? { latestSourceIdentityKey: projection.latestSourceIdentityKey } : {}),
    ...(projection.laneSessionSourceBindingKey
      ? { laneSessionSourceBindingKey: projection.laneSessionSourceBindingKey }
      : {}),
    ...(projection.laneSessionSourceIdentityKey
      ? { laneSessionSourceIdentityKey: projection.laneSessionSourceIdentityKey }
      : {}),
    ...(projection.latestObservationKey ? { latestObservationKey: projection.latestObservationKey } : {}),
    ...(projection.latestMailLoopObservationKey
      ? { latestMailLoopObservationKey: projection.latestMailLoopObservationKey }
      : {}),
    ...(projection.goalBindingKey ? { goalBindingKey: projection.goalBindingKey } : {}),
    latestEventId: projection.latestEventId,
    hasObservation: projection.hasObservation,
    ...(projection.selectedRuntimeAgentProvider
      ? { selectedRuntimeAgentProvider: projection.selectedRuntimeAgentProvider }
      : {}),
    selectedBackendProvider: projection.selectedBackendProvider,
    terminalAuthorityStatus: projection.terminalAuthorityStatus,
    contextRole: "tool_evidence",
    answerAuthority: false,
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
    ...(projection.sourceHash ? { sourceHash: projection.sourceHash } : {}),
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
    ...(projection.sessionDebugPhase ? { sessionDebugPhase: projection.sessionDebugPhase } : {}),
    ...(projection.sessionObservationStatus ? { sessionObservationStatus: projection.sessionObservationStatus } : {}),
    ...(projection.sessionControlKey ? { sessionControlKey: projection.sessionControlKey } : {}),
    ...(projection.sourceBindingKey ? { sourceBindingKey: projection.sourceBindingKey } : {}),
    ...(projection.latestSourceBindingKey || projection.sourceBindingKey
      ? { latestSourceBindingKey: projection.latestSourceBindingKey ?? projection.sourceBindingKey }
      : {}),
    ...(projection.sourceIdentityKey ? { sourceIdentityKey: projection.sourceIdentityKey } : {}),
    ...(projection.latestSourceIdentityKey ? { latestSourceIdentityKey: projection.latestSourceIdentityKey } : {}),
    ...(projection.laneSessionSourceBindingKey
      ? { laneSessionSourceBindingKey: projection.laneSessionSourceBindingKey }
      : {}),
    ...(projection.laneSessionSourceIdentityKey
      ? { laneSessionSourceIdentityKey: projection.laneSessionSourceIdentityKey }
      : {}),
    ...(projection.latestObservationKey ? { latestObservationKey: projection.latestObservationKey } : {}),
    ...(projection.latestMailLoopObservationKey
      ? { latestMailLoopObservationKey: projection.latestMailLoopObservationKey }
      : {}),
    ...(projection.goalBindingKey ? { goalBindingKey: projection.goalBindingKey } : {}),
    latestEventId: projection.latestEventId,
    hasObservation: projection.hasObservation,
    ...(projection.selectedRuntimeAgentProvider
      ? { selectedRuntimeAgentProvider: projection.selectedRuntimeAgentProvider }
      : {}),
    selectedBackendProvider: projection.selectedBackendProvider,
    terminalAuthorityStatus: projection.terminalAuthorityStatus,
    contextRole: "tool_evidence",
    answerAuthority: false,
    terminalEligible: false,
    assistantAnswer: false,
    rawContentIncluded: false,
  };
}

function buildMissingHelixLiveTranslationUiProjectionSelection(input: {
  reason: string;
  sourceId: string;
  sourceHash?: string | null;
  sourceIdentityKey?: string | null;
  sourceTextHash?: string | null;
  sourceTextCharCount?: number | null;
  projectionTarget?: string | null;
  targetLanguage?: string | null;
  evidenceProjection?: HelixLiveTranslationUiProjection | null;
}): HelixLiveTranslationUiProjectionSelection {
  const evidenceProjection = input.evidenceProjection ?? null;
  const sourceHash = readString(input.sourceHash) || evidenceProjection?.sourceHash || null;
  const sourceIdentityKey =
    readString(input.sourceIdentityKey) ||
    evidenceProjection?.sourceIdentityKey ||
    evidenceProjection?.latestSourceIdentityKey ||
    null;
  const sourceTextHash = readString(input.sourceTextHash) || evidenceProjection?.sourceTextHash || null;
  const sourceTextCharCount = readNumber(input.sourceTextCharCount) ?? evidenceProjection?.sourceTextCharCount ?? null;
  return {
    status: "missing",
    reason: input.reason,
    projection: null,
    displayText: null,
    sourceId: input.sourceId,
    ...(sourceHash ? { sourceHash } : {}),
    ...(sourceIdentityKey ? { sourceIdentityKey } : {}),
    sourceKind: evidenceProjection?.sourceKind ?? null,
    ...(sourceTextHash ? { sourceTextHash } : {}),
    ...(sourceTextCharCount !== null ? { sourceTextCharCount } : {}),
    accountLocale: evidenceProjection?.accountLocale ?? null,
    projectionTarget: readString(input.projectionTarget) || evidenceProjection?.projectionTarget || null,
    targetLanguage: normalizeKeyText(input.targetLanguage) || evidenceProjection?.targetLanguage || null,
    observationRef: evidenceProjection?.observationRef ?? null,
    receiptRef: evidenceProjection?.receiptRef ?? null,
    laneSessionId: evidenceProjection?.laneSessionId ?? null,
    observationLaneSessionId: evidenceProjection?.observationLaneSessionId ?? null,
    goalBindingId: evidenceProjection?.goalBindingId ?? null,
    ...(evidenceProjection?.sessionDebugPhase ? { sessionDebugPhase: evidenceProjection.sessionDebugPhase } : {}),
    ...(evidenceProjection?.sessionObservationStatus
      ? { sessionObservationStatus: evidenceProjection.sessionObservationStatus }
      : {}),
    ...(evidenceProjection?.sessionControlKey ? { sessionControlKey: evidenceProjection.sessionControlKey } : {}),
    ...(evidenceProjection?.sourceBindingKey ? { sourceBindingKey: evidenceProjection.sourceBindingKey } : {}),
    ...(evidenceProjection?.latestSourceBindingKey || evidenceProjection?.sourceBindingKey
      ? { latestSourceBindingKey: evidenceProjection.latestSourceBindingKey ?? evidenceProjection.sourceBindingKey }
      : {}),
    ...(evidenceProjection?.latestSourceIdentityKey || evidenceProjection?.sourceIdentityKey
      ? { latestSourceIdentityKey: evidenceProjection.latestSourceIdentityKey ?? evidenceProjection.sourceIdentityKey }
      : {}),
    ...(evidenceProjection?.laneSessionSourceBindingKey
      ? { laneSessionSourceBindingKey: evidenceProjection.laneSessionSourceBindingKey }
      : {}),
    ...(evidenceProjection?.laneSessionSourceIdentityKey
      ? { laneSessionSourceIdentityKey: evidenceProjection.laneSessionSourceIdentityKey }
      : {}),
    ...(evidenceProjection?.latestObservationKey
      ? { latestObservationKey: evidenceProjection.latestObservationKey }
      : {}),
    ...(evidenceProjection?.latestMailLoopObservationKey
      ? { latestMailLoopObservationKey: evidenceProjection.latestMailLoopObservationKey }
      : {}),
    ...(evidenceProjection?.goalBindingKey ? { goalBindingKey: evidenceProjection.goalBindingKey } : {}),
    latestEventId: evidenceProjection?.latestEventId ?? null,
    hasObservation: evidenceProjection?.hasObservation ?? false,
    ...(evidenceProjection?.selectedRuntimeAgentProvider
      ? { selectedRuntimeAgentProvider: evidenceProjection.selectedRuntimeAgentProvider }
      : {}),
    selectedBackendProvider: evidenceProjection?.selectedBackendProvider ?? null,
    terminalAuthorityStatus: evidenceProjection?.terminalAuthorityStatus ?? "not_terminal_authority",
    contextRole: "tool_evidence",
    answerAuthority: false,
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
        sourceIdentityKey: input.sourceIdentityKey,
        sourceTextHash: input.sourceTextHash,
        sourceTextCharCount: input.sourceTextCharCount,
        projectionTarget: input.projectionTarget,
        targetLanguage: input.targetLanguage,
        chunkId: unitId,
        allowStaleDisplayText: input.allowStaleDisplayText,
      });
    const fallbackByDedupe =
      selection.status === "missing" && selection.reason === "translation_projection_missing"
      ? selectHelixLiveTranslationUiProjection({
        projections: input.projections,
        sourceId: input.sourceId,
        sourceHash: input.sourceHash,
        sourceIdentityKey: input.sourceIdentityKey,
        sourceTextHash: input.sourceTextHash,
        sourceTextCharCount: input.sourceTextCharCount,
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
        .filter((projection) =>
          projectionSourceIdentityKeyMatches(projection, readString(input.sourceIdentityKey) || null)
        )
        .filter((projection) => projectionSourceTextIdentityMatches(projection, input))
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
    let resolved = fallbackByEmbeddedDedupe;
    if (resolved.status === "missing" && resolved.reason === "translation_projection_missing") {
      const embeddedSourceTargetCandidates = input.projections
        .filter((projection) => projection.sourceId === input.sourceId)
        .filter((projection) => projection.projectionTarget === input.projectionTarget)
        .filter((projection) => localeMatches(projection.targetLanguage, input.targetLanguage))
        .filter((projection) => projection.dedupeKey?.includes(unitId));
      const embeddedHashMatchedCandidates = embeddedSourceTargetCandidates
        .filter((projection) => projectionSourceHashMatches(projection, readString(input.sourceHash) || null));
      const embeddedSourceIdentityMatchedCandidates = embeddedHashMatchedCandidates
        .filter((projection) =>
          projectionSourceIdentityKeyMatches(projection, readString(input.sourceIdentityKey) || null)
        );
      if (
        readString(input.sourceHash) &&
        embeddedSourceTargetCandidates.length > 0 &&
        embeddedHashMatchedCandidates.length === 0
      ) {
        resolved = buildMissingHelixLiveTranslationUiProjectionSelection({
          reason: "translation_projection_source_hash_mismatch",
          sourceId: input.sourceId,
          sourceHash: input.sourceHash,
          sourceIdentityKey: input.sourceIdentityKey,
          sourceTextHash: input.sourceTextHash,
          sourceTextCharCount: input.sourceTextCharCount,
          projectionTarget: input.projectionTarget,
          targetLanguage: input.targetLanguage,
          evidenceProjection: [...embeddedSourceTargetCandidates].sort(sortLatestProjectionFirst)[0] ?? null,
        });
      } else if (
        readString(input.sourceIdentityKey) &&
        embeddedHashMatchedCandidates.length > 0 &&
        embeddedSourceIdentityMatchedCandidates.length === 0
      ) {
        resolved = buildMissingHelixLiveTranslationUiProjectionSelection({
          reason: "translation_projection_source_identity_mismatch",
          sourceId: input.sourceId,
          sourceHash: input.sourceHash,
          sourceIdentityKey: input.sourceIdentityKey,
          sourceTextHash: input.sourceTextHash,
          sourceTextCharCount: input.sourceTextCharCount,
          projectionTarget: input.projectionTarget,
          targetLanguage: input.targetLanguage,
          evidenceProjection: [...embeddedHashMatchedCandidates].sort(sortLatestProjectionFirst)[0] ?? null,
        });
      } else if (
        (readString(input.sourceTextHash) || readNumber(input.sourceTextCharCount) !== null) &&
        embeddedSourceIdentityMatchedCandidates.length > 0 &&
        embeddedSourceIdentityMatchedCandidates.every((projection) =>
          !projectionSourceTextIdentityMatches(projection, input)
        )
      ) {
        resolved = buildMissingHelixLiveTranslationUiProjectionSelection({
          reason: "translation_projection_source_text_mismatch",
          sourceId: input.sourceId,
          sourceHash: input.sourceHash,
          sourceIdentityKey: input.sourceIdentityKey,
          sourceTextHash: input.sourceTextHash,
          sourceTextCharCount: input.sourceTextCharCount,
          projectionTarget: input.projectionTarget,
          targetLanguage: input.targetLanguage,
          evidenceProjection: [...embeddedSourceIdentityMatchedCandidates].sort(sortLatestProjectionFirst)[0] ?? null,
        });
      }
    }
    if (
      resolved.status === "missing" &&
      resolved.reason !== "translation_projection_source_hash_mismatch" &&
      resolved.reason !== "translation_projection_source_identity_mismatch" &&
      resolved.reason !== "translation_projection_source_text_mismatch"
    ) {
      continue;
    }
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
        ...(resolved.sessionDebugPhase ? { sessionDebugPhase: resolved.sessionDebugPhase } : {}),
        ...(resolved.sessionObservationStatus ? { sessionObservationStatus: resolved.sessionObservationStatus } : {}),
        ...(resolved.sessionControlKey ? { sessionControlKey: resolved.sessionControlKey } : {}),
        ...(resolved.sourceBindingKey ? { sourceBindingKey: resolved.sourceBindingKey } : {}),
        ...(resolved.latestSourceBindingKey ? { latestSourceBindingKey: resolved.latestSourceBindingKey } : {}),
        ...(resolved.sourceIdentityKey ? { sourceIdentityKey: resolved.sourceIdentityKey } : {}),
        ...(resolved.latestSourceIdentityKey ? { latestSourceIdentityKey: resolved.latestSourceIdentityKey } : {}),
        ...(resolved.laneSessionSourceBindingKey
          ? { laneSessionSourceBindingKey: resolved.laneSessionSourceBindingKey }
          : {}),
        ...(resolved.laneSessionSourceIdentityKey
          ? { laneSessionSourceIdentityKey: resolved.laneSessionSourceIdentityKey }
          : {}),
        ...(resolved.latestObservationKey ? { latestObservationKey: resolved.latestObservationKey } : {}),
        ...(resolved.latestMailLoopObservationKey
          ? { latestMailLoopObservationKey: resolved.latestMailLoopObservationKey }
          : {}),
        ...(resolved.goalBindingKey ? { goalBindingKey: resolved.goalBindingKey } : {}),
        latestEventId: resolved.latestEventId,
        hasObservation: resolved.hasObservation,
        ...(resolved.selectedRuntimeAgentProvider
          ? { selectedRuntimeAgentProvider: resolved.selectedRuntimeAgentProvider }
          : {}),
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
        ...(resolved.projection?.sourceHash
          ? { sourceHash: resolved.projection.sourceHash }
          : resolved.sourceHash
            ? { sourceHash: resolved.sourceHash }
            : {}),
        sourceKind: resolved.projection?.sourceKind ?? resolved.sourceKind ?? null,
        ...(resolved.projection?.sourceTextHash
          ? { sourceTextHash: resolved.projection.sourceTextHash }
          : resolved.sourceTextHash
            ? { sourceTextHash: resolved.sourceTextHash }
            : {}),
        ...(typeof resolved.projection?.sourceTextCharCount === "number"
          ? { sourceTextCharCount: resolved.projection.sourceTextCharCount }
          : typeof resolved.sourceTextCharCount === "number"
            ? { sourceTextCharCount: resolved.sourceTextCharCount }
            : {}),
        accountLocale: resolved.projection?.accountLocale ?? resolved.accountLocale ?? null,
        projectionTarget: resolved.projectionTarget,
        targetLanguage: resolved.targetLanguage,
        cancelRequested: resolved.projection?.cancelRequested ?? resolved.status === "cancelled",
        contextRole: "tool_evidence",
        answerAuthority: false,
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
      ...(resolved.sessionDebugPhase ? { sessionDebugPhase: resolved.sessionDebugPhase } : {}),
      ...(resolved.sessionObservationStatus ? { sessionObservationStatus: resolved.sessionObservationStatus } : {}),
      ...(resolved.sessionControlKey ? { sessionControlKey: resolved.sessionControlKey } : {}),
      ...(resolved.sourceBindingKey ? { sourceBindingKey: resolved.sourceBindingKey } : {}),
      ...(resolved.latestSourceBindingKey ? { latestSourceBindingKey: resolved.latestSourceBindingKey } : {}),
      ...(resolved.sourceIdentityKey ? { sourceIdentityKey: resolved.sourceIdentityKey } : {}),
      ...(resolved.latestSourceIdentityKey ? { latestSourceIdentityKey: resolved.latestSourceIdentityKey } : {}),
      ...(resolved.laneSessionSourceBindingKey
        ? { laneSessionSourceBindingKey: resolved.laneSessionSourceBindingKey }
        : {}),
      ...(resolved.laneSessionSourceIdentityKey
        ? { laneSessionSourceIdentityKey: resolved.laneSessionSourceIdentityKey }
        : {}),
      ...(resolved.latestObservationKey ? { latestObservationKey: resolved.latestObservationKey } : {}),
      ...(resolved.latestMailLoopObservationKey
        ? { latestMailLoopObservationKey: resolved.latestMailLoopObservationKey }
        : {}),
      ...(resolved.goalBindingKey ? { goalBindingKey: resolved.goalBindingKey } : {}),
      latestEventId: resolved.latestEventId,
      hasObservation: resolved.hasObservation,
      ...(resolved.selectedRuntimeAgentProvider
        ? { selectedRuntimeAgentProvider: resolved.selectedRuntimeAgentProvider }
        : {}),
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
      ...(resolved.projection?.sourceHash
        ? { sourceHash: resolved.projection.sourceHash }
        : resolved.sourceHash
          ? { sourceHash: resolved.sourceHash }
          : {}),
      sourceKind: resolved.projection?.sourceKind ?? resolved.sourceKind ?? null,
      ...(resolved.projection?.sourceTextHash
        ? { sourceTextHash: resolved.projection.sourceTextHash }
        : resolved.sourceTextHash
          ? { sourceTextHash: resolved.sourceTextHash }
          : {}),
      ...(typeof resolved.projection?.sourceTextCharCount === "number"
        ? { sourceTextCharCount: resolved.projection.sourceTextCharCount }
        : typeof resolved.sourceTextCharCount === "number"
          ? { sourceTextCharCount: resolved.sourceTextCharCount }
          : {}),
      accountLocale: resolved.projection?.accountLocale ?? resolved.accountLocale ?? null,
      projectionTarget: resolved.projectionTarget,
      targetLanguage: resolved.targetLanguage,
      cancelRequested: resolved.projection?.cancelRequested ?? resolved.status === "cancelled",
      contextRole: "tool_evidence",
      answerAuthority: false,
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    };
  }
  return next;
}
