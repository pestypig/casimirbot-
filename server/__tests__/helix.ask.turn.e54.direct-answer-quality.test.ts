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

const answerText = (body: any): string => String(body?.selected_final_answer ?? body?.text ?? "");

describe("helix ask E54 direct-answer quality", () => {
  it("does not accept the retry placeholder as a successful background-only final answer", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Background only: explain why alpha less than 1 shortens proper time.",
        mode: "read",
        debug: true,
        sessionId: `e54-direct-quality-${Date.now()}`,
        workspace_context_snapshot: {
          activePanel: "docs",
          activeDocPath:
            "/docs/audits/research/selected-family/nhm2-shift-lapse/alpha-sweep/stage1_centerline_alpha_0p7000_v1/envelope/warp-nhm2-envelope-perturbation-suite-2026-04-26.md",
        },
      })
      .expect(200);

    expect(response.body?.retrieval_required_signal?.required).toBe(false);
    expect(["direct_answer_text", "typed_failure"]).toContain(response.body?.terminal_artifact_kind);
    expect(answerText(response.body)).not.toMatch(/I couldn.?t produce a final answer for that turn|Please retry once/i);
    expect(answerText(response.body)).not.toMatch(/^Explained\s+\//i);
    if (response.body?.terminal_artifact_kind === "typed_failure") {
      expect(["direct_answer_unavailable", "model_only_answer_unavailable"]).toContain(
        response.body?.terminal_error_code,
      );
    }
  }, 60000);

  it("answers workspace onboarding with Helix-specific capabilities without retrieval", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "What can you help me do in this workspace?",
        mode: "read",
        debug: true,
        sessionId: `e54-workspace-help-${Date.now()}`,
      })
      .expect(200);

    const answer = answerText(response.body).toLowerCase();
    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("workspace_help");
    expect(response.body?.retrieval_required_signal?.required).toBe(false);
    expect(response.body?.execution_trace?.some((step: any) => step?.action?.action_id === "search_docs")).not.toBe(true);
    for (const expected of ["docs", "notes", "source paths", "locate", "compare", "summaries", "background-only"]) {
      expect(answer).toContain(expected);
    }
  }, 60000);
});
