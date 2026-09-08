import type { Migration } from "./migration";

export const migration086: Migration = {
  id: "086_environment_temporal_resident_action",
  description: "Associate temporal plans with their original resident action",
  run: async client => {
    // Legacy rows remain unresolved rather than guessing a running workflow.
    await client.query(`ALTER TABLE helix_environment_temporal_plan_admissions
      ADD COLUMN IF NOT EXISTS resident_action_request_id text
      REFERENCES helix_environment_action_requests(action_request_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS helix_environment_temporal_resident_idx
      ON helix_environment_temporal_plan_admissions(resident_action_request_id);`);
  },
};
