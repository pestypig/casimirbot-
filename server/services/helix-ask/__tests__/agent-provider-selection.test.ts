import { afterEach, describe, expect, it } from "vitest";
import { listHelixAgentProviders, resolveHelixAgentProvider } from "../agent-providers/registry";
import { selectHelixAgentRuntime } from "../agent-providers/runtime-select";
import { buildHelixAgentRuntimeSelectionTrace } from "../agent-providers/runtime-debug";
import {
  buildCodexProviderReasoningReentry,
  codexProvider,
  runExplicitCodexWorkstationGatewayCalls,
} from "../agent-providers/codex-provider";
import { listWorkstationGatewayCapabilities } from "../workstation-tool-gateway/registry";

const ENV_KEYS = [
  "HELIX_ASK_AGENT_RUNTIME",
  "ENABLE_CODEX_AGENT",
  "CODEX_AGENT_FAKE_STDOUT",
  "CODEX_AGENT_FAKE_STDERR",
  "CODEX_AGENT_FAKE_EXIT_CODE",
] as const;
const originalEnv = new Map<string, string | undefined>();

for (const key of ENV_KEYS) {
  originalEnv.set(key, process.env[key]);
}

afterEach(() => {
  for (const key of ENV_KEYS) {
    const original = originalEnv.get(key);
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  }
});

