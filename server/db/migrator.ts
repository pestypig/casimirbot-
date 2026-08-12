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
import { migration020 } from "./migrations/020_trace_debate_id";
import { migration021 } from "./migrations/021_simulations";
import { migration022 } from "./migrations/022_noisegen_store";
import { migration023 } from "./migrations/023_chat_sessions";
import { migration024 } from "./migrations/024_helix_ask_jobs";
import { migration025 } from "./migrations/025_mission_board";
import { migration026 } from "./migrations/026_helix_accounts";
import { migration027 } from "./migrations/027_helix_account_credentials";
import { migration028 } from "./migrations/028_helix_account_recovery";
import { migration029 } from "./migrations/029_helix_research_library";
import { migration030 } from "./migrations/030_shared_realtime_rooms";
import { migration031 } from "./migrations/031_room_source_ingress";
import { migration032 } from "./migrations/032_helix_agent_api";
import { migration033 } from "./migrations/033_runtime_tool_confirmation_replay";
import { migration034 } from "./migrations/034_shared_live_room_agent_bindings";
import { migration035 } from "./migrations/035_helix_agent_account_links";
import { migration036 } from "./migrations/036_shared_live_room_binding_consent";
import { migration037 } from "./migrations/037_shared_live_room_binding_consent_enforcement";
import { migration038 } from "./migrations/038_environment_adapter_registry";
import { migration039 } from "./migrations/039_environment_connector_platform";
import { migration040 } from "./migrations/040_environment_probe_execution_authority";
import { migration041 } from "./migrations/041_casimir_theory_execution_state";
import { migration042 } from "./migrations/042_room_environment_subject_bindings";
import { migration043 } from "./migrations/043_environment_command_authority";
import { migration044 } from "./migrations/044_connector_pairing_bootstrap";
import { migration045 } from "./migrations/045_connector_command_pairing";
import { migration046 } from "./migrations/046_environment_action_plane";
import { migration047 } from "./migrations/047_environment_action_result_replay_identity";
import { migration048 } from "./migrations/048_environment_event_ledger_identity";
import { migration049 } from "./migrations/049_brokerage_environment_connections";
import { migration050 } from "./migrations/050_brokerage_read_audit";
import { migration051 } from "./migrations/051_paper_trading_risk_journal";
import { migration052 } from "./migrations/052_paper_execution_lifecycle";
import { migration053 } from "./migrations/053_live_equity_order_previews";
import { migration054 } from "./migrations/054_live_equity_execution";
import { migration055 } from "./migrations/055_live_protective_exits";
import { migration056 } from "./migrations/056_live_trading_supervisor";
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
  migration020,
  migration021,
  migration022,
  migration023,
  migration024,
  migration025,
  migration026,
  migration027,
  migration028,
  migration029,
  migration030,
  migration031,
  migration032,
  migration033,
  migration034,
  migration035,
  migration036,
  migration037,
  migration038,
  migration039,
  migration040,
  migration041,
  migration042,
  migration043,
  migration044,
  migration045,
  migration046,
  migration047,
  migration048,
  migration049,
  migration050,
  migration051,
  migration052,
  migration053,
  migration054,
  migration055,
  migration056,
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
    const { rows } = await client.query<{ id: string }>(
      `SELECT id FROM schema_migrations;`,
    );
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
        await client.query(`INSERT INTO schema_migrations(id) VALUES ($1)`, [
          migration.id,
        ]);
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
