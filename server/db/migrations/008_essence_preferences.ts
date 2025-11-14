import type { Migration } from "./migration";

export const migration008: Migration = {
  id: "008_essence_preferences",
  description: "Add essence UI preferences table",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS essence_ui_preferences (
        owner_id text NOT NULL,
        pref_key text NOT NULL,
        value jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (owner_id, pref_key)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS essence_ui_preferences_owner_idx
      ON essence_ui_preferences (owner_id);
    `);
  },
};
