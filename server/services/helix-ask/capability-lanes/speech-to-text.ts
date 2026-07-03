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
  HELIX_SPEECH_TO_TEXT_OBSERVATION_SCHEMA,
  HELIX_SPEECH_TO_TEXT_ONE_SHOT_RESULT_SCHEMA,
  type HelixSpeechToTextObservation,
  type HelixSpeechToTextOneShotRequest,
  type HelixSpeechToTextOneShotResult,
} from "@shared/helix-speech-to-text-lane";
import type { StagePlayLiveSourceMailItemV1 } from "@shared/contracts/stage-play-live-source-mail.v1";
import type { HelixAgentProvider } from "../agent-providers/types";
import { enqueueAudioTranscriptMailFromChunk } from "../../stage-play/stage-play-audio-transcript-mail-ingest";
import { resolveHelixCapabilityLaneRequest } from "./registry";

const CAPABILITY_ID = "speech_to_text.transcribe_audio" as const;

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const optionalText = (value: unknown): string | null => {
  const text = normalizeText(value);
  return text || null;
};

const optionalNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const previewText = (text: string, limit = 180): string =>
  text.length > limit ? `${text.slice(0, Math.max(0, limit - 3)).trimEnd()}...` : text;

const withExecutionTrace = (input: {
  trace: HelixCapabilityLaneResolveTrace;
  observationRef: string | null;
  status: "executed_observation_only" | "not_executed_shadow_only";
  blockedReason?: string | null;
}): HelixCapabilityLaneResolveTrace => ({
  ...input.trace,
  execution_status: input.status,
  result_ref: input.observationRef,
  observation_ref: input.observationRef,
  receipt_ref: null,
  blocked_reason: input.blockedReason ?? input.trace.blocked_reason,
});

const buildPacket = (input: {
  turnId: string;
  iteration: number;
  status: HelixAgentStepObservationPacket["status"];
  summary: string;
  observationRef: string;
  observation: HelixSpeechToTextObservation | null;
  mailItem: StagePlayLiveSourceMailItemV1 | null;
  backendSelectionDecision: HelixCapabilityLaneBackendSelectionDecision;
  missingRequirements?: HelixAgentStepObservationPacket["missing_requirements"];
}): HelixAgentStepObservationPacket => ({
  schema: HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
  turn_id: input.turnId,
  iteration: input.iteration,
  call_id: `${input.turnId}:capability_lane:${CAPABILITY_ID}:call`,
  decision_id: `${input.turnId}:capability_lane:${CAPABILITY_ID}:decision`,
  capability_key: CAPABILITY_ID,
  panel_id: "capability_lane",
  action: "transcribe_audio",
  status: input.status,
  produced_artifact_refs: [
    input.observationRef,
    input.mailItem?.mailId ?? null,
  ].filter((value): value is string => Boolean(value)),
  observation_summary: input.summary,
  receipts: input.mailItem
    ? [{
        receipt_ref: input.mailItem.mailId,
        kind: "stage_play_live_source_mail_item",
        status: input.mailItem.status,
      }]
    : [],
  missing_requirements: input.missingRequirements ?? [],
  backend_selection_decision: input.backendSelectionDecision,
  state_delta: {
    ...(input.observation ? { speech_to_text_observation: input.observation } : {}),
    ...(input.mailItem ? { speech_to_text_live_source_mail_item: input.mailItem } : {}),
  },
  suggested_next_steps:
    input.status === "succeeded"
      ? ["use_another_tool", "answer"]
      : input.status === "client_pending"
        ? ["ask_user", "repair"]
        : ["repair", "fail_closed"],
  produced_affordances: input.observation
    ? [{
        schema: "helix.workstation_typed_affordance.v1",
        kind: "voice_text_evidence",
        role: "producer",
        source_capability: CAPABILITY_ID,
        artifact_ref: input.observation.observation_ref,
        source_refs: input.observation.evidence_refs,
        status: "available",
        assistant_answer: false,
        raw_content_included: false,
      }]
    : [],
  consumed_affordances: [],
  typed_handoff_contract: {
    schema: "helix.workstation_typed_handoff_contract.v1",
    producer_capability: CAPABILITY_ID,
    consumer_capability: null,
    required_affordance_kinds: [],
    produced_affordance_kinds: input.observation ? ["voice_text_evidence", "mail_packet_ref"] : [],
    missing_affordance_kinds: [],
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  },
  terminal_eligible: false,
  post_tool_model_step_required: true,
  assistant_answer: false,
  raw_content_included: false,
});

