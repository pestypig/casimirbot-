import type { Migration } from "./migration";

export const migration015: Migration = {
  id: "015_trace_reasoning",
  description: "Add reasoning strategy + notes to task_trace",
  run: async (client) => {
    await client.query(`
      ALTER TABLE task_trace
      ADD COLUMN IF NOT EXISTS reasoning_strategy text,
      ADD COLUMN IF NOT EXISTS strategy_notes jsonb DEFAULT '[]'::jsonb;
    `);
  },
};
