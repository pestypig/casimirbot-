import os from "node:os";
import { randomUUID } from "node:crypto";

export type RuntimeTaskClass =
  | "critical_resident"
  | "active_user_turn"
  | "voice_capture"
  | "voice_stt"
  | "voice_tts"
  | "stage_play_refresh"
  | "situation_room_poll"
  | "debug_export"
  | "repo_indexing";

export type RuntimeAdmissionAction =
  | "admit"
  | "admit_isolated_worker"
  | "queue"
  | "pause_existing_background"
  | "reject_memory_pressure"
  | "reject_runtime_capacity";

export type RuntimePressureLevel = "normal" | "soft_pressure" | "hard_pressure";

export type RuntimeTaskClassPressureSnapshot = {
  taskClass: RuntimeTaskClass;
  pressureLevel: RuntimePressureLevel;
  pressureReason: RuntimeAdmissionDecision["reason"];
  limits: RuntimeAdmissionDecision["limits"];
};

export type RuntimeTaskLease = {
  id: string;
  taskClass: RuntimeTaskClass;
  admittedAtMs: number;
  release: (outcome?: "completed" | "failed" | "rejected" | "aborted") => void;
};

export type RuntimeAdmissionDecision = {
  action: RuntimeAdmissionAction;
  admitted: boolean;
  reason:
    | "ok"
    | "guard_disabled"
    | "heap_used_limit"
    | "rss_limit"
    | "host_memory_limit"
    | "background_paused"
    | "queue_deferrable"
    | "critical_bypass"
    | "local_stage_play_refresh_bypass"
    | "concurrency_limit"
    | "burst_limit";
  pressureLevel: RuntimePressureLevel;
  memory: {
    heapUsedMiB: number;
    heapTotalMiB: number;
    rssMiB: number;
    externalMiB: number;
    arrayBuffersMiB: number;
  };
  host?: {
    freeMiB: number;
    totalMiB: number;
    freeRatio: number;
  };
  limits: {
    maxHeapUsedMiB: number;
    maxRssMiB: number;
    resumeHeapUsedMiB: number;
    resumeRssMiB: number;
  };
  pausedTaskCount: number;
  activeTaskCount: number;
  lease?: RuntimeTaskLease;
};

export type RuntimeMemoryReader = () => NodeJS.MemoryUsage;
export type RuntimeHostMemoryReader = () => {
  freeMiB: number;
  totalMiB: number;
  freeRatio: number;
};

type RuntimeTaskBudget = {
  priority: number;
  deferrable: boolean;
  pausable: boolean;
  maxHeapUsedMiB?: number;
  maxRssMiB?: number;
  estimatedBurstMiB?: number;
  maxConcurrent?: number;
  burstLimit?: number;
  burstWindowMs?: number;
};

type RuntimeAdmissionInput = {
  taskClass: RuntimeTaskClass;
  traceId?: string | null;
  requestBytes?: number;
  actualBytes?: number;
  estimatedExpansionBytes?: number;
  source?: string;
};

type PausableRuntimeTaskRegistration = {
  id: string;
  taskClass: RuntimeTaskClass;
  priority: number;
  isPaused: () => boolean;
  pause: (reason: string) => void | Promise<void>;
  resume: (reason: string) => void | Promise<void>;
};

type ActiveRuntimeTask = {
  id: string;
  taskClass: RuntimeTaskClass;
  admittedAtMs: number;
  releasedAtMs?: number;
  outcome?: "completed" | "failed" | "rejected" | "aborted";
};

type RecentRuntimeDecision = {
  tsMs: number;
  taskClass: RuntimeTaskClass;
  action: RuntimeAdmissionAction;
  admitted: boolean;
  reason: RuntimeAdmissionDecision["reason"];
  pressureLevel: RuntimePressureLevel;
  source?: string;
  traceId?: string | null;
  requestBytes?: number;
  actualBytes?: number;
  estimatedExpansionBytes?: number;
  pausedTaskCount: number;
  activeTaskCount: number;
  memory: RuntimeAdmissionDecision["memory"];
};

type RecentRuntimeCompletion = {
  tsMs: number;
  id: string;
  taskClass: RuntimeTaskClass;
  admittedAtMs: number;
  releasedAtMs: number;
  durationMs: number;
  outcome: "completed" | "failed" | "rejected" | "aborted";
};