export const materializeSpeechToTextTranscriptObservation = (input: {
  provider: HelixAgentProvider;
  request: HelixSpeechToTextOneShotRequest;
  trace: HelixCapabilityLaneResolveTrace;
  turnId: string;
  iteration: number;
  nowMs?: number;
}): {
  observation: HelixSpeechToTextObservation;
  mailItem: StagePlayLiveSourceMailItemV1;
  observationRef: string;
} => {
  const text = normalizeText(input.request.transcript_text);
  const threadId = optionalText(input.request.thread_id) ?? "helix-ask:desktop";
  const roomId = optionalText(input.request.room_id);
  const environmentId = optionalText(input.request.environment_id);
  const captureSessionId = optionalText(input.request.capture_session_id);
  const chunkIndex = optionalNumber(input.request.chunk_index);
  const sourceId =
    optionalText(input.request.source_id) ??
    `audio_transcript:${threadId}`;
  const chunkRef =
    optionalText(input.request.chunk_id) ??
    `speech_to_text_chunk:${hashShort({ threadId, sourceId, captureSessionId, chunkIndex, text })}`;
  const transcriptHash = hashShort(text);
  const observationRef = `${input.turnId}:capability_lane:${CAPABILITY_ID}:${hashShort({
    sourceId,
    chunkRef,
    transcriptHash,
  })}`;
  const mailItem = enqueueAudioTranscriptMailFromChunk({
    threadId,
    roomId,
    environmentId,
    sourceId,
    transcript: text,
    eventRef: observationRef,
    chunkRef,
    analysisJobRef: null,
    evidenceRefs: [
      sourceId,
      observationRef,
      chunkRef,
      optionalText(input.request.audio_ref),
    ].filter((value): value is string => Boolean(value)),
    durationMs: optionalNumber(input.request.duration_ms),
  });
  const evidenceRefs = Array.from(new Set([
    sourceId,
    observationRef,
    chunkRef,
    mailItem.mailId,
    ...mailItem.evidenceRefs,
  ]));
  const observation: HelixSpeechToTextObservation = {
    schema: HELIX_SPEECH_TO_TEXT_OBSERVATION_SCHEMA,
    observation_ref: observationRef,
    lane_id: "speech_to_text",
    capability: CAPABILITY_ID,
    selected_runtime_agent_provider: input.provider.id,
    selected_backend_provider: input.trace.selected_backend_provider,
    transcript_hash: transcriptHash,
    transcript_char_count: text.length,
    transcript_preview: previewText(text),
    audio_ref: optionalText(input.request.audio_ref),
    audio_hash: optionalText(input.request.audio_hash),
    language: optionalText(input.request.language),
    locale: optionalText(input.request.locale),
    confidence: optionalNumber(input.request.confidence),
    thread_id: threadId,
    room_id: roomId,
    environment_id: environmentId,
    source_id: sourceId,
    source_kind: "audio_transcript",
    capture_session_id: captureSessionId,
    chunk_id: chunkRef,
    chunk_index: chunkIndex,
    duration_ms: optionalNumber(input.request.duration_ms),
    capture_source: optionalText(input.request.capture_source),
    stage_play_mail_id: mailItem.mailId,
    stage_play_mail_ref: mailItem.mailId,
    source_event_ms: optionalNumber(input.request.source_event_ms),
    observed_at_ms: input.nowMs ?? Date.now(),
    evidence_refs: evidenceRefs,
    reentry_required: true,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
    raw_audio_included: false,
  };
  return { observation, mailItem, observationRef };
};

