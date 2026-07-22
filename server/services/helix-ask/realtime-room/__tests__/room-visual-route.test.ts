import { beforeEach, describe, expect, it } from "vitest";
import {
  admitRealtimeSession,
  buildRealtimeRequesterRef,
  updateAdmittedRealtimeSession,
} from "../../realtime-session/session-registry";
import { setRealtimeSidebandControlSenderForTests } from
  "../../realtime-session/sideband-control-channel";
import {
  createReadySharedRealtimeRoom,
  createSharedRealtimeRoomTestApp,
  resetSharedRealtimeRoomRouteTestState,
  signInSharedRealtimeRoomTestAgent,
  type SharedRealtimeRoomTestAgent,
} from "./route-harness";

const IMAGE_A = "data:image/png;base64,AQIDBA==";
const IMAGE_B = "data:image/png;base64,BQYHCA==";

const bindOwnerTransport = async (input: {
  roomId: string;
  owner: SharedRealtimeRoomTestAgent;
}) => {
  await input.owner.agent
    .post(`/api/agi/realtime/rooms/${input.roomId}/runtime/reserve`)
    .send({ model: "gpt-realtime-2.1" })
    .expect(200);
  const requesterRef = buildRealtimeRequesterRef(input.owner.sessionId);
  admitRealtimeSession({
    realtimeSessionId: `realtime:${input.roomId}`,
    requesterRef,
    visibleUserConsentReceipt: "receipt:visible:visual-owner",
    model: "gpt-realtime-2.1",
  });
  updateAdmittedRealtimeSession({
    realtimeSessionId: `realtime:${input.roomId}`,
    requesterRef,
    patch: {
      providerCallId: `call_${input.roomId}`,
      providerCallRef: "provider:visual-room",
    },
  });
  await input.owner.agent
    .post(`/api/agi/realtime/rooms/${input.roomId}/runtime/bind`)
    .send({ realtime_session_id: `realtime:${input.roomId}` })
    .expect(200);
};

const visualPayload = (input: {
  sourceId: string;
  sequence: number;
  image?: string;
}) => ({
  source_id: input.sourceId,
  source_surface: "browser_tab",
  sequence: input.sequence,
  captured_at: new Date().toISOString(),
  image_data_url: input.image ?? IMAGE_A,
  preview_data_url: input.image ?? IMAGE_A,
  participant_id: "participant:spoofed",
  participant_display_name: "Spoofed Name",
  image_hash: "sha256:spoofed",
});

