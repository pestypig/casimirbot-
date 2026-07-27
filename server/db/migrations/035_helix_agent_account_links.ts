import type { Migration } from "./migration";

export const migration035: Migration = {
  id: "035_helix_agent_account_links",
  description:
    "Add one-time OAuth account-link intents and agent-binding lifecycle fields",
  run: async (client) => {
    await client.query(`
      ALTER TABLE helix_agent_account_bindings
      ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
    `);
    await client.query(`
      ALTER TABLE helix_agent_account_bindings
      ADD COLUMN IF NOT EXISTS revoked_reason text;
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_account_linked_providers_exact_idx
      ON helix_account_linked_providers(
        provider,
        provider_subject,
        profile_id
      );
    `);
    await client.query(`
      ALTER TABLE helix_agent_account_bindings
      ADD CONSTRAINT helix_agent_account_bindings_linked_provider_fk
      FOREIGN KEY (
        provider,
        provider_subject,
        profile_id
      )
      REFERENCES helix_account_linked_providers(
        provider,
        provider_subject,
        profile_id
      )
      ON DELETE CASCADE;
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_agent_account_link_intents (
        intent_id text PRIMARY KEY,
        state_hash text NOT NULL UNIQUE,
        profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        session_id text NOT NULL REFERENCES helix_account_sessions(session_id) ON DELETE CASCADE,
        expected_issuer text NOT NULL,
        expected_audience text NOT NULL,
        expected_provider text NOT NULL,
        status text NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
        created_at timestamptz NOT NULL,
        expires_at timestamptz NOT NULL,
        completed_at timestamptz,
        cancelled_at timestamptz
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_agent_account_link_intents_session_idx
      ON helix_agent_account_link_intents(
        profile_id,
        session_id,
        status,
        expires_at
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_agent_account_link_intents_expiry_idx
      ON helix_agent_account_link_intents(expires_at);
    `);
  },
};
