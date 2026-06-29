import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { listHelixAgentProviders, resolveHelixAgentProvider } from "../agent-providers/registry";
import { selectHelixAgentRuntime } from "../agent-providers/runtime-select";
import { buildHelixAgentRuntimeSelectionTrace } from "../agent-providers/runtime-debug";
import {
  codexProvider,
  readCodexArgs,
  resolveCodexBinary,
  runCodexProcess,
  runExplicitCodexWorkstationGatewayCalls,
} from "../agent-providers/codex-provider";
import {
  futureProvider,
  runExplicitFutureWorkstationGatewayCalls,
} from "../agent-providers/future-provider";
import {
  buildActiveCalculatorContextWorkstationGatewayCallRequests,
  buildActiveDocsContextWorkstationGatewayCallRequests,
  buildActiveWorkstationContextGatewayCallRequests,
  buildStructuredAdmissionWorkstationGatewayCallRequests,
  buildPlannerDerivedWorkstationGatewayCallRequests,
  runExplicitWorkstationGatewayCalls,
} from "../agent-providers/explicit-workstation-gateway";
import { buildHelixProviderReasoningReentry } from "../agent-providers/provider-terminal-authority";
import {
  listWorkstationGatewayCapabilities,
  normalizeDocsObservationExcerptText,
} from "../workstation-tool-gateway/registry";

