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
  result: StagePlayLiveSourceMailWakeResultV1 | null;
  status: "idle" | "queued" | "running" | "completed" | "deferred_for_pressure" | "failed_retryable" | "failed_terminal" | "failed";
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
}): StagePlayLiveSourceMailWakeAdmissionCycleResultV1 => {
  const wakes = listStagePlayLiveSourceMailWakeRequests({ limit: 250 });
  const runnable = listRunnableStagePlayLiveSourceMailWakeRequests({ now: input.now, limit: 250 });
  const running = wakes.filter((wake) => wake.status === "running");
  const deferred = wakes.filter((wake) => wake.status === "deferred_for_pressure");
  const queued = wakes.filter((wake) => wake.status === "queued");
  const status = input.result?.status ??
    (running.length > 0 ? "running" :
      runnable.length > 0 ? "queued" :
        deferred.length > 0 ? "deferred_for_pressure" :
          queued.length > 0 ? "queued" :
            "idle");
  return {
    schema: "stage_play_live_source_mail_wake_admission_cycle/v1",
    now: input.now,
    queuedWakeIds: queued.map((wake) => wake.wakeRequestId),
    runnableWakeIds: runnable.map((wake) => wake.wakeRequestId),
    runningWakeIds: running.map((wake) => wake.wakeRequestId),
    deferredWakeIds: deferred.map((wake) => wake.wakeRequestId),
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
  now?: string;
  pressureCheck?: StagePlayMailWakePressureCheck | null;
  manualRun?: boolean;
} = {}): Promise<StagePlayLiveSourceMailWakeAdmissionCycleResultV1> {
  if (cycleRunning) {
    return summarizeWakeState({
      now: input.now ?? new Date().toISOString(),
      result: null,
      runtimeAdmission: null,
      reason: "wake_cycle_already_running",
    });
  }
  cycleRunning = true;
  const now = input.now ?? new Date().toISOString();
  let runtimeAdmission: RuntimeAdmissionDecision | null = null;
  try {
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
    return summarizeWakeState({
      now,
      result,
      runtimeAdmission,
      reason: result ? "wake_admitted" : "no_runnable_wake",
      continuation,
    });
  } finally {
    cycleRunning = false;
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
  servicePaused = false;
  runtimeMemoryGovernor.unregisterPausableRuntimeTask(WAKE_SERVICE_RUNTIME_TASK_ID);
}
