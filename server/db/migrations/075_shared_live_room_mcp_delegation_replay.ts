import type { Migration } from "./migration";

export const migration075: Migration = {
  id: "075_shared_live_room_mcp_delegation_replay",
  description: "Add the durable one-time Shared Live Room MCP delegation replay ledger",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_shared_live_room_mcp_delegation_replay_claims (
        receipt_id varchar(256) PRIMARY KEY,
        request_id varchar(256) NOT NULL UNIQUE,
        issuer varchar(2048) NOT NULL,
        key_id varchar(256) NOT NULL,
        binding_sha256 varchar(64) NOT NULL,
        artifact_sha256 varchar(64) NOT NULL,
        signed_payload_sha256 varchar(64) NOT NULL,
        delegated_at timestamptz NOT NULL,
        expires_at timestamptz NOT NULL,
        consumed_at timestamptz NOT NULL DEFAULT now(),
        CHECK (expires_at >= delegated_at)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_shared_live_room_mcp_delegation_replay_expiry_idx
      ON helix_shared_live_room_mcp_delegation_replay_claims(expires_at);
    `);
  },
};
