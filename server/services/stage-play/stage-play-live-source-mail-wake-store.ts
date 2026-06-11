import crypto from "node:crypto";
import type {
  StagePlayLiveSourceMailWakeReasonV1,
  StagePlayLiveSourceMailWakeAskLaunchStatusV1,
  StagePlayLiveSourceMailWakeLifecycleStageV1,
  StagePlayLiveSourceMailWakeRequestV1,
  StagePlayLiveSourceMailWakeResultV1,
  StagePlayLiveSourceMailWakeStatusV1,
} from "@shared/contracts/stage-play-live-source-mail-wake.v1";
import type {
  LiveSourceCausalTraceV1,
  StagePlayLiveSourceMailDecisionV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import {
  STAGE_PLAY_LIVE_SOURCE_MAIL_WAKE_REQUEST_SCHEMA,
  STAGE_PLAY_LIVE_SOURCE_MAIL_WAKE_RESULT_SCHEMA,
} from "@shared/contracts/stage-play-live-source-mail-wake.v1";
import { mergeLiveSourceCausalTraces } from "./stage-play-live-source-causal-trace";

const wakeById = new Map<string, StagePlayLiveSourceMailWakeRequestV1>();
const resultById = new Map<string, StagePlayLiveSourceMailWakeResultV1>();
const MAX_WAKE_REQUESTS_PER_THREAD = 250;
export const MAX_MAIL_IDS_PER_WAKE_BATCH = 12;
const DEFAULT_WAKE_RELEVANCE_TTL_MS = 30_000;

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const makeAskLaunchId = (wakeRequestId: string, now: string, attemptCount: number): string =>
  `stage_play_live_source_mail_wake_launch:${hashShort([wakeRequestId, now, attemptCount])}`;

const resolveAskLaunchStatusForRetry = (
  failureReason: string,
): StagePlayLiveSourceMailWakeAskLaunchStatusV1 =>
  failureReason === "ask_launch_missing_ask_turn_id" ? "missing_turn_id" : "failed";

const sortedKey = (values: string[]): string => uniqueStrings(values).sort().join("|");

const addMsIso = (value: string, ms: number): string | null => {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || !Number.isFinite(ms) || ms <= 0) return null;
  return new Date(parsed + ms).toISOString();
};

const ACTIVE_WAKE_STATUSES = new Set<StagePlayLiveSourceMailWakeStatusV1>([
  "queued",
  "running",
  "failed_retryable",
  "deferred_for_pressure",
]);

const EXPIRABLE_WAKE_STATUSES = new Set<StagePlayLiveSourceMailWakeStatusV1>([
  "queued",
  "failed_retryable",
  "deferred_for_pressure",
]);

const decisionRequiresVoiceCheckpoint = (decision: StagePlayLiveSourceMailDecisionV1): boolean =>
  decision.decision === "request_voice_callout";

const isVoiceCheckpointRef = (ref: string): boolean =>
  /(?:^|:)(?:stage_play_live_source_voice_delivery_receipt|helix_interim_voice_callout_receipt|live_source_interim_voice_callout_receipt|voice_hold_receipt|voice_block_receipt)/i.test(ref);

const voiceCheckpointRefsFromEvidence = (refs: string[]): string[] =>
  uniqueStrings(refs.filter(isVoiceCheckpointRef));

const refIncludesVoiceStatus = (ref: string, statuses: string[]): boolean => {
  const normalized = ref.toLowerCase().replace(/[-\s]+/g, "_");
  return statuses.some((status) => normalized.includes(status));
};

const voiceCheckpointLifecycleStage = (refs: string[]): StagePlayLiveSourceMailWakeLifecycleStageV1 | null => {
  if (refs.some((ref) => /(?:^|:)voice_hold_receipt:/i.test(ref))) return "voice_held";
  if (refs.some((ref) => /(?:^|:)voice_block_receipt:/i.test(ref))) return "voice_blocked";
  if (refs.some((ref) => refIncludesVoiceStatus(ref, [
    "blocked_voice_disabled",
    "blocked_voice_not_allowed",
    "blocked_missing_callout_draft",
    "blocked_missing_voice_tool",
    "blocked_policy",
    "blocked_missing_text",
  ]))) return "voice_blocked";
  if (refs.some((ref) => refIncludesVoiceStatus(ref, [
    "held_user_speaking",
    "held_manual_prompt_active",
    "confirmation_required",
    "voice_hold",
  ]))) return "voice_held";
  if (refs.some((ref) => refIncludesVoiceStatus(ref, [
    "queued_for_retry",
    "awaiting_client_playback",
    "blocked_capacity",
    "queued",
  ]))) return "voice_queued_retry";
  if (refs.some((ref) => refIncludesVoiceStatus(ref, ["delivered"]))) return "voice_delivered";
  return refs.some(isVoiceCheckpointRef) ? "voice_unknown" : null;
};

const resolveWakeLifecycleStage = (input: {
  status: StagePlayLiveSourceMailWakeStatusV1 | StagePlayLiveSourceMailWakeResultV1["status"];
  askTurnId?: string | null;
  decisionIds?: string[];
  evidenceRefs?: string[];
  requiresVoiceCheckpoint?: boolean;
}): StagePlayLiveSourceMailWakeLifecycleStageV1 => {
  const evidenceRefs = input.evidenceRefs ?? [];
  const voiceStage = voiceCheckpointLifecycleStage(evidenceRefs);
  if (voiceStage) return voiceStage;
  if (input.status === "deferred_for_pressure") return "pressure_deferred";
  if (input.status === "expired_stale" || input.status === "expired_superseded") return "expired";
  if (input.status === "failed" || input.status === "failed_retryable" || input.status === "failed_terminal") return "failed";
  if (input.status === "completed" || input.status === "skipped") return "completed";
  if (input.requiresVoiceCheckpoint && (input.decisionIds?.length ?? 0) > 0) return "voice_pending";
  if ((input.decisionIds?.length ?? 0) > 0) return "decision_recorded";
  if (input.askTurnId) return "ask_entered";
  return "queued";
};

