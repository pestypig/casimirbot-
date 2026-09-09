import type { Migration } from "./migration";

export const migration087: Migration = {
  id: "087_pairing_ledger",
  description: "Add server-owned encrypted finite task pairing ledger",
  run: async client => {
    await client.query(`CREATE TABLE IF NOT EXISTS helix_pairing_ledger (
      pairing_id text PRIMARY KEY,
      owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
      revision integer NOT NULL CHECK (revision > 0),
      request_digest text NOT NULL,
      encrypted_payload text NOT NULL,
      encryption_key_id text NOT NULL,
      UNIQUE (owner_profile_id, request_digest)
    )`);
  },
};
