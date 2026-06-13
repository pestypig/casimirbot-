import type { HelixWorkspaceMemoryArtifact } from "./helix-workspace-memory-registry";

export const HELIX_PROFILE_STORAGE_SNAPSHOT_SCHEMA =
  "helix.profile_storage_snapshot.v1" as const;
export const HELIX_PROFILE_STORAGE_WRITE_RECEIPT_SCHEMA =
  "helix.profile_storage_write_receipt.v1" as const;

export type HelixProfileStorageBackend = "localStorage";

export interface HelixProfileStorageEntry {
  storage_key: string;
  storage_backend: HelixProfileStorageBackend;
  value: string;
  size_bytes: number;
  updated_at: string;
  artifact_ids: string[];
}

export interface HelixProfileStorageSnapshot {
  schema: typeof HELIX_PROFILE_STORAGE_SNAPSHOT_SCHEMA;
  profile_id: string;
  storage_backend: "profile_server";
  entries: HelixProfileStorageEntry[];
  artifacts: HelixWorkspaceMemoryArtifact[];
  total_entry_bytes: number;
  quota_bytes: number | null;
  updated_at: string | null;
  raw_profile_content_included: true;
}

export interface HelixProfileStorageWriteRequest {
  entries: HelixProfileStorageEntry[];
  artifacts: HelixWorkspaceMemoryArtifact[];
}

export interface HelixProfileStorageWriteReceipt {
  schema: typeof HELIX_PROFILE_STORAGE_WRITE_RECEIPT_SCHEMA;
  ok: boolean;
  profile_id: string | null;
  entry_count: number;
  artifact_count: number;
  total_entry_bytes: number;
  quota_bytes: number | null;
  updated_at: string | null;
  error: string | null;
  message: string;
  raw_profile_content_included: false;
}
