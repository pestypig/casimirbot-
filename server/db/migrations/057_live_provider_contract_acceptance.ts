import type { Migration } from "./migration";

export const migration057: Migration = {
  id: "057_live_provider_contract_acceptance",
  description:
    "Add immutable expiring Robinhood MCP catalog acceptance receipts for live trading",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_live_provider_contract_acceptances (
        acceptance_id text PRIMARY KEY,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        connection_id text NOT NULL REFERENCES helix_brokerage_connections(connection_id) ON DELETE CASCADE,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        provider_id text NOT NULL,
        verdict text NOT NULL,
        catalog_hash text NOT NULL,
        gates_json jsonb NOT NULL,
        checked_at timestamptz NOT NULL,
        expires_at timestamptz NOT NULL,
        CHECK (provider_id = 'robinhood'),
        CHECK (verdict IN ('pass','fail')),
        CHECK (catalog_hash LIKE 'sha256:%'),
        CHECK (expires_at > checked_at)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_live_provider_contract_latest_idx
      ON helix_live_provider_contract_acceptances (
        owner_profile_id, connection_id, room_id, checked_at DESC
      );
    `);
  },
};
