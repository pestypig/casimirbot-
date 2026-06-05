import crypto from "node:crypto";
import type {
  StagePlayLiveSourceMailWakeReasonV1,
  StagePlayLiveSourceMailWakeRequestV1,
  StagePlayLiveSourceMailWakeResultV1,
  StagePlayLiveSourceMailWakeStatusV1,
} from "@shared/contracts/stage-play-live-source-mail-wake.v1";
import type { StagePlayLiveSourceMailDecisionV1 } from "@shared/contracts/stage-play-live-source-mail.v1";
import {
  STAGE_PLAY_LIVE_SOURCE_MAIL_WAKE_REQUEST_SCHEMA,
  STAGE_PLAY_LIVE_SOURCE_MAIL_WAKE_RESULT_SCHEMA,
} from "@shared/contracts/stage-play-live-source-mail-wake.v1";

const wakeById = new Map<string, StagePlayLiveSourceMailWakeRequestV1>();
const resultById = new Map<string, StagePlayLiveSourceMailWakeResultV1>();
const MAX_WAKE_REQUESTS_PER_THREAD = 250;
export const MAX_MAIL_IDS_PER_WAKE_BATCH = 12;

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const sortedKey = (values: string[]): string => uniqueStrings(values).sort().join("|");

const ACTIVE_WAKE_STATUSES = new Set<StagePlayLiveSourceMailWakeStatusV1>([
  "queued",
  "running",
  "failed_retryable",
  "deferred_for_pressure",
]);

const listThreadWakes = (threadId: string): StagePlayLiveSourceMailWakeRequestV1[] =>
  Array.from(wakeById.values())
    .filter((wake) => wake.threadId === threadId)
    .sort((left, right) => left.queuedAt.localeCompare(right.queuedAt));

const trimThreadWakes = (threadId: string): void => {
  const entries = listThreadWakes(threadId);
  if (entries.length <= MAX_WAKE_REQUESTS_PER_THREAD) return;
  for (const entry of entries.slice(0, entries.length - MAX_WAKE_REQUESTS_PER_THREAD)) {
    wakeById.delete(entry.wakeRequestId);
  }
};