const decisionsRequireVoiceCheckpoint = (decisions: StagePlayLiveSourceMailDecisionV1[]): boolean =>
  decisions.some(decisionRequiresVoiceCheckpoint);

const hasVoiceCheckpointForDecisions = (
  decisions: StagePlayLiveSourceMailDecisionV1[],
  refs: string[],
): boolean => {
  const voiceDecisionIds = decisions
    .filter(decisionRequiresVoiceCheckpoint)
    .map((decision) => decision.decisionId);
  if (voiceDecisionIds.length === 0) return true;
  const voiceRefs = refs.filter(isVoiceCheckpointRef);
  return voiceRefs.length > 0 && voiceDecisionIds.every((decisionId) =>
    voiceRefs.some((ref) => ref.includes(decisionId)) ||
    refs.some((ref) => ref.includes(decisionId) && isVoiceCheckpointRef(ref))
  );
};

const wakeIsPhaseLocked = (wake: StagePlayLiveSourceMailWakeRequestV1): boolean =>
  wake.status === "running" ||
  Boolean(wake.askTurnId) ||
  wake.decisionIds.length > 0;

const wakeCanBeExpired = (wake: StagePlayLiveSourceMailWakeRequestV1): boolean =>
  EXPIRABLE_WAKE_STATUSES.has(wake.status) && !wakeIsPhaseLocked(wake);

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
  causalTraces?: Array<LiveSourceCausalTraceV1 | null | undefined>;
  now?: string;
  expiresAfterMs?: number | null;
}): StagePlayLiveSourceMailWakeRequestV1 | null {
  const mailIds = uniqueStrings(input.mailIds);
  if (mailIds.length === 0) return null;
  const sourceIds = uniqueStrings(input.sourceIds);
  const now = input.now ?? new Date().toISOString();
  expireStaleStagePlayLiveSourceMailWakeRequests({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? null,
    now,
  });
  const key = sortedKey(mailIds);
  const existing = Array.from(wakeById.values()).find((wake) =>
    wake.threadId === input.threadId &&
    wake.roomId === (input.roomId ?? null) &&
    wake.environmentId === (input.environmentId ?? null) &&
    sortedKey(wake.mailIds) === key &&
    ACTIVE_WAKE_STATUSES.has(wake.status)
  );
  if (existing) return existing;
  const queuedSameSource = input.expiresAfterMs == null && sourceIds.length > 0
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
        causalTrace: mergeLiveSourceCausalTraces([queuedSameSource.causalTrace, ...(input.causalTraces ?? [])], {
          parentRefs: appendMailIds,
          causedBy: appendMailIds,
          producedRefs: [queuedSameSource.wakeRequestId],
          sourceIds,
          jobId: input.jobId ?? null,
          evidenceRefs: [
            ...appendMailIds,
            ...sourceIds,
            ...(input.evidenceRefs ?? []),
          ],
        }),
        nextRetryAt: queuedSameSource.status === "deferred_for_pressure" ? queuedSameSource.nextRetryAt : null,
        updatedAt: now,
      };
      wakeById.set(merged.wakeRequestId, merged);
      return merged;
    }
    return queuedSameSource;
  }
  const boundedMailIds = mailIds.slice(0, MAX_MAIL_IDS_PER_WAKE_BATCH);
  const wakeRequestId = `stage_play_live_source_mail_wake:${hashShort([
    input.threadId,
    input.roomId ?? null,
    input.environmentId ?? null,
    input.jobId ?? null,
    boundedMailIds,
    now,
  ])}`;
  if (input.expiresAfterMs != null && sourceIds.length > 0) {
    supersedeActiveStagePlayLiveSourceMailWakeRequests({
      threadId: input.threadId,
      roomId: input.roomId ?? null,
      environmentId: input.environmentId ?? null,
      jobId: input.jobId ?? null,
      sourceIds,
      replacementWakeRequestId: wakeRequestId,
      now,
    });
  }
  const ttlMs = typeof input.expiresAfterMs === "number" && Number.isFinite(input.expiresAfterMs) && input.expiresAfterMs > 0
    ? input.expiresAfterMs
    : null;
  const wake: StagePlayLiveSourceMailWakeRequestV1 = {
    artifactId: "stage_play_live_source_mail_wake_request",
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_MAIL_WAKE_REQUEST_SCHEMA,
    wakeRequestId,
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? null,
    mailIds: boundedMailIds,
    sourceIds,
    reason: input.reason ?? "unread_mail",
    status: "queued",
    askTurnId: null,
    askLaunchId: null,
    askLaunchStatus: "not_started",
    askLaunchStartedAt: null,
    askLaunchCompletedAt: null,
    askLaunchRouteMetadata: null,
    decisionIds: [],
    attemptCount: 0,
    lastAttemptAt: null,
    nextRetryAt: null,
    failureReason: null,
    expiresAt: ttlMs ? addMsIso(now, ttlMs) : null,
    supersededByWakeRequestId: null,
    lifecycleStage: "queued",
    lifecycleReason: "wake_request_queued",
    evidenceRefs: uniqueStrings([...boundedMailIds, ...sourceIds, ...(input.evidenceRefs ?? [])]),
    causalTrace: mergeLiveSourceCausalTraces(input.causalTraces ?? [], {
      parentRefs: boundedMailIds,
      causedBy: boundedMailIds,
      producedRefs: [wakeRequestId],
      sourceIds,
      jobId: input.jobId ?? null,
      evidenceRefs: [...boundedMailIds, ...sourceIds, ...(input.evidenceRefs ?? [])],
    }),
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

export function splitStagePlayLiveSourceMailWakeRequestForAsk(input: {
  wakeRequestId: string;
  maxMailIds: number;
  now?: string;
}): {
  wake: StagePlayLiveSourceMailWakeRequestV1;
  retainedWake: StagePlayLiveSourceMailWakeRequestV1 | null;
  retainedMailIds: string[];
} | null {
  const existing = wakeById.get(input.wakeRequestId);
  if (!existing) return null;
  const maxMailIds = Math.max(1, Math.floor(input.maxMailIds));
  if (existing.mailIds.length <= maxMailIds) {
    return {
      wake: existing,
      retainedWake: null,
      retainedMailIds: [],
    };
  }

  const now = input.now ?? new Date().toISOString();
  const boundedMailIds = existing.mailIds.slice(0, maxMailIds);
  const retainedMailIds = existing.mailIds.slice(maxMailIds);
  const boundedWake: StagePlayLiveSourceMailWakeRequestV1 = {
    ...existing,
    mailIds: boundedMailIds,
    evidenceRefs: uniqueStrings([
      ...boundedMailIds,
      ...existing.sourceIds,
      ...existing.evidenceRefs.filter((ref) => boundedMailIds.includes(ref)),
    ]),
    causalTrace: mergeLiveSourceCausalTraces([existing.causalTrace], {
      parentRefs: [existing.wakeRequestId, ...boundedMailIds],
      producedRefs: [existing.wakeRequestId],
      evidenceRefs: boundedMailIds,
    }),
    updatedAt: now,
  };
  wakeById.set(boundedWake.wakeRequestId, boundedWake);

  const retainedWake: StagePlayLiveSourceMailWakeRequestV1 = {
    ...existing,
    wakeRequestId: `stage_play_live_source_mail_wake:${hashShort([
      existing.threadId,
      existing.roomId ?? null,
      existing.environmentId ?? null,
      existing.jobId ?? null,
      retainedMailIds,
      "retained_after_bounded_ask",
      now,
    ])}`,
    mailIds: retainedMailIds,
    status: "queued",
    askTurnId: null,
    askLaunchId: null,
    askLaunchStatus: "not_started",
    askLaunchStartedAt: null,
    askLaunchCompletedAt: null,
    askLaunchRouteMetadata: null,
    decisionIds: [],
    attemptCount: 0,
    lastAttemptAt: null,
    nextRetryAt: null,
    failureReason: null,
    expiresAt: null,
    supersededByWakeRequestId: null,
    lifecycleStage: "queued",
    lifecycleReason: "retained_after_bounded_ask",
    evidenceRefs: uniqueStrings([
      ...retainedMailIds,
      ...existing.sourceIds,
      ...existing.evidenceRefs.filter((ref) => retainedMailIds.includes(ref)),
    ]),
    causalTrace: mergeLiveSourceCausalTraces([existing.causalTrace], {
      parentRefs: [existing.wakeRequestId, ...retainedMailIds],
      producedRefs: [`stage_play_live_source_mail_wake:${hashShort([
        existing.threadId,
        existing.roomId ?? null,
        existing.environmentId ?? null,
        existing.jobId ?? null,
        retainedMailIds,
        "retained_after_bounded_ask",
        now,
      ])}`],
      evidenceRefs: retainedMailIds,
    }),
    queuedAt: now,
    updatedAt: now,
  };
  wakeById.set(retainedWake.wakeRequestId, retainedWake);
  trimThreadWakes(existing.threadId);
  return {
    wake: boundedWake,
    retainedWake,
    retainedMailIds,
  };
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
  expireStaleStagePlayLiveSourceMailWakeRequests({
    threadId: input.threadId ?? null,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? null,
    now: input.now,
  });
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

export function releaseStaleRunningStagePlayMailWakeRequests(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  now?: string;
  staleAfterMs: number;
  failureReason?: string;
  nextRetryAt?: string | null;
  requireMissingAskTurnId?: boolean;
  limit?: number;
}): StagePlayLiveSourceMailWakeRequestV1[] {
  const now = input.now ?? new Date().toISOString();
  const nowMs = Date.parse(now);
  if (!Number.isFinite(nowMs) || !Number.isFinite(input.staleAfterMs) || input.staleAfterMs <= 0) return [];
  const released: StagePlayLiveSourceMailWakeRequestV1[] = [];
  for (const wake of listStagePlayLiveSourceMailWakeRequests({
    threadId: input.threadId ?? null,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? null,
    status: "running",
    limit: input.limit ?? 250,
  })) {
    if (input.requireMissingAskTurnId && wake.askTurnId) continue;
    const anchorMs = Date.parse(wake.lastAttemptAt ?? wake.updatedAt);
    if (!Number.isFinite(anchorMs)) continue;
    if (nowMs - anchorMs <= input.staleAfterMs) continue;
    const updated = markStagePlayMailWakeRetryable({
      wakeRequestId: wake.wakeRequestId,
      failureReason: input.failureReason ?? "wake_cycle_stale_released",
      nextRetryAt: input.nextRetryAt ?? now,
      now,
    });
    if (updated) released.push(updated);
  }
  return released;
}

const updateWake = (
  wakeRequestId: string,
  patch: Partial<Pick<StagePlayLiveSourceMailWakeRequestV1, "status" | "askTurnId" | "askLaunchId" | "askLaunchStatus" | "askLaunchStartedAt" | "askLaunchCompletedAt" | "askLaunchRouteMetadata" | "decisionIds" | "attemptCount" | "lastAttemptAt" | "nextRetryAt" | "failureReason" | "expiresAt" | "supersededByWakeRequestId" | "lifecycleStage" | "lifecycleReason" | "evidenceRefs" | "updatedAt">>,
): StagePlayLiveSourceMailWakeRequestV1 | null => {
  const existing = wakeById.get(wakeRequestId);
  if (!existing) return null;
  const updated: StagePlayLiveSourceMailWakeRequestV1 = {
    ...existing,
    ...patch,
    decisionIds: patch.decisionIds ? uniqueStrings(patch.decisionIds) : existing.decisionIds,
    evidenceRefs: patch.evidenceRefs ? uniqueStrings(patch.evidenceRefs) : existing.evidenceRefs,
    lifecycleStage: patch.lifecycleStage ?? existing.lifecycleStage,
    lifecycleReason: patch.lifecycleReason ?? existing.lifecycleReason ?? null,
    updatedAt: patch.updatedAt ?? new Date().toISOString(),
  };
  wakeById.set(wakeRequestId, updated);
  return updated;
};

export const markStagePlayMailWakeRunning = (
  wakeRequestId: string,
  now?: string,
  launch?: {
    askLaunchId?: string | null;
    askTurnId?: string | null;
    routeMetadata?: Record<string, unknown> | null;
  },
): StagePlayLiveSourceMailWakeRequestV1 | null => {
  const existing = wakeById.get(wakeRequestId);
  const updatedAt = now ?? new Date().toISOString();
  const attemptCount = (existing?.attemptCount ?? 0) + 1;
  const askTurnId = launch?.askTurnId ?? existing?.askTurnId ?? null;
  return updateWake(wakeRequestId, {
    status: "running",
    askTurnId,
    askLaunchId: launch?.askLaunchId ?? existing?.askLaunchId ?? makeAskLaunchId(wakeRequestId, updatedAt, attemptCount),
    askLaunchStatus: askTurnId ? "launched" : "launching",
    askLaunchStartedAt: existing?.askLaunchStartedAt ?? updatedAt,
    askLaunchCompletedAt: askTurnId ? updatedAt : null,
    askLaunchRouteMetadata: launch?.routeMetadata ?? existing?.askLaunchRouteMetadata ?? null,
    lifecycleStage: askTurnId ? "ask_entered" : "queued",
    lifecycleReason: "wake_runner_started",
    attemptCount,
    lastAttemptAt: updatedAt,
    nextRetryAt: null,
    failureReason: null,
    updatedAt,
  });
};

export const attachAskTurnToWakeRequest = (input: {
  wakeRequestId: string;
  askTurnId: string;
  askLaunchId?: string | null;
  routeMetadata?: Record<string, unknown> | null;
  now?: string;
}): StagePlayLiveSourceMailWakeRequestV1 | null => {
  const existing = wakeById.get(input.wakeRequestId);
  if (!existing) return null;
  const updatedAt = input.now ?? new Date().toISOString();
  return updateWake(input.wakeRequestId, {
    status: existing.status === "queued" ? "running" : existing.status,
    askTurnId: input.askTurnId,
    askLaunchId: input.askLaunchId ?? existing.askLaunchId ?? makeAskLaunchId(input.wakeRequestId, updatedAt, existing.attemptCount),
    askLaunchStatus: "launched",
    askLaunchStartedAt: existing.askLaunchStartedAt ?? updatedAt,
    askLaunchCompletedAt: updatedAt,
    askLaunchRouteMetadata: input.routeMetadata ?? existing.askLaunchRouteMetadata ?? null,
    lifecycleStage: "ask_entered",
    lifecycleReason: "ask_turn_id_attached",
    updatedAt,
  });
};

export const markStagePlayMailWakeUiHandoffRequired = (input: {
  wakeRequestId: string;
  routeMetadata?: Record<string, unknown> | null;
  evidenceRefs?: string[];
  now?: string;
}): StagePlayLiveSourceMailWakeRequestV1 | null => {
  const existing = wakeById.get(input.wakeRequestId);
  if (!existing) return null;
  return updateWake(input.wakeRequestId, {
    status: "queued",
    askTurnId: null,
    askLaunchStatus: "not_started",
    askLaunchStartedAt: null,
    askLaunchCompletedAt: null,
    askLaunchRouteMetadata: input.routeMetadata ?? existing.askLaunchRouteMetadata ?? null,
    lifecycleStage: "queued",
    lifecycleReason: "ui_handoff_required",
    nextRetryAt: null,
    failureReason: null,
    evidenceRefs: input.evidenceRefs ?? existing.evidenceRefs,
    updatedAt: input.now,
  });
};

export const markStagePlayMailWakeCompleted = (input: {
  wakeRequestId: string;
  askTurnId?: string | null;
  decisionIds?: string[];
  evidenceRefs?: string[];
  requiresVoiceCheckpoint?: boolean;
  now?: string;
}): StagePlayLiveSourceMailWakeRequestV1 | null => {
  const existing = wakeById.get(input.wakeRequestId);
  const evidenceRefs = uniqueStrings(input.evidenceRefs ?? []);
  const decisionIds = uniqueStrings(input.decisionIds ?? []);
  const updatedAt = input.now ?? new Date().toISOString();
  if (input.requiresVoiceCheckpoint === true && voiceCheckpointRefsFromEvidence(evidenceRefs).length === 0) {
    const askTurnId = input.askTurnId ?? existing?.askTurnId ?? null;
    return updateWake(input.wakeRequestId, {
      status: existing?.status === "queued" ? "running" : existing?.status ?? "running",
      askTurnId,
      askLaunchStatus: askTurnId ? "launched" : existing?.askLaunchStatus ?? "not_started",
      askLaunchStartedAt: askTurnId ? existing?.askLaunchStartedAt ?? updatedAt : existing?.askLaunchStartedAt ?? null,
      askLaunchCompletedAt: askTurnId ? existing?.askLaunchCompletedAt ?? updatedAt : existing?.askLaunchCompletedAt ?? null,
      decisionIds,
      evidenceRefs,
      lifecycleStage: "voice_pending",
      lifecycleReason: "decision_recorded_waiting_for_voice_receipt",
      nextRetryAt: null,
      failureReason: null,
      updatedAt,
    });
  }
  return updateWake(input.wakeRequestId, {
    status: "completed",
    askTurnId: input.askTurnId ?? undefined,
    askLaunchStatus: "completed",
    askLaunchCompletedAt: updatedAt,
    decisionIds,
    evidenceRefs,
    lifecycleStage: resolveWakeLifecycleStage({
      status: "completed",
      askTurnId: input.askTurnId ?? null,
      decisionIds,
      evidenceRefs,
      requiresVoiceCheckpoint: input.requiresVoiceCheckpoint,
    }),
    lifecycleReason: "wake_completion_evidence_satisfied",
    nextRetryAt: null,
    failureReason: null,
    expiresAt: null,
    updatedAt,
  });
};

export const markStagePlayMailWakeSkipped = (wakeRequestId: string, now?: string): StagePlayLiveSourceMailWakeRequestV1 | null =>
  updateWake(wakeRequestId, {
    status: "skipped",
    askLaunchStatus: "completed",
    askLaunchCompletedAt: now ?? new Date().toISOString(),
    lifecycleStage: "completed",
    lifecycleReason: "wake_skipped",
    updatedAt: now,
  });

export const markStagePlayMailWakeFailed = (wakeRequestId: string, now?: string): StagePlayLiveSourceMailWakeRequestV1 | null =>
  updateWake(wakeRequestId, {
    status: "failed",
    askLaunchStatus: "failed",
    askLaunchCompletedAt: now ?? new Date().toISOString(),
    lifecycleStage: "failed",
    lifecycleReason: "wake_failed",
    updatedAt: now,
  });

export const markStagePlayMailWakeRetryable = (input: {
  wakeRequestId: string;
  status?: "failed_retryable" | "deferred_for_pressure";
  failureReason: string;
  nextRetryAt?: string | null;
  now?: string;
}): StagePlayLiveSourceMailWakeRequestV1 | null => {
  const existing = wakeById.get(input.wakeRequestId);
  const completedAt = input.now ?? new Date().toISOString();
  const askLaunchStatus: StagePlayLiveSourceMailWakeAskLaunchStatusV1 =
    input.status === "deferred_for_pressure"
      ? "not_started"
      : existing?.askTurnId
        ? existing.askLaunchStatus === "completed"
          ? "completed"
          : "launched"
        : resolveAskLaunchStatusForRetry(input.failureReason);
  return updateWake(input.wakeRequestId, {
    status: input.status ?? "failed_retryable",
    failureReason: input.failureReason,
    askLaunchStatus,
    askLaunchCompletedAt: askLaunchStatus === "missing_turn_id" || askLaunchStatus === "failed"
      ? completedAt
      : existing?.askLaunchCompletedAt ?? null,
    lifecycleStage: input.status === "deferred_for_pressure" ? "pressure_deferred" : "failed",
    lifecycleReason: input.failureReason,
    nextRetryAt: input.nextRetryAt ?? null,
    expiresAt: addMsIso(input.nextRetryAt ?? input.now ?? new Date().toISOString(), DEFAULT_WAKE_RELEVANCE_TTL_MS),
    updatedAt: input.now,
  });
};

export const markStagePlayMailWakeTerminalFailed = (input: {
  wakeRequestId: string;
  failureReason: string;
  now?: string;
}): StagePlayLiveSourceMailWakeRequestV1 | null =>
  updateWake(input.wakeRequestId, {
    status: "failed_terminal",
    failureReason: input.failureReason,
    askLaunchStatus: "failed",
    askLaunchCompletedAt: input.now ?? new Date().toISOString(),
    lifecycleStage: "failed",
    lifecycleReason: input.failureReason,
    nextRetryAt: null,
    expiresAt: null,
    updatedAt: input.now,
  });

export function expireStaleStagePlayLiveSourceMailWakeRequests(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  now?: string;
  ttlMs?: number;
  limit?: number;
} = {}): StagePlayLiveSourceMailWakeRequestV1[] {
  const now = input.now ?? new Date().toISOString();
  const nowMs = Date.parse(now);
  if (!Number.isFinite(nowMs)) return [];
  const ttlMs = typeof input.ttlMs === "number" && Number.isFinite(input.ttlMs) && input.ttlMs > 0
    ? input.ttlMs
    : null;
  const expired: StagePlayLiveSourceMailWakeRequestV1[] = [];
  for (const wake of Array.from(wakeById.values())) {
    if (input.threadId && wake.threadId !== input.threadId) continue;
    if (input.roomId && wake.roomId !== input.roomId) continue;
    if (input.environmentId && wake.environmentId !== input.environmentId) continue;
    if (input.jobId && wake.jobId !== input.jobId) continue;
    if (!wakeCanBeExpired(wake)) continue;
    const expiresAtMs = Date.parse(wake.expiresAt ?? "");
    const staleByExpiresAt = Number.isFinite(expiresAtMs) && expiresAtMs <= nowMs;
    const queuedAtMs = Date.parse(wake.queuedAt);
    const staleByQueuedAt = ttlMs != null && Number.isFinite(queuedAtMs) && nowMs - queuedAtMs >= ttlMs;
    if (!staleByExpiresAt && !staleByQueuedAt) continue;
    const updated = updateWake(wake.wakeRequestId, {
      status: "expired_stale",
      failureReason: "wake_relevance_ttl_expired",
      lifecycleStage: "expired",
      lifecycleReason: "wake_relevance_ttl_expired",
      nextRetryAt: null,
      expiresAt: wake.expiresAt ?? (ttlMs ? addMsIso(wake.queuedAt, ttlMs) : now),
      updatedAt: now,
    });
    if (!updated) continue;
    recordStagePlayMailWakeResult({
      wakeRequestId: updated.wakeRequestId,
      threadId: updated.threadId,
      roomId: updated.roomId ?? null,
      environmentId: updated.environmentId ?? null,
      status: "expired_stale",
      failedReason: "wake_relevance_ttl_expired",
      evidenceRefs: updated.evidenceRefs,
      createdAt: now,
    });
    expired.push(updated);
    if (expired.length >= (input.limit ?? 250)) break;
  }
  return expired;
}

