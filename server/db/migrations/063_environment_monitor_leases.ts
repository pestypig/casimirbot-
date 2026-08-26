import type { Migration } from "./migration";

export const migration063: Migration = {
  id: "063_environment_monitor_leases",
  description:
    "Add profile-owned environment monitor leases and append-only cursor events",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_monitor_leases (
        monitor_id text PRIMARY KEY,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        mcp_client_id text NOT NULL,
        client_continuation_ref text NOT NULL,
        run_id text NOT NULL REFERENCES helix_agent_runs(run_id) ON DELETE CASCADE,
        goal_id text NOT NULL REFERENCES helix_environment_durable_goals(goal_id) ON DELETE CASCADE,
        room_id text REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        participant_id text NOT NULL REFERENCES helix_shared_realtime_room_members(participant_id) ON DELETE CASCADE,
        environment_binding_id text NOT NULL REFERENCES helix_environment_connector_bindings(environment_binding_id) ON DELETE CASCADE,
        source_id text NOT NULL,
        world_id text NOT NULL,
        subject_ref text NOT NULL REFERENCES helix_room_environment_subject_bindings(subject_binding_id) ON DELETE CASCADE,
        producer_epoch_ref text NOT NULL,
        policy_revision integer NOT NULL,
        status text NOT NULL,
        delivered_cursor integer NOT NULL DEFAULT 0,
        acknowledged_cursor integer NOT NULL DEFAULT 0,
        current_sequence integer NOT NULL DEFAULT 0,
        latest_event_hash text,
        lease_payload jsonb NOT NULL,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL,
        expires_at timestamptz NOT NULL,
        revoked_at timestamptz,
        CHECK (status IN ('active', 'revoked', 'expired')),
        CHECK (policy_revision >= 0),
        CHECK (delivered_cursor >= 0),
        CHECK (acknowledged_cursor >= 0),
        CHECK (acknowledged_cursor <= delivered_cursor),
        CHECK (current_sequence >= 0),
        CHECK (latest_event_hash IS NULL OR latest_event_hash LIKE 'sha256:%'),
        CHECK ((status = 'revoked') = (revoked_at IS NOT NULL)),
        UNIQUE (owner_profile_id, mcp_client_id, client_continuation_ref, run_id, goal_id)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_monitor_leases_profile_idx
      ON helix_environment_monitor_leases (
        owner_profile_id, mcp_client_id, updated_at DESC
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_monitor_leases_scope_idx
      ON helix_environment_monitor_leases (
        room_id, participant_id, environment_binding_id, source_id, world_id,
        subject_ref, producer_epoch_ref
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_monitor_events (
        monitor_event_id text PRIMARY KEY,
        monitor_id text NOT NULL REFERENCES helix_environment_monitor_leases(monitor_id) ON DELETE CASCADE,
        sequence integer NOT NULL,
        event_kind text NOT NULL,
        previous_event_hash text,
        event_hash text NOT NULL,
        evidence_ref text,
        cursor_before integer NOT NULL,
        cursor_after integer NOT NULL,
        event_payload jsonb NOT NULL,
        occurred_at timestamptz NOT NULL,
        recorded_at timestamptz NOT NULL DEFAULT now(),
        CHECK (sequence > 0),
        CHECK (event_kind IN (
          'monitor_created', 'semantic_batch_delivered', 'cursor_acknowledged',
          'retention_gap_detected', 'fresh_snapshot_recorded',
          'monitor_revoked', 'monitor_expired'
        )),
        CHECK (previous_event_hash IS NULL OR previous_event_hash LIKE 'sha256:%'),
        CHECK (event_hash LIKE 'sha256:%'),
        CHECK (cursor_before >= 0),
        CHECK (cursor_after >= cursor_before),
        CHECK ((sequence = 1 AND previous_event_hash IS NULL) OR
               (sequence > 1 AND previous_event_hash IS NOT NULL)),
        UNIQUE (monitor_id, sequence),
        UNIQUE (monitor_id, event_hash),
        UNIQUE (monitor_id, evidence_ref)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_monitor_events_cursor_idx
      ON helix_environment_monitor_events (monitor_id, cursor_after, sequence);
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_monitor_delivered_evidence (
        monitor_id text NOT NULL REFERENCES helix_environment_monitor_leases(monitor_id) ON DELETE CASCADE,
        evidence_ref text NOT NULL,
        delivery_id text NOT NULL,
        delivered_cursor integer NOT NULL,
        delivered_at timestamptz NOT NULL,
        CHECK (delivered_cursor > 0),
        PRIMARY KEY (monitor_id, evidence_ref)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_monitor_delivered_cursor_idx
      ON helix_environment_monitor_delivered_evidence (
        monitor_id, delivered_cursor
      );
    `);
  },
};
