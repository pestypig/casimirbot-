import type { Migration } from "./migration";

const CONTROL_RELEASE_CONSTRAINT =
  "helix_environment_action_results_controls_released_check";

export const migration078: Migration = {
  id: "078_environment_action_result_control_release_check",
  description:
    "Normalize the terminal action-result control-release check for portable schema diffs",
  run: async (client) => {
    await client.query(`
      ALTER TABLE helix_environment_action_results
      DROP CONSTRAINT IF EXISTS ${CONTROL_RELEASE_CONSTRAINT};
    `);
    await client.query(`
      ALTER TABLE helix_environment_action_results
      ADD CONSTRAINT ${CONTROL_RELEASE_CONSTRAINT}
      CHECK (controls_released = true);
    `);
  },
};
