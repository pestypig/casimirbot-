import type { Migration } from "./migration";

export const migration083: Migration = {
  id: "083_environment_temporal_plan_admissions",
  description: "Retain temporal source plans alongside their exact admitted action",
  run: async client => {
    await client.query(`CREATE TABLE IF NOT EXISTS helix_environment_temporal_plan_admissions (
      plan_id text PRIMARY KEY,
      plan_hash text NOT NULL,
      source_plan jsonb NOT NULL,
      compilation_hash text NOT NULL,
      compilation_artifact jsonb NOT NULL,
      action_request_id text NOT NULL UNIQUE REFERENCES helix_environment_action_requests(action_request_id),
      frontier_id text NOT NULL REFERENCES helix_environment_temporal_frontiers(frontier_id),
      goal_id text NOT NULL REFERENCES helix_environment_durable_goals(goal_id),
      goal_revision bigint NOT NULL CHECK (goal_revision > 0),
      reasoning_binding_id text NOT NULL,
      reasoning_binding_epoch bigint NOT NULL CHECK (reasoning_binding_epoch > 0),
      client_continuation_ref text NOT NULL,
      previous_plan_id text,
      previous_plan_hash text,
      admitted_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (plan_id, plan_hash),
      FOREIGN KEY (previous_plan_id, previous_plan_hash)
        REFERENCES helix_environment_temporal_plan_admissions(plan_id, plan_hash),
      CHECK ((previous_plan_id IS NULL AND previous_plan_hash IS NULL)
        OR (previous_plan_id IS NOT NULL AND previous_plan_hash IS NOT NULL)),
      CHECK (previous_plan_id IS NULL OR previous_plan_id <> plan_id)
    );`);
    await client.query(`CREATE INDEX IF NOT EXISTS helix_environment_temporal_plan_goal_idx
      ON helix_environment_temporal_plan_admissions(goal_id, goal_revision);`);
    await client.query(`CREATE INDEX IF NOT EXISTS helix_environment_temporal_plan_frontier_idx
      ON helix_environment_temporal_plan_admissions(frontier_id);`);
  },
};
