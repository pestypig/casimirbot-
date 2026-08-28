import type { Migration } from "./migration";

export const migration065: Migration = {
  id: "065_environment_monitor_provider_neutral_identity",
  description:
    "Keep exact monitor environment and subject identities without coupling the generic lease to one connector domain",
  run: async (client) => {
    // Monitor creation authenticates both identifiers against the exact durable
    // goal, participant grant, current producer epoch, policy revision, and run.
    // They are therefore historical cross-adapter identity fields rather than
    // ownership parents. Brokerage uses a room binding and paper account here;
    // future adapters may use their own typed identities as well.
    const columns = ["environment_binding_id", "subject_ref"];
    for (const column of columns) {
      await client.query(`
        ALTER TABLE helix_environment_monitor_leases
          DROP CONSTRAINT IF EXISTS helix_environment_monitor_leases_${column}_fkey;
      `);
      // pg-mem names implicit foreign keys with `_fk`; PostgreSQL uses `_fkey`.
      await client.query(`
        ALTER TABLE helix_environment_monitor_leases
          DROP CONSTRAINT IF EXISTS helix_environment_monitor_leases_${column}_fk;
      `);
    }
  },
};
