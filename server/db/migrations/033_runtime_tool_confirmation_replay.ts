import type { Migration } from "./migration";

export const migration033: Migration = {
  id: "033_runtime_tool_confirmation_replay",
  description:
    "Add the durable one-time runtime tool confirmation replay ledger",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_runtime_tool_confirmation_replay_claims (
        receipt_id varchar(256) PRIMARY KEY,
        request_id varchar(256) NOT NULL UNIQUE,
        issuer varchar(2048) NOT NULL,
        key_id varchar(256) NOT NULL,
        binding_sha256 varchar(64) NOT NULL,
        artifact_sha256 varchar(64) NOT NULL,
        signed_payload_sha256 varchar(64) NOT NULL,
        approved_at timestamptz NOT NULL,
        expires_at timestamptz NOT NULL,
        consumed_at timestamptz NOT NULL DEFAULT now(),
        CHECK (receipt_id <> ''),
        CHECK (request_id <> ''),
        CHECK (issuer <> ''),
        CHECK (key_id <> ''),
        CHECK (binding_sha256 <> ''),
        CHECK (artifact_sha256 <> ''),
        CHECK (signed_payload_sha256 <> ''),
        CHECK (expires_at >= approved_at)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_runtime_tool_confirmation_replay_expiry_idx
      ON helix_runtime_tool_confirmation_replay_claims(expires_at);
    `);
  },
};
