import type { Migration } from "./migration";

export const migration002: Migration = {
  id: "002_pgvector",
  description: "Optional pgvector column for memory embeddings",
  run: async (client, ctx) => {
    if (!ctx.enablePgvector) {
      return;
    }

    try {
      await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
    } catch (err) {
      console.warn("[db] pgvector extension not available:", err instanceof Error ? err.message : err);
      return;
    }

    await client.query(`ALTER TABLE memory ADD COLUMN IF NOT EXISTS embedding_vec vector(128);`);
    await client.query(`
      CREATE INDEX IF NOT EXISTS memory_embedding_vec_idx
      ON memory
      USING ivfflat (embedding_vec vector_cosine_ops)
      WITH (lists = 64);
    `);
  },
};
