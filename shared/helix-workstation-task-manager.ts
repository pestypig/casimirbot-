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
  | "browser_frame_loop"
  | "browser_interaction_loop"
  | "workstation_command_reliability"
  | "workstation_panel"
  | "stage_play_packet_flow"
  | "workspace_os"
  | "unknown";

export type HelixWorkstationTaskManagerProcessStatus =
  | "active"
  | "open"
  | "focused"
  | "background"
  | "hidden"
  | "idle"
  | "queued"
  | "paused"
  | "suspended"
  | "deload_candidate"
  | "blocked"
  | "degraded"
  | "unknown";

export type HelixWorkstationTaskManagerMemorySource =
  | "runtime_governor"
  | "runtime_governor_task_budget"
  | "browser_performance_memory"
  | "browser_frame_sampler"
  | "browser_interaction_sampler"
  | "workstation_command_receipts"
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

export type HelixWorkstationUiFramePressure =
  | "normal"
  | "degraded"
  | "blocked"
  | "unknown";

export type HelixWorkstationInteractionKind =
  | "click"
  | "scroll"
  | "panel_drag"
  | "panel_resize"
  | "pointer"
  | "keyboard"
  | "unknown";

export interface HelixWorkstationBrowserPerformanceSample {
  schema_version: "helix.workstation_browser_performance.v1";
  sampled_at: string;
  window_ms: number;
  fps: number | null;
  average_frame_ms: number | null;
  p95_frame_ms: number | null;
  worst_frame_ms: number | null;
  long_frame_count: number;
  long_frame_ratio: number | null;
  long_task_count: number;
  long_task_total_ms: number;
  dom_node_count: number;
  open_panel_count: number;
  focused_panel_id: string | null;
  visibility_state: "visible" | "hidden" | "prerender" | "unloaded" | "unknown";
  advisory_pressure: HelixWorkstationUiFramePressure;
  interaction_event_count?: number;
  input_delay_p95_ms?: number | null;
  input_to_next_frame_p95_ms?: number | null;
  click_to_next_frame_p95_ms?: number | null;
  scroll_jank_count?: number;
  drag_jank_count?: number;
  active_interaction_kind?: HelixWorkstationInteractionKind | null;
  active_panel_id?: string | null;
  responsiveness_pressure?: HelixWorkstationUiFramePressure;
  authority: HelixWorkspaceOsAuthority;
}

export const HELIX_WORKSTATION_COMMAND_RECEIPT_SCHEMA =
  "helix.workstation_command_receipt.v1" as const;

export const HELIX_WORKSTATION_COMMAND_RELIABILITY_SCHEMA =
  "helix.workstation_command_reliability.v1" as const;

export type HelixWorkstationCommandReceiptStage =
  | "interaction_received"
  | "request_started"
  | "request_succeeded"
  | "request_failed"
  | "clipboard_write_succeeded"
  | "clipboard_write_failed";

export type HelixWorkstationCommandReceiptStatus =
  | "received"
  | "in_flight"
  | "succeeded"
  | "failed"
  | "unknown";

export interface HelixWorkstationCommandReceipt {
  schema_version: typeof HELIX_WORKSTATION_COMMAND_RECEIPT_SCHEMA;
  receipt_id: string;
  command_id: string;
  command_family: string;
  stage: HelixWorkstationCommandReceiptStage;
  status: HelixWorkstationCommandReceiptStatus;
  occurred_at: string;
  panel_id?: string | null;
  latency_ms?: number | null;
  failure_reason?: string | null;
  authority: HelixWorkspaceOsAuthority;
}

export interface HelixWorkstationCommandReliabilityStatus {
  schema_version: typeof HELIX_WORKSTATION_COMMAND_RELIABILITY_SCHEMA;
  generated_at: string;
  window_ms: number;
  receipts: HelixWorkstationCommandReceipt[];
  summary: {
    recent_receipt_count: number;
    failed_receipt_count: number;
    in_flight_receipt_count: number;
    succeeded_receipt_count: number;
    last_command_id: string | null;
    p95_latency_ms: number | null;
  };
  authority: HelixWorkspaceOsAuthority;
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
  ui_fps?: number | null;
  ui_p95_frame_ms?: number | null;
  ui_long_frame_count?: number;
  ui_advisory_pressure?: HelixWorkstationUiFramePressure | null;
  ui_responsiveness_pressure?: HelixWorkstationUiFramePressure | null;
  ui_input_to_next_frame_p95_ms?: number | null;
  command_recent_receipt_count?: number;
  command_failed_receipt_count?: number;
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

export const withHelixWorkstationBrowserPerformanceAuthority = <
  T extends Omit<HelixWorkstationBrowserPerformanceSample, "authority">,
>(
  sample: T,
): T & { authority: HelixWorkspaceOsAuthority } => ({
  ...sample,
  authority: buildHelixWorkstationTaskManagerAuthority(),
});

export const withHelixWorkstationCommandReceiptAuthority = <
  T extends Omit<HelixWorkstationCommandReceipt, "authority">,
>(
  receipt: T,
): T & { authority: HelixWorkspaceOsAuthority } => ({
  ...receipt,
  authority: buildHelixWorkstationTaskManagerAuthority(),
});

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
  browserPerformance?: HelixWorkstationBrowserPerformanceSample | null,
  commandReliability?: HelixWorkstationCommandReliabilityStatus | null,
): HelixWorkstationTaskManagerSummary => {
  const sorted = sortHelixWorkstationTaskManagerProcesses(processes);
  const totalObserved = processes.reduce((sum: number, process: HelixWorkstationTaskManagerProcess) => {
    if (!process.memory.observed) return sum;
    return sum + (process.memory.used_mib ?? process.memory.rss_mib ?? process.memory.heap_used_mib ?? 0);
  }, 0);
  return {
    process_count: processes.length,
    observed_process_count: processes.filter((process: HelixWorkstationTaskManagerProcess) => process.memory.observed).length,
    estimated_process_count: processes.filter((process: HelixWorkstationTaskManagerProcess) => !process.memory.observed && process.memory.estimate_mib != null).length,
    unknown_process_count: processes.filter((process: HelixWorkstationTaskManagerProcess) => !process.memory.observed && process.memory.estimate_mib == null).length,
    total_observed_mib: roundMiB(totalObserved) ?? 0,
    highest_process_id: sorted[0]?.process_id ?? null,
    pressure_level: pressureLevel ?? null,
    ui_fps: browserPerformance?.fps ?? null,
    ui_p95_frame_ms: browserPerformance?.p95_frame_ms ?? null,
    ui_long_frame_count: browserPerformance?.long_frame_count ?? 0,
    ui_advisory_pressure: browserPerformance?.advisory_pressure ?? null,
    ui_responsiveness_pressure: browserPerformance?.responsiveness_pressure ?? null,
    ui_input_to_next_frame_p95_ms: browserPerformance?.input_to_next_frame_p95_ms ?? null,
    command_recent_receipt_count: commandReliability?.summary.recent_receipt_count ?? 0,
    command_failed_receipt_count: commandReliability?.summary.failed_receipt_count ?? 0,
    browser_sample_included: processes.some((process: HelixWorkstationTaskManagerProcess) =>
      process.memory.source === "browser_performance_memory" ||
      process.memory.source === "browser_frame_sampler" ||
      process.memory.source === "browser_interaction_sampler"
    ),
    server_sample_included: processes.some((process: HelixWorkstationTaskManagerProcess) => process.memory.source === "runtime_governor"),
  };
};
