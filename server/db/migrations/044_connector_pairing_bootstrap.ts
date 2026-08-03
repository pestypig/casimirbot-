import type { Migration } from "./migration";

export const migration044: Migration = {
  id: "044_connector_pairing_bootstrap",
  description:
    "Add owner-issued, one-time connector bootstrap pairing codes over canonical room-source bindings",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_connector_pairing_codes (
        pairing_id text PRIMARY KEY,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        binding_id text NOT NULL REFERENCES helix_room_source_bindings(binding_id) ON DELETE CASCADE,
        purpose text NOT NULL,
        domain_adapter text NOT NULL,
        world_id text NOT NULL,
        source_label text NOT NULL,
        code_hash text NOT NULL UNIQUE,
        create_idempotency_key_hash text NOT NULL,
        create_request_hash text NOT NULL,
        redemption_nonce_hash text,
        redeemed_credential_id text REFERENCES helix_room_source_credentials(credential_id) ON DELETE SET NULL,
        connector_kind text,
        connector_version text,
        status text NOT NULL DEFAULT 'pending',
        attempt_count integer NOT NULL DEFAULT 0,
        credential_ttl_ms integer NOT NULL,
        expires_at timestamptz NOT NULL,
        replay_expires_at timestamptz,
        redeemed_at timestamptz,
        revoked_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (purpose IN ('create', 'rotate')),
        CHECK (status IN ('pending', 'redeemed', 'expired', 'revoked')),
        CHECK (code_hash LIKE 'sha256:%'),
        CHECK (create_idempotency_key_hash LIKE 'sha256:%'),
        CHECK (create_request_hash LIKE 'sha256:%'),
        CHECK (redemption_nonce_hash IS NULL OR redemption_nonce_hash LIKE 'sha256:%'),
        CHECK (attempt_count >= 0 AND attempt_count <= 32),
        CHECK (credential_ttl_ms > 0 AND credential_ttl_ms <= 2592000000),
        CHECK (
          (status = 'redeemed' AND redemption_nonce_hash IS NOT NULL AND redeemed_at IS NOT NULL) OR
          status <> 'redeemed'
        )
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_connector_pairing_codes_idempotency_idx
      ON helix_connector_pairing_codes (owner_profile_id, room_id, create_idempotency_key_hash);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_connector_pairing_codes_room_idx
      ON helix_connector_pairing_codes (room_id, created_at DESC);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_connector_pairing_codes_pending_idx
      ON helix_connector_pairing_codes (code_hash, expires_at)
      WHERE status IN ('pending', 'redeemed');
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_connector_pairing_codes_pending_binding_idx
      ON helix_connector_pairing_codes (binding_id)
      WHERE status = 'pending';
    `);
  },
};
