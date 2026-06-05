import type { RuntimeAdmissionDecision } from "../runtime/runtime-memory-governor";
import { runtimeMemoryGovernor } from "../runtime/runtime-memory-governor";
import { listStagePlayLiveSourceJobStates } from "./stage-play-live-source-mailbox-store";
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
let serviceTimer: ReturnType<typeof setInterval> | null = null;
let cycleRunning = false;

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

const summarizeWakeState = (input: {
  now: string;
  result: StagePlayLiveSourceMailWakeResultV1 | null;
  runtimeAdmission: RuntimeAdmissionDecision | null;
  reason?: string;
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

export async function runStagePlayLiveSourceMailWakeAdmissionCycle(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  baseUrl?: string;
  askTurnRunner?: AskWakeTurnRunner;
  now?: string;
  pressureCheck?: StagePlayMailWakePressureCheck | null;
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
      now,
    });
    return summarizeWakeState({
      now,
      result,
      runtimeAdmission,
      reason: result ? "wake_admitted" : "no_runnable_wake",
    });
  } finally {
    cycleRunning = false;
  }
}

export function startStagePlayLiveSourceMailWakeService(): boolean {
  if (serviceTimer) return false;
  if (process.env.NODE_ENV === "test") return false;
  if (process.env.STAGE_PLAY_MAIL_WAKE_RUNNER_ENABLED === "0") return false;
  const intervalMs = readPositiveIntEnv("STAGE_PLAY_MAIL_WAKE_RUNNER_INTERVAL_MS", DEFAULT_WAKE_SERVICE_INTERVAL_MS);
  serviceTimer = setInterval(() => {
    void runStagePlayLiveSourceMailWakeAdmissionCycle().catch((err) => {
      console.warn("[stage-play-mail-wake-service] admission cycle failed", err);
    });
  }, intervalMs);
  serviceTimer.unref?.();
  return true;
}

export function stopStagePlayLiveSourceMailWakeServiceForTest(): void {
  if (!serviceTimer) return;
  clearInterval(serviceTimer);
  serviceTimer = null;
  cycleRunning = false;
}
