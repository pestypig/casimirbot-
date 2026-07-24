import crypto from "node:crypto";
import {
  HELIX_REALTIME_PROVISIONAL_RESPONSE_SCHEMA,
  type HelixRealtimeProvisionalResponseKindV1,
  type HelixRealtimeProvisionalResponseStatusV1,
  type HelixRealtimeProvisionalResponseV1,
} from "@shared/contracts/helix-realtime-provisional-response.v1";
import type { HelixRealtimeStagePlayAskHandoffV1 } from
  "@shared/contracts/helix-realtime-stage-play.v1";
import { readRealtimeGroundedAnswerRelay } from "./grounded-answer-relay";
import { listAdmittedRealtimeSessions } from "./session-registry";
import {
  sendRealtimeSidebandControlEvent,
  subscribeRealtimeSidebandActivity,
  subscribeRealtimeSidebandProviderEvents,
  subscribeRealtimeSidebandSessionClosed,
} from "./sideband-control-channel";

const MAX_PROVISIONAL_RESPONSES = 240;

type ProvisionalResponseJob = {
  artifact: HelixRealtimeProvisionalResponseV1;
  providerEvent: Record<string, unknown>;
};

const jobsByHandoffId = new Map<string, ProvisionalResponseJob>();
const handoffIdByProviderResponseRef = new Map<string, string>();
const activeHandoffIdBySessionId = new Map<string, string>();

const hash = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readSession = (realtimeSessionId: string) =>
  listAdmittedRealtimeSessions().find((session) =>
    session.realtimeSessionId === realtimeSessionId) ?? null;

const sessionIsBusy = (realtimeSessionId: string): boolean => {
  const session = readSession(realtimeSessionId);
  return Boolean(session?.inputSpeechActive || session?.responseActive || session?.playbackActive);
};

const isTerminalStatus = (status: HelixRealtimeProvisionalResponseStatusV1): boolean => [
  "delivered",
  "suppressed",
  "interrupted",
  "cancelled",
  "failed",
].includes(status);

const transition = (input: {
  handoffId: string;
  status: HelixRealtimeProvisionalResponseStatusV1;
  statusReason: string;
  providerEventRef?: string | null;
  providerResponseRef?: string | null;
  playbackReceiptRef?: string | null;
  responseCreated?: boolean;
  responseCompleted?: boolean;
  failureCode?: string | null;
  nowMs?: number;
}): HelixRealtimeProvisionalResponseV1 | null => {
  const job = jobsByHandoffId.get(input.handoffId);
  if (!job) return null;
  const nowMs = input.nowMs ?? Date.now();
  job.artifact = {
    ...job.artifact,
    status: input.status,
    status_reason: input.statusReason,
    provider_event_ref: input.providerEventRef ?? job.artifact.provider_event_ref,
    provider_response_ref: input.providerResponseRef ?? job.artifact.provider_response_ref,
    playback_receipt_ref: input.playbackReceiptRef ?? job.artifact.playback_receipt_ref,
    response_created: input.responseCreated ?? job.artifact.response_created,
    response_completed: input.responseCompleted ?? job.artifact.response_completed,
    updated_at_ms: nowMs,
    completed_at_ms: isTerminalStatus(input.status) ? nowMs : null,
    failure_code: input.failureCode === undefined
      ? job.artifact.failure_code
      : input.failureCode,
  };
  jobsByHandoffId.set(input.handoffId, job);
  if (input.providerResponseRef) {
    handoffIdByProviderResponseRef.set(input.providerResponseRef, input.handoffId);
  }
  if (isTerminalStatus(input.status)) {
    if (activeHandoffIdBySessionId.get(job.artifact.realtime_session_id) === input.handoffId) {
      activeHandoffIdBySessionId.delete(job.artifact.realtime_session_id);
    }
  }
  return job.artifact;
};

