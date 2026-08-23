import type { Migration } from "./migration";

export const migration059: Migration = {
  id: "059_environment_durable_goals",
  description:
    "Add identity-bound durable environment goals and an append-only hash-linked checkpoint event ledger",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_durable_goals (
        goal_id text PRIMARY KEY,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        connector_installation_id text NOT NULL REFERENCES helix_environment_connector_installations(installation_id),
        device_id text NOT NULL REFERENCES helix_environment_connector_devices(device_id),
        environment_binding_id text NOT NULL REFERENCES helix_environment_connector_bindings(environment_binding_id),
        room_source_binding_id text NOT NULL REFERENCES helix_room_source_bindings(binding_id),
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        participant_id text NOT NULL REFERENCES helix_shared_realtime_room_members(participant_id),
        subject_binding_id text NOT NULL REFERENCES helix_room_environment_subject_bindings(subject_binding_id),
        subject_native_id text NOT NULL,
        source_id text NOT NULL,
        world_id text NOT NULL,
        objective_hash text NOT NULL,
        objective_payload jsonb NOT NULL,
        status text NOT NULL DEFAULT 'active',
        current_sequence integer NOT NULL DEFAULT 0,
        latest_event_hash text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        completed_at timestamptz,
        canceled_at timestamptz,
        CHECK (objective_hash LIKE 'sha256:%'),
        CHECK (latest_event_hash IS NULL OR latest_event_hash LIKE 'sha256:%'),
        CHECK (current_sequence >= 0),
        CHECK (status IN ('active', 'paused', 'recovery_required', 'blocked', 'completed', 'canceled'))
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_durable_goals_scope_idx
      ON helix_environment_durable_goals (
        owner_profile_id, room_id, participant_id, environment_binding_id,
        updated_at DESC
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_durable_goal_participants (
        goal_id text NOT NULL REFERENCES helix_environment_durable_goals(goal_id) ON DELETE CASCADE,
        participant_id text NOT NULL REFERENCES helix_shared_realtime_room_members(participant_id) ON DELETE CASCADE,
        profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        granted_by_profile_id text NOT NULL REFERENCES helix_accounts(profile_id),
        scopes jsonb NOT NULL DEFAULT '["read"]'::jsonb,
        status text NOT NULL DEFAULT 'active',
        granted_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        revoked_at timestamptz,
        CHECK (status IN ('active', 'revoked')),
        PRIMARY KEY (goal_id, participant_id)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_durable_goal_participant_events (
        grant_event_id text PRIMARY KEY,
        goal_id text NOT NULL REFERENCES helix_environment_durable_goals(goal_id) ON DELETE CASCADE,
        sequence integer NOT NULL,
        previous_event_hash text,
        event_hash text NOT NULL,
        event_kind text NOT NULL,
        participant_id text NOT NULL,
        profile_id text NOT NULL,
        actor_profile_id text NOT NULL,
        scopes jsonb NOT NULL,
        occurred_at timestamptz NOT NULL DEFAULT now(),
        CHECK (sequence > 0),
        CHECK (previous_event_hash IS NULL OR previous_event_hash LIKE 'sha256:%'),
        CHECK (event_hash LIKE 'sha256:%'),
        CHECK (event_kind IN ('granted', 'revoked')),
        CHECK ((sequence = 1 AND previous_event_hash IS NULL) OR
               (sequence > 1 AND previous_event_hash IS NOT NULL)),
        UNIQUE (goal_id, sequence),
        UNIQUE (goal_id, event_hash)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_durable_goal_events (
        event_id text PRIMARY KEY,
        goal_id text NOT NULL REFERENCES helix_environment_durable_goals(goal_id) ON DELETE CASCADE,
        sequence integer NOT NULL,
        event_kind text NOT NULL,
        previous_event_hash text,
        event_hash text NOT NULL,
        owner_profile_id text NOT NULL,
        connector_installation_id text NOT NULL,
        device_id text NOT NULL,
        environment_binding_id text NOT NULL,
        room_source_binding_id text NOT NULL,
        room_id text NOT NULL,
        goal_owner_participant_id text NOT NULL,
        participant_id text NOT NULL,
        authority_participant_id text NOT NULL,
        subject_binding_id text NOT NULL,
        subject_native_id text NOT NULL,
        source_id text NOT NULL,
        world_id text NOT NULL,
        producer_epoch_ref text NOT NULL,
        action_authority_id text NOT NULL,
        authority_policy_version integer NOT NULL,
        authority_expires_at timestamptz NOT NULL,
        run_id text,
        turn_id text NOT NULL,
        event_payload jsonb NOT NULL,
        payload jsonb NOT NULL,
        evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
        occurred_at timestamptz NOT NULL,
        recorded_at timestamptz NOT NULL DEFAULT now(),
        CHECK (sequence > 0),
        CHECK (previous_event_hash IS NULL OR previous_event_hash LIKE 'sha256:%'),
        CHECK (event_hash LIKE 'sha256:%'),
        CHECK (authority_policy_version > 0),
        CHECK (event_kind IN (
          'goal_created', 'strategy_revised', 'milestone_activated',
          'attempt_started', 'attempt_settled', 'semantic_wake_consumed',
          'checkpoint_verified', 'milestone_completed', 'recovery_required',
          'authority_rebound', 'goal_paused', 'goal_resumed',
          'goal_completed', 'goal_canceled'
        )),
        CHECK ((sequence = 1 AND previous_event_hash IS NULL) OR
               (sequence > 1 AND previous_event_hash IS NOT NULL)),
        UNIQUE (goal_id, sequence),
        UNIQUE (goal_id, event_hash)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_durable_goal_events_goal_idx
      ON helix_environment_durable_goal_events (goal_id, sequence);
    `);
  },
};