const BYTES_PER_MIB = 1024 * 1024;
const RECENT_DECISION_LIMIT = 50;
const RECENT_COMPLETION_LIMIT = 50;
const DEFAULT_BURST_WINDOW_MS = 60_000;
const DEFAULT_ACTIVE_USER_TURN_MAX_HEAP_USED_MIB = 2048;
const DEFAULT_ACTIVE_USER_TURN_MAX_RSS_MIB = 3200;
const DEV_VOICE_STT_MAX_HEAP_USED_MIB = 2048;
const DEV_VOICE_STT_MAX_RSS_MIB = 3200;
const DEV_VOICE_TTS_MAX_HEAP_USED_MIB = 2048;
const DEV_VOICE_TTS_MAX_RSS_MIB = 3200;

const DEFAULT_TASK_BUDGETS: Record<RuntimeTaskClass, RuntimeTaskBudget> = {
  critical_resident: { priority: 100, deferrable: false, pausable: false, maxConcurrent: 16 },
  active_user_turn: {
    priority: 90,
    deferrable: false,
    pausable: false,
    maxHeapUsedMiB: DEFAULT_ACTIVE_USER_TURN_MAX_HEAP_USED_MIB,
    maxRssMiB: DEFAULT_ACTIVE_USER_TURN_MAX_RSS_MIB,
    maxConcurrent: 4,
    burstLimit: 24,
  },
  voice_capture: { priority: 75, deferrable: false, pausable: false, maxConcurrent: 2, burstLimit: 30 },
  voice_stt: {
    priority: 70,
    deferrable: false,
    pausable: false,
    maxHeapUsedMiB: 480,
    maxRssMiB: 900,
    estimatedBurstMiB: 96,
    maxConcurrent: 1,
    burstLimit: 10,
    burstWindowMs: 60_000,
  },
  voice_tts: {
    priority: 65,
    deferrable: false,
    pausable: false,
    maxHeapUsedMiB: 520,
    maxRssMiB: 950,
    estimatedBurstMiB: 64,
    maxConcurrent: 1,
    burstLimit: 12,
    burstWindowMs: 60_000,
  },
  stage_play_refresh: { priority: 35, deferrable: true, pausable: true, maxConcurrent: 1, burstLimit: 4, burstWindowMs: 60_000 },
  situation_room_poll: { priority: 30, deferrable: true, pausable: true, maxConcurrent: 1, burstLimit: 6, burstWindowMs: 60_000 },
  debug_export: { priority: 25, deferrable: true, pausable: false, maxConcurrent: 1, burstLimit: 3, burstWindowMs: 60_000 },
  repo_indexing: { priority: 20, deferrable: true, pausable: true, maxConcurrent: 1, burstLimit: 1, burstWindowMs: 300_000 },
};

const isDevelopmentRuntime = (): boolean => process.env.NODE_ENV === "development";

const resolveDefaultTaskBudget = (taskClass: RuntimeTaskClass): RuntimeTaskBudget => {
  const budget = DEFAULT_TASK_BUDGETS[taskClass];
  if (taskClass === "voice_stt" && isDevelopmentRuntime()) {
    return {
      ...budget,
      maxHeapUsedMiB: DEV_VOICE_STT_MAX_HEAP_USED_MIB,
      maxRssMiB: DEV_VOICE_STT_MAX_RSS_MIB,
    };
  }
  if (taskClass === "voice_tts" && isDevelopmentRuntime()) {
    return {
      ...budget,
      maxHeapUsedMiB: DEV_VOICE_TTS_MAX_HEAP_USED_MIB,
      maxRssMiB: DEV_VOICE_TTS_MAX_RSS_MIB,
    };
  }
  return budget;
};

let memoryReader: RuntimeMemoryReader = () => process.memoryUsage();
let hostMemoryReader: RuntimeHostMemoryReader = () => {
  const totalMiB = os.totalmem() / BYTES_PER_MIB;
  const freeMiB = os.freemem() / BYTES_PER_MIB;
  return {
    freeMiB,
    totalMiB,
    freeRatio: totalMiB > 0 ? freeMiB / totalMiB : 1,
  };
};

