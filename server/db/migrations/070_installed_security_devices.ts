import type { Migration } from "./migration";

export const migration070: Migration = {
  id: "070_installed_security_devices",
  description: "Add profile-bound installed device security lifecycle",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_installed_devices (
        profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        device_id text NOT NULL,
        label text NOT NULL,
        platform text NOT NULL,
        status text NOT NULL,
        recovery_generation integer NOT NULL DEFAULT 0,
        registered_at timestamptz,
        last_seen_at timestamptz,
        revoked_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (profile_id, device_id),
        CHECK (platform = 'windows'),
        CHECK (status IN ('active', 'revoked', 'recovery_required')),
        CHECK (recovery_generation >= 0)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_installed_devices_profile_status_idx
      ON helix_installed_devices (profile_id, status, updated_at DESC);
    `);
  },
};

