import crypto from "node:crypto";
import {
  HELIX_REALTIME_STAGE_PLAY_ASK_HANDOFF_SCHEMA,
  type HelixRealtimeStagePlayAskHandoffV1,
} from "@shared/contracts/helix-realtime-stage-play.v1";
import type { HelixRealtimeTranscriptObservation } from "@shared/helix-realtime-observation";
import { recordStagePlayLiveSourceConversationEvent } from "../../stage-play/stage-play-live-source-conversation-store";
import { buildHelixRealtimeStagePlayContextPack } from "../realtime-session/context-pack";
import { startRealtimeGroundedRelayForHandoff } from "../realtime-session/grounded-answer-relay";
import { buildRealtimeTranscriptWorkerAdmission } from "../realtime-session/worker-admission";
import type { HelixRuntimeGoalAccountScope } from "../runtime-goals/runtime-goal-account-binding";

const handoffsById = new Map<string, HelixRealtimeStagePlayAskHandoffV1>();
const handoffIdByProviderEventKey = new Map<string, string>();
const MAX_HANDOFFS = 240;

const hash = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

const readSafeString = (value: unknown, limit = 260): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > limit) return null;
  return /^[A-Za-z0-9._:/@#%+?=&(), -]+$/.test(normalized) ? normalized : null;
};

const unique = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values
    .map((value: string | null | undefined) => String(value ?? "").trim())
    .filter(Boolean)));

const trimHandoffs = (): void => {
  if (handoffsById.size <= MAX_HANDOFFS) return;
  const oldest = Array.from(handoffsById.values())
    .sort((
      left: HelixRealtimeStagePlayAskHandoffV1,
      right: HelixRealtimeStagePlayAskHandoffV1,
    ) => left.created_at_ms - right.created_at_ms)
    .slice(0, handoffsById.size - MAX_HANDOFFS);
  for (const handoff of oldest) {
    handoffsById.delete(handoff.handoff_id);
    handoffIdByProviderEventKey.delete(
      `${handoff.realtime_session_id}:${handoff.provider_event_ref}`,
    );
  }
};

