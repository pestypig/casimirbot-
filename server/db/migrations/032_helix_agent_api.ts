import type { Migration } from "./migration";

export const migration032: Migration = {
  id: "032_helix_agent_api",
  description:
    "Add tenant-owned durable agent runs, events, and idempotency receipts",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_agent_runs (
        run_id text PRIMARY KEY,
        schema_version text NOT NULL,
        tenant_id text NOT NULL,
        issuer text NOT NULL,
        subject_id text NOT NULL,
        account_profile_id text NOT NULL,
        objective text NOT NULL,
        objective_hash text NOT NULL,
        runtime_provider text NOT NULL,
        provider_goal_id text NOT NULL,
        provider_thread_id text NOT NULL,
        provider_session_id text NOT NULL,
        lifecycle_status text NOT NULL,
        completion_status text NOT NULL,
        terminal_authority_status text NOT NULL,
        version bigint NOT NULL DEFAULT 1,
        configuration jsonb NOT NULL,
        evidence_bundle jsonb NOT NULL,
        runtime_snapshot jsonb,
        latest_result jsonb,
        latest_summary text,
        unresolved_requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
        contradictions jsonb NOT NULL DEFAULT '[]'::jsonb,
        pending_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
        max_steps integer NOT NULL,
        steps_used integer NOT NULL DEFAULT 0,
        active_operation_id text,
        operation_started_at timestamptz,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL,
        completed_at timestamptz,
        cancelled_at timestamptz
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_agent_runs_owner_updated_idx
      ON helix_agent_runs(
        tenant_id,
        issuer,
        subject_id,
        account_profile_id,
        updated_at DESC
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_agent_runs_expiry_idx
      ON helix_agent_runs(expires_at);
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_agent_runs_provider_goal_idx
      ON helix_agent_runs(provider_goal_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_agent_account_bindings (
        issuer text NOT NULL,
        tenant_id text NOT NULL,
        provider text NOT NULL,
        provider_subject text NOT NULL,
        profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        revoked_at timestamptz,
        PRIMARY KEY (
          issuer,
          tenant_id,
          provider,
          provider_subject
        )
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_agent_account_bindings_profile_idx
      ON helix_agent_account_bindings(profile_id, tenant_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_agent_api_events (
        seq bigint NOT NULL,
        event_id text NOT NULL UNIQUE,
        run_id text NOT NULL REFERENCES helix_agent_runs(run_id) ON DELETE CASCADE,
        event_type text NOT NULL,
        payload jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL,
        PRIMARY KEY (run_id, seq)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_agent_api_events_run_seq_idx
      ON helix_agent_api_events(run_id, seq);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_agent_api_requests (
        tenant_id text NOT NULL,
        issuer text NOT NULL,
        subject_id text NOT NULL,
        account_profile_id text NOT NULL,
        operation text NOT NULL,
        idempotency_key_hash text NOT NULL,
        request_hash text NOT NULL,
        state text NOT NULL,
        proposed_run_id text,
        run_id text REFERENCES helix_agent_runs(run_id) ON DELETE SET NULL,
        response_status integer,
        response_receipt jsonb,
        lease_expires_at timestamptz NOT NULL,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL,
        PRIMARY KEY (
          tenant_id,
          issuer,
          subject_id,
          account_profile_id,
          operation,
          idempotency_key_hash
        )
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_agent_api_requests_expiry_idx
      ON helix_agent_api_requests(expires_at);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_agent_api_requests_run_idx
      ON helix_agent_api_requests(run_id, updated_at DESC);
    `);
  },
};
