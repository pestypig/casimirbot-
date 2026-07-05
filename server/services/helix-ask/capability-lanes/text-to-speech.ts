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
  HELIX_TEXT_TO_SPEECH_ONE_SHOT_RESULT_SCHEMA,
  HELIX_TEXT_TO_SPEECH_RECEIPT_SCHEMA,
  type HelixTextToSpeechOneShotRequest,
  type HelixTextToSpeechOneShotResult,
  type HelixTextToSpeechReceipt,
} from "@shared/helix-text-to-speech-lane";
import type { HelixAgentProvider } from "../agent-providers/types";
import {
  recordInterimVoiceCalloutRequest,
  waitForInterimVoicePlaybackOutcome,
} from "../interim-voice-callout-store";
import { normalizeVoicePlaybackClientStatus } from "../voice-playback/receipt-barrier";
import { mapInterimVoiceReceiptToTextToSpeechPlaybackStatus } from "../voice-playback/status";
import { resolveHelixCapabilityLaneRequest } from "./registry";

const CAPABILITY_ID = "text_to_speech.speak_text" as const;

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const optionalText = (value: unknown): string | null => {
  const text = normalizeText(value);
  return text || null;
};

const normalizePlaybackKind = (
  value: unknown,
  sourceObservationRef: string | null,
): "tool_receipt" | "translation_relay" | "narrator_read" | "panel_narration" => {
  const text = normalizeText(value);
  if (
    text === "tool_receipt" ||
    text === "translation_relay" ||
    text === "narrator_read" ||
    text === "panel_narration"
  ) {
    return text;
  }
  return /\btranslation\b/i.test(sourceObservationRef ?? "") ? "translation_relay" : "tool_receipt";
};

const readTtsClientReceiptWaitMs = (env: NodeJS.ProcessEnv | undefined): number => {
  const raw = Number(env?.HELIX_TTS_CLIENT_RECEIPT_WAIT_MS ?? env?.HELIX_VOICE_PLAYBACK_RECEIPT_WAIT_MS);
  if (!Number.isFinite(raw)) return 1_500;
  return Math.max(0, Math.min(Math.trunc(raw), 8_000));
};

