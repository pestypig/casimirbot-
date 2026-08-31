import type { Migration } from "./migration";

export const migration074: Migration = {
  id: "074_mcp_evidence_observations",
  description: "Add owner-scoped durable MCP evidence observations",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_mcp_evidence_observations (
        observation_ref text PRIMARY KEY,
        tenant_id text NOT NULL,
        account_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        capability_id text NOT NULL,
        tool_name text NOT NULL,
        observation jsonb NOT NULL,
        payload_sha256 char(71) NOT NULL,
        observed_at timestamptz NOT NULL,
        retained_until timestamptz NOT NULL,
        revoked_at timestamptz,
        revocation_ref text,
        created_at timestamptz NOT NULL DEFAULT now(),
        CHECK ((revoked_at IS NULL AND revocation_ref IS NULL) OR
               (revoked_at IS NOT NULL AND revocation_ref IS NOT NULL))
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_mcp_evidence_owner_retention_idx
      ON helix_mcp_evidence_observations
        (tenant_id, account_profile_id, retained_until DESC);
    `);
  },
};
