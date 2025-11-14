import type { Migration } from "./migration";

export const migration007: Migration = {
  id: "007_proposal_enrichment",
  description: "Add owner, safety, and linkage metadata to essence proposals",
  run: async (client) => {
    await client.query(`
      ALTER TABLE essence_proposals
      ADD COLUMN IF NOT EXISTS owner_id text;
    `);

    await client.query(`
      ALTER TABLE essence_proposals
      ADD COLUMN IF NOT EXISTS safety_status text NOT NULL DEFAULT 'unknown';
    `);

    await client.query(`
      ALTER TABLE essence_proposals
      ADD COLUMN IF NOT EXISTS safety_score double precision;
    `);

    await client.query(`
      ALTER TABLE essence_proposals
      ADD COLUMN IF NOT EXISTS safety_report text;
    `);

    await client.query(`
      ALTER TABLE essence_proposals
      ADD COLUMN IF NOT EXISTS eval_run_id text;
    `);

    await client.query(`
      ALTER TABLE essence_proposals
      ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
    `);

    await client.query(`
      ALTER TABLE essence_proposals
      ALTER COLUMN safety_status SET DEFAULT 'unknown';
    `);

    await client.query(`
      UPDATE essence_proposals
      SET updated_at = created_at
      WHERE updated_at IS NULL;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS essence_proposals_owner_idx
      ON essence_proposals (owner_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS essence_proposals_owner_day_idx
      ON essence_proposals (owner_id, created_for_day);
    `);
  },
};
