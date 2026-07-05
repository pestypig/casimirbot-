import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { HelixWorkspaceMemoryArtifact } from "@shared/helix-workspace-memory-registry";
import {
  readProfileStorageSnapshot,
  writeProfileStorageSnapshot,
  getProfileStorageUsage,
} from "../profile-storage-store";
import { resetAccountSessionStore } from "../account-session-store";

const originalEnv = { ...process.env };

const artifact = (id: string, storageKey: string): HelixWorkspaceMemoryArtifact => ({
  schema: "helix.workspace_memory_registry.v1",
  artifact_id: id,
  artifact_type: "helix_chat_session",
  owner_scope: "browser_guest",
  storage_backend: "localStorage",
  sync_status: "profile_candidate",
  profile_id: null,
  chat_session_id: "chat:test",
  title: "Chat test",
  storage_key: storageKey,
  updated_at: "2026-06-12T12:00:00.000Z",
});

beforeEach(async () => {
  process.env = {
    ...originalEnv,
    WORKSPACE_PROFILE_STORAGE_QUOTA_BYTES: "4096",
  };
  await resetAccountSessionStore();
});

afterEach(async () => {
  process.env = { ...originalEnv };
  await resetAccountSessionStore();
});

describe("local profile storage store", () => {
  it("writes and reads a profile snapshot with raw content only in the snapshot", async () => {
    const receipt = await writeProfileStorageSnapshot({
      profile_id: "local:admin",
      snapshot: {
        artifacts: [artifact("helix-chat-session:test", "agi-chat-sessions-v1")],
        entries: [{
          storage_key: "agi-chat-sessions-v1",
          storage_backend: "localStorage",
          value: "{\"state\":{\"sessions\":{}}}",
          size_bytes: 25,
          updated_at: "2026-06-12T12:00:01.000Z",
          artifact_ids: ["helix-chat-session:test"],
        }],
      },
    });

    expect(receipt).toMatchObject({
      ok: true,
      profile_id: "local:admin",
      entry_count: 1,
      artifact_count: 1,
      raw_profile_content_included: false,
    });

    const snapshot = await readProfileStorageSnapshot("local:admin");
    expect(snapshot.schema).toBe("helix.profile_storage_snapshot.v1");
    expect(snapshot.raw_profile_content_included).toBe(true);
    expect(snapshot.entries[0]?.value).toContain("sessions");
    expect(snapshot.artifacts[0]).toMatchObject({
      owner_scope: "profile",
      sync_status: "profile_synced",
      profile_id: "local:admin",
    });
  });

  it("rejects snapshots over quota and keeps usage sanitized", async () => {
    const receipt = await writeProfileStorageSnapshot({
      profile_id: "local:admin",
      snapshot: {
        artifacts: [artifact("helix-chat-session:large", "agi-chat-sessions-v1")],
        entries: [{
          storage_key: "agi-chat-sessions-v1",
          storage_backend: "localStorage",
          value: "x".repeat(5000),
          size_bytes: 5000,
          updated_at: "2026-06-12T12:00:01.000Z",
          artifact_ids: ["helix-chat-session:large"],
        }],
      },
    });

    expect(receipt).toMatchObject({
      ok: false,
      error: "profile_storage_quota_exceeded",
      raw_profile_content_included: false,
    });
    expect((await readProfileStorageSnapshot("local:admin")).entries).toHaveLength(0);
    expect(await getProfileStorageUsage("local:admin")).toMatchObject({
      profile_id: "local:admin",
      size_bytes: 0,
      quota_bytes: 4096,
      snapshot_count: 0,
    });
  });
});
