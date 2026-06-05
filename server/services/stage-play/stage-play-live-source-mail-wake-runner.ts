import type { StagePlayLiveSourceMailItemV1 } from "@shared/contracts/stage-play-live-source-mail.v1";
import type {
  StagePlayLiveSourceMailWakeRequestV1,
  StagePlayLiveSourceMailWakeResultV1,
} from "@shared/contracts/stage-play-live-source-mail-wake.v1";
import {
  listStagePlayLiveSourceJobStates,
  listUnreadStagePlayLiveSourceMailItems,
} from "./stage-play-live-source-mailbox-store";
import {
  listRunnableStagePlayLiveSourceMailWakeRequests,
  listStagePlayLiveSourceMailWakeRequests,
  markStagePlayMailWakeCompleted,
  markStagePlayMailWakeRetryable,
  markStagePlayMailWakeRunning,
  markStagePlayMailWakeTerminalFailed,
  queueStagePlayLiveSourceMailWakeRequest,
  recordStagePlayMailWakeResult,
} from "./stage-play-live-source-mail-wake-store";

type AskWakeTurnResponse = Record<string, unknown>;

type AskWakeTurnRunner = (input: {
  prompt: string;
  threadId: string;
  evidenceRefs: string[];
  wakeRequest: StagePlayLiveSourceMailWakeRequestV1;
}) => Promise<AskWakeTurnResponse>;

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const readArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const STALE_RUNNING_WAKE_MS = 90_000;

const defaultAskBaseUrl = (): string =>
  process.env.HELIX_ASK_BASE_URL ??
  `http://127.0.0.1:${process.env.PORT || process.env.SERVER_PORT || "5050"}`;

const buildWakePrompt = (wake: StagePlayLiveSourceMailWakeRequestV1): string =>
  [
    "Read the active live-source mailbox and decide what to do with the latest unread source update.",
    "Use live_env.read_live_source_mail first, then record the decision with live_env.record_live_source_mail_decision.",
    "Read only the mail refs listed below for this wake request; do not widen to newer mailbox items in this turn.",
    "If there is no user-facing change, record wait_for_next_summary.",
    "If there is a meaningful user-facing change, draft a concise text answer.",
    "If voice is allowed and the update is urgent, request a voice callout.",
    "",
    `Wake request: ${wake.wakeRequestId}`,
    `Mail refs: ${wake.mailIds.join(", ")}`,
    `Source refs: ${wake.sourceIds.join(", ")}`,
  ].join("\n");

const defaultAskTurnRunner = (baseUrl?: string): AskWakeTurnRunner =>
  async ({ prompt, threadId, evidenceRefs, wakeRequest }) => {
    const response = await fetch(`${baseUrl ?? defaultAskBaseUrl()}/api/agi/ask/turn`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: prompt,
        prompt,
        sessionId: threadId,
        debug: true,
        evidence_refs: evidenceRefs,
        stage_play_live_source_mail_wake_request_id: wakeRequest.wakeRequestId,
      }),
    });
    if (!response.ok) {
      throw new Error(`mail_wake_ask_turn_failed:${response.status}`);
    }
    return await response.json() as AskWakeTurnResponse;
  };

const extractAskTurnId = (response: AskWakeTurnResponse): string | null =>
  readString(response.turn_id) ??
  readString(response.trace_id) ??
  readString(response.id);

const extractDecisionIds = (response: AskWakeTurnResponse): string[] => {
  const ledger = readArray(response.current_turn_artifact_ledger);
  const ids = ledger.flatMap((artifact): string[] => {
    const record = readRecord(artifact);
    const payload = readRecord(record?.payload);
    const observation = readRecord(payload?.observation);
    const observationIsMailDecision =
      readString(observation?.artifactId) === "stage_play_live_source_mail_decision" ||
      readString(observation?.schemaVersion) === "stage_play_live_source_mail_decision/v1";
    const payloadIsMailDecision =
      readString(payload?.artifactId) === "stage_play_live_source_mail_decision" ||
      readString(payload?.schemaVersion) === "stage_play_live_source_mail_decision/v1";
    if (!observationIsMailDecision && !payloadIsMailDecision) return [];
    return uniqueStrings([
      readString(observation?.decisionId),
      readString(payload?.decisionId),
      readString(payload?.decision_id),
    ]);
  });
  return uniqueStrings(ids);
};

const wakeAttemptBackoffMs = (attemptCount: number): number => {
  if (attemptCount <= 1) return 15_000;
  if (attemptCount === 2) return 30_000;
  if (attemptCount === 3) return 60_000;
  return 120_000;
};

const addMs = (iso: string, ms: number): string =>
  new Date(Date.parse(iso) + ms).toISOString();

const isPressure503 = (err: unknown): boolean =>
  /\b(?:mail_wake_ask_turn_failed:503|503)\b/i.test(err instanceof Error ? err.message : String(err));

const wakeMatchesScope = (
  wake: StagePlayLiveSourceMailWakeRequestV1,
  input: {
    threadId?: string | null;
    roomId?: string | null;
    environmentId?: string | null;
    jobId?: string | null;
  },
): boolean => {
  if (input.threadId && wake.threadId !== input.threadId) return false;
  if (input.roomId && wake.roomId !== input.roomId) return false;
  if (input.environmentId && wake.environmentId !== input.environmentId) return false;
  if (input.jobId && wake.jobId !== input.jobId) return false;
  return true;
};

