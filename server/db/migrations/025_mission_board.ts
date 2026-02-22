import type { Migration } from "./migration";

export const migration025: Migration = {
  id: "025_mission_board",
  description: "Add mission board event storage",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS mission_board_events (
        id text PRIMARY KEY,
        mission_id text NOT NULL,
        type text NOT NULL,
        classification text NOT NULL,
        event_ts timestamptz NOT NULL,
        payload jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS mission_board_events_mission_idx ON mission_board_events(mission_id, event_ts);`,
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS mission_board_events_created_idx ON mission_board_events(created_at DESC);`,
    );
  },
};