const activeTasks = new Map<string, ActiveRuntimeTask>();
const pausableTasks = new Map<string, PausableRuntimeTaskRegistration>();
const pausedTaskIds = new Set<string>();
const recentDecisions: RecentRuntimeDecision[] = [];
const recentCompletions: RecentRuntimeCompletion[] = [];
const admittedTaskStartsByClass = new Map<RuntimeTaskClass, number[]>();

const readPositiveNumberEnv = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const readPositiveIntegerEnv = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const envDisabled = (name: string): boolean => String(process.env[name] ?? "").trim() === "0";

const envEnabled = (name: string): boolean => String(process.env[name] ?? "").trim() === "1";

const roundMiB = (value: number): number => Math.round(value * 10) / 10;

const toMemorySnapshot = (memory: NodeJS.MemoryUsage): RuntimeAdmissionDecision["memory"] => ({
  heapUsedMiB: roundMiB(memory.heapUsed / BYTES_PER_MIB),
  heapTotalMiB: roundMiB(memory.heapTotal / BYTES_PER_MIB),
  rssMiB: roundMiB(memory.rss / BYTES_PER_MIB),
  externalMiB: roundMiB(memory.external / BYTES_PER_MIB),
  arrayBuffersMiB: roundMiB(memory.arrayBuffers / BYTES_PER_MIB),
});

const readLimits = (taskClass: RuntimeTaskClass): RuntimeAdmissionDecision["limits"] => {
  const budget = resolveDefaultTaskBudget(taskClass);
  const taskPrefix = `RUNTIME_TASK_${taskClass.toUpperCase()}`;
  const genericMaxHeap = readPositiveNumberEnv(
    "RUNTIME_MEMORY_MAX_HEAP_USED_MB",
    budget.maxHeapUsedMiB ?? 520,
  );
  const genericMaxRss = readPositiveNumberEnv("RUNTIME_MEMORY_MAX_RSS_MB", budget.maxRssMiB ?? 950);
  const taskMaxHeap = readPositiveNumberEnv(`${taskPrefix}_MAX_HEAP_USED_MB`, genericMaxHeap);
  const taskMaxRss = readPositiveNumberEnv(`${taskPrefix}_MAX_RSS_MB`, genericMaxRss);
  const maxHeapUsedMiB =
    taskClass === "voice_stt"
      ? readPositiveNumberEnv("VOICE_TRANSCRIBE_MAX_HEAP_USED_MB", taskMaxHeap)
      : taskClass === "voice_tts"
        ? readPositiveNumberEnv("VOICE_TTS_MAX_HEAP_USED_MB", taskMaxHeap)
        : taskMaxHeap;
  const maxRssMiB =
    taskClass === "voice_stt"
      ? readPositiveNumberEnv("VOICE_TRANSCRIBE_MAX_RSS_MB", taskMaxRss)
      : taskClass === "voice_tts"
        ? readPositiveNumberEnv("VOICE_TTS_MAX_RSS_MB", taskMaxRss)
        : taskMaxRss;
  const resumeHeapUsedMiB = readPositiveNumberEnv(
    taskClass === "voice_tts" ? "VOICE_TTS_RESUME_HEAP_USED_MB" : `${taskPrefix}_RESUME_HEAP_USED_MB`,
    readPositiveNumberEnv(
      "RUNTIME_MEMORY_RESUME_HEAP_USED_MB",
      Math.floor(maxHeapUsedMiB * 0.85),
    ),
  );
  const resumeRssMiB = readPositiveNumberEnv(
    taskClass === "voice_tts" ? "VOICE_TTS_RESUME_RSS_MB" : `${taskPrefix}_RESUME_RSS_MB`,
    readPositiveNumberEnv(
      "RUNTIME_MEMORY_RESUME_RSS_MB",
      Math.floor(maxRssMiB * 0.85),
    ),
  );
  return {
    maxHeapUsedMiB,
    maxRssMiB,
    resumeHeapUsedMiB,
    resumeRssMiB,
  };
};

const readGuardDisabled = (taskClass: RuntimeTaskClass): boolean => {
  if (taskClass === "voice_stt" && envDisabled("VOICE_TRANSCRIBE_MEMORY_GUARD")) return true;
  return envDisabled("RUNTIME_MEMORY_GUARD");
};

