import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { helixStagePlayRouter } from "../routes/helix/stage-play";

describe("GET /api/helix/stage-play/graph", () => {
  it("returns a stage_play_badge_graph/v1 artifact", async () => {
    const app = express();
    app.use("/api/helix/stage-play", helixStagePlayRouter);

    const response = await request(app).get("/api/helix/stage-play/graph").expect(200);

    expect(response.body.artifactId).toBe("stage_play_badge_graph");
    expect(response.body.schemaVersion).toBe("stage_play_badge_graph/v1");
    expect(response.body.badges).toEqual(expect.any(Array));
    expect(response.body.edges).toEqual(expect.any(Array));
    expect(response.body.recommendedActions).toEqual(expect.any(Array));
    expect(response.body.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      agent_executable: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(JSON.stringify(response.body)).not.toMatch(/\braw[_ -]?(?:chunk|nbt|log|user[_ -]?text)\b/i);
  });

  it("uses query identifiers to scope the transient source window", async () => {
    const app = express();
    app.use("/api/helix/stage-play", helixStagePlayRouter);

    const response = await request(app)
      .get("/api/helix/stage-play/graph")
      .query({
        threadId: "thread:ui-live",
        roomId: "room:ui-live",
        environmentId: "live_env:ui-live",
      })
      .expect(200);

    expect(response.body.sourceWindow).toMatchObject({
      threadId: "thread:ui-live",
      roomId: "room:ui-live",
      environmentId: "live_env:ui-live",
    });
  });
});
