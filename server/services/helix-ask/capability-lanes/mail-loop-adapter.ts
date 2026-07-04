import type { StagePlayLiveSourceMailItemV1 } from "@shared/contracts/stage-play-live-source-mail.v1";
import type { HelixCapabilityLaneMailLoopDebugSummary } from "@shared/helix-capability-lane-mail-loop";
import { HELIX_CAPABILITY_LANE_MAIL_LOOP_DEBUG_SUMMARY_SCHEMA } from "@shared/helix-capability-lane-mail-loop";
import type { HelixLiveTranslationOneShotResult } from "@shared/helix-live-translation-lane";
import {
  HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_UNKNOWN,
  normalizeHelixLiveTranslationProjectionTarget,
} from "@shared/helix-live-translation-projection-target";
import {
  normalizeHelixLiveTranslationSourceIdentityKey,
  normalizeHelixLiveTranslationSourceKind,
} from "@shared/helix-live-translation-source-kind";
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

const normalizeProjectionTargetText = (value: unknown): string => {
  const text = readString(value).toLowerCase();
  if (!text) return "";
  const canonical = normalizeHelixLiveTranslationProjectionTarget(
    text,
    HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_UNKNOWN,
  );
  return canonical === HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_UNKNOWN &&
    text !== HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_UNKNOWN
    ? text
    : canonical;
};

const normalizeSourceKindText = (value: unknown): string =>
  normalizeHelixLiveTranslationSourceKind(value, "");

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const readTimestampMs = (value: unknown): number | undefined => {
  const raw = readString(value);
  if (!raw) return undefined;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
};

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
  const normalizedProjectionTarget = normalizeProjectionTargetText(projectionTarget);
  if (normalizedProjectionTarget === "audio_chunk") return "audio_transcript";
  if (
    normalizedProjectionTarget === "docs_chunk" ||
    normalizedProjectionTarget === "docs_hover" ||
    normalizedProjectionTarget === "docs_selection" ||
    normalizedProjectionTarget === "account_language"
  ) {
    return "document_markdown";
  }
  return "custom";
};

