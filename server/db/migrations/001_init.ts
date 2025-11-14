import type { Migration } from "./migration";

export const migration001: Migration = {
  id: "001_init",
  description: "Base Essence + AGI tables",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS persona (
        id text PRIMARY KEY,
        display_name text NOT NULL,
        profile jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS memory (
        id text PRIMARY KEY,
        owner_id text NOT NULL,
        created_at timestamptz NOT NULL,
        kind text NOT NULL,
        text text,
        keys jsonb NOT NULL DEFAULT '[]'::jsonb,
        essence_id text,
        embedding_space text,
        embedding_cid text,
        visibility text NOT NULL,
        tokens jsonb NOT NULL DEFAULT '[]'::jsonb,
        embedding jsonb,
        snippet text
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS memory_owner_idx ON memory(owner_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS memory_created_idx ON memory(created_at DESC);`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS task_trace (
        id text PRIMARY KEY,
        persona_id text NOT NULL,
        goal text NOT NULL,
        created_at timestamptz NOT NULL,
        plan_json jsonb NOT NULL,
        steps jsonb NOT NULL,
        approvals jsonb NOT NULL,
        result_summary text,
        ok boolean,
        knowledge_context jsonb NOT NULL DEFAULT '[]'::jsonb,
        plan_manifest_json jsonb DEFAULT '[]'::jsonb
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS task_trace_persona_idx ON task_trace(persona_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS task_trace_created_idx ON task_trace(created_at DESC);`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS essence_envelope (
        id text PRIMARY KEY,
        creator_id text,
        visibility text,
        payload jsonb NOT NULL,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS essence_envelope_creator_idx ON essence_envelope(creator_id);`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS essence_packet (
        id text PRIMARY KEY,
        envelope_id text NOT NULL REFERENCES essence_envelope(id) ON DELETE CASCADE,
        uri text NOT NULL,
        cid text NOT NULL,
        content_type text NOT NULL,
        bytes integer,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS essence_packet_envelope_idx ON essence_packet(envelope_id);`);
  },
};