const ENV_KEYS = [
  "HELIX_ASK_AGENT_RUNTIME",
  "ENABLE_CODEX_AGENT",
  "ENABLE_FUTURE_AGENT",
  "CODEX_BIN",
  "CODEX_ARGS",
  "CODEX_AGENT_TIMEOUT_MS",
  "CODEX_APPX_INSTALL_LOCATION",
  "CODEX_DISABLE_LOCAL_PACKAGE_BIN",
  "CODEX_WINDOWS_APPS_DIR",
  "PATH",
  "Path",
  "PATHEXT",
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
    process.env.ENABLE_CODEX_AGENT = "0";

    expect(resolveHelixAgentProvider({ body: { agent_runtime: "codex" } }).id).toBe("helix");
  });

  it("falls back to Helix when the future provider is requested but disabled", () => {
    delete process.env.ENABLE_FUTURE_AGENT;

    expect(selectHelixAgentRuntime({ body: { agent_runtime: "future" } })).toBe("future");
    expect(resolveHelixAgentProvider({ body: { agent_runtime: "future" } }).id).toBe("helix");
  });

  it("selects Codex when requested by default", () => {
    delete process.env.ENABLE_CODEX_AGENT;

    const provider = resolveHelixAgentProvider({ body: { agentRuntime: "codex" } });

    expect(provider.id).toBe("codex");
    expect(provider.supports).toEqual({
      streaming: false,
      workstationTools: true,
      codeMutation: false,
    });
    expect(provider.permissionProfile).toMatchObject({
      id: "read-observe-act",
      allows: {
        observe: true,
        read: true,
        act: true,
        write: false,
        shell: false,
        codeMutation: false,
      },
    });
  });

  it("uses safe non-interactive read-only Codex CLI args by default", () => {
    delete process.env.CODEX_ARGS;

    expect(readCodexArgs()).toEqual([
      "exec",
      "--sandbox",
      "read-only",
      "--skip-git-repo-check",
      "--color",
      "never",
    ]);
  });

  it("allows Codex CLI args to be overridden from env", () => {
    process.env.CODEX_ARGS = "exec --json --sandbox read-only";

    expect(readCodexArgs()).toEqual(["exec", "--json", "--sandbox", "read-only"]);
  });

  it("uses CODEX_BIN when it points to a launchable binary", () => {
    process.env.CODEX_BIN = process.execPath;

    expect(resolveCodexBinary()).toMatchObject({
      launchable: true,
      reason: null,
      resolved_bin: process.execPath,
    });
  });

  it("prefers the repo-local npm Codex package before PATH aliases", () => {
    delete process.env.CODEX_BIN;
    delete process.env.CODEX_DISABLE_LOCAL_PACKAGE_BIN;
    process.env.PATH = "";
    process.env.Path = "";

    const resolved = resolveCodexBinary();

    expect(resolved).toMatchObject({
      launchable: true,
      reason: null,
    });
    expect(resolved.resolved_bin).toContain(path.join("node_modules", "@openai", "codex", "bin", "codex.js"));
  });

  it("resolves Codex from PATH when CODEX_BIN is not set", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "helix-codex-path-"));
    const filename = process.platform === "win32" ? "codex.exe" : "codex";
    const candidate = path.join(tempDir, filename);
    fs.copyFileSync(process.execPath, candidate);
    delete process.env.CODEX_BIN;
    process.env.CODEX_DISABLE_LOCAL_PACKAGE_BIN = "1";
    process.env.PATH = tempDir;
    process.env.Path = tempDir;
    process.env.PATHEXT = ".EXE";

    expect(resolveCodexBinary()).toMatchObject({
      launchable: true,
      reason: null,
      resolved_bin: candidate,
    });
  });

  it("resolves Codex from a WindowsApps-style install directory", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "helix-codex-windowsapps-"));
    const resourcesDir = path.join(tempDir, "OpenAI.Codex_test", "app", "resources");
    fs.mkdirSync(resourcesDir, { recursive: true });
    const candidate = path.join(resourcesDir, "codex.exe");
    fs.copyFileSync(process.execPath, candidate);
    delete process.env.CODEX_BIN;
    process.env.CODEX_DISABLE_LOCAL_PACKAGE_BIN = "1";
    process.env.PATH = "";
    process.env.Path = "";
    process.env.CODEX_WINDOWS_APPS_DIR = tempDir;

    expect(resolveCodexBinary()).toMatchObject({
      launchable: true,
      reason: null,
      resolved_bin: candidate,
    });
  });

  it("resolves Codex from a packaged app install location before requiring WindowsApps directory listing", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "helix-codex-appx-"));
    const resourcesDir = path.join(tempDir, "app", "resources");
    fs.mkdirSync(resourcesDir, { recursive: true });
    const candidate = path.join(resourcesDir, "codex.exe");
    fs.copyFileSync(process.execPath, candidate);
    delete process.env.CODEX_BIN;
    process.env.CODEX_DISABLE_LOCAL_PACKAGE_BIN = "1";
    process.env.PATH = "";
    process.env.Path = "";
    process.env.CODEX_WINDOWS_APPS_DIR = path.join(tempDir, "missing-windowsapps");
    process.env.CODEX_APPX_INSTALL_LOCATION = tempDir;

    expect(resolveCodexBinary()).toMatchObject({
      launchable: true,
      reason: null,
      resolved_bin: candidate,
    });
  });

  it("reports a typed missing-binary status instead of throwing", () => {
    process.env.CODEX_BIN = path.join(os.tmpdir(), "helix-missing-codex-bin.exe");

    expect(resolveCodexBinary()).toMatchObject({
      launchable: false,
      reason: "codex_binary_not_found",
      resolved_bin: null,
    });
  });

  it("reports a typed non-spawnable binary status instead of treating file existence as launchability", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "helix-codex-unspawnable-"));
    const candidate = path.join(tempDir, process.platform === "win32" ? "codex.exe" : "codex");
    fs.writeFileSync(candidate, "not a real executable");
    process.env.CODEX_BIN = candidate;

    expect(resolveCodexBinary()).toMatchObject({
      launchable: false,
      reason: "codex_binary_not_spawnable",
      resolved_bin: candidate,
    });
  });

  it("returns a timeout result instead of hanging when the Codex process does not exit", async () => {
    process.env.CODEX_BIN = process.execPath;
    process.env.CODEX_ARGS = "-e setInterval(()=>{},1000)";
    process.env.CODEX_AGENT_TIMEOUT_MS = "25";

    const startedAt = Date.now();
    const result = await runCodexProcess({ prompt: "check" });

    expect(Date.now() - startedAt).toBeLessThan(2_000);
    expect(result).toMatchObject({
      exitCode: null,
      timedOut: true,
      killed: true,
    });
    expect(result.stderr).toContain("Codex process timed out after 25ms.");
  });

  it("returns Codex missing-binary failures with provider debug metadata", async () => {
    process.env.CODEX_BIN = path.join(os.tmpdir(), "helix-missing-codex-bin.exe");

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-missing-binary",
        question: "check",
      },
    });

    expect(result).toMatchObject({
      ok: false,
      runtime: "codex",
      response_type: "final_failure",
      final_status: "final_failure",
      answer: "Codex runtime is enabled but no launchable Codex CLI binary was found.",
      debug: {
        agent_runtime: "codex",
        fail_reason: "codex_binary_not_found",
        codex_bin: null,
        codex_runtime_status: {
          launchable: false,
          reason: "codex_binary_not_found",
          resolved_bin: null,
        },
      },
    });
  });

  it("returns Codex non-spawnable binary failures with provider debug metadata", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "helix-codex-provider-unspawnable-"));
    const candidate = path.join(tempDir, process.platform === "win32" ? "codex.exe" : "codex");
    fs.writeFileSync(candidate, "not a real executable");
    process.env.CODEX_BIN = candidate;

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-unspawnable-binary",
        question: "check",
      },
    });

    expect(result).toMatchObject({
      ok: false,
      runtime: "codex",
      response_type: "final_failure",
      final_status: "final_failure",
      answer: "Codex runtime is enabled but the resolved Codex CLI binary could not be spawned.",
      debug: {
        agent_runtime: "codex",
        fail_reason: "codex_binary_not_spawnable",
        codex_bin: candidate,
        codex_runtime_status: {
          launchable: false,
          reason: "codex_binary_not_spawnable",
          resolved_bin: candidate,
        },
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

  it("lists Helix and Codex as enabled and keeps future providers disabled by default", () => {
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
        enabled: true,
        experimental: true,
        permission_profile: expect.objectContaining({
          id: "read-observe-act",
          allows: expect.objectContaining({
            read: true,
            act: true,
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
      mode: "act",
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
          id: "read-observe-act",
          allows: {
            read: true,
            act: true,
            write: false,
            shell: false,
            codeMutation: false,
          },
        },
      },
      workstation_gateway: {
        manifest_schema: "helix.workstation_tool_gateway.v1",
        manifest_version: "read-observe-act.v1",
        tools_enabled_for_provider: true,
        code_mutation_enabled: false,
        shell_enabled: false,
        file_mutation_enabled: false,
        gateway_contract: "read_observe_act",
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
            manifest_version: "read-observe-act.v1",
            shell_enabled: false,
            file_mutation_enabled: false,
            code_mutation_enabled: false,
          },
          evidence_reentry_status: "not_run_text_mode_adapter",
          terminal_authority_status: "not_evaluated_provider_text_mode",
        },
        workstation_gateway_manifest: {
          schema: "helix.workstation_tool_gateway.v1",
          manifest_version: "read-observe-act.v1",
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
            manifest_version: "read-observe-act.v1",
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
          manifest_version: "read-observe-act.v1",
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

  it("derives natural Codex workspace status prompts into workspace_os.status observations", async () => {
    const providerAnswer = "The workspace status observation is available for the final answer.";
    process.env.CODEX_AGENT_FAKE_STDOUT = providerAnswer;
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-natural-workspace-status",
        agent_runtime: "codex",
        question: "Check the workspace OS status and tell me which capabilities are available.",
      },
      headers: {},
    });

    expect(result.text).toBe(providerAnswer);
    expect((result.debug as any)?.workstation_gateway_call_results?.map((entry: any) => entry.capability_id))
      .toEqual(["workspace_os.status"]);
    expect(result.turn_transcript_events?.map((event: any) => event.source_event_type)).toEqual([
      "runtime_selected",
      "tool_request",
      "tool_observation",
      "model_reentry",
      "terminal_answer",
    ]);
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "tool_observation" &&
      event.capability_id === "workspace_os.status" &&
      /Workspace OS status returned/i.test(String(event.text)),
    )).toBe(true);
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

  it("materializes active docs-viewer context as a bounded docs observation for Codex", async () => {
    const body = {
      turn_id: "ask:test:codex-active-doc-context",
      agent_runtime: "codex",
      question: "Summarize this document from the current docs viewer context.",
      workspace_context_snapshot: {
        activePanel: "docs-viewer",
        activeDocPath: "/docs/helix-ask-flow.md",
        hasDocContext: true,
      },
    };

    const requests = buildActiveDocsContextWorkstationGatewayCallRequests(body);
    expect(requests).toEqual([
      expect.objectContaining({
        schema: "helix.workstation_gateway.active_docs_context_call_request.v1",
        derivation_source: "helix_active_docs_viewer_context",
        capability_id: "docs.search",
        arguments: expect.objectContaining({
          paths: ["docs/helix-ask-flow.md"],
          source_target_intent: expect.objectContaining({
            target_source: "active_doc",
            active_panel: "docs-viewer",
            active_doc_path: "docs/helix-ask-flow.md",
          }),
        }),
      }),
    ]);

    const results = await runExplicitWorkstationGatewayCalls({
      body,
      agentRuntime: "codex",
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: "docs.search",
      observation_packet: {
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
      },
      observation: {
        schema: "helix.docs_search_observation.v1",
        active_document_observation: {
          schema: "helix.docs_active_document_observation.v1",
          path: "docs/helix-ask-flow.md",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    });
    expect(String((results[0].observation as any).active_document_observation.excerpt ?? "")).toContain("Helix Ask");
  });

  it("materializes retained document context even when calculator is focused", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "- Retained doc claim boundary.\n- Still observation-backed.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const body = {
      turn_id: "ask:test:codex-retained-doc-context-after-calculator-focus",
      agent_runtime: "codex",
      question: "From this current document, what is the claim boundary? Answer in two short bullets.",
      workspace_context_snapshot: {
        activePanel: "scientific-calculator",
        focusedPanel: "scientific-calculator",
        openPanels: ["docs-viewer", "scientific-calculator"],
        activeDocPath: "/docs/helix-ask-flow.md",
        hasDocContext: true,
      },
    };

    const requests = buildActiveDocsContextWorkstationGatewayCallRequests(body);
    expect(requests).toEqual([
      expect.objectContaining({
        derivation_source: "helix_retained_active_doc_context",
        capability_id: "docs.search",
        arguments: expect.objectContaining({
          paths: ["docs/helix-ask-flow.md"],
          source_target_intent: expect.objectContaining({
            focused_panel: "scientific-calculator",
            active_doc_path: "docs/helix-ask-flow.md",
            retained_source_context: true,
          }),
        }),
      }),
    ]);

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body,
      headers: {},
    });

    expect(result.text).toBe("- Retained doc claim boundary.\n- Still observation-backed.");
    expect((result.debug as any)?.workstation_gateway_call_results?.map((entry: any) => entry.capability_id))
      .toEqual(["docs.search"]);
    expect(result.turn_transcript_events?.map((event: any) => event.source_event_type)).toEqual([
      "runtime_selected",
      "context_state",
      "tool_request",
      "tool_observation",
      "model_reentry",
      "terminal_answer",
    ]);
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "context_state" &&
      /focused panel scientific-calculator; retained doc docs\/helix-ask-flow\.md/i.test(String(event.text)),
    )).toBe(true);
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "tool_observation" &&
      /docs\.search materialized a bounded document excerpt from docs\/helix-ask-flow\.md/i.test(String(event.text)),
    )).toBe(true);
  });

  it("normalizes docs observation excerpt transport without dropping provenance", () => {
    const excerpt = normalizeDocsObservationExcerptText([
      "The frontier records `alpha = 0.7` and duplicate renderer echo `alpha=0.7` for the same inline value.",
      "",
      "  Claim locks remain closed.  ",
    ].join("\n"));

    expect(excerpt).toContain("`alpha = 0.7`");
    expect(excerpt).toContain("Claim locks remain closed.");
    expect(excerpt).not.toContain("`alpha=0.7`");
  });

  it("keeps Codex docs final answer separate from visible gateway trace rows", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "- NHM2 is claim-bounded.\n- It does not claim physical viability.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-doc-final-answer-separate",
        agent_runtime: "codex",
        question: "Summarize this document from the current docs viewer context.",
        workspace_context_snapshot: {
          activePanel: "docs-viewer",
          activeDocPath: "/docs/helix-ask-flow.md",
          hasDocContext: true,
        },
      },
      headers: {},
    });

    expect(result.selected_final_answer).toBe("- NHM2 is claim-bounded.\n- It does not claim physical viability.");
    expect(result.text).toBe(result.selected_final_answer);
    expect(result.text).not.toContain("Tool observation:");
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "tool_observation" &&
      /docs\.search materialized a bounded document excerpt/i.test(String(event.text)),
    )).toBe(true);
    expect(result.turn_transcript_events?.find((event: any) => event.source_event_type === "terminal_answer"))
      .toMatchObject({
        text: result.selected_final_answer,
        assistant_answer: false,
        raw_content_included: false,
      });
  });

  it("projects explicit Codex calculator gateway calls into visible action/tool rows without templating final text", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "The result is 72.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-calculator-visible-trace",
        agent_runtime: "codex",
        question: "Use the scientific calculator to evaluate 8 * 9 and answer normally.",
        workstation_gateway_call: {
          capability_id: "scientific-calculator.solve_expression",
          mode: "read",
          arguments: {
            expression: "8 * 9",
          },
        },
      },
      headers: {},
    });

    expect(result.text).toBe("The result is 72.");
    expect(result.text).not.toContain("Ran `scientific-calculator.solve_expression`.");
    expect(result.text).not.toContain("Observed expression:");
    expect((result.action_envelope as any)?.workstation_actions).toEqual([
      {
        schema_version: "helix.workstation.action/v1",
        action: "open_panel",
        panel_id: "scientific-calculator",
      },
      {
        schema_version: "helix.workstation.action/v1",
        action: "focus_panel",
        panel_id: "scientific-calculator",
      },
      {
        schema_version: "helix.workstation.action/v1",
        action: "run_panel_action",
        panel_id: "scientific-calculator",
        action_id: "show_gateway_solve",
        args: {
          expression: "8 * 9",
          normalized_expression: "8 * 9",
          result: "72",
          source_capability: "scientific-calculator.solve_expression",
          observation_ref: "ask:test:codex-calculator-visible-trace:scientific-calculator.solve_expression",
        },
      },
    ]);
    expect((result.debug as any)?.agent_step_loop?.iterations?.map((iteration: any) => iteration.chosen_capability))
      .toEqual([
        "scientific-calculator.open_panel",
        "scientific-calculator.focus_panel",
        "scientific-calculator.show_gateway_solve",
        "scientific-calculator.solve_expression",
      ]);
    expect(result.turn_transcript_events?.map((event: any) => event.source_event_type)).toEqual([
      "runtime_selected",
      "action_request",
      "action_observation",
      "action_request",
      "action_observation",
      "action_request",
      "action_observation",
      "tool_request",
      "tool_observation",
      "model_reentry",
      "terminal_answer",
    ]);
    expect(result.turn_transcript_events?.some((event: any) =>
      /Action observation: scientific-calculator\.open_panel admitted open_panel for scientific-calculator\./.test(String(event.text)),
    )).toBe(true);
    expect(result.turn_transcript_events?.some((event: any) =>
      /Tool observation: scientific-calculator\.solve_expression observed 8 \* 9 = 72\./.test(String(event.text)),
    )).toBe(true);
    expect((result.debug as any)?.provider_gateway_debug_summary).toMatchObject({
      gateway_call_count: 4,
      gateway_action_receipt_count: 3,
      gateway_successful_action_receipt_count: 3,
      gateway_tool_observation_count: 1,
      gateway_successful_tool_observation_count: 1,
      gateway_observation_count: 1,
      terminal_authority_result: "authorized_by_helix_provider_candidate_bridge",
    });
    expect((result.debug as any)?.turn_transcript_events).toEqual(result.turn_transcript_events);
  });

  it("preserves detailed Codex provider answers without Helix shortening or style rewrite", async () => {
    const detailedAnswer = [
      "The calculator observation gives a numeric anchor, but the implication is broader:",
      "",
      "First, the gateway result is evidence, not the answer itself. Codex can use it as a grounded input and then explain why the arithmetic matters in the user's context.",
      "",
      "Second, the workstation trace should remain visible alongside the answer. That lets the user inspect the tool request, the observation packet, and the model re-entry without those rows being spliced into the final prose.",
      "",
      "Third, preserving this full answer matters because a detailed prompt should not be collapsed into a terse receipt-style line just because a tool ran.",
    ].join("\n");
    process.env.CODEX_AGENT_FAKE_STDOUT = detailedAnswer;
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-detailed-answer-preserved",
        agent_runtime: "codex",
        question: "Use the scientific calculator to evaluate 8 * 9, then give a detailed explanation of what the tool-backed result means for the workstation loop.",
        workstation_gateway_call: {
          capability_id: "scientific-calculator.solve_expression",
          mode: "read",
          arguments: {
            expression: "8 * 9",
          },
        },
      },
      headers: {},
    });

    expect(result.text).toBe(detailedAnswer);
    expect(result.answer).toBe(detailedAnswer);
    expect(result.selected_final_answer).toBe(detailedAnswer);
    expect(result.text.length).toBe(detailedAnswer.length);
    expect(result.text).not.toContain("Tool observation:");
    expect(result.text).not.toContain("Ran `scientific-calculator.solve_expression`.");
    expect((result.debug as any)?.agent_runtime_adapter_contract?.adapter_invariants).toMatchObject({
      helix_preserves_provider_answer_style: true,
      helix_style_rewrite_enabled: false,
    });
    expect((result.debug as any)?.provider_terminal_candidate).toMatchObject({
      candidate_text_length: detailedAnswer.length,
      candidate_text_hash: expect.any(String),
    });
    expect((result.debug as any)?.terminal_presentation).toMatchObject({
      concise_text: detailedAnswer,
      presentation_policy: "preserve_provider_text",
      helix_style_rewrite_applied: false,
    });
    expect(result.turn_transcript_events?.find((event: any) => event.source_event_type === "terminal_answer"))
      .toMatchObject({
        text: detailedAnswer,
        assistant_answer: false,
        raw_content_included: false,
      });
  });

  it("routes explicit Codex theory reflection calls as visible observation-backed re-entry", async () => {
    const providerAnswer = [
      "The reflection observation is useful as context, not as proof.",
      "",
      "It points Codex toward claim-boundary badges, so the final answer should explain what remains bounded instead of pretending the theory graph certified the claim.",
    ].join("\n");
    process.env.CODEX_AGENT_FAKE_STDOUT = providerAnswer;
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-theory-reflection-visible-trace",
        agent_runtime: "codex",
        question: "Reflect QEI margin and source residual against the theory badge graph, then answer with the claim boundary.",
        workstation_gateway_call: {
          capability_id: "theory-badge-graph.reflect_discussion_context",
          mode: "read",
          arguments: {
            prompt: "Reflect QEI margin and source residual against the theory badge graph.",
            mentioned_symbols: ["QEI", "source residual"],
            mentioned_domains: ["warp metrics", "claim boundaries"],
            build_explanation_plan: true,
            limit: 4,
          },
        },
      },
      headers: {},
    });

    expect(result.text).toBe(providerAnswer);
    expect(result.text).not.toContain("Tool observation:");
    expect((result.action_envelope as any)?.workstation_actions ?? []).toEqual([]);
    expect((result.debug as any)?.workstation_gateway_call_results).toHaveLength(1);
    expect((result.debug as any)?.workstation_gateway_call_results?.[0]).toMatchObject({
      ok: true,
      capability_id: "theory-badge-graph.reflect_discussion_context",
      observation: {
        schema: "helix.theory_context_reflection_observation.v1",
        status: "succeeded",
        receipt_schema: "helix_theory_context_reflection_tool_receipt/v1",
        reflection_terminal_eligible: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        panel_id: "theory-badge-graph",
        action: "reflect_discussion_context",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect((result.debug as any)?.provider_gateway_debug_summary).toMatchObject({
      gateway_call_count: 1,
      gateway_action_receipt_count: 0,
      gateway_tool_observation_count: 1,
      gateway_successful_tool_observation_count: 1,
      gateway_observation_count: 1,
      terminal_authority_result: "authorized_by_helix_provider_candidate_bridge",
    });
    expect(result.turn_transcript_events?.map((event: any) => event.source_event_type)).toEqual([
      "runtime_selected",
      "tool_request",
      "tool_observation",
      "model_reentry",
      "terminal_answer",
    ]);
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "tool_observation" &&
      /Theory Badge Graph reflection produced/i.test(String(event.text)),
    )).toBe(true);
    expect(result.turn_transcript_events?.find((event: any) => event.source_event_type === "terminal_answer"))
      .toMatchObject({
        text: providerAnswer,
        assistant_answer: false,
        raw_content_included: false,
      });
  });

  it("routes explicit Codex civilization-bounds calls as visible observation-backed re-entry", async () => {
    const providerAnswer = [
      "The civilization-bounds observation gives situational constraints, not a decision.",
      "",
      "The final answer should explain missing evidence and capability bounds without treating the roadmap as policy authority.",
    ].join("\n");
    process.env.CODEX_AGENT_FAKE_STDOUT = providerAnswer;
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-civilization-bounds-visible-trace",
        agent_runtime: "codex",
        question: "Reflect planetary trade through civilization bounds, then answer with the missing evidence boundary.",
        workstation_gateway_call: {
          capability_id: "civilization-bounds.reflect_system_bounds",
          mode: "read",
          arguments: {
            prompt: "Reflect planetary trade through civilization bounds with material inventory and governance review.",
            include_bridge_context: true,
            include_collaboration_bounds: true,
            include_falsification_hooks: true,
          },
        },
      },
      headers: {},
    });

    expect(result.text).toBe(providerAnswer);
    expect(result.text).not.toContain("Tool observation:");
    expect((result.action_envelope as any)?.workstation_actions ?? []).toEqual([]);
    expect((result.debug as any)?.workstation_gateway_call_results).toHaveLength(1);
    expect((result.debug as any)?.workstation_gateway_call_results?.[0]).toMatchObject({
      ok: true,
      capability_id: "civilization-bounds.reflect_system_bounds",
      observation: {
        schema: "helix.civilization_bounds_reflection_observation.v1",
        status: "succeeded",
        bridge_context_included: true,
        procedural_scaffold_id: "spore_civilization_stage_procedural_scaffold",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        panel_id: "civilization-bounds-roadmap",
        action: "reflect_system_bounds",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect((result.debug as any)?.provider_gateway_debug_summary).toMatchObject({
      gateway_call_count: 1,
      gateway_action_receipt_count: 0,
      gateway_tool_observation_count: 1,
      gateway_successful_tool_observation_count: 1,
      gateway_observation_count: 1,
      terminal_authority_result: "authorized_by_helix_provider_candidate_bridge",
    });
    expect(result.turn_transcript_events?.map((event: any) => event.source_event_type)).toEqual([
      "runtime_selected",
      "tool_request",
      "tool_observation",
      "model_reentry",
      "terminal_answer",
    ]);
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "tool_observation" &&
      /Civilization Bounds reflection produced/i.test(String(event.text)),
    )).toBe(true);
  });

  it("preserves compound Codex workstation observations before one final model re-entry", async () => {
    const providerAnswer = [
      "The compound turn has three evidence inputs: the document excerpt, the calculator result, and repo search context.",
      "",
      "The answer can synthesize those observations, but none of the receipts are themselves the final answer.",
    ].join("\n");
    process.env.CODEX_AGENT_FAKE_STDOUT = providerAnswer;
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-compound-docs-calculator-repo",
        agent_runtime: "codex",
        question: "Use the open document, calculate 8 * 9, search the repo for workstation_gateway, then synthesize the implication.",
        workstation_gateway_calls: [
          {
            capability_id: "docs.search",
            mode: "read",
            arguments: {
              query: "Helix Ask remains the grounded reasoning surface",
              paths: ["docs/helix-ask-flow.md"],
              max_hits: 2,
            },
          },
          {
            capability_id: "scientific-calculator.solve_expression",
            mode: "read",
            arguments: {
              expression: "8 * 9",
            },
          },
          {
            capability_id: "repo.search",
            mode: "read",
            arguments: {
              query: "workstation_gateway",
              paths: ["server/services/helix-ask"],
              max_hits: 2,
            },
          },
        ],
      },
      headers: {},
    });

    expect(result.text).toBe(providerAnswer);
    expect(result.text).not.toContain("Tool observation:");
    expect((result.debug as any)?.workstation_gateway_call_results?.map((entry: any) => entry.capability_id))
      .toEqual([
        "scientific-calculator.open_panel",
        "scientific-calculator.focus_panel",
        "scientific-calculator.show_gateway_solve",
        "docs.search",
        "scientific-calculator.solve_expression",
        "repo.search",
      ]);
    expect((result.debug as any)?.provider_gateway_debug_summary).toMatchObject({
      gateway_call_count: 6,
      gateway_action_receipt_count: 3,
      gateway_successful_action_receipt_count: 3,
      gateway_tool_observation_count: 3,
      gateway_successful_tool_observation_count: 3,
      gateway_observation_count: 3,
      terminal_authority_result: "authorized_by_helix_provider_candidate_bridge",
    });
    expect(result.turn_transcript_events?.map((event: any) => event.source_event_type)).toEqual([
      "runtime_selected",
      "action_request",
      "action_observation",
      "action_request",
      "action_observation",
      "action_request",
      "action_observation",
      "tool_request",
      "tool_observation",
      "tool_request",
      "tool_observation",
      "tool_request",
      "tool_observation",
      "model_reentry",
      "terminal_answer",
    ]);
    expect(result.turn_transcript_events?.filter((event: any) => event.source_event_type === "model_reentry"))
      .toHaveLength(1);
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "tool_observation" &&
      /docs\.search materialized a bounded document excerpt from docs\/helix-ask-flow\.md/i.test(String(event.text)),
    )).toBe(true);
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "tool_observation" &&
      /scientific-calculator\.solve_expression observed 8 \* 9 = 72/i.test(String(event.text)),
    )).toBe(true);
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "tool_observation" &&
      event.capability_id === "repo.search" &&
      /repo search/i.test(String(event.text)),
    )).toBe(true);
  });

  it("derives natural Codex compound workstation itinerary from retained docs, calculator, and repo prompt cues", async () => {
    const providerAnswer = "The natural compound turn synthesized the retained document, calculator result, and repo search.";
    process.env.CODEX_AGENT_FAKE_STDOUT = providerAnswer;
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-natural-compound-docs-calculator-repo",
        agent_runtime: "codex",
        question:
          "Use the current document, calculate 6*7, search the repo for workstation_gateway, then summarize what the observations prove and do not prove.",
        workspace_context_snapshot: {
          activePanel: "scientific-calculator",
          focusedPanel: "scientific-calculator",
          openPanels: ["docs-viewer", "scientific-calculator"],
          activeDocPath: "/docs/helix-ask-flow.md",
          hasDocContext: true,
        },
      },
      headers: {},
    });

    expect(result.text).toBe(providerAnswer);
    expect((result.debug as any)?.workstation_gateway_call_results?.map((entry: any) => entry.capability_id))
      .toEqual([
        "scientific-calculator.open_panel",
        "scientific-calculator.focus_panel",
        "scientific-calculator.show_gateway_solve",
        "docs.search",
        "scientific-calculator.solve_expression",
        "repo.search",
      ]);
    expect(result.turn_transcript_events?.map((event: any) => event.source_event_type)).toEqual([
      "runtime_selected",
      "context_state",
      "action_request",
      "action_observation",
      "action_request",
      "action_observation",
      "action_request",
      "action_observation",
      "tool_request",
      "tool_observation",
      "tool_request",
      "tool_observation",
      "tool_request",
      "tool_observation",
      "model_reentry",
      "terminal_answer",
    ]);
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "tool_observation" &&
      event.capability_id === "docs.search" &&
      /bounded document excerpt from docs\/helix-ask-flow\.md/i.test(String(event.text)),
    )).toBe(true);
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "tool_observation" &&
      event.capability_id === "scientific-calculator.solve_expression" &&
      /6\*7 = 42|6 \* 7 = 42/i.test(String(event.text)),
    )).toBe(true);
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "tool_observation" &&
      event.capability_id === "repo.search",
    )).toBe(true);
  });

  it("fails closed when one compound Codex gateway observation is missing", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "The calculator and reflection both ran successfully.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-compound-missing-reflection-observation",
        agent_runtime: "codex",
        question: "Calculate 8 * 9, reflect it against the theory badge graph, then answer.",
        workstation_gateway_calls: [
          {
            capability_id: "scientific-calculator.solve_expression",
            mode: "read",
            arguments: {
              expression: "8 * 9",
            },
          },
          {
            capability_id: "theory-badge-graph.reflect_discussion_context",
            mode: "read",
            arguments: {},
          },
        ],
      },
      headers: {},
    });

    expect(result.ok).toBe(false);
    expect(result.text).toContain("I cannot claim the requested workstation tool or UI action ran");
    expect(result.text).toContain("theory-badge-graph.reflect_discussion_context: theory_reflection_prompt_missing");
    expect(result.text).not.toBe("The calculator and reflection both ran successfully.");
    expect((result.debug as any)?.workstation_gateway_call_results?.map((entry: any) => ({
      capability_id: entry.capability_id,
      ok: entry.ok,
    }))).toEqual([
      { capability_id: "scientific-calculator.open_panel", ok: true },
      { capability_id: "scientific-calculator.focus_panel", ok: true },
      { capability_id: "scientific-calculator.show_gateway_solve", ok: true },
      { capability_id: "scientific-calculator.solve_expression", ok: true },
      { capability_id: "theory-badge-graph.reflect_discussion_context", ok: false },
    ]);
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "tool_observation" &&
      event.capability_id === "theory-badge-graph.reflect_discussion_context" &&
      event.status === "failed",
    )).toBe(true);
    expect(result.turn_transcript_events?.find((event: any) => event.source_event_type === "terminal_answer"))
      .toMatchObject({
        text: result.text,
        assistant_answer: false,
        raw_content_included: false,
      });
  });

  it("projects explicit Codex docs-viewer open-doc gateway calls as action receipts", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "Opened the requested document.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-docs-open-doc-action-receipt",
        agent_runtime: "codex",
        question: "Open docs/helix-ask-api-parity-matrix.md in the docs viewer and tell me when the action receipt is available.",
        workstation_gateway_call: {
          capability_id: "docs-viewer.open_doc",
          mode: "act",
          arguments: {
            path: "docs/helix-ask-api-parity-matrix.md",
          },
        },
      },
      headers: {},
    });

    expect(result.text).toBe("Opened the requested document.");
    expect((result.action_envelope as any)?.workstation_actions).toEqual([
      {
        schema_version: "helix.workstation.action/v1",
        action: "run_panel_action",
        panel_id: "docs-viewer",
        action_id: "open_doc",
        args: {
          path: "docs/helix-ask-api-parity-matrix.md",
        },
      },
    ]);
    expect(result.turn_transcript_events?.map((event: any) => event.source_event_type)).toEqual([
      "runtime_selected",
      "action_request",
      "action_observation",
      "model_reentry",
      "terminal_answer",
    ]);
    expect(result.turn_transcript_events?.some((event: any) =>
      /Action observation: docs-viewer\.open_doc admitted open_doc for docs-viewer\./.test(String(event.text)),
    )).toBe(true);
    expect(result.text).not.toContain("Action observation:");
  });

  it("does not answer explicit docs-path content from an open-doc action receipt without a docs observation", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "The API parity matrix says live server probes are complete.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-docs-open-doc-no-content-authority",
        agent_runtime: "codex",
        question: "Open docs/helix-ask-api-parity-matrix.md in the docs viewer and summarize it.",
        workstation_gateway_call: {
          capability_id: "docs-viewer.open_doc",
          mode: "act",
          arguments: {
            path: "docs/helix-ask-api-parity-matrix.md",
          },
        },
      },
      headers: {},
    });

    expect((result.action_envelope as any)?.workstation_actions).toEqual([
      {
        schema_version: "helix.workstation.action/v1",
        action: "run_panel_action",
        panel_id: "docs-viewer",
        action_id: "open_doc",
        args: {
          path: "docs/helix-ask-api-parity-matrix.md",
        },
      },
    ]);
    expect(result.text).toContain("no docs observation packet was materialized");
    expect(result.text).not.toContain("API parity matrix says");
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "action_observation" &&
      /docs-viewer\.open_doc admitted open_doc for docs-viewer/i.test(String(event.text)),
    )).toBe(true);
    expect(result.turn_transcript_events?.find((event: any) => event.source_event_type === "terminal_answer"))
      .toMatchObject({
        text: result.text,
        assistant_answer: false,
        raw_content_included: false,
      });
  });

  it("projects explicit Codex safe workstation open-panel gateway calls as action receipts", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "Opened the process graph panel.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-workstation-open-panel-action-receipt",
        agent_runtime: "codex",
        question: "Open the workstation process graph panel and answer normally after the receipt.",
        workstation_gateway_call: {
          capability_id: "workstation.open_panel",
          mode: "act",
          arguments: {
            panel_id: "workstation-process-graph",
          },
        },
      },
      headers: {},
    });

    expect(result.text).toBe("Opened the process graph panel.");
    expect((result.action_envelope as any)?.workstation_actions).toEqual([
      {
        schema_version: "helix.workstation.action/v1",
        action: "open_panel",
        panel_id: "workstation-process-graph",
      },
    ]);
    expect(result.turn_transcript_events?.map((event: any) => event.source_event_type)).toEqual([
      "runtime_selected",
      "action_request",
      "action_observation",
      "model_reentry",
      "terminal_answer",
    ]);
    expect(result.turn_transcript_events?.some((event: any) =>
      /Action observation: workstation\.open_panel admitted open_panel for workstation-process-graph\./.test(String(event.text)),
    )).toBe(true);
    expect(result.text).not.toContain("Action observation:");
  });

  it("does not add calculator provenance when no calculator observation exists", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "72";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-calculator-no-observation",
        agent_runtime: "codex",
        question: "What is 8 * 9?",
      },
      headers: {},
    });

    expect(result.text).toBe("72");
    expect(result.text).not.toContain("scientific-calculator.solve_expression");
    expect(result.turn_transcript_events?.some((event: any) => event.source_event_type === "tool_observation")).toBe(false);
  });

  it("does not publish Codex claims when a requested gateway action was blocked", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "I wrote the requested file.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-blocked-gateway-visible-claim",
        agent_runtime: "codex",
        question: "Write blocked content into server/routes/agi.plan.ts.",
        workstation_gateway_call: {
          capability_id: "filesystem.write_file",
          mode: "act",
          arguments: {
            path: "server/routes/agi.plan.ts",
            text: "blocked",
          },
        },
      },
      headers: {},
    });

    expect(result.ok).toBe(false);
    expect(result.response_type).toBe("final_failure");
    expect(result.final_status).toBe("final_failure");
    expect(result.text).toContain("cannot claim the requested workstation tool or UI action ran");
    expect(result.text).toContain("filesystem.write_file: capability_not_registered");
    expect(result.text).not.toContain("I wrote the requested file");
    expect((result.debug as any)?.terminal_authority_status).toBe("blocked_by_gateway_observation_state");
    expect((result.debug as any)?.terminal_answer_authority).toBeNull();
    expect((result.debug as any)?.provider_gateway_debug_summary).toMatchObject({
      blocked_capabilities: [
        expect.objectContaining({
          requested_capability: "filesystem.write_file",
          blocked_reason: "capability_not_registered",
        }),
      ],
      terminal_authority_granted: false,
      final_visible_answer_authorized: false,
    });
    expect(result.turn_transcript_events?.find((event: any) => event.source_event_type === "terminal_answer"))
      .toMatchObject({
        status: "final_failure",
        text: result.text,
        assistant_answer: false,
        raw_content_included: false,
      });
  });

  it("does not publish Codex repo claims when natural repo search is missing a query", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "I searched the repo and found the answer.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-natural-repo-search-missing-query",
        agent_runtime: "codex",
        question: "Search the repo and tell me what you find.",
      },
      headers: {},
    });

    expect(result.ok).toBe(false);
    expect(result.response_type).toBe("final_failure");
    expect(result.final_status).toBe("final_failure");
    expect(result.text).toContain("cannot claim the requested workstation tool or UI action ran");
    expect(result.text).toContain("repo.search: missing_query");
    expect(result.text).not.toContain("I searched the repo and found the answer");
    expect((result.debug as any)?.workstation_gateway_call_results?.map((entry: any) => ({
      capability_id: entry.capability_id,
      ok: entry.ok,
      error: entry.error,
      blocked_reason: entry.gateway_admission?.blocked_reason,
    }))).toEqual([
      {
        capability_id: "repo.search",
        ok: false,
        error: "missing_query",
        blocked_reason: "missing_query",
      },
    ]);
    expect((result.debug as any)?.provider_gateway_debug_summary).toMatchObject({
      requested_capabilities: ["repo.search"],
      blocked_capabilities: [
        expect.objectContaining({
          requested_capability: "repo.search",
          blocked_reason: "missing_query",
        }),
      ],
      terminal_authority_granted: false,
      final_visible_answer_authorized: false,
    });
    expect(result.turn_transcript_events?.map((event: any) => event.source_event_type)).toEqual([
      "runtime_selected",
      "tool_request",
      "tool_observation",
      "model_reentry",
      "terminal_answer",
    ]);
    expect(result.turn_transcript_events?.find((event: any) => event.source_event_type === "tool_observation"))
      .toMatchObject({
        capability_id: "repo.search",
        status: "failed",
        assistant_answer: false,
        raw_content_included: false,
      });
    expect(result.turn_transcript_events?.find((event: any) => event.source_event_type === "terminal_answer"))
      .toMatchObject({
        status: "final_failure",
        text: result.text,
        assistant_answer: false,
        raw_content_included: false,
      });
  });

  it("materializes active calculator context as a bounded observation for Codex", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "The calculator is showing 8 * 9 = 72.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const body = {
      turn_id: "ask:test:codex-active-calculator-context",
      agent_runtime: "codex",
      question: "What is this calculator result?",
      workspace_context_snapshot: {
        activePanel: "scientific-calculator",
        activeCalculatorContext: {
          current_latex: "8 * 9",
          last_result_text: "72",
          last_normalized_expression: "8*9",
          last_ok: true,
          step_count: 1,
          recent_debug_events: [{
            action_id: "solve_expression",
            ok: true,
            input_latex: "8 * 9",
            result_text: "72",
            normalized_expression: "8*9",
            message: "solve_completed",
            ts: "2026-06-28T00:00:00.000Z",
          }],
        },
      },
    };

    expect(buildActiveCalculatorContextWorkstationGatewayCallRequests(body)).toEqual([
      expect.objectContaining({
        schema: "helix.workstation_gateway.active_calculator_context_call_request.v1",
        derivation_source: "helix_active_scientific_calculator_context",
        capability_id: "scientific-calculator.active_context",
        mode: "read",
        arguments: expect.objectContaining({
          active_context: expect.objectContaining({
            current_latex: "8 * 9",
            last_result_text: "72",
          }),
          source_target_intent: expect.objectContaining({
            target_source: "active_calculator",
            target_kind: "active_calculator",
            active_panel: "scientific-calculator",
            deictic_prompt: true,
          }),
        }),
      }),
    ]);

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body,
      headers: {},
    });

    expect(result.text).toBe("The calculator is showing 8 * 9 = 72.");
    expect((result.debug as any)?.workstation_gateway_call_results?.map((entry: any) => entry.capability_id))
      .toEqual(["scientific-calculator.active_context"]);
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "tool_observation" &&
      /scientific-calculator\.active_context materialized active calculator context for 8 \* 9 with result 72/i.test(String(event.text)),
    )).toBe(true);
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "model_reentry" &&
      /received the workstation observation packet/i.test(String(event.text)),
    )).toBe(true);
  });

  it("does not derive active calculator context from contextual or quoted deictic mentions", () => {
    const baseBody = {
      turn_id: "ask:test:codex-active-calculator-context-adversarial",
      agent_runtime: "codex",
      workspace_context_snapshot: {
        activePanel: "scientific-calculator",
        activeCalculatorContext: {
          current_latex: "8 * 9",
          last_result_text: "72",
        },
      },
    };
    const prompts = [
      "I am not asking about this calculator result; explain what a calculator result means in general.",
      "Before I open the calculator, explain how results should be checked.",
      "The previous answer mentioned this calculator result; explain why that was not enough evidence.",
      "The screen shows a label that says \"What is this calculator result?\" Explain why that label is confusing.",
      "If we later focus the calculator, explain what evidence would be needed.",
    ];

    prompts.forEach((question) => {
      expect(buildActiveCalculatorContextWorkstationGatewayCallRequests({
        ...baseBody,
        question,
      })).toEqual([]);
    });
  });

  it("does not answer current calculator content when no calculator observation exists", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "The current calculator result is 72.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-active-calculator-no-observation",
        agent_runtime: "codex",
        question: "What is this calculator result?",
        workspace_context_snapshot: {
          activePanel: "scientific-calculator",
        },
      },
      headers: {},
    });

    expect(result.text).toContain("no calculator observation packet was materialized");
    expect(result.text).not.toContain("72");
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "tool_observation",
    )).toBe(false);
  });

  it("materializes active workstation panel context as a bounded observation for Codex", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "The active panel is docs-viewer, with the calculator also open.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const body = {
      turn_id: "ask:test:codex-active-workstation-context",
      agent_runtime: "codex",
      question: "What panels are open and which panel is active?",
      workspace_context_snapshot: {
        activePanel: "docs-viewer",
        activeGroupId: "main",
        groupCount: 1,
        openPanels: ["docs-viewer", "scientific-calculator"],
      },
    };

    expect(buildActiveWorkstationContextGatewayCallRequests(body)).toEqual([
      expect.objectContaining({
        schema: "helix.workstation_gateway.active_workstation_context_call_request.v1",
        derivation_source: "helix_active_workstation_context",
        capability_id: "workstation.active_context",
        mode: "read",
        arguments: expect.objectContaining({
          workspace_context: expect.objectContaining({
            activePanel: "docs-viewer",
            openPanels: ["docs-viewer", "scientific-calculator"],
          }),
          source_target_intent: expect.objectContaining({
            target_source: "active_workstation",
            target_kind: "active_workstation",
            deictic_prompt: true,
          }),
        }),
      }),
    ]);

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body,
      headers: {},
    });

    expect(result.text).toBe("The active panel is docs-viewer, with the calculator also open.");
    expect((result.debug as any)?.workstation_gateway_call_results?.map((entry: any) => entry.capability_id))
      .toEqual(["workstation.active_context"]);
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "tool_observation" &&
      /workstation\.active_context materialized active workstation context with active panel docs-viewer and 2 open panel/i.test(String(event.text)),
    )).toBe(true);
  });

  it("does not derive active workstation context from contextual or quoted panel mentions", () => {
    const baseBody = {
      turn_id: "ask:test:codex-active-workstation-context-adversarial",
      agent_runtime: "codex",
      workspace_context_snapshot: {
        activePanel: "docs-viewer",
        openPanels: ["docs-viewer", "scientific-calculator"],
      },
    };
    const prompts = [
      "I am not asking about the current open panels; explain what a panel means in general.",
      "Before I open a panel, explain what evidence would be needed.",
      "The previous answer mentioned which panel was active; explain why that was insufficient.",
      "The screen shows text that says \"what panels are open\"; explain the wording.",
      "If we later switch panels, tell me what observation would be needed.",
    ];

    prompts.forEach((question) => {
      expect(buildActiveWorkstationContextGatewayCallRequests({
        ...baseBody,
        question,
      })).toEqual([]);
    });
  });

  it("does not answer current workstation panel state when no workstation observation exists", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "The docs viewer is active.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-active-workstation-no-observation",
        agent_runtime: "codex",
        question: "What panels are open and which panel is active?",
      },
      headers: {},
    });

    expect(result.text).toContain("no workstation context observation packet was materialized");
    expect(result.text).not.toContain("docs viewer is active");
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "tool_observation",
    )).toBe(false);
  });

  it("does not answer current document content when no docs observation exists", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "This document says the answer is already known.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-doc-no-observation",
        agent_runtime: "codex",
        question: "Summarize this document from the current docs viewer context.",
        workspace_context_snapshot: {
          activePanel: "docs-viewer",
          hasDocContext: false,
        },
      },
      headers: {},
    });

    expect(result.text).toContain("no docs observation packet was materialized");
    expect(result.text).not.toContain("already known");
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "model_reentry" &&
      /no workstation observation packet was available/i.test(String(event.text)),
    )).toBe(true);
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

  it("derives docs open-doc gateway action requests from structured source-target admission records", async () => {
    const body = {
      turn_id: "ask:test:structured-docs-open-doc-gateway",
      question: "Open docs/helix-ask-codex-loop-discipline.md in the docs viewer.",
      route_metadata: {
        schema: "helix.ask.route_metadata.v1",
        source_target: "docs_viewer",
        source_target_intent: {
          schema: "helix.ask_source_target_intent.v1",
          source_target: "docs_viewer",
          target_source: "docs_viewer",
          mandatory_next_tool: {
            tool_name: "docs-viewer.open_doc",
            selected_capability: "docs-viewer.open_doc",
            args: {
              path: "docs/helix-ask-codex-loop-discipline.md",
            },
          },
        },
      },
    };

    expect(buildStructuredAdmissionWorkstationGatewayCallRequests(body)).toEqual([
      expect.objectContaining({
        schema: "helix.workstation_gateway.structured_admission_call_request.v1",
        derivation_source: "helix_structured_source_target_admission",
        capability_id: "docs-viewer.open_doc",
        mode: "act",
        arguments: expect.objectContaining({
          path: "docs/helix-ask-codex-loop-discipline.md",
          source_target_intent: expect.objectContaining({
            source: "helix_structured_source_target_admission",
            selected_capability: "docs-viewer.open_doc",
          }),
        }),
      }),
    ]);

    const results = await runExplicitWorkstationGatewayCalls({
      body: {
        ...body,
        agent_runtime: "codex",
      },
      agentRuntime: "codex",
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: "docs-viewer.open_doc",
      gateway_admission: {
        selected_agent_provider: "codex",
        permission_profile: "act",
        admission_status: "admitted",
      },
      observation: {
        schema: "helix.workstation_ui_action_receipt.v1",
        action_kind: "open_doc",
        panel_id: "docs-viewer",
        path: "docs/helix-ask-codex-loop-discipline.md",
        workstation_action: {
          schema_version: "helix.workstation.action/v1",
          action: "run_panel_action",
          panel_id: "docs-viewer",
          action_id: "open_doc",
          args: {
            path: "docs/helix-ask-codex-loop-discipline.md",
          },
        },
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("keeps structured docs open-doc requests governed when the admitted path is missing", async () => {
    const body = {
      turn_id: "ask:test:structured-docs-open-doc-missing-path",
      question: "Open the selected doc in the docs viewer.",
      agent_runtime: "codex",
      route_metadata: {
        source_target_intent: {
          mandatory_next_tool: {
            tool_name: "docs-viewer.open_doc",
            selected_capability: "docs-viewer.open_doc",
            args: {},
          },
        },
      },
    };

    expect(buildStructuredAdmissionWorkstationGatewayCallRequests(body)).toEqual([
      expect.objectContaining({
        capability_id: "docs-viewer.open_doc",
        mode: "act",
        arguments: expect.not.objectContaining({
          path: expect.any(String),
        }),
      }),
    ]);

    const results = await runExplicitWorkstationGatewayCalls({
      body,
      agentRuntime: "codex",
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      ok: false,
      capability_id: "docs-viewer.open_doc",
      error: "docs_open_doc_path_missing_or_unsafe",
      gateway_admission: {
        permission_profile: "act",
        admission_status: "blocked",
        blocked_reason: "docs_open_doc_path_missing_or_unsafe",
      },
      observation_packet: {
        status: "blocked",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.workstation_ui_action_receipt.v1",
        status: "blocked",
        dispatch_status: "blocked",
        workstation_action: null,
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
        presentation_policy: "preserve_provider_text",
        helix_style_rewrite_applied: false,
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
