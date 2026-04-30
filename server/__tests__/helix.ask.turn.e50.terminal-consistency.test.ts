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

const answerText = (body: any): string =>
  String(body?.selected_final_answer ?? body?.assistant_answer ?? body?.answer ?? body?.text ?? "");

const artifactKinds = (body: any): string[] =>
  Array.isArray(body?.current_turn_artifact_ledger)
    ? body.current_turn_artifact_ledger.map((artifact: any) => String(artifact?.kind ?? "")).filter(Boolean)
    : [];

describe("helix ask E50 terminal consistency", () => {
  it("keeps a conceptual model-only question out of active document terminal state", async () => {
    const app = createApp();
    const activePath = "/docs/research/nhm2-frontier-distance-report.md";
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Can you explain proper time vs coordinate time in simple terms?",
        mode: "read",
        debug: true,
        sessionId: `e50-model-only-active-doc-${Date.now()}`,
        workspace_context_snapshot: {
          activePanel: "docs",
          activeDocPath: activePath,
          docViewer: { currentPath: activePath },
        },
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("model_only_concept");
    expect(response.body?.canonical_goal_frame?.answer_scope).toBe("model_only");
    expect(response.body?.canonical_goal_frame?.required_terminal_kind).toBe("direct_answer_text");
    expect(response.body?.tool_choice_arbitration?.answer_scope).toBe("model_only");
    expect(response.body?.terminal_artifact_kind).not.toBe("doc_summary");
    expect(answerText(response.body)).not.toMatch(/Explained\s+\/docs|Compared\s+\/|\/docs\//i);
    expect(response.body?.rejected_terminal_candidates ?? []).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "active_doc_path",
          rejection_reason: "ambient_workspace_context",
        }),
      ]),
    );
  }, 60000);

  it("records direct answer text in the current-turn ledger for no-tool concept turns", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Background question: in GR, what is extrinsic curvature in simple terms?",
        mode: "read",
        debug: true,
        sessionId: `e50-no-tool-ledger-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("model_only_concept");
    expect(response.body?.satisfaction_report?.terminal_kind).toBe(response.body?.final_status);
    expect(response.body?.terminal_consistency_check?.consistent).toBe(true);
    if (response.body?.terminal_artifact_kind === "typed_failure") {
      expect(artifactKinds(response.body)).toContain("typed_failure");
      expect(response.body?.terminal_error_code).toBe("model_only_answer_unavailable");
    } else {
      expect(artifactKinds(response.body)).toContain("direct_answer_text");
      expect(response.body?.terminal_artifact_kind).toBe("direct_answer_text");
    }
  }, 60000);

  it("does not allow doc_summary to satisfy an NHM2 alpha 0p995 numeric request", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Find the best doc about NHM2 alpha 0p995 frontier distance and tell me the key numeric result.",
        mode: "read",
        debug: true,
        sessionId: `e50-numeric-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("doc_scientific_numeric");
    expect(response.body?.canonical_goal_frame?.required_terminal_kind).toBe("doc_numeric_answer");
    expect(response.body?.terminal_artifact_kind).not.toBe("doc_summary");
    expect(["doc_numeric_answer", "typed_failure", null]).toContain(response.body?.terminal_artifact_kind ?? null);
    if (response.body?.terminal_artifact_kind === "typed_failure") {
      expect(response.body?.terminal_error_code).toMatch(/numeric_result_unavailable|terminal_consistency_violation|authoritative_terminal_missing/);
    }
  }, 90000);

  it("classifies NHM2 alpha 0p7000 plain-language prompts as scientific concept turns", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "In normal words, what does alpha 0p7000 mean for the NHM2 warp profile?",
        mode: "read",
        debug: true,
        sessionId: `e50-concept-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("doc_scientific_concept");
    expect(response.body?.canonical_goal_frame?.required_terminal_kind).toBe("doc_concept_explanation");
    expect(response.body?.tool_choice_arbitration?.answer_scope).not.toBe("model_only");
    expect(response.body?.terminal_artifact_kind).not.toBe("doc_summary");
    expect(["doc_concept_explanation", "typed_failure", null]).toContain(response.body?.terminal_artifact_kind ?? null);
  }, 90000);
});
