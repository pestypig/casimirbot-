import { afterEach, describe, expect, it } from "vitest";
import { listHelixAgentProviders, resolveHelixAgentProvider } from "../agent-providers/registry";
import { selectHelixAgentRuntime } from "../agent-providers/runtime-select";
import { buildHelixAgentRuntimeSelectionTrace } from "../agent-providers/runtime-debug";
import {
  codexProvider,
  runExplicitCodexWorkstationGatewayCalls,
} from "../agent-providers/codex-provider";
import {
  futureProvider,
  runExplicitFutureWorkstationGatewayCalls,
} from "../agent-providers/future-provider";
import {
  buildStructuredAdmissionWorkstationGatewayCallRequests,
  buildPlannerDerivedWorkstationGatewayCallRequests,
  runExplicitWorkstationGatewayCalls,
} from "../agent-providers/explicit-workstation-gateway";
import { buildHelixProviderReasoningReentry } from "../agent-providers/provider-terminal-authority";
import { listWorkstationGatewayCapabilities } from "../workstation-tool-gateway/registry";

const ENV_KEYS = [
  "HELIX_ASK_AGENT_RUNTIME",
  "ENABLE_CODEX_AGENT",
  "ENABLE_FUTURE_AGENT",
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

  it("falls back to Helix when the future provider is requested but disabled", () => {
    delete process.env.ENABLE_FUTURE_AGENT;

    expect(selectHelixAgentRuntime({ body: { agent_runtime: "future" } })).toBe("future");
    expect(resolveHelixAgentProvider({ body: { agent_runtime: "future" } }).id).toBe("helix");
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

  it("selects the future provider wrapper when requested and explicitly enabled", () => {
    process.env.ENABLE_FUTURE_AGENT = "1";

    const provider = resolveHelixAgentProvider({ body: { agentRuntime: "future" } });

    expect(provider.id).toBe("future");
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

  it("lists Helix as enabled and experimental providers as disabled by default", () => {
    delete process.env.ENABLE_CODEX_AGENT;
    delete process.env.ENABLE_FUTURE_AGENT;

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
    expect(providers).toContainEqual(
      expect.objectContaining({
        id: "future",
        label: "Future Agent Wrapper",
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

  it("returns future provider scaffold failures with provider and gateway debug metadata", async () => {
    process.env.ENABLE_FUTURE_AGENT = "1";

    const result = await futureProvider.runTurn({
      runtime: "future",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:future-provider-scaffold",
        question: "Use the future provider wrapper.",
      },
    });

    expect(result).toMatchObject({
      ok: false,
      runtime: "future",
      response_type: "final_failure",
      final_status: "final_failure",
      debug: {
        turn_id: "ask:test:future-provider-scaffold",
        agent_runtime: "future",
        fail_reason: "future_provider_adapter_not_configured",
        agent_runtime_selection_trace: {
          schema: "helix.agent_runtime_selection_trace.v1",
          selected_runtime: "future",
          workstation_gateway: {
            manifest_version: "read-observe.v1",
            shell_enabled: false,
            file_mutation_enabled: false,
            code_mutation_enabled: false,
          },
        },
        selected_agent_provider: {
          id: "future",
          permission_profile: {
            id: "read-observe",
          },
        },
        workstation_gateway_manifest: {
          schema: "helix.workstation_tool_gateway.v1",
          manifest_version: "read-observe.v1",
        },
        workstation_gateway_reentry_status: "pending_provider_reasoning",
        terminal_authority_status: "pending_helix_terminal_authority",
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

  it("runs future provider workstation gateway calls through the same shared admission", async () => {
    const results = await runExplicitFutureWorkstationGatewayCalls({
      body: {
        turn_id: "ask:test:future-explicit-gateway",
        workstation_gateway_call: {
          capability_id: "scientific-calculator.solve_expression",
          arguments: {
            expression: "8 * 8",
          },
        },
      },
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      ok: true,
      agent_runtime: "future",
      capability_id: "scientific-calculator.solve_expression",
      gateway_admission: {
        selected_agent_provider: "future",
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
        result: "64",
      },
      tool_followup_decision: {
        next_action: "continue_reasoning",
        evidence_reentered: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("derives read-only calculator gateway calls only after a runtime is selected", async () => {
    const body = {
      turn_id: "ask:test:planner-derived-gateway",
      question: "Use the scientific calculator to evaluate 6 * 7 and explain the result.",
    };

    expect(buildPlannerDerivedWorkstationGatewayCallRequests(body)).toEqual([
      expect.objectContaining({
        schema: "helix.workstation_gateway.planner_derived_call_request.v1",
        derivation_source: "helix_workstation_tool_planner",
        planner_intent: "calculator_solve",
        capability_id: "scientific-calculator.solve_expression",
        mode: "read",
        arguments: expect.objectContaining({
          expression: "6*7",
          source_target_intent: expect.objectContaining({
            source: "helix_workstation_tool_planner",
            intent: "calculator_solve",
            panel_id: "scientific-calculator",
            action_id: "solve_expression",
          }),
        }),
      }),
    ]);

    await expect(runExplicitWorkstationGatewayCalls({
      body,
      agentRuntime: "codex",
    })).resolves.toEqual([]);

    const selectedRuntimeResults = await runExplicitWorkstationGatewayCalls({
      body: {
        ...body,
        agent_runtime: "codex",
      },
      agentRuntime: "codex",
    });

    expect(selectedRuntimeResults).toHaveLength(1);
    expect(selectedRuntimeResults[0]).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: "scientific-calculator.solve_expression",
      gateway_admission: {
        selected_agent_provider: "codex",
        permission_profile: "read",
        admission_status: "admitted",
      },
      observation: {
        schema: "helix.calculator_solve_observation.v1",
        expression: "6*7",
        result: "42",
      },
      observation_packet: {
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("derives repo and docs gateway calls from structured source-target admission records", async () => {
    const repoBody = {
      turn_id: "ask:test:structured-repo-gateway",
      question: "Where is workspace_os.status implemented?",
      source_target_intent: {
        schema: "helix.ask_source_target_intent.v1",
        source_target: "repo_code",
        target_source: "repo_code",
        selected_capability: "repo-code.search_concept",
        args: {
          query: "workspace_os.status",
          paths: ["server/services/helix-ask"],
        },
      },
    };
    const docsBody = {
      turn_id: "ask:test:structured-docs-gateway",
      question: "Locate the Helix Ask Codex loop discipline doc.",
      route_metadata: {
        schema: "helix.ask.route_metadata.v1",
        source_target: "docs_viewer",
        source_target_intent: {
          schema: "helix.ask_source_target_intent.v1",
          source_target: "docs_viewer",
          target_source: "docs_viewer",
          mandatory_next_tool: {
            tool_name: "docs-viewer.locate_in_doc",
            selected_capability: "docs-viewer.locate_in_doc",
            args: {
              query: "Helix Ask / Codex Loop Discipline",
              paths: ["docs/helix-ask-codex-loop-discipline.md"],
            },
          },
        },
      },
    };

    expect(buildStructuredAdmissionWorkstationGatewayCallRequests(repoBody)).toEqual([
      expect.objectContaining({
        schema: "helix.workstation_gateway.structured_admission_call_request.v1",
        derivation_source: "helix_structured_source_target_admission",
        capability_id: "repo.search",
        mode: "read",
        arguments: expect.objectContaining({
          query: "workspace_os.status",
          paths: ["server/services/helix-ask"],
          source_target_intent: expect.objectContaining({
            source: "helix_structured_source_target_admission",
            selected_capability: "repo-code.search_concept",
          }),
        }),
      }),
    ]);
    expect(buildStructuredAdmissionWorkstationGatewayCallRequests(docsBody)).toEqual([
      expect.objectContaining({
        schema: "helix.workstation_gateway.structured_admission_call_request.v1",
        derivation_source: "helix_structured_source_target_admission",
        capability_id: "docs.search",
        mode: "read",
        arguments: expect.objectContaining({
          query: "Helix Ask / Codex Loop Discipline",
          paths: ["docs/helix-ask-codex-loop-discipline.md"],
          source_target_intent: expect.objectContaining({
            source: "helix_structured_source_target_admission",
            selected_capability: "docs-viewer.locate_in_doc",
          }),
        }),
      }),
    ]);

    const repoResults = await runExplicitWorkstationGatewayCalls({
      body: {
        ...repoBody,
        agent_runtime: "helix",
      },
      agentRuntime: "helix",
    });
    const docsResults = await runExplicitWorkstationGatewayCalls({
      body: {
        ...docsBody,
        agent_runtime: "codex",
      },
      agentRuntime: "codex",
    });

    expect(repoResults[0]).toMatchObject({
      ok: true,
      agent_runtime: "helix",
      capability_id: "repo.search",
      gateway_admission: {
        selected_agent_provider: "helix",
        permission_profile: "read",
        admission_status: "admitted",
      },
      observation: {
        schema: "helix.repo_search_observation.v1",
        query: "workspace_os.status",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(docsResults[0]).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: "docs.search",
      gateway_admission: {
        selected_agent_provider: "codex",
        permission_profile: "read",
        admission_status: "admitted",
      },
      observation: {
        schema: "helix.docs_search_observation.v1",
        query: "Helix Ask / Codex Loop Discipline",
        terminal_eligible: false,
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

    const trace = buildHelixProviderReasoningReentry({
      runtime: "codex",
      providerLabel: "Codex Workstation Mode",
      turnId: "ask:test:codex-provider-candidate",
      threadId: "thread:test",
      route: "/ask/turn",
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
        source: "agent_provider_text_mode_adapter",
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
        terminal_authority_status: "authorized_by_helix_provider_candidate_bridge",
        terminal_authority_granted: true,
        final_visible_answer_authorized: true,
        blockers: [],
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
      providerTerminalAuthorityBridge: {
        schema: "helix.provider_terminal_authority_bridge.v1",
        route_authority_status: "provider_gateway_read_observe_contract_satisfied",
        terminal_authority_status: "authorized_by_helix_provider_candidate_bridge",
        terminal_authority_granted: true,
        final_visible_answer_authorized: true,
        final_answer_source: "agent_provider_terminal_candidate",
        terminal_artifact_kind: "agent_provider_terminal_candidate",
      },
      terminalAnswerAuthority: {
        schema: "helix.turn_terminal_authority.v1",
        thread_id: "thread:test",
        turn_id: "ask:test:codex-provider-candidate",
        route: "/ask/turn",
        terminal_kind: "answer",
        final_answer_source: "agent_provider_terminal_candidate",
        terminal_artifact_kind: "agent_provider_terminal_candidate",
        server_authoritative: true,
        terminal_eligible: true,
        assistant_answer: false,
      },
      terminalPresentation: {
        schema: "helix.terminal_presentation.v1",
        concise_text: "The calculator observation reports 45.",
        final_answer_source: "agent_provider_terminal_candidate",
        terminal_artifact_kind: "agent_provider_terminal_candidate",
        assistant_answer: false,
        raw_content_included: false,
      },
      workstationGatewayReentryStatus: "completed",
      terminalAuthorityStatus: "authorized_by_helix_provider_candidate_bridge",
    });
    expect(trace.providerTerminalCandidate?.candidate_id).toContain(
      "ask:test:codex-provider-candidate:agent_provider_terminal_candidate:codex:",
    );
  });

  it("blocks terminal authority for provider candidates when the gateway observation failed", async () => {
    const gatewayResults = await runExplicitCodexWorkstationGatewayCalls({
      body: {
        turn_id: "ask:test:codex-provider-blocked-candidate",
        workstation_gateway_call: {
          capability_id: "filesystem.write_file",
          arguments: {
            path: "server/routes/agi.plan.ts",
            text: "blocked",
          },
        },
      },
    });

    const trace = buildHelixProviderReasoningReentry({
      runtime: "codex",
      providerLabel: "Codex Workstation Mode",
      turnId: "ask:test:codex-provider-blocked-candidate",
      threadId: "thread:test",
      route: "/ask/turn",
      gatewayCallResults: gatewayResults,
      providerText: "The requested write capability was blocked.",
      ok: true,
    });

    expect(trace).toMatchObject({
      providerTerminalCandidate: {
        schema: "helix.agent_provider_terminal_candidate.v1",
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
      terminalAuthorityCandidateReview: {
        schema: "helix.provider_terminal_authority_candidate_review.v1",
        terminal_authority_status: "blocked_by_gateway_observation_state",
        terminal_authority_granted: false,
        final_visible_answer_authorized: false,
        blockers: ["gateway_observation_missing_or_failed"],
      },
      providerTerminalAuthorityBridge: {
        schema: "helix.provider_terminal_authority_bridge.v1",
        route_authority_status: "not_authorized",
        terminal_authority_status: "blocked_by_gateway_observation_state",
        terminal_authority_granted: false,
        final_visible_answer_authorized: false,
        final_answer_source: null,
        terminal_artifact_kind: null,
        terminal_answer_authority: null,
        terminal_presentation: null,
      },
      terminalAnswerAuthority: null,
      terminalPresentation: null,
      terminalAuthorityStatus: "blocked_by_gateway_observation_state",
    });
    expect(gatewayResults[0]).toMatchObject({
      ok: false,
      error: "capability_not_registered",
      gateway_admission: {
        admission_status: "blocked",
        blocked_reason: "capability_not_registered",
      },
    });
  });
});
