import type { Migration } from "./migration";

export const migration040: Migration = {
  id: "040_environment_probe_execution_authority",
  description:
    "Persist the server-selected execution authority for durable environment probes",
  run: async (client) => {
    await client.query(`
      ALTER TABLE helix_environment_probe_requests
      ADD COLUMN execution_authority_kind text;
    `);
    await client.query(`
      UPDATE helix_environment_probe_requests
      SET execution_authority_kind = 'external_agent_run'
      WHERE execution_authority_kind IS NULL;
    `);
    await client.query(`
      ALTER TABLE helix_environment_probe_requests
      ALTER COLUMN execution_authority_kind
      SET DEFAULT 'external_agent_run';
    `);
    await client.query(`
      ALTER TABLE helix_environment_probe_requests
      ALTER COLUMN execution_authority_kind
      SET NOT NULL;
    `);
    await client.query(`
      ALTER TABLE helix_environment_probe_requests
      ADD CONSTRAINT helix_environment_probe_requests_execution_authority_kind_ck
      CHECK (
        execution_authority_kind IN (
          'external_agent_run',
          'first_party_shared_room'
        )
      );
    `);
  },
};
