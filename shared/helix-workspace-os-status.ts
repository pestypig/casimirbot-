export const HELIX_WORKSPACE_OS_STATUS_SCHEMA = "helix.workspace_os.status.v1" as const;

export const HELIX_WORKSPACE_OS_AUTHORITY_REASON =
  "workspace_os_status_is_diagnostic_only" as const;

export type HelixWorkspaceOsSurface =
  | "browser"
  | "clipboard"
  | "keyboard"
  | "screen"
  | "shell"
  | "filesystem"
  | "api"
  | "dev_server"
  | "situation_source"
  | "environment_source"
  | "workstation_action"
  | "runtime_memory"
  | "unknown";

export type HelixWorkspaceOsMode =
  | "read_only"
  | "read_write"
  | "execute"
  | "diagnostic"
  | "unknown";

export type HelixWorkspaceOsCapabilityStatus =
  | "available"
  | "bound"
  | "waiting_for_client"
  | "permission_required"
  | "configured_missing"
  | "stale"
  | "degraded"
  | "blocked"
  | "error"
  | "paused"
  | "stopped"
  | "unknown";

export type HelixWorkspaceOsHealthCheck =
  | "ok"
  | "degraded"
  | "failed"
  | "unknown";

export type HelixWorkspaceOsDiagnosticValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]
  | boolean[];

export interface HelixWorkspaceOsAuthority {
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  terminal_ineligible_reason: string;
}

export interface HelixWorkspaceOsCapabilityRecord {
  capability_id: string;
  surface: HelixWorkspaceOsSurface;
  mode: HelixWorkspaceOsMode;
  status: HelixWorkspaceOsCapabilityStatus;

  label?: string;
  source?: string;
  bound_target?: string | null;

  last_health_check?: HelixWorkspaceOsHealthCheck;
  last_verified_at?: string | null;
  failure_reason?: string | null;
  missing_reason?: string | null;
  next_required_action?: string | null;

  fallbacks?: string[];

  evidence_refs?: string[];
  receipt_refs?: string[];
  diagnostics?: Record<string, HelixWorkspaceOsDiagnosticValue>;

  authority: HelixWorkspaceOsAuthority;
}

export interface HelixWorkspaceOsRuntimeStatus {
  memory_pressure?: string;
  active_task_count?: number;
  queued_task_count?: number;
  paused_background_task_count?: number;
  rejected_task_count?: number;
  notes?: string[];
}

export interface HelixWorkspaceOsStatus {
  schema_version: typeof HELIX_WORKSPACE_OS_STATUS_SCHEMA;
  generated_at: string;
  thread_id?: string | null;
  room_id?: string | null;

  capabilities: HelixWorkspaceOsCapabilityRecord[];
  runtime?: HelixWorkspaceOsRuntimeStatus;

  summary: {
    available_count: number;
    degraded_count: number;
    blocked_count: number;
    error_count: number;
    unknown_count: number;
  };

  authority: HelixWorkspaceOsAuthority;
}

export const buildHelixWorkspaceOsAuthority = (
  terminalIneligibleReason: string = HELIX_WORKSPACE_OS_AUTHORITY_REASON,
): HelixWorkspaceOsAuthority => ({
  assistant_answer: false,
  raw_content_included: false,
  terminal_eligible: false,
  terminal_ineligible_reason: terminalIneligibleReason,
});

export const withHelixWorkspaceOsAuthority = <
  T extends Omit<HelixWorkspaceOsCapabilityRecord, "authority">,
>(
  record: T,
  terminalIneligibleReason: string = HELIX_WORKSPACE_OS_AUTHORITY_REASON,
): T & { authority: HelixWorkspaceOsAuthority } => ({
  ...record,
  authority: buildHelixWorkspaceOsAuthority(terminalIneligibleReason),
});

export const summarizeHelixWorkspaceOsCapabilities = (
  capabilities: readonly HelixWorkspaceOsCapabilityRecord[],
): HelixWorkspaceOsStatus["summary"] => ({
  available_count: capabilities.filter((entry: HelixWorkspaceOsCapabilityRecord) => entry.status === "available" || entry.status === "bound").length,
  degraded_count: capabilities.filter((entry: HelixWorkspaceOsCapabilityRecord) => entry.status === "degraded" || entry.status === "stale" || entry.status === "paused").length,
  blocked_count: capabilities.filter((entry: HelixWorkspaceOsCapabilityRecord) => entry.status === "blocked" || entry.status === "permission_required" || entry.status === "configured_missing" || entry.status === "stopped").length,
  error_count: capabilities.filter((entry: HelixWorkspaceOsCapabilityRecord) => entry.status === "error").length,
  unknown_count: capabilities.filter((entry: HelixWorkspaceOsCapabilityRecord) => entry.status === "unknown").length,
});
