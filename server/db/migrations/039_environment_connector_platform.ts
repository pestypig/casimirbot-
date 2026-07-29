import type { Migration } from "./migration";

export const migration039: Migration = {
  id: "039_environment_connector_platform",
  description:
    "Add generic connector inventory, frozen catalogs, durable probe leases, pairing, observations, and directory trust records",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_connector_packages (
        package_version_id text PRIMARY KEY,
        publisher_id text NOT NULL,
        package_id text NOT NULL,
        package_version text NOT NULL,
        content_hash text NOT NULL,
        signature jsonb,
        host_compatibility jsonb NOT NULL DEFAULT '[]'::jsonb,
        capability_descriptors jsonb NOT NULL DEFAULT '[]'::jsonb,
        trust_classification text NOT NULL DEFAULT 'unverified',
        security_review_state text NOT NULL DEFAULT 'not_reviewed',
        lifecycle_status text NOT NULL DEFAULT 'active',
        published_at timestamptz NOT NULL DEFAULT now(),
        withdrawn_at timestamptz,
        CHECK (content_hash LIKE 'sha256:%'),
        CHECK (trust_classification IN ('unverified', 'community', 'verified', 'first_party')),
        CHECK (security_review_state IN ('not_reviewed', 'pending', 'approved', 'rejected')),
        CHECK (lifecycle_status IN ('active', 'deprecated', 'withdrawn', 'revoked')),
        UNIQUE (package_id, package_version),
        UNIQUE (package_id, content_hash)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_connector_installations (
        installation_id text PRIMARY KEY,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        package_version_id text NOT NULL REFERENCES helix_environment_connector_packages(package_version_id),
        granted_capability_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
        status text NOT NULL DEFAULT 'active',
        installed_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        revoked_at timestamptz,
        CHECK (status IN ('active', 'suspended', 'revoked', 'uninstalled'))
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_connector_installations_owner_idx
      ON helix_environment_connector_installations (owner_profile_id, installed_at DESC);
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_connector_devices (
        device_id text PRIMARY KEY,
        installation_id text NOT NULL REFERENCES helix_environment_connector_installations(installation_id) ON DELETE CASCADE,
        device_public_key_hash text NOT NULL,
        credential_ref text,
        producer_epoch_ref text,
        status text NOT NULL DEFAULT 'active',
        health_status text NOT NULL DEFAULT 'unknown',
        last_contact_at timestamptz,
        paired_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        revoked_at timestamptz,
        CHECK (device_public_key_hash LIKE 'sha256:%'),
        CHECK (status IN ('active', 'suspended', 'revoked')),
        CHECK (health_status IN ('unknown', 'online', 'degraded', 'offline')),
        UNIQUE (installation_id, device_public_key_hash)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_connector_bindings (
        environment_binding_id text PRIMARY KEY,
        installation_id text NOT NULL REFERENCES helix_environment_connector_installations(installation_id) ON DELETE CASCADE,
        device_id text NOT NULL REFERENCES helix_environment_connector_devices(device_id) ON DELETE CASCADE,
        room_source_binding_id text NOT NULL REFERENCES helix_room_source_bindings(binding_id) ON DELETE CASCADE,
        adapter_admission_id text NOT NULL REFERENCES helix_environment_adapter_admissions(admission_id) ON DELETE CASCADE,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        room_id text NOT NULL,
        source_id text NOT NULL,
        world_id text NOT NULL,
        status text NOT NULL DEFAULT 'active',
        consent_capability_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        revoked_at timestamptz,
        CHECK (status IN ('active', 'suspended', 'revoked')),
        UNIQUE (installation_id, device_id, room_source_binding_id, adapter_admission_id)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_connector_bindings_identity_idx
      ON helix_environment_connector_bindings (owner_profile_id, room_id, source_id)
      WHERE status = 'active';
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_capability_catalog_snapshots (
        catalog_snapshot_id text PRIMARY KEY,
        environment_binding_id text NOT NULL REFERENCES helix_environment_connector_bindings(environment_binding_id) ON DELETE CASCADE,
        catalog_hash text NOT NULL,
        adapter_profile_id text NOT NULL,
        adapter_profile_version integer NOT NULL,
        adapter_contract_hash text NOT NULL,
        manifest_hash text NOT NULL,
        capability_descriptors jsonb NOT NULL,
        frozen_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz,
        CHECK (catalog_hash LIKE 'sha256:%'),
        CHECK (adapter_contract_hash LIKE 'sha256:%'),
        CHECK (manifest_hash LIKE 'sha256:%'),
        UNIQUE (environment_binding_id, catalog_hash)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_probe_requests (
        probe_request_id text PRIMARY KEY,
        tenant_id text NOT NULL,
        owner_subject_id text NOT NULL,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        run_id text NOT NULL,
        turn_id text NOT NULL,
        provider_execution_id text NOT NULL,
        tool_call_id text NOT NULL,
        catalog_snapshot_id text NOT NULL REFERENCES helix_environment_capability_catalog_snapshots(catalog_snapshot_id),
        room_id text NOT NULL,
        environment_binding_id text NOT NULL REFERENCES helix_environment_connector_bindings(environment_binding_id),
        source_id text NOT NULL,
        device_id text NOT NULL REFERENCES helix_environment_connector_devices(device_id),
        connector_installation_id text NOT NULL REFERENCES helix_environment_connector_installations(installation_id),
        adapter_profile_id text NOT NULL,
        adapter_profile_version integer NOT NULL,
        adapter_contract_hash text NOT NULL,
        manifest_hash text NOT NULL,
        producer_epoch_ref text NOT NULL,
        capability_id text NOT NULL,
        capability_version integer NOT NULL,
        input_schema_hash text NOT NULL,
        output_schema_hash text NOT NULL,
        arguments jsonb NOT NULL,
        arguments_hash text NOT NULL,
        idempotency_key text NOT NULL,
        freshness_requirement_ms integer NOT NULL,
        deadline_at timestamptz NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        cancellation_reason text,
        superseded_by_request_id text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        completed_at timestamptz,
        CHECK (adapter_contract_hash LIKE 'sha256:%'),
        CHECK (manifest_hash LIKE 'sha256:%'),
        CHECK (input_schema_hash LIKE 'sha256:%'),
        CHECK (output_schema_hash LIKE 'sha256:%'),
        CHECK (arguments_hash LIKE 'sha256:%'),
        CHECK (status IN ('pending', 'leased', 'succeeded', 'failed', 'expired', 'canceled', 'superseded')),
        UNIQUE (tenant_id, owner_subject_id, idempotency_key),
        UNIQUE (run_id, turn_id, tool_call_id)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_probe_requests_pending_idx
      ON helix_environment_probe_requests (environment_binding_id, created_at)
      WHERE status IN ('pending', 'leased');
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_probe_attempts (
        probe_attempt_id text PRIMARY KEY,
        probe_request_id text NOT NULL REFERENCES helix_environment_probe_requests(probe_request_id) ON DELETE CASCADE,
        attempt_number integer NOT NULL,
        leased_device_id text NOT NULL REFERENCES helix_environment_connector_devices(device_id),
        lease_token_hash text NOT NULL,
        lease_expires_at timestamptz NOT NULL,
        status text NOT NULL DEFAULT 'leased',
        raw_submission_hash text,
        canonical_result_hash text,
        late_result_disposition text,
        leased_at timestamptz NOT NULL DEFAULT now(),
        submitted_at timestamptz,
        completed_at timestamptz,
        CHECK (attempt_number > 0),
        CHECK (lease_token_hash LIKE 'sha256:%'),
        CHECK (raw_submission_hash IS NULL OR raw_submission_hash LIKE 'sha256:%'),
        CHECK (canonical_result_hash IS NULL OR canonical_result_hash LIKE 'sha256:%'),
        CHECK (status IN ('leased', 'succeeded', 'failed', 'expired', 'canceled', 'conflict')),
        CHECK (
          late_result_disposition IS NULL OR
          late_result_disposition IN (
            'late_after_turn_closed',
            'late_after_timeout',
            'late_after_cancellation',
            'late_after_supersession'
          )
        ),
        UNIQUE (probe_request_id, attempt_number)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_probe_results (
        probe_result_id text PRIMARY KEY,
        probe_request_id text NOT NULL REFERENCES helix_environment_probe_requests(probe_request_id) ON DELETE CASCADE,
        probe_attempt_id text NOT NULL REFERENCES helix_environment_probe_attempts(probe_attempt_id) ON DELETE CASCADE,
        raw_submission_hash text NOT NULL,
        canonical_result_hash text NOT NULL,
        result_payload jsonb NOT NULL,
        provenance_valid boolean NOT NULL,
        eligible_for_current_turn_reentry boolean NOT NULL,
        late_result_disposition text,
        received_at timestamptz NOT NULL DEFAULT now(),
        CHECK (raw_submission_hash LIKE 'sha256:%'),
        CHECK (canonical_result_hash LIKE 'sha256:%'),
        UNIQUE (probe_request_id, canonical_result_hash)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_probe_observations (
        observation_id text PRIMARY KEY,
        probe_request_id text NOT NULL REFERENCES helix_environment_probe_requests(probe_request_id) ON DELETE CASCADE,
        probe_result_id text REFERENCES helix_environment_probe_results(probe_result_id) ON DELETE SET NULL,
        evidence_ref text NOT NULL UNIQUE,
        outcome text NOT NULL,
        normalized_observation jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_probe_events (
        event_id text PRIMARY KEY,
        probe_request_id text NOT NULL REFERENCES helix_environment_probe_requests(probe_request_id) ON DELETE CASCADE,
        event_type text NOT NULL,
        payload jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_probe_events_request_idx
      ON helix_environment_probe_events (probe_request_id, created_at);
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_pairing_sessions (
        pairing_session_id text PRIMARY KEY,
        package_version_id text NOT NULL REFERENCES helix_environment_connector_packages(package_version_id),
        installation_id text REFERENCES helix_environment_connector_installations(installation_id) ON DELETE CASCADE,
        device_public_key text NOT NULL,
        device_public_key_hash text NOT NULL,
        device_nonce_hash text NOT NULL UNIQUE,
        claim_challenge_hash text NOT NULL,
        user_code_hash text NOT NULL,
        requested_capability_ids jsonb NOT NULL,
        approved_capability_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
        approved_room_id text,
        approved_room_source_binding_id text REFERENCES helix_room_source_bindings(binding_id) ON DELETE CASCADE,
        approved_adapter_admission_id text REFERENCES helix_environment_adapter_admissions(admission_id) ON DELETE CASCADE,
        approved_by_profile_id text REFERENCES helix_accounts(profile_id) ON DELETE SET NULL,
        status text NOT NULL DEFAULT 'pending',
        attempt_count integer NOT NULL DEFAULT 0,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        claimed_at timestamptz,
        CHECK (device_public_key_hash LIKE 'sha256:%'),
        CHECK (device_nonce_hash LIKE 'sha256:%'),
        CHECK (claim_challenge_hash LIKE 'sha256:%'),
        CHECK (user_code_hash LIKE 'sha256:%'),
        CHECK (status IN ('pending', 'approved', 'claimed', 'expired', 'revoked'))
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_pairing_sessions_code_idx
      ON helix_environment_pairing_sessions (user_code_hash, expires_at)
      WHERE status IN ('pending', 'approved');
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_connector_device_credentials (
        device_credential_id text PRIMARY KEY,
        device_id text NOT NULL REFERENCES helix_environment_connector_devices(device_id) ON DELETE CASCADE,
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
      CREATE UNIQUE INDEX IF NOT EXISTS helix_environment_connector_device_credentials_active_idx
      ON helix_environment_connector_device_credentials (device_id)
      WHERE status = 'active';
    `);
  },
};
