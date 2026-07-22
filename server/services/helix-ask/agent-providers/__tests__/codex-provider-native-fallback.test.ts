import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const nativeBridgeMock = vi.hoisted(() => ({
  run: vi.fn(),
}));

vi.mock("../codex-native/provider-bridge", () => ({
  resolveCodexNativeProviderBridgeAvailability: () => ({
    enabled: true,
    available: true,
    unavailableReason: null,
  }),
  runCodexNativeProviderBridge: nativeBridgeMock.run,
}));

import { codexProvider, runCodexProcess } from "../codex-provider";
import { callWorkstationGatewayCapability } from "../../workstation-tool-gateway/registry";

describe("Codex native compatibility fallback", () => {
  beforeEach(() => {
    nativeBridgeMock.run.mockReset();
    nativeBridgeMock.run.mockResolvedValue({
      attempted: true,
      eligible: true,
      fallbackRequired: true,
      fallbackReason: "native_app_server_error",
      result: null,
      gatewayCallResults: [],
      debug: {
        schema: "helix.codex_native_provider_bridge.v1",
        enabled: true,
        eligible: true,
        attempted: true,
        status: "fallback_required",
        native_transport: "codex_app_server",
        compatibility_transport: "codex_exec",
        fallback_required: true,
        fallback_reason: "native_app_server_error",
        model_policy_source: "codex_default",
        effective_model: null,
        effective_reasoning_effort: null,
        trusted_goal_account_binding_required: false,
        allowed_workstation_tools: null,
        native_workstation_turn: null,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    process.env.CODEX_AGENT_FAKE_STDOUT =
      "The compatibility worker received the current workspace status observation.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
  });

  afterEach(() => {
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    delete process.env.HELIX_CODEX_COMPATIBILITY_PROCESS_TEST_ENABLED;
  });

  it("does not launch a live compatibility process from deterministic tests", async () => {
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;

    await expect(runCodexProcess({ prompt: "Do not contact a provider." })).resolves.toMatchObject({
      exitCode: null,
      timedOut: false,
      killed: false,
      failReason: "codex_process_disabled_in_test",
      bin: null,
    });
  });

  it("restores governed gateway evidence before handing a failed native turn to codex exec", async () => {
    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:native-compatibility-gateway-recovery",
        agent_runtime: "codex",
        question: "Check the workspace OS status and report what is available.",
      },
      headers: {},
    });

    expect(result.ok).toBe(true);
    expect(nativeBridgeMock.run).toHaveBeenCalledTimes(1);
    expect(
      (result.debug as Record<string, any>).workstation_gateway_call_results.map(
        (entry: Record<string, unknown>) => entry.capability_id,
      ),
    ).toEqual(["workspace_os.status"]);
    expect((result.debug as Record<string, any>).codex_native_compatibility_fallback).toMatchObject({
      schema: "helix.codex_native_compatibility_fallback.v1",
      activated: true,
      native_attempted: true,
      native_fallback_reason: "native_app_server_error",
      native_unobserved_capability_ids: [],
      gateway_recovery_attempted: true,
      gateway_recovery_result_count: 1,
      gateway_recovery_capability_ids: ["workspace_os.status"],
      compatibility_transport: "codex_exec",
      terminal_eligible: false,
      assistant_answer: false,
    });
  });

  it("recovers admitted observations missing from a partially completed native compound route", async () => {
    const turnId = "ask:test:native-partial-compound-recovery";
    const partialStatusResult = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: "workspace_os.status",
      arguments: {},
      turnId,
      iteration: 1,
      accountType: "user",
    });
    expect(partialStatusResult.ok).toBe(true);
    nativeBridgeMock.run.mockResolvedValueOnce({
      attempted: true,
      eligible: true,
      fallbackRequired: true,
      fallbackReason: "native_route_observation_missing",
      result: {
        ok: false,
        answer: "",
        failReason: "native_route_observation_missing",
        native: null,
        gatewayCallResults: [partialStatusResult],
        debug: {
          route_proposal: null,
          route_unobserved_tools: ["scientific-calculator.solve_expression"],
        },
      },
      gatewayCallResults: [partialStatusResult],
      debug: {
        schema: "helix.codex_native_provider_bridge.v1",
        enabled: true,
        eligible: true,
        attempted: true,
        status: "fallback_required",
        native_transport: "codex_app_server",
        compatibility_transport: "codex_exec",
        fallback_required: true,
        fallback_reason: "native_route_observation_missing",
        model_policy_source: "codex_default",
        effective_model: null,
        effective_reasoning_effort: null,
        trusted_goal_account_binding_required: false,
        allowed_workstation_tools: [
          "workspace_os.status",
          "scientific-calculator.solve_expression",
        ],
        native_workstation_turn: null,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: turnId,
        agent_runtime: "codex",
        question: "Check workspace status and calculate 8*9 from both observations.",
        workstation_gateway_calls: [
          {
            capability_id: "workspace_os.status",
            mode: "read",
            arguments: {},
          },
          {
            capability_id: "scientific-calculator.solve_expression",
            mode: "read",
            arguments: { expression: "8*9" },
          },
        ],
      },
      headers: {},
    });

    expect(result.ok).toBe(true);
    const debug = result.debug as Record<string, any>;
    expect(debug.workstation_gateway_call_results.map(
      (entry: Record<string, unknown>) => entry.capability_id,
    )).toEqual(expect.arrayContaining([
      "workspace_os.status",
      "scientific-calculator.solve_expression",
    ]));
    expect(debug.codex_native_compatibility_fallback).toMatchObject({
      activated: true,
      native_fallback_reason: "native_route_observation_missing",
      native_unobserved_capability_ids: ["scientific-calculator.solve_expression"],
      gateway_recovery_attempted: true,
      gateway_recovery_capability_ids: [
        "workspace_os.status",
        "scientific-calculator.solve_expression",
      ],
    });
  });

  it("recovers a governed observation when the native process succeeds without executing the hard route", async () => {
    nativeBridgeMock.run.mockResolvedValueOnce({
      attempted: true,
      eligible: true,
      fallbackRequired: false,
      fallbackReason: null,
      result: {
        ok: true,
        answer: "The local document is probably the terminal authority contract.",
        failReason: null,
        native: null,
        gatewayCallResults: [],
        debug: {
          route_proposal: null,
          route_unobserved_tools: [],
        },
      },
      gatewayCallResults: [],
      debug: {
        schema: "helix.codex_native_provider_bridge.v1",
        enabled: true,
        eligible: true,
        attempted: true,
        status: "completed",
        native_transport: "codex_app_server",
        compatibility_transport: "codex_exec",
        fallback_required: false,
        fallback_reason: null,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:native-success-missing-doc-observation",
        agent_runtime: "codex",
        question: "Find the local document about Helix Ask terminal authority and tell me which document you used.",
      },
      headers: {},
    });

    expect(result.ok).toBe(true);
    const debug = result.debug as Record<string, any>;
    expect(debug.workstation_gateway_call_results.map(
      (entry: Record<string, unknown>) => entry.capability_id,
    )).toEqual(["docs.search"]);
    expect(debug.codex_native_compatibility_fallback).toMatchObject({
      activated: true,
      native_attempted: true,
      planned_gateway_recovery_capability_ids: ["docs.search"],
      gateway_recovery_attempted: true,
      gateway_recovery_result_count: 1,
      gateway_recovery_capability_ids: ["docs.search"],
    });
    expect(result.text).toBe(process.env.CODEX_AGENT_FAKE_STDOUT);
  });

  it("quarantines a native observation outside the committed source route and recovers the admitted tool", async () => {
    const turnId = "ask:test:native-route-violation-recovery";
    const repoResult = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: "repo.search",
      arguments: { query: "Helix Ask terminal authority" },
      turnId,
      iteration: 1,
      accountType: "user",
    });
    expect(repoResult.ok).toBe(true);
    nativeBridgeMock.run.mockResolvedValueOnce({
      attempted: true,
      eligible: true,
      fallbackRequired: false,
      fallbackReason: null,
      result: {
        ok: true,
        answer: "I used repository search.",
        failReason: null,
        native: null,
        gatewayCallResults: [repoResult],
        debug: {
          route_proposal: null,
          route_unobserved_tools: [],
        },
      },
      gatewayCallResults: [repoResult],
      debug: {
        schema: "helix.codex_native_provider_bridge.v1",
        enabled: true,
        eligible: true,
        attempted: true,
        status: "completed",
        native_transport: "codex_app_server",
        compatibility_transport: "codex_exec",
        fallback_required: false,
        fallback_reason: null,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: turnId,
        agent_runtime: "codex",
        question: "Find the local document about Helix Ask terminal authority and tell me which document you used.",
      },
      headers: {},
    });

    expect(result.ok).toBe(true);
    const debug = result.debug as Record<string, any>;
    expect(debug.workstation_gateway_call_results.map(
      (entry: Record<string, unknown>) => entry.capability_id,
    )).toEqual(["docs.search"]);
    expect(debug.codex_native_compatibility_fallback).toMatchObject({
      activated: true,
      native_fallback_reason: "native_observation_outside_committed_route",
      native_route_violation_capability_ids: ["repo.search"],
      planned_gateway_recovery_capability_ids: ["docs.search"],
      gateway_recovery_attempted: true,
      gateway_recovery_capability_ids: ["docs.search"],
    });
    expect(result.text).toBe(process.env.CODEX_AGENT_FAKE_STDOUT);
  });
});
