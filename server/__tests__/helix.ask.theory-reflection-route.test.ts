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

describe("Helix Ask theory reflection route", () => {
  it("routes reflection-only theory graph prompts through non-terminal reflection receipts", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Where does E=hf fit in the theory graph?",
        mode: "read",
        debug: true,
        sessionId: `theory-reflection-route-${Date.now()}`,
      })
      .expect(200);

    const body = response.body;
    const answer = String(body?.selected_final_answer ?? body?.answer ?? body?.text ?? "");
    const actions = body?.action_envelope?.workstation_actions ?? [];

    expect(body?.route_reason_code).toBe("theory_context_reflection");
    expect(body?.final_answer_source).toBe("workstation_tool_evaluation");
    expect(body?.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(body?.workstation_tool_plan?.intent).toBe("theory_context_reflection");
    expect(body?.workstation_tool_evaluation?.supports_goal).toBe(true);
    expect(actions).toEqual([]);
    expect(body?.theory_context_reflection_tool_receipt?.artifactId).toBe(
      "helix_theory_context_reflection_tool_receipt",
    );
    expect(answer).toMatch(/Theory Badge Graph|first-principles explanation route|context evidence/i);
    expect(answer).toMatch(/not as a solve/i);
    expect(answer).not.toMatch(/^E=hf fits into the theory graph as a fundamental equation/i);
  });

  it("routes NHM2/QEI mapping prompts through reflection instead of direct answers", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Map source residual and QEI margin in the theory graph.",
        mode: "read",
        debug: true,
        sessionId: `theory-reflection-qei-route-${Date.now()}`,
      })
      .expect(200);

    const body = response.body;

    expect(body?.route_reason_code).toBe("theory_context_reflection");
    expect(body?.action_envelope?.workstation_actions).toEqual([]);
    expect(body?.theory_context_reflection_tool_receipt?.artifactId).toBe(
      "helix_theory_context_reflection_tool_receipt",
    );
    expect(String(body?.selected_final_answer ?? body?.answer ?? body?.text ?? "")).toMatch(/first-principles explanation route|context evidence/i);
  });

  it("keeps theory reflection in the live route for mapped calculator prompts", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Calculate photon energy for f=5e14 Hz and show where E=hf fits in the theory graph.",
        mode: "read",
        debug: true,
        sessionId: `theory-reflection-calculator-route-${Date.now()}`,
      })
      .expect(200);

    const body = response.body;
    const actions = body?.action_envelope?.workstation_actions ?? [];
    const answer = String(body?.selected_final_answer ?? body?.answer ?? body?.text ?? "");

    expect(body?.route_reason_code).toBe("theory_context_reflection");
    expect(body?.workstation_tool_plan?.intent).toBe("physics_calculation_context");
    expect(actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          panel_id: "scientific-calculator",
          action_id: "open",
        }),
        expect.objectContaining({
          panel_id: "scientific-calculator",
          action_id: "ingest_latex",
        }),
        expect.objectContaining({
          panel_id: "scientific-calculator",
          action_id: "solve_expression",
        }),
      ]),
    );
    expect(answer).toMatch(/Evidence note: theory graph reflection supplied context; Scientific Calculator receipts supplied the numeric result/i);
    const finalDraftText = String(body?.final_answer_draft?.text ?? body?.debug?.final_answer_draft?.text ?? "");
    if (finalDraftText) {
      expect(finalDraftText).toMatch(
        /Evidence note: theory graph reflection supplied context; Scientific Calculator receipts supplied the numeric result/i,
      );
    }
    const calculatorDraftText = String(
      body?.calculator_final_answer_draft?.text ?? body?.debug?.calculator_final_answer_draft?.text ?? "",
    );
    if (calculatorDraftText) {
      expect(calculatorDraftText).toMatch(
        /Evidence note: theory graph reflection supplied context; Scientific Calculator receipts supplied the numeric result/i,
      );
    }
    expect(answer).toMatch(/3\.313035/i);

    const debugResponse = await request(app)
      .get(`/api/agi/ask/turn/${encodeURIComponent(String(body?.turn_id))}/debug-export`)
      .expect(200);
    const debugPayload = debugResponse.body?.payload;
    expect(debugPayload?.tool_trace_disclosure?.action_keys).toEqual(
      expect.arrayContaining([
        "helix_ask.reflect_theory_context",
        "scientific-calculator.solve_expression",
      ]),
    );
    expect(debugPayload?.tool_trace_disclosure?.answerNote).toBe(
      "Evidence note: theory graph reflection supplied context; Scientific Calculator receipts supplied the numeric result.",
    );
  });
});
