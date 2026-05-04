import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

const createApp = async (): Promise<express.Express> => {
  const { planRouter } = await import("../routes/agi.plan");
  const app = express();
  app.use(express.json());
  app.use("/api/agi", planRouter);
  return app;
};

describe("helix ask E2 situation room setup intent", () => {
  afterEach(() => {
    delete process.env.HELIX_E11_MODEL_DECISION_LLM;
    delete process.env.HELIX_E14_OBSERVATION_MODEL_DECISION;
    vi.resetModules();
  });

  it("plans Discord tab translation setup as a permission-bound Situation Room action", async () => {
    process.env.HELIX_E11_MODEL_DECISION_LLM = "0";
    process.env.HELIX_E14_OBSERVATION_MODEL_DECISION = "0";
    vi.resetModules();

    const app = await createApp();
    const sessionId = `e2-situation-setup-${Date.now()}`;
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Translate this conversation between me and my friend in the Discord tab.",
        mode: "read",
        debug: true,
        sessionId,
        workspace_context_snapshot: {
          sessionId,
          activePanel: "situation-room-sources",
          hasSituationRoomContext: false,
        },
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("situation_room_setup");
    expect(response.body?.situation_room_setup_intent).toMatchObject({
      schema: "helix.situation_setup_intent.v1",
      kind: "translate_conversation",
      capture_preference: "browser_tab_audio",
      output_mode: "visual_only",
    });
    expect(response.body?.situation_room_setup_intent?.missing_requirements).toEqual(
      expect.arrayContaining(["audio_source", "capture_permission", "speaker_a", "speaker_b"]),
    );
    expect(response.body?.final_status).toBe("pending_input");
    expect(response.body?.pending_server_request).toMatchObject({
      kind: "request_user_input",
      required_fields: expect.arrayContaining(["audio_source", "capture_permission"]),
    });
    expect(response.body?.workspace_action).toMatchObject({
      panel_id: "situation-room-pipelines",
      action_id: "setup_from_prompt",
    });
    expect(response.body?.situation_room_setup_receipt).toMatchObject({
      schema: "helix.situation_setup_receipt.v1",
      setup_status: "needs_capture_permission",
      attachment_policy: "manual_only",
      context_injection: "explicit_attachment_only",
      command_lane_enabled: false,
    });
    expect(response.body?.current_turn_artifact_ledger?.map((artifact: any) => artifact.kind)).toEqual(
      expect.arrayContaining(["dynamicToolCall", "situation_room_setup_receipt", "pending_server_request"]),
    );
  }, 60000);

  it("builds a complete setup receipt when source, speakers, and languages are already known", async () => {
    process.env.HELIX_E11_MODEL_DECISION_LLM = "0";
    process.env.HELIX_E14_OBSERVATION_MODEL_DECISION = "0";
    vi.resetModules();

    const app = await createApp();
    const sessionId = `e2-situation-setup-complete-${Date.now()}`;
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Translate this live conversation between me and my friend in the current room.",
        mode: "read",
        debug: true,
        sessionId,
        workspace_context_snapshot: {
          sessionId,
          activePanel: "situation-room-pipelines",
          hasSituationRoomContext: true,
          situationRoomContext: {
            room_id: "room:known",
            source_ids: ["src:display"],
            speaker_mappings: [
              {
                speaker_id: "speaker:self",
                role_hint: "self",
                native_language: "English",
              },
              {
                speaker_id: "speaker:friend",
                role_hint: "friend",
                native_language: "Spanish",
              },
            ],
          },
        },
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("situation_room_setup");
    expect(response.body?.final_status).toBe("final_answer");
    expect(response.body?.pending_server_request).toBeNull();
    expect(response.body?.situation_room_setup_intent).toMatchObject({
      room_id: "room:known",
      source_ids: ["src:display"],
      missing_requirements: [],
    });
    expect(response.body?.workspace_action?.args).toMatchObject({
      room_id: "room:known",
      source_ids: ["src:display"],
      speaker_a_id: "speaker:self",
      speaker_b_id: "speaker:friend",
      speaker_a_native_language: "English",
      speaker_b_native_language: "Spanish",
    });
    expect(response.body?.situation_room_setup_receipt).toMatchObject({
      ok: true,
      setup_status: "complete",
      room_id: "room:known",
      source_ids: ["src:display"],
      speaker_ids: ["speaker:self", "speaker:friend"],
      attachment_policy: "manual_only",
      context_injection: "explicit_attachment_only",
      command_lane_enabled: false,
    });
  }, 60000);

  it("keeps explicit Situation Room translation job requests on the job-routing lane", async () => {
    process.env.HELIX_E11_MODEL_DECISION_LLM = "0";
    process.env.HELIX_E14_OBSERVATION_MODEL_DECISION = "0";
    vi.resetModules();

    const app = await createApp();
    const sessionId = `e2-situation-job-${Date.now()}`;
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Create a Spanish translation job for the current Situation Room source",
        mode: "read",
        debug: true,
        sessionId,
        workspace_context_snapshot: {
          sessionId,
          activePanel: "situation-room-sources",
          hasSituationRoomContext: true,
        },
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("panel_control");
    expect(response.body?.situation_room_setup_intent).toBeUndefined();
    expect(JSON.stringify(response.body)).toContain("situation-room-pipelines");
    expect(JSON.stringify(response.body)).toContain("create_job");
  }, 60000);
});
