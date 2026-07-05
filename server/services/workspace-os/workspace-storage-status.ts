import {
  HELIX_WORKSPACE_STORAGE_STATUS_SCHEMA,
  buildHelixWorkspaceStorageAuthority,
  sortHelixWorkspaceStorageRecords,
  summarizeHelixWorkspaceStorage,
  withHelixWorkspaceStorageAuthority,
  type HelixWorkspaceStorageRecord,
  type HelixWorkspaceStorageStatus,
} from "@shared/helix-workspace-storage-status";
import { getProfileStorageUsage } from "../helix-account/profile-storage-store";
import { getLatestHelixRollingSessionContextPacket } from "../helix-ask/rolling-session-context";

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
    profile_id?: string | null;
    profile_quota_bytes?: number | null;
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
  const effectiveProfileQuota = input.profile_quota_bytes ?? profileQuota;
  const profileUsage = await getProfileStorageUsage(input.profile_id, {
    quota_bytes: effectiveProfileQuota,
  });
  const activeContextPacket = getLatestHelixRollingSessionContextPacket({
    threadId: input.thread_id,
    sessionId: input.thread_id,
  });
  const activeContextMeter = activeContextPacket?.context_fidelity_meter ?? null;
  const activeContextCompactionItem = activeContextPacket?.context_compaction_item ?? null;
  const appStorageQuota = configuredQuota(
    readers.env,
    "WORKSPACE_APP_STORAGE_QUOTA_BYTES",
    "REPLIT_APP_STORAGE_QUOTA_BYTES",
  );

  const records: HelixWorkspaceStorageRecord[] = [
    makeRecord({
      artifact_id: "helix.ask.active_context_page_file",
      label: "Ask Active Context",
      artifact_type: "active_context_page_file",
      owner_scope: "thread",
      storage_backend: "helix_ask_runtime",
      sync_status: "not_applicable",
      status: activeContextMeter ? "available" : "unknown",
      path_ref: "helix-ask://active-context/page-file",
      storage_key: null,
      profile_id: null,
      chat_session_id: activeContextPacket?.session_id ?? input.thread_id ?? null,
      size_bytes: activeContextMeter
        ? Math.max(0, Math.round(activeContextMeter.active_context_total_tokens * 4))
        : null,
      quota_bytes: activeContextMeter
        ? Math.max(0, Math.round(activeContextMeter.model_context_window_tokens * 4))
        : null,
      usage_ratio: activeContextMeter?.usage_ratio ?? null,
      approximate: true,
      observed: Boolean(activeContextMeter),
      updated_at: generatedAt,
      missing_reason: activeContextMeter ? null : "rolling_session_context_packet_not_observed_yet",
      diagnostics: {
        raw_context_included: false,
        raw_history_excluded: activeContextMeter?.raw_history_excluded ?? true,
        meter_schema: activeContextMeter?.schema ?? "helix.context_fidelity_meter.v1",
        model_context_window_tokens: activeContextMeter?.model_context_window_tokens ?? 0,
        active_context_total_tokens: activeContextMeter?.active_context_total_tokens ?? 0,
        usage_ratio: activeContextMeter?.usage_ratio ?? 0,
        auto_compact_token_limit: activeContextMeter?.auto_compact_token_limit ?? 0,
        compact_warning_ratio: activeContextMeter?.compact_warning_ratio ?? 0,
        compaction_mode: activeContextMeter?.compaction_mode ?? "none",
        compaction_lifecycle_status: activeContextCompactionItem?.status ?? "not_required",
        compaction_lifecycle_schema:
          activeContextCompactionItem?.schema ?? "helix.context_compaction_lifecycle_item.v1",
        replacement_history_available: activeContextCompactionItem?.replacement_history_available ?? false,
        resume_frame_required: activeContextCompactionItem?.resume_frame_required ?? false,
        handoff_state: activeContextMeter?.handoff_state.state ?? "idle",
        chat_turns_paused: activeContextMeter?.handoff_state.chat_turns_paused ?? false,
        retained_turn_count: activeContextMeter?.retained_turn_ids.length ?? 0,
        compacted_turn_count: activeContextMeter?.compacted_turn_ids.length ?? 0,
        pending_user_inputs_count: activeContextMeter?.pending_user_inputs_count ?? 0,
        unresolved_task_frames_count: activeContextMeter?.unresolved_task_frames_count ?? 0,
        model_visible_context_included: activeContextMeter?.model_visible_context_included ?? false,
        model_visible_context_token_estimate: activeContextMeter?.model_visible_context_token_estimate ?? 0,
      },
    }),
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
      profile_id: profileUsage.profile_id,
      chat_session_id: null,
      size_bytes: profileUsage.size_bytes,
      quota_bytes: effectiveProfileQuota ?? profileUsage.quota_bytes,
      usage_ratio: (effectiveProfileQuota ?? profileUsage.quota_bytes) > 0
        ? profileUsage.size_bytes / (effectiveProfileQuota ?? profileUsage.quota_bytes)
        : null,
      approximate: true,
      observed: true,
      updated_at: generatedAt,
      missing_reason: profileUsage.snapshot_count === 0 ? "profile_storage_snapshot_missing" : null,
      diagnostics: {
        raw_profile_content_included: false,
        local_profile_snapshot_count: profileUsage.snapshot_count,
        local_profile_path_ref: profileUsage.path_ref,
        latest_snapshot_at: profileUsage.updated_at ?? "none",
        quota_source: input.profile_quota_bytes != null
          ? "account_policy"
          : profileQuota == null
            ? "not_configured"
            : "environment",
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
    summary: summarizeHelixWorkspaceStorage(sorted, effectiveProfileQuota ?? appStorageQuota ?? browserLocalQuota),
    authority: buildHelixWorkspaceStorageAuthority(),
  };
}

export async function getHelixWorkspaceStorageStatus(input: {
  thread_id?: string | null;
  room_id?: string | null;
  profile_id?: string | null;
  profile_quota_bytes?: number | null;
}): Promise<HelixWorkspaceStorageStatus> {
  return buildHelixWorkspaceStorageStatus(input);
}
