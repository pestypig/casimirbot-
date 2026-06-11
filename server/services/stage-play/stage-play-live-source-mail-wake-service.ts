import type { RuntimeAdmissionDecision } from "../runtime/runtime-memory-governor";
import { runtimeMemoryGovernor } from "../runtime/runtime-memory-governor";
import {
  listStagePlayLiveSourceJobStates,
  configureStagePlayLiveSourceWatchJobPolicy,
  subscribeStagePlayLiveSourceMailEnqueued,
  type StagePlayLiveSourceMailEnqueuedEvent,
} from "./stage-play-live-source-mailbox-store";
import { recordStagePlayLiveSourceMailTranscriptEntries } from "./stage-play-live-source-mail-transcript-store";
import {
  queueMailWakeForUnreadItems,
  runNextMailWakeRequest,
  type AskWakeTurnRunner,
  type StagePlayMailWakePressureCheck,
} from "./stage-play-live-source-mail-wake-runner";
import {
  listRunnableStagePlayLiveSourceMailWakeRequests,
  listStagePlayLiveSourceMailWakeRequests,
  recordStagePlayMailWakeResult,
  releaseStaleRunningStagePlayMailWakeRequests,
} from "./stage-play-live-source-mail-wake-store";
import type {
  StagePlayLiveSourceMailWakeResultV1,
} from "@shared/contracts/stage-play-live-source-mail-wake.v1";

