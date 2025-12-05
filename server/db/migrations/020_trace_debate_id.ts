import type { Migration } from "./migration";

export const migration020: Migration = {
  id: "020_trace_debate_id",
  description: "Add debate_id to task_trace to support debate-aware planning",
  run: async (client) => {
    await client.query(`
      ALTER TABLE task_trace
      ADD COLUMN IF NOT EXISTS debate_id text;
    `);
  },
};
