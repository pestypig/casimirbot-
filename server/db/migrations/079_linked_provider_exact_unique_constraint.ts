import type { Migration } from "./migration";

export const migration079: Migration = {
  id: "079_linked_provider_exact_unique_constraint",
  description:
    "Materialize linked-provider ownership uniqueness as an explicit FK prerequisite",
  run: async (client) => {
    await client.query(`
      ALTER TABLE helix_account_linked_providers
      ADD CONSTRAINT helix_account_linked_providers_exact_unique
      UNIQUE (
        provider,
        provider_subject,
        profile_id
      );
    `);
  },
};
