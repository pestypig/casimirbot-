import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

const createApp = async (): Promise<{ app: express.Express }> => {
  const agi = await import("../routes/agi.plan");
  const app = express();
  app.use(express.json());
  app.use("/api/agi", agi.planRouter);
  return { app };
};

const actions = (body: any): any[] =>
  Array.isArray(body?.execution_trace) ? body.execution_trace.map((step: any) => step?.action).filter(Boolean) : [];

describe("helix ask live answer environment routing", () => {
  afterEach(() => {
    delete process.env.HELIX_E11_MODEL_DECISION_LLM;
    delete process.env.HELIX_E14_OBSERVATION_MODEL_DECISION;
    vi.resetModules();
  });

  it("routes prompt-defined live monitor requests to the Situation Room tool", async () => {
    process.env.HELIX_E11_MODEL_DECISION_LLM = "0";
    process.env.HELIX_E14_OBSERVATION_MODEL_DECISION = "0";
    vi.resetModules();
    const { app } = await createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Watch my Minecraft run and tell me about danger or progress.",
        mode: "read",
        debug: true,
        sessionId: `live-answer-routing-${Date.now()}`,
        workspace_context_snapshot: {
          activePanel: "situation-room-pipelines",
          hasSituationRoomContext: true,
        },
      })
      .expect(200);

    const action = actions(response.body).find(
      (entry) =>
        entry?.panel_id === "situation-room-pipelines" &&
        entry?.action_id === "create_live_answer_environment",
    );
    expect(action).toBeTruthy();
    expect(action?.args).toMatchObject({
      thread_id: "helix-ask:desktop",
      preset: "minecraft_run_monitor",
      room_id: "room:minecraft-minehut",
      source_ids: ["source:minecraft-server"],
    });
    expect(JSON.stringify(response.body)).not.toContain("I could not map that workspace command");
  }, 60000);

  it("routes live prime generator prompts to the calculator stream preset", async () => {
    process.env.HELIX_E11_MODEL_DECISION_LLM = "0";
    process.env.HELIX_E14_OBSERVATION_MODEL_DECISION = "0";
    vi.resetModules();
    const { app } = await createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Set up a live prime number generator and show the next primes as they are found.",
        mode: "read",
        debug: true,
        sessionId: `live-prime-routing-${Date.now()}`,
        workspace_context_snapshot: {
          activePanel: "scientific-calculator",
        },
      })
      .expect(200);

    const action = actions(response.body).find(
      (entry) =>
        entry?.panel_id === "situation-room-pipelines" &&
        entry?.action_id === "create_live_answer_environment",
    );
    expect(action).toBeTruthy();
    expect(action?.args).toMatchObject({
      thread_id: "helix-ask:desktop",
      preset: "calculator_prime_stream",
      source_ids: ["source:calculator-prime-stream"],
      source_config: expect.objectContaining({
        generator: "next_prime",
        primality_check: "trial_division",
      }),
    });
    expect(JSON.stringify(response.body)).not.toContain("I could not map that workspace command");
  }, 60000);
});
