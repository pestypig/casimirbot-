import type { Migration } from "./migration";

export const migration016: Migration = {
  id: "016_trace_collapse",
  description: "Store client-side collapse trace on task_trace",
  run: async (client) => {
    await client.query(`
      ALTER TABLE task_trace
      ADD COLUMN IF NOT EXISTS collapse_trace_json jsonb;
    `);
  },
};
