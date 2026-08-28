import type { Migration } from "./migration";

export const migration067: Migration = {
  id: "067_live_acceptance_archives",
  description:
    "Add immutable sanitized archives for completed Robinhood attended-live acceptance canaries",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_live_acceptance_archives (
        archive_id text PRIMARY KEY,
        owner_profile_id text NOT NULL
          REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        connection_id text NOT NULL
          REFERENCES helix_brokerage_connections(connection_id) ON DELETE CASCADE,
        room_id text NOT NULL
          REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        control_id text NOT NULL
          REFERENCES helix_live_trading_controls(control_id) ON DELETE CASCADE,
        evidence_hash text NOT NULL,
        evidence_json jsonb NOT NULL,
        reconciled_filled_entry_count integer NOT NULL,
        reconciled_filled_exit_count integer NOT NULL,
        unresolved_live_exposure_count integer NOT NULL,
        status text NOT NULL DEFAULT 'accepted',
        accepted_at timestamptz NOT NULL,
        CHECK (evidence_hash LIKE 'sha256:%'),
        CHECK (reconciled_filled_entry_count > 0),
        CHECK (reconciled_filled_exit_count > 0),
        CHECK (unresolved_live_exposure_count = 0),
        CHECK (status = 'accepted'),
        UNIQUE (owner_profile_id, control_id, evidence_hash)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_live_acceptance_archives_lookup_idx
      ON helix_live_acceptance_archives
        (owner_profile_id, connection_id, room_id, accepted_at DESC);
    `);
  },
};
