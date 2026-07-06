import crypto from "node:crypto";
import type { HelixWorkspaceMemoryArtifact } from "@shared/helix-workspace-memory-registry";
import {
  HELIX_PROFILE_STORAGE_SNAPSHOT_SCHEMA,
  HELIX_PROFILE_STORAGE_WRITE_RECEIPT_SCHEMA,
  type HelixProfileStorageEntry,
  type HelixProfileStorageSnapshot,
  type HelixProfileStorageWriteReceipt,
  type HelixProfileStorageWriteRequest,
} from "@shared/helix-profile-storage";
import { ensureDatabase, getPool } from "../../db/client";

const DEFAULT_PROFILE_STORAGE_QUOTA_BYTES = 5 * 1024 * 1024;
const MAX_PROFILE_STORAGE_QUOTA_BYTES = 50 * 1024 * 1024;
const MAX_ENTRY_BYTES = 2 * 1024 * 1024;
const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const ENCRYPTED_SNAPSHOT_PREFIX = "v1";

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

function resolveProfileStorageEncryptionKey(): {
  key: Buffer;
  key_id: string;
} {
  const configured = normalize(process.env.HELIX_PROFILE_STORAGE_ENCRYPTION_KEY);
  if (configured) {
    const decoded = Buffer.from(configured, "base64url");
    const key = decoded.length >= 32
      ? decoded.subarray(0, 32)
      : crypto.createHash("sha256").update(configured).digest();
    return {
      key,
      key_id: `env:${crypto.createHash("sha256").update(key).digest("base64url").slice(0, 12)}`,
    };
  }
  if (normalize(process.env.NODE_ENV).toLowerCase() === "production") {
    throw new Error("profile_storage_encryption_key_missing");
  }
  return {
    key: crypto.createHash("sha256").update("casimirbot-local-profile-storage-dev-key").digest(),
    key_id: "dev-local",
  };
}

function encryptProfileStorageSnapshot(snapshot: HelixProfileStorageSnapshot): {
  encrypted_snapshot: string;
  encryption_key_id: string;
  encryption_algorithm: string;
} {
  const { key, key_id } = resolveProfileStorageEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  const plaintext = Buffer.from(JSON.stringify(snapshot), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted_snapshot: [
      ENCRYPTED_SNAPSHOT_PREFIX,
      iv.toString("base64url"),
      tag.toString("base64url"),
      encrypted.toString("base64url"),
    ].join(":"),
    encryption_key_id: key_id,
    encryption_algorithm: ENCRYPTION_ALGORITHM,
  };
}

function decryptProfileStorageSnapshot(encryptedSnapshot: string): HelixProfileStorageSnapshot | null {
  const parts = encryptedSnapshot.split(":");
  if (parts.length !== 4 || parts[0] !== ENCRYPTED_SNAPSHOT_PREFIX) return null;
  const [, ivEncoded, tagEncoded, encryptedEncoded] = parts;
  const { key } = resolveProfileStorageEncryptionKey();
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    key,
    Buffer.from(ivEncoded, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedEncoded, "base64url")),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8")) as HelixProfileStorageSnapshot;
}

