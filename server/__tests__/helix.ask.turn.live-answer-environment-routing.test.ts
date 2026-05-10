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
    expect(actions(response.body)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          panel_id: "scientific-calculator",
          action_id: "start_prime_stream",
          args: expect.objectContaining({
            source_id: "source:calculator-prime-stream",
            wait_for_environment: true,
          }),
        }),
      ]),
    );
    expect(JSON.stringify(response.body)).not.toContain("I could not map that workspace command");
  }, 60000);

  it("does not let an active prime stream hijack unrelated concept questions", async () => {
    process.env.HELIX_E11_MODEL_DECISION_LLM = "0";
    process.env.HELIX_E14_OBSERVATION_MODEL_DECISION = "0";
    vi.resetModules();
    const { app } = await createApp();
    await request(app)
      .post("/api/agi/situation/live-answer-environment/create")
      .send({
        thread_id: "helix-ask:desktop",
        objective: "Set up a live prime number generator and show the next primes as they are found.",
        preset: "calculator_prime_stream",
        source_ids: ["source:calculator-prime-stream"],
        source_config: {
          generator: "next_prime",
          start: 2,
          tick_rate_ms: 1000,
          max_ticks: 100,
          primality_check: "trial_division",
        },
      })
      .expect(200);

    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "What is a neutron star glitch?",
        mode: "read",
        debug: true,
        sessionId: "helix-ask:desktop",
      })
      .expect(200);

    expect(response.body?.live_environment_turn_relevance).toMatchObject({
      relevance: "background_only",
      artifact_synthesis_allowed: false,
    });
    expect(response.body?.final_answer_source).not.toBe("artifact_synthesis");
    expect(String(response.body?.answer ?? response.body?.text ?? "")).not.toContain("Current candidate");
  }, 60000);

  it("allows explicit prime stream state questions to synthesize from the live environment", async () => {
    process.env.HELIX_E11_MODEL_DECISION_LLM = "0";
    process.env.HELIX_E14_OBSERVATION_MODEL_DECISION = "0";
    vi.resetModules();
    const { app } = await createApp();
    const createResponse = await request(app)
      .post("/api/agi/situation/live-answer-environment/create")
      .send({
        thread_id: "helix-ask:desktop",
        objective: "Set up a live prime number generator and show the next primes as they are found.",
        preset: "calculator_prime_stream",
        source_ids: ["source:calculator-prime-stream"],
      })
      .expect(200);
    const environmentId =
      createResponse.body?.live_answer_environment?.environment_id ??
      createResponse.body?.environment?.environment_id ??
      createResponse.body?.environment_id;
    await request(app)
      .post("/api/agi/situation/live-source/event")
      .send({
        source_id: "source:calculator-prime-stream",
        environment_id: environmentId,
        kind: "calculator_series",
        event_type: "prime_found",
        seq: 6,
        payload: {
          candidate: 7,
          is_prime: true,
          latest_prime: 7,
          prime_count: 4,
          gap: 2,
          next_candidate: 8,
          algorithm: "trial_division",
        },
        evidence_refs: ["calculator:prime:7"],
      })
      .expect(200);

    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "What prime are we on?",
        mode: "read",
        debug: true,
        sessionId: "helix-ask:desktop",
      })
      .expect(200);

    expect(response.body?.live_environment_turn_relevance).toMatchObject({
      artifact_synthesis_allowed: true,
    });
    expect(response.body?.final_answer_source).toBe("artifact_synthesis");
    expect(String(response.body?.answer ?? response.body?.text ?? "")).toContain("Current candidate");
    expect(String(response.body?.answer ?? response.body?.text ?? "")).toContain("Latest prime: 7");
  }, 60000);
});
