import crypto from "node:crypto";
import type { PoolClient } from "pg";
import type {
  HelixSocialProfile,
  HelixVoiceParty,
  HelixVoicePartyGptAttachmentState,
  HelixVoicePartyMediaState,
  HelixVoicePartyMember,
  HelixVoicePartyMemberState,
  HelixVoicePartyState,
} from "@shared/helix-friends-voice-party";
import {
  HELIX_SOCIAL_PROFILE_SCHEMA,
  HELIX_VOICE_PARTY_MEMBER_SCHEMA,
  HELIX_VOICE_PARTY_SCHEMA,
} from "@shared/helix-friends-voice-party";
import {
  ensureDatabase,
  getPool,
  persistLocalDatabaseSnapshotIfEnabled,
} from "../../db/client";
import { readSharedRealtimeRoomRuntime } from
  "../helix-ask/realtime-room/runtime-registry";

const PARTY_TABLES = [
  "helix_voice_parties",
  "helix_voice_party_members",
  "helix_voice_party_invites",
] as const;

export const HELIX_VOICE_PARTY_RECONNECT_AFTER_MS = 45_000;
export const HELIX_VOICE_PARTY_EXPIRE_AFTER_MS = 120_000;

type PartyRow = {
  party_id: string;
  owner_profile_id: string;
  state: HelixVoicePartyState;
  max_members: number | string;
  room_id: string | null;
  gpt_attachment_state: HelixVoicePartyGptAttachmentState;
  created_at: Date | string;
  updated_at: Date | string;
  ended_at: Date | string | null;
};

type PartyMemberRow = {
  participant_id: string;
  profile_id: string;
  handle: string;
  display_name: string;
  picture_url: string | null;
  discovery_policy: HelixSocialProfile["discovery_policy"];
  presence_visibility: HelixSocialProfile["presence_visibility"];
  profile_updated_at: Date | string;
  member_role: "owner" | "participant";
  member_state: HelixVoicePartyMemberState;
  media_state: HelixVoicePartyMediaState;
  muted: boolean;
  deafened: boolean;
  joined_at: Date | string | null;
  last_seen_at: Date | string;
};

const iso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const hashToken = (value: string): string =>
  crypto.createHash("sha256").update(value, "utf8").digest("hex");

const projectGptAttachmentState = (
  party: PartyRow,
): HelixVoicePartyGptAttachmentState => {
  if (party.gpt_attachment_state === "detached" || !party.room_id) {
    return "detached";
  }
  const runtime = readSharedRealtimeRoomRuntime({ roomId: party.room_id });
  if (runtime?.state === "host_transport_active" || runtime?.state === "bridge_active") {
    return "connected";
  }
  if (
    runtime?.state === "degraded" ||
    runtime?.state === "error" ||
    runtime?.state === "closed"
  ) {
    return "degraded";
  }
  return "attaching";
};

export class HelixVoicePartyDomainError extends Error {
  constructor(
    readonly code:
      | "voice_party_not_found"
      | "voice_party_forbidden"
      | "voice_party_conflict"
      | "voice_party_full"
      | "voice_party_ended"
      | "voice_party_invite_invalid"
      | "voice_party_invite_expired"
      | "voice_party_signal_cursor_expired"
      | "voice_party_relay_unavailable"
      | "voice_party_ice_configuration_invalid",
    readonly statusCode: 400 | 403 | 404 | 409,
    message: string,
  ) {
    super(message);
    this.name = "HelixVoicePartyDomainError";
  }
}

const withPartyTransaction = async <T>(run: (client: PoolClient) => Promise<T>): Promise<T> => {
  await ensureDatabase();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await run(client);
    await client.query("COMMIT");
    await persistLocalDatabaseSnapshotIfEnabled([...PARTY_TABLES]);
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
};

