import type { Pool } from "pg";
import { migration001 } from "./migrations/001_init";
import { migration002 } from "./migrations/002_pgvector";
import { migration003 } from "./migrations/003_knowledge_context";
import { migration004 } from "./migrations/004_trace_manifest";
import { migration005 } from "./migrations/005_routine_json";
import { migration006 } from "./migrations/006_essence_proposals";
import { migration007 } from "./migrations/007_proposal_enrichment";
import { migration008 } from "./migrations/008_essence_preferences";
import { migration009 } from "./migrations/009_essence_environment";
import { migration010 } from "./migrations/010_knowledge_corpus";
import { migration011 } from "./migrations/011_essence_activity";
import { migration012 } from "./migrations/012_trace_sealed_snapshots";
import { migration013 } from "./migrations/013_trace_prompts";
import { migration014 } from "./migrations/014_essence_profiles";
import { migration015 } from "./migrations/015_trace_reasoning";
import { migration016 } from "./migrations/016_trace_collapse";
import { migration017 } from "./migrations/017_essence_profile_guardrails";
import { migration018 } from "./migrations/018_trace_collapse_strategy";
import { migration019 } from "./migrations/019_profile_summaries";
import type { MigrationContext } from "./migrations/migration";

const MIGRATIONS = [
  migration001,
  migration002,
  migration003,
  migration004,
  migration005,
  migration006,
  migration007,
  migration008,
  migration009,
  migration010,
  migration011,
  migration012,
  migration013,
  migration014,
  migration015,
  migration016,
  migration017,
  migration018,
  migration019,
];

export async function runMigrations(pool: Pool): Promise<void> {
  const ctx: MigrationContext = {
    enablePgvector: process.env.ENABLE_PGVECTOR === "1",
  };

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    const applied = new Set<string>();
    const { rows } = await client.query<{ id: string }>(`SELECT id FROM schema_migrations;`);
    for (const row of rows) {
      applied.add(row.id);
    }

    for (const migration of MIGRATIONS) {
      if (applied.has(migration.id)) {
        continue;
      }

      await client.query("BEGIN");
      try {
        await migration.run(client, ctx);
        await client.query(`INSERT INTO schema_migrations(id) VALUES ($1)`, [migration.id]);
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }
  } finally {
    client.release();
  }
}
