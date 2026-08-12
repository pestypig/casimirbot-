import type { Migration } from "./migration";

export const migration055: Migration = {
  id: "055_live_protective_exits",
  description:
    "Add separately reviewed and explicitly approved live equity protective stop exits",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_live_protective_exit_previews (
        exit_preview_id text PRIMARY KEY,
        client_preview_id text NOT NULL,
        entry_execution_id text NOT NULL REFERENCES helix_live_equity_executions(execution_id) ON DELETE RESTRICT,
        control_id text NOT NULL REFERENCES helix_live_trading_controls(control_id) ON DELETE RESTRICT,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        connection_id text NOT NULL REFERENCES helix_brokerage_connections(connection_id) ON DELETE RESTRICT,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE RESTRICT,
        intent_json jsonb NOT NULL,
        proposal_hash text NOT NULL,
        provider_review_hash text NOT NULL,
        provider_contract_hash text NOT NULL,
        preflight_snapshot_hash text NOT NULL,
        encrypted_provider_review text NOT NULL,
        provider_warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
        approval_phrase text NOT NULL,
        status text NOT NULL DEFAULT 'reviewed',
        reviewed_at timestamptz NOT NULL,
        expires_at timestamptz NOT NULL,
        consumed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (proposal_hash LIKE 'sha256:%'),
        CHECK (provider_review_hash LIKE 'sha256:%'),
        CHECK (provider_contract_hash LIKE 'sha256:%'),
        CHECK (preflight_snapshot_hash LIKE 'sha256:%'),
        CHECK (status IN ('reviewed','approved','expired','consumed','invalidated')),
        CHECK (expires_at > reviewed_at),
        UNIQUE (owner_profile_id, client_preview_id)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_live_protective_exit_previews_entry_idx
      ON helix_live_protective_exit_previews
        (entry_execution_id, reviewed_at DESC);
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_live_protective_exit_approvals (
        exit_approval_id text PRIMARY KEY,
        exit_preview_id text NOT NULL UNIQUE REFERENCES helix_live_protective_exit_previews(exit_preview_id) ON DELETE RESTRICT,
        entry_execution_id text NOT NULL REFERENCES helix_live_equity_executions(execution_id) ON DELETE RESTRICT,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        session_hash text NOT NULL,
        proposal_hash text NOT NULL,
        provider_review_hash text NOT NULL,
        decision_source text NOT NULL DEFAULT 'explicit_user',
        approved_at timestamptz NOT NULL,
        expires_at timestamptz NOT NULL,
        consumed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        CHECK (session_hash LIKE 'sha256:%'),
        CHECK (proposal_hash LIKE 'sha256:%'),
        CHECK (provider_review_hash LIKE 'sha256:%'),
        CHECK (decision_source = 'explicit_user'),
        CHECK (expires_at > approved_at)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_live_protective_exit_executions (
        exit_execution_id text PRIMARY KEY,
        exit_preview_id text NOT NULL UNIQUE REFERENCES helix_live_protective_exit_previews(exit_preview_id) ON DELETE RESTRICT,
        exit_approval_id text NOT NULL UNIQUE REFERENCES helix_live_protective_exit_approvals(exit_approval_id) ON DELETE RESTRICT,
        entry_execution_id text NOT NULL REFERENCES helix_live_equity_executions(execution_id) ON DELETE RESTRICT,
        control_id text NOT NULL REFERENCES helix_live_trading_controls(control_id) ON DELETE RESTRICT,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        connection_id text NOT NULL REFERENCES helix_brokerage_connections(connection_id) ON DELETE RESTRICT,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE RESTRICT,
        client_order_id text NOT NULL UNIQUE,
        state text NOT NULL,
        intent_json jsonb NOT NULL,
        proposal_hash text NOT NULL,
        provider_review_hash text NOT NULL,
        provider_contract_hash text,
        provider_result_hash text,
        provider_order_ref_hash text,
        encrypted_provider_result text,
        ambiguity_reason text,
        reserved_at timestamptz NOT NULL,
        provider_call_started_at timestamptz,
        submitted_at timestamptz,
        reconciled_at timestamptz,
        updated_at timestamptz NOT NULL,
        CHECK (state IN (
          'reserved','provider_call_started','submitted','reconciliation_required',
          'reconciled_open','reconciled_filled','reconciled_cancelled','reconciled_rejected'
        )),
        CHECK (proposal_hash LIKE 'sha256:%'),
        CHECK (provider_review_hash LIKE 'sha256:%'),
        CHECK (provider_contract_hash IS NULL OR provider_contract_hash LIKE 'sha256:%'),
        CHECK (provider_result_hash IS NULL OR provider_result_hash LIKE 'sha256:%'),
        CHECK (provider_order_ref_hash IS NULL OR provider_order_ref_hash LIKE 'sha256:%')
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_live_protective_exit_executions_entry_idx
      ON helix_live_protective_exit_executions
        (entry_execution_id, reserved_at DESC);
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_live_protective_exit_events (
        event_id text PRIMARY KEY,
        exit_execution_id text REFERENCES helix_live_protective_exit_executions(exit_execution_id) ON DELETE RESTRICT,
        entry_execution_id text NOT NULL REFERENCES helix_live_equity_executions(execution_id) ON DELETE RESTRICT,
        control_id text NOT NULL REFERENCES helix_live_trading_controls(control_id) ON DELETE RESTRICT,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        event_type text NOT NULL,
        detail_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_live_protective_exit_events_entry_idx
      ON helix_live_protective_exit_events (entry_execution_id, created_at DESC);
    `);
  },
};
