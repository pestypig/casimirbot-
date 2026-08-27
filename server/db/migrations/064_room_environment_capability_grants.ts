import type { Migration } from "./migration";

export const migration064: Migration = {
  id: "064_room_environment_capability_grants",
  description:
    "Add profile-owned, capability-narrowed, revocable room read grants",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_room_environment_capability_grants (
        grant_id text PRIMARY KEY,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        connection_owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        environment_binding_id text NOT NULL REFERENCES helix_environment_connector_bindings(environment_binding_id) ON DELETE CASCADE,
        installation_id text NOT NULL REFERENCES helix_environment_connector_installations(installation_id) ON DELETE CASCADE,
        device_id text NOT NULL REFERENCES helix_environment_connector_devices(device_id) ON DELETE CASCADE,
        source_id text NOT NULL,
        world_or_site_ref text NOT NULL,
        producer_epoch_ref text NOT NULL,
        capability_ids jsonb NOT NULL,
        grant_mode text NOT NULL DEFAULT 'read',
        status text NOT NULL DEFAULT 'active',
        policy_revision integer NOT NULL DEFAULT 1,
        created_by_participant_id text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz NOT NULL,
        revoked_at timestamptz,
        CHECK (grant_mode = 'read'),
        CHECK (status IN ('active', 'revoked')),
        CHECK (policy_revision > 0)
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_room_environment_capability_grants_active_idx
      ON helix_room_environment_capability_grants (room_id, environment_binding_id)
      WHERE status = 'active';
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_room_environment_capability_grants_room_idx
      ON helix_room_environment_capability_grants (room_id, created_at DESC);
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_room_environment_capability_grant_audit (
        audit_id text PRIMARY KEY,
        grant_id text NOT NULL REFERENCES helix_room_environment_capability_grants(grant_id) ON DELETE CASCADE,
        room_id text NOT NULL,
        requesting_profile_id text NOT NULL,
        requesting_participant_id text NOT NULL,
        capability_id text NOT NULL,
        turn_id text NOT NULL,
        tool_call_id text NOT NULL,
        policy_revision integer NOT NULL,
        outcome text NOT NULL,
        reason_code text,
        created_at timestamptz NOT NULL DEFAULT now(),
        CHECK (outcome IN ('admitted', 'denied'))
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_room_environment_capability_grant_audit_turn_idx
      ON helix_room_environment_capability_grant_audit (turn_id, tool_call_id, created_at);
    `);
  },
};