const operationalUtteranceFor = (handoff: HelixRealtimeStagePlayAskHandoffV1): {
  utteranceCode: string;
  text: string;
} => {
  if (handoff.worker_admission.outcome === "action_candidate") {
    return {
      utteranceCode: "readonly_action_check_in_progress",
      text: "I'm checking what the workstation can confirm without performing that action.",
    };
  }
  const route = handoff.worker_admission.selected_route ?? "";
  if (route === "repo_code") {
    return { utteranceCode: "repository_check_in_progress", text: "I'm checking the codebase." };
  }
  if (route === "scientific_calculator") {
    return {
      utteranceCode: "calculator_check_in_progress",
      text: "I'm checking that with the workstation calculator.",
    };
  }
  if (route === "scholarly_research") {
    return { utteranceCode: "research_check_in_progress", text: "I'm checking the research sources." };
  }
  if (route === "docs") {
    return { utteranceCode: "document_check_in_progress", text: "I'm checking the document." };
  }
  if (handoff.required_grounding_capability_ids.includes("workstation.active_context")) {
    return {
      utteranceCode: "workstation_context_check_in_progress",
      text: "I'm checking the current workstation view.",
    };
  }
  return {
    utteranceCode: "workstation_check_in_progress",
    text: "I'm checking that with the workstation agent.",
  };
};

const buildProviderEvent = (input: {
  responseId: string;
  handoff: HelixRealtimeStagePlayAskHandoffV1;
  kind: HelixRealtimeProvisionalResponseKindV1;
  utteranceCode: string;
  utteranceText?: string | null;
}): Record<string, unknown> => {
  const metadata = {
    helix_purpose: input.kind,
    helix_provisional_response_id: input.responseId,
    helix_handoff_id: input.handoff.handoff_id,
    helix_worker_admission_id: input.handoff.worker_admission.admission_id,
    helix_utterance_code: input.utteranceCode,
    answer_authority: "none",
  };
  if (input.kind === "conversation_local" || input.kind === "parallel_conversation") {
    const parallelConversation = input.kind === "parallel_conversation";
    return {
      event_id: `event_${hash([input.responseId, input.kind]).slice(0, 24)}`,
      type: "response.create",
      response: {
        output_modalities: ["audio"],
        tools: [],
        tool_choice: "none",
        metadata,
        instructions: parallelConversation
          ? [
              "Respond naturally and directly to the latest user turn now using your own model knowledge and the bounded conversation context supplied by Helix.",
              "A workstation runtime is processing the same turn in parallel; do not wait for it and do not say that you are checking with it.",
              "Its completed answer may be presented separately after your response.",
              "Do not claim that you used a tool, operated the workstation, observed objective workstation state, or produced the workstation's terminal answer.",
            ].join(" ")
          : [
              "Respond naturally and briefly to the latest user turn.",
              "Use only the user's speech and the bounded context supplied by Helix.",
              "Do not apologize for tools or capabilities that are unavailable in this provisional lane; state any limitation factually.",
              "Do not say you are checking the workstation because no worker was admitted for this turn.",
              "Never claim that Helix or GPT Live cannot contact Codex or the workstation agent.",
              "Never claim that you used a tool, operated the workstation, or produced a terminal answer.",
            ].join(" "),
      },
    };
  }
  return {
    event_id: `event_${hash([input.responseId, input.kind]).slice(0, 24)}`,
    type: "response.create",
    response: {
      conversation: "none",
      output_modalities: ["audio"],
      tools: [],
      tool_choice: "none",
      metadata,
      instructions: `Say exactly: ${input.utteranceText ?? "The workstation check did not start."}`,
    },
  };
};

const trimJobs = (): void => {
  if (jobsByHandoffId.size <= MAX_PROVISIONAL_RESPONSES) return;
  const oldest = Array.from(jobsByHandoffId.values())
    .sort((left, right) => left.artifact.created_at_ms - right.artifact.created_at_ms)
    .slice(0, jobsByHandoffId.size - MAX_PROVISIONAL_RESPONSES);
  for (const job of oldest) {
    jobsByHandoffId.delete(job.artifact.handoff_id);
    if (job.artifact.provider_response_ref) {
      handoffIdByProviderResponseRef.delete(job.artifact.provider_response_ref);
    }
  }
};

