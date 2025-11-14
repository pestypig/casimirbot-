import type { Migration } from "./migration";

export const migration005: Migration = {
  id: "005_routine_json",
  description: "Add routine_json column to task_trace",
  run: async (client) => {
    await client.query(`
      ALTER TABLE task_trace
      ADD COLUMN IF NOT EXISTS routine_json jsonb;
    `);
  },
};