export const reconcileHelixVoicePartyLiveness = async (input: {
  partyId: string;
  nowMs?: number;
}): Promise<"current" | "reconnecting" | "ended"> =>
  withPartyTransaction(async (client) => {
    const party = await readPartyRow(input.partyId, client);
    if (party.state === "ended") return "ended";
    const now = new Date(input.nowMs ?? Date.now());
    const members = await client.query<{
      profile_id: string;
      last_seen_at: Date | string;
    }>(`
      SELECT profile_id, last_seen_at
      FROM helix_voice_party_members
      WHERE party_id = $1 AND member_state <> 'left';
    `, [input.partyId]);
    const ages = members.rows.map((row) => ({
      profileId: row.profile_id,
      ageMs: now.getTime() - new Date(row.last_seen_at).getTime(),
    }));
    if (ages.some((entry) => entry.ageMs >= HELIX_VOICE_PARTY_EXPIRE_AFTER_MS)) {
      await client.query(`
        UPDATE helix_voice_parties
        SET state = 'ended', gpt_attachment_state = 'detached',
            ended_at = $2, updated_at = $2
        WHERE party_id = $1 AND state <> 'ended';
      `, [input.partyId, now]);
      await client.query(`
        UPDATE helix_voice_party_members
        SET member_state = 'left', media_state = 'stopped',
            left_at = COALESCE(left_at, $2), updated_at = $2
        WHERE party_id = $1 AND member_state <> 'left';
      `, [input.partyId, now]);
      return "ended";
    }
    const staleProfiles = ages
      .filter((entry) => entry.ageMs >= HELIX_VOICE_PARTY_RECONNECT_AFTER_MS)
      .map((entry) => entry.profileId);
    if (staleProfiles.length > 0) {
      await client.query(`
        UPDATE helix_voice_party_members
        SET member_state = 'reconnecting', media_state = 'degraded', updated_at = $3
        WHERE party_id = $1 AND profile_id = ANY($2::text[])
          AND member_state <> 'left';
      `, [input.partyId, staleProfiles, now]);
      await client.query(`
        UPDATE helix_voice_parties
        SET state = 'reconnecting', updated_at = $2
        WHERE party_id = $1 AND state <> 'ended';
      `, [input.partyId, now]);
      return "reconnecting";
    }
    return "current";
  });

const readPartyRow = async (
  partyId: string,
  queryable: Pick<PoolClient, "query"> = getPool(),
): Promise<PartyRow> => {
  const result = await queryable.query<PartyRow>(`
    SELECT * FROM helix_voice_parties WHERE party_id = $1;
  `, [partyId]);
  if (!result.rows[0]) {
    throw new HelixVoicePartyDomainError("voice_party_not_found", 404, "Voice party not found.");
  }
  return result.rows[0];
};

const requirePartyMembership = async (
  partyId: string,
  profileId: string,
  queryable: Pick<PoolClient, "query"> = getPool(),
): Promise<{ role: "owner" | "participant"; state: HelixVoicePartyMemberState }> => {
  const result = await queryable.query<{
    member_role: "owner" | "participant";
    member_state: HelixVoicePartyMemberState;
  }>(`
    SELECT member_role, member_state
    FROM helix_voice_party_members
    WHERE party_id = $1 AND profile_id = $2 AND member_state <> 'left';
  `, [partyId, profileId]);
  if (!result.rows[0]) {
    throw new HelixVoicePartyDomainError("voice_party_not_found", 404, "Voice party not found.");
  }
  return { role: result.rows[0].member_role, state: result.rows[0].member_state };
};

