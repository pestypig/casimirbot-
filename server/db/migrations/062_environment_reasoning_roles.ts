import type { Migration } from "./migration";

export const migration062: Migration = {
  id: "062_environment_reasoning_roles",
  description:
    "Add append-only revision-bound environment reasoning role outputs, invalidations, principal dispositions, arbitration, and execution-result links",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_reasoning_role_ledgers (
        goal_id text PRIMARY KEY REFERENCES helix_environment_durable_goals(goal_id) ON DELETE CASCADE,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        current_sequence integer NOT NULL DEFAULT 0,
        latest_event_hash text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (current_sequence >= 0),
        CHECK (latest_event_hash IS NULL OR latest_event_hash LIKE 'sha256:%')
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_reasoning_role_events (
        event_id text PRIMARY KEY,
        goal_id text NOT NULL REFERENCES helix_environment_reasoning_role_ledgers(goal_id) ON DELETE CASCADE,
        sequence integer NOT NULL,
        event_kind text NOT NULL,
        previous_event_hash text,
        event_hash text NOT NULL,
        event_payload jsonb NOT NULL,
        occurred_at timestamptz NOT NULL,
        recorded_at timestamptz NOT NULL DEFAULT now(),
        CHECK (sequence > 0),
        CHECK (previous_event_hash IS NULL OR previous_event_hash LIKE 'sha256:%'),
        CHECK (event_hash LIKE 'sha256:%'),
        CHECK (event_kind IN (
          'role_output_recorded',
          'role_output_invalidated',
          'principal_disposition_recorded',
          'proposal_arbitrated',
          'execution_link_recorded',
          'measured_result_link_recorded'
        )),
        CHECK ((sequence = 1 AND previous_event_hash IS NULL) OR
               (sequence > 1 AND previous_event_hash IS NOT NULL)),
        UNIQUE (goal_id, sequence),
        UNIQUE (goal_id, event_hash)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_reasoning_role_events_goal_idx
      ON helix_environment_reasoning_role_events (goal_id, sequence);
    `);
  },
};
