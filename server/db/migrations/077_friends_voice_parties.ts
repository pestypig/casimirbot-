import type { Migration } from "./migration";

export const migration077: Migration = {
  id: "077_friends_voice_parties",
  description: "Add durable social profiles, friendships, presence, and two-person voice parties",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_social_profiles (
        profile_id text PRIMARY KEY REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        handle text NOT NULL,
        handle_canonical text NOT NULL UNIQUE,
        discovery_policy text NOT NULL DEFAULT 'exact_handle',
        presence_visibility text NOT NULL DEFAULT 'friends',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (discovery_policy IN ('exact_handle', 'invite_only', 'hidden')),
        CHECK (presence_visibility IN ('friends', 'party_members', 'nobody'))
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_friendships (
        friendship_id text PRIMARY KEY,
        requester_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        recipient_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        pair_low_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        pair_high_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        status text NOT NULL DEFAULT 'pending',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        accepted_at timestamptz,
        removed_at timestamptz,
        UNIQUE (pair_low_profile_id, pair_high_profile_id),
        CHECK (requester_profile_id <> recipient_profile_id),
        CHECK (pair_low_profile_id < pair_high_profile_id),
        CHECK (status IN ('pending', 'accepted', 'removed'))
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_social_blocks (
        blocker_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        blocked_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (blocker_profile_id, blocked_profile_id),
        CHECK (blocker_profile_id <> blocked_profile_id)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_social_presence (
        profile_id text PRIMARY KEY REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        state text NOT NULL DEFAULT 'online',
        observed_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz NOT NULL,
        CHECK (state IN ('online', 'away', 'in_party', 'offline')),
        CHECK (expires_at >= observed_at)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_voice_parties (
        party_id text PRIMARY KEY,
        owner_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        state text NOT NULL DEFAULT 'created',
        max_members integer NOT NULL DEFAULT 2,
        room_id text REFERENCES helix_shared_realtime_rooms(room_id) ON DELETE SET NULL,
        gpt_attachment_state text NOT NULL DEFAULT 'detached',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        ended_at timestamptz,
        CHECK (max_members = 2),
        CHECK (state IN ('created', 'inviting', 'connecting', 'active', 'degraded', 'reconnecting', 'ended')),
        CHECK (gpt_attachment_state IN ('detached', 'attaching', 'connected', 'degraded'))
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_voice_party_members (
        party_id text NOT NULL REFERENCES helix_voice_parties(party_id) ON DELETE CASCADE,
        slot_number smallint NOT NULL,
        profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        participant_id text NOT NULL UNIQUE,
        member_role text NOT NULL,
        member_state text NOT NULL DEFAULT 'joining',
        media_state text NOT NULL DEFAULT 'idle',
        muted boolean NOT NULL DEFAULT false,
        deafened boolean NOT NULL DEFAULT false,
        joined_at timestamptz,
        last_seen_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        left_at timestamptz,
        PRIMARY KEY (party_id, slot_number),
        UNIQUE (party_id, profile_id),
        CHECK (slot_number IN (1, 2)),
        CHECK ((slot_number = 1 AND member_role = 'owner') OR (slot_number = 2 AND member_role = 'participant')),
        CHECK (member_state IN ('invited', 'joining', 'connected', 'reconnecting', 'left')),
        CHECK (media_state IN ('idle', 'connecting', 'connected', 'direct', 'relayed', 'degraded', 'failed', 'stopped'))
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS helix_voice_party_invites (
        invite_id text PRIMARY KEY,
        party_id text NOT NULL REFERENCES helix_voice_parties(party_id) ON DELETE CASCADE,
        created_by_profile_id text NOT NULL REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
        recipient_profile_id text REFERENCES helix_accounts(profile_id) ON DELETE CASCADE,
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
      CREATE TABLE IF NOT EXISTS helix_voice_party_media_signals (
        signal_id text PRIMARY KEY,
        party_id text NOT NULL REFERENCES helix_voice_parties(party_id) ON DELETE CASCADE,
        negotiation_id text NOT NULL,
        sender_participant_id text NOT NULL REFERENCES helix_voice_party_members(participant_id) ON DELETE CASCADE,
        target_participant_id text NOT NULL REFERENCES helix_voice_party_members(participant_id) ON DELETE CASCADE,
        kind text NOT NULL,
        description jsonb,
        candidate jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz NOT NULL,
        CHECK (sender_participant_id <> target_participant_id),
        CHECK (kind IN ('offer', 'answer', 'ice_candidate', 'hangup')),
        CHECK (expires_at >= created_at)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_friendships_requester_idx
      ON helix_friendships (requester_profile_id, updated_at DESC);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_friendships_recipient_idx
      ON helix_friendships (recipient_profile_id, updated_at DESC);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_social_presence_expiry_idx
      ON helix_social_presence (expires_at);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_voice_party_members_profile_idx
      ON helix_voice_party_members (profile_id, updated_at DESC);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_voice_party_invites_party_idx
      ON helix_voice_party_invites (party_id, created_at DESC);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS helix_voice_party_media_signals_target_idx
      ON helix_voice_party_media_signals (
        party_id, target_participant_id, created_at ASC
      );
    `);
  },
};
