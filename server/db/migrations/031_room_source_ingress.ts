import type { Migration } from "./migration";

export const migration031: Migration = {
  id: "031_room_source_ingress",
  description:
    "Add durable, room-scoped credentials for read-only environment ingress",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_room_source_bindings (
        binding_id text PRIMARY KEY,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        source_id text NOT NULL UNIQUE,
        world_id text NOT NULL,
        domain_adapter text NOT NULL,
        source_label text NOT NULL,
        scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
        status text NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        revoked_at timestamptz,
        CHECK (status IN ('active', 'revoked')),
        CHECK (source_id LIKE 'source:room-ingress:%')
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_room_source_credentials (
        credential_id text PRIMARY KEY,
        binding_id text NOT NULL REFERENCES helix_room_source_bindings(binding_id) ON DELETE CASCADE,
        token_hash text NOT NULL UNIQUE,
        token_prefix text NOT NULL,
        status text NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz NOT NULL,
        revoked_at timestamptz,
        CHECK (status IN ('active', 'revoked', 'expired'))
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_room_source_credentials_active_idx
      ON helix_room_source_credentials (binding_id)
      WHERE status = 'active';
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_room_source_ingress_requests (
        binding_id text NOT NULL REFERENCES helix_room_source_bindings(binding_id) ON DELETE CASCADE,
        credential_id text NOT NULL REFERENCES helix_room_source_credentials(credential_id) ON DELETE CASCADE,
        request_id text NOT NULL,
        producer_epoch text NOT NULL,
        sequence_number bigint NOT NULL,
        route_key text NOT NULL,
        body_digest text NOT NULL,
        sent_at timestamptz NOT NULL,
        received_at timestamptz NOT NULL DEFAULT now(),
        response_status integer,
        response_receipt jsonb,
        PRIMARY KEY (binding_id, request_id),
        UNIQUE (binding_id, producer_epoch, sequence_number)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_room_source_bindings_room_idx
      ON helix_room_source_bindings (room_id, updated_at DESC);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_room_source_requests_received_idx
      ON helix_room_source_ingress_requests (binding_id, received_at DESC);
    `);
  },
};
