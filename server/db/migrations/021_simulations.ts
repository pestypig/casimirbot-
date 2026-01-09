import type { Migration } from "./migration";

export const migration021: Migration = {
  id: "021_simulations",
  description: "Add simulations table for durable simulation storage",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS simulations (
        id text PRIMARY KEY,
        parameters jsonb NOT NULL,
        status text NOT NULL,
        start_time timestamptz NOT NULL,
        end_time timestamptz,
        results jsonb,
        generated_files jsonb NOT NULL DEFAULT '[]'::jsonb,
        logs jsonb NOT NULL DEFAULT '[]'::jsonb,
        error text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS simulations_status_idx ON simulations(status);`,
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS simulations_created_idx ON simulations(created_at DESC);`,
    );
  },
};
