import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { accountSessionRouter } from "../account-session";
import { workstationToolGatewayRouter } from "../agi.workstation-tool-gateway";
import { resetAccountSessionStore } from "../../services/helix-account/account-session-store";
import { realtimeTexturePackHarnessStore } from "../../services/helix-ask/workstation-tool-gateway/realtime-texture-pack-harness-store";

const app = () => {
  const instance = express();
  instance.use(express.json());
  instance.use("/api/account", accountSessionRouter);
  instance.use("/api/agi", workstationToolGatewayRouter);
  return instance;
};

describe("Realtime Texture Pack harness routes", () => {
  beforeEach(async () => {
    await resetAccountSessionStore();
    realtimeTexturePackHarnessStore.resetForTests();
  });

  it("rejects no-session public access", async () => {
    await request(app())
      .post("/api/agi/realtime-texture-pack/harness/poll")
      .send({ session_id: "texture-session:forged" })
      .expect(403);
  });

  it("creates and revokes a developer-owned lease without accepting pixels", async () => {
    const agent = request.agent(app());
    await agent.post("/api/account/session/sign-in")
      .send({ profile_id: "profile:rtp-route-developer" })
      .expect(200);
    const enabled = await agent
      .post("/api/agi/realtime-texture-pack/harness/poll")
      .send({
        session_id: "texture-session:route",
        allowed_actions: ["show_overlay", "forged_action"],
        client_state: {
          capture_active: true,
          overlay_visible: false,
          session_status: "streaming",
          projection_image_data_url: "data:image/jpeg;base64,secret",
        },
      })
      .expect(200);
    expect(enabled.body.commands).toEqual([]);
    const projection = realtimeTexturePackHarnessStore.inspect("profile:rtp-route-developer");
    expect(projection.allowed_actions).toEqual(["show_overlay"]);
    expect(projection.client_state).not.toHaveProperty("projection_image_data_url");

    const gateway = await agent
      .post("/api/agi/workstation-tool-gateway/call")
      .send({
        mode: "act",
        agent_runtime: "codex",
        capability_id: "realtime_texture_pack.show_overlay",
        arguments: {},
        turn_id: "turn:rtp-route",
      })
      .expect(200);
    expect(gateway.body).toMatchObject({
      ok: true,
      capability_id: "realtime_texture_pack.show_overlay",
      observation_packet: { status: "client_pending" },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
    });
    expect(realtimeTexturePackHarnessStore.poll(
      "profile:rtp-route-developer",
      "texture-session:route",
    ).commands).toHaveLength(1);

    await agent.post("/api/agi/realtime-texture-pack/harness/lease")
      .send({ operation: "disable", session_id: "texture-session:route" })
      .expect(200);
    expect(realtimeTexturePackHarnessStore.inspect("profile:rtp-route-developer").lease_active).toBe(false);
  });
});
