import type { Migration } from "./migration";

export const migration043: Migration = {
  id: "043_environment_command_authority",
  description:
    "Add source-scoped Minecraft command authority, member grants, isolated connector credentials, catalogs, requests, results, and audit events",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_command_authorities (
        command_authority_id text PRIMARY KEY,
        environment_binding_id text NOT NULL REFERENCES helix_environment_connector_bindings(environment_binding_id) ON DELETE CASCADE,
        room_source_binding_id text NOT NULL REFERENCES helix_room_source_bindings(binding_id) ON DELETE CASCADE,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        source_id text NOT NULL,
        world_id text NOT NULL,
        adapter_profile_id text NOT NULL,
        authority_profile text NOT NULL DEFAULT 'observe',
        autonomy_mode text NOT NULL DEFAULT 'approve_each',
        approved_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
        policy_version integer NOT NULL DEFAULT 1,
        status text NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz,
        revoked_at timestamptz,
        CHECK (authority_profile IN ('observe', 'player_assistant', 'world_operator', 'server_administrator')),
        CHECK (autonomy_mode IN ('approve_each', 'approved_categories', 'autonomous')),
        CHECK (policy_version > 0),
        CHECK (status IN ('active', 'suspended', 'revoked', 'expired'))
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_environment_command_authorities_active_idx
      ON helix_environment_command_authorities (environment_binding_id)
      WHERE status = 'active';
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_command_member_grants (
        command_grant_id text PRIMARY KEY,
        command_authority_id text NOT NULL REFERENCES helix_environment_command_authorities(command_authority_id) ON DELETE CASCADE,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        participant_id text NOT NULL REFERENCES helix_shared_realtime_room_members(participant_id) ON DELETE CASCADE,
        profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        environment_binding_id text NOT NULL REFERENCES helix_environment_connector_bindings(environment_binding_id) ON DELETE CASCADE,
        subject_binding_id text REFERENCES helix_room_environment_subject_bindings(subject_binding_id) ON DELETE SET NULL,
        max_authority_profile text NOT NULL DEFAULT 'observe',
        autonomy_override text,
        status text NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz,
        revoked_at timestamptz,
        CHECK (max_authority_profile IN ('observe', 'player_assistant', 'world_operator', 'server_administrator')),
        CHECK (autonomy_override IS NULL OR autonomy_override IN ('approve_each', 'approved_categories', 'autonomous')),
        CHECK (status IN ('active', 'suspended', 'revoked', 'expired'))
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_environment_command_member_grants_active_idx
      ON helix_environment_command_member_grants (command_authority_id, participant_id)
      WHERE status = 'active';
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_command_connector_credentials (
        command_credential_id text PRIMARY KEY,
        command_authority_id text NOT NULL REFERENCES helix_environment_command_authorities(command_authority_id) ON DELETE CASCADE,
        environment_binding_id text NOT NULL REFERENCES helix_environment_connector_bindings(environment_binding_id) ON DELETE CASCADE,
        token_hash text NOT NULL UNIQUE,
        token_prefix text NOT NULL,
        scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
        status text NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz NOT NULL,
        last_used_at timestamptz,
        revoked_at timestamptz,
        CHECK (token_hash LIKE 'sha256:%'),
        CHECK (status IN ('active', 'revoked', 'expired'))
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_environment_command_connector_credentials_active_idx
      ON helix_environment_command_connector_credentials (command_authority_id)
      WHERE status = 'active';
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_command_catalog_snapshots (
        command_catalog_id text PRIMARY KEY,
        command_authority_id text NOT NULL REFERENCES helix_environment_command_authorities(command_authority_id) ON DELETE CASCADE,
        environment_binding_id text NOT NULL REFERENCES helix_environment_connector_bindings(environment_binding_id) ON DELETE CASCADE,
        source_id text NOT NULL,
        world_id text NOT NULL,
        adapter_profile_id text NOT NULL,
        domain_adapter text NOT NULL,
        game_version text NOT NULL,
        producer_epoch_ref text NOT NULL,
        command_tree_hash text NOT NULL,
        root_command_count integer NOT NULL,
        catalog_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
        frozen_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz,
        CHECK (command_tree_hash LIKE 'sha256:%'),
        CHECK (root_command_count >= 0),
        UNIQUE (environment_binding_id, producer_epoch_ref, command_tree_hash)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_command_requests (
        command_request_id text PRIMARY KEY,
        command_authority_id text NOT NULL REFERENCES helix_environment_command_authorities(command_authority_id),
        command_grant_id text NOT NULL REFERENCES helix_environment_command_member_grants(command_grant_id),
        command_catalog_id text NOT NULL REFERENCES helix_environment_command_catalog_snapshots(command_catalog_id),
        environment_binding_id text NOT NULL REFERENCES helix_environment_connector_bindings(environment_binding_id),
        room_id text NOT NULL,
        source_id text NOT NULL,
        world_id text NOT NULL,
        participant_id text NOT NULL,
        subject_binding_id text REFERENCES helix_room_environment_subject_bindings(subject_binding_id) ON DELETE SET NULL,
        subject_native_id text,
        run_id text NOT NULL,
        turn_id text NOT NULL,
        provider_execution_id text NOT NULL,
        tool_call_id text NOT NULL,
        authority_profile text NOT NULL,
        autonomy_mode text NOT NULL,
        approved_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
        policy_version integer NOT NULL,
        command_text text NOT NULL,
        command_hash text NOT NULL,
        command_root_hint text NOT NULL,
        requested_category text NOT NULL,
        expected_effect text NOT NULL,
        idempotency_key text NOT NULL,
        confirmation_state text NOT NULL DEFAULT 'pending',
        approval_ref text,
        status text NOT NULL DEFAULT 'pending',
        attempt_count integer NOT NULL DEFAULT 0,
        deadline_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        leased_at timestamptz,
        lease_expires_at timestamptz,
        completed_at timestamptz,
        cancellation_reason text,
        CHECK (command_hash LIKE 'sha256:%'),
        CHECK (authority_profile IN ('observe', 'player_assistant', 'world_operator', 'server_administrator')),
        CHECK (autonomy_mode IN ('approve_each', 'approved_categories', 'autonomous')),
        CHECK (policy_version > 0),
        CHECK (requested_category IN ('query', 'player_state', 'player_inventory', 'player_movement', 'world_time_weather', 'world_build', 'entity_control', 'server_administration', 'mod_command')),
        CHECK (expected_effect IN ('read_only', 'player_mutation', 'world_mutation', 'server_administration', 'unknown')),
        CHECK (confirmation_state IN ('not_required', 'pending', 'approved', 'rejected')),
        CHECK (status IN ('pending', 'leased', 'succeeded', 'failed', 'rejected', 'expired', 'canceled', 'outcome_unknown')),
        CHECK (attempt_count >= 0),
        UNIQUE (command_authority_id, idempotency_key),
        UNIQUE (run_id, turn_id, tool_call_id)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_command_requests_pending_idx
      ON helix_environment_command_requests (command_authority_id, created_at)
      WHERE status IN ('pending', 'leased');
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_command_results (
        command_result_id text PRIMARY KEY,
        command_request_id text NOT NULL REFERENCES helix_environment_command_requests(command_request_id) ON DELETE CASCADE,
        command_execution_id text NOT NULL UNIQUE,
        command_hash text NOT NULL,
        command_root text NOT NULL,
        parsed_category text NOT NULL,
        effect_class text NOT NULL,
        outcome text NOT NULL,
        result_code integer NOT NULL,
        result_payload jsonb NOT NULL,
        result_hash text NOT NULL,
        side_effects_performed boolean NOT NULL,
        environment_mutation_performed boolean NOT NULL,
        server_administration_performed boolean NOT NULL,
        provenance_valid boolean NOT NULL,
        eligible_for_current_turn_reentry boolean NOT NULL,
        received_at timestamptz NOT NULL DEFAULT now(),
        CHECK (command_hash LIKE 'sha256:%'),
        CHECK (result_hash LIKE 'sha256:%'),
        CHECK (parsed_category IN ('query', 'player_state', 'player_inventory', 'player_movement', 'world_time_weather', 'world_build', 'entity_control', 'server_administration', 'mod_command')),
        CHECK (effect_class IN ('read_only', 'player_mutation', 'world_mutation', 'server_administration', 'unknown')),
        UNIQUE (command_request_id, result_hash)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_command_events (
        event_id text PRIMARY KEY,
        command_authority_id text NOT NULL REFERENCES helix_environment_command_authorities(command_authority_id) ON DELETE CASCADE,
        command_request_id text REFERENCES helix_environment_command_requests(command_request_id) ON DELETE CASCADE,
        event_type text NOT NULL,
        payload jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_command_events_authority_idx
      ON helix_environment_command_events (command_authority_id, created_at DESC);
    `);
  },
};
