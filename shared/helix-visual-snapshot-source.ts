export const HELIX_VISUAL_SNAPSHOT_SOURCE_SCHEMA =
  "helix.visual_snapshot_source.v1" as const;

export type HelixVisualSnapshotSourceFamily =
  | "visual_snapshot"
  | "screen_capture"
  | "discord_screen_context";

export type HelixVisualCaptureMode =
  | "manual"
  | "interval"
  | "salience_triggered";

export type HelixVisualSourceSurface =
  | "browser_tab"
  | "desktop_window"
  | "screen_share_window"
  | "device_camera"
  | "minecraft_client_window"
  | "manual_upload";

export type HelixVisualSnapshotSourceStatus =
  | "permission_required"
  | "active"
  | "paused"
  | "stopped"
  | "error";

export type HelixRawImageStoragePolicy =
  | "ephemeral"
  | "debug_retained"
  | "profile_opt_in";

export type HelixVisualSnapshotSource = {
  schema: typeof HELIX_VISUAL_SNAPSHOT_SOURCE_SCHEMA;
  source_id: string;
  thread_id: string;
  room_id?: string | null;
  session_id?: string | null;
  profile_id?: string | null;
  source_family: HelixVisualSnapshotSourceFamily;
  capture_mode: HelixVisualCaptureMode;
  source_surface: HelixVisualSourceSurface;
  status: HelixVisualSnapshotSourceStatus;
  cadence_ms?: number | null;
  raw_image_storage_policy: HelixRawImageStoragePolicy;
  context_policy: "compact_context_pack_only";
  raw_image_included: false;
  assistant_answer: false;
  created_at: string;
  updated_at: string;
};

export type HelixVisualSnapshotSourceReceipt = {
  schema: "helix.visual_snapshot_source_receipt.v1";
  ok: boolean;
  source?: HelixVisualSnapshotSource | null;
  error?: string | null;
  assistant_answer: false;
  raw_image_included: false;
  context_policy: "compact_context_pack_only";
};
