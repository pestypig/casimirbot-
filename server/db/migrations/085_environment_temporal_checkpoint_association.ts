import type { Migration } from "./migration";
export const migration085: Migration = {
  id: "085_environment_temporal_checkpoint_association",
  description: "Retain measured checkpoint association on temporal successor admission",
  run: async client => {
    await client.query(`ALTER TABLE helix_environment_temporal_plan_admissions
      ADD COLUMN IF NOT EXISTS checkpoint_association jsonb;`);
  },
};
