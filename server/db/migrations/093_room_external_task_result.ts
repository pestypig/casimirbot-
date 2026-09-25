import type { Migration } from "./migration";

export const migration093: Migration = {
  id: "093_room_external_task_result",
  description: "Persist encrypted, event-correlated external room task observations",
  run: async client => {
    await client.query(`CREATE TABLE IF NOT EXISTS helix_room_external_task_results (
      result_id text PRIMARY KEY,
      owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
      room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
      room_mission_id text NOT NULL,
      room_mission_revision integer NOT NULL CHECK (room_mission_revision > 0),
      steering_event_ref text NOT NULL UNIQUE,
      request_digest text NOT NULL,
      encrypted_payload text NOT NULL,
      encryption_key_id text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
  },
};
