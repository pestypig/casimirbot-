import crypto from "node:crypto";
import {
  HELIX_WORKSTATION_TASK_MANAGER_SCHEMA,
  buildHelixWorkstationTaskManagerAuthority,
  sortHelixWorkstationTaskManagerProcesses,
  summarizeHelixWorkstationTaskManager,
  withHelixWorkstationTaskManagerAuthority,
  type HelixWorkstationTaskManagerProcess,
  type HelixWorkstationTaskManagerProcessStatus,
  type HelixWorkstationTaskManagerSnapshot,
} from "@shared/helix-workstation-task-manager";
import { runtimeMemoryGovernor } from "../runtime/runtime-memory-governor";

const REDACTED = "[redacted]";

const hashShort = (value: unknown, size = 14): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const cleanString = (value: unknown, maxLength = 220): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, `Bearer ${REDACTED}`)
    .replace(/(?:api[_-]?key|token|secret|password)=\S+/gi, `$1=${REDACTED}`)
    .replace(/[A-Za-z0-9._~+/=-]{48,}/g, REDACTED)
    .slice(0, maxLength);
};

const idPart = (value: unknown): string => {
  const cleaned = cleanString(String(value ?? ""), 100);
  if (!cleaned) return "unknown";
  if (/[\\/]/.test(cleaned)) return `hashed_${hashShort(cleaned)}`;
  return cleaned.replace(/[^a-z0-9_.:-]+/gi, "_");
};

const pressureStatus = (pressure: unknown): HelixWorkstationTaskManagerProcessStatus => {
  if (pressure === "hard_pressure") return "blocked";
  if (pressure === "soft_pressure") return "degraded";
  if (pressure === "normal") return "active";
  return "unknown";
};

type RuntimeMemorySnapshot = ReturnType<typeof runtimeMemoryGovernor.getRuntimeMemorySnapshot>;
type RuntimeTaskSnapshot = ReturnType<typeof runtimeMemoryGovernor.getRuntimeTaskSnapshot>;

export type HelixWorkstationTaskManagerReaders = {
  getRuntimeMemorySnapshot: typeof runtimeMemoryGovernor.getRuntimeMemorySnapshot;
  getRuntimeTaskSnapshot: typeof runtimeMemoryGovernor.getRuntimeTaskSnapshot;
  now: () => Date;
};

const DEFAULT_READERS: HelixWorkstationTaskManagerReaders = {
  getRuntimeMemorySnapshot: runtimeMemoryGovernor.getRuntimeMemorySnapshot,
  getRuntimeTaskSnapshot: runtimeMemoryGovernor.getRuntimeTaskSnapshot,
  now: () => new Date(),
};

const buildServerRuntimeProcess = (
  memorySnapshot: RuntimeMemorySnapshot,
  taskSnapshot: RuntimeTaskSnapshot,
  generatedAt: string,
): HelixWorkstationTaskManagerProcess =>
  withHelixWorkstationTaskManagerAuthority({
    process_id: `server.node.${idPart(memorySnapshot.pid)}`,
    label: "Server Node runtime",
    kind: "server_runtime",
    status: pressureStatus(taskSnapshot.pressureLevel),
    source: "runtime_memory_governor",
    updated_at: generatedAt,
    memory: {
      source: "runtime_governor",
      approximate: false,
      observed: true,
      used_mib: taskSnapshot.memory.rssMiB,
      rss_mib: taskSnapshot.memory.rssMiB,
      heap_used_mib: taskSnapshot.memory.heapUsedMiB,
      heap_total_mib: taskSnapshot.memory.heapTotalMiB,
      pressure: taskSnapshot.pressureLevel,
    },
    diagnostics: {
      pid_hash: hashShort(memorySnapshot.pid),
      pressure_level: taskSnapshot.pressureLevel,
      host_free_mib: taskSnapshot.host.freeMiB,
      host_total_mib: taskSnapshot.host.totalMiB,
      host_free_ratio: taskSnapshot.host.freeRatio,
      external_mib: taskSnapshot.memory.externalMiB,
      array_buffers_mib: taskSnapshot.memory.arrayBuffersMiB,
      active_task_count: taskSnapshot.activeTasks.length,
      paused_task_count: taskSnapshot.pausedTasks.length,
    },
  });

const countByTaskClass = <T extends { taskClass: string }>(
  values: readonly T[],
): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value.taskClass, (counts.get(value.taskClass) ?? 0) + 1);
  }
  return counts;
};

