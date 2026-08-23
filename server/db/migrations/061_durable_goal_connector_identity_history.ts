import type { Migration } from "./migration";

export const migration061: Migration = {
  id: "061_durable_goal_connector_identity_history",
  description:
    "Keep exact historical connector and participant identities without coupling durable goals to ephemeral parent rows",
  run: async (client) => {
    // The durable goal ledger authenticates these identifiers at create,
    // append, rebound, and continuation time. The current-row copies are
    // historical audit/index fields, not ownership parents. Connector
    // rotation, room-member replacement, and device reinstall must therefore
    // be able to retire their live rows while the goal awaits typed recovery.
    const columns = [
      "connector_installation_id",
      "device_id",
      "environment_binding_id",
      "room_source_binding_id",
      "participant_id",
      "subject_binding_id",
    ];
    for (const column of columns) {
      await client.query(`
        ALTER TABLE helix_environment_durable_goals
          DROP CONSTRAINT IF EXISTS helix_environment_durable_goals_${column}_fkey;
      `);
      // pg-mem names implicit foreign keys with `_fk`; PostgreSQL uses `_fkey`.
      await client.query(`
        ALTER TABLE helix_environment_durable_goals
          DROP CONSTRAINT IF EXISTS helix_environment_durable_goals_${column}_fk;
      `);
    }
  },
};