export function queueStagePlayLiveSourceMailWakeRequest(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  mailIds: string[];
  sourceIds: string[];
  reason?: StagePlayLiveSourceMailWakeReasonV1;
  evidenceRefs?: string[];
  now?: string;
}): StagePlayLiveSourceMailWakeRequestV1 | null {
  const mailIds = uniqueStrings(input.mailIds);
  if (mailIds.length === 0) return null;
  const sourceIds = uniqueStrings(input.sourceIds);
  const key = sortedKey(mailIds);
  const existing = Array.from(wakeById.values()).find((wake) =>
    wake.threadId === input.threadId &&
    wake.roomId === (input.roomId ?? null) &&
    wake.environmentId === (input.environmentId ?? null) &&
    sortedKey(wake.mailIds) === key &&
    ACTIVE_WAKE_STATUSES.has(wake.status)
  );
  if (existing) return existing;
  const queuedSameSource = sourceIds.length > 0
    ? Array.from(wakeById.values()).find((wake) =>
        wake.threadId === input.threadId &&
        wake.roomId === (input.roomId ?? null) &&
        wake.environmentId === (input.environmentId ?? null) &&
        wake.jobId === (input.jobId ?? null) &&
        wake.reason === (input.reason ?? "unread_mail") &&
        (wake.status === "queued" || wake.status === "deferred_for_pressure") &&
        sortedKey(wake.sourceIds) === sortedKey(sourceIds) &&
        wake.mailIds.length < MAX_MAIL_IDS_PER_WAKE_BATCH
      )
    : null;
  if (queuedSameSource) {
    const remaining = Math.max(0, MAX_MAIL_IDS_PER_WAKE_BATCH - queuedSameSource.mailIds.length);
    const appendMailIds = mailIds.filter((mailId) => !queuedSameSource.mailIds.includes(mailId)).slice(0, remaining);
    if (appendMailIds.length > 0) {
      const now = input.now ?? new Date().toISOString();
      const merged: StagePlayLiveSourceMailWakeRequestV1 = {
        ...queuedSameSource,
        mailIds: uniqueStrings([...queuedSameSource.mailIds, ...appendMailIds]),
        sourceIds: uniqueStrings([...queuedSameSource.sourceIds, ...sourceIds]),
        evidenceRefs: uniqueStrings([
          ...queuedSameSource.evidenceRefs,
          ...appendMailIds,
          ...sourceIds,
          ...(input.evidenceRefs ?? []),
        ]),
        nextRetryAt: queuedSameSource.status === "deferred_for_pressure" ? queuedSameSource.nextRetryAt : null,
        updatedAt: now,
      };
      wakeById.set(merged.wakeRequestId, merged);
      return merged;
    }
    return queuedSameSource;
  }
  const now = input.now ?? new Date().toISOString();
  const boundedMailIds = mailIds.slice(0, MAX_MAIL_IDS_PER_WAKE_BATCH);
  const wake: StagePlayLiveSourceMailWakeRequestV1 = {
    artifactId: "stage_play_live_source_mail_wake_request",
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_MAIL_WAKE_REQUEST_SCHEMA,
    wakeRequestId: `stage_play_live_source_mail_wake:${hashShort([
      input.threadId,
      input.roomId ?? null,
      input.environmentId ?? null,
      input.jobId ?? null,
      boundedMailIds,
      now,
    ])}`,
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? null,
    mailIds: boundedMailIds,
    sourceIds,
    reason: input.reason ?? "unread_mail",
    status: "queued",
    askTurnId: null,
    decisionIds: [],
    attemptCount: 0,
    lastAttemptAt: null,
    nextRetryAt: null,
    failureReason: null,
    evidenceRefs: uniqueStrings([...boundedMailIds, ...sourceIds, ...(input.evidenceRefs ?? [])]),
    queuedAt: now,
    updatedAt: now,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
  wakeById.set(wake.wakeRequestId, wake);
  trimThreadWakes(input.threadId);
  return wake;
}

export function getStagePlayLiveSourceMailWakeRequest(wakeRequestId: string): StagePlayLiveSourceMailWakeRequestV1 | null {
  return wakeById.get(wakeRequestId) ?? null;
}

export function listStagePlayLiveSourceMailWakeRequests(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  status?: StagePlayLiveSourceMailWakeStatusV1 | null;
  mailId?: string | null;
  limit?: number;
} = {}): StagePlayLiveSourceMailWakeRequestV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 50, 250));
  return Array.from(wakeById.values())
    .filter((wake) => {
      if (input.threadId && wake.threadId !== input.threadId) return false;
      if (input.roomId && wake.roomId !== input.roomId) return false;
      if (input.environmentId && wake.environmentId !== input.environmentId) return false;
      if (input.jobId && wake.jobId !== input.jobId) return false;
      if (input.status && wake.status !== input.status) return false;
      if (input.mailId && !wake.mailIds.includes(input.mailId)) return false;
      return true;
    })
    .sort((left, right) => left.queuedAt.localeCompare(right.queuedAt))
    .slice(-limit);
}

export function listPendingStagePlayLiveSourceMailWakeRequests(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  limit?: number;
} = {}): StagePlayLiveSourceMailWakeRequestV1[] {
  return listStagePlayLiveSourceMailWakeRequests({ ...input, status: "queued" });
}

export function listRunnableStagePlayLiveSourceMailWakeRequests(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  now?: string;
  limit?: number;
} = {}): StagePlayLiveSourceMailWakeRequestV1[] {
  const nowMs = Date.parse(input.now ?? new Date().toISOString());
  return listStagePlayLiveSourceMailWakeRequests({
    threadId: input.threadId ?? null,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? null,
    limit: input.limit ?? 250,
  }).filter((wake) => {
    if (wake.status === "queued") return true;
    if (wake.status !== "failed_retryable" && wake.status !== "deferred_for_pressure") return false;
    const retryMs = Date.parse(wake.nextRetryAt ?? "");
    return !Number.isFinite(retryMs) || retryMs <= nowMs;
  });
}

