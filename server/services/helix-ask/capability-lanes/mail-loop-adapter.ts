import type { StagePlayLiveSourceMailItemV1 } from "@shared/contracts/stage-play-live-source-mail.v1";
import type { HelixCapabilityLaneMailLoopDebugSummary } from "@shared/helix-capability-lane-mail-loop";
import { HELIX_CAPABILITY_LANE_MAIL_LOOP_DEBUG_SUMMARY_SCHEMA } from "@shared/helix-capability-lane-mail-loop";
import type { HelixLiveTranslationOneShotResult } from "@shared/helix-live-translation-lane";
import {
  enqueueStagePlayLiveSourceMailItem,
  getStagePlayLiveSourceMailItemForEvidenceRef,
} from "../../stage-play/stage-play-live-source-mailbox-store";
import type { HelixCapabilityLaneSessionStore } from "./session-manager";

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const readReceiptRef = (translationResult: HelixLiveTranslationOneShotResult): string | null => {
  const traceRef = readString(translationResult.lane_resolve_trace.receipt_ref);
  if (traceRef) return traceRef;
  const packetReceipt = translationResult.observation_packet.receipts.find((receipt) =>
    readString(receipt.receipt_ref));
  return packetReceipt ? readString(packetReceipt.receipt_ref) : null;
};

const sourceKindForProjectionTarget = (
  projectionTarget: string,
): StagePlayLiveSourceMailItemV1["sourceKind"] => {
  if (projectionTarget === "audio_chunk") return "audio_transcript";
  if (
    projectionTarget === "docs_chunk" ||
    projectionTarget === "docs_hover" ||
    projectionTarget === "docs_selection" ||
    projectionTarget === "account_language"
  ) {
    return "document_markdown";
  }
  return "custom";
};

const freshnessFor = (
  freshnessStatus: string,
): NonNullable<StagePlayLiveSourceMailItemV1["hints"]["sourceFreshness"]> => {
  if (freshnessStatus === "fresh" || freshnessStatus === "stale") return freshnessStatus;
  return "unknown";
};

const languageMatches = (candidate: string | null | undefined, expected: string | null | undefined): boolean => {
  const normalizedCandidate = readString(candidate).toLowerCase();
  const normalizedExpected = readString(expected).toLowerCase();
  if (!normalizedCandidate || !normalizedExpected) return true;
  return normalizedCandidate === normalizedExpected ||
    normalizedCandidate.startsWith(`${normalizedExpected}-`) ||
    normalizedExpected.startsWith(`${normalizedCandidate}-`);
};

const targetLanguageForSession = (
  session: NonNullable<ReturnType<HelixCapabilityLaneSessionStore["get"]>>,
): string | null =>
  readString(session.source_binding.target_language) ||
  readString(session.source_binding.account_locale).split("-")[0] ||
  null;

const sessionBindingSnapshot = (
  session: NonNullable<ReturnType<HelixCapabilityLaneSessionStore["get"]>> | null,
) => ({
  sourceId: session?.source_binding.source_id ?? null,
  sourceHash: session?.source_binding.source_hash ?? null,
  sourceTextHash: session?.source_binding.source_text_hash ?? null,
  sourceTextCharCount: session?.source_binding.source_text_char_count ?? null,
  projectionTarget: session?.source_binding.projection_target ?? null,
  targetLanguage: session ? targetLanguageForSession(session) : null,
  accountLocale: session?.source_binding.account_locale ?? null,
});

const compactKey = (parts: Array<string | null | undefined>): string | null => {
  const key = parts
    .map((part) => typeof part === "string" ? part.trim() : "")
    .filter(Boolean)
    .join("::");
  return key || null;
};

const sessionBindingKeyFor = (
  binding: ReturnType<typeof sessionBindingSnapshot> | null | undefined,
): string | null =>
  compactKey([
    binding?.sourceId,
    binding?.sourceHash,
    binding?.projectionTarget,
    binding?.accountLocale,
    binding?.targetLanguage,
  ]);

const sessionControlKeyFor = (
  laneSessionId: string,
  binding: ReturnType<typeof sessionBindingSnapshot> | null | undefined,
): string | null =>
  compactKey([
    laneSessionId,
    sessionBindingKeyFor(binding),
  ]);

