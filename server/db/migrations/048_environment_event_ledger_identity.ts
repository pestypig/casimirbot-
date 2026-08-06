import type { Migration } from "./migration";

/**
 * Completes the typed environment-event identity introduced with the player
 * action plane. Migration 046 is also kept current for fresh databases; this
 * migration upgrades local/keyed databases where 046 has already run.
 */
export const migration048: Migration = {
  id: "048_environment_event_ledger_identity",
  description:
    "Add producer-plane, subject, workflow, and provenance identity to the durable environment event ledger",
  async run(client) {
    await client.query(`
      ALTER TABLE helix_environment_event_batches
      ADD COLUMN IF NOT EXISTS producer_plane text;
    `);
    await client.query(`
      UPDATE helix_environment_event_batches
      SET producer_plane = 'player_embodiment'
      WHERE producer_plane IS NULL;
    `);
    await client.query(`
      ALTER TABLE helix_environment_event_batches
      ALTER COLUMN producer_plane SET NOT NULL;
    `);
    await client.query(`
      ALTER TABLE helix_environment_event_batches
      ADD CONSTRAINT helix_environment_event_batches_producer_plane_check
      CHECK (producer_plane IN ('world_authority', 'player_embodiment'));
    `);

    await client.query(`
      ALTER TABLE helix_environment_events
      ADD COLUMN IF NOT EXISTS producer_plane text;
    `);
    await client.query(`
      ALTER TABLE helix_environment_events
      ADD COLUMN IF NOT EXISTS subject_ref text;
    `);
    await client.query(`
      ALTER TABLE helix_environment_events
      ADD COLUMN IF NOT EXISTS workflow_ref text;
    `);
    await client.query(`
      ALTER TABLE helix_environment_events
      ADD COLUMN IF NOT EXISTS provenance text;
    `);
    await client.query(`
      UPDATE helix_environment_events
      SET producer_plane = COALESCE(producer_plane, 'player_embodiment'),
          subject_ref = COALESCE(subject_ref, event_payload ->> 'subject_ref'),
          workflow_ref = COALESCE(workflow_ref, event_payload ->> 'workflow_ref'),
          provenance = COALESCE(provenance, event_payload ->> 'provenance', 'reported');
    `);
    await client.query(`
      ALTER TABLE helix_environment_events
      ALTER COLUMN producer_plane SET NOT NULL;
    `);
    await client.query(`
      ALTER TABLE helix_environment_events
      ALTER COLUMN provenance SET NOT NULL;
    `);
    await client.query(`
      ALTER TABLE helix_environment_events
      ADD CONSTRAINT helix_environment_events_producer_plane_check
      CHECK (producer_plane IN ('world_authority', 'player_embodiment'));
    `);
    await client.query(`
      ALTER TABLE helix_environment_events
      ADD CONSTRAINT helix_environment_events_provenance_check
      CHECK (provenance IN ('measured', 'reported', 'derived'));
    `);

    await client.query(`
      ALTER TABLE helix_environment_situation_digests
      ADD COLUMN IF NOT EXISTS producer_plane text;
    `);
    await client.query(`
      UPDATE helix_environment_situation_digests
      SET producer_plane = COALESCE(
        producer_plane,
        digest_payload ->> 'producer_plane',
        'player_embodiment'
      );
    `);
    await client.query(`
      ALTER TABLE helix_environment_situation_digests
      ALTER COLUMN producer_plane SET NOT NULL;
    `);
    await client.query(`
      ALTER TABLE helix_environment_situation_digests
      ADD CONSTRAINT helix_environment_situation_digests_producer_plane_check
      CHECK (producer_plane IN ('world_authority', 'player_embodiment'));
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_events_subject_sequence_idx
      ON helix_environment_events (
        environment_binding_id, producer_epoch_ref, subject_ref, sequence DESC
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_situation_digests_latest_idx
      ON helix_environment_situation_digests (
        environment_binding_id, subject_ref, observed_at DESC
      );
    `);
  },
};