const packetStatusFor = (
  playbackStatus: ReturnType<typeof mapInterimVoiceReceiptToTextToSpeechPlaybackStatus>,
  missingInput: boolean,
): HelixAgentStepObservationPacket["status"] => {
  if (missingInput) return "missing_input";
  if (playbackStatus === "played") return "succeeded";
  if (playbackStatus === "pending") return "client_pending";
  if (playbackStatus === "blocked") return "blocked";
  return "failed";
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

const buildObservationPacket = (input: {
  turnId: string;
  iteration: number;
  status: HelixAgentStepObservationPacket["status"];
  summary: string;
  observationRef: string;
  receipt: HelixTextToSpeechReceipt | null;
  voicePlaybackReceiptBarrier?: Record<string, unknown> | null;
  voicePlaybackClientReceipt?: Record<string, unknown> | null;
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
  action: "speak_text",
  status: input.status,
  produced_artifact_refs: [input.observationRef],
  observation_summary: input.summary,
  receipts: input.receipt
    ? [{
        receipt_ref: input.receipt.receipt_ref,
        kind: "text_to_speech_playback",
        status: input.receipt.playback_status,
      }]
    : [],
  missing_requirements: input.missingRequirements ?? [],
  backend_selection_decision: input.backendSelectionDecision,
  state_delta: input.receipt
    ? {
        text_to_speech_receipt: input.receipt,
        ...(input.voicePlaybackReceiptBarrier
          ? { voice_playback_receipt_barrier: input.voicePlaybackReceiptBarrier }
          : {}),
        ...(input.voicePlaybackClientReceipt
          ? { voice_playback_client_receipt: input.voicePlaybackClientReceipt }
          : {}),
      }
    : {},
  suggested_next_steps:
    input.status === "succeeded"
      ? ["answer", "use_another_tool"]
      : input.status === "missing_input"
        ? ["ask_user", "repair"]
        : ["repair", "fail_closed"],
  produced_affordances: input.receipt
    ? [{
        schema: "helix.workstation_typed_affordance.v1",
        kind: "voice_playback_receipt",
        role: "producer",
        source_capability: CAPABILITY_ID,
        artifact_ref: input.receipt.receipt_ref,
        source_refs: [
          input.receipt.source_observation_ref,
          input.receipt.backend_receipt_ref,
          input.receipt.audio_ref,
        ].filter((value): value is string => Boolean(value)),
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
    produced_affordance_kinds: input.receipt ? ["voice_playback_receipt"] : [],
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

const mapClientStatusToTtsPlaybackStatus = (
  normalizedStatus: string,
): HelixTextToSpeechReceipt["playback_status"] => {
  if (normalizedStatus === "delivered") return "played";
  if (normalizedStatus === "queued") return "pending";
  if (normalizedStatus === "awaiting_client_receipt") return "pending";
  if (normalizedStatus === "cancelled" || normalizedStatus === "suppressed") return "failed";
  return normalizedStatus === "failed" ? "failed" : "blocked";
};

const buildPlaybackLifecycle = (input: {
  playbackStatus: HelixTextToSpeechReceipt["playback_status"];
  clientPlaybackReceiptStatus?: string | null;
  utteranceId?: string | null;
}): Pick<
  HelixTextToSpeechReceipt,
  | "playback_started"
  | "playback_completed"
  | "playback_failed"
  | "delivered_utterance_id"
  | "client_playback_receipt_status"
> => {
  const clientStatus = optionalText(input.clientPlaybackReceiptStatus);
  const playbackCompleted = input.playbackStatus === "played";
  const playbackFailed = input.playbackStatus === "blocked" || input.playbackStatus === "failed";
  return {
    playback_started: playbackCompleted || clientStatus === "queued",
    playback_completed: playbackCompleted,
    playback_failed: playbackFailed,
    delivered_utterance_id: playbackCompleted ? optionalText(input.utteranceId) : null,
    client_playback_receipt_status: clientStatus,
  };
};

const applyClientPlaybackReceipt = (input: {
  receipt: HelixTextToSpeechReceipt;
  clientReceipt: Record<string, unknown>;
  nowMs: number;
}): HelixTextToSpeechReceipt => {
  const normalizedStatus = normalizeVoicePlaybackClientStatus(input.clientReceipt);
  const playbackStatus = mapClientStatusToTtsPlaybackStatus(normalizedStatus);
  const providerPlaybackStatus = optionalText(input.clientReceipt.status) ?? normalizedStatus;
  const delivery = input.clientReceipt.delivery && typeof input.clientReceipt.delivery === "object" && !Array.isArray(input.clientReceipt.delivery)
    ? input.clientReceipt.delivery as Record<string, unknown>
    : null;
  const utteranceId =
    optionalText(delivery?.utteranceId) ??
    optionalText(input.clientReceipt.utteranceId) ??
    input.receipt.utterance_id;
  const delivered = playbackStatus === "played";
  return {
    ...input.receipt,
    utterance_id: utteranceId,
    playback_status: playbackStatus,
    provider_playback_status: providerPlaybackStatus,
    client_playback_receipt_ref: optionalText(input.clientReceipt.receiptId) ?? input.receipt.client_playback_receipt_ref,
    audio_ref: delivered ? utteranceId : input.receipt.audio_ref,
    audio_bytes_observed: delivered,
    ...buildPlaybackLifecycle({
      playbackStatus,
      clientPlaybackReceiptStatus: providerPlaybackStatus,
      utteranceId,
    }),
    playback_confirmed_at_ms: delivered ? input.nowMs : input.receipt.playback_confirmed_at_ms,
    delivered_at_ms: delivered ? input.nowMs : input.receipt.delivered_at_ms,
    playback_error: playbackStatus === "failed" || playbackStatus === "blocked"
      ? optionalText(delivery?.message) ?? optionalText(input.clientReceipt.message) ?? normalizedStatus
      : null,
  };
};

export const runTextToSpeechSpeakText = async (input: {
  provider: HelixAgentProvider;
  request: HelixTextToSpeechOneShotRequest;
  turnId?: string | null;
  iteration?: number | null;
  env?: NodeJS.ProcessEnv;
}): Promise<HelixTextToSpeechOneShotResult> => {
  const turnId = normalizeText(input.turnId) || normalizeText(input.request.turn_id) || "ask:lane:text_to_speech";
  const iteration = typeof input.iteration === "number" && Number.isFinite(input.iteration)
    ? Math.max(0, Math.trunc(input.iteration))
    : 0;
  const text = normalizeText(input.request.text);
  const threadId = optionalText(input.request.thread_id) ?? "helix-ask:desktop";
  const sourceObservationRef = optionalText(input.request.source_observation_ref);
  const voicePlaybackKind = normalizePlaybackKind(input.request.voice_playback_kind, sourceObservationRef);
  const voiceProfile = optionalText(input.request.profile) ?? optionalText(input.request.voice);
  const locale = optionalText(input.request.locale);
  const trace = resolveHelixCapabilityLaneRequest({
    provider: input.provider,
    requestedLane: "text_to_speech",
    requestedBackendProvider: input.request.requested_backend_provider,
    env: input.env,
  });

  const missingRequirements: HelixAgentStepObservationPacket["missing_requirements"] = [];
  if (!text) {
    missingRequirements.push({
      code: "missing_text",
      message: "text_to_speech.speak_text requires non-empty text.",
      repair_action: "provide_text",
    });
  }

  if (trace.admission_status !== "admitted_shadow_only" || missingRequirements.length > 0) {
    const observationRef = `${turnId}:capability_lane:${CAPABILITY_ID}:${hashShort({
      status: trace.admission_status,
      missingRequirements,
    })}`;
    const packet = buildObservationPacket({
      turnId,
      iteration,
      status: missingRequirements.length > 0 ? "missing_input" : "blocked",
      summary: missingRequirements.length > 0
        ? "Text-to-speech lane missing required input."
        : `Text-to-speech lane blocked: ${trace.blocked_reason ?? "not_admitted"}.`,
      observationRef,
      receipt: null,
      backendSelectionDecision: trace.backend_selection_decision,
      missingRequirements,
    });
    return {
      schema: HELIX_TEXT_TO_SPEECH_ONE_SHOT_RESULT_SCHEMA,
      ok: false,
      lane_id: "text_to_speech",
      capability: CAPABILITY_ID,
      selected_runtime_agent_provider: input.provider.id,
      lane_resolve_trace: withExecutionTrace({
        trace,
        observationRef,
        status: "not_executed_shadow_only",
        blockedReason: missingRequirements[0]?.code ?? trace.blocked_reason,
      }),
      receipt: null,
      observation: null,
      observation_packet: packet,
      artifact_refs: packet.produced_artifact_refs,
      error: missingRequirements[0]?.code ?? trace.blocked_reason ?? "text_to_speech_lane_blocked",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  const backend = recordInterimVoiceCalloutRequest({
    turnId,
    threadId,
    source: "ask_tool_loop",
    kind: "tool_result",
    text,
    voicePlaybackKind,
    requiresConfirmation: false,
    evidenceRefs: sourceObservationRef ? [sourceObservationRef] : [],
    reasonCodes: ["capability_lane_text_to_speech_speak_text"],
  });
  const playbackStatus = mapInterimVoiceReceiptToTextToSpeechPlaybackStatus(backend.receipt);
  const backendUtteranceId = backend.receipt.delivery?.utteranceId ?? null;
  const observationRef = `${turnId}:capability_lane:${CAPABILITY_ID}:${hashShort({
    text,
    receiptId: backend.receipt.receiptId,
  })}`;
  let receipt: HelixTextToSpeechReceipt = {
    schema: HELIX_TEXT_TO_SPEECH_RECEIPT_SCHEMA,
    receipt_ref: `${observationRef}:receipt:${hashShort(backend.receipt.receiptId)}`,
    request_ref: backend.request.requestId,
    lane_id: "text_to_speech",
    tool: CAPABILITY_ID,
    capability: CAPABILITY_ID,
    selected_runtime_agent_provider: input.provider.id,
    requested_backend_provider: trace.requested_backend_provider,
    selected_backend_provider: trace.selected_backend_provider,
    selection_reason: trace.selection_reason,
    backend_selection_decision: trace.backend_selection_decision,
    utterance_id: backendUtteranceId,
    playback_status: playbackStatus,
    provider_playback_status: backend.receipt.status,
    audio_ref: playbackStatus === "played" ? backendUtteranceId : null,
    playback_request_ref: backendUtteranceId ?? backend.receipt.receiptId ?? null,
    client_playback_receipt_ref: backend.receipt.status === "delivered" ? backend.receipt.receiptId : null,
    audio_bytes_observed: backend.receipt.delivery?.playbackStatus === "client_confirmed",
    ...buildPlaybackLifecycle({
      playbackStatus,
      utteranceId: backendUtteranceId,
    }),
    playback_requested_at_ms: null,
    playback_confirmed_at_ms: playbackStatus === "played" ? Date.now() : null,
    delivered_at_ms: playbackStatus === "played" ? Date.now() : null,
    playback_error: playbackStatus === "blocked" || playbackStatus === "failed"
      ? backend.receipt.delivery?.message ?? backend.receipt.status
      : null,
    source_text_hash: hashShort(text),
    source_text_char_count: text.length,
    voice_profile: voiceProfile,
    locale,
    source_observation_ref: sourceObservationRef,
    backend_receipt_ref: backend.receipt.receiptId,
    backend_request_ref: backend.request.requestId,
    backend_provider: backend.receipt.delivery?.provider ?? trace.selected_backend_provider,
    reentry_required: true,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
  const clientPlaybackHandoff = {
    schema: "helix.interim_voice_callout_tool_result.v1",
    ok: playbackStatus === "pending" || playbackStatus === "played",
    request: backend.request,
    receipt: backend.receipt,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    context_role: "tool_evidence",
    ask_context_policy: "evidence_only",
  };
  const waitMs = readTtsClientReceiptWaitMs(input.env);
  let voicePlaybackClientReceipt: Record<string, unknown> | null = null;
  let voicePlaybackReceiptBarrier: Record<string, unknown> = playbackStatus === "pending"
    ? {
        schema: "helix.voice_playback_receipt_barrier.v1",
        source: "text_to_speech_capability_lane",
        status: "awaiting_client_receipt",
        playback_status: "awaiting_client_receipt",
        request_id: backend.request.requestId,
        source_receipt_id: backend.receipt.receiptId,
        waited_ms: 0,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }
    : {
        schema: "helix.voice_playback_receipt_barrier.v1",
        source: "text_to_speech_capability_lane",
        status: "backend_not_waitable",
        playback_status: playbackStatus,
        provider_playback_status: backend.receipt.status,
        request_id: backend.request.requestId,
        source_receipt_id: backend.receipt.receiptId,
        waited_ms: 0,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      };
  if (playbackStatus === "pending" && waitMs > 0) {
    const startedAtMs = Date.now();
    const clientReceipt = await waitForInterimVoicePlaybackOutcome({
      requestId: backend.request.requestId,
      sourceReceiptId: backend.receipt.receiptId,
      timeoutMs: waitMs,
    });
    const waitedMs = Math.max(0, Date.now() - startedAtMs);
    if (clientReceipt) {
      voicePlaybackClientReceipt = clientReceipt as unknown as Record<string, unknown>;
      receipt = applyClientPlaybackReceipt({
        receipt,
        clientReceipt: voicePlaybackClientReceipt,
        nowMs: Date.now(),
      });
      voicePlaybackReceiptBarrier = {
        ...voicePlaybackReceiptBarrier,
        status: "client_receipt_observed",
        playback_status: receipt.playback_status,
        provider_playback_status: receipt.provider_playback_status,
        client_playback_receipt_ref: receipt.client_playback_receipt_ref,
        utterance_id: receipt.utterance_id,
        audio_bytes_observed: receipt.audio_bytes_observed,
        delivered_at_ms: receipt.delivered_at_ms,
        waited_ms: waitedMs,
      };
    } else {
      voicePlaybackReceiptBarrier = {
        ...voicePlaybackReceiptBarrier,
        status: "client_receipt_timeout",
        playback_status: "awaiting_client_receipt",
        waited_ms: waitedMs,
      };
    }
  }
  const finalPlaybackStatus = receipt.playback_status;
  const finalPacketStatus = packetStatusFor(finalPlaybackStatus, false);
  const playbackSummary = finalPlaybackStatus === "pending"
    ? voicePlaybackReceiptBarrier.status === "client_receipt_timeout"
      ? "awaiting client playback receipt"
      : "pending client playback receipt"
    : finalPlaybackStatus;
  const packet = buildObservationPacket({
    turnId,
    iteration,
    status: finalPacketStatus,
    summary: `Text-to-speech ${playbackSummary}; backend receipt ${backend.receipt.receiptId}.`,
    observationRef,
    receipt,
    voicePlaybackReceiptBarrier,
    voicePlaybackClientReceipt,
    backendSelectionDecision: trace.backend_selection_decision,
    missingRequirements: finalPacketStatus === "succeeded" || finalPacketStatus === "client_pending" ? [] : [{
      code: finalPlaybackStatus,
      message: receipt.playback_error ?? backend.receipt.delivery?.message ?? `Text-to-speech playback ${finalPlaybackStatus}.`,
      repair_action: finalPlaybackStatus === "blocked" ? "repair" : "fail_closed",
    }],
  });
  packet.state_delta = {
    ...packet.state_delta,
    text_to_speech_client_playback_handoff: clientPlaybackHandoff,
  };

  return {
    schema: HELIX_TEXT_TO_SPEECH_ONE_SHOT_RESULT_SCHEMA,
    ok: finalPlaybackStatus === "pending" || finalPlaybackStatus === "played",
    lane_id: "text_to_speech",
    capability: CAPABILITY_ID,
    selected_runtime_agent_provider: input.provider.id,
    lane_resolve_trace: withExecutionTrace({
      trace,
      observationRef,
      receiptRef: receipt.receipt_ref,
      status: "executed_observation_only",
      blockedReason: finalPlaybackStatus === "pending" || finalPlaybackStatus === "played" ? null : finalPlaybackStatus,
    }),
    receipt,
    observation: receipt,
    observation_packet: packet,
    artifact_refs: packet.produced_artifact_refs,
    voice_playback_receipt_barrier: voicePlaybackReceiptBarrier,
    ...(finalPlaybackStatus === "pending" || finalPlaybackStatus === "played" ? {} : { error: finalPlaybackStatus }),
    reentry_required: true,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};
