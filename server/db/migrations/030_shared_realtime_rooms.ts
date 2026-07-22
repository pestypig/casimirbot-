import type { Migration } from "./migration";

export const migration030: Migration = {
  id: "030_shared_realtime_rooms",
  description: "Add authenticated two-participant shared Realtime rooms",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_shared_realtime_rooms (
        room_id text PRIMARY KEY,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        title text NOT NULL,
        status text NOT NULL DEFAULT 'waiting_for_participant',
        max_participants integer NOT NULL DEFAULT 2,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        closed_at timestamptz,
        CHECK (max_participants = 2),
        CHECK (status IN (
          'waiting_for_participant',
          'waiting_for_consent',
          'ready',
          'active',
          'closed'
        ))
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_shared_realtime_room_members (
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        slot_number smallint NOT NULL,
        profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        participant_id text NOT NULL UNIQUE,
        member_role text NOT NULL,
        presence text NOT NULL DEFAULT 'present',
        consent jsonb NOT NULL DEFAULT '{}'::jsonb,
        joined_at timestamptz NOT NULL DEFAULT now(),
        last_seen_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        left_at timestamptz,
        PRIMARY KEY (room_id, slot_number),
        UNIQUE (room_id, profile_id),
        CHECK (slot_number IN (1, 2)),
        CHECK (
          (slot_number = 1 AND member_role = 'owner') OR
          (slot_number = 2 AND member_role = 'participant')
        ),
        CHECK (presence IN ('present', 'away', 'left'))
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_shared_realtime_room_invites (
        invite_id text PRIMARY KEY,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        created_by_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        token_hash text NOT NULL UNIQUE,
        status text NOT NULL DEFAULT 'active',
        expires_at timestamptz NOT NULL,
        redeemed_by_profile_id text REFERENCES helix_accounts(profile_id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        redeemed_at timestamptz,
        revoked_at timestamptz,
        CHECK (status IN ('active', 'redeemed', 'revoked', 'expired'))
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_shared_realtime_room_events (
        event_id text PRIMARY KEY,
        room_id text NOT NULL REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE CASCADE,
        actor_participant_id text,
        event_type text NOT NULL,
        metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_shared_realtime_rooms_owner_idx
      ON helix_shared_realtime_rooms (owner_profile_id, updated_at DESC);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_shared_realtime_room_members_profile_idx
      ON helix_shared_realtime_room_members (profile_id, updated_at DESC);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_shared_realtime_room_invites_room_idx
      ON helix_shared_realtime_room_invites (room_id, created_at DESC);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_shared_realtime_room_events_room_idx
      ON helix_shared_realtime_room_events (room_id, created_at ASC);
    `);
  },
};
