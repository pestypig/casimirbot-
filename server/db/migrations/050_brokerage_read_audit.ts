import type { Migration } from "./migration";

export const migration050: Migration = {
  id: "050_brokerage_read_audit",
  description:
    "Add metadata-only audit receipts for governed Robinhood read observations",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_brokerage_read_audit (
        observation_id text PRIMARY KEY,
        connection_id text NOT NULL REFERENCES helix_brokerage_connections(connection_id) ON DELETE CASCADE,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        provider text NOT NULL,
        upstream_tool text NOT NULL,
        capability_id text NOT NULL,
        producer_epoch_ref text NOT NULL,
        status text NOT NULL,
        input_hash text NOT NULL,
        output_hash text,
        redaction_count integer NOT NULL DEFAULT 0,
        truncated boolean NOT NULL DEFAULT false,
        error_code text,
        observed_at timestamptz NOT NULL DEFAULT now(),
        CHECK (provider = 'robinhood'),
        CHECK (status IN ('succeeded', 'failed')),
        CHECK (input_hash LIKE 'sha256:%'),
        CHECK (output_hash IS NULL OR output_hash LIKE 'sha256:%'),
        CHECK (redaction_count >= 0)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_brokerage_read_audit_room_idx
      ON helix_brokerage_read_audit
        (owner_profile_id, room_id, observed_at DESC);
    `);
  },
};
