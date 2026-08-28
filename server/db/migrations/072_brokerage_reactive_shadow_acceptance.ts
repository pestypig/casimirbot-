import type { Migration } from "./migration";

export const migration072: Migration = {
  id: "072_brokerage_reactive_shadow_acceptance",
  description:
    "Archive immutable multi-session brokerage live-shadow acceptance evidence",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_brokerage_reactive_shadow_acceptance_archives (
        archive_id text PRIMARY KEY,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        connection_id text NOT NULL REFERENCES helix_brokerage_connections(connection_id) ON DELETE CASCADE,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        evidence_hash text NOT NULL,
        evidence_json jsonb NOT NULL,
        status text NOT NULL,
        qualified_at timestamptz NOT NULL,
        CHECK (evidence_hash LIKE 'sha256:%'),
        CHECK (status = 'qualified'),
        UNIQUE (owner_profile_id, connection_id, room_id, evidence_hash)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_brokerage_reactive_shadow_acceptance_latest_idx
      ON helix_brokerage_reactive_shadow_acceptance_archives (
        owner_profile_id, connection_id, room_id, qualified_at DESC
      );
    `);
  },
};
