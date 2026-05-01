import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { planRouter } from "../routes/agi.plan";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json());
  app.use("/api/agi", planRouter);
  return app;
};

const activePath =
  "/docs/audits/research/selected-family/nhm2-shift-lapse/alpha-sweep/stage1_centerline_alpha_0p7000_v1/warp-nhm2-mission-time-comparison-latest.md";

describe("helix ask E65 active document and open receipt terminals", () => {
  it("answers active document identity from workspace state", async () => {
    const app = createApp();
    const sessionId = `e65-active-doc-${Date.now()}`;
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "What paper am I viewing?",
        mode: "read",
        debug: true,
        sessionId,
        workspace_context_snapshot: {
          sessionId,
          activePanel: "docs-viewer",
          activeDocPath: activePath,
          hasDocContext: true,
        },
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("active_doc_identity");
    expect(response.body?.terminal_artifact_kind).toBe("active_doc_identity");
    expect(String(response.body?.selected_final_answer ?? "")).toContain(activePath);
    expect(response.body?.canonical_goal_frame?.goal_kind).not.toBe("model_only_concept");
  }, 90000);

  it("keeps best-doc open requests on doc_open_receipt instead of locations", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Find and open the best NHM2 document about alpha 0p7000 mission time comparison.",
        mode: "read",
        debug: true,
        sessionId: `e65-open-best-${Date.now()}`,
      })
      .expect(200);

    expect(["doc_open_best", "latest_doc_navigation"]).toContain(response.body?.canonical_goal_frame?.goal_kind);
    expect(response.body?.terminal_artifact_kind).toBe("doc_open_receipt");
    expect(String(response.body?.selected_final_answer ?? "")).not.toMatch(/^Locations:/i);
    expect(String(response.body?.selected_final_answer ?? "")).toMatch(/Path:/i);
  }, 90000);
});
