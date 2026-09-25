import type { Migration } from "./migration";

export const migration092: Migration = {
  id: "092_room_external_mission",
  description: "Persist one explicitly selected external mission principal and revision per Live room",
  run: async client => {
    await client.query(`CREATE TABLE IF NOT EXISTS helix_room_external_missions (
      room_id text PRIMARY KEY REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
      owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
      owner_participant_id text NOT NULL,
      mission_id text NOT NULL UNIQUE,
      mission_revision integer NOT NULL CHECK (mission_revision > 0),
      status text NOT NULL CHECK (status IN ('active', 'revoked')),
      reasoning_binding_id text NOT NULL,
      binding_epoch integer NOT NULL CHECK (binding_epoch > 0),
      helix_conversation_id text NOT NULL,
      binding_mission_id text,
      run_id text,
      request_id text NOT NULL,
      request_digest text NOT NULL,
      created_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL,
      revoked_at timestamptz
    )`);
  },
};
