import type { Migration } from "./migration";
export const migration091: Migration = {
  id: "091_pairing_delivery",
  description: "Persist encrypted invitation delivery outcomes independently of pairing consent",
  run: async client => {
    await client.query(`CREATE TABLE IF NOT EXISTS helix_pairing_delivery (
      delivery_id text PRIMARY KEY,
      owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
      pairing_id text NOT NULL REFERENCES helix_pairing_ledger(pairing_id) ON DELETE CASCADE,
      revision integer NOT NULL CHECK (revision > 0),
      encrypted_payload text NOT NULL,
      encryption_key_id text NOT NULL,
      UNIQUE(owner_profile_id, pairing_id)
    )`);
  },
};
