import { newDb } from "pg-mem";
import type { Pool } from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { migration026 } from "../../../db/migrations/026_helix_accounts";
import { migration070 } from "../../../db/migrations/070_installed_security_devices";
import {
  InstalledSecurityStore,
  installedDeviceRef,
  installedSessionRef,
} from "../installed-security-store";

const NOW = new Date("2026-08-27T21:00:00.000Z");
const OWNER = { sessionId: "session-owner", profileId: "profile-owner" };
const DEVICE_ID = "desktop_device_AAAAAAAAAAAAAAAAAAAAAA";

describe("InstalledSecurityStore", () => {
  let pool: Pool;
  let store: InstalledSecurityStore;
  let sequence: number;

  beforeEach(async () => {
    const memory = newDb({ autoCreateForeignKeyIndices: true });
    const pg = memory.adapters.createPg();
    pool = new pg.Pool() as unknown as Pool;
    const client = await pool.connect();
    try {
      const context = { enablePgvector: false };
      await migration026.run(client, context);
      await migration070.run(client, context);
    } finally {
      client.release();
    }
    await pool.query(
      `INSERT INTO helix_accounts (
         profile_id, display_name, account_type, provider, created_at, updated_at
       ) VALUES ($1, 'Owner', 'developer', 'local', $2, $2);`,
      [OWNER.profileId, NOW.toISOString()],
    );
    for (const sessionId of [OWNER.sessionId, "session-other"]) {
      await pool.query(
        `INSERT INTO helix_account_sessions (
           session_id, profile_id, status, memory_scope, account_policy,
           created_at, updated_at, expires_at
         ) VALUES ($1, $2, 'active', 'profile', $3::jsonb, $4, $4, $5);`,
        [
          sessionId,
          OWNER.profileId,
          JSON.stringify({ account_type: "developer" }),
          NOW.toISOString(),
          new Date(NOW.getTime() + 3_600_000).toISOString(),
        ],
      );
    }
    sequence = 0;
    store = new InstalledSecurityStore({
      pool,
      now: () => NOW,
      randomId: () => `event-${++sequence}`,
      persist: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("projects only stable refs before and after device registration", async () => {
    const initial = await store.status({
      session: OWNER,
      deviceId: DEVICE_ID,
      auth0Configured: true,
      maximumAgeSeconds: 300,
    });
    expect(initial.current_device).toMatchObject({
      device_ref: installedDeviceRef(DEVICE_ID),
      status: "unregistered",
    });
    expect(initial.current_session_ref).toBe(installedSessionRef(OWNER.sessionId));
    expect(initial.sessions).toHaveLength(2);
    expect(JSON.stringify(initial)).not.toContain(DEVICE_ID);
    expect(JSON.stringify(initial)).not.toContain(OWNER.sessionId);

    await store.registerDevice({ session: OWNER, deviceId: DEVICE_ID });
    const registered = await store.status({
      session: OWNER,
      deviceId: DEVICE_ID,
      auth0Configured: true,
      maximumAgeSeconds: 300,
    });
    expect(registered.current_device).toMatchObject({
      status: "active",
      recovery_generation: 0,
    });
    expect(registered.recent_events).toEqual([
      expect.objectContaining({
        event_type: "installed_device_registered",
        target_ref: installedDeviceRef(DEVICE_ID),
      }),
    ]);
    expect(JSON.stringify(registered.recent_events)).not.toContain(DEVICE_ID);
    expect(registered.agent_authority).toEqual({
      may_inspect_sanitized_status: true,
      may_start_step_up: false,
      may_complete_mfa: false,
      may_receive_usable_receipt: false,
      may_register_or_recover_device: false,
      may_revoke_session: false,
    });
  });

  it("requires revoke before recovery and increments the recovery generation", async () => {
    await expect(store.recoverDevice({ session: OWNER, deviceId: DEVICE_ID }))
      .rejects.toMatchObject({ code: "device_not_revoked" });
    await store.registerDevice({ session: OWNER, deviceId: DEVICE_ID });
    await store.revokeDevice({ session: OWNER, deviceId: DEVICE_ID });
    let status = await store.status({
      session: OWNER,
      deviceId: DEVICE_ID,
      auth0Configured: true,
      maximumAgeSeconds: 300,
    });
    expect(status.current_device.status).toBe("revoked");
    await store.recoverDevice({ session: OWNER, deviceId: DEVICE_ID });
    status = await store.status({
      session: OWNER,
      deviceId: DEVICE_ID,
      auth0Configured: true,
      maximumAgeSeconds: 300,
    });
    expect(status.current_device).toMatchObject({
      status: "active",
      recovery_generation: 1,
    });
  });

  it("revokes another profile session but never the current one", async () => {
    await expect(store.revokeSession({
      session: OWNER,
      targetSessionRef: installedSessionRef(OWNER.sessionId),
    })).rejects.toMatchObject({ code: "current_session_revoke_forbidden" });
    await store.revokeSession({
      session: OWNER,
      targetSessionRef: installedSessionRef("session-other"),
    });
    const { rows } = await pool.query<{ status: string }>(
      `SELECT status FROM helix_account_sessions WHERE session_id = 'session-other';`,
    );
    expect(rows[0]?.status).toBe("signed_out");
  });

  it("records sanitized lifecycle evidence", async () => {
    await store.registerDevice({ session: OWNER, deviceId: DEVICE_ID });
    const { rows } = await pool.query<{ payload: unknown }>(
      `SELECT payload FROM helix_account_events
       WHERE event_type = 'installed_device_registered';`,
    );
    const serialized = JSON.stringify(rows);
    expect(serialized).toContain(installedDeviceRef(DEVICE_ID));
    expect(serialized).not.toContain(DEVICE_ID);
    expect(serialized).not.toContain("stepup_");
    const status = await store.status({
      session: OWNER,
      deviceId: DEVICE_ID,
      auth0Configured: true,
      maximumAgeSeconds: 300,
    });
    expect(JSON.stringify(status.recent_events)).not.toContain("receipt");
  });
});
