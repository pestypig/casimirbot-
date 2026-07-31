import type { Migration } from "./migration";

export const migration041: Migration = {
  id: "041_casimir_theory_execution_state",
  description:
    "Persist confirmation-gated formal and numerical execution lifecycle state",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS casimir_theory_execution_state (
        lane text NOT NULL,
        record_kind text NOT NULL,
        record_id text NOT NULL,
        payload jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (lane, record_kind, record_id),
        CHECK (
          lane IN (
            'formal_v2',
            'independent_numerical_v1'
          )
        ),
        CHECK (record_kind IN ('prepared', 'plan', 'job')),
        CHECK (record_id <> '')
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS casimir_theory_execution_state_lane_kind_idx
      ON casimir_theory_execution_state(lane, record_kind);
    `);
  },
};