export const bridgeRealtimeTranscriptToStagePlay = (input: {
  realtimeSessionId: string;
  threadId: string;
  providerEventRef: string;
  transcriptText: string;
  observation: HelixRealtimeTranscriptObservation;
  sourceBinding?: Record<string, unknown> | null;
  selectedRuntimeAgentProvider?: string | null;
  runtimeGoalAccountScope?: HelixRuntimeGoalAccountScope | null;
  providerCallRef?: string | null;
  transportReceiptRef?: string | null;
  vadState?: string | null;
  interruptionCount?: number | null;
  audioFocusOwner?: string | null;
  qualifiedUserInterruption?: boolean;
  terminalVoiceInterrupted?: boolean;
  nowMs?: number;
}): HelixRealtimeStagePlayAskHandoffV1 => {
  const providerEventKey = `${input.realtimeSessionId}:${input.providerEventRef}`;
  const existingId = handoffIdByProviderEventKey.get(providerEventKey);
  const existing = existingId ? handoffsById.get(existingId) : null;
  if (existing) return existing;

  const nowMs = input.nowMs ?? Date.now();
  const transcriptText = input.transcriptText.trim().slice(0, 16_000);
  const transcriptTextHash =
    input.observation.transcript_text_hash ?? `sha256:${hash(transcriptText)}`;
  const stagePlayEvent = recordStagePlayLiveSourceConversationEvent({
    threadId: input.threadId,
    text: transcriptText,
    source: "user_voice",
    turnId: `realtime:${input.providerEventRef}`,
    evidenceRefs: unique([
      input.observation.observation_ref,
      input.providerEventRef,
      input.realtimeSessionId,
      input.providerCallRef,
      input.transportReceiptRef,
    ]),
    now: new Date(nowMs).toISOString(),
  });
  const contextPack = buildHelixRealtimeStagePlayContextPack({
    realtimeSessionId: input.realtimeSessionId,
    threadId: input.threadId,
    sourceBinding: input.sourceBinding,
    runtimeGoalAccountScope: input.runtimeGoalAccountScope,
    nowMs,
  });
  const activeGoalBinding = contextPack.active_goal_binding;
  const handoffId = `realtime-stage-play-handoff:${hash([
    input.realtimeSessionId,
    input.providerEventRef,
    input.observation.observation_ref,
    stagePlayEvent.eventId,
    transcriptTextHash,
  ]).slice(0, 20)}`;
  const evidenceRefs = unique([
    input.observation.observation_ref,
    stagePlayEvent.eventId,
    contextPack.context_pack_id,
    ...contextPack.evidence_refs,
  ]).slice(0, 40);
  const workerAdmission = buildRealtimeTranscriptWorkerAdmission({
    handoffId,
    realtimeSessionId: input.realtimeSessionId,
    threadId: input.threadId,
    transcriptText,
    sourceBinding: input.sourceBinding,
    activeGoalBinding,
    selectedRuntimeAgentProvider: input.selectedRuntimeAgentProvider,
    evidenceRefs,
    nowMs,
  });
  const requiredGroundingCapabilityIds = workerAdmission.spoken_relay_eligible
    ? workerAdmission.candidate_readonly_capability_ids
    : [];
  const mustEnterBackendAsk =
    workerAdmission.dispatch.kind === "ask_runtime" ||
    workerAdmission.dispatch.kind === "ask_runtime_read_only";
  const routeMetadata: Record<string, unknown> = {
    schema: "helix.ask.route_metadata.v1",
    source: "realtime_stage_play",
    invocationKind: "stage_play_realtime_transcript_handoff",
    sourceTarget: "operator_text",
    mailboxThreadId: input.threadId,
    handoffId,
    realtimeSessionId: input.realtimeSessionId,
    goalId: activeGoalBinding?.goal_id ?? null,
    runtimeGoalSessionRef: activeGoalBinding?.runtime_session_ref ?? null,
    boundRuntimeAgentProvider: activeGoalBinding?.runtime_agent_provider ?? null,
    selectedRuntimeAgentProvider: workerAdmission.selected_runtime_agent_provider,
    selected_runtime_agent_provider: workerAdmission.selected_runtime_agent_provider,
    requiredGroundingCapabilityIds,
    realtimeWorkerAdmission: workerAdmission,
    forbiddenCapabilities: [
      "workstation_mutation",
      "workstation_action_execution",
      "realtime_provider_tool_execution",
    ],
    evidenceRefs,
    source_target_intent: {
      schema: "helix.ask_source_target_intent.v1",
      source: "stage_play_realtime_handoff",
      target_source: "operator_text",
      target_kind: "realtime_transcript",
      strength: "hard",
      explicit_cues: ["server_admitted_realtime_transcript"],
      reasons: ["realtime_transcript_observed", "stage_play_handoff_issued"],
      requested_outputs: mustEnterBackendAsk
        ? ["grounded_runtime_agent_answer", "typed_failure"]
        : workerAdmission.dispatch.kind === "goal_wake"
          ? ["durable_goal_wake", "typed_failure"]
          : ["realtime_conversation_local"],
      suppressed_routes: [
        "client_projection",
        "workstation_action_execution",
        "realtime_provider_tool_execution",
      ],
      precedence_reason: "server_admitted_realtime_transcript_handoff",
      must_enter_backend_ask: mustEnterBackendAsk,
      allow_client_shortcut: false,
      allow_no_tool_direct: requiredGroundingCapabilityIds.length === 0,
      admitted_readonly_handoff: true,
      grounded_feedback_requires_observation: requiredGroundingCapabilityIds.length > 0,
      required_grounding_capability_ids: requiredGroundingCapabilityIds,
      goal_id: activeGoalBinding?.goal_id ?? null,
      runtime_goal_session_ref: activeGoalBinding?.runtime_session_ref ?? null,
      runtime_agent_provider: workerAdmission.selected_runtime_agent_provider,
      realtime_worker_admission: workerAdmission,
      transcript_is_user_intent_after_admission: true,
      handoff_id: handoffId,
      realtime_session_id: input.realtimeSessionId,
      realtime_observation_ref: input.observation.observation_ref,
      stage_play_event_ref: stagePlayEvent.eventId,
      realtime_context_pack_id: contextPack.context_pack_id,
      realtime_context_hash: contextPack.context_hash,
      realtime_provider_call_ref: input.providerCallRef ?? null,
      realtime_transport: "webrtc",
      realtime_transport_receipt_ref: readSafeString(input.transportReceiptRef),
      realtime_vad_state: readSafeString(input.vadState),
      realtime_interruption_count: Math.max(0, Math.trunc(input.interruptionCount ?? 0)),
      realtime_audio_focus_owner: readSafeString(input.audioFocusOwner),
      qualified_user_interruption: input.qualifiedUserInterruption === true,
      terminal_voice_interrupted: input.terminalVoiceInterrupted === true,
      speaker_loopback_suppressed: false,
      realtime_reentry_status: "server_handoff_issued_readonly",
      evidence_refs: evidenceRefs,
      confidence: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
  const handoff: HelixRealtimeStagePlayAskHandoffV1 = {
    schema: HELIX_REALTIME_STAGE_PLAY_ASK_HANDOFF_SCHEMA,
    handoff_id: handoffId,
    realtime_session_id: input.realtimeSessionId,
    thread_id: input.threadId,
    provider_event_ref: input.providerEventRef,
    transcript_observation_ref: input.observation.observation_ref,
    stage_play_event_ref: stagePlayEvent.eventId,
    context_pack_id: contextPack.context_pack_id,
    context_hash: contextPack.context_hash,
    transcript_text_hash: transcriptTextHash,
    transcript_text_char_count: transcriptText.length,
    goal_id: activeGoalBinding?.goal_id ?? null,
    runtime_goal_session_ref: activeGoalBinding?.runtime_session_ref ?? null,
    runtime_agent_provider: workerAdmission.selected_runtime_agent_provider,
    required_grounding_capability_ids: requiredGroundingCapabilityIds,
    worker_admission: workerAdmission,
    created_at_ms: nowMs,
    route_metadata: routeMetadata,
    read_only: true,
    transcript_is_user_intent_after_admission: true,
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  handoffsById.set(handoffId, handoff);
  handoffIdByProviderEventKey.set(providerEventKey, handoffId);
  startRealtimeGroundedRelayForHandoff({
    handoff,
    workerAdmission,
    nowMs,
  });
  trimHandoffs();
  return handoff;
};

export const readRealtimeStagePlayAskHandoff = (
  handoffId: string | null | undefined,
): HelixRealtimeStagePlayAskHandoffV1 | null =>
  handoffId ? handoffsById.get(handoffId) ?? null : null;

export const listRealtimeStagePlayAskHandoffs = (input: {
  realtimeSessionId?: string | null;
  threadId?: string | null;
  limit?: number;
} = {}): HelixRealtimeStagePlayAskHandoffV1[] =>
  Array.from(handoffsById.values())
    .filter((handoff: HelixRealtimeStagePlayAskHandoffV1) =>
      !input.realtimeSessionId || handoff.realtime_session_id === input.realtimeSessionId)
    .filter((handoff: HelixRealtimeStagePlayAskHandoffV1) =>
      !input.threadId || handoff.thread_id === input.threadId)
    .sort((
      left: HelixRealtimeStagePlayAskHandoffV1,
      right: HelixRealtimeStagePlayAskHandoffV1,
    ) => left.created_at_ms - right.created_at_ms)
    .slice(-(input.limit ?? 40));

export const resetRealtimeStagePlayAskHandoffsForTests = (): void => {
  handoffsById.clear();
  handoffIdByProviderEventKey.clear();
};
