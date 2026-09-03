import type { Migration } from "./migration";

export const migration080: Migration = {
  id: "080_operator_activity_ledger",
  description: "Add owner-scoped durable Helix operator activity streams",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_operator_activity_streams (
        stream_ref text PRIMARY KEY,
        tenant_id text NOT NULL,
        account_profile_id text NOT NULL,
        profile_ref text NOT NULL,
        node_ref text NOT NULL,
        next_sequence bigint NOT NULL DEFAULT 0 CHECK (next_sequence >= 0),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (tenant_id, account_profile_id, profile_ref, node_ref)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_operator_activity_events (
        stream_ref text NOT NULL REFERENCES helix_operator_activity_streams(stream_ref) ON DELETE CASCADE,
        activity_event_id text NOT NULL,
        projection_sequence bigint NOT NULL CHECK (projection_sequence >= 0),
        source_kind text NOT NULL,
        source_schema text NOT NULL,
        source_event_ref text NOT NULL,
        run_id text,
        provider_thread_ref text,
        provider_thread_epoch text,
        event_payload jsonb NOT NULL,
        content_sha256 char(64) NOT NULL,
        observed_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (stream_ref, activity_event_id),
        UNIQUE (stream_ref, projection_sequence),
        UNIQUE (stream_ref, source_kind, source_schema, source_event_ref),
        CHECK ((provider_thread_ref IS NULL AND provider_thread_epoch IS NULL) OR
               (provider_thread_ref IS NOT NULL AND provider_thread_epoch IS NOT NULL))
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_operator_activity_scope_sequence_idx
      ON helix_operator_activity_events
        (stream_ref, run_id, provider_thread_ref, provider_thread_epoch, projection_sequence);
    `);
  },
};
