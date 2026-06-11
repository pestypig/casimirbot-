import crypto from "node:crypto";
import type {
  StagePlayLiveSourceCurrentStateV1,
  StagePlayLiveSourceFreshnessV1,
  StagePlayLiveSourceQualityGradeV1,
  StagePlayLiveSourceQualityV1,
} from "@shared/contracts/stage-play-live-source-current-state.v1";
import {
  STAGE_PLAY_LIVE_SOURCE_CURRENT_STATE_SCHEMA,
  STAGE_PLAY_LIVE_SOURCE_QUALITY_SCHEMA,
} from "@shared/contracts/stage-play-live-source-current-state.v1";
import type { LiveSourceCausalTraceV1, StagePlayLiveSourceMailItemV1 } from "@shared/contracts/stage-play-live-source-mail.v1";
import { readSituationSourceCapabilities } from "../situation-room/situation-source-capability-store";
import {
  listVisualFrameEvidence,
  listVisualSnapshotSources,
} from "../situation-room/visual-snapshot-store";
import {
  listStagePlayLiveSourceJobStates,
  listStagePlayLiveSourceMailItems,
  listStagePlayLiveSourceWatchJobPolicies,
  listStagePlayMailDecisions,
  listUnreadStagePlayLiveSourceMailItems,
} from "./stage-play-live-source-mailbox-store";
import { listStagePlayLiveSourceMailWakeRequests } from "./stage-play-live-source-mail-wake-store";
import { getLatestStagePlayLiveSourceNarrativeState } from "./stage-play-live-source-narrative-store";
import { mergeLiveSourceCausalTraces } from "./stage-play-live-source-causal-trace";
import { getLatestLiveSourceBudgetState } from "./stage-play-live-source-budget-store";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const previewText = (text: string | null | undefined, limit = 220): string => {
  const normalized = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.length > limit ? `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...` : normalized;
};

