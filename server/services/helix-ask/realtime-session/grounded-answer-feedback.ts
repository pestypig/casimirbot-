import crypto from "node:crypto";
import type { RequestHandler } from "express";
import type {
  HelixRealtimeStagePlayAskHandoffV1,
  HelixRealtimeStagePlayGroundedAnswerV1,
} from "@shared/contracts/helix-realtime-stage-play.v1";
import { readRealtimeStagePlayAskHandoff } from "../live-source/realtime-stage-play-handoff";
import { recordStagePlayLiveSourceConversationEvent } from "../../stage-play/stage-play-live-source-conversation-store";
import {
  enqueueRealtimeGroundedAnswerRelay,
  resetRealtimeGroundedAnswerRelaysForTests,
  suppressRealtimeGroundedAnswerRelay,
} from "./grounded-answer-relay";
import { resolveRealtimeGroundedFeedbackBinding } from "./grounded-answer-feedback-binding";
import {
  readRealtimeGroundedFeedbackObserverAudit,
  resetRealtimeGroundedFeedbackObserverAuditsForTests,
  updateRealtimeGroundedFeedbackObserverAudit,
} from "./grounded-answer-feedback-audit";
import {
  evaluateRealtimeGroundingEvidence as evaluateLegacyRuntimeGoalGroundingEvidence,
} from "./grounded-answer-evidence";
import { createRealtimeGroundedFinalResponseCapture } from "./grounded-answer-final-response-capture";
import {
  evaluateRealtimeTerminalRelayAuthority,
  type RealtimeTerminalRelayAuthorityEvaluation,
} from "./terminal-relay-authority";
import { resolveRealtimeFinalWorkerAdmission } from "./worker-admission";

const groundedAnswersByHandoffId = new Map<string, HelixRealtimeStagePlayGroundedAnswerV1>();

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as RecordLike : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map(readString).filter((entry): entry is string => Boolean(entry))
    : [];

const unique = (values: Array<string | null | undefined>, limit = 48): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))).slice(0, limit);

const readRecordArray = (value: unknown): RecordLike[] =>
  Array.isArray(value)
    ? value.map(readRecord).filter((entry): entry is RecordLike => Boolean(entry))
    : [];

