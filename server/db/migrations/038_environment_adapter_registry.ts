import type { Migration } from "./migration";

export const migration038: Migration = {
  id: "038_environment_adapter_registry",
  description:
    "Add durable, credential- and producer-epoch-scoped environment adapter admissions",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_environment_adapter_admissions (
        admission_id text PRIMARY KEY,
        binding_id text NOT NULL REFERENCES helix_room_source_bindings(binding_id) ON DELETE CASCADE,
        credential_id text NOT NULL REFERENCES helix_room_source_credentials(credential_id) ON DELETE CASCADE,
        producer_epoch text NOT NULL,
        room_id text NOT NULL,
        source_id text NOT NULL,
        world_id text NOT NULL,
        domain_adapter text NOT NULL,
        adapter_profile_id text NOT NULL,
        adapter_profile_version integer NOT NULL,
        adapter_contract_hash text NOT NULL,
        manifest_id text NOT NULL,
        manifest_hash text NOT NULL,
        source_family text NOT NULL,
        mechanics_collection_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
        status text NOT NULL DEFAULT 'active',
        admitted_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        revoked_at timestamptz,
        CHECK (status IN ('active', 'superseded', 'revoked', 'expired')),
        CHECK (adapter_profile_version > 0),
        CHECK (adapter_contract_hash LIKE 'sha256:%'),
        CHECK (manifest_hash LIKE 'sha256:%'),
        UNIQUE (
          binding_id,
          credential_id,
          producer_epoch,
          manifest_hash
        )
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_environment_adapter_admissions_active_idx
      ON helix_environment_adapter_admissions (
        binding_id,
        credential_id,
        producer_epoch
      )
      WHERE status = 'active';
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_adapter_admissions_binding_idx
      ON helix_environment_adapter_admissions (
        binding_id,
        admitted_at DESC
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_environment_adapter_admissions_identity_idx
      ON helix_environment_adapter_admissions (
        room_id,
        source_id,
        world_id,
        domain_adapter,
        admitted_at DESC
      )
      WHERE status = 'active';
    `);
  },
};