export function supersedeActiveStagePlayLiveSourceMailWakeRequests(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  sourceIds: string[];
  replacementWakeRequestId: string;
  now?: string;
}): StagePlayLiveSourceMailWakeRequestV1[] {
  const now = input.now ?? new Date().toISOString();
  const sourceKey = sortedKey(input.sourceIds);
  if (!sourceKey) return [];
  const superseded: StagePlayLiveSourceMailWakeRequestV1[] = [];
  for (const wake of Array.from(wakeById.values())) {
    if (wake.threadId !== input.threadId) continue;
    if (wake.roomId !== (input.roomId ?? null)) continue;
    if (wake.environmentId !== (input.environmentId ?? null)) continue;
    if (wake.jobId !== (input.jobId ?? null)) continue;
    if (wake.wakeRequestId === input.replacementWakeRequestId) continue;
    if (sortedKey(wake.sourceIds) !== sourceKey) continue;
    if (!wakeCanBeExpired(wake)) continue;
    const updated = updateWake(wake.wakeRequestId, {
      status: "expired_superseded",
      failureReason: "wake_superseded_by_newer_source_packet",
      lifecycleStage: "expired",
      lifecycleReason: "wake_superseded_by_newer_source_packet",
      supersededByWakeRequestId: input.replacementWakeRequestId,
      nextRetryAt: null,
      expiresAt: now,
      updatedAt: now,
    });
    if (!updated) continue;
    recordStagePlayMailWakeResult({
      wakeRequestId: updated.wakeRequestId,
      threadId: updated.threadId,
      roomId: updated.roomId ?? null,
      environmentId: updated.environmentId ?? null,
      status: "expired_superseded",
      failedReason: "wake_superseded_by_newer_source_packet",
      evidenceRefs: uniqueStrings([...updated.evidenceRefs, input.replacementWakeRequestId]),
      createdAt: now,
    });
    superseded.push(updated);
  }
  return superseded;
}