const sourceKindForSessionOrProjectionTarget = (
  sessionSourceKind: unknown,
  projectionTarget: string,
): StagePlayLiveSourceMailItemV1["sourceKind"] => {
  const normalizedSourceKind = normalizeSourceKindText(sessionSourceKind);
  if (
    normalizedSourceKind === "docs" ||
    normalizedSourceKind === "docs_hover" ||
    normalizedSourceKind === "docs_selection"
  ) {
    return "document_markdown";
  }
  if (normalizedSourceKind === "audio") return "audio_transcript";
  if (normalizedSourceKind === "visual") return "visual_frame";
  if (normalizedSourceKind === "custom") return "custom";
  return sourceKindForProjectionTarget(projectionTarget);
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
  sourceBindingKey: session?.source_binding.source_binding_key ?? null,
  sourceTextHash: session?.source_binding.source_text_hash ?? null,
  sourceTextCharCount: session?.source_binding.source_text_char_count ?? null,
  sourceIdentityKey: session?.source_binding.source_identity_key ?? null,
  sourceKind: normalizeSourceKindText(session?.source_binding.source_kind) || null,
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
  readString(binding?.sourceBindingKey) ||
  compactKey([
    binding?.sourceId,
    binding?.sourceHash,
    binding?.projectionTarget,
    binding?.accountLocale,
    binding?.targetLanguage,
  ]);

const sessionIdentityKeyFor = (
  binding: ReturnType<typeof sessionBindingSnapshot> | null | undefined,
): string | null =>
  readString(binding?.sourceIdentityKey) ||
  compactKey([
    binding?.sourceId,
    binding?.sourceHash,
    binding?.sourceTextHash,
    typeof binding?.sourceTextCharCount === "number" ? String(binding.sourceTextCharCount) : null,
    normalizeSourceKindText(binding?.sourceKind) || null,
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

const explicitSourceBindingKeyFor = (
  observation: HelixLiveTranslationOneShotResult["observation"],
  chunk: Record<string, unknown> | null,
  projectionReceipt: Record<string, unknown> | null,
): string =>
  readString(observation?.source_binding_key) ||
  readString(chunk?.source_binding_key) ||
  readString(projectionReceipt?.source_binding_key);

const explicitSourceIdentityKeyFor = (
  observation: HelixLiveTranslationOneShotResult["observation"],
  chunk: Record<string, unknown> | null,
  projectionReceipt: Record<string, unknown> | null,
): string =>
  readString(observation?.source_identity_key) ||
  readString(chunk?.source_identity_key) ||
  readString(projectionReceipt?.source_identity_key);

const explicitLatestSourceIdentityKeyFor = (
  observation: HelixLiveTranslationOneShotResult["observation"],
  chunk: Record<string, unknown> | null,
  projectionReceipt: Record<string, unknown> | null,
): string =>
  readString(observation?.latest_source_identity_key) ||
  readString((observation as Record<string, unknown> | null)?.latestSourceIdentityKey) ||
  readString(chunk?.latest_source_identity_key) ||
  readString(chunk?.latestSourceIdentityKey) ||
  readString(projectionReceipt?.latest_source_identity_key) ||
  readString(projectionReceipt?.latestSourceIdentityKey) ||
  explicitSourceIdentityKeyFor(observation, chunk, projectionReceipt);

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
  context_role: "tool_evidence";
  answer_authority: false;
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
  const projectionTarget = normalizeProjectionTargetText(
    readString(observation?.projection_target) || readString(chunk?.projection_target),
  );
  const receiptRef = readReceiptRef(input.translationResult);
  const materializedMailLoopEvidence = Boolean(input.mail?.mailId && !input.blockedReason);
  const sourceId = readString(observation?.source_id) || readString(chunk?.source_id) || input.mail?.sourceId || null;
  const sourceHash = readString(observation?.source_hash) || readString(chunk?.source_hash) || null;
  const targetLanguage =
    readString(observation?.target_language) ||
    readString(chunk?.target_language) ||
    readString(projectionReceipt?.target_language) ||
    null;
  const chunkId = readString(observation?.chunk_id) || readString(chunk?.chunk_id) || null;
  const sourceKind = normalizeSourceKindText(
    input.mail?.sourceKind ?? (projectionTarget ? sourceKindForProjectionTarget(projectionTarget) : null),
  ) || null;
  const sourceTextHash =
    readString(observation?.source_text_hash) ||
    readString(projectionReceipt?.source_text_hash) ||
    null;
  const sourceTextCharCount =
    readNumber(observation?.source_text_char_count) ??
    readNumber(projectionReceipt?.source_text_char_count);
  const explicitSourceIdentityKey = explicitSourceIdentityKeyFor(
    observation,
    chunk,
    projectionReceipt,
  );
  const latestSourceIdentityKey =
    explicitLatestSourceIdentityKeyFor(observation, chunk, projectionReceipt) ||
    explicitSourceIdentityKey ||
    sessionIdentityKeyFor(input.sessionBinding);
  const sourceEventId = readString(observation?.source_event_id) || readString(chunk?.source_event_id) || null;
  const evidenceRefs = Array.from(new Set([
    ...(input.mail?.evidenceRefs ?? input.translationResult.artifact_refs ?? []),
    receiptRef,
    sourceId,
    sourceHash,
    chunkId,
    sourceEventId,
  ].filter((value): value is string => Boolean(value))));
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
    mailbox_wake_expected: input.stagePlayWakeExpected,
    decision_wake_expected: false,
    mailbox_thread_id: input.threadId,
    observation_lane_session_id: readString(observation?.lane_session_id) || readString(chunk?.lane_session_id) || null,
    source_id: sourceId,
    source_hash: sourceHash,
    source_kind: sourceKind,
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
    lane_session_source_identity_key: sessionIdentityKeyFor(input.sessionBinding),
    source_identity_key: explicitSourceIdentityKey || compactKey([
      sourceId,
      sourceHash,
      sourceTextHash,
      typeof sourceTextCharCount === "number" ? String(sourceTextCharCount) : null,
      sourceKind,
      projectionTarget,
      readString(input.accountLocale) || null,
      targetLanguage,
    ]),
    latest_source_identity_key: latestSourceIdentityKey,
    mail_loop_observation_key: compactKey([
      sourceId,
      sourceHash,
      sourceKind,
      projectionTarget,
      readString(input.accountLocale) || null,
      targetLanguage,
      chunkId,
      receiptRef ?? input.observationRef,
    ]),
    chunk_id: chunkId,
    chunk_index: readNumber(observation?.chunk_index) ?? readNumber(chunk?.chunk_index),
    dedupe_key: readString(observation?.dedupe_key) || readString(chunk?.dedupe_key) || null,
    source_event_id: sourceEventId,
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
    source_text_hash: sourceTextHash,
    source_text_char_count: sourceTextCharCount,
    blocked_reason: input.blockedReason,
    mail_status: input.mail?.status ?? null,
    evidence_refs: evidenceRefs,
    reentry_required: true,
    terminal_authority_status: input.mail ? "pending_helix_terminal_authority" : "not_terminal_authority",
    context_role: "tool_evidence",
    answer_authority: false,
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
      context_role: "tool_evidence",
      answer_authority: false,
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
      context_role: "tool_evidence",
      answer_authority: false,
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
      context_role: "tool_evidence",
      answer_authority: false,
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
      context_role: "tool_evidence",
      answer_authority: false,
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
      context_role: "tool_evidence",
      answer_authority: false,
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
      context_role: "tool_evidence",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }
  if (
    normalizeSourceKindText(observation.source_kind) &&
    normalizeSourceKindText(observation.source_kind) !== "unknown" &&
    session.source_binding.source_kind &&
    session.source_binding.source_kind !== "unknown" &&
    normalizeSourceKindText(observation.source_kind) !==
      normalizeSourceKindText(session.source_binding.source_kind)
  ) {
    const debugSummary = buildMailLoopDebugSummary({
      laneSessionId: input.laneSessionId,
      translationResult: input.translationResult,
      threadId: input.threadId,
      observationRef,
      mail: null,
      previousMail: null,
      blockedReason: "source_kind_mismatch",
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
      blocked_reason: "source_kind_mismatch",
      context_role: "tool_evidence",
      answer_authority: false,
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
      context_role: "tool_evidence",
      answer_authority: false,
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
      context_role: "tool_evidence",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }
  if (
    normalizeProjectionTargetText(observation.projection_target) &&
    session.source_binding.projection_target &&
    normalizeProjectionTargetText(observation.projection_target) !==
      normalizeProjectionTargetText(session.source_binding.projection_target)
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
      context_role: "tool_evidence",
      answer_authority: false,
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
      context_role: "tool_evidence",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }
  if (
    observation.account_locale &&
    session.source_binding.account_locale &&
    observation.account_locale.toLowerCase() !== session.source_binding.account_locale.toLowerCase()
  ) {
    const debugSummary = buildMailLoopDebugSummary({
      laneSessionId: input.laneSessionId,
      translationResult: input.translationResult,
      threadId: input.threadId,
      observationRef,
      mail: null,
      previousMail: null,
      blockedReason: "account_locale_mismatch",
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
      blocked_reason: "account_locale_mismatch",
      context_role: "tool_evidence",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }

  const bindingSnapshot = sessionBindingSnapshot(session);
  const explicitSourceBindingKey = explicitSourceBindingKeyFor(
    observation,
    chunk,
    projectionReceipt,
  );
  const laneSessionSourceBindingKey = sessionBindingKeyFor(bindingSnapshot);
  if (
    explicitSourceBindingKey &&
    laneSessionSourceBindingKey &&
    explicitSourceBindingKey !== laneSessionSourceBindingKey
  ) {
    const debugSummary = buildMailLoopDebugSummary({
      laneSessionId: input.laneSessionId,
      translationResult: input.translationResult,
      threadId: input.threadId,
      observationRef,
      mail: null,
      previousMail: null,
      blockedReason: "source_binding_key_mismatch",
      stagePlayWakeExpected: false,
      accountLocale: session.source_binding.account_locale,
      sessionBinding: bindingSnapshot,
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
      blocked_reason: "source_binding_key_mismatch",
      context_role: "tool_evidence",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }

  const explicitSourceIdentityKey = normalizeHelixLiveTranslationSourceIdentityKey(explicitSourceIdentityKeyFor(
    observation,
    chunk,
    projectionReceipt,
  ));
  const laneSessionSourceIdentityKey = normalizeHelixLiveTranslationSourceIdentityKey(
    sessionIdentityKeyFor(bindingSnapshot),
  );
  if (
    explicitSourceIdentityKey &&
    laneSessionSourceIdentityKey &&
    explicitSourceIdentityKey !== laneSessionSourceIdentityKey
  ) {
    const debugSummary = buildMailLoopDebugSummary({
      laneSessionId: input.laneSessionId,
      translationResult: input.translationResult,
      threadId: input.threadId,
      observationRef,
      mail: null,
      previousMail: null,
      blockedReason: "source_identity_key_mismatch",
      stagePlayWakeExpected: false,
      accountLocale: session.source_binding.account_locale,
      sessionBinding: bindingSnapshot,
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
      blocked_reason: "source_identity_key_mismatch",
      context_role: "tool_evidence",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }

  const projectionTarget = normalizeProjectionTargetText(observation.projection_target);
  const mailSourceKind = sourceKindForSessionOrProjectionTarget(
    session.source_binding.source_kind,
    projectionTarget,
  );
  const sourceId = observation.source_id || session.source_binding.source_id;
  const sourceHash = observation.source_hash || session.source_binding.source_hash || null;
  const sourceTextHash =
    readString(observation.source_text_hash) ||
    readString(projectionReceipt?.source_text_hash) ||
    session.source_binding.source_text_hash ||
    null;
  const sourceTextCharCount =
    readNumber(observation.source_text_char_count) ??
    readNumber(projectionReceipt?.source_text_char_count) ??
    session.source_binding.source_text_char_count ??
    null;
  const chunkId = observation.chunk_id;
  const translated = observation.translated_text;
  const laneSessionControlKey = sessionControlKeyFor(input.laneSessionId, bindingSnapshot);
  const receiptRef = readReceiptRef(input.translationResult);
  const mailLoopObservationKey = compactKey([
    sourceId,
    sourceHash,
    normalizeSourceKindText(mailSourceKind) || null,
    projectionTarget,
    session.source_binding.account_locale,
    observation.target_language,
    chunkId,
    receiptRef ?? observationRef,
  ]);
  const sourceIdentityKey = compactKey([
    sourceId,
    sourceHash,
    sourceTextHash,
    typeof sourceTextCharCount === "number" ? String(sourceTextCharCount) : null,
    normalizeSourceKindText(mailSourceKind) || null,
    projectionTarget,
    session.source_binding.account_locale,
    observation.target_language,
  ]);
  const latestSourceIdentityKey = normalizeHelixLiveTranslationSourceIdentityKey(explicitLatestSourceIdentityKeyFor(
    observation,
    chunk,
    projectionReceipt,
  )) || sourceIdentityKey;
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
    sourceKind: mailSourceKind,
    evidenceRef: observationRef,
    observationRef,
    receiptRef,
    sourceHash,
    sourceTextHash,
    sourceTextCharCount,
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
    sourceIdentityKey,
    latestSourceIdentityKey,
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
    nowMs: readTimestampMs(input.now),
    sourceId,
    sourceHash,
    sourceBindingKey: laneSessionSourceBindingKey,
    sourceKind: session.source_binding.source_kind,
    accountLocale: session.source_binding.account_locale,
    targetLanguage: observation.target_language,
    chunkId: observation.chunk_id,
    chunkIndex: observation.chunk_index,
    dedupeKey: observation.dedupe_key,
    sourceEventId: observation.source_event_id,
    sourceEventMs: observation.source_event_ms,
    observedAtMs: observation.observed_at_ms,
    freshnessStatus: observation.freshness_status,
    sourceTextHash,
    sourceTextCharCount,
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
    context_role: "tool_evidence",
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};