export const readHelixVoiceParty = async (input: {
  partyId: string;
  viewerProfileId: string;
}): Promise<HelixVoiceParty> => {
  await ensureDatabase();
  await reconcileHelixVoicePartyLiveness({ partyId: input.partyId });
  await requirePartyMembership(input.partyId, input.viewerProfileId);
  const party = await readPartyRow(input.partyId);
  const members = await getPool().query<PartyMemberRow>(`
    SELECT
      m.participant_id, m.profile_id, sp.handle, a.display_name, a.picture_url,
      sp.discovery_policy, sp.presence_visibility,
      sp.updated_at AS profile_updated_at, m.member_role, m.member_state,
      m.media_state, m.muted, m.deafened, m.joined_at, m.last_seen_at
    FROM helix_voice_party_members m
    JOIN helix_social_profiles sp ON sp.profile_id = m.profile_id
    JOIN helix_accounts a ON a.profile_id = m.profile_id
    WHERE m.party_id = $1
    ORDER BY m.slot_number ASC;
  `, [input.partyId]);
  return {
    schema: HELIX_VOICE_PARTY_SCHEMA,
    party_id: party.party_id,
    owner_profile_id: party.owner_profile_id,
    state: party.state,
    max_members: 2,
    room_id: party.room_id,
    // The database records intent only. Connected/degraded are projections of
    // the authoritative Shared Live Room runtime and cannot be client-claimed.
    gpt_attachment_state: projectGptAttachmentState(party),
    members: members.rows.map((row): HelixVoicePartyMember => ({
      schema: HELIX_VOICE_PARTY_MEMBER_SCHEMA,
      participant_id: row.participant_id,
      profile: {
        schema: HELIX_SOCIAL_PROFILE_SCHEMA,
        profile_id: row.profile_id,
        handle: row.handle,
        display_name: row.display_name,
        picture_url: row.picture_url,
        discovery_policy: row.discovery_policy,
        presence_visibility: row.presence_visibility,
        updated_at: iso(row.profile_updated_at),
      },
      role: row.member_role,
      state: row.member_state,
      media_state: row.media_state,
      muted: row.muted,
      deafened: row.deafened,
      joined_at: row.joined_at ? iso(row.joined_at) : null,
      last_seen_at: iso(row.last_seen_at),
    })),
    created_at: iso(party.created_at),
    updated_at: iso(party.updated_at),
    ended_at: party.ended_at ? iso(party.ended_at) : null,
  };
};

export const listHelixVoiceParties = async (
  profileId: string,
): Promise<HelixVoiceParty[]> => {
  await ensureDatabase();
  const candidate = await getPool().query<{ party_id: string }>(`
    SELECT p.party_id
    FROM helix_voice_parties p
    JOIN helix_voice_party_members m ON m.party_id = p.party_id
    WHERE m.profile_id = $1 AND m.member_state <> 'left' AND p.state <> 'ended'
    ORDER BY p.updated_at DESC;
  `, [profileId]);
  for (const row of candidate.rows) {
    await reconcileHelixVoicePartyLiveness({ partyId: row.party_id });
  }
  const result = await getPool().query<{ party_id: string }>(`
    SELECT p.party_id
    FROM helix_voice_parties p
    JOIN helix_voice_party_members m ON m.party_id = p.party_id
    WHERE m.profile_id = $1 AND m.member_state <> 'left' AND p.state <> 'ended'
    ORDER BY p.updated_at DESC;
  `, [profileId]);
  return Promise.all(result.rows.map((row) => readHelixVoiceParty({
    partyId: row.party_id,
    viewerProfileId: profileId,
  })));
};

export const heartbeatHelixVoicePartyMember = async (input: {
  partyId: string;
  profileId: string;
}): Promise<HelixVoiceParty> => {
  await withPartyTransaction(async (client) => {
    await requirePartyMembership(input.partyId, input.profileId, client);
    await client.query(`
      UPDATE helix_voice_party_members
      SET last_seen_at = now(), updated_at = now()
      WHERE party_id = $1 AND profile_id = $2 AND member_state <> 'left';
    `, [input.partyId, input.profileId]);
  });
  return readHelixVoiceParty({
    partyId: input.partyId,
    viewerProfileId: input.profileId,
  });
};

export const createHelixVoiceParty = async (ownerProfileId: string): Promise<HelixVoiceParty> => {
  const partyId = `voice_party:${crypto.randomUUID()}`;
  await withPartyTransaction(async (client) => {
    const existing = await client.query(`
      SELECT 1
      FROM helix_voice_party_members m
      JOIN helix_voice_parties p ON p.party_id = m.party_id
      WHERE m.profile_id = $1 AND m.member_state <> 'left' AND p.state <> 'ended'
      LIMIT 1;
    `, [ownerProfileId]);
    if (existing.rows[0]) {
      throw new HelixVoicePartyDomainError(
        "voice_party_conflict",
        409,
        "Leave the current voice party before creating another.",
      );
    }
    const social = await client.query(
      `SELECT 1 FROM helix_social_profiles WHERE profile_id = $1;`,
      [ownerProfileId],
    );
    if (!social.rows[0]) {
      throw new HelixVoicePartyDomainError(
        "voice_party_conflict",
        409,
        "Create a social profile before starting a voice party.",
      );
    }
    await client.query(`
      INSERT INTO helix_voice_parties (party_id, owner_profile_id)
      VALUES ($1, $2);
    `, [partyId, ownerProfileId]);
    await client.query(`
      INSERT INTO helix_voice_party_members (
        party_id, slot_number, profile_id, participant_id,
        member_role, member_state, media_state, joined_at
      ) VALUES ($1, 1, $2, $3, 'owner', 'joining', 'idle', now());
    `, [partyId, ownerProfileId, `voice_party_participant:${crypto.randomUUID()}`]);
  });
  return readHelixVoiceParty({ partyId, viewerProfileId: ownerProfileId });
};

