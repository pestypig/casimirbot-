import type { Migration } from "./migration";
export const migration090: Migration = {
  id: "090_durable_steering",
  description: "Persist encrypted pairing-scoped steering identity and acknowledgement",
  run: async client => {
    await client.query(`CREATE TABLE IF NOT EXISTS helix_durable_steering (
      event_id text PRIMARY KEY,
      owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
      pairing_id text NOT NULL REFERENCES helix_pairing_ledger(pairing_id) ON DELETE CASCADE,
      event_cursor integer NOT NULL CHECK (event_cursor > 0),
      revision integer NOT NULL CHECK (revision > 0),
      request_digest text NOT NULL,
      encrypted_payload text NOT NULL,
      encryption_key_id text NOT NULL,
      UNIQUE(owner_profile_id, pairing_id, event_cursor)
    )`);
  },
};
