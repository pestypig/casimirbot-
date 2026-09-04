import type { Migration } from "./migration";

export const migration081: Migration = {
  id: "081_installed_device_full_harness_trust",
  description: "Add revocable profile/device-bound full harness trust",
  run: async (client) => {
    await client.query(`
      ALTER TABLE helix_installed_devices
        ADD COLUMN IF NOT EXISTS full_harness_trusted boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS full_harness_trust_revision integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS full_harness_trusted_at timestamptz,
        ADD COLUMN IF NOT EXISTS full_harness_trust_revoked_at timestamptz,
        ADD COLUMN IF NOT EXISTS full_harness_trusted_by_session_id text;
    `);
    await client.query(`
      ALTER TABLE helix_installed_devices
        DROP CONSTRAINT IF EXISTS helix_installed_devices_full_harness_trust_revision_check;
    `);
    await client.query(`
      ALTER TABLE helix_installed_devices
        ADD CONSTRAINT helix_installed_devices_full_harness_trust_revision_check
        CHECK (full_harness_trust_revision >= 0);
    `);
  },
};
