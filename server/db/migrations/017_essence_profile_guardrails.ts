import type { Migration } from "./migration";

export const migration017: Migration = {
  id: "017_essence_profile_guardrails",
  description: "Add rate limit metadata to essence_profiles",
  run: async (client) => {
    await client.query(`
      ALTER TABLE essence_profiles
      ADD COLUMN IF NOT EXISTS last_update_at timestamptz,
      ADD COLUMN IF NOT EXISTS update_count integer NOT NULL DEFAULT 0;
    `);
    await client.query(`
      UPDATE essence_profiles
      SET last_update_at = COALESCE(last_update_at, updated_at)
      WHERE last_update_at IS NULL;
    `);
  },
};
