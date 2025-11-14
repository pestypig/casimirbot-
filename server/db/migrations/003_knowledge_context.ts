import type { Migration } from "./migration";

export const migration003: Migration = {
  id: "003_knowledge_context",
  description: "Add knowledgeContext column to task_trace",
  run: async (client) => {
    await client.query(`
      ALTER TABLE task_trace
      ADD COLUMN IF NOT EXISTS knowledge_context jsonb NOT NULL DEFAULT '[]'::jsonb;
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
  },
};