const classifyPressure = (
  memory: RuntimeAdmissionDecision["memory"],
  host: RuntimeAdmissionDecision["host"],
  limits: RuntimeAdmissionDecision["limits"],
): { level: RuntimePressureLevel; reason: RuntimeAdmissionDecision["reason"] } => {
  const hostFreeRatioMin = readPositiveNumberEnv("RUNTIME_MEMORY_HOST_FREE_RATIO_MIN", 0.08);
  const hostFreeRatioSoftMin = readPositiveNumberEnv("RUNTIME_MEMORY_HOST_FREE_RATIO_SOFT_MIN", 0.18);
  if (host && host.freeRatio < hostFreeRatioMin) {
    return { level: "hard_pressure", reason: "host_memory_limit" };
  }
  if (memory.heapUsedMiB >= limits.maxHeapUsedMiB) {
    return { level: "hard_pressure", reason: "heap_used_limit" };
  }
  if (memory.rssMiB >= limits.maxRssMiB) {
    return { level: "hard_pressure", reason: "rss_limit" };
  }
  if (
    memory.heapUsedMiB >= limits.resumeHeapUsedMiB ||
    memory.rssMiB >= limits.resumeRssMiB ||
    (host && host.freeRatio < hostFreeRatioSoftMin)
  ) {
    return { level: "soft_pressure", reason: "ok" };
  }
  return { level: "normal", reason: "ok" };
};

const pushRecentDecision = (
  input: RuntimeAdmissionInput,
  decision: RuntimeAdmissionDecision,
): void => {
  recentDecisions.push({
    tsMs: Date.now(),
    taskClass: input.taskClass,
    action: decision.action,
    admitted: decision.admitted,
    reason: decision.reason,
    pressureLevel: decision.pressureLevel,
    source: input.source,
    traceId: input.traceId ?? null,
    requestBytes: input.requestBytes,
    actualBytes: input.actualBytes,
    estimatedExpansionBytes: input.estimatedExpansionBytes,
    pausedTaskCount: decision.pausedTaskCount,
    activeTaskCount: decision.activeTaskCount,
    memory: decision.memory,
  });
  while (recentDecisions.length > RECENT_DECISION_LIMIT) {
    recentDecisions.shift();
  }
};

const pushRecentCompletion = (task: ActiveRuntimeTask, outcome: RecentRuntimeCompletion["outcome"]): void => {
  const releasedAtMs = Date.now();
  recentCompletions.push({
    tsMs: releasedAtMs,
    id: task.id,
    taskClass: task.taskClass,
    admittedAtMs: task.admittedAtMs,
    releasedAtMs,
    durationMs: Math.max(0, releasedAtMs - task.admittedAtMs),
    outcome,
  });
  while (recentCompletions.length > RECENT_COMPLETION_LIMIT) {
    recentCompletions.shift();
  }
};

const activeTaskCountForClass = (taskClass: RuntimeTaskClass): number =>
  Array.from(activeTasks.values()).filter((task) => task.taskClass === taskClass).length;

const hasActiveForegroundOrVoiceTask = (): boolean =>
  activeTaskCountForClass("active_user_turn") > 0 ||
  activeTaskCountForClass("voice_capture") > 0 ||
  activeTaskCountForClass("voice_stt") > 0 ||
  activeTaskCountForClass("voice_tts") > 0;

const stagePlayLocalPressureBypassAllowed = (
  input: RuntimeAdmissionInput,
  pressure: { level: RuntimePressureLevel; reason: RuntimeAdmissionDecision["reason"] },
): boolean =>
  process.env.NODE_ENV !== "production" &&
  input.taskClass === "stage_play_refresh" &&
  envEnabled("STAGE_PLAY_MAIL_WAKE_PRESSURE_BYPASS_FOR_LOCAL") &&
  pressure.level !== "normal" &&
  pressure.reason !== "host_memory_limit" &&
  !hasActiveForegroundOrVoiceTask();

