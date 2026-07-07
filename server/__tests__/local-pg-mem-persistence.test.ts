import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetDbClient } from "../db/client";
import {
  getAccountSessionStatus,
  resetAccountSessionStore,
  signInPasswordAccountSession,
  signUpPasswordAccountSession,
} from "../services/helix-account/account-session-store";
import {
  readProfileStorageSnapshot,
  writeProfileStorageSnapshot,
} from "../services/helix-account/profile-storage-store";

describe("local pg-mem persistence", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "casimirbot-local-db-"));
  const snapshotPath = path.join(tempDir, "local-pg-mem.json");

  beforeEach(async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("HELIX_LOCAL_DB_PATH", snapshotPath);
    await resetDbClient();
    if (fs.existsSync(snapshotPath)) fs.unlinkSync(snapshotPath);
  });

  afterEach(async () => {
    await resetAccountSessionStore().catch(() => undefined);
    await resetDbClient();
    vi.unstubAllEnvs();
    if (fs.existsSync(snapshotPath)) fs.unlinkSync(snapshotPath);
  });

  it("restores password accounts and profile saves after a local server restart", async () => {
    const email = "persisted-local-profile@example.com";
    const password = "CorrectHorseBattery123!";
    const signUp = await signUpPasswordAccountSession({
      email,
      password,
      display_name: "Persistent Local Profile",
    });
    expect(signUp.ok).toBe(true);
    const profileId = signUp.session?.profile.profile_id;
    expect(profileId).toBeTruthy();

    const saved = await writeProfileStorageSnapshot({
      profile_id: profileId!,
      quota_bytes: 1024 * 1024,
      snapshot: {
        entries: [
          {
            storage_key: "helix:test:restart-proof",
            storage_backend: "localStorage",
            value: JSON.stringify({ title: "Restart proof", steps: ["save", "restart", "restore"] }),
            size_bytes: 64,
            updated_at: "2026-07-06T00:00:00.000Z",
            artifact_ids: ["artifact:restart-proof"],
          },
        ],
        artifacts: [
          {
            schema: "helix.workspace_memory_registry.v1",
            artifact_id: "artifact:restart-proof",
            artifact_type: "remembered_procedure",
            owner_scope: "browser_guest",
            storage_backend: "localStorage",
            sync_status: "profile_candidate",
            profile_id: null,
            chat_session_id: null,
            title: "Restart proof",
            storage_key: "helix:test:restart-proof",
            updated_at: "2026-07-06T00:00:00.000Z",
          },
        ],
      },
    });
    expect(saved.ok).toBe(true);
    expect(fs.existsSync(snapshotPath)).toBe(true);

    await resetDbClient();

    const signIn = await signInPasswordAccountSession({ email, password });
    expect(signIn.ok).toBe(true);
    expect(signIn.session?.profile.email).toBe(email);
    expect((await getAccountSessionStatus(signIn.session?.session_id)).session?.profile.email).toBe(email);

    const restored = await readProfileStorageSnapshot(profileId!, { quota_bytes: 1024 * 1024 });
    expect(restored.entries).toHaveLength(1);
    expect(JSON.parse(restored.entries[0]?.value ?? "{}")).toMatchObject({ title: "Restart proof" });
    expect(restored.artifacts[0]?.sync_status).toBe("profile_synced");
  });
});
