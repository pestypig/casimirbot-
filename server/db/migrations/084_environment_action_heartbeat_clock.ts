import type { Migration } from "./migration";

export const migration084: Migration = {
  id: "084_environment_action_heartbeat_clock",
  description: "Retain validated resident clock snapshots without backfilling unknown clocks",
  run: async client => {
    await client.query(`ALTER TABLE helix_environment_action_connector_heartbeats
      ADD COLUMN IF NOT EXISTS clock_snapshot jsonb;`);
  },
};
