import type { Migration } from "./migration";

export const migration088: Migration = {
  id: "088_pairing_destinations",
  description: "Persist authenticated destination registrations independently of presence",
  run: async client => {
    await client.query(`CREATE TABLE IF NOT EXISTS helix_pairing_destinations (
      registration_id text PRIMARY KEY,
      owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
      destination_digest text NOT NULL,
      created_at timestamptz NOT NULL,
      expires_at timestamptz NOT NULL,
      revoked_at timestamptz,
      CHECK (expires_at > created_at)
    )`);
  },
};