const hashText = (value: string): string =>
  `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;

const readDebug = (payload: RecordLike): RecordLike | null => {
  const direct = readRecord(payload.debug);
  if (direct) return direct;
  const serialized = readString(payload.debug);
  if (!serialized) return null;
  try {
    return readRecord(JSON.parse(serialized));
  } catch {
    return null;
  }
};

const recordAcceptedRealtimeGroundedAnswer = (input: {
  handoff: HelixRealtimeStagePlayAskHandoffV1;
  payload: RecordLike;
  debug: RecordLike | null;
  solverTrace: RecordLike | null;
  terminalAuthority: RecordLike;
  answerText: string;
  finalAnswerSource: string;
  terminalArtifactKind: string;
  groundingEvidenceRefs: string[];
  groundingProofSource:
    | "canonical_terminal_boundary"
    | "canonical_terminal_boundary_compatibility"
    | "gateway_call_results"
    | "canonical_solver_trace"
    | null;
  terminalRelayAuthority: RealtimeTerminalRelayAuthorityEvaluation;
  askTurnId?: string | null;
  additionalEvidenceRefs?: string[];
  nowMs: number;
}): HelixRealtimeStagePlayGroundedAnswerV1 => {
  const askTurnId =
    input.terminalRelayAuthority.askTurnId ??
    readString(input.askTurnId) ??
    readString(input.payload.turn_id ?? input.payload.turnId) ??
    readString(input.terminalAuthority.turn_id);
  const runtimeGoalSession = readRecord(input.payload.runtime_goal_session);
  const evidenceRefs = unique([
    input.handoff.handoff_id,
    input.handoff.transcript_observation_ref,
    input.handoff.stage_play_event_ref,
    input.handoff.context_pack_id,
    input.handoff.goal_id,
    input.handoff.runtime_goal_session_ref,
    input.terminalRelayAuthority.terminalArtifactRef,
    ...input.groundingEvidenceRefs,
    ...(input.additionalEvidenceRefs ?? []),
    ...readStringArray(input.payload.runtime_goal_observation_refs),
    ...readStringArray(runtimeGoalSession?.latest_observation_refs),
    ...readStringArray(runtimeGoalSession?.latest_receipt_refs),
    ...readStringArray(input.payload.selected_terminal_support_refs),
    ...readStringArray(input.payload.terminal_synthesis_support_refs),
    ...readStringArray(input.terminalAuthority.support_refs),
  ]);
  const stagePlayEvent = recordStagePlayLiveSourceConversationEvent({
    threadId: input.handoff.thread_id,
    text: input.answerText,
    source: "assistant_answer",
    turnId: askTurnId,
    evidenceRefs,
    now: new Date(input.nowMs).toISOString(),
  });
  const feedback: HelixRealtimeStagePlayGroundedAnswerV1 = {
    feedback_id: `realtime-grounded-answer:${crypto
      .createHash("sha256")
      .update(`${input.handoff.handoff_id}:${askTurnId ?? "unknown"}:${hashText(input.answerText)}`)
      .digest("hex")
      .slice(0, 20)}`,
    handoff_id: input.handoff.handoff_id,
    realtime_session_id: input.handoff.realtime_session_id,
    thread_id: input.handoff.thread_id,
    goal_id: input.handoff.goal_id,
    ask_turn_id: askTurnId,
    stage_play_event_ref: stagePlayEvent.eventId,
    answer_text_hash: hashText(input.answerText),
    answer_text_char_count: input.answerText.length,
    final_answer_source: input.finalAnswerSource,
    terminal_artifact_kind: input.terminalArtifactKind,
    terminal_artifact_ref: input.terminalRelayAuthority.terminalArtifactRef as string,
    terminal_text_hash: input.terminalRelayAuthority.terminalTextHash as string,
    grounding_authority_ref:
      input.terminalRelayAuthority.groundingAuthorityRef as string,
    relay_basis: input.terminalRelayAuthority.relayBasis,
    terminal_speech_authority_status: "validated",
    evidence_refs: evidenceRefs,
    grounding_evidence_refs: input.groundingEvidenceRefs,
    grounding_proof_source: input.groundingProofSource,
    required_grounding_capability_ids:
      input.terminalRelayAuthority.requiredGroundingCapabilityIds,
    grounding_required: input.terminalRelayAuthority.groundingRequired,
    grounding_evidence_satisfied: true,
    recorded_at_ms: input.nowMs,
    completed_solver_path: true,
    server_authoritative: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  groundedAnswersByHandoffId.set(input.handoff.handoff_id, feedback);
  const workerAdmission = resolveRealtimeFinalWorkerAdmission({
    preliminary: input.handoff.worker_admission,
    payload: input.payload,
    debug: input.debug,
    solverTrace: input.solverTrace,
    evidenceRefs,
    nowMs: input.nowMs,
  });
  const relay = enqueueRealtimeGroundedAnswerRelay({
    handoff: input.handoff,
    feedback,
    workerAdmission,
    answerText: input.answerText,
    nowMs: input.nowMs,
  });
  updateRealtimeGroundedFeedbackObserverAudit({
    handoff: input.handoff,
    patch: {
      turn_final_status: "captured",
      terminal_authority_status: "validated",
      terminal_speech_authority_status: "validated",
      relay_basis: input.terminalRelayAuthority.relayBasis,
      grounding_required: input.terminalRelayAuthority.groundingRequired,
      grounding_evidence_status: input.terminalRelayAuthority.groundingRequired
        ? "validated"
        : "not_required",
      grounding_proof_source: input.groundingProofSource,
      feedback_status: "recorded",
      relay_status: relay.status,
      ask_turn_id: askTurnId,
      terminal_artifact_ref: input.terminalRelayAuthority.terminalArtifactRef,
      terminal_text_hash: input.terminalRelayAuthority.terminalTextHash,
      grounding_authority_ref:
        input.terminalRelayAuthority.groundingAuthorityRef,
      grounding_evidence_refs: input.groundingEvidenceRefs,
      failure_code: null,
      completed_at_ms: input.nowMs,
    },
    nowMs: input.nowMs,
  });
  return feedback;
};

export const recordRealtimeGroundedAnswerFromPayload = (input: {
  handoffId: string;
  payload: RecordLike;
  askTurnId?: string | null;
  nowMs?: number;
}): HelixRealtimeStagePlayGroundedAnswerV1 | null => {
  const existing = groundedAnswersByHandoffId.get(input.handoffId);
  if (existing) return existing;
  const handoff = readRealtimeStagePlayAskHandoff(input.handoffId);
  if (!handoff) return null;
  const debug = readDebug(input.payload);
  const solverTrace = readRecord(input.payload.ask_turn_solver_trace) ?? readRecord(debug?.ask_turn_solver_trace);
  const terminalAuthority =
    readRecord(input.payload.terminal_answer_authority) ??
    readRecord(debug?.terminal_answer_authority);
  const completedSolverPath = solverTrace?.completed_solver_path === true;
  const serverAuthoritative = terminalAuthority?.server_authoritative === true;
  const terminalArtifactKind =
    readString(input.payload.terminal_artifact_kind) ??
    readString(terminalAuthority?.terminal_artifact_kind);
  const finalAnswerSource =
    readString(input.payload.final_answer_source) ??
    readString(terminalAuthority?.final_answer_source);
  const answerText =
    readString(input.payload.selected_final_answer) ??
    readString(input.payload.content) ??
    readString(input.payload.answer) ??
    readString(input.payload.text);
  const terminalRelayAuthority = evaluateRealtimeTerminalRelayAuthority({
    handoff,
    payload: input.payload,
    debug,
    solverTrace,
    terminalAuthority,
    answerText,
    finalAnswerSource,
    terminalArtifactKind,
    askTurnId: input.askTurnId,
  });
  const nowMs = input.nowMs ?? Date.now();
  const rejectionReason =
    terminalArtifactKind === "typed_failure" || finalAnswerSource === "typed_failure"
      ? "typed_failure_not_spoken"
      : terminalArtifactKind === "request_user_input"
        ? "request_user_input_not_spoken"
        : terminalArtifactKind === "tool_receipt"
          ? "tool_receipt_not_answer_authority"
          : terminalRelayAuthority.failureCode
            ? terminalRelayAuthority.failureCode
            : null;
  if (rejectionReason) {
    const relay = suppressRealtimeGroundedAnswerRelay({
      handoffId: handoff.handoff_id,
      reason: rejectionReason,
      failureCode: rejectionReason,
      nowMs,
    });
    const terminalAuthorityValidated = Boolean(
      completedSolverPath && serverAuthoritative && answerText &&
      terminalArtifactKind && finalAnswerSource,
    );
    updateRealtimeGroundedFeedbackObserverAudit({
      handoff,
      patch: {
        turn_final_status: "captured",
        terminal_authority_status: terminalAuthorityValidated ? "validated" : "rejected",
        terminal_speech_authority_status:
          terminalRelayAuthority.terminalSpeechAuthorityStatus,
        relay_basis: terminalRelayAuthority.relayBasis,
        grounding_required: terminalRelayAuthority.groundingRequired,
        grounding_evidence_status: !terminalRelayAuthority.groundingRequired
          ? "not_required"
          : terminalRelayAuthority.failureCode
            ? "rejected"
            : "validated",
        grounding_proof_source:
          terminalRelayAuthority.groundingProofSource,
        feedback_status: "suppressed",
        relay_status: relay?.status ?? null,
        ask_turn_id:
          terminalRelayAuthority.askTurnId,
        terminal_artifact_ref: terminalRelayAuthority.terminalArtifactRef,
        terminal_text_hash: terminalRelayAuthority.terminalTextHash,
        grounding_authority_ref:
          terminalRelayAuthority.groundingAuthorityRef,
        grounding_evidence_refs:
          terminalRelayAuthority.groundingEvidenceRefs,
        failure_code: rejectionReason,
        completed_at_ms: nowMs,
      },
      nowMs,
    });
    return null;
  }
  return recordAcceptedRealtimeGroundedAnswer({
    handoff,
    payload: input.payload,
    debug,
    solverTrace,
    terminalAuthority: terminalAuthority as RecordLike,
    answerText: answerText as string,
    finalAnswerSource: finalAnswerSource as string,
    terminalArtifactKind: terminalArtifactKind as string,
    groundingEvidenceRefs: terminalRelayAuthority.groundingEvidenceRefs,
    groundingProofSource: terminalRelayAuthority.groundingProofSource,
    terminalRelayAuthority,
    askTurnId: input.askTurnId,
    nowMs,
  });
};

export const recordRealtimeGroundedAnswerFromRuntimeGoalPayload = (input: {
  handoffId: string;
  payload: RecordLike;
  askTurnId?: string | null;
  nowMs?: number;
}): HelixRealtimeStagePlayGroundedAnswerV1 | null => {
  const existing = groundedAnswersByHandoffId.get(input.handoffId);
  if (existing) return existing;
  const handoff = readRealtimeStagePlayAskHandoff(input.handoffId);
  if (!handoff) return null;
  const debug = readDebug(input.payload);
  const runtimeGoalDebug =
    readRecord(input.payload.runtime_goal_debug_export) ??
    readRecord(debug?.runtime_goal_debug_export);
  const terminalAuthority =
    readRecord(input.payload.terminal_answer_authority) ??
    readRecord(debug?.terminal_answer_authority);
  const providerTerminalAuthority = readRecord(runtimeGoalDebug?.terminal_answer_authority);
  const runtimeGoalSession = readRecord(input.payload.runtime_goal_session);
  const wakeEvent = readRecord(input.payload.runtime_goal_wake_event ?? input.payload.wake_event);
  const wakeEventId =
    readString(input.payload.wake_event_id) ??
    readString(wakeEvent?.wake_event_id);
  const debugEvents = readRecordArray(runtimeGoalDebug?.debug_events);
  const matchesWake = (event: RecordLike): boolean =>
    !wakeEventId || readString(event.wake_event_id) === wakeEventId;
  const evidenceReentered = debugEvents.some((event) =>
    matchesWake(event) && event.stage === "evidence_reentered" && event.status === "completed");
  const terminalAuthorityEvaluated = debugEvents.some((event) =>
    matchesWake(event) &&
    event.stage === "terminal_authority_evaluated" &&
    event.status === "completed" &&
    event.terminal_authority_status === "authorized");
  const payloadGoalId =
    readString(input.payload.goal_id) ??
    readString(runtimeGoalSession?.goal_id);
  const terminalArtifactKind =
    readString(input.payload.terminal_artifact_kind) ??
    readString(terminalAuthority?.terminal_artifact_kind);
  const finalAnswerSource =
    readString(input.payload.final_answer_source) ??
    readString(terminalAuthority?.final_answer_source);
  const answerText =
    readString(input.payload.selected_final_answer) ??
    readString(input.payload.answer) ??
    readString(input.payload.text);
  const terminalAuthorityStatus =
    readString(input.payload.runtime_goal_terminal_authority_status) ??
    readString(runtimeGoalDebug?.terminal_authority_status) ??
    readString(runtimeGoalSession?.terminal_authority_status);
  const completedGoalSolverPath =
    input.payload.ok === true &&
    handoff.goal_id !== null &&
    payloadGoalId === handoff.goal_id &&
    terminalAuthorityStatus === "authorized" &&
    evidenceReentered &&
    terminalAuthorityEvaluated &&
    providerTerminalAuthority?.server_authoritative === true;
  // Runtime-goal commands have their own authority lifecycle and do not yet
  // return the Ask terminal grounding certificate.
  const grounding = evaluateLegacyRuntimeGoalGroundingEvidence({
    turnId:
      readString(input.payload.turn_id) ??
      readString(input.payload.ask_turn_id) ??
      readString(runtimeGoalSession?.turn_id) ??
      "",
    requiredCapabilityIds: handoff.required_grounding_capability_ids,
    payload: input.payload,
    debug,
    solverTrace: null,
    evidenceContinuationCompleted: evidenceReentered && terminalAuthorityEvaluated,
  });
  const nowMs = input.nowMs ?? Date.now();
  const rejectionReason = !completedGoalSolverPath
    ? "runtime_goal_solver_path_not_completed"
    : terminalAuthority?.server_authoritative !== true
      ? "terminal_answer_not_server_authoritative"
      : !answerText ||
          terminalArtifactKind !== "runtime_goal_command_result" ||
          finalAnswerSource !== "runtime_goal_command"
        ? "runtime_goal_terminal_answer_contract_incomplete"
        : !grounding.satisfied
          ? "required_grounding_evidence_missing"
          : null;
  if (rejectionReason) {
    const relay = suppressRealtimeGroundedAnswerRelay({
      handoffId: handoff.handoff_id,
      reason: rejectionReason,
      failureCode: rejectionReason,
      nowMs,
    });
    updateRealtimeGroundedFeedbackObserverAudit({
      handoff,
      patch: {
        turn_final_status: "captured",
        terminal_authority_status:
          completedGoalSolverPath && terminalAuthority?.server_authoritative === true
            ? "validated"
            : "rejected",
        terminal_speech_authority_status:
          completedGoalSolverPath && terminalAuthority?.server_authoritative === true
            ? "validated"
            : "rejected",
        relay_basis: handoff.required_grounding_capability_ids.length > 0
          ? "grounded_capability_terminal"
          : "model_direct_terminal",
        grounding_required: handoff.required_grounding_capability_ids.length > 0,
        grounding_evidence_status: handoff.required_grounding_capability_ids.length === 0
          ? "not_required"
          : grounding.satisfied
            ? "validated"
            : "rejected",
        grounding_proof_source: grounding.proofSource,
        feedback_status: "suppressed",
        relay_status: relay?.status ?? null,
        ask_turn_id:
          readString(input.askTurnId) ??
          readString(input.payload.turn_id ?? input.payload.turnId),
        terminal_artifact_ref: readString(terminalAuthority?.terminal_artifact_ref),
        terminal_text_hash: readString(terminalAuthority?.terminal_text_hash),
        grounding_authority_ref: null,
        grounding_evidence_refs: grounding.evidenceRefs,
        failure_code: rejectionReason,
        completed_at_ms: nowMs,
      },
      nowMs,
    });
    return null;
  }
  const runtimeAskTurnId =
    readString(input.askTurnId) ??
    readString(input.payload.turn_id ?? input.payload.turnId) ??
    readString(runtimeGoalSession?.turn_id) ??
    "runtime-goal";
  const runtimeTerminalArtifactRef =
    readString(terminalAuthority?.terminal_artifact_ref) ??
    `${runtimeAskTurnId}:runtime_goal_command_result`;
  const runtimeTerminalTextHash =
    readString(terminalAuthority?.terminal_text_hash) ??
    hashText(answerText as string);
  return recordAcceptedRealtimeGroundedAnswer({
    handoff,
    payload: input.payload,
    debug,
    solverTrace: null,
    terminalAuthority: terminalAuthority as RecordLike,
    answerText: answerText as string,
    finalAnswerSource: finalAnswerSource as string,
    terminalArtifactKind: terminalArtifactKind as string,
    groundingEvidenceRefs: grounding.evidenceRefs,
    groundingProofSource: grounding.proofSource,
    terminalRelayAuthority: {
      askTurnId: runtimeAskTurnId,
      terminalArtifactRef: runtimeTerminalArtifactRef,
      terminalTextHash: runtimeTerminalTextHash.startsWith("sha256:")
        ? runtimeTerminalTextHash
        : `sha256:${runtimeTerminalTextHash}`,
      terminalSpeechAuthorityStatus: "validated",
      relayBasis: handoff.required_grounding_capability_ids.length > 0
        ? "grounded_capability_terminal"
        : "model_direct_terminal",
      groundingRequired: handoff.required_grounding_capability_ids.length > 0,
      groundingEvidenceRefs: grounding.evidenceRefs,
      groundingAuthorityRef:
        `runtime-goal-grounding:${runtimeAskTurnId}`,
      groundingProofSource: grounding.proofSource === "gateway_call_results"
        ? "gateway_call_results"
        : "canonical_solver_trace",
      requiredGroundingCapabilityIds: handoff.required_grounding_capability_ids,
      failureCode: null,
    },
    additionalEvidenceRefs: wakeEventId ? [wakeEventId] : [],
    askTurnId: input.askTurnId,
    nowMs,
  });
};

export const createRealtimeGroundedAnswerFeedbackMiddleware = (): RequestHandler =>
  (req, res, next) => {
    if (
      req.method !== "POST" ||
      (req.path !== "/ask/turn" && req.path !== "/ask/turn/stream")
    ) {
      next();
      return;
    }
    const bindingResolution = resolveRealtimeGroundedFeedbackBinding(req.body);
    if (bindingResolution.failureCode || !bindingResolution.handoff) {
      const existingAudit = bindingResolution.handoff
        ? readRealtimeGroundedFeedbackObserverAudit(bindingResolution.handoff.handoff_id)
        : null;
      if (
        bindingResolution.handoff &&
        existingAudit?.binding_status !== "validated" &&
        existingAudit?.feedback_status !== "recorded"
      ) {
        updateRealtimeGroundedFeedbackObserverAudit({
          handoff: bindingResolution.handoff,
          patch: {
            binding_status: "rejected",
            binding_source: bindingResolution.bindingSource,
            failure_code: bindingResolution.failureCode,
          },
        });
      }
      next();
      return;
    }
    const handoff = bindingResolution.handoff;
    const handoffId = handoff.handoff_id;
    updateRealtimeGroundedFeedbackObserverAudit({
      handoff,
      patch: {
        binding_status: "validated",
        binding_source: bindingResolution.bindingSource,
        failure_code: null,
      },
    });

    const responseCapture = createRealtimeGroundedFinalResponseCapture({
      streaming: req.path === "/ask/turn/stream",
    });
    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);
    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      responseCapture.capturePayload(body);
      return originalJson(body);
    }) as typeof res.json;
    res.write = ((chunk: unknown, ...args: unknown[]) => {
      const encoding = typeof args[0] === "string" ? args[0] as BufferEncoding : undefined;
      responseCapture.capture(chunk, encoding);
      return originalWrite(chunk as never, ...(args as never[]));
    }) as typeof res.write;
    res.end = ((chunk?: unknown, ...args: unknown[]) => {
      const encoding = typeof args[0] === "string" ? args[0] as BufferEncoding : undefined;
      responseCapture.capture(chunk, encoding);
      return originalEnd(chunk as never, ...(args as never[]));
    }) as typeof res.end;
    res.once("finish", () => {
      const nowMs = Date.now();
      const captureResult = responseCapture.finish();
      const payload = captureResult.payload;
      const request = readRecord(req.body);
      const requestAskTurnId = readString(
        request?.turnId ?? request?.turn_id ?? request?.traceId,
      );
      if (!payload) {
        const failureCode = captureResult.failureCode ??
          "realtime_feedback_turn_final_payload_missing";
        const relay = suppressRealtimeGroundedAnswerRelay({
          handoffId,
          reason: failureCode,
          failureCode,
          nowMs,
        });
        updateRealtimeGroundedFeedbackObserverAudit({
          handoff,
          patch: {
            turn_final_status: "rejected",
            feedback_status: "suppressed",
            relay_status: relay?.status ?? null,
            ask_turn_id: requestAskTurnId,
            failure_code: failureCode,
            completed_at_ms: nowMs,
          },
          nowMs,
        });
        return;
      }
      const askTurnId =
        requestAskTurnId ??
        readString(payload.turn_id ?? payload.turnId);
      updateRealtimeGroundedFeedbackObserverAudit({
        handoff,
        patch: {
          turn_final_status: "captured",
          ask_turn_id: askTurnId,
          failure_code: null,
        },
        nowMs,
      });
      recordRealtimeGroundedAnswerFromPayload({
        handoffId,
        payload,
        askTurnId,
        nowMs,
      });
    });
    next();
  };

export const readRealtimeGroundedAnswer = (
  handoffId: string | null | undefined,
): HelixRealtimeStagePlayGroundedAnswerV1 | null =>
  handoffId ? groundedAnswersByHandoffId.get(handoffId) ?? null : null;

export const resetRealtimeGroundedAnswerFeedbackForTests = (): void => {
  groundedAnswersByHandoffId.clear();
  resetRealtimeGroundedFeedbackObserverAuditsForTests();
  resetRealtimeGroundedAnswerRelaysForTests();
};
