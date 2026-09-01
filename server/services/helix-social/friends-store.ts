import crypto from "node:crypto";
import type {
  HelixFriendship,
  HelixFriendshipState,
  HelixSocialDiscoveryPolicy,
  HelixSocialPresence,
  HelixSocialPresenceState,
  HelixSocialPresenceVisibility,
  HelixSocialProfile,
} from "@shared/helix-friends-voice-party";
import {
  HELIX_FRIENDSHIP_SCHEMA,
  HELIX_SOCIAL_PRESENCE_SCHEMA,
  HELIX_SOCIAL_PROFILE_SCHEMA,
} from "@shared/helix-friends-voice-party";
import {
  ensureDatabase,
  getPool,
  persistLocalDatabaseSnapshotIfEnabled,
} from "../../db/client";

const SOCIAL_TABLES = [
  "helix_social_profiles",
  "helix_friendships",
  "helix_social_blocks",
  "helix_social_presence",
] as const;

type SocialProfileRow = {
  profile_id: string;
  handle: string;
  display_name: string;
  picture_url: string | null;
  discovery_policy: HelixSocialDiscoveryPolicy;
  presence_visibility: HelixSocialPresenceVisibility;
  updated_at: Date | string;
};

type FriendshipRow = SocialProfileRow & {
  friendship_id: string;
  requester_profile_id: string;
  recipient_profile_id: string;
  status: "pending" | "accepted" | "removed";
  created_at: Date | string;
  friendship_updated_at: Date | string;
};

const iso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const projectProfile = (row: SocialProfileRow): HelixSocialProfile => ({
  schema: HELIX_SOCIAL_PROFILE_SCHEMA,
  profile_id: row.profile_id,
  handle: row.handle,
  display_name: row.display_name,
  picture_url: row.picture_url,
  discovery_policy: row.discovery_policy,
  presence_visibility: row.presence_visibility,
  updated_at: iso(row.updated_at),
});

export class HelixFriendsDomainError extends Error {
  constructor(
    readonly code:
      | "social_profile_invalid"
      | "social_handle_unavailable"
      | "social_profile_not_found"
      | "friendship_invalid"
      | "friendship_blocked"
      | "friendship_conflict",
    readonly statusCode: 400 | 403 | 404 | 409,
    message: string,
  ) {
    super(message);
    this.name = "HelixFriendsDomainError";
  }
}

const canonicalHandle = (value: string): string => value.trim().toLowerCase();

const requireValidHandle = (value: string): { handle: string; canonical: string } => {
  const handle = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,31}$/.test(handle)) {
    throw new HelixFriendsDomainError(
      "social_profile_invalid",
      400,
      "Handles must be 3–32 letters, numbers, dots, underscores, or hyphens.",
    );
  }
  return { handle, canonical: canonicalHandle(handle) };
};

const orderedPair = (left: string, right: string): [string, string] =>
  left < right ? [left, right] : [right, left];

const persistSocialTables = async (): Promise<void> => {
  await persistLocalDatabaseSnapshotIfEnabled([...SOCIAL_TABLES]);
};

export const upsertHelixSocialProfile = async (input: {
  profileId: string;
  handle: string;
  discoveryPolicy?: HelixSocialDiscoveryPolicy;
  presenceVisibility?: HelixSocialPresenceVisibility;
}): Promise<HelixSocialProfile> => {
  await ensureDatabase();
  const { handle, canonical } = requireValidHandle(input.handle);
  try {
    const result = await getPool().query<SocialProfileRow>(`
      INSERT INTO helix_social_profiles (
        profile_id, handle, handle_canonical, discovery_policy,
        presence_visibility, updated_at
      ) VALUES ($1, $2, $3, $4, $5, now())
      ON CONFLICT (profile_id) DO UPDATE SET
        handle = EXCLUDED.handle,
        handle_canonical = EXCLUDED.handle_canonical,
        discovery_policy = EXCLUDED.discovery_policy,
        presence_visibility = EXCLUDED.presence_visibility,
        updated_at = now()
      RETURNING
        profile_id,
        handle,
        (SELECT display_name FROM helix_accounts WHERE profile_id = $1) AS display_name,
        (SELECT picture_url FROM helix_accounts WHERE profile_id = $1) AS picture_url,
        discovery_policy,
        presence_visibility,
        updated_at;
    `, [
      input.profileId,
      handle,
      canonical,
      input.discoveryPolicy ?? "exact_handle",
      input.presenceVisibility ?? "friends",
    ]);
    await persistSocialTables();
    return projectProfile(result.rows[0]!);
  } catch (error) {
    if (/unique|duplicate/i.test(error instanceof Error ? error.message : "")) {
      throw new HelixFriendsDomainError(
        "social_handle_unavailable",
        409,
        "That handle is unavailable.",
      );
    }
    throw error;
  }
};

