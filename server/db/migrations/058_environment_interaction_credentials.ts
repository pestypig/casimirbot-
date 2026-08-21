import type { Migration } from "./migration";

export const migration058: Migration = {
  id: "058_environment_interaction_credentials",
  description:
    "Add request-only credentials and idempotent receipts for room-bound environment Ask clients",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_interaction_credentials (
        interaction_credential_id text PRIMARY KEY,
        action_authority_id text NOT NULL REFERENCES helix_environment_action_authorities(action_authority_id) ON DELETE CASCADE,
        environment_binding_id text NOT NULL REFERENCES helix_environment_connector_bindings(environment_binding_id) ON DELETE CASCADE,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        participant_id text NOT NULL REFERENCES helix_shared_realtime_room_members(participant_id) ON DELETE CASCADE,
        subject_binding_id text NOT NULL REFERENCES helix_room_environment_subject_bindings(subject_binding_id) ON DELETE CASCADE,
        subject_native_id text NOT NULL,
        source_id text NOT NULL,
        world_id text NOT NULL,
        connector_installation_id text NOT NULL,
        bootstrap_pairing_id text NOT NULL,
        token_hash text NOT NULL UNIQUE,
        token_prefix text NOT NULL,
        scopes jsonb NOT NULL DEFAULT '["ask.submit","ask.cancel","ask.status"]'::jsonb,
        status text NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz NOT NULL,
        last_used_at timestamptz,
        revoked_at timestamptz,
        CHECK (token_hash LIKE 'sha256:%'),
        CHECK (status IN ('active', 'revoked', 'expired')),
        UNIQUE (bootstrap_pairing_id)
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_environment_interaction_credentials_active_idx
      ON helix_environment_interaction_credentials (action_authority_id)
      WHERE status = 'active';
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_interaction_requests (
        request_id text PRIMARY KEY,
        interaction_credential_id text NOT NULL REFERENCES helix_environment_interaction_credentials(interaction_credential_id) ON DELETE CASCADE,
        idempotency_key_hash text NOT NULL,
        request_hash text NOT NULL,
        turn_id text NOT NULL UNIQUE,
        status text NOT NULL DEFAULT 'running',
        terminal_artifact_kind text,
        terminal_authority_ok boolean NOT NULL DEFAULT false,
        response_json jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        completed_at timestamptz,
        CHECK (idempotency_key_hash LIKE 'sha256:%'),
        CHECK (request_hash LIKE 'sha256:%'),
        CHECK (status IN ('running', 'completed', 'failed', 'canceled')),
        UNIQUE (interaction_credential_id, idempotency_key_hash)
      );
    `);
  },
};
