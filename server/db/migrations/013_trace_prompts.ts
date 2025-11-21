import type { Migration } from "./migration";

export const migration013: Migration = {
  id: "013_trace_prompts",
  description: "Persist planner prompt and prompt hash on task traces",
  run: async (client) => {
    await client.query(`
      ALTER TABLE task_trace
      ADD COLUMN IF NOT EXISTS planner_prompt text;
    `);
    await client.query(`
      ALTER TABLE task_trace
      ADD COLUMN IF NOT EXISTS prompt_hash text;
    `);
  },
};