export const findHelixSocialProfileByExactHandle = async (input: {
  viewerProfileId: string;
  handle: string;
}): Promise<HelixSocialProfile> => {
  await ensureDatabase();
  const canonical = canonicalHandle(input.handle);
  const result = await getPool().query<SocialProfileRow>(`
    SELECT
      sp.profile_id, sp.handle, a.display_name, a.picture_url,
      sp.discovery_policy, sp.presence_visibility, sp.updated_at
    FROM helix_social_profiles sp
    JOIN helix_accounts a ON a.profile_id = sp.profile_id
    LEFT JOIN helix_social_blocks viewer_block
      ON viewer_block.blocker_profile_id = $2
      AND viewer_block.blocked_profile_id = sp.profile_id
    LEFT JOIN helix_social_blocks peer_block
      ON peer_block.blocker_profile_id = sp.profile_id
      AND peer_block.blocked_profile_id = $2
    WHERE sp.handle_canonical = $1
      AND sp.discovery_policy = 'exact_handle'
      AND viewer_block.blocker_profile_id IS NULL
      AND peer_block.blocker_profile_id IS NULL
    LIMIT 1;
  `, [canonical, input.viewerProfileId]);
  if (!result.rows[0]) {
    throw new HelixFriendsDomainError(
      "social_profile_not_found",
      404,
      "No discoverable profile matches that exact handle.",
    );
  }
  return projectProfile(result.rows[0]);
};

export const readOwnHelixSocialProfile = async (
  profileId: string,
): Promise<HelixSocialProfile | null> => {
  await ensureDatabase();
  const result = await getPool().query<SocialProfileRow>(`
    SELECT
      sp.profile_id, sp.handle, a.display_name, a.picture_url,
      sp.discovery_policy, sp.presence_visibility, sp.updated_at
    FROM helix_social_profiles sp
    JOIN helix_accounts a ON a.profile_id = sp.profile_id
    WHERE sp.profile_id = $1;
  `, [profileId]);
  return result.rows[0] ? projectProfile(result.rows[0]) : null;
};

export const requestHelixFriendship = async (input: {
  requesterProfileId: string;
  recipientHandle: string;
}): Promise<HelixFriendship> => {
  const peer = await findHelixSocialProfileByExactHandle({
    viewerProfileId: input.requesterProfileId,
    handle: input.recipientHandle,
  });
  if (peer.profile_id === input.requesterProfileId) {
    throw new HelixFriendsDomainError(
      "friendship_invalid",
      400,
      "A profile cannot friend itself.",
    );
  }
  const [pairLow, pairHigh] = orderedPair(input.requesterProfileId, peer.profile_id);
  try {
    const existing = await getPool().query<{ status: string }>(`
      SELECT status FROM helix_friendships
      WHERE pair_low_profile_id = $1 AND pair_high_profile_id = $2;
    `, [pairLow, pairHigh]);
    if (existing.rows[0]?.status === "pending" || existing.rows[0]?.status === "accepted") {
      throw new HelixFriendsDomainError(
        "friendship_conflict",
        409,
        "An active friendship or request already exists.",
      );
    }
    const friendshipId = `friendship:${crypto.randomUUID()}`;
    await getPool().query(`
      INSERT INTO helix_friendships (
        friendship_id, requester_profile_id, recipient_profile_id,
        pair_low_profile_id, pair_high_profile_id, status
      ) VALUES ($1, $2, $3, $4, $5, 'pending')
      ON CONFLICT (pair_low_profile_id, pair_high_profile_id) DO UPDATE SET
        friendship_id = EXCLUDED.friendship_id,
        requester_profile_id = EXCLUDED.requester_profile_id,
        recipient_profile_id = EXCLUDED.recipient_profile_id,
        status = 'pending',
        updated_at = now(),
        accepted_at = NULL,
        removed_at = NULL;
    `, [friendshipId, input.requesterProfileId, peer.profile_id, pairLow, pairHigh]);
    await persistSocialTables();
    return {
      schema: HELIX_FRIENDSHIP_SCHEMA,
      friendship_id: friendshipId,
      peer,
      state: "outgoing",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof HelixFriendsDomainError) throw error;
    if (/block/i.test(error instanceof Error ? error.message : "")) {
      throw new HelixFriendsDomainError("friendship_blocked", 403, "Friend request blocked.");
    }
    throw error;
  }
};

