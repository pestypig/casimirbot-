import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { HelixWorkspaceMemoryArtifact } from "@shared/helix-workspace-memory-registry";
import {
  HELIX_PROFILE_STORAGE_SNAPSHOT_SCHEMA,
  HELIX_PROFILE_STORAGE_WRITE_RECEIPT_SCHEMA,
  type HelixProfileStorageEntry,
  type HelixProfileStorageSnapshot,
  type HelixProfileStorageWriteReceipt,
  type HelixProfileStorageWriteRequest,
} from "@shared/helix-profile-storage";

const DEFAULT_PROFILE_STORAGE_QUOTA_BYTES = 5 * 1024 * 1024;
const MAX_PROFILE_STORAGE_QUOTA_BYTES = 50 * 1024 * 1024;
const MAX_ENTRY_BYTES = 2 * 1024 * 1024;

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const nowIso = (): string => new Date().toISOString();

const byteLength = (value: string): number => Buffer.byteLength(value, "utf8");

const parseBytes = (value: string | undefined): number | null => {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed);
};

export function getProfileStorageQuotaBytes(): number {
  const configured =
    parseBytes(process.env.WORKSPACE_PROFILE_STORAGE_QUOTA_BYTES) ??
    parseBytes(process.env.WORKSPACE_USER_STORAGE_QUOTA_BYTES);
  if (configured == null) return DEFAULT_PROFILE_STORAGE_QUOTA_BYTES;
  return Math.min(MAX_PROFILE_STORAGE_QUOTA_BYTES, configured);
}

function profileStoreRoot(): string {
  const explicit = normalize(process.env.HELIX_PROFILE_STORAGE_DIR);
  return explicit ? path.resolve(explicit) : path.resolve(process.cwd(), ".cal", "profile-store");
}

function sanitizeProfileId(profileId: string): string {
  return profileId.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 96) || "profile";
}

function profileSnapshotPath(profileId: string): string {
  return path.join(profileStoreRoot(), `${sanitizeProfileId(profileId)}.snapshot.json`);
}

function profileEventsPath(profileId: string): string {
  return path.join(profileStoreRoot(), `${sanitizeProfileId(profileId)}.events.jsonl`);
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function atomicWriteJson(filePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.renameSync(tmp, filePath);
}

function appendProfileStorageEvent(profileId: string, snapshot: HelixProfileStorageSnapshot): void {
  fs.mkdirSync(path.dirname(profileEventsPath(profileId)), { recursive: true });
  const entry = {
    schema: "helix.profile_storage_event.v1",
    profile_id: profileId,
    event_type: "snapshot_written",
    entry_count: snapshot.entries.length,
    artifact_count: snapshot.artifacts.length,
    total_entry_bytes: snapshot.total_entry_bytes,
    entry_hashes: snapshot.entries.map((item) => ({
      storage_key: item.storage_key,
      size_bytes: item.size_bytes,
      sha256: sha256(item.value),
      artifact_ids: item.artifact_ids,
    })),
    raw_profile_content_included: false,
    ts: snapshot.updated_at ?? nowIso(),
  };
  fs.appendFileSync(profileEventsPath(profileId), `${JSON.stringify(entry)}\n`, "utf8");
}

function normalizeArtifact(
  artifact: HelixWorkspaceMemoryArtifact,
  profileId: string,
): HelixWorkspaceMemoryArtifact | null {
  const artifactId = normalize(artifact.artifact_id);
  const storageKey = normalize(artifact.storage_key);
  if (!artifactId || !storageKey) return null;
  if (artifact.storage_backend !== "localStorage") return null;
  if (
    artifact.sync_status !== "profile_candidate" &&
    artifact.sync_status !== "profile_synced"
  ) {
    return null;
  }
  return {
    ...artifact,
    artifact_id: artifactId,
    storage_key: storageKey,
    storage_backend: "localStorage",
    owner_scope: "profile",
    sync_status: "profile_synced",
    profile_id: profileId,
    updated_at: normalize(artifact.updated_at) || nowIso(),
  };
}

function normalizeEntries(
  input: HelixProfileStorageWriteRequest,
  artifacts: HelixWorkspaceMemoryArtifact[],
): HelixProfileStorageEntry[] {
  const artifactIdsByStorageKey = new Map<string, string[]>();
  for (const artifact of artifacts) {
    const ids = artifactIdsByStorageKey.get(artifact.storage_key) ?? [];
    ids.push(artifact.artifact_id);
    artifactIdsByStorageKey.set(artifact.storage_key, Array.from(new Set(ids)).sort());
  }

  const entriesByKey = new Map<string, HelixProfileStorageEntry>();
  for (const entry of input.entries ?? []) {
    const storageKey = normalize(entry.storage_key);
    if (!storageKey || entry.storage_backend !== "localStorage") continue;
    const value = typeof entry.value === "string" ? entry.value : "";
    const sizeBytes = byteLength(value);
    if (sizeBytes > MAX_ENTRY_BYTES) continue;
    if (!artifactIdsByStorageKey.has(storageKey)) continue;
    entriesByKey.set(storageKey, {
      storage_key: storageKey,
      storage_backend: "localStorage",
      value,
      size_bytes: sizeBytes,
      updated_at: normalize(entry.updated_at) || nowIso(),
      artifact_ids: artifactIdsByStorageKey.get(storageKey) ?? [],
    });
  }
  return Array.from(entriesByKey.values()).sort((left, right) =>
    left.storage_key.localeCompare(right.storage_key),
  );
}

function emptySnapshot(profileId: string): HelixProfileStorageSnapshot {
  return {
    schema: HELIX_PROFILE_STORAGE_SNAPSHOT_SCHEMA,
    profile_id: profileId,
    storage_backend: "profile_server",
    entries: [],
    artifacts: [],
    total_entry_bytes: 0,
    quota_bytes: getProfileStorageQuotaBytes(),
    updated_at: null,
    raw_profile_content_included: true,
  };
}

export function readProfileStorageSnapshot(profileId: string): HelixProfileStorageSnapshot {
  const normalizedProfileId = normalize(profileId);
  if (!normalizedProfileId) return emptySnapshot("");
  const filePath = profileSnapshotPath(normalizedProfileId);
  if (!fs.existsSync(filePath)) return emptySnapshot(normalizedProfileId);
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as HelixProfileStorageSnapshot;
    if (parsed?.schema !== HELIX_PROFILE_STORAGE_SNAPSHOT_SCHEMA) {
      return emptySnapshot(normalizedProfileId);
    }
    return {
      ...emptySnapshot(normalizedProfileId),
      ...parsed,
      profile_id: normalizedProfileId,
      quota_bytes: getProfileStorageQuotaBytes(),
      raw_profile_content_included: true,
    };
  } catch {
    return emptySnapshot(normalizedProfileId);
  }
}