const readClassConcurrencyLimit = (taskClass: RuntimeTaskClass): number => {
  const budget = resolveDefaultTaskBudget(taskClass);
  return readPositiveIntegerEnv(
    `RUNTIME_TASK_${taskClass.toUpperCase()}_MAX_CONCURRENT`,
    budget.maxConcurrent ?? Number.POSITIVE_INFINITY,
  );
};

const readClassBurstBudget = (taskClass: RuntimeTaskClass): { limit: number; windowMs: number } => {
  const budget = resolveDefaultTaskBudget(taskClass);
  return {
    limit: readPositiveIntegerEnv(
      `RUNTIME_TASK_${taskClass.toUpperCase()}_BURST_LIMIT`,
      budget.burstLimit ?? Number.POSITIVE_INFINITY,
    ),
    windowMs: readPositiveIntegerEnv(
      `RUNTIME_TASK_${taskClass.toUpperCase()}_BURST_WINDOW_MS`,
      budget.burstWindowMs ?? DEFAULT_BURST_WINDOW_MS,
    ),
  };
};

const pruneBurstStarts = (taskClass: RuntimeTaskClass, nowMs: number, windowMs: number): number[] => {
  const starts = admittedTaskStartsByClass.get(taskClass) ?? [];
  const retained = starts.filter((entryMs) => nowMs - entryMs < windowMs);
  admittedTaskStartsByClass.set(taskClass, retained);
  return retained;
};

const recordTaskStart = (taskClass: RuntimeTaskClass, admittedAtMs: number): void => {
  const { windowMs } = readClassBurstBudget(taskClass);
  const starts = pruneBurstStarts(taskClass, admittedAtMs, windowMs);
  starts.push(admittedAtMs);
  admittedTaskStartsByClass.set(taskClass, starts);
};

const readCapacityBlock = (
  taskClass: RuntimeTaskClass,
): { reason: "concurrency_limit" | "burst_limit"; activeForClass: number; limit: number } | null => {
  const concurrencyLimit = readClassConcurrencyLimit(taskClass);
  const activeForClass = activeTaskCountForClass(taskClass);
  if (Number.isFinite(concurrencyLimit) && activeForClass >= concurrencyLimit) {
    return { reason: "concurrency_limit", activeForClass, limit: concurrencyLimit };
  }
  const { limit, windowMs } = readClassBurstBudget(taskClass);
  const recentStarts = pruneBurstStarts(taskClass, Date.now(), windowMs);
  if (Number.isFinite(limit) && recentStarts.length >= limit) {
    return { reason: "burst_limit", activeForClass, limit };
  }
  return null;
};

const capacityActionForTask = (
  taskClass: RuntimeTaskClass,
  budget: RuntimeTaskBudget,
): RuntimeAdmissionAction => {
  if (budget.deferrable) return "queue";
  if (taskClass === "voice_stt" || taskClass === "voice_tts" || taskClass === "voice_capture") {
    return "reject_runtime_capacity";
  }
  return "queue";
};

const buildLease = (taskClass: RuntimeTaskClass): RuntimeTaskLease => {
  const id = `runtime:${taskClass}:${randomUUID()}`;
  const activeTask: ActiveRuntimeTask = {
    id,
    taskClass,
    admittedAtMs: Date.now(),
  };
  activeTasks.set(id, activeTask);
  recordTaskStart(taskClass, activeTask.admittedAtMs);
  let released = false;
  const lease: RuntimeTaskLease = {
    id,
    taskClass,
    admittedAtMs: activeTask.admittedAtMs,
    release: (outcome = "completed") => {
      if (released) return;
      released = true;
      activeTask.releasedAtMs = Date.now();
      activeTask.outcome = outcome;
      pushRecentCompletion(activeTask, outcome);
      activeTasks.delete(id);
      void maybeResumePausedTasks();
    },
  };
  return lease;
};

const pauseLowerPriorityTasks = (
  taskClass: RuntimeTaskClass,
  reason: string,
): number => {
  const currentPriority = DEFAULT_TASK_BUDGETS[taskClass].priority;
  const candidates = Array.from(pausableTasks.values())
    .filter((task) => task.priority < currentPriority && !task.isPaused())
    .sort((a, b) => a.priority - b.priority);
  let paused = 0;
  for (const task of candidates) {
    try {
      void Promise.resolve(task.pause(reason)).catch(() => {
        // Pausable task callbacks must not block foreground admission.
      });
      pausedTaskIds.add(task.id);
      paused += 1;
    } catch {
      // Pausable task callbacks must not block foreground admission.
    }
  }
  return paused;
};

