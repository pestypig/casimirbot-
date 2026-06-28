import { readFileSync } from "node:fs";
import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { planRouter } from "../routes/agi.plan";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
  buildHelixAskGoldenPathRuntimePayload,
  runHelixAskGoldenPathRuntime,
} from "../services/helix-ask/golden-path-runtime";
import { resetHelixAskTurnAdmissionForTests } from "../services/helix-ask/ask-turn-admission";
import { resetRuntimeMemoryGovernorForTests } from "../services/runtime/runtime-memory-governor";

const routePath = "server/routes/agi.plan.ts";
const servicePath = "server/services/helix-ask/golden-path-runtime.ts";

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

const readLedger = (body: Record<string, any>): any[] =>
  Array.isArray(body.current_turn_artifact_ledger) ? body.current_turn_artifact_ledger : [];

const terminalLedgerEntries = (body: Record<string, any>): any[] =>
  readLedger(body).filter((artifact) => artifact?.kind === body.terminal_artifact_kind);

describe("Helix Ask golden path runtime", () => {
  afterEach(() => {
    delete process.env[HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG];
  });

  it("keeps the golden path runtime service route-free and dependency-owned", () => {
    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).toContain("../services/helix-ask/golden-path-runtime");
    expect(serviceSource).toContain("export type HelixAskGoldenPathRuntimeDependencies");
    expect(serviceSource).toContain("buildHelixGoalSatisfactionEvaluationArtifact");
    expect(serviceSource).toContain("buildStagePlayAskCheckpointReceiptPayload");
    expect(serviceSource).toContain("buildAskTurnCompositeHandoffDecision");
    expect(serviceSource).toContain("buildAskTurnCompositeFollowupAudit");
    expect(serviceSource).not.toContain("server/routes/agi.plan");
    expect(serviceSource).not.toContain("../routes/agi.plan");
    expect(serviceSource).not.toContain("../../routes/agi.plan");
  });

  it("declines when the flag is disabled or the request is not explicit", () => {
    expect(
      runHelixAskGoldenPathRuntime({
        env: {},
        body: { goldenPathRuntime: true, prompt: "helix_ask_golden_path_runtime" },
      }),
    ).toEqual({ handled: false, reason: "flag_disabled" });

    expect(
      runHelixAskGoldenPathRuntime({
        env: { [HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG]: "1" },
        body: { prompt: "ordinary prompt" },
      }),
    ).toEqual({ handled: false, reason: "not_requested" });
  });

  it("builds a contract-only terminal payload without entering the private loop", () => {
    const payload = buildHelixAskGoldenPathRuntimePayload({
      now: new Date("2026-06-28T12:00:00.000Z"),
      body: {
        turn_id: "ask:golden:test",
        trace_id: "trace:golden:test",
        session_id: "session-1",
        prompt: "helix_ask_golden_path_runtime contract check",
      },
    });

    expect(payload).toMatchObject({
      schema: "helix.ask_golden_path_runtime.v1",
      turn_id: "ask:golden:test",
      trace_id: "trace:golden:test",
      session_id: "session-1",
      response_type: "final_answer",
      final_status: "final_answer",
      final_answer_source: "helix_ask_golden_path_runtime",
      terminal_artifact_kind: "golden_path_contract_answer",
      terminal_error_code: null,
      ask_turn_solver_trace: {
        completed_solver_path: true,
        private_runtime_loop_entered: false,
      },
      golden_path_runtime: {
        status: "contract_only",
        legacy_route_bypassed: true,
        private_runtime_loop_entered: false,
      },
      terminal_answer_authority: {
        server_authoritative: true,
        final_answer_source: "helix_ask_golden_path_runtime",
        terminal_artifact_kind: "golden_path_contract_answer",
      },
    });
    expect(readLedger(payload).map((artifact) => artifact.kind)).toEqual([
      "golden_path_route_gate",
      "golden_path_contract_answer",
    ]);
    const payloadTerminalEntries = terminalLedgerEntries(payload);
    expect(payloadTerminalEntries).toEqual([
      expect.objectContaining({
        kind: "golden_path_contract_answer",
      }),
    ]);
    expect(payloadTerminalEntries[0]?.payload?.text ?? payloadTerminalEntries[0]?.text).toBe(payload.selected_final_answer);
    expect(payload.assistant_answer).toBe(payload.selected_final_answer);
  });

  it("handles an enabled explicit request through the service contract", () => {
    process.env[HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG] = "1";

    const decision = runHelixAskGoldenPathRuntime({
      body: {
        turn_id: "ask:golden:api",
        session_id: "session-golden",
        prompt: "helix_ask_golden_path_runtime contract check",
        goldenPathRuntime: true,
        debug: true,
      },
    });

    expect(decision.handled).toBe(true);
    if (!decision.handled) throw new Error("golden path should have handled the explicit request");
    const body = decision.payload;

    expect(body).toMatchObject({
      turn_id: "ask:golden:api",
      final_status: "final_answer",
      terminal_artifact_kind: "golden_path_contract_answer",
      final_answer_source: "helix_ask_golden_path_runtime",
      terminal_error_code: null,
      terminal_answer_authority: {
        server_authoritative: true,
        terminal_artifact_kind: "golden_path_contract_answer",
        final_answer_source: "helix_ask_golden_path_runtime",
      },
    });
    expect(body.golden_path_runtime).toMatchObject({
      status: "contract_only",
      legacy_route_bypassed: true,
      private_runtime_loop_entered: false,
    });
    expect(body.selected_final_answer).toBeTruthy();
    expect(body.answer).toBe(body.selected_final_answer);
    expect((body.terminal_authority_single_writer as any).visible_text).toBe(body.selected_final_answer);
    expect((body.terminal_answer_authority as any).final_answer_source).toBe(body.final_answer_source);
    expect(readLedger(body).length).toBeGreaterThanOrEqual(2);
    const responseTerminalEntries = terminalLedgerEntries(body);
    expect(responseTerminalEntries).toEqual([
      expect.objectContaining({
        kind: "golden_path_contract_answer",
      }),
    ]);
    expect(responseTerminalEntries[0]?.payload?.text ?? responseTerminalEntries[0]?.text).toBe(
      body.selected_final_answer,
    );
    expect(Array.isArray(body.terminal_results) ? body.terminal_results : []).toHaveLength(1);
    expect(body.answer).toContain("contract-only");
  });

  it("wires the route through a thin hook without importing the route from the service", () => {
    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).toContain('from "../services/helix-ask/golden-path-runtime"');
    expect(routeSource).toContain("runHelixAskGoldenPathRuntime({ body })");
    expect(routeSource).toContain("if (goldenPathRuntimeDecision.handled)");
    expect(routeSource).toContain('source: "helix_ask_golden_path_runtime"');
    expect(serviceSource).not.toContain("server/routes/agi.plan");
    expect(serviceSource).not.toContain("../routes/agi.plan");
  });
});
