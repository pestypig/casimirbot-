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
import { resolveRealtimeFinalWorkerAdmission } from "./worker-admission";

const MAX_CAPTURE_BYTES = 1_250_000;
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

const readFinalPayloadFromCapture = (captured: string): RecordLike | null => {
  if (!captured.trim()) return null;
  if (/^\s*event:\s*turn_final\s*$/m.test(captured)) {
    const blocks = captured.split(/\r?\n\r?\n/);
    for (const block of blocks.reverse()) {
      if (!/^event:\s*turn_final\s*$/m.test(block)) continue;
      const data = block
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (!data) continue;
      try {
        return readRecord(JSON.parse(data));
      } catch {
        return null;
      }
    }
    return null;
  }
  try {
    return readRecord(JSON.parse(captured));
  } catch {
    return null;
  }
};

const readHandoffId = (body: unknown): string | null => {
  const request = readRecord(body);
  const routeMetadata = readRecord(request?.routeMetadata ?? request?.route_metadata);
  const sourceTargetIntent = readRecord(
    routeMetadata?.source_target_intent ?? request?.source_target_intent,
  );
  const invocationKind = readString(routeMetadata?.invocationKind ?? routeMetadata?.invocation_kind);
  if (invocationKind !== "stage_play_realtime_transcript_handoff") return null;
  return readString(
    routeMetadata?.handoffId ??
    routeMetadata?.handoff_id ??
    sourceTargetIntent?.handoff_id ??
    sourceTargetIntent?.handoffId,
  );
};

const collectGatewayResults = (payload: RecordLike, debug: RecordLike | null): RecordLike[] => [
  ...readRecordArray(payload.workstation_gateway_call_results),
  ...readRecordArray(debug?.workstation_gateway_call_results),
];

const gatewayResultEvidenceRefs = (result: RecordLike): string[] => {
  const observationPacket = readRecord(result.observation_packet);
  return unique([
    ...readStringArray(result.artifact_refs),
    ...readStringArray(observationPacket?.produced_artifact_refs),
    readString(observationPacket?.call_id),
  ]);
};

const requiredGroundingSatisfied = (input: {
  requiredCapabilityIds: string[];
  payload: RecordLike;
  debug: RecordLike | null;
  evidenceContinuationCompleted: boolean;
}): { satisfied: boolean; evidenceRefs: string[] } => {
  if (input.requiredCapabilityIds.length === 0) return { satisfied: true, evidenceRefs: [] };
  if (!input.evidenceContinuationCompleted) {
    return { satisfied: false, evidenceRefs: [] };
  }
  const gatewayResults = collectGatewayResults(input.payload, input.debug);
  const selectedResults = input.requiredCapabilityIds.map((capabilityId) =>
    gatewayResults.find((result) => {
      const observationPacket = readRecord(result.observation_packet);
      return (
        readString(result.capability_id ?? result.capabilityId) === capabilityId &&
        result.ok === true &&
        observationPacket?.status === "succeeded"
      );
    }) ?? null);
  if (selectedResults.some((result) => !result)) return { satisfied: false, evidenceRefs: [] };
  return {
    satisfied: true,
    evidenceRefs: unique(selectedResults.flatMap((result) => gatewayResultEvidenceRefs(result!))),
  };
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
  askTurnId?: string | null;
  additionalEvidenceRefs?: string[];
  nowMs: number;
}): HelixRealtimeStagePlayGroundedAnswerV1 => {
  const askTurnId =
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
    evidence_refs: evidenceRefs,
    required_grounding_capability_ids: input.handoff.required_grounding_capability_ids,
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
  enqueueRealtimeGroundedAnswerRelay({
    handoff: input.handoff,
    feedback,
    workerAdmission,
    answerText: input.answerText,
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
  const evidenceReentry = readRecord(solverTrace?.evidence_reentry);
  const followupReasoning = readRecord(solverTrace?.followup_reasoning);
  const grounding = requiredGroundingSatisfied({
    requiredCapabilityIds: handoff.required_grounding_capability_ids,
    payload: input.payload,
    debug,
    evidenceContinuationCompleted:
      evidenceReentry?.required === true &&
      evidenceReentry.completed === true &&
      followupReasoning?.required === true &&
      followupReasoning.completed === true,
  });
  const nowMs = input.nowMs ?? Date.now();
  const rejectionReason = !completedSolverPath
    ? "solver_path_not_completed"
    : !serverAuthoritative
      ? "terminal_answer_not_server_authoritative"
      : !answerText || !terminalArtifactKind || !finalAnswerSource
        ? "terminal_answer_contract_incomplete"
        : terminalArtifactKind === "typed_failure" || finalAnswerSource === "typed_failure"
          ? "typed_failure_not_spoken"
          : terminalArtifactKind === "request_user_input"
            ? "request_user_input_not_spoken"
            : terminalArtifactKind === "tool_receipt"
              ? "tool_receipt_not_answer_authority"
              : !grounding.satisfied
                ? "required_grounding_evidence_missing"
                : null;
  if (rejectionReason) {
    suppressRealtimeGroundedAnswerRelay({
      handoffId: handoff.handoff_id,
      reason: rejectionReason,
      failureCode: rejectionReason,
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
    groundingEvidenceRefs: grounding.evidenceRefs,
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
  const grounding = requiredGroundingSatisfied({
    requiredCapabilityIds: handoff.required_grounding_capability_ids,
    payload: input.payload,
    debug,
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
    suppressRealtimeGroundedAnswerRelay({
      handoffId: handoff.handoff_id,
      reason: rejectionReason,
      failureCode: rejectionReason,
      nowMs,
    });
    return null;
  }
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
    additionalEvidenceRefs: [wakeEventId],
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
    const handoffId = readHandoffId(req.body);
    if (!handoffId || !readRealtimeStagePlayAskHandoff(handoffId)) {
      next();
      return;
    }

    const chunks: Buffer[] = [];
    let capturedBytes = 0;
    const capture = (chunk: unknown, encoding?: BufferEncoding): void => {
      if (chunk === undefined || chunk === null) return;
      const buffer = Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(String(chunk), encoding ?? "utf8");
      chunks.push(buffer);
      capturedBytes += buffer.length;
      while (capturedBytes > MAX_CAPTURE_BYTES && chunks.length > 0) {
        const overflow = capturedBytes - MAX_CAPTURE_BYTES;
        const first = chunks[0];
        if (first.length <= overflow) {
          chunks.shift();
          capturedBytes -= first.length;
        } else {
          chunks[0] = first.subarray(overflow);
          capturedBytes -= overflow;
        }
      }
    };
    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);
    res.write = ((chunk: unknown, ...args: unknown[]) => {
      const encoding = typeof args[0] === "string" ? args[0] as BufferEncoding : undefined;
      capture(chunk, encoding);
      return originalWrite(chunk as never, ...(args as never[]));
    }) as typeof res.write;
    res.end = ((chunk?: unknown, ...args: unknown[]) => {
      const encoding = typeof args[0] === "string" ? args[0] as BufferEncoding : undefined;
      capture(chunk, encoding);
      return originalEnd(chunk as never, ...(args as never[]));
    }) as typeof res.end;
    res.once("finish", () => {
      const payload = readFinalPayloadFromCapture(Buffer.concat(chunks).toString("utf8"));
      if (!payload) return;
      const request = readRecord(req.body);
      recordRealtimeGroundedAnswerFromPayload({
        handoffId,
        payload,
        askTurnId: readString(request?.turnId ?? request?.turn_id ?? request?.traceId),
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
  resetRealtimeGroundedAnswerRelaysForTests();
};
