import type { Migration } from "./migration";

export const migration027: Migration = {
  id: "027_helix_account_credentials",
  description: "Add public account credentials and encrypted profile storage fields",
  run: async (client) => {
    await client.query(`
      ALTER TABLE helix_accounts
      ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_account_credentials (
        credential_id text PRIMARY KEY,
        profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        credential_type text NOT NULL,
        subject text NOT NULL,
        password_hash text,
        expires_at timestamptz,
        consumed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        revoked_at timestamptz
      );
    `);
    await client.query(`
      ALTER TABLE helix_account_credentials
      ADD COLUMN IF NOT EXISTS expires_at timestamptz,
      ADD COLUMN IF NOT EXISTS consumed_at timestamptz;
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_account_credentials_active_subject_idx
      ON helix_account_credentials (credential_type, lower(subject))
      WHERE revoked_at IS NULL;
    `);
    await client.query(`
      ALTER TABLE helix_account_profile_storage
      ADD COLUMN IF NOT EXISTS encrypted_snapshot text,
      ADD COLUMN IF NOT EXISTS encryption_key_id text,
      ADD COLUMN IF NOT EXISTS encryption_algorithm text;
    `);
  },
};
