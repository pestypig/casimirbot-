import type { Migration } from "./migration";
export const migration089: Migration = {
  id: "089_pairing_destination_identity",
  description: "Add encrypted recoverable destination metadata without inventing legacy identity",
  run: async client => {
    await client.query("ALTER TABLE helix_pairing_destinations ADD COLUMN IF NOT EXISTS encrypted_identity text");
    await client.query("ALTER TABLE helix_pairing_destinations ADD COLUMN IF NOT EXISTS encryption_key_id text");
  },
};
