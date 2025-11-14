import type { Migration } from "./migration";

export const migration004: Migration = {
  id: "004_trace_manifest",
  description: "Normalize knowledge_context defaults and add plan_manifest_json",
  run: async (client) => {
    await client.query(`
      ALTER TABLE task_trace
      ADD COLUMN IF NOT EXISTS plan_manifest_json jsonb;
    `);
    await client.query(`
      ALTER TABLE task_trace
      ALTER COLUMN knowledge_context SET DEFAULT '[]'::jsonb;
    `);
    await client.query(`
      UPDATE task_trace
      SET knowledge_context = '[]'::jsonb
      WHERE knowledge_context IS NULL;
    `);
    await client.query(`
      ALTER TABLE task_trace
      ALTER COLUMN knowledge_context SET NOT NULL;
    `);
    await client.query(`
      ALTER TABLE task_trace
      ALTER COLUMN plan_manifest_json SET DEFAULT '[]'::jsonb;
    `);
    await client.query(`
      UPDATE task_trace
      SET plan_manifest_json = '[]'::jsonb
      WHERE plan_manifest_json IS NULL;
    `);
  },
};