const makeDecision = (
  input: RuntimeAdmissionInput,
  action: RuntimeAdmissionAction,
  admitted: boolean,
  reason: RuntimeAdmissionDecision["reason"],
  pressureLevel: RuntimePressureLevel,
  memory: RuntimeAdmissionDecision["memory"],
  host: RuntimeAdmissionDecision["host"],
  limits: RuntimeAdmissionDecision["limits"],
  lease?: RuntimeTaskLease,
): RuntimeAdmissionDecision => {
  const decision: RuntimeAdmissionDecision = {
    action,
    admitted,
    reason,
    pressureLevel,
    memory,
    host,
    limits,
    pausedTaskCount: pausedTaskIds.size,
    activeTaskCount: activeTasks.size,
    ...(lease ? { lease } : {}),
  };
  pushRecentDecision(input, decision);
  return decision;
};

const taskClasses = (): RuntimeTaskClass[] => Object.keys(DEFAULT_TASK_BUDGETS) as RuntimeTaskClass[];

const buildTaskClassPressureSnapshots = (
  memory: RuntimeAdmissionDecision["memory"],
  host: RuntimeAdmissionDecision["host"],
): RuntimeTaskClassPressureSnapshot[] =>
  taskClasses().map((taskClass) => {
    const limits = readLimits(taskClass);
    const pressure = classifyPressure(memory, host, limits);
    return {
      taskClass,
      pressureLevel: pressure.level,
      pressureReason: pressure.reason,
      limits,
    };
  });

export const getRuntimeMemorySnapshot = () => {
  const memory = toMemorySnapshot(memoryReader());
  const host = hostMemoryReader();
  const headlineTaskClass: RuntimeTaskClass = "active_user_turn";
  const limits = readLimits(headlineTaskClass);
  const pressure = classifyPressure(memory, host, limits);
  const taskClassPressure = buildTaskClassPressureSnapshots(memory, host);
  return {
    schema: "casimir.runtime_memory.v1",
    pid: process.pid,
    memory,
    host: {
      freeMiB: roundMiB(host.freeMiB),
      totalMiB: roundMiB(host.totalMiB),
      freeRatio: Math.round(host.freeRatio * 1000) / 1000,
    },
    pressureLevel: pressure.level,
    pressureReason: pressure.reason,
    pressureBasis: {
      taskClass: headlineTaskClass,
      reason: "headline_pressure_uses_active_user_turn_budget",
    },
    taskClassPressure,
    activeTasks: Array.from(activeTasks.values()).map((task) => ({
      id: task.id,
      taskClass: task.taskClass,
      admittedAtMs: task.admittedAtMs,
    })),
    pausedTasks: Array.from(pausedTaskIds)
      .map((id) => pausableTasks.get(id))
      .filter((task): task is PausableRuntimeTaskRegistration => Boolean(task))
      .map((task) => ({
        id: task.id,
        taskClass: task.taskClass,
        priority: task.priority,
      })),
    recentDecisions: recentDecisions.slice(-RECENT_DECISION_LIMIT),
    limits,
  };
};

export const getRuntimeTaskSnapshot = () => {
  const memorySnapshot = getRuntimeMemorySnapshot();
  const nowMs = Date.now();
  const classes = taskClasses().map((taskClass) => {
    const budget = resolveDefaultTaskBudget(taskClass);
    const burst = readClassBurstBudget(taskClass);
    const starts = pruneBurstStarts(taskClass, nowMs, burst.windowMs);
    return {
      taskClass,
      priority: budget.priority,
      deferrable: budget.deferrable,
      pausable: budget.pausable,
      maxConcurrent: readClassConcurrencyLimit(taskClass),
      activeCount: activeTaskCountForClass(taskClass),
      burstLimit: burst.limit,
      burstWindowMs: burst.windowMs,
      burstUsed: starts.length,
      estimatedBurstMiB: budget.estimatedBurstMiB ?? null,
    };
  });
  return {
    schema: "casimir.runtime_tasks.v1",
    pid: process.pid,
    pressureLevel: memorySnapshot.pressureLevel,
    memory: memorySnapshot.memory,
    host: memorySnapshot.host,
    activeTasks: memorySnapshot.activeTasks,
    pausedTasks: memorySnapshot.pausedTasks,
    registeredPausableTasks: Array.from(pausableTasks.values()).map((task) => ({
      id: task.id,
      taskClass: task.taskClass,
      priority: task.priority,
      paused: task.isPaused(),
    })),
    classes,
    recentDecisions: recentDecisions.slice(-RECENT_DECISION_LIMIT),
    recentCompletions: recentCompletions.slice(-RECENT_COMPLETION_LIMIT),
  };
};