export function queueMailWakeForUnreadItems(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId?: string | null;
  limit?: number;
  now?: string;
}): StagePlayLiveSourceMailWakeRequestV1 | null {
  const jobs = listStagePlayLiveSourceJobStates({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    limit: 10,
  });
  const activeJob = jobs.at(-1) ?? null;
  if (activeJob && (activeJob.status === "paused" || activeJob.status === "ended")) return null;
  const unread = listUnreadStagePlayLiveSourceMailItems({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceId: input.sourceId ?? null,
    limit: Math.min(input.limit ?? 1, 1),
  });
  if (unread.length === 0) return null;
  return queueStagePlayLiveSourceMailWakeRequest({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: activeJob?.jobId ?? null,
    mailIds: unread.map((item) => item.mailId),
    sourceIds: unread.map((item) => item.sourceId),
    reason: "unread_mail",
    evidenceRefs: unread.flatMap((item: StagePlayLiveSourceMailItemV1) => item.evidenceRefs),
    now: input.now,
  });
}

export async function runNextMailWakeRequest(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  baseUrl?: string;
  askTurnRunner?: AskWakeTurnRunner;
  now?: string;
} = {}): Promise<StagePlayLiveSourceMailWakeResultV1 | null> {
  const now = input.now ?? new Date().toISOString();
  const scopedWakes = listStagePlayLiveSourceMailWakeRequests({
    threadId: input.threadId ?? null,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? null,
    limit: 250,
  });
  const activeRunning = scopedWakes.filter((wake) =>
    wake.status === "running" &&
    wakeMatchesScope(wake, input)
  );
  for (const wake of activeRunning) {
    const lastAttemptMs = Date.parse(wake.lastAttemptAt ?? wake.updatedAt);
    const stale = Number.isFinite(lastAttemptMs) && Date.parse(now) - lastAttemptMs > STALE_RUNNING_WAKE_MS;
    if (stale && !wake.askTurnId) {
      markStagePlayMailWakeRetryable({
        wakeRequestId: wake.wakeRequestId,
        failureReason: "stale_running_wake",
        nextRetryAt: now,
        now,
      });
    }
  }
  const stillRunning = listStagePlayLiveSourceMailWakeRequests({
    threadId: input.threadId ?? null,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? null,
    status: "running",
    limit: 250,
  }).find((wake) => wakeMatchesScope(wake, input));
  if (stillRunning) return null;
  const running = listRunnableStagePlayLiveSourceMailWakeRequests({
    threadId: input.threadId ?? null,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? null,
    now,
    limit: 250,
  }).at(0) ?? null;
  if (!running) return null;
  const runningAttempt = markStagePlayMailWakeRunning(running.wakeRequestId, now) ?? running;
  const evidenceRefs = uniqueStrings([...running.evidenceRefs, ...running.mailIds, ...running.sourceIds]);
  try {
    const prompt = buildWakePrompt(running);
    const response = await (input.askTurnRunner ?? defaultAskTurnRunner(input.baseUrl))({
      prompt,
      threadId: running.threadId,
      evidenceRefs,
      wakeRequest: running,
    });
    const askTurnId = extractAskTurnId(response);
    const decisionIds = extractDecisionIds(response);
    if (decisionIds.length === 0) {
      const failedReason = "mail_wake_decision_missing";
      markStagePlayMailWakeTerminalFailed({
        wakeRequestId: running.wakeRequestId,
        failureReason: failedReason,
        now: new Date().toISOString(),
      });
      return recordStagePlayMailWakeResult({
        wakeRequestId: running.wakeRequestId,
        threadId: running.threadId,
        roomId: running.roomId ?? null,
        environmentId: running.environmentId ?? null,
        status: "failed_terminal",
        askTurnId,
        failedReason,
        evidenceRefs: uniqueStrings([...evidenceRefs, ...(askTurnId ? [askTurnId] : [])]),
        createdAt: new Date().toISOString(),
      });
    }
    const completed = markStagePlayMailWakeCompleted({
      wakeRequestId: running.wakeRequestId,
      askTurnId,
      decisionIds,
      evidenceRefs,
      now: new Date().toISOString(),
    });
    return recordStagePlayMailWakeResult({
      wakeRequestId: running.wakeRequestId,
      threadId: running.threadId,
      roomId: running.roomId ?? null,
      environmentId: running.environmentId ?? null,
      status: "completed",
      askTurnId: completed?.askTurnId ?? askTurnId,
      decisionIds: completed?.decisionIds ?? decisionIds,
      evidenceRefs: completed?.evidenceRefs ?? evidenceRefs,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    const failedAt = now;
    if (isPressure503(err)) {
      const nextRetryAt = addMs(failedAt, wakeAttemptBackoffMs(runningAttempt.attemptCount));
      markStagePlayMailWakeRetryable({
        wakeRequestId: running.wakeRequestId,
        status: "deferred_for_pressure",
        failureReason: "ask_turn_pressure_503",
        nextRetryAt,
        now: failedAt,
      });
      return recordStagePlayMailWakeResult({
        wakeRequestId: running.wakeRequestId,
        threadId: running.threadId,
        roomId: running.roomId ?? null,
        environmentId: running.environmentId ?? null,
        status: "deferred_for_pressure",
        failedReason: "ask_turn_pressure_503",
        evidenceRefs,
        createdAt: failedAt,
      });
    }
    markStagePlayMailWakeRetryable({
      wakeRequestId: running.wakeRequestId,
      failureReason: err instanceof Error ? err.message : String(err),
      nextRetryAt: addMs(failedAt, wakeAttemptBackoffMs(runningAttempt.attemptCount)),
      now: failedAt,
    });
    return recordStagePlayMailWakeResult({
      wakeRequestId: running.wakeRequestId,
      threadId: running.threadId,
      roomId: running.roomId ?? null,
      environmentId: running.environmentId ?? null,
      status: "failed_retryable",
      failedReason: err instanceof Error ? err.message : String(err),
      evidenceRefs,
      createdAt: failedAt,
    });
  }
}
