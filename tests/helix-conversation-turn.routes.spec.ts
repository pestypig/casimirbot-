import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import request from "supertest";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

const historyTempDir = fs.mkdtempSync(path.join(os.tmpdir(), "helix-conversation-history-route-"));
const historyLogPath = path.join(historyTempDir, "helix-conversation-history.jsonl");
const threadLedgerPath = path.join(historyTempDir, "helix-thread-ledger.jsonl");

describe("conversation-turn route", () => {
  beforeEach(() => {
    process.env.ENABLE_AGI = "1";
    process.env.HELIX_ASK_CONVERSATION_HISTORY_AUDIT_PATH = historyLogPath;
    process.env.HELIX_ASK_CONVERSATION_HISTORY_PERSIST = "1";
    process.env.HELIX_THREAD_LEDGER_PATH = threadLedgerPath;
    process.env.HELIX_THREAD_PERSIST = "1";
    llmLocalHandlerMock.mockReset();
  });

  afterEach(async () => {
    vi.clearAllMocks();
    for (const name of fs.readdirSync(historyTempDir)) {
      if (name.endsWith(".jsonl")) {
        fs.rmSync(path.join(historyTempDir, name), { force: true });
      }
    }
    const { __resetConversationHistoryStore } = await import(
      "../server/services/helix-ask/conversation-history"
    );
    const { __resetHelixThreadLedgerStore } = await import(
      "../server/services/helix-thread/ledger"
    );
    __resetConversationHistoryStore();
    __resetHelixThreadLedgerStore();
    delete process.env.HELIX_ASK_CONVERSATION_HISTORY_AUDIT_PATH;
    delete process.env.HELIX_ASK_CONVERSATION_HISTORY_PERSIST;
    delete process.env.HELIX_THREAD_LEDGER_PATH;
    delete process.env.HELIX_THREAD_PERSIST;
  });

  afterAll(() => {
    fs.rmSync(historyTempDir, { recursive: true, force: true });
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

  it("auto-seeds recentTurns from persisted conversation history when omitted", async () => {
    llmLocalHandlerMock
      .mockResolvedValueOnce({
        text: JSON.stringify({
          mode: "verify",
          confidence: 0.88,
          dispatch_hint: true,
          clarify_needed: false,
          reason: "Verification intent detected.",
        }),
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          brief: "I heard your verification request and will keep the same evidence trail.",
        }),
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          mode: "observe",
          confidence: 0.77,
          dispatch_hint: true,
          clarify_needed: false,
          reason: "Follow-up explanatory turn detected.",
        }),
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          brief: "I am carrying forward the prior verification context into this follow-up.",
        }),
      });

    const app = await buildApp();
    await request(app).post("/api/agi/ask/conversation-turn").send({
      sessionId: "session-history-seed",
      traceId: "turn-history-1",
      transcript: "Please verify this claim and give me pass/fail evidence.",
    }).expect(200);

    const { __resetConversationHistoryStore } = await import(
      "../server/services/helix-ask/conversation-history"
    );
    const { getHelixThreadLedgerEvents } = await import(
      "../server/services/helix-thread/ledger"
    );
    expect(
      getHelixThreadLedgerEvents({ sessionId: "session-history-seed" }).map(
        (entry) => entry.event_type,
      ),
    ).toEqual([
      "conversation_turn_started",
      "conversation_turn_classified",
      "conversation_turn_brief_ready",
      "conversation_turn_completed",
    ]);
    __resetConversationHistoryStore();
    for (const name of fs.readdirSync(historyTempDir)) {
      if (name.startsWith("helix-conversation-history") && name.endsWith(".jsonl")) {
        fs.rmSync(path.join(historyTempDir, name), { force: true });
      }
    }

    const followUp = await request(app).post("/api/agi/ask/conversation-turn").send({
      sessionId: "session-history-seed",
      traceId: "turn-history-2",
      transcript: "Where is that coming from in the prior answer?",
    });

    expect(followUp.status).toBe(200);
    expect(followUp.body.turn_id).toBe("turn-history-2");
    const seededClassifierPrompt = String(llmLocalHandlerMock.mock.calls[2]?.[0]?.prompt ?? "");
    expect(seededClassifierPrompt).toContain("user: Please verify this claim and give me pass/fail evidence.");
    expect(seededClassifierPrompt).toContain(
      "dottie: I heard your verification request and will keep the same evidence trail.",
    );
  }, 20000);

  it("re-hydrates persisted conversation history after router reload", async () => {
    llmLocalHandlerMock
      .mockResolvedValueOnce({
        text: JSON.stringify({
          mode: "observe",
          confidence: 0.83,
          dispatch_hint: true,
          clarify_needed: false,
          reason: "Initial explanatory turn detected.",
        }),
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          brief: "I am explaining the current evidence trail in a conversational follow-up.",
        }),
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          mode: "observe",
          confidence: 0.79,
          dispatch_hint: true,
          clarify_needed: false,
          reason: "Follow-up explanatory turn detected.",
        }),
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          brief: "I am still using the earlier answer as conversational context after restart.",
        }),
      });

    const firstApp = await buildApp();
    await request(firstApp).post("/api/agi/ask/conversation-turn").send({
      sessionId: "session-history-restart",
      traceId: "restart-history-1",
      transcript: "Explain the earlier answer in one conversational follow-up.",
    }).expect(200);

    vi.resetModules();
    const restartedApp = await buildApp();
    const followUp = await request(restartedApp).post("/api/agi/ask/conversation-turn").send({
      sessionId: "session-history-restart",
      traceId: "restart-history-2",
      transcript: "Now connect that to the prior answer again.",
    });

    expect(followUp.status).toBe(200);
    expect(followUp.body.ok).toBe(true);
    expect(followUp.body.classification?.mode).toBe("observe");
    expect(followUp.body.dispatch?.dispatch_hint).toBe(true);
    const restartedClassifierPrompt = String(llmLocalHandlerMock.mock.calls[2]?.[0]?.prompt ?? "");
    expect(restartedClassifierPrompt).toContain(
      "user: Explain the earlier answer in one conversational follow-up.",
    );
    expect(restartedClassifierPrompt).toContain(
      "dottie: I am explaining the current evidence trail in a conversational follow-up.",
    );
    const { getHelixThreadLedgerEvents } = await import("../server/services/helix-thread/ledger");
    expect(
      getHelixThreadLedgerEvents({ sessionId: "session-history-restart" }).map(
        (entry) => entry.event_type,
      ),
    ).toEqual([
      "conversation_turn_started",
      "conversation_turn_classified",
      "conversation_turn_brief_ready",
      "conversation_turn_completed",
      "conversation_turn_started",
      "conversation_turn_classified",
      "conversation_turn_brief_ready",
      "conversation_turn_completed",
    ]);
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
    expect(
      /^(?:dispatch:|suppressed:low_salience)/.test(String(res.body.route_reason_code ?? "")),
    ).toBe(true);
  }, 20000);
});
