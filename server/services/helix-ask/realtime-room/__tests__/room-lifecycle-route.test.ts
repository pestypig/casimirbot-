import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSharedRealtimeRoomTestApp,
  resetSharedRealtimeRoomRouteTestState,
  signInSharedRealtimeRoomTestAgent,
} from "./route-harness";
import { readSharedRealtimeRoom } from "../room-store";
import { buildHelixAccountCapabilityPolicy } from "@shared/helix-account-session";
import { HELIX_SHARED_LIVE_ROOM_READ_SCOPE, HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE } from "@shared/contracts/helix-shared-live-room-agent.v1";
import { SharedLiveRoomControlService, type SharedLiveRoomControlActor } from "../../../shared-live-room-control/service";

describe("Shared Realtime room lifecycle routes", () => {
  beforeEach(async () => {
    await resetSharedRealtimeRoomRouteTestState();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("joins an independent simulated OAuth account through real persistence without acquiring owner authority", async () => {
    const app = createSharedRealtimeRoomTestApp();
    const owner = await signInSharedRealtimeRoomTestAgent({ app, profileId: "profile:oauth-join-owner", displayName: "Owner" });
    const guest = await signInSharedRealtimeRoomTestAgent({ app, profileId: "profile:oauth-join-guest", displayName: "Guest" });
    const created = await owner.agent.post("/api/agi/realtime/rooms").send({ title: "OAuth join persistence" }).expect(201);
    const roomId = created.body.room.room_id as string;
    const invite = await owner.agent.post(`/api/agi/realtime/rooms/${roomId}/invites`).expect(201);
    const actor: SharedLiveRoomControlActor = {
      authKind: "external_oauth", profileId: guest.profileId, accountType: "developer",
      accountPolicy: buildHelixAccountCapabilityPolicy("developer"), sessionId: "external-oauth:guest", isGuest: false,
      oauthScopes: new Set([HELIX_SHARED_LIVE_ROOM_READ_SCOPE, HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE]),
      idempotencyOwner: { tenantId: "tenant-join-test", issuer: "https://issuer.example", subjectId: "guest-subject", accountProfileId: guest.profileId },
    };
    const service = new SharedLiveRoomControlService();
    const input = { actor, idempotencyKey: "persisted-join-001", request: { room_id: roomId, invite_code: invite.body.invite_code } };
    const [joined, replay] = await Promise.all([service.joinRoom(input), service.joinRoom(input)]);
    expect(joined.idempotencyReplayed).toBe(false);
    expect(replay.idempotencyReplayed).toBe(true);
    const persisted = await readSharedRealtimeRoom({ roomId, profileId: owner.profileId });
    expect(persisted.participants).toHaveLength(2);
    const participant = persisted.participants.find(p => p.participant_id === joined.body.room.self_participant_id)!;
    expect(participant).toMatchObject({ display_name: "Guest", role: "participant", presence: "present" });
    expect(participant.consent.microphone_to_model).toBe(false);
    expect(participant.consent.transcript_to_room).toBe(false);
    expect(persisted.runtime.state).toBe("idle");
    await guest.agent.post(`/api/agi/realtime/rooms/${roomId}/invites`).expect(403);
    expect(JSON.stringify(joined)).not.toContain(invite.body.invite_code);
  });

  it("requires a signed-in entitled session and derives room identity from the cookie", async () => {
    const app = createSharedRealtimeRoomTestApp();
    const anonymous = await request(app)
      .post("/api/agi/realtime/rooms")
      .send({ title: "Anonymous room" })
      .expect(401);
    expect(anonymous.body).toMatchObject({
      schema: "helix.shared_realtime_room.response.v1",
      ok: false,
      error: "shared_realtime_room_auth_required",
      answer_authority: false,
      terminal_eligible: false,
    });

    const user = await signInSharedRealtimeRoomTestAgent({
      app,
      profileId: "profile:room-user",
      displayName: "Room User",
      accountType: "user",
    });
    await user.agent
      .post("/api/agi/realtime/rooms")
      .send({ title: "User room" })
      .expect(403);

    const owner = await signInSharedRealtimeRoomTestAgent({
      app,
      profileId: "profile:room-owner",
      displayName: "Room Owner",
    });
    const created = await owner.agent
      .post("/api/agi/realtime/rooms")
      .send({
        title: "Pair session",
        owner_profile_id: "profile:spoofed-owner",
        participant_id: "participant:spoofed",
      })
      .expect(201);
    expect(created.body.room).toMatchObject({
      title: "Pair session",
      max_participants: 2,
      status: "waiting_for_participant",
      participants: [
        expect.objectContaining({ display_name: "Room Owner", role: "owner" }),
      ],
      answer_authority: false,
      terminal_eligible: false,
    });
    expect(JSON.stringify(created.body)).not.toContain("profile:spoofed-owner");
    expect(JSON.stringify(created.body)).not.toContain("participant:spoofed");
  });

  it("lets opted-in users host while join-only guests redeem invitations", async () => {
    vi.stubEnv("HELIX_PUBLIC_ROOMS_EXPERIMENT", "1");
    vi.stubEnv("HELIX_GUEST_ROOM_CREATION", "0");
    const app = createSharedRealtimeRoomTestApp();
    const owner = await signInSharedRealtimeRoomTestAgent({
      app,
      profileId: "profile:experimental-user-owner",
      displayName: "Experimental Owner",
      accountType: "user",
    });
    await owner.agent
      .post("/api/account/session/experimental-rooms")
      .send({ enabled: true })
      .expect(200);

    const created = await owner.agent
      .post("/api/agi/realtime/rooms")
      .send({ title: "Public experiment" })
      .expect(201);
    const invite = await owner.agent
      .post(`/api/agi/realtime/rooms/${created.body.room.room_id}/invites`)
      .expect(201);

    const guest = request.agent(app);
    const guestSession = await guest
      .post("/api/account/session/experimental-rooms")
      .send({ enabled: true })
      .expect(200);
    expect(guestSession.body.status.session.profile.display_name).toMatch(
      /^[A-Z][a-z]+[A-Z][a-z]+\d{2}$/,
    );
    await guest
      .post("/api/agi/realtime/rooms")
      .send({ title: "Guest hosting blocked" })
      .expect(403);

    const joined = await guest
      .post("/api/agi/realtime/rooms/join")
      .send({ invite_code: invite.body.invite_code })
      .expect(200);
    expect(joined.body.room.participants).toEqual(expect.arrayContaining([
      expect.objectContaining({
        display_name: guestSession.body.status.session.profile.display_name,
        role: "participant",
      }),
    ]));
  });

  it("allows a temporary guest to host only when guest room creation is enabled", async () => {
    vi.stubEnv("HELIX_PUBLIC_ROOMS_EXPERIMENT", "1");
    vi.stubEnv("HELIX_GUEST_ROOM_CREATION", "1");
    const app = createSharedRealtimeRoomTestApp();
    const guest = request.agent(app);
    const session = await guest
      .post("/api/account/session/experimental-rooms")
      .send({ enabled: true })
      .expect(200);

    const created = await guest
      .post("/api/agi/realtime/rooms")
      .send({ title: "Guest-hosted test" })
      .expect(201);
    expect(created.body.room.participants).toEqual([
      expect.objectContaining({
        display_name: session.body.status.session.profile.display_name,
        role: "owner",
      }),
    ]);
    await guest
      .post("/api/agi/realtime/rooms")
      .send({ title: "Second guest room" })
      .expect(409);

    await guest
      .post("/api/account/session/experimental-rooms")
      .send({ enabled: false })
      .expect(200);
    const closed = await readSharedRealtimeRoom({
      roomId: created.body.room.room_id,
      profileId: session.body.status.session.profile.profile_id,
    });
    expect(closed.status).toBe("closed");
  });

  it("isolates nonmembers and redeems one-time invitations for only one second account", async () => {
    const app = createSharedRealtimeRoomTestApp();
    const owner = await signInSharedRealtimeRoomTestAgent({
      app,
      profileId: "profile:room-owner-invite",
      displayName: "Owner Invite",
    });
    const guest = await signInSharedRealtimeRoomTestAgent({
      app,
      profileId: "profile:room-guest-invite",
      displayName: "Guest Invite",
    });
    const outsider = await signInSharedRealtimeRoomTestAgent({
      app,
      profileId: "profile:room-outsider",
      displayName: "Outsider",
    });

    const created = await owner.agent
      .post("/api/agi/realtime/rooms")
      .send({ title: "Invite contract" })
      .expect(201);
    const roomId = created.body.room.room_id as string;
    await outsider.agent.get(`/api/agi/realtime/rooms/${roomId}`).expect(404);
    await outsider.agent.get(`/api/agi/realtime/rooms/${roomId}/debug`).expect(404);

    const firstInvite = await owner.agent
      .post(`/api/agi/realtime/rooms/${roomId}/invites`)
      .expect(201);
    const secondInvite = await owner.agent
      .post(`/api/agi/realtime/rooms/${roomId}/invites`)
      .expect(201);
    expect(firstInvite.body.invite_code).not.toBe(secondInvite.body.invite_code);

    const joined = await guest.agent
      .post("/api/agi/realtime/rooms/join")
      .send({
        invite_code: firstInvite.body.invite_code,
        profile_id: "profile:spoofed-guest",
      })
      .expect(200);
    expect(joined.body.room.participants).toEqual(expect.arrayContaining([
      expect.objectContaining({ display_name: "Owner Invite", role: "owner" }),
      expect.objectContaining({ display_name: "Guest Invite", role: "participant" }),
    ]));
    expect(JSON.stringify(joined.body)).not.toContain("profile:spoofed-guest");

    await outsider.agent
      .post("/api/agi/realtime/rooms/join")
      .send({ invite_code: firstInvite.body.invite_code })
      .expect(409);
    await outsider.agent
      .post("/api/agi/realtime/rooms/join")
      .send({ invite_code: secondInvite.body.invite_code })
      .expect(409);
    await guest.agent
      .post(`/api/agi/realtime/rooms/${roomId}/invites`)
      .expect(403);
  });
});