function sanitizeSnapshotForStorage(snapshot: HelixProfileStorageSnapshot): HelixProfileStorageSnapshot {
  return {
    ...snapshot,
    entries: snapshot.entries.map((entry) => ({
      ...entry,
      value: "",
    })),
    raw_profile_content_included: true,
  };
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

const resolveQuotaBytes = (quotaBytes?: number | null): number => {
  if (typeof quotaBytes === "number" && Number.isFinite(quotaBytes) && quotaBytes >= 0) {
    return Math.round(quotaBytes);
  }
  return getProfileStorageQuotaBytes();
};

async function ensureProfileStorageAccount(profileId: string): Promise<void> {
  await ensureDatabase();
  await getPool().query(
    `
      INSERT INTO helix_accounts (
        profile_id, display_name, account_type, provider, provider_subject, created_at, updated_at
      )
      VALUES ($1, $1, 'user', 'local', $1, now(), now())
      ON CONFLICT (profile_id) DO NOTHING;
    `,
    [profileId],
  );
}

export async function readProfileStorageSnapshot(
  profileId: string,
  options: { quota_bytes?: number | null } = {},
): Promise<HelixProfileStorageSnapshot> {
  const normalizedProfileId = normalize(profileId);
  const quotaBytes = resolveQuotaBytes(options.quota_bytes);
  if (!normalizedProfileId) return { ...emptySnapshot(""), quota_bytes: quotaBytes };
  try {
    await ensureDatabase();
    const { rows } = await getPool().query<{
      snapshot: HelixProfileStorageSnapshot | string;
      encrypted_snapshot: string | null;
    }>(
      `
        SELECT snapshot, encrypted_snapshot
        FROM helix_account_profile_storage
        WHERE profile_id = $1 AND deleted_at IS NULL
        LIMIT 1;
      `,
      [normalizedProfileId],
    );
    if (!rows[0]) return { ...emptySnapshot(normalizedProfileId), quota_bytes: quotaBytes };
    const parsed = rows[0].encrypted_snapshot
      ? decryptProfileStorageSnapshot(rows[0].encrypted_snapshot)
      : (
      typeof rows[0].snapshot === "string"
        ? JSON.parse(rows[0].snapshot) as HelixProfileStorageSnapshot
        : rows[0].snapshot
      );
    if (parsed?.schema !== HELIX_PROFILE_STORAGE_SNAPSHOT_SCHEMA) {
      return { ...emptySnapshot(normalizedProfileId), quota_bytes: quotaBytes };
    }
    return {
      ...emptySnapshot(normalizedProfileId),
      ...parsed,
      profile_id: normalizedProfileId,
      quota_bytes: quotaBytes,
      raw_profile_content_included: true,
    };
  } catch {
    return { ...emptySnapshot(normalizedProfileId), quota_bytes: quotaBytes };
  }
}

export async function writeProfileStorageSnapshot(input: {
  profile_id: string;
  quota_bytes?: number | null;
  snapshot: HelixProfileStorageWriteRequest;
}): Promise<HelixProfileStorageWriteReceipt> {
  const quotaBytes = resolveQuotaBytes(input.quota_bytes);
  const profileId = normalize(input.profile_id);
  if (!profileId) {
    return {
      schema: HELIX_PROFILE_STORAGE_WRITE_RECEIPT_SCHEMA,
      ok: false,
      profile_id: null,
      entry_count: 0,
      artifact_count: 0,
      total_entry_bytes: 0,
      quota_bytes: quotaBytes,
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
  let encrypted: {
    encrypted_snapshot: string;
    encryption_key_id: string;
    encryption_algorithm: string;
  };
  try {
    encrypted = encryptProfileStorageSnapshot(snapshot);
  } catch {
    return {
      schema: HELIX_PROFILE_STORAGE_WRITE_RECEIPT_SCHEMA,
      ok: false,
      profile_id: profileId,
      entry_count: entries.length,
      artifact_count: artifacts.length,
      total_entry_bytes: totalEntryBytes,
      quota_bytes: quotaBytes,
      updated_at: null,
      error: "profile_storage_encryption_unavailable",
      message: "Profile storage encryption is not configured.",
      raw_profile_content_included: false,
    };
  }
  const sanitizedSnapshot = sanitizeSnapshotForStorage(snapshot);
  await ensureProfileStorageAccount(profileId);
  await getPool().query(
    `
      INSERT INTO helix_account_profile_storage (
        profile_id, snapshot, encrypted_snapshot, encryption_key_id, encryption_algorithm,
        total_entry_bytes, quota_bytes, updated_at, deleted_at
      )
      VALUES ($1, $2::jsonb, $3, $4, $5, $6, $7, now(), NULL)
      ON CONFLICT (profile_id) DO UPDATE SET
        snapshot = EXCLUDED.snapshot,
        encrypted_snapshot = EXCLUDED.encrypted_snapshot,
        encryption_key_id = EXCLUDED.encryption_key_id,
        encryption_algorithm = EXCLUDED.encryption_algorithm,
        total_entry_bytes = EXCLUDED.total_entry_bytes,
        quota_bytes = EXCLUDED.quota_bytes,
        updated_at = now(),
        deleted_at = NULL;
    `,
    [
      profileId,
      JSON.stringify(sanitizedSnapshot),
      encrypted.encrypted_snapshot,
      encrypted.encryption_key_id,
      encrypted.encryption_algorithm,
      totalEntryBytes,
      quotaBytes,
    ],
  );
  await getPool().query(
    `
      INSERT INTO helix_account_events (
        event_id, profile_id, event_type, payload, created_at
      )
      VALUES ($1, $2, 'profile_storage_snapshot_written', $3::jsonb, now());
    `,
    [
      `account_event:${crypto.randomUUID()}`,
      profileId,
      JSON.stringify({
        entry_count: entries.length,
        artifact_count: artifacts.length,
        total_entry_bytes: totalEntryBytes,
        quota_bytes: quotaBytes,
        raw_profile_content_included: false,
      }),
    ],
  );
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

export async function deleteProfileStorageSnapshot(profileId: string): Promise<HelixProfileStorageWriteReceipt> {
  const normalizedProfileId = normalize(profileId);
  const quotaBytes = getProfileStorageQuotaBytes();
  if (!normalizedProfileId) {
    return {
      schema: HELIX_PROFILE_STORAGE_WRITE_RECEIPT_SCHEMA,
      ok: false,
      profile_id: null,
      entry_count: 0,
      artifact_count: 0,
      total_entry_bytes: 0,
      quota_bytes: quotaBytes,
      updated_at: null,
      error: "missing_profile_id",
      message: "A profile session is required before profile storage can be deleted.",
      raw_profile_content_included: false,
    };
  }
  await ensureDatabase();
  await getPool().query(
    `UPDATE helix_account_profile_storage SET deleted_at = now(), updated_at = now() WHERE profile_id = $1`,
    [normalizedProfileId],
  );
  return {
    schema: HELIX_PROFILE_STORAGE_WRITE_RECEIPT_SCHEMA,
    ok: true,
    profile_id: normalizedProfileId,
    entry_count: 0,
    artifact_count: 0,
    total_entry_bytes: 0,
    quota_bytes: quotaBytes,
    updated_at: nowIso(),
    error: null,
    message: "Profile storage snapshot deleted.",
    raw_profile_content_included: false,
  };
}

export async function getProfileStorageUsage(
  profileId?: string | null,
  options: { quota_bytes?: number | null } = {},
): Promise<{
  profile_id: string | null;
  size_bytes: number;
  quota_bytes: number;
  snapshot_count: number;
  path_ref: string;
  updated_at: string | null;
}> {
  const quotaBytes = resolveQuotaBytes(options.quota_bytes);
  const normalizedProfileId = normalize(profileId);
  if (normalizedProfileId) {
    const snapshot = await readProfileStorageSnapshot(normalizedProfileId, { quota_bytes: quotaBytes });
    return {
      profile_id: normalizedProfileId,
      size_bytes: snapshot.total_entry_bytes,
      quota_bytes: quotaBytes,
      snapshot_count: snapshot.updated_at ? 1 : 0,
      path_ref: `profile://db/${encodeURIComponent(normalizedProfileId)}`,
      updated_at: snapshot.updated_at,
    };
  }

  try {
    await ensureDatabase();
    const { rows } = await getPool().query<{ count: string; size_bytes: string | number | null; updated_at: Date | string | null }>(
      `
        SELECT
          count(*)::text AS count,
          COALESCE(sum(total_entry_bytes), 0) AS size_bytes,
          max(updated_at) AS updated_at
        FROM helix_account_profile_storage
        WHERE deleted_at IS NULL;
      `,
    );
    const row = rows[0];
    return {
      profile_id: null,
      size_bytes: Number(row?.size_bytes ?? 0),
      quota_bytes: quotaBytes,
      snapshot_count: Number(row?.count ?? 0),
      path_ref: "profile://db",
      updated_at: row?.updated_at instanceof Date ? row.updated_at.toISOString() : normalize(row?.updated_at) || null,
    };
  } catch {
    return {
      profile_id: null,
      size_bytes: 0,
      quota_bytes: quotaBytes,
      snapshot_count: 0,
      path_ref: "profile://db",
      updated_at: null,
    };
  }
}
