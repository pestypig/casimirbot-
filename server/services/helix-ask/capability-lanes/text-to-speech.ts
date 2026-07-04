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
import { recordInterimVoiceCalloutRequest } from "../interim-voice-callout-store";
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

export const runTextToSpeechSpeakText = (input: {
  provider: HelixAgentProvider;
  request: HelixTextToSpeechOneShotRequest;
  turnId?: string | null;
  iteration?: number | null;
  env?: NodeJS.ProcessEnv;
}): HelixTextToSpeechOneShotResult => {
  const turnId = normalizeText(input.turnId) || normalizeText(input.request.turn_id) || "ask:lane:text_to_speech";
  const iteration = typeof input.iteration === "number" && Number.isFinite(input.iteration)
    ? Math.max(0, Math.trunc(input.iteration))
    : 0;
  const text = normalizeText(input.request.text);
  const threadId = optionalText(input.request.thread_id) ?? "helix-ask:desktop";
  const sourceObservationRef = optionalText(input.request.source_observation_ref);
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
    voicePlaybackKind: "tool_receipt",
    requiresConfirmation: false,
    evidenceRefs: sourceObservationRef ? [sourceObservationRef] : [],
    reasonCodes: ["capability_lane_text_to_speech_speak_text"],
  });
  const playbackStatus = mapInterimVoiceReceiptToTextToSpeechPlaybackStatus(backend.receipt);
  const observationRef = `${turnId}:capability_lane:${CAPABILITY_ID}:${hashShort({
    text,
    receiptId: backend.receipt.receiptId,
  })}`;
  const receipt: HelixTextToSpeechReceipt = {
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
    utterance_id: backend.receipt.delivery?.utteranceId ?? null,
    playback_status: playbackStatus,
    provider_playback_status: backend.receipt.status,
    audio_ref: playbackStatus === "played" ? backend.receipt.delivery?.utteranceId ?? null : null,
    playback_request_ref: backend.receipt.delivery?.utteranceId ?? backend.receipt.receiptId ?? null,
    client_playback_receipt_ref: backend.receipt.status === "delivered" ? backend.receipt.receiptId : null,
    audio_bytes_observed: backend.receipt.delivery?.playbackStatus === "client_confirmed",
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
  const packetStatus = packetStatusFor(playbackStatus, false);
  const playbackSummary = playbackStatus === "pending"
    ? "pending client playback receipt"
    : playbackStatus;
  const packet = buildObservationPacket({
    turnId,
    iteration,
    status: packetStatus,
    summary: `Text-to-speech ${playbackSummary}; backend receipt ${backend.receipt.receiptId}.`,
    observationRef,
    receipt,
    backendSelectionDecision: trace.backend_selection_decision,
    missingRequirements: packetStatus === "succeeded" || packetStatus === "client_pending" ? [] : [{
      code: playbackStatus,
      message: backend.receipt.delivery?.message ?? `Text-to-speech playback ${playbackStatus}.`,
      repair_action: playbackStatus === "blocked" ? "repair" : "fail_closed",
    }],
  });
  packet.state_delta = {
    ...packet.state_delta,
    text_to_speech_client_playback_handoff: clientPlaybackHandoff,
  };

  return {
    schema: HELIX_TEXT_TO_SPEECH_ONE_SHOT_RESULT_SCHEMA,
    ok: playbackStatus === "pending" || playbackStatus === "played",
    lane_id: "text_to_speech",
    capability: CAPABILITY_ID,
    selected_runtime_agent_provider: input.provider.id,
    lane_resolve_trace: withExecutionTrace({
      trace,
      observationRef,
      receiptRef: receipt.receipt_ref,
      status: "executed_observation_only",
      blockedReason: playbackStatus === "pending" || playbackStatus === "played" ? null : playbackStatus,
    }),
    receipt,
    observation: receipt,
    observation_packet: packet,
    artifact_refs: packet.produced_artifact_refs,
    ...(playbackStatus === "pending" || playbackStatus === "played" ? {} : { error: playbackStatus }),
    reentry_required: true,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};
