import type { Migration } from "./migration";

export const migration018: Migration = {
  id: "018_trace_collapse_strategy",
  description: "Record collapse strategy on task_trace",
  run: async (client) => {
    await client.query(`
      ALTER TABLE task_trace
      ADD COLUMN IF NOT EXISTS collapse_strategy text;
    `);
  },
};
