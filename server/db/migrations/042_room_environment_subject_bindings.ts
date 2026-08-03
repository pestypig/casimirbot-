import type { Migration } from "./migration";

export const migration042: Migration = {
  id: "042_room_environment_subject_bindings",
  description:
    "Persist participant-scoped environment subjects and freeze exact subject provenance on probes",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_room_environment_subject_bindings (
        subject_binding_id text PRIMARY KEY,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        participant_id text NOT NULL REFERENCES helix_shared_realtime_room_members(participant_id) ON DELETE CASCADE,
        profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        environment_binding_id text NOT NULL REFERENCES helix_environment_connector_bindings(environment_binding_id) ON DELETE CASCADE,
        room_source_binding_id text NOT NULL REFERENCES helix_room_source_bindings(binding_id) ON DELETE CASCADE,
        source_id text NOT NULL,
        world_id text NOT NULL,
        subject_kind text NOT NULL,
        subject_ref text NOT NULL,
        subject_native_id text NOT NULL,
        subject_label text NOT NULL,
        verification_method text NOT NULL,
        confidence double precision NOT NULL,
        status text NOT NULL DEFAULT 'active',
        producer_epoch_ref text NOT NULL,
        verified_at timestamptz NOT NULL DEFAULT now(),
        last_confirmed_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        revoked_at timestamptz,
        CHECK (verification_method IN ('self_claim', 'owner_assigned', 'connector_challenge', 'server_auth')),
        CHECK (confidence >= 0 AND confidence <= 1),
        CHECK (status IN ('active', 'stale', 'revoked'))
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_room_environment_subject_bindings_participant_active_idx
      ON helix_room_environment_subject_bindings (
        room_id,
        environment_binding_id,
        participant_id
      )
      WHERE status = 'active';
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_room_environment_subject_bindings_subject_active_idx
      ON helix_room_environment_subject_bindings (
        environment_binding_id,
        subject_native_id
      )
      WHERE status = 'active';
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_room_environment_subject_bindings_room_idx
      ON helix_room_environment_subject_bindings (room_id, updated_at DESC);
    `);
    await client.query(`
      ALTER TABLE helix_environment_probe_requests
      ADD COLUMN requesting_participant_id text
      REFERENCES helix_shared_realtime_room_members(participant_id)
      ON DELETE SET NULL;
    `);
    await client.query(`
      ALTER TABLE helix_environment_probe_requests
      ADD COLUMN resolved_subject_binding_id text
      REFERENCES helix_room_environment_subject_bindings(subject_binding_id)
      ON DELETE SET NULL;
    `);
    await client.query(`
      ALTER TABLE helix_environment_probe_requests
      ADD COLUMN resolved_subject_native_id text;
    `);
    await client.query(`
      ALTER TABLE helix_environment_probe_requests
      ADD CONSTRAINT helix_environment_probe_requests_subject_resolution_ck
      CHECK (
        (resolved_subject_binding_id IS NULL AND resolved_subject_native_id IS NULL)
        OR
        (resolved_subject_binding_id IS NOT NULL AND resolved_subject_native_id IS NOT NULL)
      );
    `);
  },
};
