import crypto from "node:crypto";
import type { RequestHandler } from "express";
import type { HelixRealtimeStagePlayGroundedAnswerV1 } from "@shared/contracts/helix-realtime-stage-play.v1";
import { readRealtimeStagePlayAskHandoff } from "../live-source/realtime-stage-play-handoff";
import { recordStagePlayLiveSourceConversationEvent } from "../../stage-play/stage-play-live-source-conversation-store";

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
  if (
    !completedSolverPath ||
    !serverAuthoritative ||
    !answerText ||
    !terminalArtifactKind ||
    !finalAnswerSource ||
    terminalArtifactKind === "typed_failure" ||
    terminalArtifactKind === "request_user_input" ||
    terminalArtifactKind === "tool_receipt" ||
    finalAnswerSource === "typed_failure"
  ) {
    return null;
  }

  const askTurnId =
    readString(input.askTurnId) ??
    readString(input.payload.turn_id ?? input.payload.turnId) ??
    readString(terminalAuthority?.turn_id);
  const evidenceRefs = unique([
    handoff.handoff_id,
    handoff.transcript_observation_ref,
    handoff.stage_play_event_ref,
    handoff.context_pack_id,
    ...readStringArray(input.payload.selected_terminal_support_refs),
    ...readStringArray(input.payload.terminal_synthesis_support_refs),
    ...readStringArray(terminalAuthority?.support_refs),
  ]);
  const nowMs = input.nowMs ?? Date.now();
  const stagePlayEvent = recordStagePlayLiveSourceConversationEvent({
    threadId: handoff.thread_id,
    text: answerText,
    source: "assistant_answer",
    turnId: askTurnId,
    evidenceRefs,
    now: new Date(nowMs).toISOString(),
  });
  const feedback: HelixRealtimeStagePlayGroundedAnswerV1 = {
    feedback_id: `realtime-grounded-answer:${crypto
      .createHash("sha256")
      .update(`${handoff.handoff_id}:${askTurnId ?? "unknown"}:${hashText(answerText)}`)
      .digest("hex")
      .slice(0, 20)}`,
    handoff_id: handoff.handoff_id,
    realtime_session_id: handoff.realtime_session_id,
    thread_id: handoff.thread_id,
    ask_turn_id: askTurnId,
    stage_play_event_ref: stagePlayEvent.eventId,
    answer_text_hash: hashText(answerText),
    answer_text_char_count: answerText.length,
    final_answer_source: finalAnswerSource,
    terminal_artifact_kind: terminalArtifactKind,
    evidence_refs: evidenceRefs,
    recorded_at_ms: nowMs,
    completed_solver_path: true,
    server_authoritative: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  groundedAnswersByHandoffId.set(handoff.handoff_id, feedback);
  return feedback;
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
};
