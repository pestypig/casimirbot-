import type { Migration } from "./migration";

export const migration045: Migration = {
  id: "045_connector_command_pairing",
  description:
    "Allow an explicit source re-pair to deliver a separate command credential directly to the connector",
  run: async (client) => {
    await client.query(`
      ALTER TABLE helix_connector_pairing_codes
      ADD COLUMN IF NOT EXISTS command_credential_requested boolean NOT NULL DEFAULT false;
    `);
    await client.query(`
      ALTER TABLE helix_environment_command_connector_credentials
      ADD COLUMN IF NOT EXISTS bootstrap_pairing_id text;
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_environment_command_connector_credentials_pairing_idx
      ON helix_environment_command_connector_credentials (bootstrap_pairing_id)
      WHERE bootstrap_pairing_id IS NOT NULL;
    `);
  },
};