export const setHelixFriendshipDecision = async (input: {
  actorProfileId: string;
  friendshipId: string;
  decision: "accept" | "decline" | "remove";
}): Promise<void> => {
  await ensureDatabase();
  const row = await getPool().query<{
    requester_profile_id: string;
    recipient_profile_id: string;
    status: string;
  }>(`
    SELECT requester_profile_id, recipient_profile_id, status
    FROM helix_friendships WHERE friendship_id = $1;
  `, [input.friendshipId]);
  const friendship = row.rows[0];
  if (!friendship) {
    throw new HelixFriendsDomainError("friendship_invalid", 404, "Friendship not found.");
  }
  const isMember =
    friendship.requester_profile_id === input.actorProfileId ||
    friendship.recipient_profile_id === input.actorProfileId;
  if (!isMember) {
    throw new HelixFriendsDomainError("friendship_invalid", 404, "Friendship not found.");
  }
  if (input.decision === "accept") {
    if (
      friendship.recipient_profile_id !== input.actorProfileId ||
      friendship.status !== "pending"
    ) {
      throw new HelixFriendsDomainError("friendship_conflict", 409, "Request cannot be accepted.");
    }
    await getPool().query(`
      UPDATE helix_friendships
      SET status = 'accepted', accepted_at = now(), removed_at = NULL, updated_at = now()
      WHERE friendship_id = $1;
    `, [input.friendshipId]);
  } else {
    await getPool().query(`
      UPDATE helix_friendships
      SET status = 'removed', removed_at = now(), updated_at = now()
      WHERE friendship_id = $1;
    `, [input.friendshipId]);
  }
  await persistSocialTables();
};

export const setHelixSocialBlock = async (input: {
  actorProfileId: string;
  peerProfileId: string;
  blocked: boolean;
}): Promise<void> => {
  await ensureDatabase();
  if (input.actorProfileId === input.peerProfileId) {
    throw new HelixFriendsDomainError("friendship_invalid", 400, "A profile cannot block itself.");
  }
  if (input.blocked) {
    const [pairLow, pairHigh] = orderedPair(input.actorProfileId, input.peerProfileId);
    await getPool().query(`
      INSERT INTO helix_social_blocks (blocker_profile_id, blocked_profile_id)
      VALUES ($1, $2)
      ON CONFLICT (blocker_profile_id, blocked_profile_id) DO NOTHING;
    `, [input.actorProfileId, input.peerProfileId]);
    await getPool().query(`
      UPDATE helix_friendships
      SET status = 'removed', removed_at = now(), updated_at = now()
      WHERE pair_low_profile_id = $1 AND pair_high_profile_id = $2;
    `, [pairLow, pairHigh]);
  } else {
    await getPool().query(`
      DELETE FROM helix_social_blocks
      WHERE blocker_profile_id = $1 AND blocked_profile_id = $2;
    `, [input.actorProfileId, input.peerProfileId]);
  }
  await persistSocialTables();
};