export const maybeResumePausedTasks = async (): Promise<number> => {
  if (pausedTaskIds.size === 0) return 0;
  const memory = toMemorySnapshot(memoryReader());
  const limits = readLimits("voice_stt");
  if (memory.heapUsedMiB > limits.resumeHeapUsedMiB || memory.rssMiB > limits.resumeRssMiB) {
    return 0;
  }
  const candidates = Array.from(pausedTaskIds)
    .map((id) => pausableTasks.get(id))
    .filter((task): task is PausableRuntimeTaskRegistration => Boolean(task))
    .sort((a, b) => b.priority - a.priority);
  let resumed = 0;
  for (const task of candidates) {
    try {
      await task.resume("runtime_memory_recovered");
      pausedTaskIds.delete(task.id);
      resumed += 1;
    } catch {
      // Keep failed resume candidates registered for a later retry.
    }
  }
  return resumed;
};

export const admitRuntimeTask = (
  input: RuntimeAdmissionInput,
): RuntimeAdmissionDecision => {
  void maybeResumePausedTasks();
  const memory = toMemorySnapshot(memoryReader());
  const host = hostMemoryReader();
  const limits = readLimits(input.taskClass);
  const pressure = classifyPressure(memory, host, limits);
  const budget = DEFAULT_TASK_BUDGETS[input.taskClass];

  if (readGuardDisabled(input.taskClass)) {
    const lease = buildLease(input.taskClass);
    return makeDecision(input, "admit", true, "guard_disabled", pressure.level, memory, host, limits, lease);
  }

  if (input.taskClass === "critical_resident") {
    const lease = buildLease(input.taskClass);
    return makeDecision(input, "admit", true, "critical_bypass", pressure.level, memory, host, limits, lease);
  }

  const capacityBlock = readCapacityBlock(input.taskClass);
  if (capacityBlock) {
    return makeDecision(
      input,
      capacityActionForTask(input.taskClass, budget),
      false,
      capacityBlock.reason,
      pressure.level,
      memory,
      host,
      limits,
    );
  }

  if (pressure.level === "normal") {
    const lease = buildLease(input.taskClass);
    return makeDecision(input, "admit", true, "ok", pressure.level, memory, host, limits, lease);
  }

  if (input.taskClass === "active_user_turn" && pressure.level === "soft_pressure") {
    const paused = pauseLowerPriorityTasks(input.taskClass, "runtime_memory_soft_pressure");
    const recheckMemory = toMemorySnapshot(memoryReader());
    const recheckHost = hostMemoryReader();
    const recheckPressure = classifyPressure(recheckMemory, recheckHost, limits);
    if (recheckPressure.level !== "hard_pressure") {
      const lease = buildLease(input.taskClass);
      return makeDecision(
        input,
        paused > 0 ? "pause_existing_background" : "admit",
        true,
        paused > 0 ? "background_paused" : "ok",
        recheckPressure.level,
        recheckMemory,
        recheckHost,
        limits,
        lease,
      );
    }
    return makeDecision(
      input,
      "reject_memory_pressure",
      false,
      recheckPressure.reason === "ok" ? "rss_limit" : recheckPressure.reason,
      recheckPressure.level,
      recheckMemory,
      recheckHost,
      limits,
    );
  }

  if (stagePlayLocalPressureBypassAllowed(input, pressure)) {
    const lease = buildLease(input.taskClass);
    return makeDecision(
      input,
      "admit",
      true,
      "local_stage_play_refresh_bypass",
      pressure.level,
      memory,
      host,
      limits,
      lease,
    );
  }

  if (budget.deferrable) {
    return makeDecision(input, "queue", false, "queue_deferrable", pressure.level, memory, host, limits);
  }

  if (input.taskClass === "voice_stt" && pressure.level === "soft_pressure") {
    const paused = pauseLowerPriorityTasks(input.taskClass, "runtime_memory_soft_pressure");
    const recheckMemory = toMemorySnapshot(memoryReader());
    const recheckHost = hostMemoryReader();
    const recheckPressure = classifyPressure(recheckMemory, recheckHost, limits);
    if (recheckPressure.level !== "hard_pressure") {
      const lease = buildLease(input.taskClass);
      return makeDecision(
        input,
        paused > 0 ? "pause_existing_background" : "admit",
        true,
        paused > 0 ? "background_paused" : "ok",
        recheckPressure.level,
        recheckMemory,
        recheckHost,
        limits,
        lease,
      );
    }
  }

  return makeDecision(
    input,
    "reject_memory_pressure",
    false,
    pressure.reason === "ok" ? "heap_used_limit" : pressure.reason,
    pressure.level,
    memory,
    host,
    limits,
  );
};

