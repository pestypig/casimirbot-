import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";

import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
  HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
  HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
  buildHelixAskGoldenPathRuntimePayload,
  runHelixAskGoldenPathRuntime,
} from "../services/helix-ask/golden-path-runtime";

const routePath = "server/routes/agi.plan.ts";
const servicePath = "server/services/helix-ask/golden-path-runtime.ts";

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

  it("handles capability catalog as a single explicit capability", () => {
    process.env[HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG] = "1";

    const decision = runHelixAskGoldenPathRuntime({
      now: new Date("2026-06-28T12:30:00.000Z"),
      body: {
        turn_id: "ask:golden:capability-catalog",
        prompt: "helix_ask_golden_path_runtime use helix_ask.inspect_capability_catalog",
        goldenPathRuntime: true,
        requested_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      },
    });

    expect(decision.handled).toBe(true);
    if (!decision.handled) throw new Error("golden path should handle capability catalog");
    const body = decision.payload;

    expect(body).toMatchObject({
      final_status: "final_answer",
      terminal_artifact_kind: "capability_help_summary",
      final_answer_source: "capability_help_summary",
      terminal_error_code: null,
      capability_registry: {
        capability_key: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      },
      capability_plan: {
        requested_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
        executed_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
        required_observation_kinds: ["capability_registry"],
        required_terminal_kind: "capability_help_summary",
      },
      ask_turn_solver_trace: {
        completed_solver_path: true,
        requested_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
        executed_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
        observed_artifact_kind: "capability_registry",
        terminal_artifact_kind: "capability_help_summary",
      },
    });
    expect(body.selected_final_answer).toContain("Capability catalog inspection completed");
    expect(readLedger(body).map((artifact) => artifact.kind)).toEqual([
      "golden_path_route_gate",
      "capability_registry",
      "capability_help_summary",
    ]);
    expect(terminalLedgerEntries(body)).toHaveLength(1);
  });

  it("handles workspace status as a single explicit capability", () => {
    process.env[HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG] = "1";

    const decision = runHelixAskGoldenPathRuntime({
      now: new Date("2026-06-28T12:32:00.000Z"),
      body: {
        turn_id: "ask:golden:workspace-status",
        prompt: "helix_ask_golden_path_runtime use workspace_os.status",
        goldenPathRuntime: true,
        requested_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
        workspace_os_status: {
          status: "available",
          counts: {
            total: 34,
            available: 18,
            degraded: 1,
            blocked: 3,
            error: 0,
            unknown: 12,
          },
        },
      },
    });

    expect(decision.handled).toBe(true);
    if (!decision.handled) throw new Error("golden path should handle workspace status");
    const body = decision.payload;

    expect(body).toMatchObject({
      final_status: "final_answer",
      terminal_artifact_kind: "workspace_status_answer",
      final_answer_source: "workspace_status_answer",
      terminal_error_code: null,
      workspace_os_status_observation: {
        capability_key: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
        capability_counts: {
          total: 34,
          available: 18,
          degraded: 1,
          blocked: 3,
          error: 0,
          unknown: 12,
        },
      },
      capability_plan: {
        requested_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
        executed_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
        required_observation_kinds: ["workspace_os_status_observation"],
        required_terminal_kind: "workspace_status_answer",
      },
      ask_turn_solver_trace: {
        completed_solver_path: true,
        requested_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
        executed_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
        observed_artifact_kind: "workspace_os_status_observation",
        terminal_artifact_kind: "workspace_status_answer",
      },
    });
    expect(body.selected_final_answer).toContain("Workspace OS status completed");
    expect(body.selected_final_answer).toContain("34 total, 18 available, 1 degraded");
    expect(readLedger(body).map((artifact) => artifact.kind)).toEqual([
      "golden_path_route_gate",
      "workspace_os_status_observation",
      "workspace_status_answer",
    ]);
    expect(terminalLedgerEntries(body)).toHaveLength(1);
  });

  it("handles capability catalog plus workspace status as an ordered compound contract", () => {
    process.env[HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG] = "1";

    const decision = runHelixAskGoldenPathRuntime({
      now: new Date("2026-06-28T12:35:00.000Z"),
      body: {
        turn_id: "ask:golden:catalog-workspace-compound",
        prompt:
          "helix_ask_golden_path_runtime use helix_ask.inspect_capability_catalog and workspace_os.status",
        goldenPathRuntime: true,
        requested_capabilities: [
          HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
          HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
        ],
        workspace_snapshot: {
          activeDocPath: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        },
        workspace_os_status: {
          status: "available",
          counts: {
            total: 34,
            available: 18,
            degraded: 1,
            blocked: 3,
            error: 0,
            unknown: 12,
          },
        },
      },
    });

    expect(decision.handled).toBe(true);
    if (!decision.handled) throw new Error("golden path should handle catalog+workspace compound");
    const body = decision.payload;

    expect(body).toMatchObject({
      final_status: "final_answer",
      terminal_artifact_kind: "compound_evidence_synthesis_answer",
      final_answer_source: "compound_evidence_synthesis_answer",
      terminal_error_code: null,
      capability_registry: {
        capability_key: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      },
      workspace_os_status_observation: {
        capability_key: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
        capability_counts: {
          total: 34,
          available: 18,
          degraded: 1,
          blocked: 3,
          error: 0,
          unknown: 12,
        },
      },
      compound_capability_contract: {
        satisfaction: "satisfied",
        ordered_subgoals: [
          {
            requested_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
            selected_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
            executed_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
            observation_kind: "capability_registry",
            satisfaction: "satisfied",
          },
          {
            requested_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
            selected_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
            executed_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
            observation_kind: "workspace_os_status_observation",
            satisfaction: "satisfied",
          },
        ],
      },
      capability_plan: {
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
        executed_capability: "compound_capability_contract",
        required_observation_kinds: ["capability_registry", "workspace_os_status_observation"],
        required_terminal_kind: "compound_evidence_synthesis_answer",
      },
      ask_turn_solver_trace: {
        completed_solver_path: true,
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
        executed_capability: "compound_capability_contract",
        terminal_artifact_kind: "compound_evidence_synthesis_answer",
        compound_subgoal_count: 2,
      },
    });
    expect(body.selected_final_answer).toContain("Compound capability/workspace synthesis completed");
    expect(body.selected_final_answer).toContain("34 total, 18 available, 1 degraded");
    expect(readLedger(body).map((artifact) => artifact.kind)).toEqual([
      "golden_path_route_gate",
      "capability_registry",
      "workspace_os_status_observation",
      "compound_evidence_synthesis_answer",
    ]);
    expect(terminalLedgerEntries(body)).toHaveLength(1);
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