const attemptDelivery = (
  handoffId: string,
  nowMs = Date.now(),
): HelixRealtimeProvisionalResponseV1 | null => {
  const job = jobsByHandoffId.get(handoffId);
  if (!job || job.artifact.status !== "queued") return job?.artifact ?? null;
  const session = readSession(job.artifact.realtime_session_id);
  if (!session) {
    return transition({
      handoffId,
      status: "cancelled",
      statusReason: "realtime_session_closed",
      nowMs,
    });
  }
  if (job.artifact.kind === "worker_dispatch_status") {
    const relay = readRealtimeGroundedAnswerRelay(handoffId);
    if (relay && relay.status !== "worker_running") {
      return transition({
        handoffId,
        status: "suppressed",
        statusReason: "worker_result_ready_before_interim_response",
        nowMs,
      });
    }
  }
  if (session.sidebandState !== "open" || sessionIsBusy(session.realtimeSessionId)) {
    return job.artifact;
  }
  const accepted = sendRealtimeSidebandControlEvent({
    realtimeSessionId: session.realtimeSessionId,
    event: job.providerEvent,
    onComplete: (failureCode) => {
      if (!failureCode) return;
      transition({
        handoffId,
        status: "failed",
        statusReason: "provisional_response_send_failed",
        failureCode,
      });
    },
  });
  if (!accepted) return job.artifact;
  activeHandoffIdBySessionId.set(session.realtimeSessionId, handoffId);
  return transition({
    handoffId,
    status: "response_requested",
    statusReason: "post_admission_response_create_requested",
    providerEventRef: readString(job.providerEvent.event_id),
    responseCreated: true,
    nowMs,
  });
};

