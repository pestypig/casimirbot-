import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { planRouter } from "../routes/agi.plan";
import { HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG } from "../services/helix-ask/golden-path-runtime";
import { resetHelixAskTurnAdmissionForTests } from "../services/helix-ask/ask-turn-admission";
import { resetRuntimeMemoryGovernorForTests } from "../services/runtime/runtime-memory-governor";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use("/api/agi", planRouter);
  return app;
};

const resetRuntimeState = (): void => {
  resetHelixAskTurnAdmissionForTests();
  resetRuntimeMemoryGovernorForTests({
    memoryReader: () => ({
      rss: 300 * 1024 * 1024,
      heapTotal: 180 * 1024 * 1024,
      heapUsed: 120 * 1024 * 1024,
      external: 8 * 1024 * 1024,
      arrayBuffers: 4 * 1024 * 1024,
    }),
  });
};

describe("Helix Ask golden path /ask/turn route gate", () => {
  afterEach(() => {
    delete process.env[HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG];
    resetRuntimeState();
  });

  it("routes /ask/turn into the golden path only when the flag and explicit request are present", async () => {
    resetRuntimeState();
    process.env[HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG] = "1";

    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        turn_id: "ask:golden:route-gate-enabled",
        session_id: "session-golden-route-gate",
        prompt: "helix_ask_golden_path_runtime route gate activation check",
        goldenPathRuntime: true,
        debug: true,
      })
      .expect(200);

    expect(response.body).toMatchObject({
      turn_id: "ask:golden:route-gate-enabled",
      response_type: "final_answer",
      final_status: "final_answer",
      final_answer_source: "helix_ask_golden_path_runtime",
      terminal_artifact_kind: "golden_path_contract_answer",
      terminal_error_code: null,
      golden_path_runtime: {
        status: "contract_only",
        flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
        legacy_route_bypassed: true,
        private_runtime_loop_entered: false,
        route_gate: "enabled_explicit_request",
      },
      terminal_answer_authority: {
        server_authoritative: true,
        terminal_artifact_kind: "golden_path_contract_answer",
        final_answer_source: "helix_ask_golden_path_runtime",
      },
      terminal_authority_single_writer: {
        selected_terminal_artifact_kind: "golden_path_contract_answer",
        source: "helix_ask_golden_path_runtime",
      },
    });
    expect(response.body.answer).toBe(response.body.selected_final_answer);
    expect(response.body.terminal_authority_single_writer.visible_text).toBe(response.body.selected_final_answer);
    expect(Array.isArray(response.body.terminal_results) ? response.body.terminal_results : []).toHaveLength(1);
    expect((response.body.current_turn_artifact_ledger ?? []).map((artifact: any) => artifact?.kind)).toEqual([
      "golden_path_route_gate",
      "golden_path_contract_answer",
    ]);
  });

  it("leaves /ask/turn on the legacy path when the flag is disabled", async () => {
    resetRuntimeState();
    delete process.env[HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG];

    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        turn_id: "ask:golden:route-gate-disabled",
        session_id: "session-golden-route-gate-disabled",
        question: "helix_ask_golden_path_runtime disabled route-gate fallback check.",
        goldenPathRuntime: true,
        debug: true,
      })
      .expect(200);

    expect(response.body.golden_path_runtime).toBeUndefined();
    expect(response.body.terminal_artifact_kind).not.toBe("golden_path_contract_answer");
    expect(response.body.final_answer_source).not.toBe("helix_ask_golden_path_runtime");
  }, 60_000);
});