export function recordStagePlayMailWakeResult(input: {
  wakeRequestId: string;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  status: StagePlayLiveSourceMailWakeResultV1["status"];
  askTurnId?: string | null;
  decisionIds?: string[];
  skippedReason?: string | null;
  failedReason?: string | null;
  evidenceRefs?: string[];
  createdAt?: string;
}): StagePlayLiveSourceMailWakeResultV1 {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const wake = wakeById.get(input.wakeRequestId) ?? null;
  const decisionIds = uniqueStrings(input.decisionIds ?? []);
  const evidenceRefs = uniqueStrings([input.wakeRequestId, input.askTurnId, ...decisionIds, ...(input.evidenceRefs ?? [])]);
  const voiceCheckpointRefs = voiceCheckpointRefsFromEvidence(evidenceRefs);
  const wakeResultId = `stage_play_live_source_mail_wake_result:${hashShort([
    input.wakeRequestId,
    input.status,
    input.askTurnId ?? null,
    createdAt,
  ])}`;
  const result: StagePlayLiveSourceMailWakeResultV1 = {
    artifactId: "stage_play_live_source_mail_wake_result",
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_MAIL_WAKE_RESULT_SCHEMA,
    wakeResultId,
    wakeRequestId: input.wakeRequestId,
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    status: input.status,
    askTurnId: input.askTurnId ?? null,
    decisionIds,
    voiceCheckpointRefs,
    budgetStateRef: null,
    skippedReason: input.skippedReason ?? null,
    failedReason: input.failedReason ?? null,
    lifecycleStage: resolveWakeLifecycleStage({
      status: input.status,
      askTurnId: input.askTurnId ?? null,
      decisionIds,
      evidenceRefs,
    }),
    lifecycleReason:
      input.status === "deferred_for_pressure"
        ? input.failedReason ?? "runtime_pressure_deferred_before_ask"
        : input.status === "completed"
          ? "wake_result_completion_evidence_satisfied"
          : input.failedReason ?? input.skippedReason ?? null,
    evidenceRefs,
    causalTrace: mergeLiveSourceCausalTraces([wake?.causalTrace], {
      parentRefs: [input.wakeRequestId],
      causedBy: [input.wakeRequestId],
      producedRefs: [wakeResultId],
      sourceIds: wake?.sourceIds ?? [],
      jobId: wake?.jobId ?? null,
      askTurnId: input.askTurnId ?? null,
      evidenceRefs,
    }),
    createdAt,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
  resultById.set(result.wakeResultId, result);
  return result;
}

export function attachLiveSourceBudgetStateToWakeResult(input: {
  wakeResultId: string;
  budgetStateId: string;
}): StagePlayLiveSourceMailWakeResultV1 | null {
  const existing = resultById.get(input.wakeResultId);
  if (!existing) return null;
  const updated: StagePlayLiveSourceMailWakeResultV1 = {
    ...existing,
    budgetStateRef: input.budgetStateId,
    evidenceRefs: uniqueStrings([...existing.evidenceRefs, input.budgetStateId]),
    voiceCheckpointRefs: voiceCheckpointRefsFromEvidence(uniqueStrings([...existing.evidenceRefs, input.budgetStateId])),
    causalTrace: mergeLiveSourceCausalTraces([existing.causalTrace], {
      parentRefs: [existing.wakeResultId],
      producedRefs: [input.budgetStateId],
      evidenceRefs: [input.budgetStateId],
    }),
  };
  resultById.set(updated.wakeResultId, updated);
  return updated;
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
    const coveredMailIds = wake.mailIds.filter((mailId) => (decisionsByMailId.get(mailId) ?? []).length > 0);
    if (coveredMailIds.length !== wake.mailIds.length) continue;
    const decisions = uniqueStrings(wake.mailIds.flatMap((mailId) =>
      (decisionsByMailId.get(mailId) ?? []).map((decision) => decision.decisionId)
    ));
    if (decisions.length === 0) continue;
    const matchingDecisionRecords = wake.mailIds.flatMap((mailId) => decisionsByMailId.get(mailId) ?? []);
    const askTurnId = uniqueStrings(matchingDecisionRecords.flatMap((decision) =>
      decision.evidenceRefs.filter((ref) => /^ask:/i.test(ref))
    )).at(-1) ?? null;
    const evidenceRefs = uniqueStrings([
      ...wake.evidenceRefs,
      ...decisions,
      ...matchingDecisionRecords.flatMap((decision) => decision.evidenceRefs),
    ]);
    if (
      decisionsRequireVoiceCheckpoint(matchingDecisionRecords) &&
      !hasVoiceCheckpointForDecisions(matchingDecisionRecords, evidenceRefs)
    ) {
      updateWake(wake.wakeRequestId, {
        status: wake.status === "queued" ? "running" : wake.status,
        askTurnId: askTurnId ?? undefined,
        askLaunchStatus: askTurnId ? "launched" : wake.askLaunchStatus ?? "not_started",
        askLaunchStartedAt: askTurnId ? wake.askLaunchStartedAt ?? now : wake.askLaunchStartedAt ?? null,
        askLaunchCompletedAt: askTurnId ? wake.askLaunchCompletedAt ?? now : wake.askLaunchCompletedAt ?? null,
        decisionIds: decisions,
        evidenceRefs,
        lifecycleStage: "voice_pending",
        lifecycleReason: "decision_recorded_waiting_for_voice_receipt",
        updatedAt: now,
      });
      continue;
    }
    const updated = markStagePlayMailWakeCompleted({
      wakeRequestId: wake.wakeRequestId,
      askTurnId,
      decisionIds: decisions,
      evidenceRefs,
      requiresVoiceCheckpoint: decisionsRequireVoiceCheckpoint(matchingDecisionRecords),
      now,
    });
    if (updated) {
      const latestResult = latestStagePlayLiveSourceMailWakeResult(updated.wakeRequestId);
      const latestResultCoversDecision =
        latestResult?.status === "completed" &&
        decisions.every((decisionId) => latestResult.decisionIds.includes(decisionId));
      if (!latestResultCoversDecision) {
        recordStagePlayMailWakeResult({
          wakeRequestId: updated.wakeRequestId,
          threadId: updated.threadId,
          roomId: updated.roomId ?? null,
          environmentId: updated.environmentId ?? null,
          status: "completed",
          askTurnId,
          decisionIds: decisions,
          evidenceRefs,
          createdAt: now,
        });
      }
      reconciled.push(updated);
    }
  }
  return reconciled;
}