describe("Helix Ask agent provider selection", () => {
  it("defaults to the native Helix runtime", () => {
    delete process.env.HELIX_ASK_AGENT_RUNTIME;

    expect(selectHelixAgentRuntime({ body: {} })).toBe("helix");
    expect(resolveHelixAgentProvider({ body: {} }).id).toBe("helix");
  });

  it("prefers body runtime over header and env runtime", () => {
    process.env.HELIX_ASK_AGENT_RUNTIME = "helix";

    expect(
      selectHelixAgentRuntime({
        body: { agent_runtime: "codex" },
        headers: { "x-helix-agent-runtime": "helix" },
      }),
    ).toBe("codex");
  });

  it("uses the runtime header when the body does not select one", () => {
    expect(
      selectHelixAgentRuntime({
        body: {},
        headers: { "x-helix-agent-runtime": "codex" },
      }),
    ).toBe("codex");
  });

  it("falls back to Helix for unknown runtimes", () => {
    process.env.HELIX_ASK_AGENT_RUNTIME = "future-runtime";

    expect(selectHelixAgentRuntime({ body: { agent_runtime: "unknown" } })).toBe("helix");
    expect(resolveHelixAgentProvider({ body: { agent_runtime: "unknown" } }).id).toBe("helix");
  });

  it("falls back to Helix when Codex is requested but disabled", () => {
    delete process.env.ENABLE_CODEX_AGENT;

    expect(resolveHelixAgentProvider({ body: { agent_runtime: "codex" } }).id).toBe("helix");
  });

  it("selects Codex when requested and enabled", () => {
    process.env.ENABLE_CODEX_AGENT = "1";

    const provider = resolveHelixAgentProvider({ body: { agentRuntime: "codex" } });

    expect(provider.id).toBe("codex");
    expect(provider.supports).toEqual({
      streaming: false,
      workstationTools: true,
      codeMutation: false,
    });
    expect(provider.permissionProfile).toMatchObject({
      id: "read-observe",
      allows: {
        observe: true,
        read: true,
        act: false,
        write: false,
        shell: false,
        codeMutation: false,
      },
    });
  });

  it("lists Helix as enabled and Codex as disabled by default", () => {
    delete process.env.ENABLE_CODEX_AGENT;

    const providers = listHelixAgentProviders();

    expect(providers).toContainEqual(
      expect.objectContaining({
        id: "helix",
        enabled: true,
        experimental: false,
        permission_profile: expect.objectContaining({
          id: "helix-native",
        }),
      }),
    );
    expect(providers).toContainEqual(
      expect.objectContaining({
        id: "codex",
        enabled: false,
        experimental: true,
        permission_profile: expect.objectContaining({
          id: "read-observe",
          allows: expect.objectContaining({
            read: true,
            write: false,
            shell: false,
            codeMutation: false,
          }),
        }),
      }),
    );
  });

  it("builds provider runtime traces with the shared gateway manifest", () => {
    process.env.ENABLE_CODEX_AGENT = "1";
    const provider = resolveHelixAgentProvider({ body: { agent_runtime: "codex" } });
    const manifest = listWorkstationGatewayCapabilities({
      agentRuntime: provider.id,
      mode: "observe",
    });

    const trace = buildHelixAgentRuntimeSelectionTrace({
      route: "/ask/turn",
      requestedRuntime: "codex",
      provider,
      gatewayManifest: manifest,
    });

    expect(trace).toMatchObject({
      schema: "helix.agent_runtime_selection_trace.v1",
      route: "/ask/turn",
      requested_runtime: "codex",
      selected_runtime: "codex",
      fallback_used: false,
      provider_enabled: true,
      selected_agent_provider: {
        id: "codex",
        permission_profile: {
          id: "read-observe",
          allows: {
            read: true,
            write: false,
            shell: false,
            codeMutation: false,
          },
        },
      },
      workstation_gateway: {
        manifest_schema: "helix.workstation_tool_gateway.v1",
        manifest_version: "read-observe.v1",
        tools_enabled_for_provider: true,
        code_mutation_enabled: false,
        shell_enabled: false,
        file_mutation_enabled: false,
        gateway_contract: "read_observe_only",
      },
      evidence_reentry_status: "not_run_text_mode_adapter",
      terminal_authority_status: "not_evaluated_provider_text_mode",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(trace.workstation_gateway.capability_ids).toContain("workspace_os.status");
    expect(trace.workstation_gateway.capability_ids).toContain("docs.search");
  });

  it("returns Codex missing-question failures with provider and gateway debug metadata", async () => {
    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {},
    });

    expect(result).toMatchObject({
      ok: false,
      runtime: "codex",
      response_type: "final_failure",
      final_status: "final_failure",
      debug: {
        agent_runtime: "codex",
        fail_reason: "missing_question",
        agent_runtime_selection_trace: {
          schema: "helix.agent_runtime_selection_trace.v1",
          selected_runtime: "codex",
          workstation_gateway: {
            manifest_version: "read-observe.v1",
            shell_enabled: false,
            file_mutation_enabled: false,
            code_mutation_enabled: false,
          },
          evidence_reentry_status: "not_run_text_mode_adapter",
          terminal_authority_status: "not_evaluated_provider_text_mode",
        },
        workstation_gateway_manifest: {
          schema: "helix.workstation_tool_gateway.v1",
          manifest_version: "read-observe.v1",
        },
        workstation_gateway_reentry_status: "not_run_text_mode_adapter",
        terminal_authority_status: "not_evaluated_provider_text_mode",
      },
    });
  });

  it("runs only explicit Codex workstation gateway call requests through shared admission", async () => {
    const results = await runExplicitCodexWorkstationGatewayCalls({
      body: {
        turn_id: "ask:test:codex-explicit-gateway",
        workstation_gateway_call: {
          capability_id: "scientific-calculator.solve_expression",
          arguments: {
            expression: "6 * 7",
          },
        },
      },
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: "scientific-calculator.solve_expression",
      gateway_admission: {
        selected_agent_provider: "codex",
        admission_status: "admitted",
      },
      observation_packet: {
        schema: "helix.agent_step_observation_packet.v1",
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.calculator_solve_observation.v1",
        result: "42",
      },
      tool_lifecycle_trace: {
        schema: "helix.tool_lifecycle_trace.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      tool_followup_decision: {
        schema: "helix.tool_followup_decision.v1",
        next_action: "continue_reasoning",
        evidence_reentered: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("records Codex provider text as a non-authoritative terminal candidate after gateway observations", async () => {
    const gatewayResults = await runExplicitCodexWorkstationGatewayCalls({
      body: {
        turn_id: "ask:test:codex-provider-candidate",
        workstation_gateway_call: {
          capability_id: "scientific-calculator.solve_expression",
          arguments: {
            expression: "5 * 9",
          },
        },
      },
    });

    const trace = buildCodexProviderReasoningReentry({
      turnId: "ask:test:codex-provider-candidate",
      gatewayCallResults: gatewayResults,
      providerText: "The calculator observation reports 45.",
      ok: true,
    });

    expect(trace).toMatchObject({
      providerTerminalCandidate: {
        schema: "helix.agent_provider_terminal_candidate.v1",
        turn_id: "ask:test:codex-provider-candidate",
        agent_runtime: "codex",
        selected_agent_provider: "codex",
        source: "codex_text_mode_adapter",
        candidate_text_length: 38,
        grounded_in_observation_refs: expect.arrayContaining([
          expect.stringContaining("scientific-calculator.solve_expression"),
        ]),
        evidence_reentry_required: true,
        provider_reasoning_completed: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
      providerReasoningReentry: {
        schema: "helix.provider_reasoning_reentry.v1",
        status: "completed",
        provider_terminal_candidate_present: true,
        post_tool_model_step_required: false,
        evidence_reentered: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
      terminalAuthorityCandidateReview: {
        schema: "helix.provider_terminal_authority_candidate_review.v1",
        terminal_authority_status: "pending_helix_terminal_authority",
        terminal_authority_granted: false,
        final_visible_answer_authorized: false,
        blockers: ["helix_terminal_authority_not_run_for_provider_candidate"],
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
      workstationGatewayReentryStatus: "completed",
      terminalAuthorityStatus: "pending_helix_terminal_authority",
    });
    expect(trace.providerTerminalCandidate?.candidate_id).toContain(
      "ask:test:codex-provider-candidate:agent_provider_terminal_candidate:codex:",
    );
  });
});
