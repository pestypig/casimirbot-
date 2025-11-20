import type { Migration } from "./migration";

export const migration011: Migration = {
  id: "011_essence_activity",
  description: "Track activity samples and detected phase profiles",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS essence_activity_samples (
        id text PRIMARY KEY,
        owner_id text,
        ts timestamptz NOT NULL,
        panel_id text,
        file text,
        repo text,
        tag text,
        duration_sec integer,
        updates integer,
        meta jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS essence_activity_samples_owner_ts_idx
      ON essence_activity_samples (owner_id, ts DESC);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS essence_phase_profiles (
        id text PRIMARY KEY,
        owner_id text NOT NULL,
        phase_id text NOT NULL,
        score double precision NOT NULL,
        top_panels jsonb NOT NULL DEFAULT '[]'::jsonb,
        top_files jsonb NOT NULL DEFAULT '[]'::jsonb,
        env_hints jsonb NOT NULL DEFAULT '{}'::jsonb,
        sample_start timestamptz NOT NULL,
        sample_end timestamptz NOT NULL,
        rationale text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS essence_phase_profiles_owner_idx
      ON essence_phase_profiles (owner_id, created_at DESC);
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS essence_phase_profiles_window_idx
      ON essence_phase_profiles (owner_id, phase_id, sample_start, sample_end);
    `);
  },
};
