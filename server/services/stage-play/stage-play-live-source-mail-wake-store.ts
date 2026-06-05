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

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const sortedKey = (values: string[]): string => uniqueStrings(values).sort().join("|");

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
    (wake.status === "queued" || wake.status === "running")
  );
  if (existing) return existing;
  const now = input.now ?? new Date().toISOString();
  const wake: StagePlayLiveSourceMailWakeRequestV1 = {
    artifactId: "stage_play_live_source_mail_wake_request",
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_MAIL_WAKE_REQUEST_SCHEMA,
    wakeRequestId: `stage_play_live_source_mail_wake:${hashShort([
      input.threadId,
      input.roomId ?? null,
      input.environmentId ?? null,
      input.jobId ?? null,
      mailIds,
      now,
    ])}`,
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? null,
    mailIds,
    sourceIds,
    reason: input.reason ?? "unread_mail",
    status: "queued",
    askTurnId: null,
    decisionIds: [],
    evidenceRefs: uniqueStrings([...mailIds, ...sourceIds, ...(input.evidenceRefs ?? [])]),
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

const updateWake = (
  wakeRequestId: string,
  patch: Partial<Pick<StagePlayLiveSourceMailWakeRequestV1, "status" | "askTurnId" | "decisionIds" | "evidenceRefs" | "updatedAt">>,
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

export const markStagePlayMailWakeRunning = (wakeRequestId: string, now?: string): StagePlayLiveSourceMailWakeRequestV1 | null =>
  updateWake(wakeRequestId, { status: "running", updatedAt: now });

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
    updatedAt: input.now,
  });

export const markStagePlayMailWakeSkipped = (wakeRequestId: string, now?: string): StagePlayLiveSourceMailWakeRequestV1 | null =>
  updateWake(wakeRequestId, { status: "skipped", updatedAt: now });

export const markStagePlayMailWakeFailed = (wakeRequestId: string, now?: string): StagePlayLiveSourceMailWakeRequestV1 | null =>
  updateWake(wakeRequestId, { status: "failed", updatedAt: now });

export function recordStagePlayMailWakeResult(input: {
  wakeRequestId: string;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  status: "completed" | "skipped" | "failed";
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
    if (wake.status !== "queued" && wake.status !== "running") continue;
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
