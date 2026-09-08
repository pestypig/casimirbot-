import type { Migration } from "./migration";

export const migration082: Migration = {
  id: "082_environment_temporal_frontiers",
  description: "Persist goal-scoped non-authoritative temporal frontier snapshots",
  run: async (client) => {
    await client.query(`CREATE TABLE IF NOT EXISTS helix_environment_temporal_frontiers (
      frontier_id text PRIMARY KEY,
      goal_id text NOT NULL REFERENCES helix_environment_durable_goals(goal_id) ON DELETE CASCADE,
      goal_revision bigint NOT NULL CHECK (goal_revision > 0),
      frontier_revision bigint NOT NULL CHECK (frontier_revision > 0),
      observation_evidence_ref text NOT NULL,
      observation_producer_epoch_ref text NOT NULL,
      action_producer_epoch_ref text NOT NULL,
      identity_hash text NOT NULL,
      payload_hash text NOT NULL,
      frontier_payload jsonb NOT NULL,
      observed_at timestamptz NOT NULL,
      retained_until timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (goal_id, frontier_revision),
      UNIQUE (goal_id, goal_revision, observation_evidence_ref, identity_hash),
      CHECK (retained_until > observed_at)
    );`);
    await client.query(`CREATE INDEX IF NOT EXISTS helix_environment_temporal_frontier_retention_idx
      ON helix_environment_temporal_frontiers (retained_until);`);
  },
};
