import type { Migration } from "./migration";

export const migration029: Migration = {
  id: "029_helix_research_library",
  description: "Add encrypted profile-scoped scholarly extraction library",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_research_library_documents (
        document_id text PRIMARY KEY,
        profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        source_integrity_hash text NOT NULL,
        metadata jsonb NOT NULL,
        encrypted_content text NOT NULL,
        encryption_key_id text NOT NULL,
        encryption_algorithm text NOT NULL,
        content_bytes integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz,
        UNIQUE (profile_id, source_integrity_hash)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_research_library_profile_idx
      ON helix_research_library_documents (profile_id, updated_at DESC)
      WHERE deleted_at IS NULL;
    `);
  },
};

