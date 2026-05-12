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
  "/docs/audits/research/selected-family/nhm2-shift-lapse/alpha-sweep/stage1_centerline_alpha_0p7000_v1/warp-nhm2-observer-audit-2026-04-25.md";

describe("helix ask E66 active document deictic summary", () => {
  it("summarizes the active document instead of refusing as no-tool", async () => {
    const app = createApp();
    const sessionId = `e66-active-doc-summary-${Date.now()}`;

    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "what is this doc about?",
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

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("active_doc_summary");
    expect(response.body?.terminal_artifact_kind).toBe("doc_summary");
    expect(response.body?.final_answer_source).toBe("artifact_synthesis");
    expect(String(response.body?.selected_final_answer ?? "")).toContain(activePath);
    expect(String(response.body?.selected_final_answer ?? "")).not.toMatch(/cannot access or summarize specific documents/i);
    expect(response.body?.resolved_turn_summary?.resolved_route_label).toBe("active_doc_summary / artifact_synthesis");
    expect(response.body?.resolved_turn_summary?.final_answer_source).toBe("artifact_synthesis");
  }, 90000);

  it("summarizes descriptor-qualified current documents", async () => {
    const app = createApp();
    const sessionId = `e66-current-nhm2-doc-summary-${Date.now()}`;

    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Summarize the current NHM2 document in three bullets",
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

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("active_doc_summary");
    expect(response.body?.terminal_artifact_kind).toBe("doc_summary");
    expect(response.body?.terminal_error_code ?? null).toBeNull();
    expect(String(response.body?.selected_final_answer ?? "")).toContain(activePath);
  }, 90000);

  it("fails cleanly when a deictic doc summary has no active document", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "what is this doc about?",
        mode: "read",
        debug: true,
        sessionId: `e66-active-doc-missing-${Date.now()}`,
        workspace_context_snapshot: {
          activePanel: "docs-viewer",
          hasDocContext: false,
        },
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("active_doc_summary");
    expect(response.body?.terminal_artifact_kind).toBe("typed_failure");
    expect(response.body?.terminal_error_code).toBe("active_doc_summary_unavailable");
    expect(String(response.body?.selected_final_answer ?? "")).toContain("active_doc_summary_unavailable");
    expect(response.body?.resolved_turn_summary?.resolved_route_label).toBe(
      "active_doc_summary / typed_failure:active_doc_summary_unavailable",
    );
  }, 90000);

  it("does not let background-only doc-summary concepts use the workspace", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Background only: what is a document summary?",
        mode: "read",
        debug: true,
        sessionId: `e66-background-${Date.now()}`,
        workspace_context_snapshot: {
          activePanel: "docs-viewer",
          activeDocPath: activePath,
          hasDocContext: true,
        },
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("model_only_concept");
    expect(response.body?.final_answer_source).not.toBe("artifact_synthesis");
    expect(response.body?.terminal_artifact_kind).not.toBe("doc_summary");
  }, 90000);
});
