import type { Migration } from "./migration";

export const migration022: Migration = {
  id: "022_noisegen_store",
  description: "Add durable noisegen store snapshot table",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS noisegen_store (
        id text PRIMARY KEY,
        payload jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS noisegen_store_updated_idx ON noisegen_store(updated_at DESC);`,
    );
  },
};
