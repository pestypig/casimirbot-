import type { Migration } from "./migration";

export const migration066: Migration = {
  id: "066_live_attendance_generation",
  description:
    "Bind attended live heartbeats to a revocable generation so late heartbeats cannot restore ended presence",
  run: async (client) => {
    await client.query(`
      ALTER TABLE helix_live_trading_controls
        ADD COLUMN IF NOT EXISTS operator_attendance_id_hash text,
        ADD COLUMN IF NOT EXISTS operator_attendance_status text NOT NULL
          DEFAULT 'inactive';
    `);
    await client.query(`
      ALTER TABLE helix_live_trading_controls
        DROP CONSTRAINT IF EXISTS helix_live_trading_controls_attendance_status_check,
        DROP CONSTRAINT IF EXISTS helix_live_trading_controls_attendance_hash_check;
    `);
    await client.query(`
      ALTER TABLE helix_live_trading_controls
        ADD CONSTRAINT helix_live_trading_controls_attendance_status_check
          CHECK (operator_attendance_status IN ('active','inactive')),
        ADD CONSTRAINT helix_live_trading_controls_attendance_hash_check
          CHECK (operator_attendance_id_hash IS NULL OR
            operator_attendance_id_hash LIKE 'sha256:%');
    `);
    await client.query(`
      UPDATE helix_live_trading_controls
      SET operator_armed = false,
          operator_presence_at = NULL,
          operator_attendance_id_hash = NULL,
          operator_attendance_status = 'inactive',
          kill_switch_active = true,
          kill_switch_reason =
            'Attended session requires an explicit restart after attendance-generation migration',
          updated_at = now()
      WHERE operator_armed = true OR operator_presence_at IS NOT NULL;
    `);
  },
};
