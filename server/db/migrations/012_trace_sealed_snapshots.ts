import type { Migration } from "./migration";

export const migration012: Migration = {
  id: "012_trace_sealed_snapshots",
  description: "Add telemetry/resonance snapshot + planner metadata to task_trace",
  run: async (client) => {
    await client.query(`
      ALTER TABLE task_trace
      ADD COLUMN IF NOT EXISTS telemetry_bundle jsonb;
    `);
    await client.query(`
      ALTER TABLE task_trace
      ADD COLUMN IF NOT EXISTS telemetry_summary jsonb;
    `);
    await client.query(`
      ALTER TABLE task_trace
      ADD COLUMN IF NOT EXISTS resonance_bundle jsonb;
    `);
    await client.query(`
      ALTER TABLE task_trace
      ADD COLUMN IF NOT EXISTS resonance_selection jsonb;
    `);
    await client.query(`
      ALTER TABLE task_trace
      ADD COLUMN IF NOT EXISTS lattice_version text;
    `);
    await client.query(`
      ALTER TABLE task_trace
      ADD COLUMN IF NOT EXISTS planner_prompt text;
    `);
  },
};