export function reconcileStagePlayMailWakeRequestFromAskTurn(input: {
  wakeRequestIds: string[];
  askTurnId?: string | null;
  decisionIds?: string[];
  requiresVoiceCheckpoint?: boolean;
  voiceReceiptRefs?: string[];
  mailIds?: string[];
  evidenceRefs?: string[];
  now?: string;
}): {
  schema: "stage_play_live_source_mail_wake_reconciliation/v1";
  reconciledWakeIds: string[];
  skippedWakeIds: Array<{
    wakeRequestId: string;
    reason: "wake_not_found" | "wake_not_active" | "missing_decision_or_voice_receipt" | "mail_batch_not_covered";
  }>;
  wakeResultIds: string[];
  askTurnId: string | null;
  decisionIds: string[];
  voiceReceiptRefs: string[];
  reason: "ui_bridge_ask_turn_reconciled";
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
} {
  const now = input.now ?? new Date().toISOString();
  const explicitWakeRequestIds = uniqueStrings(input.wakeRequestIds);
  const decisionIds = uniqueStrings(input.decisionIds ?? []);
  const voiceReceiptRefs = uniqueStrings(input.voiceReceiptRefs ?? []);
  const mailIds = uniqueStrings(input.mailIds ?? []);
  const evidenceRefs = uniqueStrings([
    input.askTurnId ?? null,
    ...decisionIds,
    ...voiceReceiptRefs,
    ...mailIds,
    ...(input.evidenceRefs ?? []),
  ]);
  const reconciledWakeIds: string[] = [];
  const wakeResultIds: string[] = [];
  const skippedWakeIds: Array<{
    wakeRequestId: string;
    reason: "wake_not_found" | "wake_not_active" | "missing_decision_or_voice_receipt" | "mail_batch_not_covered";
  }> = [];
  const askTurnId = input.askTurnId ?? null;
  const askMatchedWakeRequestIds = askTurnId
    ? Array.from(wakeById.values())
        .filter((wake) =>
          ACTIVE_WAKE_STATUSES.has(wake.status) &&
          wake.askTurnId === askTurnId &&
          (
            decisionIds.length === 0 ||
            wake.decisionIds.length === 0 ||
            wake.decisionIds.some((decisionId) => decisionIds.includes(decisionId))
          )
        )
        .map((wake) => wake.wakeRequestId)
    : [];
  const wakeRequestIds = uniqueStrings([...explicitWakeRequestIds, ...askMatchedWakeRequestIds]);

  for (const wakeRequestId of wakeRequestIds) {
    const wake = wakeById.get(wakeRequestId);
    if (!wake) {
      skippedWakeIds.push({ wakeRequestId, reason: "wake_not_found" });
      continue;
    }
    if (!ACTIVE_WAKE_STATUSES.has(wake.status)) {
      skippedWakeIds.push({ wakeRequestId, reason: "wake_not_active" });
      continue;
    }
    if (decisionIds.length === 0 && voiceReceiptRefs.length === 0) {
      skippedWakeIds.push({ wakeRequestId, reason: "missing_decision_or_voice_receipt" });
      continue;
    }
    if (input.requiresVoiceCheckpoint === true && voiceReceiptRefs.length === 0) {
      updateWake(wakeRequestId, {
        status: wake.status === "queued" ? "running" : wake.status,
        askTurnId: input.askTurnId ?? null,
        askLaunchStatus: input.askTurnId ? "launched" : wake.askLaunchStatus ?? "not_started",
        askLaunchStartedAt: input.askTurnId ? wake.askLaunchStartedAt ?? now : wake.askLaunchStartedAt ?? null,
        askLaunchCompletedAt: input.askTurnId ? wake.askLaunchCompletedAt ?? now : wake.askLaunchCompletedAt ?? null,
        decisionIds,
        evidenceRefs: uniqueStrings([...wake.evidenceRefs, ...evidenceRefs]),
        lifecycleStage: "voice_pending",
        lifecycleReason: "decision_recorded_waiting_for_voice_receipt",
        updatedAt: now,
      });
      skippedWakeIds.push({ wakeRequestId, reason: "missing_decision_or_voice_receipt" });
      continue;
    }
    const mailCoverageKnown = mailIds.length > 0;
    if (mailCoverageKnown && !wake.mailIds.every((mailId) => mailIds.includes(mailId))) {
      skippedWakeIds.push({ wakeRequestId, reason: "mail_batch_not_covered" });
      continue;
    }

    const completed = markStagePlayMailWakeCompleted({
      wakeRequestId,
      askTurnId: input.askTurnId ?? null,
      decisionIds,
      evidenceRefs: uniqueStrings([...wake.evidenceRefs, ...evidenceRefs]),
      requiresVoiceCheckpoint: input.requiresVoiceCheckpoint === true,
      now,
    });
    if (!completed) {
      skippedWakeIds.push({ wakeRequestId, reason: "wake_not_found" });
      continue;
    }

    const latestResult = latestStagePlayLiveSourceMailWakeResult(wakeRequestId);
    const latestResultCoversAskTurn =
      latestResult?.status === "completed" &&
      (!input.askTurnId || latestResult.askTurnId === input.askTurnId) &&
      decisionIds.every((decisionId) => latestResult.decisionIds.includes(decisionId)) &&
      voiceReceiptRefs.every((voiceRef) => latestResult.evidenceRefs.includes(voiceRef));
    const wakeResult = latestResultCoversAskTurn
      ? latestResult
      : recordStagePlayMailWakeResult({
          wakeRequestId,
          threadId: completed.threadId,
          roomId: completed.roomId ?? null,
          environmentId: completed.environmentId ?? null,
          status: "completed",
          askTurnId: input.askTurnId ?? null,
          decisionIds,
          evidenceRefs: uniqueStrings([
            ...evidenceRefs,
            "ui_bridge_ask_turn_reconciled",
          ]),
          createdAt: now,
        });
    reconciledWakeIds.push(wakeRequestId);
    wakeResultIds.push(wakeResult.wakeResultId);
  }

  return {
    schema: "stage_play_live_source_mail_wake_reconciliation/v1",
    reconciledWakeIds,
    skippedWakeIds,
    wakeResultIds,
    askTurnId: input.askTurnId ?? null,
    decisionIds,
    voiceReceiptRefs,
    reason: "ui_bridge_ask_turn_reconciled",
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
}

export function resetStagePlayLiveSourceMailWakeStoreForTest(): void {
  wakeById.clear();
  resultById.clear();
}
