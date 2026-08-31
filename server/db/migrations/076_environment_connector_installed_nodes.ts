import type { Migration } from "./migration";

export const migration076: Migration = {
  id: "076_environment_connector_installed_nodes",
  description:
    "Bind environment connector installations and room grants to exact profile-owned installed nodes",
  run: async (client) => {
    await client.query(`
      ALTER TABLE helix_environment_connector_installations
      ADD COLUMN IF NOT EXISTS installed_device_id text;
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_connector_installations_node_idx
      ON helix_environment_connector_installations
        (owner_profile_id, installed_device_id, status);
    `);
    await client.query(`
      ALTER TABLE helix_room_environment_capability_grants
      ADD COLUMN IF NOT EXISTS installed_node_ref text;
    `);
    await client.query(`
      UPDATE helix_room_environment_capability_grants
      SET installed_node_ref = installation_id
      WHERE installed_node_ref IS NULL;
    `);
    await client.query(`
      ALTER TABLE helix_room_environment_capability_grants
      ALTER COLUMN installed_node_ref SET NOT NULL;
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_room_environment_capability_grants_node_idx
      ON helix_room_environment_capability_grants
        (room_id, installed_node_ref, environment_binding_id, status);
    `);
  },
};
