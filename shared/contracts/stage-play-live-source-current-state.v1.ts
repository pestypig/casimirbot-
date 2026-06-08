import type { LiveSourceCausalTraceV1, StagePlayNextLoopStateV1 } from "./stage-play-live-source-mail.v1";

export const STAGE_PLAY_LIVE_SOURCE_QUALITY_SCHEMA = "stage_play_live_source_quality/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_CURRENT_STATE_SCHEMA = "stage_play_live_source_current_state/v1" as const;
export const LIVE_SOURCE_BUDGET_STATE_SCHEMA = "live_source_budget_state/v1" as const;

export type StagePlayLiveSourceFreshnessV1 = "fresh" | "stale" | "missing" | "unknown";
export type StagePlayLiveSourceQualityGradeV1 = "good" | "degraded" | "stale" | "insufficient";
export type LiveSourceBudgetActionV1 =
  | "processed"
  | "batched"
  | "deferred"
  | "pressure_blocked"
  | "paused";

export type LiveSourceBudgetStateV1 = {
  artifactId: "live_source_budget_state";
  schemaVersion: typeof LIVE_SOURCE_BUDGET_STATE_SCHEMA;
  budgetStateId: string;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  wakeRequestId?: string | null;
  wakeResultId?: string | null;
  askTurnId?: string | null;
  action: LiveSourceBudgetActionV1;
  reason: string;
  mailCounts: {
    wakeMailCount: number;
    processedMailCount: number;
    retainedMailCount: number;
    unreadBacklogCount: number;
  };
  wakeCounts: {
    queuedWakeCount: number;
    runningWakeCount: number;
    deferredWakeCount: number;
    failedWakeCount: number;
  };
  latency: {
    wakeQueuedAt?: string | null;
    wakeStartedAt?: string | null;
    wakeCompletedAt?: string | null;
    wakeAgeMs?: number | null;
    averageWakeLatencyMs?: number | null;
  };
  pressure: {
    askBusy: boolean;
    deferredForPressure: boolean;
    pressureReason?: string | null;
    memoryPressure?: "none" | "moderate" | "high" | "unknown";
  };
  allowedNextAction:
    | "process_now"
    | "defer"
    | "batch"
    | "retry_later"
    | "pause_source"
    | "wait";
  loopState:
    | "armed_for_next_summary"
    | "continue_with_unread_mail"
    | "deferred_for_pressure"
    | "paused"
    | "completed"
    | "failed";
  evidenceRefs: string[];
  causalTrace?: LiveSourceCausalTraceV1;
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceQualityV1 = {
  artifactId: "stage_play_live_source_quality";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_QUALITY_SCHEMA;
  qualityId: string;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId?: string | null;
  sourceKind?: string | null;
  freshness: StagePlayLiveSourceFreshnessV1;
  quality: StagePlayLiveSourceQualityGradeV1;
  cadence: {
    latestMailAt?: string | null;
    latestEvidenceAt?: string | null;
    latestSummaryAgeMs?: number | null;
    cadenceActualMs?: number | null;
    expectedCadenceMs?: number | null;
    framesDropped?: number | null;
    analysisReadyRatio?: number | null;
  };
  summaryConfidence?: number | null;
  analysisState?: "analysis_ready" | "pending" | "failed" | "unknown" | string | null;
  backlog: {
    unreadMailCount: number;
    activeWakeCount: number;
    queuedWakeCount: number;
    runningWakeCount: number;
    deferredWakeCount: number;
    failedWakeCount: number;
  };
  modality: {
    visualAvailable: boolean;
    audioAvailable: boolean;
    visualOnly: boolean;
    audioMissing: boolean;
  };
  pressure: {
    askBusy: boolean;
    deferredForPressure: boolean;
    reason?: string | null;
  };
  budget?: LiveSourceBudgetStateV1 | null;
  latestRefs: {
    mailId?: string | null;
    evidenceRef?: string | null;
    frameRef?: string | null;
    wakeRequestId?: string | null;
    decisionId?: string | null;
    narrativeStateId?: string | null;
  };
  limitations: string[];
  evidenceRefs: string[];
  causalTrace?: LiveSourceCausalTraceV1;
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceCurrentStateV1 = {
  artifactId: "stage_play_live_source_current_state";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_CURRENT_STATE_SCHEMA;
  currentStateId: string;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceIds: string[];
  activeWatchJobs: Array<{
    jobId: string;
    policyId?: string | null;
    objective?: string | null;
    status: string;
    nextLoopState?: StagePlayNextLoopStateV1 | string | null;
  }>;
  latestMailItems: Array<{
    mailId: string;
    sourceId: string;
    sourceKind: string;
    status: string;
    preview: string;
    evidenceRef?: string | null;
    frameRef?: string | null;
    createdAt: string;
  }>;
  latestDecision?: {
    decisionId: string;
    decision: string;
    rationalePreview: string;
    nextLoopState?: StagePlayNextLoopStateV1 | string | null;
    createdAt: string;
  } | null;
  latestNarrativeState?: {
    narrativeStateId: string;
    runningStorySummary: string;
    userRelevantMeaning: string;
    watchNextTargets: string[];
    watchNextReason: string;
    predictionText?: string | null;
    staleness: string;
    createdAt: string;
  } | null;
  quality: StagePlayLiveSourceQualityV1;
  pending: {
    unreadMailCount: number;
    queuedWakeCount: number;
    runningWakeCount: number;
    deferredWakeCount: number;
  };
  budget?: LiveSourceBudgetStateV1 | null;
  whatAskCanSafelySay: string[];
  limitations: string[];
  nextUsefulTool?:
    | "live_env.read_live_source_mail"
    | "live_env.record_live_source_mail_decision"
    | "live_env.query_live_source_quality"
    | "live_env.configure_live_source_watch_job"
    | null;
  evidenceRefs: string[];
  causalTrace?: LiveSourceCausalTraceV1;
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};