export const runSpeechToTextTranscribeAudio = (input: {
  provider: HelixAgentProvider;
  request: HelixSpeechToTextOneShotRequest;
  turnId?: string | null;
  iteration?: number | null;
  env?: NodeJS.ProcessEnv;
}): HelixSpeechToTextOneShotResult => {
  const turnId = normalizeText(input.turnId) || normalizeText(input.request.turn_id) || "ask:lane:speech_to_text";
  const iteration = typeof input.iteration === "number" && Number.isFinite(input.iteration)
    ? Math.max(0, Math.trunc(input.iteration))
    : 0;
  const text = normalizeText(input.request.transcript_text);
  const trace = resolveHelixCapabilityLaneRequest({
    provider: input.provider,
    requestedLane: "speech_to_text",
    requestedBackendProvider: input.request.requested_backend_provider,
    env: input.env,
  });

  const missingRequirements: HelixAgentStepObservationPacket["missing_requirements"] = [];
  if (!text && !optionalText(input.request.audio_ref)) {
    missingRequirements.push({
      code: "missing_audio_or_transcript",
      message: "speech_to_text.transcribe_audio requires an audio_ref or a transcript_text observation.",
      repair_action: "provide_audio_ref_or_transcript_text",
    });
  }

  if (trace.admission_status !== "admitted_shadow_only" || missingRequirements.length > 0 || !text) {
    const pendingAudioRef = optionalText(input.request.audio_ref);
    const status: HelixAgentStepObservationPacket["status"] =
      missingRequirements.length > 0 ? "missing_input" : pendingAudioRef && !text ? "client_pending" : "blocked";
    const error = missingRequirements[0]?.code ??
      (status === "client_pending" ? "awaiting_client_transcription_result" : trace.blocked_reason ?? "speech_to_text_lane_blocked");
    const observationRef = `${turnId}:capability_lane:${CAPABILITY_ID}:${hashShort({
      status,
      pendingAudioRef,
      error,
    })}`;
    const packet = buildPacket({
      turnId,
      iteration,
      status,
      summary:
        status === "client_pending"
          ? "Speech-to-text audio reference recorded; transcript packet is pending client/backend transcription."
          : status === "missing_input"
            ? "Speech-to-text lane missing audio or transcript input."
            : `Speech-to-text lane blocked: ${trace.blocked_reason ?? "not_admitted"}.`,
      observationRef,
      observation: null,
      mailItem: null,
      backendSelectionDecision: trace.backend_selection_decision,
      missingRequirements,
    });
    return {
      schema: HELIX_SPEECH_TO_TEXT_ONE_SHOT_RESULT_SCHEMA,
      ok: false,
      lane_id: "speech_to_text",
      capability: CAPABILITY_ID,
      selected_runtime_agent_provider: input.provider.id,
      lane_resolve_trace: withExecutionTrace({
        trace,
        observationRef,
        status: "not_executed_shadow_only",
        blockedReason: error,
      }),
      observation: null,
      observation_packet: packet,
      artifact_refs: packet.produced_artifact_refs,
      error,
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  const materialized = materializeSpeechToTextTranscriptObservation({
    provider: input.provider,
    request: input.request,
    trace,
    turnId,
    iteration,
  });
  const packet = buildPacket({
    turnId,
    iteration,
    status: "succeeded",
    summary: `Speech-to-text transcript packet created for ${materialized.observation.source_id}.`,
    observationRef: materialized.observationRef,
    observation: materialized.observation,
    mailItem: materialized.mailItem,
    backendSelectionDecision: trace.backend_selection_decision,
  });
  return {
    schema: HELIX_SPEECH_TO_TEXT_ONE_SHOT_RESULT_SCHEMA,
    ok: true,
    lane_id: "speech_to_text",
    capability: CAPABILITY_ID,
    selected_runtime_agent_provider: input.provider.id,
    lane_resolve_trace: withExecutionTrace({
      trace,
      observationRef: materialized.observationRef,
      status: "executed_observation_only",
    }),
    observation: materialized.observation,
    observation_packet: packet,
    artifact_refs: packet.produced_artifact_refs,
    reentry_required: true,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};
