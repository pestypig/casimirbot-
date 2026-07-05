import type { Migration } from "./migration";

export const migration026: Migration = {
  id: "026_helix_accounts",
  description: "Add persistent Helix account sessions and profile storage",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_accounts (
        profile_id text PRIMARY KEY,
        display_name text NOT NULL,
        email text,
        account_type text NOT NULL DEFAULT 'user',
        provider text NOT NULL DEFAULT 'local',
        provider_subject text,
        picture_url text,
        deleted_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_account_linked_providers (
        provider text NOT NULL,
        provider_subject text NOT NULL,
        profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        email text,
        display_name text,
        picture_url text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (provider, provider_subject)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_account_sessions (
        session_id text PRIMARY KEY,
        profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        status text NOT NULL DEFAULT 'active',
        memory_scope text NOT NULL DEFAULT 'profile',
        account_policy jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_account_profile_storage (
        profile_id text PRIMARY KEY REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        snapshot jsonb NOT NULL,
        total_entry_bytes integer NOT NULL DEFAULT 0,
        quota_bytes integer NOT NULL DEFAULT 0,
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_account_events (
        event_id text PRIMARY KEY,
        profile_id text,
        session_id text,
        event_type text NOT NULL,
        payload jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS helix_account_sessions_profile_idx ON helix_account_sessions(profile_id, updated_at DESC);`,
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS helix_account_sessions_active_idx ON helix_account_sessions(status, expires_at);`,
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS helix_account_events_profile_idx ON helix_account_events(profile_id, created_at DESC);`,
    );
  },
};
