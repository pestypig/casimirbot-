import {
  HELIX_WORKSPACE_STORAGE_STATUS_SCHEMA,
  buildHelixWorkspaceStorageAuthority,
  sortHelixWorkspaceStorageRecords,
  summarizeHelixWorkspaceStorage,
  withHelixWorkspaceStorageAuthority,
  type HelixWorkspaceStorageRecord,
  type HelixWorkspaceStorageStatus,
} from "@shared/helix-workspace-storage-status";

const parseBytes = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed);
};

export type HelixWorkspaceStorageReaders = {
  now: () => Date;
  env: Record<string, string | undefined>;
};

const DEFAULT_READERS: HelixWorkspaceStorageReaders = {
  now: () => new Date(),
  env: process.env,
};

const makeRecord = (
  record: Omit<HelixWorkspaceStorageRecord, "authority">,
): HelixWorkspaceStorageRecord => withHelixWorkspaceStorageAuthority(record);

const configuredQuota = (
  env: Record<string, string | undefined>,
  ...keys: string[]
): number | null => {
  for (const key of keys) {
    const parsed = parseBytes(env[key]);
    if (parsed != null) return parsed;
  }
  return null;
};

export async function buildHelixWorkspaceStorageStatus(
  input: {
    thread_id?: string | null;
    room_id?: string | null;
  },
  readerOverrides: Partial<HelixWorkspaceStorageReaders> = {},
): Promise<HelixWorkspaceStorageStatus> {
  const readers: HelixWorkspaceStorageReaders = {
    ...DEFAULT_READERS,
    ...readerOverrides,
  };
  const generatedAt = readers.now().toISOString();
  const browserLocalQuota = configuredQuota(
    readers.env,
    "WORKSPACE_BROWSER_LOCAL_STORAGE_SOFT_LIMIT_BYTES",
  );
  const browserSessionQuota = configuredQuota(
    readers.env,
    "WORKSPACE_BROWSER_SESSION_STORAGE_SOFT_LIMIT_BYTES",
  );
  const profileQuota = configuredQuota(
    readers.env,
    "WORKSPACE_PROFILE_STORAGE_QUOTA_BYTES",
    "WORKSPACE_USER_STORAGE_QUOTA_BYTES",
  );
  const appStorageQuota = configuredQuota(
    readers.env,
    "WORKSPACE_APP_STORAGE_QUOTA_BYTES",
    "REPLIT_APP_STORAGE_QUOTA_BYTES",
  );

  const records: HelixWorkspaceStorageRecord[] = [
    makeRecord({
      artifact_id: "browser.localStorage",
      label: "Browser localStorage",
      artifact_type: "browser_storage_key",
      owner_scope: "browser_guest",
      storage_backend: "localStorage",
      sync_status: "local_only",
      status: "unknown",
      path_ref: "browser://localStorage",
      storage_key: null,
      profile_id: null,
      chat_session_id: null,
      size_bytes: null,
      quota_bytes: browserLocalQuota,
      usage_ratio: null,
      approximate: true,
      observed: false,
      updated_at: generatedAt,
      missing_reason: "browser_storage_sizes_are_measured_by_client_panel",
      diagnostics: {
        raw_value_included: false,
        filesystem_scan_included: false,
      },
    }),
    makeRecord({
      artifact_id: "browser.sessionStorage",
      label: "Browser sessionStorage",
      artifact_type: "browser_storage_key",
      owner_scope: "surface_session_only",
      storage_backend: "sessionStorage",
      sync_status: "local_only",
      status: "unknown",
      path_ref: "browser://sessionStorage",
      storage_key: null,
      profile_id: null,
      chat_session_id: null,
      size_bytes: null,
      quota_bytes: browserSessionQuota,
      usage_ratio: null,
      approximate: true,
      observed: false,
      updated_at: generatedAt,
      missing_reason: "browser_storage_sizes_are_measured_by_client_panel",
      diagnostics: {
        raw_value_included: false,
        filesystem_scan_included: false,
      },
    }),
    makeRecord({
      artifact_id: "profile.server",
      label: "Profile server storage",
      artifact_type: "profile_storage",
      owner_scope: "profile",
      storage_backend: "profile_server",
      sync_status: "unknown",
      status: "unknown",
      path_ref: "profile://current",
      storage_key: null,
      profile_id: null,
      chat_session_id: null,
      size_bytes: null,
      quota_bytes: profileQuota,
      usage_ratio: null,
      approximate: true,
      observed: false,
      updated_at: generatedAt,
      missing_reason: "no_existing_profile_storage_size_accessor",
      diagnostics: {
        raw_profile_content_included: false,
        quota_source: profileQuota == null ? "not_configured" : "environment",
      },
    }),
    makeRecord({
      artifact_id: "replit.app_storage",
      label: "Replit App Storage",
      artifact_type: "app_storage",
      owner_scope: "app",
      storage_backend: "replit_app_storage",
      sync_status: "not_applicable",
      status: "unknown",
      path_ref: "replit://app-storage",
      storage_key: null,
      profile_id: null,
      chat_session_id: null,
      size_bytes: null,
      quota_bytes: appStorageQuota,
      usage_ratio: null,
      approximate: true,
      observed: false,
      updated_at: generatedAt,
      missing_reason: "no_existing_replit_app_storage_usage_accessor",
      diagnostics: {
        raw_object_content_included: false,
        quota_source: appStorageQuota == null ? "not_configured" : "environment",
      },
    }),
  ];

  const sorted = sortHelixWorkspaceStorageRecords(records);
  return {
    schema_version: HELIX_WORKSPACE_STORAGE_STATUS_SCHEMA,
    generated_at: generatedAt,
    thread_id: input.thread_id ?? null,
    room_id: input.room_id ?? null,
    records: sorted,
    summary: summarizeHelixWorkspaceStorage(sorted, profileQuota ?? appStorageQuota ?? browserLocalQuota),
    authority: buildHelixWorkspaceStorageAuthority(),
  };
}

export async function getHelixWorkspaceStorageStatus(input: {
  thread_id?: string | null;
  room_id?: string | null;
}): Promise<HelixWorkspaceStorageStatus> {
  return buildHelixWorkspaceStorageStatus(input);
}