export const recheckRuntimeTask = (
  lease: RuntimeTaskLease | undefined,
  input: RuntimeAdmissionInput,
): RuntimeAdmissionDecision => {
  const memory = toMemorySnapshot(memoryReader());
  const host = hostMemoryReader();
  const limits = readLimits(input.taskClass);
  const pressure = classifyPressure(memory, host, limits);
  if (readGuardDisabled(input.taskClass)) {
    return makeDecision(input, "admit", true, "guard_disabled", pressure.level, memory, host, limits, lease);
  }
  if (input.taskClass === "critical_resident" || input.taskClass === "active_user_turn") {
    return makeDecision(input, "admit", true, "ok", pressure.level, memory, host, limits, lease);
  }
  const budget = DEFAULT_TASK_BUDGETS[input.taskClass];
  if (!lease) {
    const capacityBlock = readCapacityBlock(input.taskClass);
    if (capacityBlock) {
      return makeDecision(
        input,
        capacityActionForTask(input.taskClass, budget),
        false,
        capacityBlock.reason,
        pressure.level,
        memory,
        host,
        limits,
      );
    }
  }
  if (pressure.level === "hard_pressure") {
    lease?.release("rejected");
    return makeDecision(
      input,
      "reject_memory_pressure",
      false,
      pressure.reason === "ok" ? "heap_used_limit" : pressure.reason,
      pressure.level,
      memory,
      host,
      limits,
    );
  }
  return makeDecision(input, "admit", true, "ok", pressure.level, memory, host, limits, lease);
};

export const registerPausableRuntimeTask = (task: PausableRuntimeTaskRegistration): void => {
  pausableTasks.set(task.id, task);
};

export const unregisterPausableRuntimeTask = (id: string): void => {
  pausableTasks.delete(id);
  pausedTaskIds.delete(id);
};

export const resetRuntimeMemoryGovernorForTests = (options?: {
  memoryReader?: RuntimeMemoryReader;
  hostMemoryReader?: RuntimeHostMemoryReader;
}): void => {
  activeTasks.clear();
  pausableTasks.clear();
  pausedTaskIds.clear();
  recentDecisions.length = 0;
  recentCompletions.length = 0;
  admittedTaskStartsByClass.clear();
  memoryReader = options?.memoryReader ?? (() => process.memoryUsage());
  hostMemoryReader = options?.hostMemoryReader ?? (() => {
    const totalMiB = os.totalmem() / BYTES_PER_MIB;
    const freeMiB = os.freemem() / BYTES_PER_MIB;
    return {
      freeMiB,
      totalMiB,
      freeRatio: totalMiB > 0 ? freeMiB / totalMiB : 1,
    };
  });
};

export const runtimeMemoryGovernor = {
  admitRuntimeTask,
  recheckRuntimeTask,
  registerPausableRuntimeTask,
  unregisterPausableRuntimeTask,
  maybeResumePausedTasks,
  getRuntimeMemorySnapshot,
  getRuntimeTaskSnapshot,
  resetRuntimeMemoryGovernorForTests,
};
