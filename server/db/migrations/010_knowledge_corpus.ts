import type { Migration } from "./migration";

export const migration010: Migration = {
  id: "010_knowledge_corpus",
  description: "Knowledge projects + files for server-side corpus",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_project (
        id text PRIMARY KEY,
        name text NOT NULL,
        tags text[] DEFAULT '{}'::text[],
        type text,
        hash_slug text,
        summary text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_file (
        project_id text NOT NULL REFERENCES knowledge_project(id) ON DELETE CASCADE,
        file_id text NOT NULL,
        name text NOT NULL,
        mime text NOT NULL,
        kind text NOT NULL,
        size integer NOT NULL,
        hash_slug text,
        preview text,
        content_base64 text,
        approx_bytes integer,
        tokens jsonb,
        embedding jsonb,
        embedding_dim integer,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (project_id, file_id)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS knowledge_file_project_idx
      ON knowledge_file(project_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS knowledge_file_kind_idx
      ON knowledge_file(kind);
    `);
  },
};
