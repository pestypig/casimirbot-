import type { Migration } from "./migration";

export const migration034: Migration = {
  id: "034_shared_live_room_agent_bindings",
  description:
    "Add durable Agent API room/chat bindings, terminal projections, and credential delivery handles",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_agent_run_room_bindings (
        binding_id text PRIMARY KEY,
        run_id text NOT NULL REFERENCES helix_agent_runs(run_id) ON DELETE CASCADE,
        tenant_id text NOT NULL,
        issuer text NOT NULL,
        subject_id text NOT NULL,
        account_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        authorized_by_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        participant_id_at_bind text NOT NULL,
        member_role_at_bind text NOT NULL,
        consent_version_at_bind bigint NOT NULL,
        consent_receipt_ref_at_bind text,
        status text NOT NULL DEFAULT 'active',
        version bigint NOT NULL DEFAULT 1,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL,
        revoked_at timestamptz,
        revoke_reason text,
        CHECK (status IN ('active', 'revoked')),
        CHECK (member_role_at_bind IN ('owner', 'participant')),
        CHECK (consent_version_at_bind >= 0),
        CHECK (
          (
            consent_version_at_bind = 0
            AND consent_receipt_ref_at_bind IS NULL
          )
          OR
          (
            consent_version_at_bind > 0
            AND consent_receipt_ref_at_bind IS NOT NULL
            AND consent_receipt_ref_at_bind <> ''
          )
        )
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_agent_run_room_bindings_active_run_idx
      ON helix_agent_run_room_bindings(run_id)
      WHERE status = 'active';
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_agent_run_room_bindings_room_idx
      ON helix_agent_run_room_bindings(room_id, updated_at DESC);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_agent_run_room_bindings_owner_idx
      ON helix_agent_run_room_bindings(
        tenant_id,
        issuer,
        subject_id,
        account_profile_id,
        updated_at DESC
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_agent_run_chat_bindings (
        binding_id text PRIMARY KEY,
        browser_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        chat_session_id text NOT NULL,
        claim_handle_hash text NOT NULL UNIQUE,
        claim_expires_at timestamptz NOT NULL,
        run_id text REFERENCES helix_agent_runs(run_id) ON DELETE CASCADE,
        tenant_id text,
        issuer text,
        subject_id text,
        account_profile_id text REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        status text NOT NULL DEFAULT 'pending_claim',
        context_snapshot jsonb,
        context_snapshot_ref text,
        context_message_count integer NOT NULL DEFAULT 0,
        context_char_count integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL,
        claimed_at timestamptz,
        revoked_at timestamptz,
        revoke_reason text,
        CHECK (status IN ('pending_claim', 'active', 'revoked', 'expired')),
        CHECK (context_message_count >= 0),
        CHECK (context_char_count >= 0)
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_agent_run_chat_bindings_active_run_idx
      ON helix_agent_run_chat_bindings(run_id)
      WHERE status = 'active';
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_agent_run_chat_bindings_browser_idx
      ON helix_agent_run_chat_bindings(browser_profile_id, updated_at DESC);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_agent_run_chat_bindings_claim_expiry_idx
      ON helix_agent_run_chat_bindings(status, claim_expires_at);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_agent_chat_terminal_projections (
        projection_id text PRIMARY KEY,
        binding_id text NOT NULL UNIQUE
          REFERENCES helix_agent_run_chat_bindings(binding_id) ON DELETE CASCADE,
        run_id text NOT NULL REFERENCES helix_agent_runs(run_id) ON DELETE CASCADE,
        authority_ref text NOT NULL,
        terminal_text text NOT NULL,
        terminal_text_hash text NOT NULL,
        artifact_kind text NOT NULL,
        supporting_evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
        message_id text NOT NULL UNIQUE,
        projected_at timestamptz NOT NULL,
        UNIQUE (binding_id, authority_ref)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_agent_chat_terminal_projections_run_idx
      ON helix_agent_chat_terminal_projections(run_id, projected_at DESC);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_room_source_credential_deliveries (
        delivery_id text PRIMARY KEY,
        handle_hash text NOT NULL UNIQUE,
        binding_id text NOT NULL
          REFERENCES helix_room_source_bindings(binding_id) ON DELETE CASCADE,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        purpose text NOT NULL,
        credential_ttl_ms bigint NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL,
        expires_at timestamptz NOT NULL,
        claimed_at timestamptz,
        revoked_at timestamptz,
        CHECK (purpose IN ('create', 'rotate')),
        CHECK (
          credential_ttl_ms > 0
          AND credential_ttl_ms <= 2592000000
        ),
        CHECK (status IN (
          'pending',
          'claimed',
          'expired',
          'revoked',
          'outcome_unknown'
        ))
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_room_source_credential_deliveries_owner_idx
      ON helix_room_source_credential_deliveries(owner_profile_id, updated_at DESC);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_room_source_credential_deliveries_expiry_idx
      ON helix_room_source_credential_deliveries(status, expires_at);
    `);
  },
};