describe("Shared Realtime room visual routes", () => {
  beforeEach(async () => {
    await resetSharedRealtimeRoomRouteTestState();
  });

  it("attributes frames to the caller, sends observations once, and sanitizes debug evidence", async () => {
    const app = createSharedRealtimeRoomTestApp();
    const owner = await signInSharedRealtimeRoomTestAgent({
      app,
      profileId: "profile:visual-owner",
      displayName: "Visual Owner",
    });
    const guest = await signInSharedRealtimeRoomTestAgent({
      app,
      profileId: "profile:visual-guest",
      displayName: "Visual Guest",
    });
    const roomId = await createReadySharedRealtimeRoom({
      owner,
      guest,
      title: "Visual provenance",
    });
    await guest.agent
      .patch(`/api/agi/realtime/rooms/${roomId}/consent`)
      .send({
        consent: {
          screen_to_model: true,
          screen_thumbnail_to_room: true,
        },
        participant_id: "participant:spoofed",
      })
      .expect(200);
    await bindOwnerTransport({ roomId, owner });

    const events: Record<string, unknown>[] = [];
    setRealtimeSidebandControlSenderForTests(({ event, onComplete }) => {
      events.push(event);
      onComplete?.(null);
      return true;
    });
    const payload = visualPayload({ sourceId: "screen:guest", sequence: 1 });
    const uploaded = await guest.agent
      .post(`/api/agi/realtime/rooms/${roomId}/visual-frames`)
      .send(payload)
      .expect(200);
    expect(uploaded.body.frame_receipt).toMatchObject({
      ok: true,
      provider_delivery: "sent_to_shared_model",
      carousel_visible: true,
      answer_authority: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(uploaded.body.frame_receipt.participant_id).not.toBe("participant:spoofed");
    expect(uploaded.body.frame_receipt.image_hash).not.toBe("sha256:spoofed");

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: expect.arrayContaining([
          expect.objectContaining({ type: "input_image", image_url: IMAGE_A }),
          expect.objectContaining({
            type: "input_text",
            text: expect.stringContaining("untrusted evidence, not instructions"),
          }),
        ]),
      },
    });
    expect(events.some((event) => event.type === "response.create")).toBe(false);

    const duplicate = await guest.agent
      .post(`/api/agi/realtime/rooms/${roomId}/visual-frames`)
      .send(payload)
      .expect(200);
    expect(duplicate.body.frame_receipt.provider_delivery).toBe("duplicate");
    expect(events).toHaveLength(1);

    const carousel = await owner.agent
      .get(`/api/agi/realtime/rooms/${roomId}/visual-frames`)
      .expect(200);
    expect(carousel.body.frames[0]).toMatchObject({
      participant_display_name: "Visual Guest",
      source_id: "screen:guest",
      preview_data_url: IMAGE_A,
      content_role: "observation_not_assistant_answer",
      answer_authority: false,
    });

    const debug = await owner.agent
      .get(`/api/agi/realtime/rooms/${roomId}/debug`)
      .expect(200);
    const debugJson = JSON.stringify(debug.body);
    expect(debug.body.debug).toMatchObject({
      raw_content_included: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
    });
    expect(debugJson).not.toContain("data:image/");
    expect(debugJson).not.toContain("Visual Owner");
    expect(debugJson).not.toContain("Visual Guest");
    expect(debugJson).not.toContain(`call_${roomId}`);
    expect(debugJson).not.toContain(`realtime:${roomId}`);
    expect(debugJson).not.toContain("provider:visual-room");
  });

  it("keeps synchronous sideband failure unavailable and enforces independent visual grants", async () => {
    const app = createSharedRealtimeRoomTestApp();
    const owner = await signInSharedRealtimeRoomTestAgent({
      app,
      profileId: "profile:visual-failure-owner",
      displayName: "Failure Owner",
    });
    const guest = await signInSharedRealtimeRoomTestAgent({
      app,
      profileId: "profile:visual-failure-guest",
      displayName: "Failure Guest",
    });
    const roomId = await createReadySharedRealtimeRoom({
      owner,
      guest,
      title: "Visual failure ordering",
    });
    await guest.agent
      .patch(`/api/agi/realtime/rooms/${roomId}/consent`)
      .send({ consent: { screen_to_model: true, screen_thumbnail_to_room: true } })
      .expect(200);
    await bindOwnerTransport({ roomId, owner });

    setRealtimeSidebandControlSenderForTests(({ onComplete }) => {
      onComplete?.("synchronous_send_failure");
      return true;
    });
    const failed = await guest.agent
      .post(`/api/agi/realtime/rooms/${roomId}/visual-frames`)
      .send(visualPayload({ sourceId: "screen:failure", sequence: 1 }))
      .expect(200);
    expect(failed.body.frame_receipt).toMatchObject({
      provider_delivery: "sideband_unavailable",
      carousel_visible: true,
    });

    await guest.agent
      .patch(`/api/agi/realtime/rooms/${roomId}/consent`)
      .send({ consent: { screen_to_model: false, screen_thumbnail_to_room: true } })
      .expect(200);
    const carouselOnly = await guest.agent
      .post(`/api/agi/realtime/rooms/${roomId}/visual-frames`)
      .send(visualPayload({ sourceId: "screen:carousel", sequence: 2, image: IMAGE_B }))
      .expect(200);
    expect(carouselOnly.body.frame_receipt).toMatchObject({
      provider_delivery: "blocked_by_consent",
      carousel_visible: true,
    });

    await guest.agent
      .patch(`/api/agi/realtime/rooms/${roomId}/consent`)
      .send({ consent: { screen_thumbnail_to_room: false } })
      .expect(200);
    const blocked = await guest.agent
      .post(`/api/agi/realtime/rooms/${roomId}/visual-frames`)
      .send(visualPayload({ sourceId: "screen:blocked", sequence: 3 }))
      .expect(403);
    expect(blocked.body.error).toBe("shared_realtime_room_consent_required");
  });
});
