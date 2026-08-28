import type { Migration } from "./migration";

export const migration068: Migration = {
  id: "068_paper_reactive_partial_fills",
  description:
    "Add deterministic execution models and cumulative partial-fill state to local paper orders",
  run: async (client) => {
    await client.query(`
      ALTER TABLE helix_paper_orders
        ADD COLUMN IF NOT EXISTS execution_model_json jsonb,
        ADD COLUMN IF NOT EXISTS filled_quantity_micros bigint NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS filled_notional_cents integer NOT NULL DEFAULT 0;
    `);
    await client.query(`
      UPDATE helix_paper_orders
      SET filled_quantity_micros = quantity_micros,
          filled_notional_cents = notional_cents
      WHERE status = 'filled' AND filled_quantity_micros = 0;
    `);
    await client.query(`
      ALTER TABLE helix_paper_orders
        ADD CONSTRAINT helix_paper_orders_fill_state_check
        CHECK (
          filled_quantity_micros >= 0 AND
          filled_quantity_micros <= quantity_micros AND
          filled_notional_cents >= 0 AND
          reserved_cents >= 0
        );
    `);
    await client.query(`
      ALTER TABLE helix_paper_fills
        DROP CONSTRAINT IF EXISTS helix_paper_fills_order_id_key;
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS helix_paper_fills_order_observation_idx
      ON helix_paper_fills (order_id, source_observation_id);
    `);
  },
};
