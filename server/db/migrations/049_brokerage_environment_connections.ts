import type { Migration } from "./migration";

export const migration049: Migration = {
  id: "049_brokerage_environment_connections",
  description:
    "Add owner-scoped Robinhood OAuth connections and fail-closed private-room brokerage bindings",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_brokerage_oauth_transactions (
        transaction_id text PRIMARY KEY,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        provider text NOT NULL,
        state_hash text NOT NULL UNIQUE,
        encrypted_code_verifier text NOT NULL,
        encryption_key_id text NOT NULL,
        encryption_algorithm text NOT NULL,
        oauth_client_id text NOT NULL,
        resource_url text NOT NULL,
        authorization_endpoint text NOT NULL,
        token_endpoint text NOT NULL,
        redirect_uri text NOT NULL,
        requested_scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
        status text NOT NULL DEFAULT 'pending',
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        completed_at timestamptz,
        CHECK (provider IN ('robinhood')),
        CHECK (state_hash LIKE 'sha256:%'),
        CHECK (encryption_algorithm = 'aes-256-gcm'),
        CHECK (status IN ('pending', 'completed', 'expired', 'failed'))
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_brokerage_oauth_transactions_owner_idx
      ON helix_brokerage_oauth_transactions (owner_profile_id, created_at DESC);
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_brokerage_connections (
        connection_id text PRIMARY KEY,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        provider text NOT NULL,
        environment_domain text NOT NULL DEFAULT 'brokerage',
        resource_url text NOT NULL,
        oauth_issuer text NOT NULL,
        oauth_client_id text NOT NULL,
        encrypted_credential_bundle text NOT NULL,
        encryption_key_id text NOT NULL,
        encryption_algorithm text NOT NULL,
        credential_expires_at timestamptz,
        account_selection_status text NOT NULL DEFAULT 'pending',
        provider_account_ref_hash text,
        provider_account_label text,
        granted_capability_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
        producer_epoch_ref text NOT NULL,
        status text NOT NULL DEFAULT 'connected',
        connected_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        revoked_at timestamptz,
        CHECK (provider IN ('robinhood')),
        CHECK (environment_domain = 'brokerage'),
        CHECK (encryption_algorithm = 'aes-256-gcm'),
        CHECK (account_selection_status IN ('pending', 'agentic_selected')),
        CHECK (provider_account_ref_hash IS NULL OR provider_account_ref_hash LIKE 'sha256:%'),
        CHECK (status IN ('connected', 'suspended', 'error', 'revoked'))
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_brokerage_connections_owner_idx
      ON helix_brokerage_connections (owner_profile_id, connected_at DESC);
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_brokerage_room_bindings (
        binding_id text PRIMARY KEY,
        connection_id text NOT NULL REFERENCES helix_brokerage_connections(connection_id) ON DELETE CASCADE,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        consent_capability_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
        private_only boolean NOT NULL DEFAULT true,
        status text NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        revoked_at timestamptz,
        CHECK (private_only = true),
        CHECK (status IN ('active', 'suspended', 'revoked'))
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_brokerage_room_bindings_active_idx
      ON helix_brokerage_room_bindings (connection_id, room_id)
      WHERE status = 'active';
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_brokerage_room_bindings_room_idx
      ON helix_brokerage_room_bindings (owner_profile_id, room_id, updated_at DESC);
    `);
  },
};