export type HelixCapabilityLaneMailLoopResult = {
  schema: "helix.capability_lane.mail_loop_result.v1";
  ok: boolean;
  lane_session_id: string;
  lane_id: "live_translation";
  observation_ref: string | null;
  mail: StagePlayLiveSourceMailItemV1 | null;
  stage_play_mail_id: string | null;
  stage_play_wake_expected: boolean;
  debug_summary: HelixCapabilityLaneMailLoopDebugSummary;
  blocked_reason: string | null;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

const buildMailLoopDebugSummary = (input: {
  laneSessionId: string;
  translationResult: HelixLiveTranslationOneShotResult;
  threadId: string;
  observationRef: string | null;
  mail: StagePlayLiveSourceMailItemV1 | null;
  previousMail: StagePlayLiveSourceMailItemV1 | null;
  blockedReason: string | null;
  stagePlayWakeExpected: boolean;
  accountLocale?: string | null;
  sessionBinding?: ReturnType<typeof sessionBindingSnapshot> | null;
}): HelixCapabilityLaneMailLoopDebugSummary => {
  const observation = input.translationResult.observation;
  const packet = input.translationResult.observation_packet;
  const chunk = readRecord(packet.state_delta?.live_translation_chunk);
  const projectionReceipt = readRecord(packet.state_delta?.live_translation_projection_receipt);
  const projectionTarget = readString(observation?.projection_target) || readString(chunk?.projection_target);
  const receiptRef = readReceiptRef(input.translationResult);
  const evidenceRefs = input.mail?.evidenceRefs ?? input.translationResult.artifact_refs ?? [];
  const materializedMailLoopEvidence = Boolean(input.mail?.mailId && !input.blockedReason);
  const sourceId = readString(observation?.source_id) || readString(chunk?.source_id) || input.mail?.sourceId || null;
  const sourceHash = readString(observation?.source_hash) || readString(chunk?.source_hash) || null;
  const targetLanguage = readString(observation?.target_language) || readString(chunk?.target_language) || null;
  const chunkId = readString(observation?.chunk_id) || readString(chunk?.chunk_id) || null;
  return {
    schema: HELIX_CAPABILITY_LANE_MAIL_LOOP_DEBUG_SUMMARY_SCHEMA,
    lane_session_id: input.laneSessionId,
    lane_id: "live_translation",
    capability: input.translationResult.capability,
    observation_ref: input.observationRef,
    receipt_ref: receiptRef,
    stage_play_mail_id: input.mail?.mailId ?? null,
    stage_play_mail_delivery_status: input.blockedReason
      ? "blocked"
      : input.previousMail && input.mail?.mailId === input.previousMail.mailId
        ? "deduped_existing"
        : input.mail
          ? "created"
          : "blocked",
    materialized_mail_loop_evidence: materializedMailLoopEvidence,
    previous_stage_play_mail_id: input.previousMail?.mailId ?? input.mail?.priorContext.previousMailId ?? null,
    stage_play_wake_expected: input.stagePlayWakeExpected,
    stage_play_wake_kind: input.stagePlayWakeExpected ? "mailbox_wake" : "none",
    mailbox_thread_id: input.threadId,
    observation_lane_session_id: readString(observation?.lane_session_id) || readString(chunk?.lane_session_id) || null,
    source_id: sourceId,
    source_hash: sourceHash,
    source_kind: input.mail?.sourceKind ?? (projectionTarget ? sourceKindForProjectionTarget(projectionTarget) : null),
    account_locale: readString(input.accountLocale) || null,
    lane_session_source_id: input.sessionBinding?.sourceId ?? null,
    lane_session_source_hash: input.sessionBinding?.sourceHash ?? null,
    lane_session_source_text_hash: input.sessionBinding?.sourceTextHash ?? null,
    lane_session_source_text_char_count: input.sessionBinding?.sourceTextCharCount ?? null,
    lane_session_projection_target: input.sessionBinding?.projectionTarget ?? null,
    lane_session_target_language: input.sessionBinding?.targetLanguage ?? null,
    lane_session_account_locale: input.sessionBinding?.accountLocale ?? null,
    lane_session_control_key: sessionControlKeyFor(input.laneSessionId, input.sessionBinding),
    lane_session_source_binding_key: sessionBindingKeyFor(input.sessionBinding),
    mail_loop_observation_key: compactKey([
      sourceId,
      sourceHash,
      projectionTarget,
      targetLanguage,
      chunkId,
      receiptRef ?? input.observationRef,
    ]),
    chunk_id: chunkId,
    chunk_index: readNumber(observation?.chunk_index) ?? readNumber(chunk?.chunk_index),
    dedupe_key: readString(observation?.dedupe_key) || readString(chunk?.dedupe_key) || null,
    source_event_id: readString(observation?.source_event_id) || readString(chunk?.source_event_id) || null,
    source_event_ms: readNumber(observation?.source_event_ms) ?? readNumber(chunk?.source_event_ms),
    observed_at_ms: readNumber(observation?.observed_at_ms) ?? readNumber(chunk?.observed_at_ms),
    projection_target: projectionTarget || null,
    target_language: targetLanguage,
    cancel_requested: observation?.cancel_requested === true || chunk?.cancel_requested === true,
    selected_backend_provider: input.translationResult.lane_resolve_trace.selected_backend_provider,
    requested_backend_provider: input.translationResult.lane_resolve_trace.requested_backend_provider,
    backend_selection_decision: input.translationResult.lane_resolve_trace.backend_selection_decision,
    cost_class: input.translationResult.lane_resolve_trace.cost_class,
    latency_class: input.translationResult.lane_resolve_trace.latency_class,
    privacy_class: input.translationResult.lane_resolve_trace.privacy_class,
    fallback_backend_provider: input.translationResult.lane_resolve_trace.fallback_backend_provider,
    freshness_status: readString(observation?.freshness_status) || readString(chunk?.freshness_status) || null,
    source_text_hash:
      readString(observation?.source_text_hash) ||
      readString(projectionReceipt?.source_text_hash) ||
      null,
    source_text_char_count:
      readNumber(observation?.source_text_char_count) ??
      readNumber(projectionReceipt?.source_text_char_count),
    blocked_reason: input.blockedReason,
    mail_status: input.mail?.status ?? null,
    evidence_refs: evidenceRefs,
    reentry_required: true,
    terminal_authority_status: input.mail ? "pending_helix_terminal_authority" : "not_terminal_authority",
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

export const routeLiveTranslationObservationToMailLoop = (input: {
  sessionStore: HelixCapabilityLaneSessionStore;
  laneSessionId: string;
  translationResult: HelixLiveTranslationOneShotResult;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  objectiveText?: string | null;
  now?: string;
}): HelixCapabilityLaneMailLoopResult => {
  const session = input.sessionStore.get(input.laneSessionId);
  if (!session) {
    const debugSummary = buildMailLoopDebugSummary({
      laneSessionId: input.laneSessionId,
      translationResult: input.translationResult,
      threadId: input.threadId,
      observationRef: null,
      mail: null,
      previousMail: null,
      blockedReason: "unknown_lane_session",
      stagePlayWakeExpected: false,
      accountLocale: null,
    });
    return {
      schema: "helix.capability_lane.mail_loop_result.v1",
      ok: false,
      lane_session_id: input.laneSessionId,
      lane_id: "live_translation",
      observation_ref: null,
      mail: null,
      stage_play_mail_id: null,
      stage_play_wake_expected: false,
      debug_summary: debugSummary,
      blocked_reason: "unknown_lane_session",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }
  if (session.status !== "running") {
    const blockedReason = `lane_session_${session.status}`;
    const debugSummary = buildMailLoopDebugSummary({
      laneSessionId: input.laneSessionId,
      translationResult: input.translationResult,
      threadId: input.threadId,
      observationRef: null,
      mail: null,
      previousMail: null,
      blockedReason,
      stagePlayWakeExpected: false,
      accountLocale: session.source_binding.account_locale,
      sessionBinding: sessionBindingSnapshot(session),
    });
    return {
      schema: "helix.capability_lane.mail_loop_result.v1",
      ok: false,
      lane_session_id: input.laneSessionId,
      lane_id: "live_translation",
      observation_ref: null,
      mail: null,
      stage_play_mail_id: null,
      stage_play_wake_expected: false,
      debug_summary: debugSummary,
      blocked_reason: blockedReason,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }

  const observation = input.translationResult.observation;
  const packet = input.translationResult.observation_packet;
  const chunk = readRecord(packet.state_delta?.live_translation_chunk);
  const projectionReceipt = readRecord(packet.state_delta?.live_translation_projection_receipt);
  const observationRef =
    readString(observation?.observation_ref) ||
    readString(chunk?.observation_ref) ||
    input.translationResult.artifact_refs[0] ||
    null;
  if (!input.translationResult.ok || !observation || !observationRef) {
    const blockedReason = input.translationResult.error ?? "translation_observation_missing";
    const debugSummary = buildMailLoopDebugSummary({
      laneSessionId: input.laneSessionId,
      translationResult: input.translationResult,
      threadId: input.threadId,
      observationRef,
      mail: null,
      previousMail: null,
      blockedReason,
      stagePlayWakeExpected: false,
      accountLocale: session.source_binding.account_locale,
      sessionBinding: sessionBindingSnapshot(session),
    });
    return {
      schema: "helix.capability_lane.mail_loop_result.v1",
      ok: false,
      lane_session_id: input.laneSessionId,
      lane_id: "live_translation",
      observation_ref: observationRef,
      mail: null,
      stage_play_mail_id: null,
      stage_play_wake_expected: false,
      debug_summary: debugSummary,
      blocked_reason: blockedReason,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }
  if (observation.lane_session_id && observation.lane_session_id !== session.lane_session_id) {
    const debugSummary = buildMailLoopDebugSummary({
      laneSessionId: input.laneSessionId,
      translationResult: input.translationResult,
      threadId: input.threadId,
      observationRef,
      mail: null,
      previousMail: null,
      blockedReason: "lane_session_mismatch",
      stagePlayWakeExpected: false,
      accountLocale: session.source_binding.account_locale,
      sessionBinding: sessionBindingSnapshot(session),
    });
    return {
      schema: "helix.capability_lane.mail_loop_result.v1",
      ok: false,
      lane_session_id: input.laneSessionId,
      lane_id: "live_translation",
      observation_ref: observationRef,
      mail: null,
      stage_play_mail_id: null,
      stage_play_wake_expected: false,
      debug_summary: debugSummary,
      blocked_reason: "lane_session_mismatch",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }
  if (observation.source_id && observation.source_id !== session.source_binding.source_id) {
    const debugSummary = buildMailLoopDebugSummary({
      laneSessionId: input.laneSessionId,
      translationResult: input.translationResult,
      threadId: input.threadId,
      observationRef,
      mail: null,
      previousMail: null,
      blockedReason: "source_id_mismatch",
      stagePlayWakeExpected: false,
      accountLocale: session.source_binding.account_locale,
      sessionBinding: sessionBindingSnapshot(session),
    });
    return {
      schema: "helix.capability_lane.mail_loop_result.v1",
      ok: false,
      lane_session_id: input.laneSessionId,
      lane_id: "live_translation",
      observation_ref: observationRef,
      mail: null,
      stage_play_mail_id: null,
      stage_play_wake_expected: false,
      debug_summary: debugSummary,
      blocked_reason: "source_id_mismatch",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }
  if (
    observation.source_hash &&
    session.source_binding.source_hash &&
    observation.source_hash !== session.source_binding.source_hash
  ) {
    const debugSummary = buildMailLoopDebugSummary({
      laneSessionId: input.laneSessionId,
      translationResult: input.translationResult,
      threadId: input.threadId,
      observationRef,
      mail: null,
      previousMail: null,
      blockedReason: "source_hash_mismatch",
      stagePlayWakeExpected: false,
      accountLocale: session.source_binding.account_locale,
      sessionBinding: sessionBindingSnapshot(session),
    });
    return {
      schema: "helix.capability_lane.mail_loop_result.v1",
      ok: false,
      lane_session_id: input.laneSessionId,
      lane_id: "live_translation",
      observation_ref: observationRef,
      mail: null,
      stage_play_mail_id: null,
      stage_play_wake_expected: false,
      debug_summary: debugSummary,
      blocked_reason: "source_hash_mismatch",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }
  const observationSourceTextHash =
    readString(observation.source_text_hash) ||
    readString(projectionReceipt?.source_text_hash);
  if (
    observationSourceTextHash &&
    session.source_binding.source_text_hash &&
    observationSourceTextHash !== session.source_binding.source_text_hash
  ) {
    const debugSummary = buildMailLoopDebugSummary({
      laneSessionId: input.laneSessionId,
      translationResult: input.translationResult,
      threadId: input.threadId,
      observationRef,
      mail: null,
      previousMail: null,
      blockedReason: "source_text_hash_mismatch",
      stagePlayWakeExpected: false,
      accountLocale: session.source_binding.account_locale,
      sessionBinding: sessionBindingSnapshot(session),
    });
    return {
      schema: "helix.capability_lane.mail_loop_result.v1",
      ok: false,
      lane_session_id: input.laneSessionId,
      lane_id: "live_translation",
      observation_ref: observationRef,
      mail: null,
      stage_play_mail_id: null,
      stage_play_wake_expected: false,
      debug_summary: debugSummary,
      blocked_reason: "source_text_hash_mismatch",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }
  const observationSourceTextCharCount =
    readNumber(observation.source_text_char_count) ??
    readNumber(projectionReceipt?.source_text_char_count);
  if (
    typeof observationSourceTextCharCount === "number" &&
    typeof session.source_binding.source_text_char_count === "number" &&
    observationSourceTextCharCount !== session.source_binding.source_text_char_count
  ) {
    const debugSummary = buildMailLoopDebugSummary({
      laneSessionId: input.laneSessionId,
      translationResult: input.translationResult,
      threadId: input.threadId,
      observationRef,
      mail: null,
      previousMail: null,
      blockedReason: "source_text_char_count_mismatch",
      stagePlayWakeExpected: false,
      accountLocale: session.source_binding.account_locale,
      sessionBinding: sessionBindingSnapshot(session),
    });
    return {
      schema: "helix.capability_lane.mail_loop_result.v1",
      ok: false,
      lane_session_id: input.laneSessionId,
      lane_id: "live_translation",
      observation_ref: observationRef,
      mail: null,
      stage_play_mail_id: null,
      stage_play_wake_expected: false,
      debug_summary: debugSummary,
      blocked_reason: "source_text_char_count_mismatch",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }
  if (
    observation.projection_target &&
    session.source_binding.projection_target &&
    observation.projection_target !== session.source_binding.projection_target
  ) {
    const debugSummary = buildMailLoopDebugSummary({
      laneSessionId: input.laneSessionId,
      translationResult: input.translationResult,
      threadId: input.threadId,
      observationRef,
      mail: null,
      previousMail: null,
      blockedReason: "projection_target_mismatch",
      stagePlayWakeExpected: false,
      accountLocale: session.source_binding.account_locale,
      sessionBinding: sessionBindingSnapshot(session),
    });
    return {
      schema: "helix.capability_lane.mail_loop_result.v1",
      ok: false,
      lane_session_id: input.laneSessionId,
      lane_id: "live_translation",
      observation_ref: observationRef,
      mail: null,
      stage_play_mail_id: null,
      stage_play_wake_expected: false,
      debug_summary: debugSummary,
      blocked_reason: "projection_target_mismatch",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }
  if (!languageMatches(observation.target_language, targetLanguageForSession(session))) {
    const debugSummary = buildMailLoopDebugSummary({
      laneSessionId: input.laneSessionId,
      translationResult: input.translationResult,
      threadId: input.threadId,
      observationRef,
      mail: null,
      previousMail: null,
      blockedReason: "target_language_mismatch",
      stagePlayWakeExpected: false,
      accountLocale: session.source_binding.account_locale,
      sessionBinding: sessionBindingSnapshot(session),
    });
    return {
      schema: "helix.capability_lane.mail_loop_result.v1",
      ok: false,
      lane_session_id: input.laneSessionId,
      lane_id: "live_translation",
      observation_ref: observationRef,
      mail: null,
      stage_play_mail_id: null,
      stage_play_wake_expected: false,
      debug_summary: debugSummary,
      blocked_reason: "target_language_mismatch",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }

  const projectionTarget = observation.projection_target;
  const sourceId = observation.source_id || session.source_binding.source_id;
  const sourceHash = observation.source_hash || session.source_binding.source_hash || null;
  const chunkId = observation.chunk_id;
  const translated = observation.translated_text;
  const bindingSnapshot = sessionBindingSnapshot(session);
  const laneSessionControlKey = sessionControlKeyFor(input.laneSessionId, bindingSnapshot);
  const laneSessionSourceBindingKey = sessionBindingKeyFor(bindingSnapshot);
  const receiptRef = readReceiptRef(input.translationResult);
  const mailLoopObservationKey = compactKey([
    sourceId,
    sourceHash,
    projectionTarget,
    observation.target_language,
    chunkId,
    receiptRef ?? observationRef,
  ]);
  const summaryText = [
    `Capability lane live_translation produced ${observation.source_language ?? "auto"} -> ${observation.target_language}.`,
    `Lane session: ${session.lane_session_id}.`,
    `Projection target: ${projectionTarget}.`,
    `Chunk: ${chunkId}.`,
    `Translation: ${translated}`,
  ].join(" ");
  const evidenceRefs = [
    session.lane_session_id,
    sourceId,
    sourceHash,
    chunkId,
    observation.source_event_id,
    observationRef,
    readReceiptRef(input.translationResult),
    input.translationResult.lane_resolve_trace.selected_backend_provider,
    input.translationResult.lane_resolve_trace.requested_backend_provider,
  ].filter((value): value is string => Boolean(value));
  const previousMail = observationRef
    ? getStagePlayLiveSourceMailItemForEvidenceRef(observationRef)
    : null;

  const mail = enqueueStagePlayLiveSourceMailItem({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceId,
    sourceKind: sourceKindForProjectionTarget(projectionTarget),
    evidenceRef: observationRef,
    observationRef,
    sourceHash,
    chunkId,
    chunkIndex: observation.chunk_index,
    dedupeKey: observation.dedupe_key,
    sourceEventId: observation.source_event_id,
    sourceEventMs: observation.source_event_ms,
    projectionTarget,
    targetLanguage: observation.target_language,
    accountLocale: session.source_binding.account_locale,
    laneSessionId: session.lane_session_id,
    sessionControlKey: laneSessionControlKey,
    sourceBindingKey: laneSessionSourceBindingKey,
    mailLoopObservationKey,
    summaryText,
    summaryPreview: translated,
    confidence: observation.confidence,
    analysisState: "analysis_ready",
    objectiveText: input.objectiveText ?? null,
    deterministicChangeHint: observation.freshness_status === "stale" ? "source_stale" : "summary_changed",
    sourceFreshness: freshnessFor(observation.freshness_status),
    evidenceRefs,
    createdAt: input.now,
  });
  input.sessionStore.recordObservation({
    laneSessionId: input.laneSessionId,
    observationRef: mail.mailId,
    receiptRef,
    nowMs: input.now ? Date.parse(input.now) : undefined,
    sourceId,
    sourceHash,
    sourceKind: session.source_binding.source_kind,
    targetLanguage: observation.target_language,
    chunkId: observation.chunk_id,
    chunkIndex: observation.chunk_index,
    dedupeKey: observation.dedupe_key,
    sourceEventId: observation.source_event_id,
    sourceEventMs: observation.source_event_ms,
    observedAtMs: observation.observed_at_ms,
    freshnessStatus: observation.freshness_status,
    sourceTextHash:
      readString(observation.source_text_hash) ||
      readString(projectionReceipt?.source_text_hash) ||
      null,
    sourceTextCharCount:
      readNumber(observation.source_text_char_count) ??
      readNumber(projectionReceipt?.source_text_char_count),
    projectionTarget: observation.projection_target,
    cancelRequested: observation.cancel_requested,
  });
  const stagePlayWakeExpected = mail.status === "unread";
  const debugSummary = buildMailLoopDebugSummary({
    laneSessionId: input.laneSessionId,
    translationResult: input.translationResult,
    threadId: input.threadId,
    observationRef,
    mail,
    previousMail,
    blockedReason: null,
    stagePlayWakeExpected,
    accountLocale: session.source_binding.account_locale,
    sessionBinding: sessionBindingSnapshot(session),
  });

  return {
    schema: "helix.capability_lane.mail_loop_result.v1",
    ok: true,
    lane_session_id: input.laneSessionId,
    lane_id: "live_translation",
    observation_ref: observationRef,
    mail,
    stage_play_mail_id: mail.mailId,
    stage_play_wake_expected: stagePlayWakeExpected,
    debug_summary: debugSummary,
    blocked_reason: null,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};