const buildTaskClassProcesses = (
  taskSnapshot: RuntimeTaskSnapshot,
  generatedAt: string,
): HelixWorkstationTaskManagerProcess[] => {
  const pausedByClass = countByTaskClass(taskSnapshot.pausedTasks);
  const queuedByClass = new Map<string, number>();
  const rejectedByClass = new Map<string, number>();
  for (const decision of taskSnapshot.recentDecisions) {
    if (decision.action === "queue") {
      queuedByClass.set(decision.taskClass, (queuedByClass.get(decision.taskClass) ?? 0) + 1);
    } else if (!decision.admitted && /^reject_/.test(decision.action)) {
      rejectedByClass.set(decision.taskClass, (rejectedByClass.get(decision.taskClass) ?? 0) + 1);
    }
  }

  return taskSnapshot.classes
    .filter((taskClass) =>
      taskClass.activeCount > 0 ||
      (pausedByClass.get(taskClass.taskClass) ?? 0) > 0 ||
      (queuedByClass.get(taskClass.taskClass) ?? 0) > 0 ||
      taskClass.burstUsed > 0 ||
      typeof taskClass.estimatedBurstMiB === "number" ||
      taskClass.taskClass === "stage_play_refresh"
    )
    .map((taskClass) => {
      const pausedCount = pausedByClass.get(taskClass.taskClass) ?? 0;
      const queuedCount = queuedByClass.get(taskClass.taskClass) ?? 0;
      const rejectedCount = rejectedByClass.get(taskClass.taskClass) ?? 0;
      const status: HelixWorkstationTaskManagerProcessStatus =
        taskClass.activeCount > 0
          ? "active"
          : pausedCount > 0
            ? "paused"
            : queuedCount > 0
              ? "queued"
              : rejectedCount > 0
                ? "blocked"
                : "idle";
      return withHelixWorkstationTaskManagerAuthority({
        process_id: `runtime.task_class.${idPart(taskClass.taskClass)}`,
        label: `Runtime ${taskClass.taskClass.replace(/_/g, " ")}`,
        kind: "runtime_task_class",
        status,
        task_class: taskClass.taskClass,
        source: "runtime_memory_governor",
        updated_at: generatedAt,
        memory: {
          source: "runtime_governor_task_budget",
          approximate: true,
          observed: false,
          estimate_mib: taskClass.estimatedBurstMiB ?? null,
          pressure: taskSnapshot.pressureLevel,
        },
        diagnostics: {
          priority: taskClass.priority,
          deferrable: taskClass.deferrable,
          pausable: taskClass.pausable,
          active_count: taskClass.activeCount,
          paused_count: pausedCount,
          queued_recent_decision_count: queuedCount,
          rejected_recent_decision_count: rejectedCount,
          max_concurrent: taskClass.maxConcurrent,
          burst_limit: taskClass.burstLimit,
          burst_used: taskClass.burstUsed,
          burst_window_ms: taskClass.burstWindowMs,
        },
      });
    });
};

const buildActiveTaskProcesses = (
  taskSnapshot: RuntimeTaskSnapshot,
  generatedAt: string,
): HelixWorkstationTaskManagerProcess[] => {
  const budgetByClass = new Map(taskSnapshot.classes.map((taskClass) => [taskClass.taskClass, taskClass]));
  const nowMs = Date.parse(generatedAt);
  return taskSnapshot.activeTasks.map((task) => {
    const budget = budgetByClass.get(task.taskClass);
    return withHelixWorkstationTaskManagerAuthority({
      process_id: `runtime.task.${hashShort(task.id)}`,
      label: `Active ${task.taskClass.replace(/_/g, " ")}`,
      kind: "runtime_task",
      status: "active",
      task_class: task.taskClass,
      source: "runtime_memory_governor",
      updated_at: generatedAt,
      memory: {
        source: "runtime_governor_task_budget",
        approximate: true,
        observed: false,
        estimate_mib: budget?.estimatedBurstMiB ?? null,
        pressure: taskSnapshot.pressureLevel,
      },
      diagnostics: {
        task_id_hash: hashShort(task.id),
        admitted_age_ms: Number.isFinite(nowMs) ? Math.max(0, nowMs - task.admittedAtMs) : null,
        active_task_memory_is_estimated: true,
      },
    });
  });
};

const buildErrorProcess = (error: unknown, generatedAt: string): HelixWorkstationTaskManagerProcess =>
  withHelixWorkstationTaskManagerAuthority({
    process_id: "workspace_os.task_manager.runtime_reader_error",
    label: "Runtime memory reader",
    kind: "workspace_os",
    status: "degraded",
    source: "workspace_os_task_manager",
    updated_at: generatedAt,
    memory: {
      source: "unknown",
      approximate: true,
      observed: false,
      estimate_mib: null,
      pressure: "unknown",
    },
    diagnostics: {
      failure_reason: cleanString(error instanceof Error ? error.message : String(error)) ?? "runtime_memory_reader_failed",
    },
  });

export async function buildHelixWorkstationTaskManagerSnapshot(
  input: {
    thread_id?: string | null;
    room_id?: string | null;
  },
  readerOverrides: Partial<HelixWorkstationTaskManagerReaders> = {},
): Promise<HelixWorkstationTaskManagerSnapshot> {
  const readers: HelixWorkstationTaskManagerReaders = {
    ...DEFAULT_READERS,
    ...readerOverrides,
  };
  const generatedAt = readers.now().toISOString();
  const processes: HelixWorkstationTaskManagerProcess[] = [];
  let pressureLevel: string | null = null;

  try {
    const memorySnapshot = readers.getRuntimeMemorySnapshot();
    const taskSnapshot = readers.getRuntimeTaskSnapshot();
    pressureLevel = taskSnapshot.pressureLevel;
    processes.push(buildServerRuntimeProcess(memorySnapshot, taskSnapshot, generatedAt));
    processes.push(...buildTaskClassProcesses(taskSnapshot, generatedAt));
    processes.push(...buildActiveTaskProcesses(taskSnapshot, generatedAt));
  } catch (error) {
    processes.push(buildErrorProcess(error, generatedAt));
  }

  const sorted = sortHelixWorkstationTaskManagerProcesses(processes);
  return {
    schema_version: HELIX_WORKSTATION_TASK_MANAGER_SCHEMA,
    generated_at: generatedAt,
    thread_id: input.thread_id ?? null,
    room_id: input.room_id ?? null,
    processes: sorted,
    summary: summarizeHelixWorkstationTaskManager(sorted, pressureLevel),
    authority: buildHelixWorkstationTaskManagerAuthority(),
  };
}

export async function getHelixWorkstationTaskManagerSnapshot(input: {
  thread_id?: string | null;
  room_id?: string | null;
}): Promise<HelixWorkstationTaskManagerSnapshot> {
  return buildHelixWorkstationTaskManagerSnapshot(input);
}