export const requestRealtimeProvisionalResponse = (input: {
  handoff: HelixRealtimeStagePlayAskHandoffV1;
  kind: HelixRealtimeProvisionalResponseKindV1;
  workerDispatchReceiptRef?: string | null;
  nowMs?: number;
}): HelixRealtimeProvisionalResponseV1 => {
  const existing = jobsByHandoffId.get(input.handoff.handoff_id);
  if (existing) return existing.artifact;
  const interactionMode = input.handoff.worker_admission.interaction_mode;
  const kind =
    input.kind === "worker_dispatch_status" ||
    input.kind === "worker_dispatch_failure"
      ? interactionMode === "parallel_conversation"
        ? "parallel_conversation"
        : interactionMode === "conversation_local"
          ? "conversation_local"
          : input.kind
      : input.kind;
  const nowMs = input.nowMs ?? Date.now();
  const operational = operationalUtteranceFor(input.handoff);
  const isConversationLocal = kind === "conversation_local";
  const isParallelConversation = kind === "parallel_conversation";
  const isDispatchFailure = kind === "worker_dispatch_failure";
  const utteranceCode = isConversationLocal
    ? "conversation_local_response"
    : isParallelConversation
      ? "parallel_conversation_response"
    : isDispatchFailure
      ? "worker_dispatch_did_not_start"
      : operational.utteranceCode;
  const responseId = `realtime-provisional-response:${hash([
    input.handoff.handoff_id,
    kind,
    input.workerDispatchReceiptRef ?? null,
  ]).slice(0, 20)}`;
  const artifact: HelixRealtimeProvisionalResponseV1 = {
    schema: HELIX_REALTIME_PROVISIONAL_RESPONSE_SCHEMA,
    provisional_response_id: responseId,
    realtime_session_id: input.handoff.realtime_session_id,
    thread_id: input.handoff.thread_id,
    handoff_id: input.handoff.handoff_id,
    worker_admission_id: input.handoff.worker_admission.admission_id,
    kind,
    status: "queued",
    status_reason: isConversationLocal
      ? "conversation_local_admission_completed"
      : isParallelConversation
        ? "parallel_conversation_admission_completed"
      : isDispatchFailure
        ? "worker_dispatch_failure_receipt_observed"
        : "worker_dispatch_requested_receipt_observed",
    utterance_code: utteranceCode,
    selected_route: input.handoff.worker_admission.selected_route,
    selected_runtime_agent_provider:
      input.handoff.worker_admission.selected_runtime_agent_provider,
    requested_after_admission: true,
    requested_after_worker_dispatch_receipt: Boolean(input.workerDispatchReceiptRef),
    worker_dispatch_receipt_ref: input.workerDispatchReceiptRef ?? null,
    provider_event_ref: null,
    provider_response_ref: null,
    playback_receipt_ref: null,
    response_created: false,
    response_completed: false,
    created_at_ms: nowMs,
    updated_at_ms: nowMs,
    completed_at_ms: null,
    failure_code: null,
    workstation_action_executed: false,
    realtime_provider_tool_executed: false,
    provider_payload_included: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  const providerEvent = buildProviderEvent({
    responseId,
    handoff: input.handoff,
    kind,
    utteranceCode,
    utteranceText: isDispatchFailure
      ? "The workstation check did not start."
      : operational.text,
  });
  for (const candidate of jobsByHandoffId.values()) {
    if (
      candidate.artifact.realtime_session_id === input.handoff.realtime_session_id &&
      candidate.artifact.handoff_id !== input.handoff.handoff_id &&
      candidate.artifact.status === "queued"
    ) {
      transition({
        handoffId: candidate.artifact.handoff_id,
        status: "suppressed",
        statusReason: "newer_realtime_handoff",
        nowMs,
      });
    }
  }
  jobsByHandoffId.set(input.handoff.handoff_id, { artifact, providerEvent });
  trimJobs();
  return attemptDelivery(input.handoff.handoff_id, nowMs) ?? artifact;
};

export const recordRealtimeProvisionalResponseClientReceipt = (input: {
  realtimeSessionId: string;
  receiptKind: string;
  clientReceiptRef?: string | null;
  providerResponseRef?: string | null;
  nowMs?: number;
}): HelixRealtimeProvisionalResponseV1 | null => {
  const handoffId = input.providerResponseRef
    ? handoffIdByProviderResponseRef.get(input.providerResponseRef) ?? null
    : activeHandoffIdBySessionId.get(input.realtimeSessionId) ?? null;
  if (!handoffId) return null;
  if (input.receiptKind === "playback_started") {
    return transition({
      handoffId,
      status: "speaking",
      statusReason: "browser_provisional_audio_playback_started",
      providerResponseRef: input.providerResponseRef,
      playbackReceiptRef: input.clientReceiptRef,
      nowMs: input.nowMs,
    });
  }
  if (input.receiptKind === "playback_ended") {
    return transition({
      handoffId,
      status: "delivered",
      statusReason: "browser_provisional_audio_playback_ended",
      providerResponseRef: input.providerResponseRef,
      playbackReceiptRef: input.clientReceiptRef,
      nowMs: input.nowMs,
    });
  }
  if (input.receiptKind === "playback_failed") {
    return transition({
      handoffId,
      status: "failed",
      statusReason: "browser_provisional_audio_playback_failed",
      providerResponseRef: input.providerResponseRef,
      playbackReceiptRef: input.clientReceiptRef,
      failureCode: "realtime_provisional_audio_playback_failed",
      nowMs: input.nowMs,
    });
  }
  if (input.receiptKind === "response_interrupted") {
    return transition({
      handoffId,
      status: "interrupted",
      statusReason: "qualified_user_barge_in",
      providerResponseRef: input.providerResponseRef,
      nowMs: input.nowMs,
    });
  }
  return jobsByHandoffId.get(handoffId)?.artifact ?? null;
};

const findJobForProviderEvent = (input: {
  realtimeSessionId: string;
  event: Record<string, unknown>;
}): ProvisionalResponseJob | null => {
  const response = readRecord(input.event.response);
  const metadata = readRecord(response?.metadata ?? input.event.metadata);
  const explicitHandoffId = readString(metadata?.helix_handoff_id);
  const explicitResponseId = readString(metadata?.helix_provisional_response_id);
  if (explicitHandoffId && explicitResponseId) {
    const job = jobsByHandoffId.get(explicitHandoffId) ?? null;
    return job?.artifact.provisional_response_id === explicitResponseId ? job : null;
  }
  const providerResponseRef = readString(
    response?.id ?? input.event.response_id ?? input.event.responseId,
  );
  const handoffId = providerResponseRef
    ? handoffIdByProviderResponseRef.get(providerResponseRef) ?? null
    : null;
  if (handoffId) return jobsByHandoffId.get(handoffId) ?? null;
  if (metadata && Object.keys(metadata).length > 0) return null;
  const activeHandoffId = activeHandoffIdBySessionId.get(input.realtimeSessionId);
  return activeHandoffId ? jobsByHandoffId.get(activeHandoffId) ?? null : null;
};

const recordProviderEvent = (input: {
  realtimeSessionId: string;
  event: Record<string, unknown>;
}): void => {
  const type = readString(input.event.type);
  if (!type) return;
  const job = findJobForProviderEvent(input);
  if (!job) return;
  const response = readRecord(input.event.response);
  const providerResponseRef = readString(
    response?.id ?? input.event.response_id ?? input.event.responseId,
  );
  if (type === "response.created") {
    transition({
      handoffId: job.artifact.handoff_id,
      status: "response_requested",
      statusReason: "provider_provisional_response_created",
      providerResponseRef,
      responseCreated: true,
    });
    return;
  }
  if (
    type.startsWith("response.output_audio.") ||
    type.startsWith("response.audio.") ||
    type === "output_audio_buffer.started"
  ) {
    transition({
      handoffId: job.artifact.handoff_id,
      status: "speaking",
      statusReason: "provider_provisional_audio_started",
      providerResponseRef,
    });
    return;
  }
  if (type === "response.done") {
    const responseStatus = readString(response?.status ?? input.event.status) ?? "completed";
    if (responseStatus === "cancelled") {
      transition({
        handoffId: job.artifact.handoff_id,
        status: "interrupted",
        statusReason: "provider_provisional_response_cancelled",
        providerResponseRef,
        responseCompleted: true,
      });
    } else if (responseStatus === "failed" || responseStatus === "incomplete") {
      transition({
        handoffId: job.artifact.handoff_id,
        status: "failed",
        statusReason: "provider_provisional_response_failed",
        providerResponseRef,
        responseCompleted: true,
        failureCode: `openai_realtime_response_${responseStatus}`,
      });
    } else {
      transition({
        handoffId: job.artifact.handoff_id,
        status: job.artifact.status,
        statusReason: "provider_provisional_response_completed",
        providerResponseRef,
        responseCompleted: true,
      });
    }
  }
};

export const readRealtimeProvisionalResponse = (
  handoffId: string | null | undefined,
): HelixRealtimeProvisionalResponseV1 | null =>
  handoffId ? jobsByHandoffId.get(handoffId)?.artifact ?? null : null;

export const listRealtimeProvisionalResponses = (input: {
  realtimeSessionId?: string | null;
  limit?: number;
} = {}): HelixRealtimeProvisionalResponseV1[] =>
  Array.from(jobsByHandoffId.values())
    .map((job) => job.artifact)
    .filter((artifact) =>
      !input.realtimeSessionId || artifact.realtime_session_id === input.realtimeSessionId)
    .sort((left, right) => left.created_at_ms - right.created_at_ms)
    .slice(-(input.limit ?? 40));

export const flushRealtimeProvisionalResponses = (
  realtimeSessionId: string,
  nowMs = Date.now(),
): void => {
  if (sessionIsBusy(realtimeSessionId)) return;
  const latest = Array.from(jobsByHandoffId.values())
    .filter((job) =>
      job.artifact.realtime_session_id === realtimeSessionId && job.artifact.status === "queued")
    .sort((left, right) => right.artifact.created_at_ms - left.artifact.created_at_ms)[0];
  if (latest) attemptDelivery(latest.artifact.handoff_id, nowMs);
};

export const cancelRealtimeProvisionalResponsesForSession = (input: {
  realtimeSessionId: string;
  reason: string;
  nowMs?: number;
}): void => {
  for (const job of jobsByHandoffId.values()) {
    if (
      job.artifact.realtime_session_id === input.realtimeSessionId &&
      !isTerminalStatus(job.artifact.status)
    ) {
      transition({
        handoffId: job.artifact.handoff_id,
        status: "cancelled",
        statusReason: input.reason,
        nowMs: input.nowMs,
      });
    }
  }
  activeHandoffIdBySessionId.delete(input.realtimeSessionId);
};

export const resetRealtimeProvisionalResponsesForTests = (): void => {
  jobsByHandoffId.clear();
  handoffIdByProviderResponseRef.clear();
  activeHandoffIdBySessionId.clear();
};

subscribeRealtimeSidebandProviderEvents(recordProviderEvent);

subscribeRealtimeSidebandActivity(({ realtimeSessionId, activity }) => {
  const activeHandoffId = activeHandoffIdBySessionId.get(realtimeSessionId);
  if (activity === "vad_speech_started" && activeHandoffId) {
    const job = jobsByHandoffId.get(activeHandoffId);
    if (job && (job.artifact.status === "response_requested" || job.artifact.status === "speaking")) {
      sendRealtimeSidebandControlEvent({
        realtimeSessionId,
        event: { type: "response.cancel" },
      });
      transition({
        handoffId: activeHandoffId,
        status: "interrupted",
        statusReason: "user_speech_interrupted_provisional_response",
      });
    }
    return;
  }
  if (
    activity === "sideband_open" ||
    activity === "vad_speech_stopped" ||
    activity === "response_completed" ||
    activity === "response_failed" ||
    activity === "response_interrupted" ||
    activity === "playback_ended" ||
    activity === "playback_failed"
  ) {
    flushRealtimeProvisionalResponses(realtimeSessionId);
  }
});

subscribeRealtimeSidebandSessionClosed(({ realtimeSessionId, reason }) => {
  cancelRealtimeProvisionalResponsesForSession({ realtimeSessionId, reason });
});
