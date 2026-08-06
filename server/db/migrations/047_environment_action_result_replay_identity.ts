import type { Migration } from "./migration";

export const migration047: Migration = {
  id: "047_environment_action_result_replay_identity",
  description:
    "Preserve submitted connector result identities separately from canonical result hashes and record provenance/re-entry eligibility",
  async run(client) {
    await client.query(`
      ALTER TABLE helix_environment_action_results
      ADD COLUMN IF NOT EXISTS submitted_result_hash text;
    `);
    await client.query(`
      UPDATE helix_environment_action_results
      SET submitted_result_hash = result_hash
      WHERE submitted_result_hash IS NULL;
    `);
    await client.query(`
      ALTER TABLE helix_environment_action_results
      ALTER COLUMN submitted_result_hash SET NOT NULL;
    `);
    await client.query(`
      ALTER TABLE helix_environment_action_results
      ADD CONSTRAINT helix_environment_action_results_submitted_hash_check
      CHECK (submitted_result_hash LIKE 'sha256:%');
    `);
    await client.query(`
      ALTER TABLE helix_environment_action_control_results
      ADD COLUMN IF NOT EXISTS submitted_result_hash text;
    `);
    await client.query(`
      UPDATE helix_environment_action_control_results
      SET submitted_result_hash = result_hash
      WHERE submitted_result_hash IS NULL;
    `);
    await client.query(`
      ALTER TABLE helix_environment_action_control_results
      ALTER COLUMN submitted_result_hash SET NOT NULL;
    `);
    await client.query(`
      ALTER TABLE helix_environment_action_control_results
      ADD COLUMN IF NOT EXISTS provenance_valid boolean NOT NULL DEFAULT false;
    `);
    await client.query(`
      ALTER TABLE helix_environment_action_control_results
      ADD COLUMN IF NOT EXISTS eligible_for_current_turn_reentry boolean NOT NULL DEFAULT false;
    `);
    await client.query(`
      ALTER TABLE helix_environment_action_control_results
      ADD CONSTRAINT helix_environment_action_control_results_submitted_hash_check
      CHECK (submitted_result_hash LIKE 'sha256:%');
    `);
  },
};
