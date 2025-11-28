import type { Migration } from "./migration";

export const migration014: Migration = {
  id: "014_essence_profiles",
  description: "Add essence_profiles table for neutral inference profiles",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS essence_profiles (
        essence_id text PRIMARY KEY,
        profile_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS essence_profiles_updated_idx
      ON essence_profiles (updated_at DESC);
    `);
  },
};
