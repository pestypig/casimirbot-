import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { llmLocalHandlerMock } = vi.hoisted(() => ({
  llmLocalHandlerMock: vi.fn(),
}));

vi.mock("../server/skills/llm.local", async () => {
  const actual = await vi.importActual<typeof import("../server/skills/llm.local")>(
    "../server/skills/llm.local",
  );
  return {
    ...actual,
    llmLocalHandler: llmLocalHandlerMock,
  };
});

const buildApp = async () => {
  const { planRouter } = await import("../server/routes/agi.plan");
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use("/api/agi", planRouter);
  return app;
};

describe("conversation-turn route", () => {
  beforeEach(() => {
    process.env.ENABLE_AGI = "1";
    llmLocalHandlerMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns classifier + brief schema for representative verify prompts", async () => {
    llmLocalHandlerMock
      .mockResolvedValueOnce({
        text: JSON.stringify({
          mode: "verify",
          confidence: 0.91,
          dispatch_hint: true,
          clarify_needed: false,
          reason: "Verification intent detected.",
        }),
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          brief:
            "I heard your verification request. Next step: run the verify lane and report pass/fail evidence.",
        }),
      });

    const app = await buildApp();
    const res = await request(app).post("/api/agi/ask/conversation-turn").send({
      transcript: "Please verify this claim and give me pass/fail evidence.",
      traceId: "trace-conversation-verify",
      recentTurns: ["user: previous context", "dottie: previous brief"],
    });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.classification).toMatchObject({
      mode: "verify",
      dispatch_hint: true,
      clarify_needed: false,
    });
    expect(typeof res.body.classification.reason).toBe("string");
    expect(typeof res.body.brief.text).toBe("string");
    expect(res.body.dispatch).toMatchObject({
      dispatch_hint: true,
    });
    expect(llmLocalHandlerMock).toHaveBeenCalledTimes(2);
    const briefPrompt = String(llmLocalHandlerMock.mock.calls[1]?.[0]?.prompt ?? "");
    expect(briefPrompt).toContain("Route reason: dispatch:verify");
    expect(briefPrompt).toContain("Do not output raw route/status codes.");
  }, 20000);

  it("keeps brief empty when LLM brief payload is invalid", async () => {
    llmLocalHandlerMock
      .mockResolvedValueOnce({
        text: JSON.stringify({
          mode: "observe",
          confidence: 0.78,
          dispatch_hint: true,
          clarify_needed: false,
          reason: "Substantive exploratory turn detected.",
        }),
      })
      .mockResolvedValueOnce({
        text: "Acknowledging the request. I am thinking through this in the background.",
      });

    const app = await buildApp();
    const res = await request(app).post("/api/agi/ask/conversation-turn").send({
      transcript: "Explain how quantum structures map to system behavior.",
      traceId: "trace-conversation-brief-fallback",
    });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.classification).toMatchObject({
      mode: "observe",
      dispatch_hint: true,
    });
    expect(res.body.route_reason_code).toMatch(/^dispatch:/);
    expect(res.body.dispatch?.dispatch_hint).toBe(true);
    expect(res.body.brief?.source).toBe("none");
    expect(String(res.body.fail_reason ?? "")).toMatch(/conversation_brief_(parse|policy)_none/);
    expect(String(res.body.brief?.text ?? "")).toBe("");
  }, 20000);

  it("rejects clarifier-style brief text for observe turns even when JSON is valid", async () => {
    llmLocalHandlerMock
      .mockResolvedValueOnce({
        text: JSON.stringify({
          mode: "observe",
          confidence: 0.79,
          dispatch_hint: true,
          clarify_needed: false,
          reason: "Exploratory question detected.",
        }),
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          text: 'I heard: "Okay, what is a system.". Share one specific goal or constraint.',
        }),
      });

    const app = await buildApp();
    const res = await request(app).post("/api/agi/ask/conversation-turn").send({
      transcript: "Okay, what is a system?",
      traceId: "trace-observe-brief-policy-fallback",
    });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.classification?.mode).toBe("observe");
    expect(res.body.dispatch?.dispatch_hint).toBe(true);
    expect(res.body.brief?.source).toBe("none");
    expect(String(res.body.fail_reason ?? "")).toContain("conversation_brief_policy_none");
    expect(String(res.body.brief?.text ?? "")).toBe("");
  }, 20000);

  it("falls back deterministically when model/parse paths fail", async () => {
    llmLocalHandlerMock
      .mockRejectedValueOnce(new Error("model unavailable"))
      .mockResolvedValueOnce({ text: "" });

    const app = await buildApp();
    const res = await request(app).post("/api/agi/ask/conversation-turn").send({
      transcript: "Implement this patch and run the action flow now.",
      traceId: "trace-conversation-fallback",
    });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.classification?.source).toBe("fallback");
    expect(res.body.classification?.mode).toBe("act");
    expect(["llm", "none"]).toContain(res.body.brief?.source);
    expect(typeof res.body.brief?.text).toBe("string");
    expect(["conversation_classifier_model_fallback", "conversation_classifier_parse_fallback"]).toContain(
      res.body.fail_reason,
    );
    expect(res.body.dispatch?.dispatch_hint).toBe(true);
    expect(String(res.body.brief?.text ?? "")).toBe("");
    expect(llmLocalHandlerMock).toHaveBeenCalledTimes(2);
  }, 20000);

  it("routes exploratory broad prompts to observe with dispatch enabled", async () => {
    llmLocalHandlerMock
      .mockResolvedValueOnce({
        text: JSON.stringify({
          mode: "clarify",
          confidence: 0.51,
          dispatch_hint: false,
          clarify_needed: true,
          reason: "Needs more detail.",
        }),
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          text: "I’ll run an observe-first pass and report the concrete path next.",
        }),
      });

    const app = await buildApp();
    const res = await request(app).post("/api/agi/ask/conversation-turn").send({
      transcript: "How is a full solve done?",
      traceId: "trace-conversation-explore",
    });

    expect(res.status).toBe(200);
    expect(res.body.classification).toMatchObject({
      mode: "observe",
      dispatch_hint: true,
      clarify_needed: false,
    });
    expect(res.body.route_reason_code).toBe("dispatch:observe_explore");
    expect(res.body.exploration_turn).toBe(true);
    expect(res.body.clarifier_policy).toBe("after_first_attempt");
    expect(res.body.exploration_packet?.topic).toContain("How is a full solve done");
    expect(Array.isArray(res.body.exploration_packet?.unknowns)).toBe(true);
  }, 20000);

  it("suppresses filler turns with deterministic reason code", async () => {
    llmLocalHandlerMock
      .mockResolvedValueOnce({
        text: JSON.stringify({
          mode: "observe",
          confidence: 0.84,
          dispatch_hint: true,
          clarify_needed: false,
          reason: "Observe",
        }),
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          text: "Acknowledged.",
        }),
      });

    const app = await buildApp();
    const res = await request(app).post("/api/agi/ask/conversation-turn").send({
      transcript: "ok thanks",
      traceId: "trace-conversation-filler",
    });

    expect(res.status).toBe(200);
    expect(res.body.classification?.mode).toBe("clarify");
    expect(res.body.dispatch?.dispatch_hint).toBe(false);
    expect(res.body.route_reason_code).toBe("suppressed:filler");
    expect(res.body.exploration_turn).toBe(false);
  }, 20000);

  it("does not down-rank substantive turns that start with 'okay'", async () => {
    llmLocalHandlerMock
      .mockRejectedValueOnce(new Error("classifier unavailable"))
      .mockResolvedValueOnce({
        text: JSON.stringify({
          text: "Okay, what is a system? I will run a short observe pass and return a direct answer.",
        }),
      });

    const app = await buildApp();
    const res = await request(app).post("/api/agi/ask/conversation-turn").send({
      transcript: "Okay, what is a system?",
      traceId: "trace-leading-ok-substantive",
    });

    expect(res.status).toBe(200);
    expect(res.body.classification?.source).toBe("fallback");
    expect(res.body.classification?.mode).toBe("observe");
    expect(res.body.dispatch?.dispatch_hint).toBe(true);
    expect(String(res.body.route_reason_code ?? "")).toMatch(/^dispatch:/);
    expect(String(res.body.brief?.text ?? "").toLowerCase()).not.toContain("share one specific goal or constraint");
  }, 20000);

  it("dispatches multilingual direct questions that use full-width punctuation", async () => {
    llmLocalHandlerMock
      .mockResolvedValueOnce({
        text: JSON.stringify({
          mode: "observe",
          confidence: 0.41,
          dispatch_hint: false,
          clarify_needed: false,
          reason: "Fallback classify output.",
        }),
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          text: "这是一个关于曲速泡的问题，我将进入观察推理并给出解释。",
        }),
      });

    const app = await buildApp();
    const res = await request(app).post("/api/agi/ask/conversation-turn").send({
      transcript: "什么是二库比叶尔扭曲炮？",
      traceId: "trace-multilang-fullwidth-question",
      sourceLanguage: "zh-hans",
      languageDetected: "zh-hans",
    });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.classification?.mode).toBe("observe");
    expect(res.body.dispatch?.dispatch_hint).toBe(true);
    expect(String(res.body.route_reason_code ?? "")).toMatch(/^dispatch:/);
  }, 20000);
});
