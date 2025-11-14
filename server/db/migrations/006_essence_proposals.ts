import type { Migration } from "./migration";

export const migration006: Migration = {
  id: "006_essence_proposals",
  description: "Create essence proposal tables",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS essence_proposals (
        id text PRIMARY KEY,
        kind text NOT NULL,
        status text NOT NULL,
        source text NOT NULL,
        title text NOT NULL,
        summary text NOT NULL,
        explanation text NOT NULL,
        target jsonb NOT NULL,
        patch_kind text NOT NULL,
        patch text NOT NULL,
        reward_tokens integer NOT NULL DEFAULT 0,
        job_id text,
        metadata jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_for_day date NOT NULL
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS essence_proposals_day_status_idx
      ON essence_proposals (created_for_day, status);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS essence_proposals_kind_idx
      ON essence_proposals (kind);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS essence_proposal_actions (
        id text PRIMARY KEY,
        proposal_id text NOT NULL REFERENCES essence_proposals(id) ON DELETE CASCADE,
        action text NOT NULL,
        user_id text,
        note text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS essence_proposal_actions_proposal_idx
      ON essence_proposal_actions (proposal_id);
    `);
  },
};
