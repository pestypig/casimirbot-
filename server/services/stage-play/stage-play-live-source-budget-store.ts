import crypto from "node:crypto";
import {
  LIVE_SOURCE_BUDGET_STATE_SCHEMA,
  type LiveSourceBudgetActionV1,
  type LiveSourceBudgetStateV1,
} from "@shared/contracts/stage-play-live-source-current-state.v1";
import type {
  LiveSourceCausalTraceV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import type {
  StagePlayLiveSourceMailWakeRequestV1,
  StagePlayLiveSourceMailWakeResultV1,
} from "@shared/contracts/stage-play-live-source-mail-wake.v1";
import { listUnreadStagePlayLiveSourceMailItems } from "./stage-play-live-source-mailbox-store";
import { listStagePlayLiveSourceMailWakeRequests } from "./stage-play-live-source-mail-wake-store";
import { mergeLiveSourceCausalTraces } from "./stage-play-live-source-causal-trace";

const budgetStateById = new Map<string, LiveSourceBudgetStateV1>();
const MAX_BUDGET_STATES = 500;

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const parseTime = (value: string | null | undefined): number | null => {
  const parsed = Date.parse(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const avg = (values: number[]): number | null => {
  const finite = values.filter((value) => Number.isFinite(value) && value >= 0);
  if (finite.length === 0) return null;
  return Math.round(finite.reduce((sum, value) => sum + value, 0) / finite.length);
};

const memoryPressureFromReason = (reason: string | null | undefined): LiveSourceBudgetStateV1["pressure"]["memoryPressure"] => {
  const text = String(reason ?? "");
  if (!text) return "none";
  if (/(?:host_memory_limit|memory_pressure|pressure_503|runtime_memory)/i.test(text)) return "high";
  if (/\b(?:deferred|queue|busy)\b/i.test(text)) return "moderate";
  return "unknown";
};

const allowedNextActionFor = (input: {
  action: LiveSourceBudgetActionV1;
  retainedMailCount: number;
  unreadBacklogCount: number;
}): LiveSourceBudgetStateV1["allowedNextAction"] => {
  if (input.action === "pressure_blocked") return "retry_later";
  if (input.action === "deferred") return "defer";
  if (input.action === "paused") return "pause_source";
  if (input.retainedMailCount > 0 || input.unreadBacklogCount > 0) return "batch";
  if (input.action === "batched") return "batch";
  if (input.action === "processed") return "wait";
  return "process_now";
};

export function recordLiveSourceBudgetState(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  wakeRequest?: StagePlayLiveSourceMailWakeRequestV1 | null;
  wakeResult?: StagePlayLiveSourceMailWakeResultV1 | null;
  action: LiveSourceBudgetActionV1;
  reason: string;
  processedMailCount?: number | null;
  retainedMailCount?: number | null;
  pressureReason?: string | null;
  evidenceRefs?: string[];
  causalTraces?: Array<LiveSourceCausalTraceV1 | null | undefined>;
  now?: string;
}): LiveSourceBudgetStateV1 {
  const now = input.now ?? input.wakeResult?.createdAt ?? new Date().toISOString();
  const wakes = listStagePlayLiveSourceMailWakeRequests({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? input.wakeRequest?.jobId ?? null,
    limit: 250,
  });
  const unreadBacklog = listUnreadStagePlayLiveSourceMailItems({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    includeDelivered: true,
    limit: 250,
  });
  const queuedWakeCount = wakes.filter((wake) => wake.status === "queued" || wake.status === "waiting_for_ui_handoff").length;
  const runningWakeCount = wakes.filter((wake) => wake.status === "running").length;
  const deferredWakeCount = wakes.filter((wake) => wake.status === "deferred_for_pressure").length;
  const failedWakeCount = wakes.filter((wake) => /^failed/.test(wake.status)).length;
  const queuedAtMs = parseTime(input.wakeRequest?.queuedAt ?? null);
  const startedAtMs = parseTime(input.wakeRequest?.lastAttemptAt ?? null);
  const completedAtMs = parseTime(input.wakeResult?.createdAt ?? now);
  const wakeAgeMs = queuedAtMs !== null && completedAtMs !== null ? Math.max(0, completedAtMs - queuedAtMs) : null;
  const averageWakeLatencyMs = avg(wakes.flatMap((wake) => {
    const start = parseTime(wake.queuedAt);
    const end = parseTime(wake.updatedAt);
    return start !== null && end !== null && end >= start ? [end - start] : [];
  }));
  const retainedMailCount = Math.max(0, input.retainedMailCount ?? 0);
  const processedMailCount = Math.max(0, input.processedMailCount ?? input.wakeRequest?.mailIds.length ?? 0);
  const evidenceRefs = uniqueStrings([
    input.wakeRequest?.wakeRequestId,
    input.wakeResult?.wakeResultId,
    input.wakeResult?.askTurnId,
    ...(input.wakeRequest?.mailIds ?? []),
    ...(input.wakeRequest?.sourceIds ?? []),
    ...(input.evidenceRefs ?? []),
  ]);
  const budgetStateId = `live_source_budget_state:${hashShort([
    input.threadId,
    input.wakeRequest?.wakeRequestId ?? null,
    input.wakeResult?.wakeResultId ?? null,
    input.action,
    input.reason,
    now,
  ])}`;
  const action = input.action;
  const budget: LiveSourceBudgetStateV1 = {
    artifactId: "live_source_budget_state",
    schemaVersion: LIVE_SOURCE_BUDGET_STATE_SCHEMA,
    budgetStateId,
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? input.wakeRequest?.jobId ?? null,
    wakeRequestId: input.wakeRequest?.wakeRequestId ?? null,
    wakeResultId: input.wakeResult?.wakeResultId ?? null,
    askTurnId: input.wakeResult?.askTurnId ?? null,
    action,
    reason: input.reason,
    mailCounts: {
      wakeMailCount: input.wakeRequest?.mailIds.length ?? 0,
      processedMailCount,
      retainedMailCount,
      unreadBacklogCount: unreadBacklog.length,
    },
    wakeCounts: {
      queuedWakeCount,
      runningWakeCount,
      deferredWakeCount,
      failedWakeCount,
    },
    latency: {
      wakeQueuedAt: input.wakeRequest?.queuedAt ?? null,
      wakeStartedAt: input.wakeRequest?.lastAttemptAt ?? null,
      wakeCompletedAt: input.wakeResult?.createdAt ?? now,
      wakeAgeMs,
      averageWakeLatencyMs,
    },
    pressure: {
      askBusy: runningWakeCount > 0,
      deferredForPressure: action === "pressure_blocked" || deferredWakeCount > 0,
      pressureReason: input.pressureReason ?? (action === "pressure_blocked" ? input.reason : null),
      memoryPressure: memoryPressureFromReason(input.pressureReason ?? input.reason),
    },
    allowedNextAction: allowedNextActionFor({
      action,
      retainedMailCount,
      unreadBacklogCount: unreadBacklog.length,
    }),
    loopState: action === "processed"
      ? "completed"
      : action === "batched"
        ? "continue_with_unread_mail"
        : action === "pressure_blocked"
          ? "deferred_for_pressure"
          : action === "paused"
            ? "paused"
            : "failed",
    evidenceRefs,
    causalTrace: mergeLiveSourceCausalTraces([
      input.wakeRequest?.causalTrace,
      input.wakeResult?.causalTrace,
      ...(input.causalTraces ?? []),
    ], {
      parentRefs: evidenceRefs,
      causedBy: uniqueStrings([input.wakeRequest?.wakeRequestId, input.wakeResult?.wakeResultId]),
      producedRefs: [budgetStateId],
      sourceIds: input.wakeRequest?.sourceIds ?? [],
      jobId: input.jobId ?? input.wakeRequest?.jobId ?? null,
      askTurnId: input.wakeResult?.askTurnId ?? null,
      evidenceRefs,
    }),
    createdAt: now,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
  budgetStateById.set(budget.budgetStateId, budget);
  if (budgetStateById.size > MAX_BUDGET_STATES) {
    const ordered = Array.from(budgetStateById.values()).sort((left, right) => left.createdAt.localeCompare(right.createdAt));
    for (const entry of ordered.slice(0, budgetStateById.size - MAX_BUDGET_STATES)) {
      budgetStateById.delete(entry.budgetStateId);
    }
  }
  return budget;
}

export function getLiveSourceBudgetState(budgetStateId: string): LiveSourceBudgetStateV1 | null {
  return budgetStateById.get(budgetStateId) ?? null;
}

export function listLiveSourceBudgetStates(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  wakeRequestId?: string | null;
  limit?: number;
} = {}): LiveSourceBudgetStateV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 50, 250));
  return Array.from(budgetStateById.values())
    .filter((state) => {
      if (input.threadId && state.threadId !== input.threadId) return false;
      if (input.roomId && state.roomId !== input.roomId) return false;
      if (input.environmentId && state.environmentId !== input.environmentId) return false;
      if (input.jobId && state.jobId !== input.jobId) return false;
      if (input.wakeRequestId && state.wakeRequestId !== input.wakeRequestId) return false;
      return true;
    })
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .slice(-limit);
}

export function getLatestLiveSourceBudgetState(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  wakeRequestId?: string | null;
} = {}): LiveSourceBudgetStateV1 | null {
  return listLiveSourceBudgetStates({ ...input, limit: 1 }).at(-1) ?? null;
}

export function resetLiveSourceBudgetStoreForTest(): void {
  budgetStateById.clear();
}
