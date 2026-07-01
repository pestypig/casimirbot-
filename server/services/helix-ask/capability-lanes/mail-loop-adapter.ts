import type { StagePlayLiveSourceMailItemV1 } from "@shared/contracts/stage-play-live-source-mail.v1";
import type { HelixCapabilityLaneMailLoopDebugSummary } from "@shared/helix-capability-lane-mail-loop";
import { HELIX_CAPABILITY_LANE_MAIL_LOOP_DEBUG_SUMMARY_SCHEMA } from "@shared/helix-capability-lane-mail-loop";
import type { HelixLiveTranslationOneShotResult } from "@shared/helix-live-translation-lane";
import { enqueueStagePlayLiveSourceMailItem } from "../../stage-play/stage-play-live-source-mailbox-store";
import type { HelixCapabilityLaneSessionStore } from "./session-manager";

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

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
  blockedReason: string | null;
  stagePlayWakeExpected: boolean;
}): HelixCapabilityLaneMailLoopDebugSummary => {
  const observation = input.translationResult.observation;
  const packet = input.translationResult.observation_packet;
  const chunk = readRecord(packet.state_delta?.live_translation_chunk);
  const evidenceRefs = input.mail?.evidenceRefs ?? input.translationResult.artifact_refs ?? [];
  return {
    schema: HELIX_CAPABILITY_LANE_MAIL_LOOP_DEBUG_SUMMARY_SCHEMA,
    lane_session_id: input.laneSessionId,
    lane_id: "live_translation",
    capability: input.translationResult.capability,
    observation_ref: input.observationRef,
    stage_play_mail_id: input.mail?.mailId ?? null,
    stage_play_wake_expected: input.stagePlayWakeExpected,
    mailbox_thread_id: input.threadId,
    source_id: readString(observation?.source_id) || readString(chunk?.source_id) || input.mail?.sourceId || null,
    source_kind: input.mail?.sourceKind ?? null,
    chunk_id: readString(observation?.chunk_id) || readString(chunk?.chunk_id) || null,
    projection_target: readString(observation?.projection_target) || readString(chunk?.projection_target) || null,
    selected_backend_provider: input.translationResult.lane_resolve_trace.selected_backend_provider,
    requested_backend_provider: input.translationResult.lane_resolve_trace.requested_backend_provider,
    backend_selection_decision: input.translationResult.lane_resolve_trace.backend_selection_decision,
    freshness_status: readString(observation?.freshness_status) || readString(chunk?.freshness_status) || null,
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
      blockedReason: "unknown_lane_session",
      stagePlayWakeExpected: false,
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
      blockedReason,
      stagePlayWakeExpected: false,
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
      blockedReason,
      stagePlayWakeExpected: false,
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
      blockedReason: "lane_session_mismatch",
      stagePlayWakeExpected: false,
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

  const projectionTarget = observation.projection_target;
  const sourceId = observation.source_id || session.source_binding.source_id;
  const chunkId = observation.chunk_id;
  const translated = observation.translated_text;
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
    chunkId,
    observationRef,
    input.translationResult.lane_resolve_trace.selected_backend_provider,
    input.translationResult.lane_resolve_trace.requested_backend_provider,
  ].filter((value): value is string => Boolean(value));

  const mail = enqueueStagePlayLiveSourceMailItem({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceId,
    sourceKind: sourceKindForProjectionTarget(projectionTarget),
    evidenceRef: observationRef,
    observationRef,
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
    nowMs: input.now ? Date.parse(input.now) : undefined,
  });
  const stagePlayWakeExpected = mail.status === "unread";
  const debugSummary = buildMailLoopDebugSummary({
    laneSessionId: input.laneSessionId,
    translationResult: input.translationResult,
    threadId: input.threadId,
    observationRef,
    mail,
    blockedReason: null,
    stagePlayWakeExpected,
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