export function writeProfileStorageSnapshot(input: {
  profile_id: string;
  snapshot: HelixProfileStorageWriteRequest;
}): HelixProfileStorageWriteReceipt {
  const profileId = normalize(input.profile_id);
  if (!profileId) {
    return {
      schema: HELIX_PROFILE_STORAGE_WRITE_RECEIPT_SCHEMA,
      ok: false,
      profile_id: null,
      entry_count: 0,
      artifact_count: 0,
      total_entry_bytes: 0,
      quota_bytes: getProfileStorageQuotaBytes(),
      updated_at: null,
      error: "missing_profile_id",
      message: "A profile session is required before profile storage can be saved.",
      raw_profile_content_included: false,
    };
  }
  const artifacts = (input.snapshot.artifacts ?? [])
    .map((artifact) => normalizeArtifact(artifact, profileId))
    .filter((artifact): artifact is HelixWorkspaceMemoryArtifact => Boolean(artifact));
  const entries = normalizeEntries(input.snapshot, artifacts);
  const totalEntryBytes = entries.reduce((sum, entry) => sum + entry.size_bytes, 0);
  const quotaBytes = getProfileStorageQuotaBytes();
  if (totalEntryBytes > quotaBytes) {
    return {
      schema: HELIX_PROFILE_STORAGE_WRITE_RECEIPT_SCHEMA,
      ok: false,
      profile_id: profileId,
      entry_count: entries.length,
      artifact_count: artifacts.length,
      total_entry_bytes: totalEntryBytes,
      quota_bytes: quotaBytes,
      updated_at: null,
      error: "profile_storage_quota_exceeded",
      message: "Profile storage snapshot exceeds the configured local profile quota.",
      raw_profile_content_included: false,
    };
  }
  const updatedAt = nowIso();
  const snapshot: HelixProfileStorageSnapshot = {
    schema: HELIX_PROFILE_STORAGE_SNAPSHOT_SCHEMA,
    profile_id: profileId,
    storage_backend: "profile_server",
    entries,
    artifacts,
    total_entry_bytes: totalEntryBytes,
    quota_bytes: quotaBytes,
    updated_at: updatedAt,
    raw_profile_content_included: true,
  };
  atomicWriteJson(profileSnapshotPath(profileId), snapshot);
  appendProfileStorageEvent(profileId, snapshot);
  return {
    schema: HELIX_PROFILE_STORAGE_WRITE_RECEIPT_SCHEMA,
    ok: true,
    profile_id: profileId,
    entry_count: entries.length,
    artifact_count: artifacts.length,
    total_entry_bytes: totalEntryBytes,
    quota_bytes: quotaBytes,
    updated_at: updatedAt,
    error: null,
    message: "Profile storage snapshot saved.",
    raw_profile_content_included: false,
  };
}

export function getProfileStorageUsage(profileId?: string | null): {
  profile_id: string | null;
  size_bytes: number;
  quota_bytes: number;
  snapshot_count: number;
  path_ref: string;
  updated_at: string | null;
} {
  const normalizedProfileId = normalize(profileId);
  if (normalizedProfileId) {
    const snapshot = readProfileStorageSnapshot(normalizedProfileId);
    return {
      profile_id: normalizedProfileId,
      size_bytes: snapshot.total_entry_bytes,
      quota_bytes: getProfileStorageQuotaBytes(),
      snapshot_count: snapshot.updated_at ? 1 : 0,
      path_ref: `profile://local/${sanitizeProfileId(normalizedProfileId)}`,
      updated_at: snapshot.updated_at,
    };
  }

  const root = profileStoreRoot();
  if (!fs.existsSync(root)) {
    return {
      profile_id: null,
      size_bytes: 0,
      quota_bytes: getProfileStorageQuotaBytes(),
      snapshot_count: 0,
      path_ref: "profile://local",
      updated_at: null,
    };
  }
  const snapshots = fs.readdirSync(root).filter((file) => file.endsWith(".snapshot.json"));
  let sizeBytes = 0;
  let updatedAt: string | null = null;
  for (const file of snapshots) {
    const stats = fs.statSync(path.join(root, file));
    sizeBytes += stats.size;
    const mtime = stats.mtime.toISOString();
    if (!updatedAt || mtime > updatedAt) updatedAt = mtime;
  }
  return {
    profile_id: null,
    size_bytes: sizeBytes,
    quota_bytes: getProfileStorageQuotaBytes(),
    snapshot_count: snapshots.length,
    path_ref: "profile://local",
    updated_at: updatedAt,
  };
}
