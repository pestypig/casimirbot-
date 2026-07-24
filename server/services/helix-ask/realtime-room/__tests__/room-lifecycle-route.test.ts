import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSharedRealtimeRoomTestApp,
  resetSharedRealtimeRoomRouteTestState,
  signInSharedRealtimeRoomTestAgent,
} from "./route-harness";
import { readSharedRealtimeRoom } from "../room-store";

describe("Shared Realtime room lifecycle routes", () => {
  beforeEach(async () => {
    await resetSharedRealtimeRoomRouteTestState();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
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
