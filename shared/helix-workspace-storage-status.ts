import {
  buildHelixWorkspaceOsAuthority,
  type HelixWorkspaceOsAuthority,
  type HelixWorkspaceOsDiagnosticValue,
} from "./helix-workspace-os-status";
import type {
  HelixWorkspaceMemoryArtifactType,
  HelixWorkspaceMemoryOwnerScope,
  HelixWorkspaceMemoryStorageBackend,
  HelixWorkspaceMemorySyncStatus,
} from "./helix-workspace-memory-registry";

export const HELIX_WORKSPACE_STORAGE_STATUS_SCHEMA =
  "helix.workspace_storage_status.v1" as const;

export type HelixWorkspaceStorageBackend =
  | HelixWorkspaceMemoryStorageBackend
  | "helix_ask_runtime"
  | "replit_app_storage"
  | "browser_estimate"
  | "unknown";

export type HelixWorkspaceStorageOwnerScope =
  | HelixWorkspaceMemoryOwnerScope
  | "thread"
  | "app"
  | "workspace"
  | "unknown";

export type HelixWorkspaceStorageSyncStatus =
  | HelixWorkspaceMemorySyncStatus
  | "not_applicable"
  | "unknown";

export type HelixWorkspaceStorageRecordStatus =
  | "available"
  | "configured_missing"
  | "degraded"
  | "error"
  | "unknown";

export type HelixWorkspaceStorageArtifactType =
  | HelixWorkspaceMemoryArtifactType
  | "active_context_page_file"
  | "browser_storage_key"
  | "profile_storage"
  | "app_storage"
  | "workspace_storage"
  | "unknown";

export interface HelixWorkspaceStorageRecord {
  artifact_id: string;
  label: string;
  artifact_type: HelixWorkspaceStorageArtifactType;
  owner_scope: HelixWorkspaceStorageOwnerScope;
  storage_backend: HelixWorkspaceStorageBackend;
  sync_status: HelixWorkspaceStorageSyncStatus;
  status: HelixWorkspaceStorageRecordStatus;
  path_ref: string;
  storage_key?: string | null;
  profile_id?: string | null;
  chat_session_id?: string | null;
  size_bytes: number | null;
  quota_bytes?: number | null;
  usage_ratio?: number | null;
  approximate: boolean;
  observed: boolean;
  updated_at?: string | null;
  missing_reason?: string | null;
  failure_reason?: string | null;
  diagnostics?: Record<string, HelixWorkspaceOsDiagnosticValue>;
  authority: HelixWorkspaceOsAuthority;
}

export interface HelixWorkspaceStorageSummary {
  artifact_count: number;
  observed_artifact_count: number;
  estimated_artifact_count: number;
  unknown_artifact_count: number;
  total_observed_bytes: number;
  largest_artifact_id: string | null;
  local_storage_bytes: number;
  session_storage_bytes: number;
  profile_storage_bytes: number;
  quota_bytes: number | null;
  usage_ratio: number | null;
  pressure: "normal" | "watch" | "near_limit" | "unknown";
}

export interface HelixWorkspaceStorageStatus {
  schema_version: typeof HELIX_WORKSPACE_STORAGE_STATUS_SCHEMA;
  generated_at: string;
  thread_id?: string | null;
  room_id?: string | null;
  records: HelixWorkspaceStorageRecord[];
  summary: HelixWorkspaceStorageSummary;
  authority: HelixWorkspaceOsAuthority;
}

export const HELIX_WORKSPACE_STORAGE_STATUS_AUTHORITY_REASON =
  "workspace_storage_status_is_diagnostic_only" as const;

export const buildHelixWorkspaceStorageAuthority = (): HelixWorkspaceOsAuthority =>
  buildHelixWorkspaceOsAuthority(HELIX_WORKSPACE_STORAGE_STATUS_AUTHORITY_REASON);

const normalizeByteCount = (value: number | null | undefined): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value);
};

const normalizeRatio = (value: number | null | undefined): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 1000) / 1000;
};

export const withHelixWorkspaceStorageAuthority = <
  T extends Omit<HelixWorkspaceStorageRecord, "authority">,
>(
  record: T,
): T & { authority: HelixWorkspaceOsAuthority } => ({
  ...record,
  size_bytes: normalizeByteCount(record.size_bytes),
  quota_bytes: normalizeByteCount(record.quota_bytes),
  usage_ratio: normalizeRatio(record.usage_ratio),
  authority: buildHelixWorkspaceStorageAuthority(),
});

export const helixWorkspaceStorageSortValue = (
  record: Pick<HelixWorkspaceStorageRecord, "size_bytes">,
): number => record.size_bytes ?? -1;

export const sortHelixWorkspaceStorageRecords = (
  records: readonly HelixWorkspaceStorageRecord[],
): HelixWorkspaceStorageRecord[] =>
  [...records].sort((left, right) => {
    const sizeDelta =
      helixWorkspaceStorageSortValue(right) - helixWorkspaceStorageSortValue(left);
    if (sizeDelta !== 0) return sizeDelta;
    return left.label.localeCompare(right.label);
  });

export const summarizeHelixWorkspaceStorage = (
  records: readonly HelixWorkspaceStorageRecord[],
  quotaBytes?: number | null,
): HelixWorkspaceStorageSummary => {
  const sorted = sortHelixWorkspaceStorageRecords(records);
  const totalObserved = records.reduce((sum, record) => {
    if (!record.observed || record.size_bytes == null) return sum;
    return sum + record.size_bytes;
  }, 0);
  const localStorageBytes = records.reduce((sum, record) => {
    if (record.storage_backend !== "localStorage" || record.size_bytes == null) return sum;
    return sum + record.size_bytes;
  }, 0);
  const sessionStorageBytes = records.reduce((sum, record) => {
    if (record.storage_backend !== "sessionStorage" || record.size_bytes == null) return sum;
    return sum + record.size_bytes;
  }, 0);
  const profileStorageBytes = records.reduce((sum, record) => {
    if (record.storage_backend !== "profile_server" || record.size_bytes == null) return sum;
    return sum + record.size_bytes;
  }, 0);
  const normalizedQuota = normalizeByteCount(quotaBytes);
  const usageRatio =
    normalizedQuota && normalizedQuota > 0
      ? normalizeRatio(totalObserved / normalizedQuota)
      : null;
  const pressure =
    usageRatio == null
      ? "unknown"
      : usageRatio >= 0.9
        ? "near_limit"
        : usageRatio >= 0.7
          ? "watch"
          : "normal";

  return {
    artifact_count: records.length,
    observed_artifact_count: records.filter((record) => record.observed).length,
    estimated_artifact_count: records.filter((record) => record.approximate && record.size_bytes != null).length,
    unknown_artifact_count: records.filter((record) => record.size_bytes == null).length,
    total_observed_bytes: totalObserved,
    largest_artifact_id: sorted[0]?.artifact_id ?? null,
    local_storage_bytes: localStorageBytes,
    session_storage_bytes: sessionStorageBytes,
    profile_storage_bytes: profileStorageBytes,
    quota_bytes: normalizedQuota,
    usage_ratio: usageRatio,
    pressure,
  };
};