export type StagePlayLiveSourceMailWakeAdmissionCycleResultV1 = {
  schema: "stage_play_live_source_mail_wake_admission_cycle/v1";
  now: string;
  queuedWakeIds: string[];
  runnableWakeIds: string[];
  runningWakeIds: string[];
  deferredWakeIds: string[];
  lockState: {
    cycleRunning: boolean;
    cycleStartedAt: string | null;
    runningWakeIdsBeforeRelease: string[];
    runningWakeIdsAfterRelease: string[];
    releasedStaleWakeIds: string[];
    staleAfterMs: number;
    status: "free" | "held" | "released_stale_wakes";
    reason: string;
  };
  result: StagePlayLiveSourceMailWakeResultV1 | null;
  status: "idle" | "queued" | "waiting_for_ui_handoff" | "running" | "completed" | "deferred_for_pressure" | "failed_retryable" | "failed_terminal" | "failed";
  reason: string;
  continuation: {
    scheduled: boolean;
    reason:
      | "runnable_wake_remaining"
      | "manual_cycle_no_auto_continuation"
      | "no_runnable_wake_remaining"
      | "wake_result_not_continuable"
      | "wake_runner_disabled";
    runnableWakeIds: string[];
  };
  runtimeAdmission?: {
    admitted: boolean;
    action: RuntimeAdmissionDecision["action"];
    reason: RuntimeAdmissionDecision["reason"];
    pressureLevel: RuntimeAdmissionDecision["pressureLevel"];
    checkedAt: string;
    source: "stage_play_live_source_mail_wake";
    memory: RuntimeAdmissionDecision["memory"];
    limits: RuntimeAdmissionDecision["limits"];
    localBypass?: {
      applied: boolean;
      reason: string;
    } | null;
  } | null;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

const DEFAULT_WAKE_SERVICE_INTERVAL_MS = 15_000;
const WAKE_SERVICE_RUNTIME_TASK_ID = "stage_play_live_source_mail_wake_service";
let serviceTimer: ReturnType<typeof setInterval> | null = null;
let immediateRunTimer: ReturnType<typeof setTimeout> | null = null;
let cycleRunning = false;
let cycleStartedAt: string | null = null;
let servicePaused = false;
let unsubscribeMailEnqueued: (() => void) | null = null;

const readPositiveIntEnv = (name: string, fallback: number): number => {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const wakeRuntimePressureCheck = (runtimeAdmissionSink?: (decision: RuntimeAdmissionDecision) => void): StagePlayMailWakePressureCheck =>
  ({ wakeRequest }) => {
    const admission = runtimeMemoryGovernor.admitRuntimeTask({
      taskClass: "stage_play_refresh",
      traceId: wakeRequest.wakeRequestId,
      source: "stage_play_live_source_mail_wake",
    });
    runtimeAdmissionSink?.(admission);
    const localBypass = localWakePressureBypass(admission);
    if (localBypass.applied) {
      admission.lease?.release("aborted");
      return {
        deferred: false,
        reason: localBypass.reason,
      };
    }
    if (!admission.admitted) {
      return {
        deferred: true,
        reason: `runtime_memory_${admission.reason}`,
      };
    }
    return {
      deferred: false,
      release: admission.lease?.release,
      reason: admission.reason,
    };
  };

const immediateRunDelayMs = (): number =>
  readPositiveIntEnv("STAGE_PLAY_MAIL_WAKE_IMMEDIATE_DELAY_MS", 250);

const staleRunningWakeMs = (): number =>
  readPositiveIntEnv("STAGE_PLAY_MAIL_WAKE_STALE_RUNNING_MS", 130_000);

const readPositiveNumberEnv = (name: string, fallback: number): number => {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const localWakePressureBypass = (
  admission: RuntimeAdmissionDecision,
): { applied: boolean; reason: string } => {
  if (process.env.NODE_ENV === "production") return { applied: false, reason: "production_disabled" };
  if (String(process.env.STAGE_PLAY_MAIL_WAKE_LOCAL_PRESSURE_BYPASS ?? "1").trim() === "0") {
    return { applied: false, reason: "env_disabled" };
  }
  if (admission.admitted) return { applied: false, reason: "already_admitted" };
  if (admission.reason !== "queue_deferrable") return { applied: false, reason: `not_deferrable:${admission.reason}` };
  const maxHeap = readPositiveNumberEnv("STAGE_PLAY_MAIL_WAKE_LOCAL_BYPASS_MAX_HEAP_MB", 1200);
  const maxRss = readPositiveNumberEnv("STAGE_PLAY_MAIL_WAKE_LOCAL_BYPASS_MAX_RSS_MB", 1800);
  if (admission.memory.heapUsedMiB > maxHeap || admission.memory.rssMiB > maxRss) {
    return {
      applied: false,
      reason: `local_limits_exceeded:heap=${admission.memory.heapUsedMiB}/${maxHeap}:rss=${admission.memory.rssMiB}/${maxRss}`,
    };
  }
  return {
    applied: true,
    reason: `local_stage_play_wake_bypass:${admission.pressureLevel}:heap=${admission.memory.heapUsedMiB}/${admission.limits.maxHeapUsedMiB}:rss=${admission.memory.rssMiB}/${admission.limits.maxRssMiB}`,
  };
};

const ensureIntervalWatchPolicyForJob = (
  job: ReturnType<typeof listStagePlayLiveSourceJobStates>[number],
  now: string,
): ReturnType<typeof configureStagePlayLiveSourceWatchJobPolicy>["policy"] | null => {
  if (job.watchJobPolicyRef) return null;
  const hasExplicitWatchIntent =
    Boolean(job.objective?.trim()) ||
    typeof job.nextWakePolicy.afterMs === "number";
  if (!hasExplicitWatchIntent) return null;
  const configured = configureStagePlayLiveSourceWatchJobPolicy({
    jobId: job.jobId,
    threadId: job.threadId,
    roomId: job.roomId ?? null,
    environmentId: job.environmentId ?? null,
    sourceIds: job.sourceIds,
    objectiveText: job.objective ??
      "Use micro-reasoners to watch the active visual source, track the latest prediction horizon, and wake Helix Ask only for salient findings.",
    decisionPolicyPrompt: [
      "Process interval mail through the fast micro-reasoner layer first.",
      "If the processed packet recommends wait_for_next_summary, keep the result as observer backlog and do not wake Ask.",
      "If the processed packet recommends record_interpretation, draft_text_answer, request_voice_callout, request_more_evidence, or request_stage_play_checkpoint, wake Ask with the compact processed packet context.",
      "For Minecraft-style live sources, request voice only for urgent risk/opportunity findings such as lava, fire, damage, hostile mobs, low health, or a profile-specified rare opportunity.",
      "After any decision, keep nextLoopState armed_for_next_summary.",
    ].join("\n"),
    interpretationMode: "prediction_watch",
    mailProcessingMode: "salience_window",
    outputCadence: "voice_only_salient",
    outputPolicy: {
      allowTextAnswer: true,
      allowVoiceCallout: true,
      voiceRequiresUrgency: true,
      confirmationRequired: false,
    },
    importanceCriteria: [
      "Urgent risk, prediction contradiction, meaningful scene transition, hostile encounter, lava/fire/damage cue, low health, or profile-specified opportunity.",
    ],
    suppressCriteria: [
      "Routine movement, stable inventory/chest/base frames, repeated low-salience scene summaries, and wait_for_next_summary processed packets.",
    ],
    evidenceRefs: [job.jobId, ...job.sourceIds],
    now,
  });
  return configured.policy;
};

export function requestStagePlayLiveSourceMailWakeRun(
  event?: StagePlayLiveSourceMailEnqueuedEvent,
): boolean {
  if (process.env.NODE_ENV === "test") return false;
  if (process.env.STAGE_PLAY_MAIL_WAKE_RUNNER_ENABLED === "0") return false;
  if (process.env.STAGE_PLAY_MAIL_WAKE_AUTO_RUN_ENABLED === "0") return false;
  if (servicePaused) return false;
  if (event && !event.wakeRequestId) return false;
  if (immediateRunTimer) return false;
  immediateRunTimer = setTimeout(() => {
    immediateRunTimer = null;
    if (servicePaused) return;
    void runStagePlayLiveSourceMailWakeAdmissionCycle().catch((err) => {
      console.warn("[stage-play-mail-wake-service] immediate admission cycle failed", err);
    });
  }, immediateRunDelayMs());
  immediateRunTimer.unref?.();
  return true;
}

const summarizeWakeState = (input: {
  now: string;
  result: StagePlayLiveSourceMailWakeResultV1 | null;
  runtimeAdmission: RuntimeAdmissionDecision | null;
  reason?: string;
  continuation?: StagePlayLiveSourceMailWakeAdmissionCycleResultV1["continuation"] | null;
  lockState?: Partial<StagePlayLiveSourceMailWakeAdmissionCycleResultV1["lockState"]> | null;
}): StagePlayLiveSourceMailWakeAdmissionCycleResultV1 => {
  const wakes = listStagePlayLiveSourceMailWakeRequests({ limit: 250 });
  const runnable = listRunnableStagePlayLiveSourceMailWakeRequests({ now: input.now, limit: 250 });
  const running = wakes.filter((wake) => wake.status === "running");
  const deferred = wakes.filter((wake) => wake.status === "deferred_for_pressure");
  const uiHandoff = wakes.filter((wake) => wake.status === "waiting_for_ui_handoff");
  const queued = wakes.filter((wake) => wake.status === "queued" || wake.status === "waiting_for_ui_handoff");
  const resultStatus = input.result?.status === "skipped" ? "queued" : input.result?.status;
  const status = resultStatus ??
    (running.length > 0 ? "running" :
      runnable.length > 0 ? "queued" :
        deferred.length > 0 ? "deferred_for_pressure" :
          uiHandoff.length > 0 ? "waiting_for_ui_handoff" :
            queued.length > 0 ? "queued" :
            "idle");
  return {
    schema: "stage_play_live_source_mail_wake_admission_cycle/v1",
    now: input.now,
    queuedWakeIds: queued.map((wake) => wake.wakeRequestId),
    runnableWakeIds: runnable.map((wake) => wake.wakeRequestId),
    runningWakeIds: running.map((wake) => wake.wakeRequestId),
    deferredWakeIds: deferred.map((wake) => wake.wakeRequestId),
    lockState: {
      cycleRunning,
      cycleStartedAt,
      runningWakeIdsBeforeRelease: input.lockState?.runningWakeIdsBeforeRelease ?? running.map((wake) => wake.wakeRequestId),
      runningWakeIdsAfterRelease: input.lockState?.runningWakeIdsAfterRelease ?? running.map((wake) => wake.wakeRequestId),
      releasedStaleWakeIds: input.lockState?.releasedStaleWakeIds ?? [],
      staleAfterMs: input.lockState?.staleAfterMs ?? staleRunningWakeMs(),
      status: input.lockState?.status ?? (cycleRunning || running.length > 0 ? "held" : "free"),
      reason: input.lockState?.reason ?? (cycleRunning ? "wake_cycle_mutex_running" : running.length > 0 ? "wake_request_running" : "no_wake_lock"),
    },
    result: input.result,
    status,
    reason: input.reason ?? (input.result ? "wake_result_recorded" : "no_runnable_wake"),
    continuation: input.continuation ?? {
      scheduled: false,
      reason: "no_runnable_wake_remaining",
      runnableWakeIds: [],
    },
    runtimeAdmission: input.runtimeAdmission ? {
      admitted: input.runtimeAdmission.admitted,
      action: input.runtimeAdmission.action,
      reason: input.runtimeAdmission.reason,
      pressureLevel: input.runtimeAdmission.pressureLevel,
      checkedAt: input.now,
      source: "stage_play_live_source_mail_wake",
      memory: input.runtimeAdmission.memory,
      limits: input.runtimeAdmission.limits,
      localBypass: localWakePressureBypass(input.runtimeAdmission),
    } : null,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
};

const maybeScheduleContinuation = (input: {
  now: string;
  result: StagePlayLiveSourceMailWakeResultV1 | null;
  manualRun?: boolean;
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
}): StagePlayLiveSourceMailWakeAdmissionCycleResultV1["continuation"] => {
  const continuable =
    input.result?.status === "completed" ||
    input.result?.status === "failed_retryable";
  if (!continuable) {
    return {
      scheduled: false,
      reason: input.result ? "wake_result_not_continuable" : "no_runnable_wake_remaining",
      runnableWakeIds: [],
    };
  }
  const runnable = listRunnableStagePlayLiveSourceMailWakeRequests({
    threadId: input.threadId ?? null,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? null,
    now: input.now,
    limit: 250,
  });
  const runnableWakeIds = runnable.map((wake) => wake.wakeRequestId);
  if (runnableWakeIds.length === 0) {
    return {
      scheduled: false,
      reason: "no_runnable_wake_remaining",
      runnableWakeIds,
    };
  }
  if (input.manualRun) {
    return {
      scheduled: false,
      reason: "manual_cycle_no_auto_continuation",
      runnableWakeIds,
    };
  }
  const scheduled = requestStagePlayLiveSourceMailWakeRun();
  return {
    scheduled,
    reason: scheduled ? "runnable_wake_remaining" : "wake_runner_disabled",
    runnableWakeIds,
  };
};

const continuationBody = (
  status: StagePlayLiveSourceMailWakeResultV1["status"],
  continuation: StagePlayLiveSourceMailWakeAdmissionCycleResultV1["continuation"],
  retainedMailCount: number,
): string => {
  const continuationText = continuation.scheduled
    ? "scheduled"
    : continuation.reason === "manual_cycle_no_auto_continuation"
      ? "manual cycle no auto continuation"
      : continuation.reason === "wake_runner_disabled"
        ? "deferred; wake runner disabled"
        : continuation.reason === "no_runnable_wake_remaining"
          ? "armed for next summary"
          : "deferred";
  return [
    status === "completed" ? "Batch checkpoint completed." : `Batch ${status}.`,
    `Continuation: ${continuationText}.`,
    continuation.scheduled
      ? "Backend wake loop remains armed."
      : continuation.reason === "manual_cycle_no_auto_continuation"
        ? "Manual checkpoint completed. Standing watch job continues only if a watch policy is armed."
        : status === "deferred_for_pressure"
          ? "Wake deferred for pressure; unread mail retained."
          : null,
    `Loop state: armed_for_next_summary.`,
    retainedMailCount > 0 ? `Unread retained: ${retainedMailCount}.` : null,
    continuation.runnableWakeIds.length > 0
      ? `Runnable wake ids: ${continuation.runnableWakeIds.join(", ")}.`
      : null,
  ].filter(Boolean).join("\n");
};

const recordContinuationTranscriptRow = (input: {
  result: StagePlayLiveSourceMailWakeResultV1 | null;
  continuation: StagePlayLiveSourceMailWakeAdmissionCycleResultV1["continuation"];
  now: string;
}): void => {
  if (!input.result) return;
  if (input.result.status !== "completed" && input.result.status !== "failed_retryable") return;
  const wake = listStagePlayLiveSourceMailWakeRequests({ limit: 250 })
    .find((entry) => entry.wakeRequestId === input.result?.wakeRequestId) ?? null;
  const retainedMailCount = listStagePlayLiveSourceMailWakeRequests({ limit: 250 })
    .filter((entry) => input.continuation.runnableWakeIds.includes(entry.wakeRequestId))
    .reduce((total, entry) => total + entry.mailIds.length, 0);
  recordStagePlayLiveSourceMailTranscriptEntries({
    threadId: input.result.threadId,
    roomId: input.result.roomId ?? null,
    environmentId: input.result.environmentId ?? null,
    wakeRequestId: input.result.wakeRequestId,
    wakeResultId: input.result.wakeResultId,
    askTurnId: input.result.askTurnId ?? null,
    decisionIds: input.result.decisionIds,
    mailIds: wake?.mailIds ?? [],
    sourceIds: wake?.sourceIds ?? [],
    evidenceRefs: [
      input.result.wakeResultId,
      input.result.wakeRequestId,
      ...input.result.evidenceRefs,
      ...input.continuation.runnableWakeIds,
    ],
    causalTrace: input.result.causalTrace ?? wake?.causalTrace,
    createdAt: input.now,
    rows: [{
      rowId: `wake_continuation_state:${input.result.wakeResultId}`,
      rowKind: "loop_state",
      title: "Continuation state",
      body: continuationBody(input.result.status, input.continuation, retainedMailCount),
      source: {
        artifactId: input.result.wakeResultId,
        artifactKind: input.result.artifactId,
      },
      evidenceRefs: [
        input.result.wakeResultId,
        input.result.wakeRequestId,
        ...input.continuation.runnableWakeIds,
      ],
      causalTrace: input.result.causalTrace ?? wake?.causalTrace,
      authority: "tool_evidence",
      assistantAnswer: false,
      terminalEligible: false,
      createdAt: input.now,
    }],
  });
};

export async function runStagePlayLiveSourceMailWakeAdmissionCycle(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  baseUrl?: string;
  askTurnRunner?: AskWakeTurnRunner;
  executeHiddenAsk?: boolean;
  now?: string;
  pressureCheck?: StagePlayMailWakePressureCheck | null;
  manualRun?: boolean;
} = {}): Promise<StagePlayLiveSourceMailWakeAdmissionCycleResultV1> {
  const now = input.now ?? new Date().toISOString();
  if (cycleRunning) {
    return summarizeWakeState({
      now,
      result: null,
      runtimeAdmission: null,
      reason: "wake_cycle_already_running",
      lockState: {
        cycleRunning: true,
        cycleStartedAt,
        status: "held",
        reason: "wake_cycle_mutex_running",
      },
    });
  }
  cycleRunning = true;
  cycleStartedAt = now;
  let runtimeAdmission: RuntimeAdmissionDecision | null = null;
  try {
    const runningWakeIdsBeforeRelease = listStagePlayLiveSourceMailWakeRequests({
      threadId: input.threadId ?? null,
      roomId: input.roomId ?? null,
      environmentId: input.environmentId ?? null,
      jobId: input.jobId ?? null,
      status: "running",
      limit: 250,
    }).map((wake) => wake.wakeRequestId);
    const staleAfterMs = staleRunningWakeMs();
    const releasedStaleWakes = releaseStaleRunningStagePlayMailWakeRequests({
      threadId: input.threadId ?? null,
      roomId: input.roomId ?? null,
      environmentId: input.environmentId ?? null,
      jobId: input.jobId ?? null,
      now,
      staleAfterMs,
      failureReason: "wake_cycle_stale_released",
      nextRetryAt: now,
      limit: 250,
    });
    for (const wake of releasedStaleWakes) {
      recordStagePlayMailWakeResult({
        wakeRequestId: wake.wakeRequestId,
        threadId: wake.threadId,
        roomId: wake.roomId ?? null,
        environmentId: wake.environmentId ?? null,
        status: "failed_retryable",
        failedReason: "wake_cycle_stale_released",
        evidenceRefs: wake.evidenceRefs,
        createdAt: now,
      });
    }
    const runningWakeIdsAfterRelease = listStagePlayLiveSourceMailWakeRequests({
      threadId: input.threadId ?? null,
      roomId: input.roomId ?? null,
      environmentId: input.environmentId ?? null,
      jobId: input.jobId ?? null,
      status: "running",
      limit: 250,
    }).map((wake) => wake.wakeRequestId);
    const lockState: Partial<StagePlayLiveSourceMailWakeAdmissionCycleResultV1["lockState"]> = {
      cycleRunning: false,
      cycleStartedAt: now,
      runningWakeIdsBeforeRelease,
      runningWakeIdsAfterRelease,
      releasedStaleWakeIds: releasedStaleWakes.map((wake) => wake.wakeRequestId),
      staleAfterMs,
      status: runningWakeIdsAfterRelease.length > 0 ? "held" : releasedStaleWakes.length > 0 ? "released_stale_wakes" : "free",
      reason: runningWakeIdsAfterRelease.length > 0
        ? "wake_request_running"
        : releasedStaleWakes.length > 0
          ? "wake_cycle_stale_released"
          : "no_stale_wake_lock",
    };
    const jobs = listStagePlayLiveSourceJobStates({
      threadId: input.threadId ?? null,
      roomId: input.roomId ?? null,
      environmentId: input.environmentId ?? null,
      jobId: input.jobId ?? null,
      limit: 100,
    }).filter((job) => job.status === "armed" || job.status === "checking");
    for (const job of jobs) {
      ensureIntervalWatchPolicyForJob(job, now);
      const sourceIds = job.sourceIds.length > 0 ? job.sourceIds : [null];
      for (const sourceId of sourceIds) {
        queueMailWakeForUnreadItems({
          threadId: job.threadId,
          roomId: job.roomId ?? null,
          environmentId: job.environmentId ?? null,
          sourceId,
          limit: job.nextWakePolicy.maxConsecutiveReads ?? undefined,
          now,
        });
      }
    }
    const pressureCheck = input.pressureCheck ?? wakeRuntimePressureCheck((decision) => {
      runtimeAdmission = decision;
    });
    const result = await runNextMailWakeRequest({
      threadId: input.threadId ?? null,
      roomId: input.roomId ?? null,
      environmentId: input.environmentId ?? null,
      jobId: input.jobId ?? null,
      baseUrl: input.baseUrl,
      askTurnRunner: input.askTurnRunner,
      executeHiddenAsk: input.executeHiddenAsk ?? Boolean(input.askTurnRunner),
      pressureCheck,
      manualRun: input.manualRun,
      now,
    });
    const continuation = maybeScheduleContinuation({
      now,
      result,
      manualRun: input.manualRun,
      threadId: input.threadId ?? null,
      roomId: input.roomId ?? null,
      environmentId: input.environmentId ?? null,
      jobId: input.jobId ?? null,
    });
    recordContinuationTranscriptRow({
      result,
      continuation,
      now,
    });
    const hasUiHandoffWake = listStagePlayLiveSourceMailWakeRequests({
      threadId: input.threadId ?? null,
      roomId: input.roomId ?? null,
      environmentId: input.environmentId ?? null,
      jobId: input.jobId ?? null,
      limit: 250,
    }).some((wake) => wake.status === "waiting_for_ui_handoff");
    return summarizeWakeState({
      now,
      result,
      runtimeAdmission,
      reason: result?.status === "skipped" && result.skippedReason === "ui_handoff_required"
        ? "wake_ui_handoff_required"
        : result
          ? "wake_admitted"
          : hasUiHandoffWake
            ? "wake_ui_handoff_required"
            : "no_runnable_wake",
      continuation,
      lockState,
    });
  } finally {
    cycleRunning = false;
    cycleStartedAt = null;
  }
}

export function startStagePlayLiveSourceMailWakeService(): boolean {
  if (serviceTimer) return false;
  if (process.env.NODE_ENV === "test") return false;
  if (process.env.STAGE_PLAY_MAIL_WAKE_RUNNER_ENABLED === "0") return false;
  servicePaused = false;
  unsubscribeMailEnqueued = subscribeStagePlayLiveSourceMailEnqueued((event) => {
    requestStagePlayLiveSourceMailWakeRun(event);
  });
  runtimeMemoryGovernor.registerPausableRuntimeTask({
    id: WAKE_SERVICE_RUNTIME_TASK_ID,
    taskClass: "stage_play_refresh",
    priority: 35,
    isPaused: () => servicePaused,
    pause: () => {
      servicePaused = true;
    },
    resume: () => {
      servicePaused = false;
    },
  });
  const intervalMs = readPositiveIntEnv("STAGE_PLAY_MAIL_WAKE_RUNNER_INTERVAL_MS", DEFAULT_WAKE_SERVICE_INTERVAL_MS);
  serviceTimer = setInterval(() => {
    if (servicePaused) return;
    void runStagePlayLiveSourceMailWakeAdmissionCycle().catch((err) => {
      console.warn("[stage-play-mail-wake-service] admission cycle failed", err);
    });
  }, intervalMs);
  serviceTimer.unref?.();
  return true;
}

export function stopStagePlayLiveSourceMailWakeServiceForTest(): void {
  if (serviceTimer) {
    clearInterval(serviceTimer);
  }
  if (immediateRunTimer) {
    clearTimeout(immediateRunTimer);
  }
  unsubscribeMailEnqueued?.();
  unsubscribeMailEnqueued = null;
  immediateRunTimer = null;
  serviceTimer = null;
  cycleRunning = false;
  cycleStartedAt = null;
  servicePaused = false;
  runtimeMemoryGovernor.unregisterPausableRuntimeTask(WAKE_SERVICE_RUNTIME_TASK_ID);
}
