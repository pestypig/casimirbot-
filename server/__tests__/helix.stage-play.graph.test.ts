import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { helixStagePlayRouter } from "../routes/helix/stage-play";

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/helix/stage-play", helixStagePlayRouter);
  return app;
}

describe("GET /api/helix/stage-play/graph", () => {
  it("returns a stage_play_badge_graph/v1 artifact", async () => {
    const app = makeApp();

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
    const app = makeApp();

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

  it("returns builder catalog and source-query artifacts for the panel", async () => {
    const app = makeApp();

    const response = await request(app)
      .get("/api/helix/stage-play/builder")
      .query({
        threadId: "thread:stage-builder",
        environmentId: "live_env:stage-builder",
      })
      .expect(200);

    expect(response.body.artifactId).toBe("stage_play_builder_context");
    expect(response.body.catalog.schemaVersion).toBe("stage_play_builder_catalog/v1");
    expect(response.body.sourceQuery.schemaVersion).toBe("stage_play_source_query/v1");
    expect(response.body.sourceQuery.threadId).toBe("thread:stage-builder");
    expect(response.body.sourceQuery.environmentId).toBe("live_env:stage-builder");
    expect(response.body.authority).toMatchObject({
      assistant_answer: false,
      terminal_eligible: false,
      agent_executable: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
  });

  it("validates stage graph drafts without granting execution authority", async () => {
    const app = makeApp();

    const response = await request(app)
      .post("/api/helix/stage-play/draft/validate")
      .send({
        threadId: "thread:stage-builder",
        draft: {
          artifactId: "stage_play_graph_draft",
          schemaVersion: "stage_play_graph_draft/v1",
          draftId: "draft:missing-source",
          objective: "Assemble a source-bound stage.",
          nodes: [
            {
              id: "source.visual",
              kind: "source",
              bind: {
                sourceClass: "visual_frame",
                sourceId: "source:missing",
              },
            },
          ],
          edges: [],
          checkpointPolicy: {
            completeEachWindow: true,
            standingJobRemainsOpen: true,
          },
        },
      })
      .expect(422);

    expect(response.body.artifactId).toBe("stage_play_graph_draft_validation");
    expect(response.body.schemaVersion).toBe("stage_play_graph_draft_validation/v1");
    expect(response.body.ok).toBe(false);
    expect(response.body.issues.join("\n")).toMatch(/source:missing/);
    expect(response.body.authority).toMatchObject({
      assistant_answer: false,
      terminal_eligible: false,
      agent_executable: false,
    });
  });
});
