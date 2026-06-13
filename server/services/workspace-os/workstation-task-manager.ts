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
  type HelixWorkstationBrowserPerformanceSample,
  type HelixWorkstationCommandReliabilityStatus,
} from "@shared/helix-workstation-task-manager";
import { runtimeMemoryGovernor } from "../runtime/runtime-memory-governor";
import {
  getHelixWorkstationCommandReliabilityStatus,
  getLatestHelixWorkstationBrowserPerformanceSample,
} from "./browser-performance-status";

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
  getBrowserPerformanceSample: (now?: Date) => HelixWorkstationBrowserPerformanceSample | null;
  getCommandReliabilityStatus: (now?: Date) => HelixWorkstationCommandReliabilityStatus;
  now: () => Date;
};

const DEFAULT_READERS: HelixWorkstationTaskManagerReaders = {
  getRuntimeMemorySnapshot: runtimeMemoryGovernor.getRuntimeMemorySnapshot,
  getRuntimeTaskSnapshot: runtimeMemoryGovernor.getRuntimeTaskSnapshot,
  getBrowserPerformanceSample: getLatestHelixWorkstationBrowserPerformanceSample,
  getCommandReliabilityStatus: getHelixWorkstationCommandReliabilityStatus,
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

const buildBrowserFrameProcess = (
  sample: HelixWorkstationBrowserPerformanceSample,
): HelixWorkstationTaskManagerProcess =>
  withHelixWorkstationTaskManagerAuthority({
    process_id: "browser.frame_loop",
    label: "UI frame loop",
    kind: "browser_frame_loop",
    status: sample.visibility_state === "hidden"
      ? "hidden"
      : sample.advisory_pressure === "blocked"
        ? "blocked"
        : sample.advisory_pressure === "degraded"
          ? "degraded"
          : sample.advisory_pressure === "normal"
            ? "active"
            : "unknown",
    source: "browser_frame_sampler",
    updated_at: sample.sampled_at,
    memory: {
      source: "browser_frame_sampler",
      approximate: true,
      observed: false,
      estimate_mib: null,
      pressure: sample.advisory_pressure,
    },
    diagnostics: {
      fps: sample.fps,
      average_frame_ms: sample.average_frame_ms,
      p95_frame_ms: sample.p95_frame_ms,
      worst_frame_ms: sample.worst_frame_ms,
      long_frame_count: sample.long_frame_count,
      long_frame_ratio: sample.long_frame_ratio,
      long_task_count: sample.long_task_count,
      long_task_total_ms: sample.long_task_total_ms,
      dom_node_count: sample.dom_node_count,
      open_panel_count: sample.open_panel_count,
      focused_panel_id: sample.focused_panel_id,
      visibility_state: sample.visibility_state,
    },
  });

const buildBrowserInteractionProcess = (
  sample: HelixWorkstationBrowserPerformanceSample,
): HelixWorkstationTaskManagerProcess =>
  withHelixWorkstationTaskManagerAuthority({
    process_id: "browser.interaction_loop",
    label: "UI responsiveness",
    kind: "browser_interaction_loop",
    status: sample.visibility_state === "hidden"
      ? "hidden"
      : sample.responsiveness_pressure === "blocked"
        ? "blocked"
        : sample.responsiveness_pressure === "degraded"
          ? "degraded"
          : sample.responsiveness_pressure === "normal"
            ? "active"
            : "unknown",
    source: "browser_interaction_sampler",
    updated_at: sample.sampled_at,
    memory: {
      source: "browser_interaction_sampler",
      approximate: true,
      observed: false,
      estimate_mib: null,
      pressure: sample.responsiveness_pressure ?? "unknown",
    },
    diagnostics: {
      interaction_event_count: sample.interaction_event_count ?? 0,
      input_delay_p95_ms: sample.input_delay_p95_ms ?? null,
      input_to_next_frame_p95_ms: sample.input_to_next_frame_p95_ms ?? null,
      click_to_next_frame_p95_ms: sample.click_to_next_frame_p95_ms ?? null,
      scroll_jank_count: sample.scroll_jank_count ?? 0,
      drag_jank_count: sample.drag_jank_count ?? 0,
      active_interaction_kind: sample.active_interaction_kind ?? null,
      active_panel_id: sample.active_panel_id ?? null,
      focused_panel_id: sample.focused_panel_id,
    },
  });

const buildCommandReliabilityProcess = (
  status: HelixWorkstationCommandReliabilityStatus,
  generatedAt: string,
): HelixWorkstationTaskManagerProcess | null => {
  if (status.summary.recent_receipt_count === 0) return null;
  return withHelixWorkstationTaskManagerAuthority({
    process_id: "workstation.command_reliability",
    label: "Command reliability",
    kind: "workstation_command_reliability",
    status: status.summary.failed_receipt_count > 0
      ? "degraded"
      : status.summary.in_flight_receipt_count > 0
        ? "active"
        : "idle",
    source: "workstation_command_receipts",
    updated_at: generatedAt,
    memory: {
      source: "workstation_command_receipts",
      approximate: true,
      observed: false,
      estimate_mib: null,
      pressure: status.summary.failed_receipt_count > 0 ? "degraded" : "normal",
    },
    diagnostics: {
      recent_receipt_count: status.summary.recent_receipt_count,
      failed_receipt_count: status.summary.failed_receipt_count,
      in_flight_receipt_count: status.summary.in_flight_receipt_count,
      succeeded_receipt_count: status.summary.succeeded_receipt_count,
      last_command_id: status.summary.last_command_id,
      p95_latency_ms: status.summary.p95_latency_ms,
    },
  });
};

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
  const generatedAtDate = new Date(generatedAt);
  const processes: HelixWorkstationTaskManagerProcess[] = [];
  let pressureLevel: string | null = null;
  let browserPerformance: HelixWorkstationBrowserPerformanceSample | null = null;
  let commandReliability: HelixWorkstationCommandReliabilityStatus | null = null;

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

  try {
    browserPerformance = readers.getBrowserPerformanceSample(generatedAtDate);
    if (browserPerformance) {
      processes.push(buildBrowserFrameProcess(browserPerformance));
      processes.push(buildBrowserInteractionProcess(browserPerformance));
    }
  } catch (error) {
    processes.push(withHelixWorkstationTaskManagerAuthority({
      process_id: "workspace_os.task_manager.browser_reader_error",
      label: "Browser responsiveness reader",
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
        failure_reason: cleanString(error instanceof Error ? error.message : String(error)) ?? "browser_performance_reader_failed",
      },
    }));
  }

  try {
    commandReliability = readers.getCommandReliabilityStatus(generatedAtDate);
    const commandProcess = buildCommandReliabilityProcess(commandReliability, generatedAt);
    if (commandProcess) processes.push(commandProcess);
  } catch (error) {
    processes.push(withHelixWorkstationTaskManagerAuthority({
      process_id: "workspace_os.task_manager.command_reader_error",
      label: "Command receipt reader",
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
        failure_reason: cleanString(error instanceof Error ? error.message : String(error)) ?? "command_receipt_reader_failed",
      },
    }));
  }

  const sorted = sortHelixWorkstationTaskManagerProcesses(processes);
  return {
    schema_version: HELIX_WORKSTATION_TASK_MANAGER_SCHEMA,
    generated_at: generatedAt,
    thread_id: input.thread_id ?? null,
    room_id: input.room_id ?? null,
    processes: sorted,
    summary: summarizeHelixWorkstationTaskManager(sorted, pressureLevel, browserPerformance, commandReliability),
    authority: buildHelixWorkstationTaskManagerAuthority(),
  };
}

export async function getHelixWorkstationTaskManagerSnapshot(input: {
  thread_id?: string | null;
  room_id?: string | null;
}): Promise<HelixWorkstationTaskManagerSnapshot> {
  return buildHelixWorkstationTaskManagerSnapshot(input);
}