const updateWake = (
  wakeRequestId: string,
  patch: Partial<Pick<StagePlayLiveSourceMailWakeRequestV1, "status" | "askTurnId" | "decisionIds" | "attemptCount" | "lastAttemptAt" | "nextRetryAt" | "failureReason" | "evidenceRefs" | "updatedAt">>,
): StagePlayLiveSourceMailWakeRequestV1 | null => {
  const existing = wakeById.get(wakeRequestId);
  if (!existing) return null;
  const updated: StagePlayLiveSourceMailWakeRequestV1 = {
    ...existing,
    ...patch,
    decisionIds: patch.decisionIds ? uniqueStrings(patch.decisionIds) : existing.decisionIds,
    evidenceRefs: patch.evidenceRefs ? uniqueStrings(patch.evidenceRefs) : existing.evidenceRefs,
    updatedAt: patch.updatedAt ?? new Date().toISOString(),
  };
  wakeById.set(wakeRequestId, updated);
  return updated;
};

export const markStagePlayMailWakeRunning = (wakeRequestId: string, now?: string): StagePlayLiveSourceMailWakeRequestV1 | null => {
  const existing = wakeById.get(wakeRequestId);
  const updatedAt = now ?? new Date().toISOString();
  return updateWake(wakeRequestId, {
    status: "running",
    attemptCount: (existing?.attemptCount ?? 0) + 1,
    lastAttemptAt: updatedAt,
    nextRetryAt: null,
    failureReason: null,
    updatedAt,
  });
};

export const markStagePlayMailWakeCompleted = (input: {
  wakeRequestId: string;
  askTurnId?: string | null;
  decisionIds?: string[];
  evidenceRefs?: string[];
  now?: string;
}): StagePlayLiveSourceMailWakeRequestV1 | null =>
  updateWake(input.wakeRequestId, {
    status: "completed",
    askTurnId: input.askTurnId ?? undefined,
    decisionIds: input.decisionIds,
    evidenceRefs: input.evidenceRefs,
    nextRetryAt: null,
    failureReason: null,
    updatedAt: input.now,
  });

export const markStagePlayMailWakeSkipped = (wakeRequestId: string, now?: string): StagePlayLiveSourceMailWakeRequestV1 | null =>
  updateWake(wakeRequestId, { status: "skipped", updatedAt: now });

export const markStagePlayMailWakeFailed = (wakeRequestId: string, now?: string): StagePlayLiveSourceMailWakeRequestV1 | null =>
  updateWake(wakeRequestId, { status: "failed", updatedAt: now });

export const markStagePlayMailWakeRetryable = (input: {
  wakeRequestId: string;
  status?: "failed_retryable" | "deferred_for_pressure";
  failureReason: string;
  nextRetryAt?: string | null;
  now?: string;
}): StagePlayLiveSourceMailWakeRequestV1 | null =>
  updateWake(input.wakeRequestId, {
    status: input.status ?? "failed_retryable",
    failureReason: input.failureReason,
    nextRetryAt: input.nextRetryAt ?? null,
    updatedAt: input.now,
  });

export const markStagePlayMailWakeTerminalFailed = (input: {
  wakeRequestId: string;
  failureReason: string;
  now?: string;
}): StagePlayLiveSourceMailWakeRequestV1 | null =>
  updateWake(input.wakeRequestId, {
    status: "failed_terminal",
    failureReason: input.failureReason,
    nextRetryAt: null,
    updatedAt: input.now,
  });

