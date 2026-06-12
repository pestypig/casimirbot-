import {
  buildHelixWorkspaceOsAuthority,
  type HelixWorkspaceOsAuthority,
  type HelixWorkspaceOsDiagnosticValue,
} from "./helix-workspace-os-status";

export const HELIX_WORKSTATION_TASK_MANAGER_SCHEMA =
  "helix.workstation_task_manager.v1" as const;

export type HelixWorkstationTaskManagerProcessKind =
  | "server_runtime"
  | "runtime_task"
  | "runtime_task_class"
  | "browser_renderer"
  | "workstation_panel"
  | "stage_play_packet_flow"
  | "workspace_os"
  | "unknown";

export type HelixWorkstationTaskManagerProcessStatus =
  | "active"
  | "open"
  | "focused"
  | "idle"
  | "queued"
  | "paused"
  | "blocked"
  | "degraded"
  | "unknown";

export type HelixWorkstationTaskManagerMemorySource =
  | "runtime_governor"
  | "runtime_governor_task_budget"
  | "browser_performance_memory"
  | "browser_panel_registry"
  | "stage_play_panel_projection"
  | "workspace_os_status"
  | "unknown";

export interface HelixWorkstationTaskManagerMemorySample {
  source: HelixWorkstationTaskManagerMemorySource;
  approximate: boolean;
  observed: boolean;
  used_mib?: number | null;
  rss_mib?: number | null;
  heap_used_mib?: number | null;
  heap_total_mib?: number | null;
  heap_limit_mib?: number | null;
  estimate_mib?: number | null;
  pressure?: string | null;
}

export interface HelixWorkstationTaskManagerProcess {
  process_id: string;
  label: string;
  kind: HelixWorkstationTaskManagerProcessKind;
  status: HelixWorkstationTaskManagerProcessStatus;
  panel_id?: string | null;
  task_class?: string | null;
  source?: string | null;
  updated_at?: string | null;
  memory: HelixWorkstationTaskManagerMemorySample;
  diagnostics?: Record<string, HelixWorkspaceOsDiagnosticValue>;
  authority: HelixWorkspaceOsAuthority;
}

export interface HelixWorkstationTaskManagerSummary {
  process_count: number;
  observed_process_count: number;
  estimated_process_count: number;
  unknown_process_count: number;
  total_observed_mib: number;
  highest_process_id: string | null;
  pressure_level?: string | null;
  browser_sample_included: boolean;
  server_sample_included: boolean;
}

export interface HelixWorkstationTaskManagerSnapshot {
  schema_version: typeof HELIX_WORKSTATION_TASK_MANAGER_SCHEMA;
  generated_at: string;
  thread_id?: string | null;
  room_id?: string | null;
  processes: HelixWorkstationTaskManagerProcess[];
  summary: HelixWorkstationTaskManagerSummary;
  authority: HelixWorkspaceOsAuthority;
}

export const HELIX_WORKSTATION_TASK_MANAGER_AUTHORITY_REASON =
  "workstation_task_manager_status_is_diagnostic_only" as const;

export const buildHelixWorkstationTaskManagerAuthority = (): HelixWorkspaceOsAuthority =>
  buildHelixWorkspaceOsAuthority(HELIX_WORKSTATION_TASK_MANAGER_AUTHORITY_REASON);

const roundMiB = (value: number | null | undefined): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.round(value * 10) / 10;
};

export const normalizeHelixWorkstationTaskMemory = (
  memory: HelixWorkstationTaskManagerMemorySample,
): HelixWorkstationTaskManagerMemorySample => ({
  ...memory,
  used_mib: roundMiB(memory.used_mib),
  rss_mib: roundMiB(memory.rss_mib),
  heap_used_mib: roundMiB(memory.heap_used_mib),
  heap_total_mib: roundMiB(memory.heap_total_mib),
  heap_limit_mib: roundMiB(memory.heap_limit_mib),
  estimate_mib: roundMiB(memory.estimate_mib),
});

export const helixWorkstationTaskMemorySortValue = (
  process: Pick<HelixWorkstationTaskManagerProcess, "memory">,
): number => {
  const memory = process.memory;
  return (
    memory.used_mib ??
    memory.rss_mib ??
    memory.heap_used_mib ??
    memory.estimate_mib ??
    -1
  );
};

export const withHelixWorkstationTaskManagerAuthority = <
  T extends Omit<HelixWorkstationTaskManagerProcess, "authority">,
>(
  process: T,
): T & { authority: HelixWorkspaceOsAuthority } => ({
  ...process,
  memory: normalizeHelixWorkstationTaskMemory(process.memory),
  authority: buildHelixWorkstationTaskManagerAuthority(),
});

export const sortHelixWorkstationTaskManagerProcesses = (
  processes: readonly HelixWorkstationTaskManagerProcess[],
): HelixWorkstationTaskManagerProcess[] =>
  [...processes].sort((left, right) => {
    if (left.memory.observed !== right.memory.observed) {
      return right.memory.observed ? 1 : -1;
    }
    const memoryDelta =
      helixWorkstationTaskMemorySortValue(right) -
      helixWorkstationTaskMemorySortValue(left);
    if (memoryDelta !== 0) return memoryDelta;
    return left.label.localeCompare(right.label);
  });

export const summarizeHelixWorkstationTaskManager = (
  processes: readonly HelixWorkstationTaskManagerProcess[],
  pressureLevel?: string | null,
): HelixWorkstationTaskManagerSummary => {
  const sorted = sortHelixWorkstationTaskManagerProcesses(processes);
  const totalObserved = processes.reduce((sum, process) => {
    if (!process.memory.observed) return sum;
    return sum + (process.memory.used_mib ?? process.memory.rss_mib ?? process.memory.heap_used_mib ?? 0);
  }, 0);
  return {
    process_count: processes.length,
    observed_process_count: processes.filter((process) => process.memory.observed).length,
    estimated_process_count: processes.filter((process) => !process.memory.observed && process.memory.estimate_mib != null).length,
    unknown_process_count: processes.filter((process) => !process.memory.observed && process.memory.estimate_mib == null).length,
    total_observed_mib: roundMiB(totalObserved) ?? 0,
    highest_process_id: sorted[0]?.process_id ?? null,
    pressure_level: pressureLevel ?? null,
    browser_sample_included: processes.some((process) => process.memory.source === "browser_performance_memory"),
    server_sample_included: processes.some((process) => process.memory.source === "runtime_governor"),
  };
};
