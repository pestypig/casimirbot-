import { afterEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

const buildApp = async () => {
  await vi.resetModules();
  const { voiceRouter, resetVoiceRouteState } = await import("../routes/voice");
  resetVoiceRouteState();
  const app = express();
  app.use("/api/voice", voiceRouter);
  return app;
};

describe("voice speaker session routes", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("trusts a speaker for the current audio identity session", async () => {
    const app = await buildApp();

    const trustResponse = await request(app)
      .post("/api/voice/speaker-session/trust")
      .send({
        audio_identity_session_id: "audio-session-route-1",
        room_id: "room-route-1",
        thread_id: "thread-route-1",
        speaker_id: "spk_guest_route",
        display_name: "Rowan",
        role: "trusted_guest",
        authority: "command_confirm",
      })
      .expect(200);

    expect(trustResponse.body).toMatchObject({
      ok: true,
      session: {
        session_id: "audio-session-route-1",
        room_id: "room-route-1",
        thread_id: "thread-route-1",
        speaker_count: 1,
        speakers: [
          {
            speaker_id: "spk_guest_route",
            display_name: "Rowan",
            role: "trusted_guest",
            authority: "command_confirm",
            enrollment_state: "session",
          },
        ],
      },
    });

    const getResponse = await request(app)
      .get("/api/voice/speaker-session/audio-session-route-1")
      .expect(200);

    expect(getResponse.body.session.speakers[0]).toMatchObject({
      speaker_id: "spk_guest_route",
      display_name: "Rowan",
      role: "trusted_guest",
      authority: "command_confirm",
    });
  });
});
