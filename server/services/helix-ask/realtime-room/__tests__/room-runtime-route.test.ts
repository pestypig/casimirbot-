import { beforeEach, describe, expect, it } from "vitest";
import {
  admitRealtimeSession,
  buildRealtimeRequesterRef,
  readAdmittedRealtimeSession,
  removeAdmittedRealtimeSession,
  updateAdmittedRealtimeSession,
} from "../../realtime-session/session-registry";
import { publishRealtimeSidebandSessionClosed } from
  "../../realtime-session/sideband-control-channel";
import { readSharedRealtimeRoomRuntimeBinding } from "../runtime-registry";
import {
  createSharedRealtimeRoomTestApp,
  createReadySharedRealtimeRoom,
  resetSharedRealtimeRoomRouteTestState,
  signInSharedRealtimeRoomTestAgent,
  type SharedRealtimeRoomTestAgent,
} from "./route-harness";

describe("Shared Realtime room runtime routes", () => {
  beforeEach(async () => {
    await resetSharedRealtimeRoomRouteTestState();
  });

  it("requires both members present and reserves the single model slot for the owner", async () => {
    const app = createSharedRealtimeRoomTestApp();
    const owner = await signInSharedRealtimeRoomTestAgent({
      app,
      profileId: "profile:runtime-owner",
      displayName: "Runtime Owner",
    });
    const guest = await signInSharedRealtimeRoomTestAgent({
      app,
      profileId: "profile:runtime-guest",
      displayName: "Runtime Guest",
    });
    const roomId = await createReadySharedRealtimeRoom({ owner, guest, title: "Runtime readiness" });

    await guest.agent
      .post(`/api/agi/realtime/rooms/${roomId}/presence`)
      .send({ presence: "away" })
      .expect(200);
    const notReady = await owner.agent
      .post(`/api/agi/realtime/rooms/${roomId}/runtime/reserve`)
      .send({ model: "gpt-realtime-2.1" })
      .expect(409);
    expect(notReady.body.error).toBe("shared_realtime_room_not_ready");

    await guest.agent
      .post(`/api/agi/realtime/rooms/${roomId}/presence`)
      .send({ presence: "present" })
      .expect(200);
    await guest.agent
      .post(`/api/agi/realtime/rooms/${roomId}/runtime/reserve`)
      .send({ model: "gpt-realtime-2.1" })
      .expect(403);
    const reserved = await owner.agent
      .post(`/api/agi/realtime/rooms/${roomId}/runtime/reserve`)
      .send({ model: "gpt-realtime-2.1" })
      .expect(200);
    expect(reserved.body.room.runtime).toMatchObject({
      state: "reserved",
      topology: "single_shared_model",
      transport_owner: "host_browser",
      model: "gpt-realtime-2.1",
    });
    await guest.agent
      .post(`/api/agi/realtime/rooms/${roomId}/runtime/bind`)
      .send({ realtime_session_id: "realtime:spoofed-owner-session" })
      .expect(403);

    const blocked = await guest.agent
      .post("/api/agi/realtime/session")
      .send({ runtime_agent_mode: "live_voice" })
      .expect(409);
    expect(blocked.body.error).toBe("shared_realtime_room_personal_session_blocked");
  });

  it("atomically binds one owner session and rejects cross-room reuse", async () => {
    const app = createSharedRealtimeRoomTestApp();
    const owner = await signInSharedRealtimeRoomTestAgent({
      app,
      profileId: "profile:binding-owner",
      displayName: "Binding Owner",
    });
    const guestA = await signInSharedRealtimeRoomTestAgent({
      app,
      profileId: "profile:binding-guest-a",
      displayName: "Binding Guest A",
    });
    const guestB = await signInSharedRealtimeRoomTestAgent({
      app,
      profileId: "profile:binding-guest-b",
      displayName: "Binding Guest B",
    });
    const roomA = await createReadySharedRealtimeRoom({ owner, guest: guestA, title: "Room A" });
    const roomB = await createReadySharedRealtimeRoom({ owner, guest: guestB, title: "Room B" });
    const reserveA = await owner.agent
      .post(`/api/agi/realtime/rooms/${roomA}/runtime/reserve`)
      .send({ model: "gpt-realtime-2.1" })
      .expect(200);
    const reserveB = await owner.agent
      .post(`/api/agi/realtime/rooms/${roomB}/runtime/reserve`)
      .send({ model: "gpt-realtime-2.1" })
      .expect(200);
    const runtimeB = reserveB.body.room.runtime.runtime_id as string;

    const requesterRef = buildRealtimeRequesterRef(owner.sessionId);
    admitRealtimeSession({
      realtimeSessionId: "realtime:shared-owner",
      requesterRef,
      visibleUserConsentReceipt: "receipt:visible:owner",
      model: "gpt-realtime-2.1",
    });
    updateAdmittedRealtimeSession({
      realtimeSessionId: "realtime:shared-owner",
      requesterRef,
      patch: {
        providerCallId: "call_shared_owner",
        providerCallRef: "provider:call:shared-owner",
      },
    });

    const boundA = await owner.agent
      .post(`/api/agi/realtime/rooms/${roomA}/runtime/bind`)
      .send({ realtime_session_id: "realtime:shared-owner" })
      .expect(200);
    expect(boundA.body.room.runtime).toMatchObject({
      state: "host_transport_active",
      provider_session_ref_hash: expect.stringContaining("provider_call:sha256:"),
      realtime_session_ref_hash: expect.stringContaining("realtime_session:sha256:"),
    });
    expect(JSON.stringify(boundA.body)).not.toContain("call_shared_owner");
    expect(JSON.stringify(boundA.body)).not.toContain("realtime:shared-owner");

    const guestFloor = await guestA.agent
      .post(`/api/agi/realtime/rooms/${roomA}/runtime/floor`)
      .expect(409);
    expect(guestFloor.body).toMatchObject({
      error: "shared_realtime_room_not_ready",
      answer_authority: false,
      terminal_eligible: false,
    });
    await owner.agent
      .post(`/api/agi/realtime/rooms/${roomA}/runtime/floor`)
      .expect(200);

    const conflict = await owner.agent
      .post(`/api/agi/realtime/rooms/${roomB}/runtime/bind`)
      .send({ realtime_session_id: "realtime:shared-owner" })
      .expect(409);
    expect(conflict.body.error).toBe("shared_realtime_room_runtime_conflict");
    expect(readSharedRealtimeRoomRuntimeBinding({
      roomId: roomB,
      runtimeId: runtimeB,
    })).toEqual({ realtimeSessionId: null, providerCallId: null });

    publishRealtimeSidebandSessionClosed({
      realtimeSessionId: "realtime:shared-owner",
      reason: "test_sideband_closed",
    });
    const sidebandDegraded = await owner.agent
      .get(`/api/agi/realtime/rooms/${roomA}`)
      .expect(200);
    expect(sidebandDegraded.body.room.runtime).toMatchObject({
      state: "degraded",
      limitations: expect.arrayContaining(["bound_realtime_sideband_closed"]),
    });

    expect(removeAdmittedRealtimeSession({
      realtimeSessionId: "realtime:shared-owner",
      requesterRef,
    })).toBe(true);
    const degraded = await owner.agent
      .get(`/api/agi/realtime/rooms/${roomA}`)
      .expect(200);
    expect(degraded.body.room.runtime.state).toBe("degraded");
    expect(reserveA.body.room.runtime.runtime_id).toBeTruthy();
  });

  it("rejects joining while the prospective participant owns a personal Live session", async () => {
    const app = createSharedRealtimeRoomTestApp();
    const owner = await signInSharedRealtimeRoomTestAgent({
      app,
      profileId: "profile:personal-owner",
      displayName: "Personal Owner",
    });
    const guest = await signInSharedRealtimeRoomTestAgent({
      app,
      profileId: "profile:personal-guest",
      displayName: "Personal Guest",
    });
    const created = await owner.agent
      .post("/api/agi/realtime/rooms")
      .send({ title: "One-call admission" })
      .expect(201);
    const invite = await owner.agent
      .post(`/api/agi/realtime/rooms/${created.body.room.room_id}/invites`)
      .expect(201);

    admitRealtimeSession({
      realtimeSessionId: "realtime:guest-personal",
      requesterRef: buildRealtimeRequesterRef(guest.sessionId),
      visibleUserConsentReceipt: "receipt:visible:guest",
      model: "gpt-realtime-2.1",
    });
    const response = await guest.agent
      .post("/api/agi/realtime/rooms/join")
      .send({ invite_code: invite.body.invite_code })
      .expect(409);
    expect(response.body.error).toBe("shared_realtime_room_personal_session_blocked");
  });

  it("invalidates the bound server session when the owner closes the room", async () => {
    const app = createSharedRealtimeRoomTestApp();
    const owner = await signInSharedRealtimeRoomTestAgent({
      app,
      profileId: "profile:close-owner",
      displayName: "Close Owner",
    });
    const guest = await signInSharedRealtimeRoomTestAgent({
      app,
      profileId: "profile:close-guest",
      displayName: "Close Guest",
    });
    const roomId = await createReadySharedRealtimeRoom({
      owner,
      guest,
      title: "Owner close",
    });
    await owner.agent
      .post(`/api/agi/realtime/rooms/${roomId}/runtime/reserve`)
      .send({ model: "gpt-realtime-2.1" })
      .expect(200);
    const requesterRef = buildRealtimeRequesterRef(owner.sessionId);
    admitRealtimeSession({
      realtimeSessionId: "realtime:owner-close",
      requesterRef,
      visibleUserConsentReceipt: "receipt:visible:owner-close",
      model: "gpt-realtime-2.1",
    });
    updateAdmittedRealtimeSession({
      realtimeSessionId: "realtime:owner-close",
      requesterRef,
      patch: { providerCallId: "call_owner_close" },
    });
    await owner.agent
      .post(`/api/agi/realtime/rooms/${roomId}/runtime/bind`)
      .send({ realtime_session_id: "realtime:owner-close" })
      .expect(200);

    await owner.agent.post(`/api/agi/realtime/rooms/${roomId}/leave`).expect(200);
    expect(readAdmittedRealtimeSession({
      realtimeSessionId: "realtime:owner-close",
      requesterRef,
    })).toBeNull();
  });
});