const parseTime = (value: string | null | undefined): number | null => {
  const parsed = Date.parse(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const positiveNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;

const latestByTime = <T>(items: T[], getTime: (item: T) => string | null | undefined): T | null =>
  [...items]
    .sort((left, right) => String(getTime(left) ?? "").localeCompare(String(getTime(right) ?? "")))
    .at(-1) ?? null;

const sourceMatches = (sourceId: string | null | undefined, item: { sourceId?: string | null; source_id?: string | null }): boolean => {
  if (!sourceId) return true;
  return item.sourceId === sourceId || item.source_id === sourceId;
};

const roomMatches = (roomId: string | null | undefined, item: { roomId?: string | null; room_id?: string | null }): boolean => {
  if (!roomId) return true;
  return !item.roomId && !item.room_id ? true : item.roomId === roomId || item.room_id === roomId;
};

const cadenceFromMail = (mailItems: StagePlayLiveSourceMailItemV1[]): number | null => {
  const hinted = mailItems
    .map((item) => positiveNumber(item.hints.elapsedMsSincePrevious))
    .find((value): value is number => value !== null);
  if (hinted !== undefined) return hinted;
  const latest = mailItems.slice(-2);
  if (latest.length < 2) return null;
  const left = parseTime(latest[0]?.createdAt);
  const right = parseTime(latest[1]?.createdAt);
  if (left === null || right === null) return null;
  const delta = right - left;
  return delta > 0 ? delta : null;
};

const resolveFreshness = (input: {
  latestAtMs: number | null;
  expectedCadenceMs: number | null;
  latestMailFreshness?: StagePlayLiveSourceFreshnessV1 | null;
  nowMs: number;
}): StagePlayLiveSourceFreshnessV1 => {
  if (input.latestMailFreshness === "missing" || input.latestMailFreshness === "stale") return input.latestMailFreshness;
  if (input.latestAtMs === null) return "missing";
  const age = Math.max(0, input.nowMs - input.latestAtMs);
  const expected = input.expectedCadenceMs ?? 15_000;
  const staleAfter = Math.max(60_000, expected * 4);
  const freshBefore = Math.max(30_000, expected * 2);
  if (age > staleAfter) return "stale";
  if (age <= freshBefore) return "fresh";
  return "unknown";
};

const qualityFor = (input: {
  freshness: StagePlayLiveSourceFreshnessV1;
  latestCapabilityStatus?: string | null;
  analysisState?: string | null;
  summaryConfidence?: number | null;
  unreadMailCount: number;
  deferredWakeCount: number;
  runningWakeCount: number;
  failedWakeCount: number;
}): StagePlayLiveSourceQualityGradeV1 => {
  if (input.freshness === "missing") return "insufficient";
  if (input.freshness === "stale") return "stale";
  if (input.latestCapabilityStatus && input.latestCapabilityStatus !== "active" && input.freshness !== "fresh") return "degraded";
  if (input.analysisState === "failed" || input.failedWakeCount > 0) return "degraded";
  if (input.deferredWakeCount > 0 || input.runningWakeCount > 0 || input.unreadMailCount > 8) return "degraded";
  if (typeof input.summaryConfidence === "number" && input.summaryConfidence < 0.45) return "degraded";
  return input.freshness === "fresh" ? "good" : "degraded";
};

const activeWakeStatuses = new Set(["queued", "waiting_for_ui_handoff", "running", "failed_retryable", "deferred_for_pressure"]);

export function queryStagePlayLiveSourceQuality(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId?: string | null;
  sourceKind?: string | null;
  expectedCadenceMs?: number | null;
  now?: string;
}): StagePlayLiveSourceQualityV1 {
  const now = input.now ?? new Date().toISOString();
  const nowMs = parseTime(now) ?? Date.now();
  const mailItems = listStagePlayLiveSourceMailItems({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceId: input.sourceId ?? null,
    sourceKind: input.sourceKind ?? null,
    limit: 50,
  });
  const unreadMail = listUnreadStagePlayLiveSourceMailItems({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceId: input.sourceId ?? null,
    sourceKind: input.sourceKind ?? null,
    includeDelivered: true,
    limit: 100,
  });
  const latestMail = latestByTime(mailItems, (item) => item.createdAt);
  const visualEvidence = listVisualFrameEvidence({ threadId: input.threadId, limit: 50 })
    .filter((evidence) => sourceMatches(input.sourceId, evidence))
    .filter((evidence) => roomMatches(input.roomId, evidence))
    .sort((left, right) => left.ts.localeCompare(right.ts));
  const latestEvidence = visualEvidence.at(-1) ?? null;
  const sourceCapabilities = readSituationSourceCapabilities({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
  }).capabilities;
  const scopedCapabilities = sourceCapabilities.filter((capability) =>
    (!input.sourceId || capability.source_id === input.sourceId) &&
    (!input.sourceKind || capability.modality === input.sourceKind),
  );
  const latestCapability =
    scopedCapabilities.find((capability) => capability.status === "active") ??
    scopedCapabilities[0] ??
    null;
  const visualSources = listVisualSnapshotSources({ threadId: input.threadId })
    .filter((source) => (!input.sourceId || source.source_id === input.sourceId) && roomMatches(input.roomId, source));
  const sourceCadence = visualSources.map((source) => positiveNumber(source.cadence_ms)).find((value): value is number => value !== null) ?? null;
  const expectedCadenceMs = positiveNumber(input.expectedCadenceMs) ?? sourceCadence;
  const latestAtMs = parseTime(latestMail?.createdAt ?? latestEvidence?.ts ?? latestCapability?.last_event_ts ?? null);
  const cadenceActualMs = cadenceFromMail(mailItems);
  const analysisReadyCount = mailItems.filter((item) => item.summary.analysisState === "analysis_ready").length;
  const analysisReadyRatio = mailItems.length > 0 ? analysisReadyCount / mailItems.length : null;
  const wakes = listStagePlayLiveSourceMailWakeRequests({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    limit: 100,
  }).filter((wake) =>
    (!input.sourceId || wake.sourceIds.includes(input.sourceId)) &&
    (!input.sourceKind || wake.mailIds.some((mailId) => mailItems.some((item) => item.mailId === mailId && item.sourceKind === input.sourceKind))),
  );
  const queuedWakeCount = wakes.filter((wake) => wake.status === "queued" || wake.status === "waiting_for_ui_handoff").length;
  const runningWakeCount = wakes.filter((wake) => wake.status === "running").length;
  const deferredWakeCount = wakes.filter((wake) => wake.status === "deferred_for_pressure").length;
  const failedWakeCount = wakes.filter((wake) => /^failed/.test(wake.status)).length;
  const freshness = resolveFreshness({
    latestAtMs,
    expectedCadenceMs,
    latestMailFreshness: latestMail?.hints.sourceFreshness ?? null,
    nowMs,
  });
  const summaryConfidence = latestMail?.summary.confidence ?? latestEvidence?.supports_claims[0]?.confidence ?? null;
  const analysisState = latestMail?.summary.analysisState ?? (latestEvidence ? "analysis_ready" : null);
  const quality = qualityFor({
    freshness,
    latestCapabilityStatus: latestCapability?.status ?? null,
    analysisState,
    summaryConfidence,
    unreadMailCount: unreadMail.length,
    deferredWakeCount,
    runningWakeCount,
    failedWakeCount,
  });
  const visualAvailable = sourceCapabilities.some((capability) =>
    capability.modality === "visual_frame" && capability.status === "active" && (!input.sourceId || capability.source_id === input.sourceId),
  ) || Boolean(latestEvidence);
  const audioAvailable = sourceCapabilities.some((capability) =>
    capability.modality === "audio_transcript" && capability.status === "active",
  );
  const latestDecision = listStagePlayMailDecisions({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    limit: 1,
  }).at(-1) ?? null;
  const latestNarrative = getLatestStagePlayLiveSourceNarrativeState({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceId: input.sourceId ?? null,
  });
  const latestWake = wakes.at(-1) ?? null;
  const latestBudget = getLatestLiveSourceBudgetState({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    wakeRequestId: latestWake?.wakeRequestId ?? null,
  }) ?? getLatestLiveSourceBudgetState({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
  });
  const limitations = uniqueStrings([
    freshness === "missing" ? "No compact live-source summary or visual evidence is available in this scope." : null,
    freshness === "stale" ? "Latest compact live-source evidence is stale for the expected cadence." : null,
    quality === "degraded" && deferredWakeCount > 0 ? "One or more wake requests are deferred, so the agent should avoid claiming real-time coverage." : null,
    latestBudget?.action === "pressure_blocked" ? `Latest budget state blocked processing for pressure: ${latestBudget.reason}.` : null,
    latestBudget?.action === "batched" ? "Latest wake was batched; retained mail should be processed in a later wake." : null,
    runningWakeCount > 0 ? "A wake request is already running; later mail may be batched." : null,
    !audioAvailable ? "No active audio transcript source is available; interpretation is visual/compact-summary only." : null,
    analysisState === "failed" ? "Latest compact analysis failed." : null,
  ]);
  const latestEvidenceRef = latestMail?.sourceRefs.evidenceRef ?? latestEvidence?.evidence_id ?? null;
  const latestFrameRef = latestMail?.sourceRefs.frameRef ?? latestEvidence?.frame_id ?? null;
  const sourceIds = uniqueStrings([
    input.sourceId,
    latestMail?.sourceId,
    latestEvidence?.source_id,
    latestCapability?.source_id,
    ...visualSources.map((source) => source.source_id),
  ]);
  const evidenceRefs = uniqueStrings([
    latestMail?.mailId,
    latestEvidenceRef,
    latestFrameRef,
    latestWake?.wakeRequestId,
    latestDecision?.decisionId,
    latestNarrative?.narrativeStateId,
    latestBudget?.budgetStateId,
    ...sourceIds,
  ]);
  const qualityId = `stage_play_live_source_quality:${hashShort([
    input.threadId,
    input.roomId ?? null,
    input.environmentId ?? null,
    input.sourceId ?? null,
    latestMail?.mailId ?? null,
    latestEvidenceRef,
    now,
  ])}`;
  return {
    artifactId: "stage_play_live_source_quality",
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_QUALITY_SCHEMA,
    qualityId,
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceId: sourceIds[0] ?? null,
    sourceKind: input.sourceKind ?? latestMail?.sourceKind ?? latestCapability?.modality ?? null,
    freshness,
    quality,
    cadence: {
      latestMailAt: latestMail?.createdAt ?? null,
      latestEvidenceAt: latestEvidence?.ts ?? null,
      latestSummaryAgeMs: latestAtMs === null ? null : Math.max(0, nowMs - latestAtMs),
      cadenceActualMs,
      expectedCadenceMs,
      framesDropped: null,
      analysisReadyRatio,
    },
    summaryConfidence,
    analysisState,
    backlog: {
      unreadMailCount: unreadMail.length,
      activeWakeCount: wakes.filter((wake) => activeWakeStatuses.has(wake.status)).length,
      queuedWakeCount,
      runningWakeCount,
      deferredWakeCount,
      failedWakeCount,
    },
    modality: {
      visualAvailable,
      audioAvailable,
      visualOnly: visualAvailable && !audioAvailable,
      audioMissing: !audioAvailable,
    },
    pressure: {
      askBusy: runningWakeCount > 0,
      deferredForPressure: deferredWakeCount > 0,
      reason: deferredWakeCount > 0
        ? "wake_deferred_for_pressure"
        : runningWakeCount > 0
          ? "wake_running"
          : latestBudget?.pressure.pressureReason ?? null,
    },
    budget: latestBudget,
    latestRefs: {
      mailId: latestMail?.mailId ?? null,
      evidenceRef: latestEvidenceRef,
      frameRef: latestFrameRef,
      wakeRequestId: latestWake?.wakeRequestId ?? null,
      decisionId: latestDecision?.decisionId ?? null,
      narrativeStateId: latestNarrative?.narrativeStateId ?? null,
    },
    limitations,
    evidenceRefs,
    causalTrace: mergeLiveSourceCausalTraces([
      latestMail?.causalTrace,
      latestWake?.causalTrace,
      latestDecision?.causalTrace,
      latestNarrative?.causalTrace,
      latestBudget?.causalTrace,
    ], {
      parentRefs: evidenceRefs,
      producedRefs: [qualityId],
      sourceIds,
      jobId: latestDecision?.activeJobId ?? latestNarrative?.jobId ?? null,
      policyId: latestNarrative?.policyId ?? null,
      evidenceRefs,
    }),
    createdAt: now,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
}

export function summarizeStagePlayLiveSourceCurrentState(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId?: string | null;
  sourceKind?: string | null;
  expectedCadenceMs?: number | null;
  limit?: number | null;
  now?: string;
}): StagePlayLiveSourceCurrentStateV1 {
  const now = input.now ?? new Date().toISOString();
  const limit = Math.max(1, Math.min(input.limit ?? 6, 20));
  const quality = queryStagePlayLiveSourceQuality(input);
  const latestBudget = quality.budget ?? getLatestLiveSourceBudgetState({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
  });
  const mailItems = listStagePlayLiveSourceMailItems({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceId: input.sourceId ?? null,
    sourceKind: input.sourceKind ?? null,
    limit,
  });
  const decisions = listStagePlayMailDecisions({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    limit: 1,
  });
  const latestDecision = decisions.at(-1) ?? null;
  const latestNarrative = getLatestStagePlayLiveSourceNarrativeState({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceId: input.sourceId ?? null,
  });
  const jobStates = listStagePlayLiveSourceJobStates({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    limit: 20,
  });
  const policies = listStagePlayLiveSourceWatchJobPolicies({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    limit: 20,
  });
  const activeWatchJobs = jobStates
    .filter((state) => state.status === "armed" || state.status === "checking" || state.status === "blocked")
    .map((state) => {
      const policy = policies.find((candidate) => candidate.policyId === state.watchJobPolicyRef) ?? null;
      return {
        jobId: state.jobId,
        policyId: state.watchJobPolicyRef ?? null,
        objective: policy?.objectiveText ?? state.objective ?? null,
        status: state.status,
        nextLoopState: state.nextLoopState,
      };
    });
  const latestMailItems = mailItems.map((item) => ({
    mailId: item.mailId,
    sourceId: item.sourceId,
    sourceKind: item.sourceKind,
    status: item.status,
    preview: previewText(item.summary.preview || item.summary.text, 220),
    evidenceRef: item.sourceRefs.evidenceRef ?? null,
    frameRef: item.sourceRefs.frameRef ?? null,
    createdAt: item.createdAt,
  }));
  const whatAskCanSafelySay = uniqueStrings([
    quality.freshness === "fresh" && latestMailItems.length > 0
      ? `Latest compact live-source summary is fresh: ${latestMailItems.at(-1)?.preview}`
      : null,
    quality.freshness === "stale"
      ? "Latest compact live-source evidence is stale; answer with stale-source caveats."
      : null,
    quality.freshness === "missing"
      ? "No compact live-source summary is available in this scope."
      : null,
    latestNarrative
      ? `Latest narrative state: ${previewText(latestNarrative.interpretedSituation.userRelevantMeaning, 220)}`
      : null,
    latestDecision
      ? `Latest mail decision was ${latestDecision.decision}.`
      : null,
    quality.pressure.deferredForPressure
      ? "Wake processing is deferred under pressure; avoid real-time claims."
      : null,
    latestBudget ? `Latest budget action: ${latestBudget.action} (${latestBudget.reason}).` : null,
  ]);
  const nextUsefulTool =
    quality.backlog.unreadMailCount > 0
      ? "live_env.read_processed_live_source_mail"
      : activeWatchJobs.length === 0
        ? "live_env.configure_live_source_watch_job"
        : quality.quality === "stale" || quality.quality === "degraded"
          ? "live_env.query_live_source_quality"
          : null;
  const sourceIds = uniqueStrings([
    quality.sourceId,
    ...mailItems.map((item) => item.sourceId),
    ...activeWatchJobs.flatMap((job) =>
      jobStates.find((state) => state.jobId === job.jobId)?.sourceIds ?? [],
    ),
  ]);
  const currentStateId = `stage_play_live_source_current_state:${hashShort([
    input.threadId,
    input.roomId ?? null,
    input.environmentId ?? null,
    sourceIds,
    quality.qualityId,
    latestDecision?.decisionId ?? null,
    latestNarrative?.narrativeStateId ?? null,
    now,
  ])}`;
  const evidenceRefs = uniqueStrings([
    quality.qualityId,
    ...quality.evidenceRefs,
    ...latestMailItems.flatMap((item) => [item.mailId, item.evidenceRef, item.frameRef]),
    ...activeWatchJobs.flatMap((job) => [job.jobId, job.policyId]),
    latestDecision?.decisionId,
    latestNarrative?.narrativeStateId,
    latestBudget?.budgetStateId,
  ]);
  const causalTrace: LiveSourceCausalTraceV1 = mergeLiveSourceCausalTraces([
    quality.causalTrace,
    latestDecision?.causalTrace,
    latestNarrative?.causalTrace,
    latestBudget?.causalTrace,
    ...mailItems.map((item) => item.causalTrace),
  ], {
    parentRefs: evidenceRefs,
    producedRefs: [currentStateId],
    sourceIds,
    jobId: latestDecision?.activeJobId ?? latestNarrative?.jobId ?? activeWatchJobs.at(-1)?.jobId ?? null,
    policyId: latestNarrative?.policyId ?? activeWatchJobs.at(-1)?.policyId ?? null,
    evidenceRefs,
  });
  return {
    artifactId: "stage_play_live_source_current_state",
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_CURRENT_STATE_SCHEMA,
    currentStateId,
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceIds,
    activeWatchJobs,
    latestMailItems,
    latestDecision: latestDecision
      ? {
          decisionId: latestDecision.decisionId,
          decision: latestDecision.decision,
          rationalePreview: latestDecision.rationalePreview,
          nextLoopState: latestDecision.nextLoopState,
          createdAt: latestDecision.createdAt,
        }
      : null,
    latestNarrativeState: latestNarrative
      ? {
          narrativeStateId: latestNarrative.narrativeStateId,
          runningStorySummary: latestNarrative.runningStorySummary,
          userRelevantMeaning: latestNarrative.interpretedSituation.userRelevantMeaning,
          watchNextTargets: latestNarrative.watchNext.targets,
          watchNextReason: latestNarrative.watchNext.reason,
          predictionText: latestNarrative.prediction?.text ?? null,
          staleness: latestNarrative.staleness.state,
          createdAt: latestNarrative.createdAt,
        }
      : null,
    quality,
    pending: {
      unreadMailCount: quality.backlog.unreadMailCount,
      queuedWakeCount: quality.backlog.queuedWakeCount,
      runningWakeCount: quality.backlog.runningWakeCount,
      deferredWakeCount: quality.backlog.deferredWakeCount,
    },
    budget: latestBudget,
    whatAskCanSafelySay,
    limitations: uniqueStrings([...quality.limitations]),
    nextUsefulTool,
    evidenceRefs,
    causalTrace,
    createdAt: now,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
}