export type HelixVoicePartyInviteSecret = {
  party: HelixVoiceParty;
  invite_code: string;
  expires_at: string;
};

export const createHelixVoicePartyInvite = async (input: {
  partyId: string;
  ownerProfileId: string;
  recipientProfileId?: string | null;
  ttlSeconds?: number;
}): Promise<HelixVoicePartyInviteSecret> => {
  const inviteCode = `helix_party_${crypto.randomBytes(24).toString("base64url")}`;
  const expiresAt = new Date(Date.now() + Math.max(60, Math.min(3600, input.ttlSeconds ?? 600)) * 1_000);
  await withPartyTransaction(async (client) => {
    const party = await readPartyRow(input.partyId, client);
    if (party.state === "ended") {
      throw new HelixVoicePartyDomainError("voice_party_ended", 409, "Voice party has ended.");
    }
    if (party.owner_profile_id !== input.ownerProfileId) {
      throw new HelixVoicePartyDomainError("voice_party_forbidden", 403, "Only the party owner can invite.");
    }
    const count = await client.query<{ count: number | string }>(`
      SELECT COUNT(*) AS count FROM helix_voice_party_members
      WHERE party_id = $1 AND member_state <> 'left';
    `, [input.partyId]);
    if (Number(count.rows[0]?.count ?? 0) >= 2) {
      throw new HelixVoicePartyDomainError("voice_party_full", 409, "Voice party is full.");
    }
    if (input.recipientProfileId) {
      const eligible = await client.query(`
        SELECT 1 FROM helix_friendships f
        WHERE f.status = 'accepted'
          AND ((f.requester_profile_id = $1 AND f.recipient_profile_id = $2)
            OR (f.requester_profile_id = $2 AND f.recipient_profile_id = $1))
          AND NOT EXISTS (
            SELECT 1 FROM helix_social_blocks b
            WHERE (b.blocker_profile_id = $1 AND b.blocked_profile_id = $2)
               OR (b.blocker_profile_id = $2 AND b.blocked_profile_id = $1)
          );
      `, [input.ownerProfileId, input.recipientProfileId]);
      if (!eligible.rows[0]) {
        throw new HelixVoicePartyDomainError(
          "voice_party_forbidden",
          403,
          "The invited profile is not an eligible friend.",
        );
      }
    }
    await client.query(`
      INSERT INTO helix_voice_party_invites (
        invite_id, party_id, created_by_profile_id, recipient_profile_id,
        token_hash, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6);
    `, [
      `voice_party_invite:${crypto.randomUUID()}`,
      input.partyId,
      input.ownerProfileId,
      input.recipientProfileId ?? null,
      hashToken(inviteCode),
      expiresAt,
    ]);
    await client.query(`
      UPDATE helix_voice_parties SET state = 'inviting', updated_at = now()
      WHERE party_id = $1;
    `, [input.partyId]);
  });
  return {
    party: await readHelixVoiceParty({ partyId: input.partyId, viewerProfileId: input.ownerProfileId }),
    invite_code: inviteCode,
    expires_at: expiresAt.toISOString(),
  };
};

