import type { Migration } from "./migration";

export const migration046: Migration = {
  id: "046_environment_action_plane",
  description:
    "Add separately paired player-action authority, connector manifests, bounded workflows, controls, results, and provenance-preserving environment event state",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_action_authorities (
        action_authority_id text PRIMARY KEY,
        environment_binding_id text NOT NULL REFERENCES helix_environment_connector_bindings(environment_binding_id) ON DELETE CASCADE,
        room_source_binding_id text NOT NULL REFERENCES helix_room_source_bindings(binding_id) ON DELETE CASCADE,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        source_id text NOT NULL,
        world_id text NOT NULL,
        adapter_profile_id text NOT NULL,
        domain_adapter text NOT NULL,
        participant_id text NOT NULL REFERENCES helix_shared_realtime_room_members(participant_id) ON DELETE CASCADE,
        subject_binding_id text NOT NULL REFERENCES helix_room_environment_subject_bindings(subject_binding_id) ON DELETE CASCADE,
        subject_native_id text NOT NULL,
        allowed_capability_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
        autonomy_mode text NOT NULL DEFAULT 'approve_each',
        manual_override_policy text NOT NULL DEFAULT 'cancel',
        policy_version integer NOT NULL DEFAULT 1,
        status text NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz,
        revoked_at timestamptz,
        CHECK (autonomy_mode IN ('approve_each', 'approved_capabilities', 'autonomous')),
        CHECK (manual_override_policy IN ('pause', 'cancel')),
        CHECK (policy_version > 0),
        CHECK (status IN ('active', 'suspended', 'revoked', 'expired'))
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_environment_action_authorities_active_idx
      ON helix_environment_action_authorities (
        environment_binding_id, participant_id, subject_binding_id
      ) WHERE status = 'active';
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_action_connector_credentials (
        action_credential_id text PRIMARY KEY,
        action_authority_id text NOT NULL REFERENCES helix_environment_action_authorities(action_authority_id) ON DELETE CASCADE,
        environment_binding_id text NOT NULL REFERENCES helix_environment_connector_bindings(environment_binding_id) ON DELETE CASCADE,
        connector_installation_id text NOT NULL,
        bootstrap_pairing_id text,
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
      CREATE UNIQUE INDEX IF NOT EXISTS helix_environment_action_connector_credentials_active_idx
      ON helix_environment_action_connector_credentials (action_authority_id)
      WHERE status = 'active';
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_environment_action_connector_credentials_pairing_idx
      ON helix_environment_action_connector_credentials (bootstrap_pairing_id)
      WHERE bootstrap_pairing_id IS NOT NULL;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_action_connector_manifests (
        manifest_id text PRIMARY KEY,
        action_authority_id text NOT NULL REFERENCES helix_environment_action_authorities(action_authority_id) ON DELETE CASCADE,
        environment_binding_id text NOT NULL REFERENCES helix_environment_connector_bindings(environment_binding_id) ON DELETE CASCADE,
        connector_installation_id text NOT NULL,
        producer_epoch_ref text NOT NULL,
        room_id text NOT NULL,
        source_id text NOT NULL,
        world_id text NOT NULL,
        participant_id text NOT NULL,
        subject_binding_id text NOT NULL,
        subject_native_id text NOT NULL,
        domain text NOT NULL,
        domain_adapter text NOT NULL,
        adapter_profile_id text NOT NULL,
        adapter_version text NOT NULL,
        protocol_version text NOT NULL,
        manifest_hash text NOT NULL,
        capabilities jsonb NOT NULL,
        available_control_engines jsonb NOT NULL,
        safety_policy jsonb NOT NULL,
        status text NOT NULL DEFAULT 'active',
        received_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz,
        CHECK (manifest_hash LIKE 'sha256:%'),
        CHECK (status IN ('active', 'superseded', 'stale', 'revoked')),
        UNIQUE (action_authority_id, producer_epoch_ref, manifest_hash)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_action_connector_manifests_current_idx
      ON helix_environment_action_connector_manifests (
        action_authority_id, received_at DESC
      ) WHERE status = 'active';
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_action_connector_heartbeats (
        heartbeat_id text PRIMARY KEY,
        manifest_id text NOT NULL REFERENCES helix_environment_action_connector_manifests(manifest_id) ON DELETE CASCADE,
        action_authority_id text NOT NULL REFERENCES helix_environment_action_authorities(action_authority_id) ON DELETE CASCADE,
        connector_installation_id text NOT NULL,
        producer_epoch_ref text NOT NULL,
        status text NOT NULL,
        active_workflow_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
        controls_asserted boolean NOT NULL,
        manual_input_detected boolean NOT NULL,
        emergency_stop_latched boolean NOT NULL,
        control_engines jsonb NOT NULL,
        latest_event_sequence integer,
        payload_hash text NOT NULL,
        created_at timestamptz NOT NULL,
        received_at timestamptz NOT NULL DEFAULT now(),
        CHECK (status IN ('active', 'degraded', 'paused', 'stale', 'error')),
        CHECK (latest_event_sequence IS NULL OR latest_event_sequence >= 0),
        CHECK (payload_hash LIKE 'sha256:%'),
        CHECK (NOT emergency_stop_latched OR NOT controls_asserted)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_action_connector_heartbeats_latest_idx
      ON helix_environment_action_connector_heartbeats (
        action_authority_id, received_at DESC
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_action_requests (
        action_request_id text PRIMARY KEY,
        workflow_id text NOT NULL UNIQUE,
        action_authority_id text NOT NULL REFERENCES helix_environment_action_authorities(action_authority_id),
        connector_manifest_id text NOT NULL REFERENCES helix_environment_action_connector_manifests(manifest_id),
        catalog_snapshot_id text NOT NULL REFERENCES helix_environment_capability_catalog_snapshots(catalog_snapshot_id),
        environment_binding_id text NOT NULL REFERENCES helix_environment_connector_bindings(environment_binding_id),
        room_id text NOT NULL,
        source_id text NOT NULL,
        world_id text NOT NULL,
        participant_id text NOT NULL,
        subject_binding_id text NOT NULL REFERENCES helix_room_environment_subject_bindings(subject_binding_id),
        subject_native_id text NOT NULL,
        run_id text NOT NULL,
        turn_id text NOT NULL,
        provider_execution_id text NOT NULL,
        tool_call_id text NOT NULL,
        capability_id text NOT NULL,
        capability_version integer NOT NULL,
        action_kind text NOT NULL,
        effect_class text NOT NULL,
        workflow_mode text NOT NULL,
        requested_control_engine text NOT NULL,
        request_payload jsonb NOT NULL,
        request_hash text NOT NULL,
        idempotency_key text NOT NULL,
        confirmation_state text NOT NULL,
        approval_ref text,
        policy_version integer NOT NULL,
        status text NOT NULL DEFAULT 'queued',
        attempt_count integer NOT NULL DEFAULT 0,
        deadline_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        leased_at timestamptz,
        lease_expires_at timestamptz,
        completed_at timestamptz,
        cancellation_reason text,
        CHECK (capability_version > 0),
        CHECK (effect_class IN ('player_motion', 'player_interaction', 'player_inventory', 'world_mutation', 'continuous_control')),
        CHECK (workflow_mode IN ('single_action', 'long_running')),
        CHECK (requested_control_engine IN ('adapter_selected', 'native_fabric', 'baritone')),
        CHECK (confirmation_state IN ('not_required', 'pending', 'approved', 'rejected')),
        CHECK (policy_version > 0),
        CHECK (status IN ('queued', 'admitted', 'leased', 'running', 'paused_manual_override', 'cancel_requested', 'canceled', 'succeeded', 'failed', 'timed_out', 'emergency_stopped', 'connector_offline', 'authority_stale')),
        CHECK (attempt_count >= 0),
        CHECK (request_hash LIKE 'sha256:%'),
        UNIQUE (action_authority_id, idempotency_key),
        UNIQUE (run_id, turn_id, tool_call_id)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_action_requests_pending_idx
      ON helix_environment_action_requests (action_authority_id, created_at)
      WHERE status IN ('queued', 'admitted', 'leased', 'running', 'cancel_requested');
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_action_workflow_events (
        event_id text PRIMARY KEY,
        action_request_id text NOT NULL REFERENCES helix_environment_action_requests(action_request_id) ON DELETE CASCADE,
        workflow_id text NOT NULL,
        sequence integer NOT NULL,
        event_type text NOT NULL,
        workflow_state text NOT NULL,
        event_payload jsonb NOT NULL,
        event_hash text NOT NULL,
        producer_epoch_ref text NOT NULL,
        created_at timestamptz NOT NULL,
        received_at timestamptz NOT NULL DEFAULT now(),
        CHECK (sequence >= 0),
        CHECK (event_hash LIKE 'sha256:%'),
        CHECK (workflow_state IN ('queued', 'admitted', 'running', 'paused_manual_override', 'cancel_requested', 'canceled', 'succeeded', 'failed', 'timed_out', 'emergency_stopped', 'connector_offline', 'authority_stale')),
        UNIQUE (workflow_id, sequence),
        UNIQUE (action_request_id, event_hash)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_action_results (
        action_result_id text PRIMARY KEY,
        action_request_id text NOT NULL REFERENCES helix_environment_action_requests(action_request_id) ON DELETE CASCADE,
        workflow_id text NOT NULL,
        action_execution_id text NOT NULL UNIQUE,
        capability_id text NOT NULL,
        capability_version integer NOT NULL,
        action_kind text NOT NULL,
        outcome text NOT NULL,
        result_payload jsonb NOT NULL,
        submitted_result_hash text NOT NULL,
        result_hash text NOT NULL,
        controls_released boolean NOT NULL,
        host_access_performed boolean NOT NULL DEFAULT false,
        automatic_replay_performed boolean NOT NULL DEFAULT false,
        provenance_valid boolean NOT NULL,
        eligible_for_current_turn_reentry boolean NOT NULL,
        completed_at timestamptz NOT NULL,
        received_at timestamptz NOT NULL DEFAULT now(),
        CHECK (capability_version > 0),
        CHECK (submitted_result_hash LIKE 'sha256:%'),
        CHECK (result_hash LIKE 'sha256:%'),
        CHECK (controls_released),
        CHECK (NOT host_access_performed),
        CHECK (NOT automatic_replay_performed),
        UNIQUE (action_request_id, result_hash)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_action_control_requests (
        control_request_id text PRIMARY KEY,
        action_authority_id text NOT NULL REFERENCES helix_environment_action_authorities(action_authority_id) ON DELETE CASCADE,
        workflow_id text,
        control_kind text NOT NULL,
        request_payload jsonb NOT NULL,
        request_hash text NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        deadline_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        leased_at timestamptz,
        lease_expires_at timestamptz,
        completed_at timestamptz,
        CHECK (control_kind IN ('status', 'resume', 'cancel', 'emergency_stop')),
        CHECK (request_hash LIKE 'sha256:%'),
        CHECK (status IN ('pending', 'leased', 'completed', 'failed', 'expired'))
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_action_control_requests_pending_idx
      ON helix_environment_action_control_requests (action_authority_id, created_at)
      WHERE status IN ('pending', 'leased');
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_action_control_results (
        control_result_id text PRIMARY KEY,
        control_request_id text NOT NULL REFERENCES helix_environment_action_control_requests(control_request_id) ON DELETE CASCADE,
        result_payload jsonb NOT NULL,
        submitted_result_hash text NOT NULL,
        result_hash text NOT NULL,
        controls_released boolean NOT NULL,
        provenance_valid boolean NOT NULL,
        eligible_for_current_turn_reentry boolean NOT NULL,
        received_at timestamptz NOT NULL DEFAULT now(),
        CHECK (submitted_result_hash LIKE 'sha256:%'),
        CHECK (result_hash LIKE 'sha256:%'),
        UNIQUE (control_request_id, result_hash)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_event_batches (
        batch_id text PRIMARY KEY,
        environment_binding_id text NOT NULL REFERENCES helix_environment_connector_bindings(environment_binding_id) ON DELETE CASCADE,
        connector_manifest_id text REFERENCES helix_environment_action_connector_manifests(manifest_id) ON DELETE SET NULL,
        room_id text NOT NULL,
        source_id text NOT NULL,
        world_id text NOT NULL,
        producer_epoch_ref text NOT NULL,
        producer_plane text NOT NULL,
        first_sequence integer NOT NULL,
        last_sequence integer NOT NULL,
        batch_hash text NOT NULL,
        created_at timestamptz NOT NULL,
        received_at timestamptz NOT NULL DEFAULT now(),
        CHECK (first_sequence >= 0),
        CHECK (last_sequence >= first_sequence),
        CHECK (producer_plane IN ('world_authority', 'player_embodiment')),
        CHECK (batch_hash LIKE 'sha256:%'),
        UNIQUE (environment_binding_id, producer_epoch_ref, batch_hash)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_events (
        event_id text PRIMARY KEY,
        batch_id text NOT NULL REFERENCES helix_environment_event_batches(batch_id) ON DELETE CASCADE,
        environment_binding_id text NOT NULL REFERENCES helix_environment_connector_bindings(environment_binding_id) ON DELETE CASCADE,
        producer_epoch_ref text NOT NULL,
        producer_plane text NOT NULL,
        sequence integer NOT NULL,
        event_type text NOT NULL,
        subject_ref text,
        workflow_ref text,
        provenance text NOT NULL,
        event_payload jsonb NOT NULL,
        event_hash text NOT NULL,
        occurred_at timestamptz NOT NULL,
        observed_at timestamptz NOT NULL,
        CHECK (sequence >= 0),
        CHECK (producer_plane IN ('world_authority', 'player_embodiment')),
        CHECK (provenance IN ('measured', 'reported', 'derived')),
        CHECK (event_hash LIKE 'sha256:%'),
        UNIQUE (environment_binding_id, producer_epoch_ref, sequence),
        UNIQUE (batch_id, event_hash)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_situation_digests (
        digest_id text PRIMARY KEY,
        environment_binding_id text NOT NULL REFERENCES helix_environment_connector_bindings(environment_binding_id) ON DELETE CASCADE,
        room_id text NOT NULL,
        source_id text NOT NULL,
        world_id text NOT NULL,
        producer_epoch_ref text NOT NULL,
        producer_plane text NOT NULL,
        subject_ref text,
        window_started_at timestamptz NOT NULL,
        window_ended_at timestamptz NOT NULL,
        latest_event_sequence integer NOT NULL,
        digest_payload jsonb NOT NULL,
        digest_hash text NOT NULL,
        provenance_valid boolean NOT NULL,
        observed_at timestamptz NOT NULL,
        CHECK (window_ended_at >= window_started_at),
        CHECK (latest_event_sequence >= 0),
        CHECK (producer_plane IN ('world_authority', 'player_embodiment')),
        CHECK (digest_hash LIKE 'sha256:%'),
        UNIQUE (environment_binding_id, producer_epoch_ref, digest_hash)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_events_subject_sequence_idx
      ON helix_environment_events (
        environment_binding_id, producer_epoch_ref, subject_ref, sequence DESC
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_situation_digests_latest_idx
      ON helix_environment_situation_digests (
        environment_binding_id, subject_ref, observed_at DESC
      );
    `);
    await client.query(`
      ALTER TABLE helix_connector_pairing_codes
      ADD COLUMN IF NOT EXISTS action_credential_requested boolean NOT NULL DEFAULT false;
    `);
    await client.query(`
      ALTER TABLE helix_connector_pairing_codes
      ADD COLUMN IF NOT EXISTS action_authority_id text
      REFERENCES helix_environment_action_authorities(action_authority_id)
      ON DELETE SET NULL;
    `);
    await client.query(`
      ALTER TABLE helix_connector_pairing_codes
      ADD COLUMN IF NOT EXISTS action_connector_installation_id text;
    `);
  },
};
