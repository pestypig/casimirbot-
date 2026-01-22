import type { Migration } from "./migration";

export const migration023: Migration = {
  id: "023_chat_sessions",
  description: "Add AGI chat sessions table for Essence console persistence",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS agi_chat_sessions (
        id text PRIMARY KEY,
        owner_id text NOT NULL,
        persona_id text NOT NULL,
        title text NOT NULL,
        context_id text,
        messages_json jsonb NOT NULL DEFAULT '[]'::jsonb,
        message_count int NOT NULL DEFAULT 0,
        messages_hash text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS agi_chat_sessions_owner_idx ON agi_chat_sessions(owner_id);`,
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS agi_chat_sessions_updated_idx ON agi_chat_sessions(updated_at DESC);`,
    );
  },
};