export function recordStagePlayMailWakeResult(input: {
  wakeRequestId: string;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  status: "completed" | "skipped" | "failed" | "failed_retryable" | "failed_terminal" | "deferred_for_pressure";
  askTurnId?: string | null;
  decisionIds?: string[];
  skippedReason?: string | null;
  failedReason?: string | null;
  evidenceRefs?: string[];
  createdAt?: string;
}): StagePlayLiveSourceMailWakeResultV1 {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const result: StagePlayLiveSourceMailWakeResultV1 = {
    artifactId: "stage_play_live_source_mail_wake_result",
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_MAIL_WAKE_RESULT_SCHEMA,
    wakeResultId: `stage_play_live_source_mail_wake_result:${hashShort([
      input.wakeRequestId,
      input.status,
      input.askTurnId ?? null,
      createdAt,
    ])}`,
    wakeRequestId: input.wakeRequestId,
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    status: input.status,
    askTurnId: input.askTurnId ?? null,
    decisionIds: uniqueStrings(input.decisionIds ?? []),
    skippedReason: input.skippedReason ?? null,
    failedReason: input.failedReason ?? null,
    evidenceRefs: uniqueStrings([input.wakeRequestId, input.askTurnId, ...(input.decisionIds ?? []), ...(input.evidenceRefs ?? [])]),
    createdAt,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
  resultById.set(result.wakeResultId, result);
  return result;
}

export function listStagePlayLiveSourceMailWakeResults(input: {
  threadId?: string | null;
  wakeRequestId?: string | null;
  limit?: number;
} = {}): StagePlayLiveSourceMailWakeResultV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 50, 250));
  return Array.from(resultById.values())
    .filter((result) => {
      if (input.threadId && result.threadId !== input.threadId) return false;
      if (input.wakeRequestId && result.wakeRequestId !== input.wakeRequestId) return false;
      return true;
    })
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .slice(-limit);
}

export function latestStagePlayLiveSourceMailWakeResult(
  wakeRequestId: string,
): StagePlayLiveSourceMailWakeResultV1 | null {
  return listStagePlayLiveSourceMailWakeResults({ wakeRequestId, limit: 1 }).at(-1) ?? null;
}

export function reconcileStagePlayMailWakeRequestsWithDecisions(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  decisions: StagePlayLiveSourceMailDecisionV1[];
  now?: string;
}): StagePlayLiveSourceMailWakeRequestV1[] {
  const now = input.now ?? new Date().toISOString();
  const decisionsByMailId = new Map<string, StagePlayLiveSourceMailDecisionV1[]>();
  for (const decision of input.decisions) {
    for (const mailId of decision.mailIds) {
      decisionsByMailId.set(mailId, [...(decisionsByMailId.get(mailId) ?? []), decision]);
    }
  }
  const reconciled: StagePlayLiveSourceMailWakeRequestV1[] = [];
  for (const wake of listStagePlayLiveSourceMailWakeRequests({
    threadId: input.threadId ?? null,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    limit: 250,
  })) {
    if (!ACTIVE_WAKE_STATUSES.has(wake.status)) continue;
    const decisions = uniqueStrings(wake.mailIds.flatMap((mailId) =>
      (decisionsByMailId.get(mailId) ?? []).map((decision) => decision.decisionId)
    ));
    if (decisions.length === 0) continue;
    const evidenceRefs = uniqueStrings([
      ...wake.evidenceRefs,
      ...decisions,
      ...wake.mailIds.flatMap((mailId) =>
        (decisionsByMailId.get(mailId) ?? []).flatMap((decision) => decision.evidenceRefs)
      ),
    ]);
    const updated = markStagePlayMailWakeCompleted({
      wakeRequestId: wake.wakeRequestId,
      decisionIds: decisions,
      evidenceRefs,
      now,
    });
    if (updated) reconciled.push(updated);
  }
  return reconciled;
}

export function resetStagePlayLiveSourceMailWakeStoreForTest(): void {
  wakeById.clear();
  resultById.clear();
}
