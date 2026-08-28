import type { Migration } from "./migration";

export const migration069: Migration = {
  id: "069_brokerage_reactive_controller_runs",
  description:
    "Add finite brokerage reactive-controller leases, append-only events, and idempotent cycles",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_brokerage_reactive_controller_runs (
        controller_run_id text PRIMARY KEY,
        client_controller_id text NOT NULL,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        connection_id text NOT NULL REFERENCES helix_brokerage_connections(connection_id) ON DELETE CASCADE,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        paper_account_id text NOT NULL REFERENCES helix_paper_trading_accounts(account_id) ON DELETE CASCADE,
        environment_binding_id text NOT NULL,
        producer_epoch_ref text NOT NULL,
        strategy_manifest_id text NOT NULL,
        strategy_artifact_hash text NOT NULL,
        controller_profile_hash text NOT NULL,
        status text NOT NULL,
        processed_cycles integer NOT NULL DEFAULT 0,
        maximum_cycles integer NOT NULL,
        last_sequence integer,
        next_observation_deadline_at timestamptz NOT NULL,
        controller_deadline_at timestamptz NOT NULL,
        lease_expires_at timestamptz NOT NULL,
        manifest_expires_at timestamptz NOT NULL,
        terminal_reason text,
        current_event_sequence integer NOT NULL DEFAULT 0,
        latest_event_hash text,
        request_hash text NOT NULL,
        manifest_json jsonb NOT NULL,
        projection_json jsonb NOT NULL,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL,
        terminal_at timestamptz,
        CHECK (status IN (
          'active', 'completed', 'watchdog_tripped',
          'manual_override', 'emergency_stopped'
        )),
        CHECK (processed_cycles >= 0 AND maximum_cycles > 0 AND
               processed_cycles <= maximum_cycles),
        CHECK (last_sequence IS NULL OR last_sequence > 0),
        CHECK (strategy_artifact_hash LIKE 'sha256:%'),
        CHECK (controller_profile_hash LIKE 'sha256:%'),
        CHECK (request_hash LIKE 'sha256:%'),
        CHECK (latest_event_hash IS NULL OR latest_event_hash LIKE 'sha256:%'),
        CHECK ((status = 'active' AND terminal_reason IS NULL AND terminal_at IS NULL) OR
               (status <> 'active' AND terminal_reason IS NOT NULL AND terminal_at IS NOT NULL)),
        UNIQUE (owner_profile_id, client_controller_id)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_brokerage_reactive_controller_active_idx
      ON helix_brokerage_reactive_controller_runs (
        status, next_observation_deadline_at, lease_expires_at,
        controller_deadline_at
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_brokerage_reactive_controller_events (
        controller_event_id text PRIMARY KEY,
        controller_run_id text NOT NULL REFERENCES helix_brokerage_reactive_controller_runs(controller_run_id) ON DELETE CASCADE,
        sequence integer NOT NULL,
        event_kind text NOT NULL,
        previous_event_hash text,
        event_hash text NOT NULL,
        source_observation_id text,
        event_payload jsonb NOT NULL,
        occurred_at timestamptz NOT NULL,
        CHECK (sequence > 0),
        CHECK (event_kind IN (
          'controller_started', 'decision_recorded', 'arbiter_resolved',
          'controller_completed', 'watchdog_tripped',
          'manual_override', 'emergency_stop'
        )),
        CHECK (previous_event_hash IS NULL OR previous_event_hash LIKE 'sha256:%'),
        CHECK (event_hash LIKE 'sha256:%'),
        CHECK ((sequence = 1 AND previous_event_hash IS NULL) OR
               (sequence > 1 AND previous_event_hash IS NOT NULL)),
        UNIQUE (controller_run_id, sequence),
        UNIQUE (controller_run_id, event_hash)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_brokerage_reactive_controller_cycles (
        controller_run_id text NOT NULL REFERENCES helix_brokerage_reactive_controller_runs(controller_run_id) ON DELETE CASCADE,
        source_observation_id text NOT NULL,
        source_output_hash text NOT NULL,
        source_sequence integer NOT NULL,
        status text NOT NULL,
        decision_json jsonb NOT NULL,
        arbiter_json jsonb,
        receipt_json jsonb,
        created_at timestamptz NOT NULL,
        resolved_at timestamptz,
        CHECK (source_output_hash LIKE 'sha256:%'),
        CHECK (source_sequence > 0),
        CHECK (status IN ('pending_resolution', 'pending_arbiter', 'resolved')),
        CHECK ((status IN ('pending_resolution', 'pending_arbiter') AND receipt_json IS NULL AND resolved_at IS NULL) OR
               (status = 'resolved' AND receipt_json IS NOT NULL AND resolved_at IS NOT NULL)),
        PRIMARY KEY (controller_run_id, source_observation_id),
        UNIQUE (controller_run_id, source_sequence),
        UNIQUE (controller_run_id, source_output_hash)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_brokerage_reactive_controller_pending_idx
      ON helix_brokerage_reactive_controller_cycles (status, created_at);
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_brokerage_reactive_controller_effects (
        controller_run_id text NOT NULL REFERENCES helix_brokerage_reactive_controller_runs(controller_run_id) ON DELETE CASCADE,
        order_id text NOT NULL REFERENCES helix_paper_orders(order_id) ON DELETE CASCADE,
        source_observation_id text NOT NULL,
        created_at timestamptz NOT NULL,
        PRIMARY KEY (controller_run_id, order_id),
        UNIQUE (order_id)
      );
    `);
  },
};
