import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

const buildApp = async () => {
  const { planRouter } = await import("../server/routes/agi.plan");
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use("/api/agi", planRouter);
  return app;
};

describe("helix ask interpreter gate regressions", () => {
  beforeEach(() => {
    process.env.ENABLE_AGI = "1";
  });

  it("does not hard-block when provided interpreter artifact is provider_error fallback", async () => {
    const app = await buildApp();
    const res = await request(app).post("/api/agi/ask").send({
      question: "What is the Alcubierre bubble?",
      sourceQuestion: "什么是阿尔库比耶尔扭曲炮?",
      sourceLanguage: "zh-hans",
      languageDetected: "zh-hans",
      translated: true,
      pivotConfidence: 0.93,
      dryRun: true,
      traceId: "test-provider-error-fallback-does-not-block",
      interpreter: {
        schema_version: "helix.interpreter.v1",
        source_text: "什么是阿尔库比耶尔扭曲炮?",
        source_language: "zh-hans",
        code_mixed: false,
        pivot_candidates: [{ text: "What is the Alcubierre bubble?", confidence: 0.45 }],
        selected_pivot: { text: "What is the Alcubierre bubble?", confidence: 0.45 },
        concept_candidates: [],
        term_preservation: { ratio: 1, missing_terms: [] },
        ambiguity: { top2_gap: 0, ambiguous: true },
        term_ids: [],
        concept_ids: [],
        confirm_prompt: "你是指“Alcubierre bubble”吗？",
        dispatch_state: "blocked",
      },
      interpreterStatus: "provider_error",
      interpreterError: "interpreter_http_404:not_found",
    });

    expect(res.status).toBe(200);
    expect(res.body.fail_reason).not.toBe("HELIX_INTERPRETER_DISPATCH_BLOCKED");
    expect(res.body.fail_class).not.toBe("multilang_confidence_gate");
  }, 30000);
});
