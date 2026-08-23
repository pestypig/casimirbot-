import type { Migration } from "./migration";

export const migration060: Migration = {
  id: "060_durable_goal_transient_identity",
  description:
    "Preserve durable environment goals when rotating environment and subject bindings are compacted",
  run: async (client) => {
    // These identifiers remain required, exact audit fields. They are not
    // durable parent entities: source credential rotation can replace both
    // while the same authorized room/player goal continues through a typed
    // authority_rebound event.
    await client.query(`
      ALTER TABLE helix_environment_durable_goals
        DROP CONSTRAINT IF EXISTS helix_environment_durable_goals_environment_binding_id_fkey;
    `);
    // pg-mem names implicit foreign keys with `_fk`; PostgreSQL uses `_fkey`.
    // Dropping both keeps the migration portable across the keyed local store
    // and deployed PostgreSQL without inspecting either catalog at runtime.
    await client.query(`
      ALTER TABLE helix_environment_durable_goals
        DROP CONSTRAINT IF EXISTS helix_environment_durable_goals_environment_binding_id_fk;
    `);
    await client.query(`
      ALTER TABLE helix_environment_durable_goals
        DROP CONSTRAINT IF EXISTS helix_environment_durable_goals_subject_binding_id_fkey;
    `);
    await client.query(`
      ALTER TABLE helix_environment_durable_goals
        DROP CONSTRAINT IF EXISTS helix_environment_durable_goals_subject_binding_id_fk;
    `);
  },
};
