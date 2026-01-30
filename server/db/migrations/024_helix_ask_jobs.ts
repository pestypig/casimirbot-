import type { Migration } from "./migration";

export const migration024: Migration = {
  id: "024_helix_ask_jobs",
  description: "Add Helix Ask async job storage",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_ask_jobs (
        id text PRIMARY KEY,
        status text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz NOT NULL,
        session_id text,
        trace_id text,
        question text,
        partial_text text,
        result_json jsonb,
        error text
      );
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS helix_ask_jobs_expires_idx ON helix_ask_jobs(expires_at);`,
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS helix_ask_jobs_trace_idx ON helix_ask_jobs(trace_id);`,
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS helix_ask_jobs_updated_idx ON helix_ask_jobs(updated_at DESC);`,
    );
  },
};
