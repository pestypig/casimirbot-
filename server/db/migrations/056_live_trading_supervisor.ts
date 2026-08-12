import type { Migration } from "./migration";

export const migration056: Migration = {
  id: "056_live_trading_supervisor",
  description:
    "Add attended operator presence, supervisor health, and protective-exit attention state",
  run: async (client) => {
    await client.query(`
      ALTER TABLE helix_live_trading_controls
        ADD COLUMN IF NOT EXISTS operator_presence_at timestamptz,
        ADD COLUMN IF NOT EXISTS supervisor_status text NOT NULL DEFAULT 'disabled',
        ADD COLUMN IF NOT EXISTS attention_required boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS attention_reason text;
    `);
    await client.query(`
      ALTER TABLE helix_live_trading_controls
        DROP CONSTRAINT IF EXISTS helix_live_trading_controls_supervisor_status_check;
    `);
    await client.query(`
      ALTER TABLE helix_live_trading_controls
        ADD CONSTRAINT helix_live_trading_controls_supervisor_status_check
        CHECK (supervisor_status IN ('disabled','healthy','degraded'));
    `);
  },
};
