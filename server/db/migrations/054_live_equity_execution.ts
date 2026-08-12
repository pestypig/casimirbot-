import type { Migration } from "./migration";

export const migration054: Migration = {
  id: "054_live_equity_execution",
  description:
    "Add production-gated live equity controls, at-most-once placement reservations, and immutable execution events",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_live_trading_controls (
        control_id text PRIMARY KEY,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        connection_id text NOT NULL REFERENCES helix_brokerage_connections(connection_id) ON DELETE CASCADE,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        policy_json jsonb NOT NULL,
        policy_hash text NOT NULL,
        operator_armed boolean NOT NULL DEFAULT false,
        kill_switch_active boolean NOT NULL DEFAULT true,
        kill_switch_reason text NOT NULL DEFAULT 'Live placement starts locked',
        protective_exit_ready boolean NOT NULL DEFAULT false,
        supervisor_heartbeat_at timestamptz,
        trading_day date NOT NULL,
        new_entries_today integer NOT NULL DEFAULT 0,
        status text NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        archived_at timestamptz,
        CHECK (policy_hash LIKE 'sha256:%'),
        CHECK (new_entries_today >= 0),
        CHECK (status IN ('active', 'archived')),
        CHECK (kill_switch_reason <> '')
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_live_trading_controls_active_idx
      ON helix_live_trading_controls (owner_profile_id, connection_id, room_id)
      WHERE status = 'active';
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_live_equity_executions (
        execution_id text PRIMARY KEY,
        control_id text NOT NULL REFERENCES helix_live_trading_controls(control_id) ON DELETE RESTRICT,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        connection_id text NOT NULL REFERENCES helix_brokerage_connections(connection_id) ON DELETE RESTRICT,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE RESTRICT,
        preview_id text NOT NULL UNIQUE REFERENCES helix_live_equity_order_previews(preview_id) ON DELETE RESTRICT,
        approval_id text NOT NULL UNIQUE REFERENCES helix_live_equity_order_approvals(approval_id) ON DELETE RESTRICT,
        client_order_id text NOT NULL UNIQUE,
        state text NOT NULL,
        intent_json jsonb NOT NULL,
        proposal_hash text NOT NULL,
        provider_review_hash text NOT NULL,
        preflight_snapshot_hash text NOT NULL,
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
          'reserved', 'provider_call_started', 'submitted',
          'reconciliation_required', 'reconciled_open',
          'reconciled_filled', 'reconciled_cancelled', 'reconciled_rejected'
        )),
        CHECK (proposal_hash LIKE 'sha256:%'),
        CHECK (provider_review_hash LIKE 'sha256:%'),
        CHECK (preflight_snapshot_hash LIKE 'sha256:%'),
        CHECK (provider_contract_hash IS NULL OR provider_contract_hash LIKE 'sha256:%'),
        CHECK (provider_result_hash IS NULL OR provider_result_hash LIKE 'sha256:%'),
        CHECK (provider_order_ref_hash IS NULL OR provider_order_ref_hash LIKE 'sha256:%')
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_live_equity_executions_control_idx
      ON helix_live_equity_executions (control_id, reserved_at DESC);
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_live_equity_execution_events (
        event_id text PRIMARY KEY,
        execution_id text REFERENCES helix_live_equity_executions(execution_id) ON DELETE RESTRICT,
        control_id text NOT NULL REFERENCES helix_live_trading_controls(control_id) ON DELETE RESTRICT,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        event_type text NOT NULL,
        detail_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_live_equity_execution_events_control_idx
      ON helix_live_equity_execution_events (control_id, created_at DESC);
    `);
  },
};