export const joinHelixVoiceParty = async (input: {
  profileId: string;
  inviteCode: string;
}): Promise<HelixVoiceParty> => {
  let partyId = "";
  await withPartyTransaction(async (client) => {
    const invite = await client.query<{
      invite_id: string;
      party_id: string;
      recipient_profile_id: string | null;
      status: string;
      expires_at: Date | string;
    }>(`
      SELECT invite_id, party_id, recipient_profile_id, status, expires_at
      FROM helix_voice_party_invites WHERE token_hash = $1;
    `, [hashToken(input.inviteCode.trim())]);
    const row = invite.rows[0];
    if (!row || row.status !== "active") {
      throw new HelixVoicePartyDomainError("voice_party_invite_invalid", 400, "Voice party invite is invalid.");
    }
    if (new Date(row.expires_at).getTime() <= Date.now()) {
      await client.query(`UPDATE helix_voice_party_invites SET status = 'expired' WHERE invite_id = $1;`, [row.invite_id]);
      throw new HelixVoicePartyDomainError("voice_party_invite_expired", 409, "Voice party invite expired.");
    }
    if (row.recipient_profile_id && row.recipient_profile_id !== input.profileId) {
      throw new HelixVoicePartyDomainError("voice_party_forbidden", 403, "Voice party invite belongs to another profile.");
    }
    const party = await readPartyRow(row.party_id, client);
    if (party.state === "ended") {
      throw new HelixVoicePartyDomainError("voice_party_ended", 409, "Voice party has ended.");
    }
    const existing = await client.query(`
      SELECT 1 FROM helix_voice_party_members
      WHERE party_id = $1 AND member_state <> 'left';
    `, [row.party_id]);
    if (existing.rowCount !== null && existing.rowCount >= 2) {
      throw new HelixVoicePartyDomainError("voice_party_full", 409, "Voice party is full.");
    }
    await client.query(`
      INSERT INTO helix_voice_party_members (
        party_id, slot_number, profile_id, participant_id,
        member_role, member_state, media_state, joined_at
      ) VALUES ($1, 2, $2, $3, 'participant', 'joining', 'idle', now());
    `, [row.party_id, input.profileId, `voice_party_participant:${crypto.randomUUID()}`]);
    await client.query(`
      UPDATE helix_voice_party_invites
      SET status = 'redeemed', redeemed_by_profile_id = $1, redeemed_at = now()
      WHERE invite_id = $2;
    `, [input.profileId, row.invite_id]);
    await client.query(`
      UPDATE helix_voice_parties SET state = 'connecting', updated_at = now()
      WHERE party_id = $1;
    `, [row.party_id]);
    partyId = row.party_id;
  });
  return readHelixVoiceParty({ partyId, viewerProfileId: input.profileId });
};

export const updateOwnHelixVoicePartyMedia = async (input: {
  partyId: string;
  profileId: string;
  mediaState: HelixVoicePartyMediaState;
  muted?: boolean;
  deafened?: boolean;
}): Promise<HelixVoiceParty> => {
  await withPartyTransaction(async (client) => {
    await requirePartyMembership(input.partyId, input.profileId, client);
    const memberState: HelixVoicePartyMemberState =
      input.mediaState === "connected" || input.mediaState === "direct" || input.mediaState === "relayed"
        ? "connected"
        : input.mediaState === "connecting" ? "joining"
          : input.mediaState === "stopped" ? "left" : "reconnecting";
    await client.query(`
      UPDATE helix_voice_party_members SET
        member_state = $3,
        media_state = $4,
        muted = COALESCE($5, muted),
        deafened = COALESCE($6, deafened),
        last_seen_at = now(),
        updated_at = now(),
        left_at = CASE WHEN $3 = 'left' THEN now() ELSE NULL END
      WHERE party_id = $1 AND profile_id = $2;
    `, [
      input.partyId,
      input.profileId,
      memberState,
      input.mediaState,
      input.muted ?? null,
      input.deafened ?? null,
    ]);
    const states = await client.query<{ media_state: HelixVoicePartyMediaState }>(`
      SELECT media_state FROM helix_voice_party_members
      WHERE party_id = $1 AND member_state <> 'left';
    `, [input.partyId]);
    const media = states.rows.map((row) => row.media_state);
    const partyState: HelixVoicePartyState = media.length === 2 &&
      media.every((state) => state === "connected" || state === "direct" || state === "relayed")
      ? "active"
      : media.some((state) => state === "failed" || state === "degraded")
        ? "degraded"
        : media.some((state) => state === "connecting" || state === "idle")
          ? "connecting"
          : "reconnecting";
    await client.query(`
      UPDATE helix_voice_parties SET state = $2, updated_at = now()
      WHERE party_id = $1 AND state <> 'ended';
    `, [input.partyId, partyState]);
  });
  return readHelixVoiceParty({ partyId: input.partyId, viewerProfileId: input.profileId });
};

