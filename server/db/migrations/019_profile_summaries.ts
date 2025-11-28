import type { Migration } from "./migration";

export const migration019: Migration = {
  id: "019_profile_summaries",
  description: "Store daily Essence profile summaries",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS essence_profile_summaries (
        id text PRIMARY KEY,
        persona_id text NOT NULL,
        summary_json jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        day date NOT NULL
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS essence_profile_summaries_persona_day_idx
      ON essence_profile_summaries (persona_id, day);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS essence_profile_summaries_recent_idx
      ON essence_profile_summaries (updated_at DESC);
    `);
  },
};