export const listHelixFriendships = async (profileId: string): Promise<HelixFriendship[]> => {
  await ensureDatabase();
  const relationships = await getPool().query<FriendshipRow>(`
    SELECT
      f.friendship_id, f.requester_profile_id, f.recipient_profile_id,
      f.status, f.created_at, f.updated_at AS friendship_updated_at,
      sp.profile_id, sp.handle, a.display_name, a.picture_url,
      sp.discovery_policy, sp.presence_visibility, sp.updated_at
    FROM helix_friendships f
    JOIN helix_social_profiles sp ON sp.profile_id = CASE
      WHEN f.requester_profile_id = $1 THEN f.recipient_profile_id
      ELSE f.requester_profile_id END
    JOIN helix_accounts a ON a.profile_id = sp.profile_id
    LEFT JOIN helix_social_blocks peer_block
      ON peer_block.blocker_profile_id = sp.profile_id
      AND peer_block.blocked_profile_id = $1
    WHERE (f.requester_profile_id = $1 OR f.recipient_profile_id = $1)
      AND f.status IN ('pending', 'accepted')
      AND peer_block.blocker_profile_id IS NULL
    ORDER BY f.updated_at DESC;
  `, [profileId]);
  const projected = relationships.rows.map((row): HelixFriendship => {
    const state: HelixFriendshipState = row.status === "accepted"
      ? "accepted"
      : row.requester_profile_id === profileId ? "outgoing" : "incoming";
    return {
      schema: HELIX_FRIENDSHIP_SCHEMA,
      friendship_id: row.friendship_id,
      peer: projectProfile(row),
      state,
      created_at: iso(row.created_at),
      updated_at: iso(row.friendship_updated_at),
    };
  });
  const blocks = await getPool().query<SocialProfileRow & { created_at: Date | string }>(`
    SELECT
      sp.profile_id, sp.handle, a.display_name, a.picture_url,
      sp.discovery_policy, sp.presence_visibility, sp.updated_at, b.created_at
    FROM helix_social_blocks b
    JOIN helix_social_profiles sp ON sp.profile_id = b.blocked_profile_id
    JOIN helix_accounts a ON a.profile_id = sp.profile_id
    WHERE b.blocker_profile_id = $1
    ORDER BY b.created_at DESC;
  `, [profileId]);
  return [...projected, ...blocks.rows.map((row): HelixFriendship => ({
    schema: HELIX_FRIENDSHIP_SCHEMA,
    friendship_id: `block:${profileId}:${row.profile_id}`,
    peer: projectProfile(row),
    state: "blocked_by_self",
    created_at: iso(row.created_at),
    updated_at: iso(row.created_at),
  }))];
};

export const heartbeatHelixSocialPresence = async (input: {
  profileId: string;
  state: Exclude<HelixSocialPresenceState, "offline">;
  ttlSeconds?: number;
}): Promise<HelixSocialPresence> => {
  await ensureDatabase();
  const ttlSeconds = Math.max(15, Math.min(120, input.ttlSeconds ?? 60));
  const observedAt = new Date();
  const expiresAt = new Date(observedAt.getTime() + ttlSeconds * 1_000);
  const result = await getPool().query<{
    profile_id: string;
    state: HelixSocialPresenceState;
    observed_at: Date | string;
    expires_at: Date | string;
  }>(`
    INSERT INTO helix_social_presence (profile_id, state, observed_at, expires_at)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (profile_id) DO UPDATE SET
      state = EXCLUDED.state,
      observed_at = EXCLUDED.observed_at,
      expires_at = EXCLUDED.expires_at
    RETURNING profile_id, state, observed_at, expires_at;
  `, [input.profileId, input.state, observedAt, expiresAt]);
  await persistSocialTables();
  const row = result.rows[0]!;
  return {
    schema: HELIX_SOCIAL_PRESENCE_SCHEMA,
    profile_id: row.profile_id,
    state: row.state,
    observed_at: iso(row.observed_at),
    expires_at: iso(row.expires_at),
  };
};

export const listHelixFriendPresence = async (profileId: string): Promise<HelixSocialPresence[]> => {
  await ensureDatabase();
  const result = await getPool().query<{
    profile_id: string;
    state: HelixSocialPresenceState;
    observed_at: Date | string;
    expires_at: Date | string;
    is_expired: boolean;
  }>(`
    SELECT
      p.profile_id, p.state, p.observed_at, p.expires_at,
      (p.expires_at <= now()) AS is_expired
    FROM helix_friendships f
    JOIN helix_social_profiles sp ON sp.profile_id = CASE
      WHEN f.requester_profile_id = $1 THEN f.recipient_profile_id
      ELSE f.requester_profile_id END
    JOIN helix_social_presence p ON p.profile_id = sp.profile_id
    LEFT JOIN helix_social_blocks viewer_block
      ON viewer_block.blocker_profile_id = $1
      AND viewer_block.blocked_profile_id = sp.profile_id
    LEFT JOIN helix_social_blocks peer_block
      ON peer_block.blocker_profile_id = sp.profile_id
      AND peer_block.blocked_profile_id = $1
    WHERE f.status = 'accepted'
      AND (f.requester_profile_id = $1 OR f.recipient_profile_id = $1)
      AND sp.presence_visibility = 'friends'
      AND viewer_block.blocker_profile_id IS NULL
      AND peer_block.blocker_profile_id IS NULL;
  `, [profileId]);
  return result.rows.map((row) => ({
    schema: HELIX_SOCIAL_PRESENCE_SCHEMA,
    profile_id: row.profile_id,
    state: row.is_expired ? "offline" : row.state,
    observed_at: iso(row.observed_at),
    expires_at: iso(row.expires_at),
  }));
};
