import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createSharedRealtimeRoomTestApp,
  resetSharedRealtimeRoomRouteTestState,
  signInSharedRealtimeRoomTestAgent,
} from "./route-harness";

describe("Shared Realtime room lifecycle routes", () => {
  beforeEach(async () => {
    await resetSharedRealtimeRoomRouteTestState();
  });

  it("requires a signed-in developer and derives room identity from the cookie", async () => {
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