export const leaveHelixVoiceParty = async (input: {
  partyId: string;
  profileId: string;
}): Promise<"left" | "ended"> => withPartyTransaction(async (client) => {
  const membership = await requirePartyMembership(input.partyId, input.profileId, client);
  if (membership.role === "owner") {
    await client.query(`
      UPDATE helix_voice_parties
      SET state = 'ended', gpt_attachment_state = 'detached', ended_at = now(), updated_at = now()
      WHERE party_id = $1;
    `, [input.partyId]);
    await client.query(`
      UPDATE helix_voice_party_members
      SET member_state = 'left', media_state = 'stopped', left_at = now(), updated_at = now()
      WHERE party_id = $1 AND member_state <> 'left';
    `, [input.partyId]);
    return "ended";
  }
  await client.query(`
    UPDATE helix_voice_party_members
    SET member_state = 'left', media_state = 'stopped', left_at = now(), updated_at = now()
    WHERE party_id = $1 AND profile_id = $2;
  `, [input.partyId, input.profileId]);
  await client.query(`
    UPDATE helix_voice_parties
    SET state = 'ended', gpt_attachment_state = 'detached', ended_at = now(), updated_at = now()
    WHERE party_id = $1;
  `, [input.partyId]);
  return "left";
});

export const setHelixVoicePartyGptAttachment = async (input: {
  partyId: string;
  ownerProfileId: string;
  roomId: string | null;
  state: Extract<HelixVoicePartyGptAttachmentState, "detached" | "attaching">;
}): Promise<HelixVoiceParty> => {
  await withPartyTransaction(async (client) => {
    const party = await readPartyRow(input.partyId, client);
    if (party.owner_profile_id !== input.ownerProfileId) {
      throw new HelixVoicePartyDomainError("voice_party_forbidden", 403, "Only the party owner can attach GPT Live.");
    }
    if (party.state === "ended") {
      throw new HelixVoicePartyDomainError("voice_party_ended", 409, "Voice party has ended.");
    }
    if (input.state !== "detached" && !input.roomId) {
      throw new HelixVoicePartyDomainError("voice_party_conflict", 409, "A Shared Live Room is required for GPT attachment.");
    }
    if (input.state !== "detached") {
      const matchingRoom = await client.query(`
        SELECT 1
        FROM helix_shared_realtime_rooms r
        WHERE r.room_id = $1
          AND r.owner_profile_id = $2
          AND r.status <> 'closed';
      `, [input.roomId, input.ownerProfileId]);
      if (!matchingRoom.rows[0]) {
        throw new HelixVoicePartyDomainError(
          "voice_party_conflict",
          409,
          "GPT attachment requires an active Shared Live Room with the same owner and members.",
        );
      }
      const partyProfiles = await client.query<{ profile_id: string }>(`
        SELECT profile_id FROM helix_voice_party_members
        WHERE party_id = $1 AND member_state <> 'left'
        ORDER BY profile_id;
      `, [input.partyId]);
      const roomProfiles = await client.query<{ profile_id: string }>(`
        SELECT profile_id FROM helix_shared_realtime_room_members
        WHERE room_id = $1 AND presence <> 'left'
        ORDER BY profile_id;
      `, [input.roomId]);
      const exactTwoProfileMatch =
        partyProfiles.rows.length === 2 &&
        roomProfiles.rows.length === 2 &&
        partyProfiles.rows.every(
          (row, index) => row.profile_id === roomProfiles.rows[index]?.profile_id,
        );
      if (!exactTwoProfileMatch) {
        throw new HelixVoicePartyDomainError(
          "voice_party_conflict",
          409,
          "GPT attachment requires an active Shared Live Room with the same owner and members.",
        );
      }
    }
    await client.query(`
      UPDATE helix_voice_parties
      SET room_id = $2, gpt_attachment_state = $3, updated_at = now()
      WHERE party_id = $1;
    `, [input.partyId, input.state === "detached" ? null : input.roomId, input.state]);
  });
  return readHelixVoiceParty({ partyId: input.partyId, viewerProfileId: input.ownerProfileId });
};
