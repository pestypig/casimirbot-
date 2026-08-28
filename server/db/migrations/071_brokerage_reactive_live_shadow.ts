import type { Migration } from "./migration";

export const migration071: Migration = {
  id: "071_brokerage_reactive_live_shadow",
  description:
    "Add finite owner-private live-quote shadow sessions and measured poll receipts",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_brokerage_reactive_shadow_sessions (
        shadow_session_id text PRIMARY KEY,
        client_shadow_session_id text NOT NULL,
        controller_run_id text NOT NULL UNIQUE REFERENCES helix_brokerage_reactive_controller_runs(controller_run_id) ON DELETE CASCADE,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        connection_id text NOT NULL REFERENCES helix_brokerage_connections(connection_id) ON DELETE CASCADE,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        symbol text NOT NULL,
        status text NOT NULL,
        terminal_reason text,
        polls_attempted integer NOT NULL DEFAULT 0,
        polls_succeeded integer NOT NULL DEFAULT 0,
        consecutive_failures integer NOT NULL DEFAULT 0,
        maximum_polls integer NOT NULL,
        maximum_consecutive_failures integer NOT NULL,
        poll_interval_ms integer NOT NULL,
        next_poll_at timestamptz NOT NULL,
        session_expires_at timestamptz NOT NULL,
        in_flight_token text,
        in_flight_started_at timestamptz,
        earnings_observation_id text,
        request_hash text NOT NULL,
        projection_json jsonb NOT NULL,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL,
        terminal_at timestamptz,
        CHECK (status IN (
          'active', 'completed', 'stopped', 'source_failed',
          'controller_terminal'
        )),
        CHECK (polls_attempted >= 0 AND polls_succeeded >= 0 AND
               polls_succeeded <= polls_attempted AND
               polls_attempted <= maximum_polls),
        CHECK (maximum_polls > 0 AND maximum_consecutive_failures > 0),
        CHECK (poll_interval_ms >= 1000),
        CHECK (request_hash LIKE 'sha256:%'),
        CHECK ((status = 'active' AND terminal_reason IS NULL AND terminal_at IS NULL) OR
               (status <> 'active' AND terminal_reason IS NOT NULL AND terminal_at IS NOT NULL)),
        CHECK ((in_flight_token IS NULL AND in_flight_started_at IS NULL) OR
               (in_flight_token IS NOT NULL AND in_flight_started_at IS NOT NULL)),
        UNIQUE (owner_profile_id, client_shadow_session_id)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_brokerage_reactive_shadow_due_idx
      ON helix_brokerage_reactive_shadow_sessions (
        status, next_poll_at, session_expires_at
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_brokerage_reactive_shadow_polls (
        shadow_session_id text NOT NULL REFERENCES helix_brokerage_reactive_shadow_sessions(shadow_session_id) ON DELETE CASCADE,
        poll_sequence integer NOT NULL,
        in_flight_token text NOT NULL,
        disposition text NOT NULL,
        source_observation_id text,
        source_output_hash text,
        error_code text,
        receipt_json jsonb,
        read_started_at timestamptz NOT NULL,
        read_completed_at timestamptz,
        processing_completed_at timestamptz,
        created_at timestamptz NOT NULL,
        CHECK (poll_sequence > 0),
        CHECK (disposition IN (
          'in_flight', 'processed', 'source_failed',
          'normalization_failed', 'controller_rejected'
        )),
        CHECK (source_output_hash IS NULL OR source_output_hash LIKE 'sha256:%'),
        CHECK ((disposition = 'in_flight' AND receipt_json IS NULL AND
                read_completed_at IS NULL AND processing_completed_at IS NULL) OR
               (disposition <> 'in_flight' AND receipt_json IS NOT NULL AND
                read_completed_at IS NOT NULL AND processing_completed_at IS NOT NULL)),
        PRIMARY KEY (shadow_session_id, poll_sequence),
        UNIQUE (shadow_session_id, in_flight_token),
        UNIQUE (source_observation_id)
      );
    `);
  },
};

