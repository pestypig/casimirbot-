import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { listHelixAgentProviders, resolveHelixAgentProvider } from "../agent-providers/registry";
import { selectHelixAgentRuntime } from "../agent-providers/runtime-select";
import { buildHelixAgentRuntimeSelectionTrace } from "../agent-providers/runtime-debug";
import {
  applyGatewayFailureAuthorityGuard,
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
  buildPromptDerivedCalculatorSolveGatewayCallRequests,
  buildPromptDerivedInternetSearchGatewayCallRequests,
  buildPromptDerivedScholarlyResearchGatewayCallRequests,
  buildPromptNamedCapabilityGatewayCallRequests,
  buildStructuredAdmissionWorkstationGatewayCallRequests,
  buildPlannerDerivedWorkstationGatewayCallRequests,
  readWorkstationGatewayCallRequestsForTurn,
  runExplicitWorkstationGatewayCalls,
} from "../agent-providers/explicit-workstation-gateway";
import { buildCompoundCapabilityDependencyGatewayCallRequests } from "../agent-providers/provider-compound-capability-planner";
import { buildHelixProviderReasoningReentry } from "../agent-providers/provider-terminal-authority";
import { buildArtifactQueryIndex } from "../artifact-query-index";
import { refreshToolLifecycleRecords } from "../tool-lifecycle-trace";
import {
  listWorkstationGatewayCapabilities,
  normalizeDocsObservationExcerptText,
} from "../workstation-tool-gateway/registry";
import { resetInterimVoiceCalloutsForTest } from "../interim-voice-callout-store";
import { runtimeMemoryGovernor } from "../../runtime/runtime-memory-governor";

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
  "CODEX_AGENT_FAKE_NATIVE_EVENT_JSONL",
  "CODEX_AGENT_FAKE_STDERR",
  "CODEX_AGENT_FAKE_EXIT_CODE",
  "TAVILY_API_KEY",
] as const;
const originalEnv = new Map<string, string | undefined>();
const originalFetch = globalThis.fetch;

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
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("Helix Ask agent provider selection", () => {
  it("does not fail terminal text for a superseded calculator solve extraction failure", () => {
    const guarded = applyGatewayFailureAuthorityGuard({
      text: "Observed expression: 8*9\nResult: 72",
      gatewayCallResults: [
        {
          ok: false,
          capability_id: "scientific-calculator.solve_expression",
          gateway_admission: {
            requested_capability: "scientific-calculator.solve_expression",
            blocked_reason: "expression_evaluation_failed",
          },
          error: "expression_evaluation_failed",
        },
        {
          ok: true,
          capability_id: "scientific-calculator.solve_expression",
          gateway_admission: {
            requested_capability: "scientific-calculator.solve_expression",
            admission_reason: "admitted",
          },
          observation: {
            expression: "8*9",
            result: "72",
          },
          observation_packet: {
            observation_summary: "8*9 = 72",
          },
        },
      ] as any,
    });

    expect(guarded).toBe("Observed expression: 8*9\nResult: 72");
  });

  it("keeps unsuperseded failed gateway requests as terminal failures", () => {
    const guarded = applyGatewayFailureAuthorityGuard({
      text: "Repo answer draft",
      gatewayCallResults: [
        {
          ok: false,
          capability_id: "repo.search",
          gateway_admission: {
            requested_capability: "repo.search",
            blocked_reason: "missing_query",
          },
          error: "missing_query",
        },
      ] as any,
    });

    expect(guarded).toContain("I cannot claim the requested workstation tool or UI action ran");
    expect(guarded).toContain("Blocked or failed gateway request: repo.search: missing_query.");
  });

  it("explains fail-closed scholarly numeric extraction instead of claiming the tool did not run", () => {
    const guarded = applyGatewayFailureAuthorityGuard({
      text: "All requested tools ran.",
      gatewayCallResults: [
        {
          ok: true,
          capability_id: "scholarly-research.lookup_papers",
          gateway_admission: {
            requested_capability: "scholarly-research.lookup_papers",
            admission_reason: "admitted",
          },
        },
        {
          ok: true,
          capability_id: "scholarly-research.fetch_full_text",
          gateway_admission: {
            requested_capability: "scholarly-research.fetch_full_text",
            admission_reason: "admitted",
          },
        },
        {
          ok: false,
          capability_id: "scholarly-research.extract_numeric_parameters",
          error: "missing_requested_numeric_variables",
          gateway_admission: {
            requested_capability: "scholarly-research.extract_numeric_parameters",
            admission_reason: "admitted",
          },
          observation: {
            schema: "helix.scholarly_numeric_parameter_observation.v1",
            paper: {
              title: "Tokamak shape-control paper",
              url: "https://example.test/tokamak-control",
            },
            requested_variables: ["n_m3", "T_eV", "B_T"],
            parameters: [],
            missing_variables: ["n_m3", "T_eV", "B_T"],
            rejected_candidates: [
              { variable: "T_eV", reason: "missing_unit", text: "T = 4" },
            ],
            missing_requirements: ["missing_requested_numeric_variables"],
            selected_for_answer: false,
          },
        },
      ] as any,
    });

    expect(guarded).not.toContain("I cannot claim the requested workstation tool or UI action ran");
    expect(guarded).toContain("I found and fetched scholarly paper evidence");
    expect(guarded).toContain("Fetched paper: Tokamak shape-control paper");
    expect(guarded).toContain("Requested variables: n_m3, T_eV, B_T.");
    expect(guarded).toContain("Missing variables: n_m3, T_eV, B_T.");
    expect(guarded).toContain("Rejected candidates: T_eV: missing_unit.");
    expect(guarded).toContain("without fabricating values or claiming a calculator result");
  });

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
      capabilityLanes: true,
      capabilityLaneOneShot: true,
      capabilityLaneSessions: false,
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
      capabilityLanes: true,
      capabilityLaneOneShot: false,
      capabilityLaneSessions: false,
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
          id: "read-observe",
          allows: expect.objectContaining({
            read: true,
            act: false,
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
          id: "read-observe",
          allows: {
            read: true,
            act: false,
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

  it("derives natural Codex internet search prompts into bounded web observations", async () => {
    process.env.TAVILY_API_KEY = "test-tavily-key";
    process.env.CODEX_AGENT_FAKE_STDOUT = "Web evidence observation is available and bounded.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        results: [{
          title: "Current QEI discussion",
          url: "https://example.com/current-qei",
          content: "Current web source about QEI margins.",
        }],
      }),
    })) as typeof fetch;

    const body = {
      turn_id: "ask:test:codex-natural-internet-search",
      agent_runtime: "codex",
      question: "Search the web for current QEI warp metric constraints and summarize what the sources show.",
    };

    expect(buildPromptDerivedInternetSearchGatewayCallRequests(body)).toEqual([
      expect.objectContaining({
        capability_id: "internet-search.search_web",
        mode: "read",
        arguments: expect.objectContaining({
          query: body.question,
          source_target_intent: expect.objectContaining({
            target_kind: "internet_search",
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

    expect(result.text).toBe("Web evidence observation is available and bounded.");
    expect((result.debug as any)?.workstation_gateway_call_results?.map((entry: any) => entry.capability_id))
      .toEqual(["internet-search.search_web"]);
    expect((result.debug as any)?.codex_host_workstation_affordances?.support_refs)
      .toEqual(expect.arrayContaining([expect.stringContaining("internet-search.search_web")]));
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "tool_observation" &&
      event.capability_id === "internet-search.search_web" &&
      /Internet search returned 1 result/i.test(String(event.text)),
    )).toBe(true);
  });

  it("derives natural Codex scholarly prompts into bounded paper observations", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "Scholarly paper observation is available and bounded.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => [
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
        "<feed xmlns=\"http://www.w3.org/2005/Atom\">",
        "<entry>",
        "<id>https://arxiv.org/abs/2606.00001</id>",
        "<title>Quantum inequalities for warp constraints</title>",
        "<summary>Bounded abstract about QEI and warp metrics.</summary>",
        "<published>2026-06-01T00:00:00Z</published>",
        "<author><name>A. Researcher</name></author>",
        "</entry>",
        "</feed>",
      ].join(""),
    })) as typeof fetch;

    const body = {
      turn_id: "ask:test:codex-natural-scholarly-search",
      agent_runtime: "codex",
      question: "Search research papers on arXiv for quantum inequalities and warp constraints, then summarize the paper evidence.",
    };

    expect(buildPromptDerivedScholarlyResearchGatewayCallRequests(body)).toEqual([
      expect.objectContaining({
        capability_id: "scholarly-research.lookup_papers",
        mode: "read",
        arguments: expect.objectContaining({
          query: body.question,
          mode: "paper_search",
          source_target_intent: expect.objectContaining({
            target_kind: "research_paper_search",
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

    expect(result.text).toBe("Scholarly paper observation is available and bounded.");
    expect((result.debug as any)?.workstation_gateway_call_results?.map((entry: any) => entry.capability_id))
      .toEqual(["scholarly-research.lookup_papers"]);
    expect((result.debug as any)?.codex_host_workstation_affordances?.support_refs)
      .toEqual(expect.arrayContaining([expect.stringContaining("scholarly-research.lookup_papers")]));
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "tool_observation" &&
      event.capability_id === "scholarly-research.lookup_papers" &&
      /Scholarly research lookup returned 1 paper/i.test(String(event.text)),
    )).toBe(true);
  });

  it("keeps compound Codex gateway turns from truncating docs, calculator, repo, reflections, web, and papers", async () => {
    process.env.TAVILY_API_KEY = "test-tavily-key";
    process.env.CODEX_AGENT_FAKE_STDOUT = "Compound evidence was available across workstation tools.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    globalThis.fetch = vi.fn(async (url: string) => {
      if (/arxiv\.org/i.test(url)) {
        return {
          ok: true,
          status: 200,
          text: async () => [
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
            "<feed xmlns=\"http://www.w3.org/2005/Atom\">",
            "<entry>",
            "<id>https://arxiv.org/abs/2606.00001</id>",
            "<title>Quantum inequalities for warp constraints</title>",
            "<summary>Bounded abstract about QEI and warp metrics.</summary>",
            "<published>2026-06-01T00:00:00Z</published>",
            "<author><name>A. Researcher</name></author>",
            "</entry>",
            "</feed>",
          ].join(""),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          results: [{
            title: "Current QEI discussion",
            url: "https://example.com/current-qei",
            content: "Current web source about QEI margins.",
          }],
        }),
      };
    }) as typeof fetch;

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-compound-search-reflection",
        agent_runtime: "codex",
        question: "Combine the provided workstation observations into a bounded evidence answer.",
        workstation_gateway_calls: [
          {
            capability_id: "docs.search",
            mode: "read",
            arguments: { query: "Helix Ask", paths: ["docs"], max_hits: 1 },
          },
          {
            capability_id: "scientific-calculator.solve_expression",
            mode: "read",
            arguments: { expression: "6*7" },
          },
          {
            capability_id: "repo.search",
            mode: "read",
            arguments: { query: "workstation_gateway", paths: ["server"], max_hits: 1 },
          },
          {
            capability_id: "theory-badge-graph.reflect_discussion_context",
            mode: "read",
            arguments: { prompt: "Reflect QEI margin in the theory badge graph." },
          },
          {
            capability_id: "civilization-bounds.reflect_system_bounds",
            mode: "read",
            arguments: { prompt: "Reflect QEI margin through civilization bounds." },
          },
          {
            capability_id: "internet-search.search_web",
            mode: "read",
            arguments: { query: "current QEI warp metric constraints", providers: ["tavily"], limit: 1 },
          },
          {
            capability_id: "scholarly-research.lookup_papers",
            mode: "read",
            arguments: { query: "quantum inequalities warp drive", providers: ["arxiv"], limit: 1 },
          },
        ],
      },
      headers: {},
    });

    expect(result.text).toBe("Compound evidence was available across workstation tools.");
    const capabilityIds = (result.debug as any)?.workstation_gateway_call_results?.map((entry: any) => entry.capability_id);
    expect(capabilityIds.slice(0, 7)).toEqual([
        "docs.search",
        "scientific-calculator.solve_expression",
        "repo.search",
        "theory-badge-graph.reflect_discussion_context",
        "civilization-bounds.reflect_system_bounds",
        "internet-search.search_web",
        "scholarly-research.lookup_papers",
      ]);
    expect(capabilityIds).toEqual(expect.arrayContaining([
      "scientific-calculator.show_gateway_solve",
    ]));
    expect(result.turn_transcript_events?.filter((event: any) => event.source_event_type === "tool_observation"))
      .toHaveLength(7);
    expect(result.tool_output_refs).toEqual(expect.arrayContaining([
      expect.stringContaining("internet-search.search_web"),
      expect.stringContaining("scholarly-research.lookup_papers"),
    ]));
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

  it("derives prompt-named Codex calculator gateway calls before trailing answer instructions", async () => {
    const body = {
      turn_id: "ask:test:codex-prompt-named-calculator-smoke",
      agent_runtime: "codex",
      question:
        "Codex UI validation smoke 2026-06-29 20:09: use the Helix workstation gateway capability scientific-calculator.solve_expression with expression 8*9. Answer with the observed expression and result.",
    };

    expect(buildPromptNamedCapabilityGatewayCallRequests(body)).toEqual([
      expect.objectContaining({
        schema: "helix.workstation_gateway.prompt_named_capability_call_request.v1",
        derivation_source: "helix_prompt_named_capability",
        capability_id: "scientific-calculator.solve_expression",
        mode: "read",
        arguments: expect.objectContaining({
          expression: "8*9",
          source_target_intent: expect.objectContaining({
            target_source: "scientific_calculator",
            target_kind: "calculator_solve",
            expression: "8*9",
          }),
        }),
      }),
    ]);
    expect(buildPromptDerivedCalculatorSolveGatewayCallRequests(body)).toEqual([
      expect.objectContaining({
        capability_id: "scientific-calculator.solve_expression",
        arguments: expect.objectContaining({
          expression: "8*9",
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
      capability_id: "scientific-calculator.solve_expression",
      observation: {
        schema: "helix.calculator_solve_observation.v1",
        expression: "8*9",
        result: "72",
      },
      observation_packet: {
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("derives percent-of calculator phrases for Codex gateway normalization", () => {
    const body = {
      turn_id: "ask:test:codex-percent-of-calculator-prompt",
      agent_runtime: "codex",
      question:
        "Use the current document as context, then use the calculator to compute 12.5% of 54176.",
    };

    expect(buildPromptDerivedCalculatorSolveGatewayCallRequests(body)).toEqual([
      expect.objectContaining({
        capability_id: "scientific-calculator.solve_expression",
        arguments: expect.objectContaining({
          expression: "12.5% of 54176",
        }),
      }),
    ]);
  });

  it("keeps explicit Codex docs.search plus repo.search prompts from admitting duplicate or adjacent tools", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "Use docs.search for docs/research/nhm2-current-status-whitepaper-2026-05-02.md with query claim boundary, then use repo.search for workstation_gateway. Distinguish document evidence from implementation evidence.",
        workspace_context_snapshot: {
          activePanel: "scientific-calculator",
          focusedPanel: "scientific-calculator",
          openPanels: ["docs-viewer", "scientific-calculator"],
          activeDocPath: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          hasDocContext: true,
        },
      },
    });

    expect(requests.map((request) => (request as any).capability_id)).toEqual([
      "docs.search",
      "repo.search",
    ]);
    expect(requests.map((request) => (request as any).derivation_source)).toEqual([
      "helix_prompt_named_capability",
      "helix_prompt_named_capability",
    ]);
  });

  it("plans implicit document-plus-repo evidence as a compound outcome without adjacent tools", () => {
    const body = {
      agent_runtime: "codex",
      question:
        "Compare the current document evidence with repo implementation evidence for workstation_gateway, and distinguish what the document claims from what the code proves.",
      workspace_context_snapshot: {
        activePanel: "docs-viewer",
        focusedPanel: "docs-viewer",
        openPanels: ["docs-viewer", "scientific-calculator"],
        activeDocPath: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        hasDocContext: true,
      },
    };

    const planned = buildCompoundCapabilityDependencyGatewayCallRequests(body);
    expect(planned.map((request) => (request as any).capability_id)).toEqual([
      "docs.search",
      "repo.search",
    ]);
    expect(planned.map((request) => (request as any).compound_outcome)).toEqual([
      "inspect_repo_and_doc",
      "inspect_repo_and_doc",
    ]);

    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body,
    });

    expect(requests.map((request) => (request as any).capability_id)).toEqual([
      "docs.search",
      "repo.search",
    ]);
    expect(requests.map((request) => (request as any).derivation_source)).toEqual([
      "helix_compound_capability_dependency_planner",
      "helix_compound_capability_dependency_planner",
    ]);
    expect((requests[0] as any).arguments.source_target_intent).toMatchObject({
      compound_outcome: "inspect_repo_and_doc",
      subgoal_id: "inspect_repo_and_doc:docs_evidence",
      required_observation_kind: "helix.docs_search_observation.v1",
    });
    expect((requests[1] as any).arguments.source_target_intent).toMatchObject({
      compound_outcome: "inspect_repo_and_doc",
      subgoal_id: "inspect_repo_and_doc:repo_evidence",
      required_observation_kind: "helix.repo_search_observation.v1",
    });
  });

  it("executes implicit document-plus-repo compound evidence with per-subgoal rail metadata", async () => {
    const body = {
      turn_id: "ask:test:compound-inspect-repo-and-doc",
      agent_runtime: "codex",
      question:
        "Compare the current document evidence with repo implementation evidence for workstation_gateway, and distinguish what the document claims from what the code proves.",
      workspace_context_snapshot: {
        activePanel: "docs-viewer",
        focusedPanel: "docs-viewer",
        activeDocPath: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        hasDocContext: true,
      },
    };

    const results = await runExplicitWorkstationGatewayCalls({
      body,
      agentRuntime: "codex",
      turnId: "ask:test:compound-inspect-repo-and-doc",
    });

    expect(results.map((result) => result.capability_id)).toEqual([
      "docs.search",
      "repo.search",
    ]);
    expect(results.every((result) => result.ok)).toBe(true);
    expect((results[0].observation as any).compound_dependency_plan).toMatchObject({
      schema: "helix.compound_capability_dependency_plan.v1",
      compound_outcome: "inspect_repo_and_doc",
      rail_status: "satisfied",
      subgoals: [{
        subgoal_id: "inspect_repo_and_doc:docs_evidence",
        requested_capability: "docs.search",
        required_observation_kind: "helix.docs_search_observation.v1",
        satisfied: true,
      }],
    });
    expect((results[1].observation as any).compound_dependency_plan).toMatchObject({
      schema: "helix.compound_capability_dependency_plan.v1",
      compound_outcome: "inspect_repo_and_doc",
      rail_status: "satisfied",
      subgoals: [{
        subgoal_id: "inspect_repo_and_doc:repo_evidence",
        requested_capability: "repo.search",
        required_observation_kind: "helix.repo_search_observation.v1",
        satisfied: true,
      }],
    });
    expect((results[0].observation_packet.state_delta as any).compound_dependency_turn_plan).toMatchObject({
      schema: "helix.compound_capability_dependency_turn_plan.v1",
      compound_outcomes: ["inspect_repo_and_doc"],
      rail_status: "satisfied",
      ordered_subgoals: [
        {
          subgoal_id: "inspect_repo_and_doc:docs_evidence",
          requested_capability: "docs.search",
          executed_capability: "docs.search",
          satisfied: true,
        },
        {
          subgoal_id: "inspect_repo_and_doc:repo_evidence",
          requested_capability: "repo.search",
          executed_capability: "repo.search",
          satisfied: true,
        },
      ],
    });
  });

  it("does not admit implicit docs-plus-repo tools from quoted or future mentions", () => {
    const prompts = [
      'The text says "compare repo and document evidence"; explain the phrase only.',
      "Later we might compare repo implementation evidence with the document, but not now.",
      "Do not search the repo or docs; explain what such a comparison would mean.",
    ];

    for (const question of prompts) {
      const body = {
        agent_runtime: "codex",
        question,
        workspace_context_snapshot: {
          activePanel: "docs-viewer",
          activeDocPath: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          hasDocContext: true,
        },
      };
      expect(buildCompoundCapabilityDependencyGatewayCallRequests(body)).toEqual([]);
    }
  });

  it("plans implicit document-plus-calculator evidence as an ordered compound outcome", async () => {
    const body = {
      turn_id: "ask:test:compound-summarize-and-calculate",
      agent_runtime: "codex",
      question:
        "Use this document as evidence, calculate 6 * 7 as a scalar sanity check, then summarize what the two observations support.",
      workspace_context_snapshot: {
        activePanel: "docs-viewer",
        focusedPanel: "docs-viewer",
        activeDocPath: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        hasDocContext: true,
      },
    };

    const planned = buildCompoundCapabilityDependencyGatewayCallRequests(body);
    expect(planned.map((request) => (request as any).capability_id)).toEqual([
      "docs.search",
      "scientific-calculator.solve_expression",
    ]);
    expect(planned.map((request) => (request as any).compound_outcome)).toEqual([
      "summarize_and_calculate",
      "summarize_and_calculate",
    ]);

    const requests = readWorkstationGatewayCallRequestsForTurn({
      body,
      includePlannerDerived: true,
    });
    expect(requests.map((request) => (request as any).capability_id)).toEqual([
      "docs.search",
      "scientific-calculator.solve_expression",
    ]);

    const results = await runExplicitWorkstationGatewayCalls({
      body,
      agentRuntime: "codex",
      turnId: "ask:test:compound-summarize-and-calculate",
    });

    expect(results.map((result) => result.capability_id)).toEqual([
      "docs.search",
      "scientific-calculator.solve_expression",
    ]);
    expect((results[0].observation as any).compound_dependency_plan).toMatchObject({
      schema: "helix.compound_capability_dependency_plan.v1",
      compound_outcome: "summarize_and_calculate",
      rail_status: "satisfied",
      subgoals: [{
        subgoal_id: "summarize_and_calculate:docs_evidence",
        requested_capability: "docs.search",
        required_observation_kind: "helix.docs_search_observation.v1",
        satisfied: true,
      }],
    });
    expect((results[1].observation as any).compound_dependency_plan).toMatchObject({
      schema: "helix.compound_capability_dependency_plan.v1",
      compound_outcome: "summarize_and_calculate",
      rail_status: "satisfied",
      subgoals: [{
        subgoal_id: "summarize_and_calculate:calculator_scalar",
        requested_capability: "scientific-calculator.solve_expression",
        required_observation_kind: "helix.calculator_solve_observation.v1",
        satisfied: true,
      }],
    });
    expect((results[1].observation_packet.state_delta as any).compound_dependency_turn_plan).toMatchObject({
      schema: "helix.compound_capability_dependency_turn_plan.v1",
      compound_outcomes: ["summarize_and_calculate"],
      rail_status: "satisfied",
      ordered_subgoals: [
        {
          subgoal_id: "summarize_and_calculate:docs_evidence",
          requested_capability: "docs.search",
          executed_capability: "docs.search",
          satisfied: true,
        },
        {
          subgoal_id: "summarize_and_calculate:calculator_scalar",
          requested_capability: "scientific-calculator.solve_expression",
          executed_capability: "scientific-calculator.solve_expression",
          satisfied: true,
        },
      ],
      dependency_edges: [{
        from: "summarize_and_calculate:docs_evidence",
        to: "summarize_and_calculate:calculator_scalar",
      }],
    });
  });

  it("does not plan document-plus-calculator from date-like document paths alone", () => {
    const body = {
      turn_id: "ask:test:compound-docs-date-path-no-calculator",
      agent_runtime: "codex",
      question:
        "Search the active document docs/research/nhm2-current-status-whitepaper-2026-05-02.md and summarize NHM2 current status in two bullets.",
      workspace_context_snapshot: {
        activePanelId: "docs-viewer",
        activeDocumentPath: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        hasDocContext: true,
      },
    };

    expect(buildCompoundCapabilityDependencyGatewayCallRequests(body)).toEqual([]);
    expect(readWorkstationGatewayCallRequestsForTurn({
      body,
      includePlannerDerived: true,
    }).map((request) => (request as any).capability_id)).toEqual(["docs.search"]);
  });

  it("plans document-plus-percent calculator evidence without treating document dates as expressions", () => {
    const body = {
      turn_id: "ask:test:compound-docs-percent-calculator",
      agent_runtime: "codex",
      question:
        "Use the active NHM2 document as context, then use the calculator for 12.5% of 54176 and answer with both pieces.",
      workspace_context_snapshot: {
        activePanelId: "docs-viewer",
        activeDocumentPath: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        hasDocContext: true,
      },
    };

    const planned = buildCompoundCapabilityDependencyGatewayCallRequests(body);
    expect(planned.map((request) => (request as any).capability_id)).toEqual([
      "docs.search",
      "scientific-calculator.solve_expression",
    ]);
    expect((planned[1] as any).arguments.expression).toBe("12.5% of 54176");

    const requests = readWorkstationGatewayCallRequestsForTurn({
      body,
      includePlannerDerived: true,
    });
    expect(requests.map((request) => (request as any).capability_id)).toEqual([
      "docs.search",
      "scientific-calculator.solve_expression",
    ]);
  });

  it("plans research-plus-calculator-plus-reflection compound evidence without one-off route files", () => {
    const body = {
      turn_id: "ask:test:compound-research-quantify-reflect",
      agent_runtime: "codex",
      question:
        "Retrieve research papers and web evidence for quantum inequality margins, calculate 6 * 7 as a small scalar estimate, reflect the claim boundary through the theory badge graph, and apply civilization bounds for social, energy, and material conditions.",
    };

    const planned = buildCompoundCapabilityDependencyGatewayCallRequests(body);
    expect(planned.map((request) => (request as any).capability_id)).toEqual([
      "scholarly-research.lookup_papers",
      "internet-search.search_web",
      "scientific-calculator.solve_expression",
      "theory-badge-graph.reflect_discussion_context",
      "civilization-bounds.reflect_system_bounds",
    ]);
    expect(planned.every((request) => (request as any).compound_outcome === "research_quantify_reflect")).toBe(true);

    const requests = readWorkstationGatewayCallRequestsForTurn({
      body,
      includePlannerDerived: true,
    });
    expect(requests.map((request) => (request as any).capability_id)).toEqual([
      "scholarly-research.lookup_papers",
      "internet-search.search_web",
      "scientific-calculator.solve_expression",
      "theory-badge-graph.reflect_discussion_context",
      "civilization-bounds.reflect_system_bounds",
    ]);
    expect((requests[0] as any).arguments.source_target_intent).toMatchObject({
      compound_outcome: "research_quantify_reflect",
      subgoal_id: "research_quantify_reflect:scholarly_evidence",
      required_observation_kind: "helix.scholarly_research_observation.v1",
    });
    expect((requests[4] as any).arguments.source_target_intent).toMatchObject({
      compound_outcome: "research_quantify_reflect",
      subgoal_id: "research_quantify_reflect:civilization_bounds",
      required_observation_kind: "helix.civilization_bounds_reflection_observation.v1",
    });
  });

  it("binds theory badge calculator templates from sourced numeric paper evidence before running calculator", async () => {
    globalThis.fetch = vi.fn(async (url) => {
      const urlText = String(url);
      if (urlText.includes("export.arxiv.org/api/query")) {
        return {
          ok: true,
          status: 200,
          text: async () => [
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
            "<feed xmlns=\"http://www.w3.org/2005/Atom\">",
            "<entry>",
            "<id>https://arxiv.org/abs/2606.00002</id>",
            "<title>Tokamak thermal pressure proxy values</title>",
            "<summary>Metadata only; operating point values require full text.</summary>",
            "<published>2026-06-02T00:00:00Z</published>",
            "<author><name>A. Plasma Researcher</name></author>",
            "</entry>",
            "</feed>",
          ].join(""),
        };
      }
      return {
        ok: true,
        status: 200,
        headers: { get: (name: string) => name.toLowerCase() === "content-type" ? "text/html" : null },
        arrayBuffer: async () => new TextEncoder().encode([
          "<html><body>",
          "<p>Table 1 reports density n_m3 = 2.26e18 m^-3 [4].</p>",
          "<p>The operating point lists electron temperature T_eV = 164.8 eV [4].</p>",
          "</body></html>",
        ].join(" ")).buffer,
      };
    }) as typeof fetch;

    const body = {
      turn_id: "ask:test:compound-theory-paper-bound-calculator",
      agent_runtime: "codex",
      question:
        "Retrieve research papers for tokamak thermal pressure values, then use scholarly-research.fetch_full_text and scholarly-research.extract_numeric_parameters for n_m3 and T_eV, calculate the tokamak thermal pressure proxy from the theory badge graph, and reflect the claim boundary through the theory badge graph.",
    };

    const planned = buildCompoundCapabilityDependencyGatewayCallRequests(body);
    expect(planned.map((request) => (request as any).capability_id)).toEqual([
      "scholarly-research.lookup_papers",
      "theory-badge-graph.reflect_discussion_context",
    ]);
    expect((planned[0].arguments as any).allow_scholarly_dependent_chain).toBe(true);

    const results = await runExplicitWorkstationGatewayCalls({
      body,
      agentRuntime: "codex",
      turnId: "ask:test:compound-theory-paper-bound-calculator",
    });

    expect(results.map((result) => result.capability_id)).toEqual([
      "scholarly-research.lookup_papers",
      "scholarly-research.fetch_full_text",
      "scholarly-research.extract_numeric_parameters",
      "theory-badge-graph.reflect_discussion_context",
      "scientific-calculator.solve_expression",
    ]);
    expect((results[4].observation as any)).toMatchObject({
      expression: "2260000000000000000*164.8*1.602176634e-19",
      normalized_expression: "2260000000000000000*164.8*1.602176634e-19",
      result: "59.672748298",
      status: "succeeded",
    });
    expect((results[4].gateway_admission.source_target_intent as any)).toMatchObject({
      dependency_binding: "typed_affordance_bound_calculator_expression",
      required_affordance_kinds: expect.arrayContaining([
        "calculator_expression_template",
        "numeric_value_evidence",
        "bound_calculator_expression",
      ]),
      normalized_expression: "2260000000000000000*164.8*1.602176634e-19",
      variable_bindings: expect.arrayContaining([
        expect.objectContaining({
          variable: "n_m3",
          value: "2260000000000000000",
          unit: "m^-3",
          source_ref: expect.stringContaining("scholarly-numeric:"),
        }),
        expect.objectContaining({
          variable: "T_eV",
          value: "164.8",
          unit: "eV",
          source_ref: expect.stringContaining("scholarly-numeric:"),
        }),
      ]),
    });
    expect((results[3].observation as any).compound_dependency_plan).toMatchObject({
      typed_affordance_binding: {
        status: "bound",
        bound_expression: "2260000000000000000*164.8*1.602176634e-19",
        missing_variables: [],
      },
      rail_status: "planned",
    });
    expect((results[4].observation_packet.state_delta as any).compound_dependency_turn_plan).toMatchObject({
      rail_status: "satisfied",
      ordered_subgoals: expect.arrayContaining([
        expect.objectContaining({
          subgoal_id: "research_quantify_reflect:calculator_bound_expression",
          requested_capability: "scientific-calculator.solve_expression",
          executed_capability: "scientific-calculator.solve_expression",
          satisfied: true,
        }),
      ]),
    });
  });

  it("plans scholarly lookup from formula variable meanings instead of literal placeholders", () => {
    const body = {
      turn_id: "ask:test:compound-variable-source-plan",
      agent_runtime: "codex",
      question:
        "Use scholarly-research.lookup_papers to find an accessible tokamak plasma beta or transport paper that reports the data needed to bind the theory badge graph formula inputs. Then use scholarly-research.fetch_full_text and scholarly-research.extract_numeric_parameters with cited units before any calculator step.",
    };

    const planned = buildCompoundCapabilityDependencyGatewayCallRequests(body);
    expect(planned.map((request) => (request as any).capability_id)).toEqual([
      "scholarly-research.lookup_papers",
      "theory-badge-graph.reflect_discussion_context",
    ]);
    const lookupArguments = planned[0].arguments as any;
    expect(lookupArguments.requested_variables).toEqual(["n_m3", "T_eV", "B_T"]);
    expect(lookupArguments.query).toContain("electron density");
    expect(lookupArguments.query).toContain("electron temperature");
    expect(lookupArguments.query).toContain("toroidal magnetic field");
    expect(lookupArguments.query).toContain("parameter table");
    expect(lookupArguments.source_requirement_plan).toMatchObject({
      schema: "helix.source_requirement_plan.v1",
      source_target: "scholarly_research",
      assistant_answer: false,
      raw_content_included: false,
      reasoning_order: [
        "interpret_user_goal",
        "identify_claim_or_calculation",
        "derive_evidence_requirements",
        "build_retrieval_strategy",
        "model_selects_next_admitted_tool_step",
        "normalize_observations",
        "reenter_model_with_evidence",
        "answer_or_fail_closed_after_terminal_authority",
      ],
      retrieval_strategy: {
        schema: "helix.retrieval_strategy.v1",
        avoid_literal_placeholders_only: true,
        fallback_behavior: "explain_missing_evidence_or_requery",
        prefer_sources_with: expect.arrayContaining(["unit-bearing values", "parameter table", "operating point"]),
      },
      reentry_requirements: {
        observation_reentry_required: true,
        model_followup_required_before_terminal: true,
        calculator_requires_bound_expression: true,
        fail_closed_before_claim_without_required_evidence: true,
      },
      hard_gates: expect.arrayContaining([
        "tools_produce_observations_not_answers",
        "calculator_requires_fully_bound_source_backed_expression",
        "terminal_answer_requires_post_observation_reasoning",
      ]),
      evidence_requirements: expect.arrayContaining([
        expect.objectContaining({
          requirement_id: "retrieved_source_evidence",
          terminal_eligible: false,
        }),
        expect.objectContaining({
          requirement_id: "formula_variable_numeric_evidence",
          required_observation_kind: "helix.scholarly_numeric_parameter_observation.v1",
          required_affordance_kinds: expect.arrayContaining(["numeric_value_evidence"]),
          terminal_eligible: false,
        }),
      ]),
    });
    expect(lookupArguments.variable_source_plan).toMatchObject({
      schema: "helix.variable_source_plan.v1",
      formula_variables: ["n_m3", "T_eV", "B_T"],
      assistant_answer: false,
      raw_content_included: false,
      entries: expect.arrayContaining([
        expect.objectContaining({
          variable: "n_m3",
          canonical_quantity: "electron_or_plasma_number_density",
          expected_unit: "m^-3",
          source_classes: expect.arrayContaining(["plasma parameter table", "density profile diagnostics"]),
          extraction_aliases: expect.arrayContaining(["electron density", "plasma density"]),
        }),
        expect.objectContaining({
          variable: "T_eV",
          canonical_quantity: "electron_temperature_energy",
          expected_unit: "eV",
          source_classes: expect.arrayContaining(["temperature profile diagnostics"]),
          extraction_aliases: expect.arrayContaining(["electron temperature"]),
        }),
        expect.objectContaining({
          variable: "B_T",
          canonical_quantity: "toroidal_or_background_magnetic_field",
          expected_unit: "T",
          source_classes: expect.arrayContaining(["machine parameter table", "magnetic confinement parameters"]),
          extraction_aliases: expect.arrayContaining(["toroidal magnetic field"]),
        }),
      ]),
    });
    expect(lookupArguments.allow_scholarly_dependent_chain).toBe(true);
    expect(lookupArguments.source_target_intent).toMatchObject({
      source_requirement_plan: {
        schema: "helix.source_requirement_plan.v1",
        reentry_requirements: {
          model_followup_required_before_terminal: true,
        },
      },
      query_plan: {
        schema: "helix.scholarly_variable_source_query_plan.v1",
        formula_variables: ["n_m3", "T_eV", "B_T"],
        source_classes: expect.arrayContaining([
          "plasma parameter table",
          "temperature profile diagnostics",
          "machine parameter table",
        ]),
      },
    });
  });

  it("does not auto-fetch or extract after relevant lookup unless the prompt explicitly requests the full-text numeric chain", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => [
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
        "<feed xmlns=\"http://www.w3.org/2005/Atom\">",
        "<entry>",
        "<id>https://arxiv.org/abs/2606.00006</id>",
        "<title>Tokamak plasma thermal pressure operating point</title>",
        "<summary>Tokamak plasma paper discussing electron density, electron temperature, and magnetic confinement parameters.</summary>",
        "<published>2026-06-06T00:00:00Z</published>",
        "<author><name>D. Plasma Researcher</name></author>",
        "</entry>",
        "</feed>",
      ].join(""),
    })) as typeof fetch;

    const body = {
      turn_id: "ask:test:default-research-does-not-auto-dependent-chain",
      agent_runtime: "codex",
      question:
        "Retrieve research papers for tokamak thermal pressure values, calculate the tokamak thermal pressure proxy from the theory badge graph for n_m3 and T_eV, and reflect the claim boundary through the theory badge graph.",
    };

    const planned = buildCompoundCapabilityDependencyGatewayCallRequests(body);
    expect((planned[0].arguments as any).allow_scholarly_dependent_chain).toBe(false);

    const results = await runExplicitWorkstationGatewayCalls({
      body,
      agentRuntime: "codex",
      turnId: "ask:test:default-research-does-not-auto-dependent-chain",
    });

    expect(results.map((result) => result.capability_id)).toEqual([
      "scholarly-research.lookup_papers",
      "theory-badge-graph.reflect_discussion_context",
    ]);
    expect(results.map((result) => result.capability_id)).not.toContain("scholarly-research.fetch_full_text");
    expect(results.map((result) => result.capability_id)).not.toContain("scholarly-research.extract_numeric_parameters");
  });

  it("admits explicitly named scholarly full-text and numeric extraction as a dependent research chain", async () => {
    globalThis.fetch = vi.fn(async (url) => {
      const urlText = String(url);
      if (urlText.includes("export.arxiv.org/api/query")) {
        return {
          ok: true,
          status: 200,
          text: async () => [
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
            "<feed xmlns=\"http://www.w3.org/2005/Atom\">",
            "<entry>",
            "<id>https://arxiv.org/abs/2606.00004</id>",
            "<title>Plasma magnetic confinement operating point</title>",
            "<summary>Metadata only; operating point values require full text.</summary>",
            "<published>2026-06-04T00:00:00Z</published>",
            "<author><name>C. Plasma Researcher</name></author>",
            "</entry>",
            "</feed>",
          ].join(""),
        };
      }
      return {
        ok: true,
        status: 200,
        headers: { get: (name: string) => name.toLowerCase() === "content-type" ? "text/html" : null },
        arrayBuffer: async () => new TextEncoder().encode([
          "<html><body>",
          "<p>The cited density is n_m3 = 2.26e18 m^-3 [7].</p>",
          "<p>The cited electron temperature is T_eV = 164.8 eV [7].</p>",
          "</body></html>",
        ].join(" ")).buffer,
      };
    }) as typeof fetch;

    const body = {
      turn_id: "ask:test:explicit-scholarly-full-text-numeric-chain",
      agent_runtime: "codex",
      question:
        "Use scholarly-research.lookup_papers for magnetic confinement plasma density and temperature values, then use scholarly-research.fetch_full_text, then use scholarly-research.extract_numeric_parameters for n_m3 and T_eV from cited text, then use scientific-calculator.solve_expression with expression 6*7. Answer only from the observations.",
    };

    const planned = buildCompoundCapabilityDependencyGatewayCallRequests(body);
    expect(planned.map((request) => (request as any).capability_id)).toEqual([
      "scholarly-research.lookup_papers",
      "scientific-calculator.solve_expression",
    ]);

    const results = await runExplicitWorkstationGatewayCalls({
      body,
      agentRuntime: "codex",
      turnId: "ask:test:explicit-scholarly-full-text-numeric-chain",
    });

    expect(results.map((result) => result.capability_id)).toEqual([
      "scholarly-research.lookup_papers",
      "scholarly-research.fetch_full_text",
      "scholarly-research.extract_numeric_parameters",
      "scientific-calculator.solve_expression",
    ]);
    expect((results[2].gateway_admission.source_target_intent as any)).toMatchObject({
      source_requirement_plan: {
        schema: "helix.source_requirement_plan.v1",
        reentry_requirements: {
          observation_reentry_required: true,
          model_followup_required_before_terminal: true,
        },
      },
      variable_source_plan: {
        schema: "helix.variable_source_plan.v1",
        formula_variables: ["n_m3", "T_eV"],
      },
      source_classes: expect.arrayContaining(["plasma parameter table", "temperature profile diagnostics"]),
      extraction_aliases: expect.arrayContaining(["electron density", "electron temperature"]),
    });
    expect((results[2].observation as any)).toMatchObject({
      schema: "helix.scholarly_numeric_parameter_observation.v1",
      selected_for_answer: true,
      missing_variables: [],
      parameters: expect.arrayContaining([
        expect.objectContaining({
          variable: "n_m3",
          normalized_value: 2260000000000000000,
          normalized_unit: "m^-3",
        }),
        expect.objectContaining({
          variable: "T_eV",
          normalized_value: 164.8,
          normalized_unit: "eV",
        }),
      ]),
    });
    expect((results[3].observation as any)).toMatchObject({
      expression: "6*7",
      result: "42",
      status: "succeeded",
    });
  });

  it("does not auto-fetch or extract from irrelevant scholarly lookup results", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => [
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
        "<feed xmlns=\"http://www.w3.org/2005/Atom\">",
        "<entry>",
        "<id>https://arxiv.org/abs/2606.00005</id>",
        "<title>Test of lepton flavour universality using B0 decays</title>",
        "<summary>Measurements of branching fractions in B meson decays from collider data.</summary>",
        "<published>2026-06-05T00:00:00Z</published>",
        "<author><name>C. Collider Researcher</name></author>",
        "</entry>",
        "</feed>",
      ].join(""),
    })) as typeof fetch;

    const body = {
      turn_id: "ask:test:irrelevant-scholarly-lookup-stops-dependent-chain",
      agent_runtime: "codex",
      question:
        "Use scholarly-research.lookup_papers for DIII-D or EAST tokamak operating parameters: electron density, electron temperature, toroidal magnetic field, plasma current, and confinement/transport parameter table. Then use scholarly-research.fetch_full_text on the best accessible tokamak paper and scholarly-research.extract_numeric_parameters only if the paper is relevant. Reflect the theory badge graph and calculate beta only after cited values are bound.",
    };

    const results = await runExplicitWorkstationGatewayCalls({
      body,
      agentRuntime: "codex",
      turnId: "ask:test:irrelevant-scholarly-lookup-stops-dependent-chain",
    });

    expect(results.map((result) => result.capability_id)).toEqual([
      "scholarly-research.lookup_papers",
      "theory-badge-graph.reflect_discussion_context",
    ]);
    expect(results.map((result) => result.capability_id)).not.toContain("scholarly-research.fetch_full_text");
    expect(results.map((result) => result.capability_id)).not.toContain("scholarly-research.extract_numeric_parameters");
    expect((results[0].observation as any)).toMatchObject({
      lookup_relevance_gate: {
        schema: "helix.scholarly_lookup_relevance_gate.v1",
        status: "blocked",
        code: "lookup_result_irrelevant",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      missing_requirements: expect.arrayContaining(["lookup_result_irrelevant"]),
      selected_for_answer: false,
    });
    expect((results[0].observation_packet.state_delta as any).compound_dependency_plan).toMatchObject({
      first_broken_rail: {
        subgoal_id: "research_quantify_reflect:scholarly_full_text",
        capability_id: "scholarly-research.fetch_full_text",
        reason: "lookup_result_irrelevant",
      },
      rail_status: "blocked",
    });
  });

  it("fails closed with typed missing variables when paper evidence cannot bind a theory calculator template", async () => {
    globalThis.fetch = vi.fn(async (url) => {
      const urlText = String(url);
      if (urlText.includes("export.arxiv.org/api/query")) {
        return {
          ok: true,
          status: 200,
          text: async () => [
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
            "<feed xmlns=\"http://www.w3.org/2005/Atom\">",
            "<entry>",
            "<id>https://arxiv.org/abs/2606.00003</id>",
            "<title>Tokamak thermal pressure discussion without operating point</title>",
            "<summary>This paper discusses tokamak thermal pressure proxies but does not report density or temperature values.</summary>",
            "<published>2026-06-03T00:00:00Z</published>",
            "<author><name>B. Plasma Researcher</name></author>",
            "</entry>",
            "</feed>",
          ].join(""),
        };
      }
      return {
        ok: true,
        status: 200,
        headers: { get: (name: string) => name.toLowerCase() === "content-type" ? "text/html" : null },
        arrayBuffer: async () => new TextEncoder().encode("<html><body><p>This paper discusses pressure only in qualitative terms [5].</p></body></html>").buffer,
      };
    }) as typeof fetch;

    const body = {
      turn_id: "ask:test:compound-theory-paper-missing-calculator-values",
      agent_runtime: "codex",
      question:
        "Retrieve research papers for tokamak thermal pressure values, then use scholarly-research.fetch_full_text and scholarly-research.extract_numeric_parameters for n_m3 and T_eV, calculate the tokamak thermal pressure proxy from the theory badge graph, and reflect the claim boundary through the theory badge graph.",
    };

    const results = await runExplicitWorkstationGatewayCalls({
      body,
      agentRuntime: "codex",
      turnId: "ask:test:compound-theory-paper-missing-calculator-values",
    });

    expect(results.map((result) => result.capability_id)).toEqual([
      "scholarly-research.lookup_papers",
      "scholarly-research.fetch_full_text",
      "scholarly-research.extract_numeric_parameters",
      "theory-badge-graph.reflect_discussion_context",
    ]);
    expect((results[3].observation as any).compound_dependency_plan).toMatchObject({
      typed_affordance_binding: {
        status: "blocked",
        reason: "missing_numeric_value_evidence",
        rejected_expression: "p_Pa = n_m3*T_eV*e_charge",
        missing_variables: expect.arrayContaining(["n_m3", "T_eV"]),
      },
      first_broken_rail: {
        subgoal_id: "research_quantify_reflect:calculator_bound_expression",
        capability_id: "scientific-calculator.solve_expression",
        reason: "missing_numeric_value_evidence",
        missing_variables: expect.arrayContaining(["n_m3", "T_eV"]),
      },
      rail_status: "blocked",
    });
    expect((results[3].observation_packet.state_delta as any).compound_dependency_turn_plan).toMatchObject({
      rail_status: "blocked",
      first_broken_rail: expect.objectContaining({
        subgoal_id: "research_quantify_reflect:numeric_parameters",
        requested_capability: "scholarly-research.extract_numeric_parameters",
        error: "missing_requested_numeric_variables",
      }),
    });
  });

  it("does not admit research compound tools from quoted, negated, or future mentions", () => {
    const prompts = [
      'The text says "retrieve research papers, calculate 6 * 7, and reflect through civilization bounds"; explain the sentence only.',
      "Do not retrieve research papers, calculate, or reflect; describe what that workflow would require.",
      "Later we might retrieve papers, calculate an estimate, and reflect through the theory badge graph, but not now.",
    ];
    for (const question of prompts) {
      expect(buildCompoundCapabilityDependencyGatewayCallRequests({
        agent_runtime: "codex",
        question,
      })).toEqual([]);
    }
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
    expect(result.workstation_actions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "open_doc_at_line",
        doc_path: "docs/helix-ask-flow.md",
        line: expect.any(Number),
        observation_ref: expect.stringContaining("docs.search"),
      }),
    ]));
    expect((result.debug as any)?.codex_host_workstation_affordances?.workstation_actions)
      .toEqual(result.workstation_actions);

    const artifactQueryIndex = buildArtifactQueryIndex({
      turnId: "ask:test:codex-retained-doc-context-after-calculator-focus",
      payload: {
        ...result,
        turn_id: "ask:test:codex-retained-doc-context-after-calculator-focus",
      } as any,
    });
    expect(artifactQueryIndex.codex_parity_agent_spine_rail_table).toMatchObject({
      requested_capability: "docs.search",
      selected_capability: "docs.search",
      executed_capability: "docs.search",
      rail_status: "complete",
      codex_parity_class: "complete",
    });
    expect(artifactQueryIndex.tool_turn_chain_audit).toMatchObject({
      requested_capability: "docs.search",
      executed_capability: "docs.search",
      reentry_executed: true,
      rail_status: "complete",
      rail_failure_code: null,
    });

    const debugExportPayload = {
      ...result,
      turn_id: "ask:test:codex-retained-doc-context-after-calculator-focus",
    } as any;
    refreshToolLifecycleRecords({
      turnId: "ask:test:codex-retained-doc-context-after-calculator-focus",
      payload: debugExportPayload,
    });
    const refreshedArtifactQueryIndex = buildArtifactQueryIndex({
      turnId: "ask:test:codex-retained-doc-context-after-calculator-focus",
      payload: debugExportPayload,
    });
    expect(refreshedArtifactQueryIndex.codex_parity_agent_spine_rail_table).toMatchObject({
      requested_capability: "docs.search",
      selected_capability: "docs.search",
      executed_capability: "docs.search",
      reentry_status: "reentered",
      rail_status: "complete",
      codex_parity_class: "complete",
      rail_failure_code: null,
    });
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
    expect(result.workstation_actions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "fill_calculator_expression",
        expression_text: "8 * 9",
        result: "72",
        observation_ref: expect.stringContaining("scientific-calculator.solve_expression"),
      }),
      expect.objectContaining({
        kind: "inspect_workstation_receipt",
        receipt_ref: expect.stringContaining("scientific-calculator.open_panel"),
      }),
      expect.objectContaining({
        kind: "inspect_workstation_receipt",
        receipt_ref: expect.stringContaining("scientific-calculator.focus_panel"),
      }),
      expect.objectContaining({
        kind: "inspect_workstation_receipt",
        receipt_ref: expect.stringContaining("scientific-calculator.show_gateway_solve"),
      }),
    ]));
    expect(result.support_refs).toEqual(expect.arrayContaining([
      expect.stringContaining("scientific-calculator.solve_expression"),
    ]));
    expect(result.tool_output_refs).toEqual(expect.arrayContaining([
      expect.stringContaining("scientific-calculator.solve_expression"),
      expect.stringContaining("scientific-calculator.open_panel"),
      expect.stringContaining("scientific-calculator.focus_panel"),
      expect.stringContaining("scientific-calculator.show_gateway_solve"),
    ]));
    expect((result.debug as any)?.codex_host_workstation_affordances).toMatchObject({
      schema: "helix.codex_host_workstation_affordances.v1",
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      workstation_actions: result.workstation_actions,
      support_refs: result.support_refs,
      tool_output_refs: result.tool_output_refs,
    });
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
        "scientific-calculator.solve_expression",
        "scientific-calculator.open_panel",
        "scientific-calculator.focus_panel",
        "scientific-calculator.show_gateway_solve",
      ]);
    expect((result.debug as any)?.agent_runtime_adapter_contract).toMatchObject({
      selected_agent_provider: {
        permission_profile: {
          id: "read-observe",
          allows: {
            read: true,
            act: false,
            write: false,
            shell: false,
            codeMutation: false,
          },
        },
      },
      workstation_gateway_admitted_capability_ids: expect.arrayContaining([
        "scientific-calculator.solve_expression",
      ]),
      workstation_gateway_projection_receipt_capability_ids: expect.arrayContaining([
        "scientific-calculator.open_panel",
        "scientific-calculator.focus_panel",
        "scientific-calculator.show_gateway_solve",
      ]),
    });
    expect((result.debug as any)?.agent_runtime_adapter_contract?.workstation_gateway_blocked_capability_ids)
      .not.toEqual(expect.arrayContaining([
        "scientific-calculator.open_panel",
        "scientific-calculator.focus_panel",
        "scientific-calculator.show_gateway_solve",
      ]));
    expect(result.turn_transcript_events?.map((event: any) => event.source_event_type)).toEqual([
      "runtime_selected",
      "tool_request",
      "tool_observation",
      "action_request",
      "action_observation",
      "action_request",
      "action_observation",
      "action_request",
      "action_observation",
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
    expect((result as any).tool_lifecycle_trace).toMatchObject({
      schema: "helix.tool_lifecycle_trace.v1",
      requested_capability: "scientific-calculator.solve_expression",
      admitted_capability: "scientific-calculator.solve_expression",
      executed_capability: "scientific-calculator.solve_expression",
      lifecycle_stage: "reentered_solver",
      status: "completed",
      observation_refs: expect.arrayContaining([
        expect.stringContaining("scientific-calculator.solve_expression"),
      ]),
    });
    expect((result as any).tool_followup_decision).toMatchObject({
      schema: "helix.tool_followup_decision.v1",
      next_action: "terminal_answer",
      required_surface_satisfied: true,
      evidence_reentered: true,
    });
    expect((result.debug as any)?.tool_lifecycle_trace).toEqual((result as any).tool_lifecycle_trace);
    expect((result.debug as any)?.tool_followup_decision).toEqual((result as any).tool_followup_decision);
    expect((result.debug as any)?.turn_transcript_events).toEqual(result.turn_transcript_events);

    const artifactQueryIndex = buildArtifactQueryIndex({
      turnId: "ask:test:codex-calculator-visible-trace",
      payload: {
        ...result,
        turn_id: "ask:test:codex-calculator-visible-trace",
      } as any,
    });
    expect(artifactQueryIndex.codex_parity_agent_spine_rail_table).toMatchObject({
      rail_status: "complete",
      codex_parity_class: "complete",
    });
    expect(artifactQueryIndex.tool_turn_chain_audit).toMatchObject({
      requested_capability: "scientific-calculator.solve_expression",
      executed_capability: "scientific-calculator.solve_expression",
      reentry_executed: true,
      rail_status: "complete",
      rail_failure_code: null,
    });
    expect(artifactQueryIndex.active_terminal_rail_status).toMatchObject({
      rail_status: "complete",
    });
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
        "docs.search",
        "scientific-calculator.solve_expression",
        "repo.search",
        "scientific-calculator.open_panel",
        "scientific-calculator.focus_panel",
        "scientific-calculator.show_gateway_solve",
      ]);
    expect((result.debug as any)?.provider_gateway_debug_summary).toMatchObject({
      gateway_call_count: 6,
      gateway_action_receipt_count: 3,
      gateway_successful_action_receipt_count: 3,
      gateway_tool_observation_count: 3,
      gateway_successful_tool_observation_count: 3,
      gateway_observation_count: 3,
      terminal_authority_result: "authorized_by_codex_provider_compound_synthesis",
      final_answer_source: "compound_evidence_synthesis_answer",
      terminal_artifact_kind: "compound_evidence_synthesis_answer",
    });
    expect((result as any).terminal_artifact_kind).toBe("compound_evidence_synthesis_answer");
    expect((result.debug as any)?.compound_evidence_synthesis_answer).toMatchObject({
      schema: "helix.compound_evidence_synthesis_answer.v1",
      answer_text: providerAnswer,
      support_refs: expect.arrayContaining([
        expect.stringContaining("doc_location_matches"),
        expect.stringContaining("calculator_receipt"),
        expect.stringContaining("repo_code_evidence_observation"),
      ]),
    });
    expect((result.debug as any)?.normalized_provider_observation_artifacts?.map((artifact: any) => artifact.kind))
      .toEqual(expect.arrayContaining([
        "doc_location_matches",
        "calculator_receipt",
        "repo_code_evidence_observation",
      ]));
    expect(result.turn_transcript_events?.map((event: any) => event.source_event_type)).toEqual([
      "runtime_selected",
      "tool_request",
      "tool_observation",
      "tool_request",
      "tool_observation",
      "tool_request",
      "tool_observation",
      "action_request",
      "action_observation",
      "action_request",
      "action_observation",
      "action_request",
      "action_observation",
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
    expect((result as any).terminal_artifact_kind).toBe("compound_evidence_synthesis_answer");
    expect((result as any).final_answer_source).toBe("compound_evidence_synthesis_answer");
    expect((result.debug as any)?.workstation_gateway_call_results?.map((entry: any) => entry.capability_id))
      .toEqual([
        "docs.search",
        "scientific-calculator.solve_expression",
        "repo.search",
        "scientific-calculator.open_panel",
        "scientific-calculator.focus_panel",
        "scientific-calculator.show_gateway_solve",
      ]);
    expect(result.turn_transcript_events?.map((event: any) => event.source_event_type)).toEqual([
      "runtime_selected",
      "context_state",
      "tool_request",
      "tool_observation",
      "tool_request",
      "tool_observation",
      "tool_request",
      "tool_observation",
      "action_request",
      "action_observation",
      "action_request",
      "action_observation",
      "action_request",
      "action_observation",
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
    expect(result.workstation_actions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "open_repo_file",
        path: expect.any(String),
        line: expect.any(Number),
        observation_ref: expect.stringContaining("repo.search"),
      }),
    ]));
    expect(result.support_refs).toEqual(expect.arrayContaining([
      expect.stringContaining("repo.search"),
    ]));
    expect((result.debug as any)?.compound_capability_contract).toMatchObject({
      schema: "helix.compound_capability_contract.v1",
      rail_status: "satisfied",
      satisfied_subgoal_count: 3,
    });
  });

  it("completes mixed Codex docs plus percent calculator turns with normalized calculator evidence", async () => {
    const providerAnswer = "The document context is retained and the calculation is 6772.";
    process.env.CODEX_AGENT_FAKE_STDOUT = providerAnswer;
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const turnId = "ask:test:codex-mixed-doc-percent-calculator";
    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: turnId,
        agent_runtime: "codex",
        question:
          "Use the current document as context, then use the calculator to compute 12.5% of 54176. Give a short final answer with both the document-context note and the calculation.",
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

    expect(result.ok).toBe(true);
    expect(result.text).toBe(providerAnswer);
    expect((result as any).terminal_artifact_kind).toBe("compound_evidence_synthesis_answer");
    const calculatorResults = ((result.debug as any)?.workstation_gateway_call_results ?? [])
      .filter((entry: any) => entry.capability_id === "scientific-calculator.solve_expression");
    expect(calculatorResults).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ok: true,
        observation: expect.objectContaining({
          expression: "12.5% of 54176",
          normalized_expression: "(12.5 / 100) * 54176",
          result: "6772",
          status: "succeeded",
        }),
      }),
    ]));
    expect((result.debug as any)?.compound_capability_contract).toMatchObject({
      schema: "helix.compound_capability_contract.v1",
      rail_status: "satisfied",
      satisfied_subgoal_count: 2,
    });

    const artifactQueryIndex = buildArtifactQueryIndex({
      turnId,
      payload: {
        ...result,
        turn_id: turnId,
      } as any,
    });
    expect(artifactQueryIndex.codex_parity_agent_spine_rail_table).toMatchObject({
      requested_capability: "scientific-calculator.solve_expression",
      selected_capability: "scientific-calculator.solve_expression",
      executed_capability: "scientific-calculator.solve_expression",
      reentry_status: "reentered",
      goal_satisfaction: "completed",
      selected_terminal_kind: "compound_evidence_synthesis_answer",
      visible_terminal_kind: "compound_evidence_synthesis_answer",
      rail_status: "complete",
      codex_parity_class: "complete",
      rail_failure_code: null,
    });
  });

  it("derives the Codex workstation acceptance prompt into docs, calculator, scholarly, theory, and civ observations", async () => {
    const providerAnswer = [
      "The observations support a bounded synthesis across the current NHM2 document, the calculator result, paper lookup, theory reflection, and civilization-bounds reflection.",
      "They do not prove physical viability, transport authority, or full-document coverage beyond the materialized observation packets.",
    ].join("\n");
    process.env.CODEX_AGENT_FAKE_STDOUT = providerAnswer;
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => [
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
        "<feed xmlns=\"http://www.w3.org/2005/Atom\">",
        "<entry>",
        "<id>https://arxiv.org/abs/2606.00001</id>",
        "<title>Quantum inequalities for warp constraints</title>",
        "<summary>Bounded abstract about QEI and warp metrics.</summary>",
        "<published>2026-06-01T00:00:00Z</published>",
        "<author><name>A. Researcher</name></author>",
        "</entry>",
        "</feed>",
      ].join(""),
    })) as typeof fetch;

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-natural-acceptance-compound-itinerary",
        agent_runtime: "codex",
        question:
          "use this current NHM2 document, calculate 6*7, search research papers on arXiv for quantum inequalities and warp constraints, reflect QEI margin through theory badge graph, and reflect civilization bounds",
        workspace_context_snapshot: {
          activePanel: "scientific-calculator",
          focusedPanel: "scientific-calculator",
          openPanels: ["docs-viewer", "scientific-calculator"],
          activeDocPath: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          hasDocContext: true,
        },
      },
      headers: {},
    });

    expect(result.text).toBe(providerAnswer);
    expect(result.ok).toBe(true);
    expect((result as any).terminal_artifact_kind).toBe("compound_evidence_synthesis_answer");
    expect((result as any).final_answer_source).toBe("compound_evidence_synthesis_answer");
    const capabilityIds = (result.debug as any)?.workstation_gateway_call_results?.map((entry: any) => entry.capability_id);
    expect(capabilityIds).toEqual(expect.arrayContaining([
      "docs.search",
      "scientific-calculator.solve_expression",
      "scholarly-research.lookup_papers",
      "theory-badge-graph.reflect_discussion_context",
      "civilization-bounds.reflect_system_bounds",
    ]));
    expect(capabilityIds.slice(0, 5)).toEqual([
      "docs.search",
      "scientific-calculator.solve_expression",
      "theory-badge-graph.reflect_discussion_context",
      "civilization-bounds.reflect_system_bounds",
      "scholarly-research.lookup_papers",
    ]);
    expect(result.turn_transcript_events?.[0]).toMatchObject({
      source_event_type: "runtime_selected",
    });
    expect(String(result.turn_transcript_events?.[0]?.text)).toContain("Codex Workstation Mode");
    for (const capabilityId of [
      "docs.search",
      "scientific-calculator.solve_expression",
      "scholarly-research.lookup_papers",
      "theory-badge-graph.reflect_discussion_context",
      "civilization-bounds.reflect_system_bounds",
    ]) {
      expect(result.turn_transcript_events?.some((event: any) =>
        event.source_event_type === "tool_request" &&
        event.capability_id === capabilityId,
      )).toBe(true);
      expect(result.turn_transcript_events?.some((event: any) =>
        event.source_event_type === "tool_observation" &&
        event.capability_id === capabilityId &&
        event.status === "completed",
      )).toBe(true);
    }
    expect(result.turn_transcript_events?.filter((event: any) => event.source_event_type === "model_reentry"))
      .toHaveLength(1);
    expect(result.turn_transcript_events?.find((event: any) => event.source_event_type === "terminal_answer"))
      .toMatchObject({
        text: providerAnswer,
      });
    expect((result.debug as any)?.normalized_provider_observation_artifacts?.map((artifact: any) => artifact.kind))
      .toEqual(expect.arrayContaining([
        "doc_location_matches",
        "calculator_receipt",
        "helix_theory_context_reflection_tool_receipt",
        "helix_civilization_bounds_tool_result",
        "scholarly_research_observation",
      ]));
    expect((result.debug as any)?.provider_observation_normalization_failures).toEqual([]);
    expect((result.debug as any)?.compound_capability_contract).toMatchObject({
      schema: "helix.compound_capability_contract.v1",
      rail_status: "satisfied",
      satisfied_subgoal_count: 5,
    });
    expect((result.debug as any)?.compound_evidence_synthesis_answer).toMatchObject({
      schema: "helix.compound_evidence_synthesis_answer.v1",
      answer_text: providerAnswer,
      support_refs: expect.arrayContaining([
        expect.stringContaining("doc_location_matches"),
        expect.stringContaining("calculator_receipt"),
        expect.stringContaining("helix_theory_context_reflection_tool_receipt"),
        expect.stringContaining("helix_civilization_bounds_tool_result"),
        expect.stringContaining("scholarly_research_observation"),
      ]),
    });
    expect((result.debug as any)?.terminal_artifact_kind).toBe("compound_evidence_synthesis_answer");
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
      { capability_id: "scientific-calculator.solve_expression", ok: true },
      { capability_id: "theory-badge-graph.reflect_discussion_context", ok: false },
      { capability_id: "scientific-calculator.open_panel", ok: true },
      { capability_id: "scientific-calculator.focus_panel", ok: true },
      { capability_id: "scientific-calculator.show_gateway_solve", ok: true },
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

  it("does not publish Codex read-aloud claims when docs evidence exists but narrator receipt is blocked", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "I read the document aloud.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-compound-read-aloud-voice-blocked",
        agent_runtime: "codex",
        question: "Use the explicit workstation gateway calls to read aloud the document excerpt, then answer.",
        workstation_gateway_calls: [
          {
            capability_id: "docs-viewer.read_visible_surface",
            mode: "read",
            arguments: {
              label: "document excerpt",
              source_doc_path: "docs/needle-hull-mainframe.md",
              source_target_intent: {
                source: "helix_compound_capability_dependency_planner",
                compound_outcome: "read_aloud_surface",
                subgoal_id: "read_aloud_surface:surface_observation",
                subgoal_ordinal: 1,
                target_source: "docs_viewer",
                target_kind: "docs_visible_surface",
                required_observation_kind: "helix.workstation_readable_surface_observation.v1",
                dependency_edges: [{
                  from: "read_aloud_surface:surface_observation",
                  to: "read_aloud_surface:narrator_receipt",
                  binding: "surface_observation_to_voice_text",
                }],
              },
            },
          },
          {
            capability_id: "live_env.narrator_say",
            mode: "act",
            arguments: {
              text: "Needle hull document excerpt.",
              kind: "narrator_read",
              requires_confirmation: true,
              source_target_intent: {
                source: "helix_compound_capability_dependency_planner",
                compound_outcome: "read_aloud_surface",
                subgoal_id: "read_aloud_surface:narrator_receipt",
                subgoal_ordinal: 2,
                target_source: "voice_delivery",
                target_kind: "narrator_say",
                required_receipt_kind: "helix.interim_voice_callout_tool_result.v1",
                depends_on_subgoal_id: "read_aloud_surface:surface_observation",
                depends_on_capability_id: "docs-viewer.read_visible_surface",
                dependency_binding: "surface_observation_to_voice_text",
              },
            },
          },
        ],
      },
      headers: {},
    });

    expect(result.ok).toBe(false);
    expect(result.text).toContain("I cannot claim the requested workstation tool or UI action ran");
    expect(result.text).toContain("live_env.narrator_say: blocked_policy");
    expect(result.text).not.toContain("I read the document aloud");
    expect((result.debug as any)?.workstation_gateway_call_results?.map((entry: any) => ({
      capability_id: entry.capability_id,
      ok: entry.ok,
      status: entry.observation_packet?.status,
      blocked_reason: entry.gateway_admission?.blocked_reason,
    }))).toEqual([
      {
        capability_id: "docs-viewer.read_visible_surface",
        ok: true,
        status: "succeeded",
        blocked_reason: undefined,
      },
      {
        capability_id: "live_env.narrator_say",
        ok: false,
        status: "blocked",
        blocked_reason: "blocked_policy",
      },
    ]);
    expect((result.debug as any)?.workstation_gateway_call_results?.[0]?.observation_packet?.state_delta)
      .toMatchObject({
        compound_dependency_turn_plan: {
          schema: "helix.compound_capability_dependency_turn_plan.v1",
          compound_outcomes: ["read_aloud_surface"],
          rail_status: "blocked",
          first_broken_rail: {
            subgoal_id: "read_aloud_surface:narrator_receipt",
            requested_capability: "live_env.narrator_say",
            satisfied: false,
            error: "blocked_policy",
          },
          ordered_subgoals: [
            {
              subgoal_id: "read_aloud_surface:surface_observation",
              requested_capability: "docs-viewer.read_visible_surface",
              executed_capability: "docs-viewer.read_visible_surface",
              satisfied: true,
            },
            {
              subgoal_id: "read_aloud_surface:narrator_receipt",
              requested_capability: "live_env.narrator_say",
              executed_capability: null,
              required_receipt_kind: "helix.interim_voice_callout_tool_result.v1",
              satisfied: false,
              rail_status: "missing_observation",
            },
          ],
        },
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
    expect((result.debug as any)?.terminal_authority_status).toBe("blocked_by_observation_state");
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

  it("does not derive active workstation context when the prompt explicitly forbids tools", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT =
      "I am using codex / Codex Workstation Mode through the helix_agent_provider_edge adapter boundary.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const body = {
      turn_id: "ask:test:codex-no-tool-provider-identity",
      agent_runtime: "codex",
      question: "Do not open panels or run tools. Just tell me which provider you are using and whether you can see the workstation capability manifest.",
      workspace_context_snapshot: {
        activePanel: "docs-viewer",
        activeGroupId: "main",
        groupCount: 1,
        openPanels: ["docs-viewer", "scientific-calculator"],
      },
    };

    expect(buildActiveWorkstationContextGatewayCallRequests(body)).toEqual([]);

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body,
      headers: {},
    });

    expect(result.text).toContain("codex / Codex Workstation Mode");
    expect(result.text).toContain("helix_agent_provider_edge");
    expect((result.debug as any)?.workstation_gateway_call_results).toEqual([]);
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "tool_request" || event.source_event_type === "tool_observation",
    )).toBe(false);
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

  it("authorizes no-tool Codex explanations for quoted or negated voice capability mentions", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT =
      "`live_env.request_interim_voice_callout` is a voice request capability name. In this prompt it is text only, and I did not run or request a voice tool.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-quoted-voice-no-tool-final",
        agent_runtime: "codex",
        question:
          "The text says live_env.request_interim_voice_callout; explain that phrase as text only. Do not speak or run any voice tool.",
      },
      headers: {},
    });

    expect(result.ok).toBe(true);
    expect(result.response_type).toBe("final_answer");
    expect(result.final_status).toBe("completed");
    expect(result.final_answer_source).toBe("agent_provider_terminal_candidate");
    expect(result.terminal_artifact_kind).toBe("agent_provider_terminal_candidate");
    expect(result.text).toContain("text only");
    expect(result.text).toContain("did not run");
    expect((result.debug as any)?.terminal_answer_authority).toMatchObject({
      schema: "helix.turn_terminal_authority.v1",
      final_answer_source: "agent_provider_terminal_candidate",
      terminal_artifact_kind: "agent_provider_terminal_candidate",
      server_authoritative: true,
      terminal_eligible: true,
      assistant_answer: false,
    });
    expect((result.debug as any)?.terminal_authority_status).toBe("authorized_no_gateway_tool_required");
    expect((result.debug as any)?.workstation_gateway_call_results).toEqual([]);
    expect((result.debug as any)?.workstation_gateway_observation_packets).toEqual([]);
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "action_request" &&
      event.capability_id === "live_env.request_interim_voice_callout",
    )).toBe(false);
  });

  it("plans and executes readable surface observation before narrator receipt for read-aloud current document", async () => {
    const body = {
      turn_id: "ask:test:compound-read-aloud-current-doc",
      agent_runtime: "codex",
      question: "Read aloud parts of this document.",
      workspace_context_snapshot: {
        activePanel: "docs-viewer",
        activeDocPath: "docs/needle-hull-mainframe.md",
      },
    };

    const planned = buildCompoundCapabilityDependencyGatewayCallRequests(body);
    expect(planned).toHaveLength(1);
    expect(planned[0]).toMatchObject({
      compound_outcome: "read_aloud_surface",
      capability_id: "docs-viewer.read_visible_surface",
      dependent_capability_id: "live_env.narrator_say",
      arguments: {
        source_doc_path: "docs/needle-hull-mainframe.md",
        source_target_intent: {
          dependency_edges: [{
            from: "read_aloud_surface:surface_observation",
            to: "read_aloud_surface:narrator_receipt",
            binding: "surface_observation_to_voice_text",
          }],
        },
      },
    });

    const results = await runExplicitWorkstationGatewayCalls({
      body,
      agentRuntime: "codex",
      turnId: "ask:test:compound-read-aloud-current-doc",
    });

    expect(results.map((result) => result.capability_id)).toEqual([
      "docs-viewer.read_visible_surface",
      "live_env.narrator_say",
    ]);
    expect(results[0].ok).toBe(true);
    expect(results[0].observation_packet.status).toBe("succeeded");
    expect(results[1].ok).toBe(true);
    expect(results[1].observation).toMatchObject({
      schema: "helix.interim_voice_callout_tool_result.v1",
      status: "succeeded",
      receipt: {
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      host_projection: {
        kind: "voice_playback_request",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect((results[1].observation as any).request.text).toContain("docs/needle-hull-mainframe.md");
    expect((results[1].gateway_admission.source_target_intent as any).depends_on_capability_id).toBe("docs-viewer.read_visible_surface");
    expect((results[1].gateway_admission.source_target_intent as any).dependency_binding).toBe("surface_observation_to_voice_text");
    expect((results[0].observation as any).compound_dependency_plan).toMatchObject({
      schema: "helix.compound_capability_dependency_plan.v1",
      compound_outcome: "read_aloud_surface",
      rail_status: "planned",
      first_broken_rail: null,
      dependency_edges: [{
        from: "read_aloud_surface:surface_observation",
        to: "read_aloud_surface:narrator_receipt",
        status: "planned",
      }],
    });
    expect((results[1].observation_packet.state_delta as any).compound_dependency_turn_plan).toMatchObject({
      schema: "helix.compound_capability_dependency_turn_plan.v1",
      compound_outcomes: ["read_aloud_surface"],
      rail_status: "satisfied",
      ordered_subgoals: [
        {
          subgoal_id: "read_aloud_surface:surface_observation",
          requested_capability: "docs-viewer.read_visible_surface",
          executed_capability: "docs-viewer.read_visible_surface",
          satisfied: true,
        },
        {
          subgoal_id: "read_aloud_surface:narrator_receipt",
          requested_capability: "live_env.narrator_say",
          executed_capability: "live_env.narrator_say",
          required_receipt_kind: "helix.interim_voice_callout_tool_result.v1",
          satisfied: true,
        },
      ],
      dependency_edges: [{
        from: "read_aloud_surface:surface_observation",
        to: "read_aloud_surface:narrator_receipt",
      }],
    });
  });

  it("routes read-aloud visible translated doc block through surface observation before narrator", async () => {
    const body = {
      turn_id: "ask:test:compound-read-aloud-translated-doc",
      agent_runtime: "codex",
      question: "Read aloud the visible translated section of this document.",
      workspace_context_snapshot: {
        activePanel: "docs-viewer",
        activeDocPath: "docs/helix-ask-flow.md",
        activeTranslationAccountLocale: "es-MX",
        activeTranslationTargetLanguage: "es",
        activeTranslationBlocks: [{
          unit_id: "unit:flow:1",
          source_text: "Helix Ask flow",
          translated_text: "Flujo de Helix Ask",
          locale: "es",
          status: "ready",
        }],
      },
    };

    const results = await runExplicitWorkstationGatewayCalls({
      body,
      agentRuntime: "codex",
      turnId: "ask:test:compound-read-aloud-translated-doc",
    });

    expect(results.map((result) => result.capability_id)).toEqual([
      "docs-viewer.read_active_translation",
      "live_env.narrator_say",
    ]);
    expect(results[0]).toMatchObject({
      ok: true,
      observation: {
        schema: "helix.workstation_readable_surface_observation.v1",
        text: "Flujo de Helix Ask",
        translation: expect.objectContaining({
          status: "ready",
          source_unit_ids: ["unit:flow:1"],
        }),
      },
    });
    expect((results[1].observation as any).request.text).toContain("Flujo de Helix Ask");
    expect((results[1].gateway_admission.source_target_intent as any).depends_on_capability_id)
      .toBe("docs-viewer.read_active_translation");
  });

  it("routes read-aloud current calculator result through surface observation before narrator", async () => {
    const body = {
      turn_id: "ask:test:compound-read-aloud-calculator-result",
      agent_runtime: "future",
      question: "Read aloud the current calculator result.",
      workspace_context_snapshot: {
        activePanel: "scientific-calculator",
        calculatorActiveContext: {
          current_latex: "9*8",
          last_result_text: "72",
          last_normalized_expression: "9*8",
        },
      },
    };

    const results = await runExplicitWorkstationGatewayCalls({
      body,
      agentRuntime: "future",
      turnId: "ask:test:compound-read-aloud-calculator-result",
    });

    expect(results.map((result) => result.capability_id)).toEqual([
      "scientific-calculator.read_visible_result",
      "live_env.narrator_say",
    ]);
    expect(results[0]).toMatchObject({
      ok: true,
      observation: {
        schema: "helix.workstation_readable_surface_observation.v1",
        text: "72",
        calculator: expect.objectContaining({
          expression: "9*8",
          result: "72",
          draft_input_distinguished: true,
        }),
      },
    });
    expect((results[1].observation as any).request.text).toContain("72");
    expect((results[1].gateway_admission.source_target_intent as any).depends_on_capability_id)
      .toBe("scientific-calculator.read_visible_result");
  });

  it("resolves named document surface before narrator admission for read-aloud document prompts", async () => {
    const body = {
      turn_id: "ask:test:compound-read-aloud-named-doc",
      agent_runtime: "codex",
      question: "Ok can you read aloud parts of the Helix Ask flow document?",
      workspace_context_snapshot: {
        activePanel: "docs-viewer",
        activeDocPath: "docs/helix-ask-flow.md",
      },
    };

    const planned = buildCompoundCapabilityDependencyGatewayCallRequests(body);
    expect(planned).toHaveLength(1);
    expect(planned[0]).toMatchObject({
      compound_outcome: "read_aloud_surface",
      capability_id: "docs-viewer.read_visible_surface",
      dependent_capability_id: "live_env.narrator_say",
    });

    const results = await runExplicitWorkstationGatewayCalls({
      body,
      agentRuntime: "codex",
      turnId: "ask:test:compound-read-aloud-named-doc",
    });

    expect(results.map((result) => result.capability_id)).toEqual([
      "docs-viewer.read_visible_surface",
      "live_env.narrator_say",
    ]);
    expect((results[0].observation as any).schema).toBe("helix.workstation_readable_surface_observation.v1");
    expect((results[1].observation as any).request.text).toMatch(/Helix Ask/i);
    expect((results[1].observation as any).request.text).not.toMatch(/Document title\/path match/i);
  });

  it("does not run narrator when read-aloud document resolution has no evidence", async () => {
    const body = {
      turn_id: "ask:test:compound-read-aloud-missing-doc",
      agent_runtime: "codex",
      question: "Read aloud parts of the zzzmissing helixtest document.",
    };

    const results = await runExplicitWorkstationGatewayCalls({
      body,
      agentRuntime: "codex",
      turnId: "ask:test:compound-read-aloud-missing-doc",
    });

    expect(results.map((result) => result.capability_id)).toEqual(["docs-viewer.read_visible_surface"]);
    expect((results[0].observation as any).compound_dependency_plan).toMatchObject({
      schema: "helix.compound_capability_dependency_plan.v1",
      compound_outcome: "read_aloud_surface",
      rail_status: "blocked",
      first_broken_rail: {
        subgoal_id: "read_aloud_surface:surface_observation",
        capability_id: "docs-viewer.read_visible_surface",
        reason: "registered_surface_text_missing",
      },
      dependency_edges: [{
        from: "read_aloud_surface:surface_observation",
        to: "read_aloud_surface:narrator_receipt",
        status: "blocked",
      }],
    });
    expect((results[0].observation_packet.state_delta as any).compound_dependency_turn_plan).toMatchObject({
      schema: "helix.compound_capability_dependency_turn_plan.v1",
      compound_outcomes: ["read_aloud_surface"],
      rail_status: "blocked",
      first_broken_rail: {
        subgoal_id: "read_aloud_surface:surface_observation",
        requested_capability: "docs-viewer.read_visible_surface",
        satisfied: false,
      },
      ordered_subgoals: [
        {
          subgoal_id: "read_aloud_surface:surface_observation",
          requested_capability: "docs-viewer.read_visible_surface",
          executed_capability: null,
          satisfied: false,
        },
        {
          subgoal_id: "read_aloud_surface:narrator_receipt",
          requested_capability: "live_env.narrator_say",
          executed_capability: null,
          satisfied: false,
          rail_status: "blocked_by_dependency",
        },
      ],
    });
  });

  it("does not admit read-aloud dependency tools from quoted or explanatory mentions", () => {
    const prompts = [
      'The text says "read aloud parts of this document"; explain that phrase only.',
      "Do not read aloud the current document; just explain what a narrator action would do.",
      "Later we might read aloud parts of this document, but not now.",
    ];
    for (const question of prompts) {
      const body = {
        turn_id: "ask:test:compound-read-aloud-negative",
        agent_runtime: "codex",
        question,
        workspace_context_snapshot: {
          activePanel: "docs-viewer",
          activeDocPath: "docs/needle-hull-mainframe.md",
        },
      };
      expect(buildCompoundCapabilityDependencyGatewayCallRequests(body)).toEqual([]);
      expect(readWorkstationGatewayCallRequestsForTurn({
        body,
        includePlannerDerived: true,
      }).map((request) => (request as any).capability_id)).not.toContain("live_env.narrator_say");
    }
  });

  it("fails closed for selected docs surface reads without a registered surface ref", async () => {
    const body = {
      turn_id: "ask:test:selected-surface-missing-ref",
      agent_runtime: "codex",
      question: "Read the selected paragraph in the docs viewer.",
      workspace_context_snapshot: {
        activePanel: "docs-viewer",
        activeDocPath: "docs/helix-ask-flow.md",
        selectedText: "Selected paragraph text.",
      },
    };

    const planned = readWorkstationGatewayCallRequestsForTurn({
      body,
      includePlannerDerived: true,
    });
    expect(planned.map((request) => (request as any).capability_id)).toContain("docs-viewer.read_visible_surface");
    expect(planned.map((request) => (request as any).capability_id)).not.toContain("live_env.narrator_say");

    const results = await runExplicitWorkstationGatewayCalls({
      body,
      agentRuntime: "codex",
      turnId: "ask:test:selected-surface-missing-ref",
    });

    const surface = results.find((result) => result.capability_id === "docs-viewer.read_visible_surface");
    expect(surface).toBeTruthy();
    expect(surface).toMatchObject({
      ok: false,
      error: "registered_surface_ref_missing",
      observation: {
        schema: "helix.workstation_readable_surface_observation.v1",
        status: "blocked",
        blocked_reason: "registered_surface_ref_missing",
        selection_ref: null,
        selection_kind: "selected",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(results.map((result) => result.capability_id)).not.toContain("live_env.narrator_say");
  });

  it("observes selected docs surface reads when the selected surface is registered", async () => {
    const body = {
      turn_id: "ask:test:selected-surface-ref",
      agent_runtime: "codex",
      question: "Read the selected paragraph in the docs viewer.",
      workspace_context_snapshot: {
        activePanel: "docs-viewer",
        activeDocPath: "docs/helix-ask-flow.md",
        selectedText: "Selected paragraph text.",
        selectionRef: "docs-viewer:selection:unit-42",
      },
    };

    const results = await runExplicitWorkstationGatewayCalls({
      body,
      agentRuntime: "codex",
      turnId: "ask:test:selected-surface-ref",
    });

    const surface = results.find((result) => result.capability_id === "docs-viewer.read_visible_surface");
    expect(surface).toBeTruthy();
    expect(surface).toMatchObject({
      ok: true,
      observation: {
        schema: "helix.workstation_readable_surface_observation.v1",
        text: "Selected paragraph text.",
        selection_ref: "docs-viewer:selection:unit-42",
        selection_kind: "selected",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(results.map((result) => result.capability_id)).not.toContain("live_env.narrator_say");
  });

  it("plans translation and summary prompts through readable surface observations without narrator delivery", async () => {
    const translateBody = {
      turn_id: "ask:test:translate-visible-surface",
      agent_runtime: "codex",
      question: "Read the visible already-translated section of this document.",
      workspace_context_snapshot: {
        activePanel: "docs-viewer",
        activeDocPath: "docs/helix-ask-flow.md",
        activeTranslationAccountLocale: "es-MX",
        activeTranslationTargetLanguage: "es",
        activeTranslationBlocks: [{
          unit_id: "doc-unit:1",
          source_text: "Original sentence.",
          translated_text: "Translated sentence.",
          locale: "es",
          status: "ready",
        }],
      },
    };
    const translateResults = await runExplicitWorkstationGatewayCalls({
      body: translateBody,
      agentRuntime: "codex",
      turnId: "ask:test:translate-visible-surface",
    });
    const translationSurface = translateResults.find((result) => result.capability_id === "docs-viewer.read_active_translation");
    expect(translationSurface).toBeTruthy();
    expect((translationSurface?.gateway_admission.source_target_intent as any)).toMatchObject({
      surface_outcome: "translate_visible_surface",
      required_observation_kind: "helix.workstation_readable_surface_observation.v1",
      narrator_requested: false,
      terminal_eligible: false,
      account_locale: "es-MX",
      target_language: "es",
    });
    expect((translationSurface?.observation as any).text).toBe("Translated sentence.");
    expect((translationSurface?.observation as any).translation).toMatchObject({
      account_locale: "es-MX",
      target_language: "es",
    });
    expect(translateResults.map((result) => result.capability_id)).not.toContain("live_env.narrator_say");

    const summarizeBody = {
      turn_id: "ask:test:summarize-visible-surface",
      agent_runtime: "codex",
      question: "Summarize the visible section of this document.",
      workspace_context_snapshot: {
        activePanel: "docs-viewer",
        activeDocPath: "docs/helix-ask-flow.md",
      },
    };
    const summarizeResults = await runExplicitWorkstationGatewayCalls({
      body: summarizeBody,
      agentRuntime: "codex",
      turnId: "ask:test:summarize-visible-surface",
    });
    const summarySurface = summarizeResults.find((result) => result.capability_id === "docs-viewer.read_visible_surface");
    expect(summarySurface).toBeTruthy();
    expect((summarySurface?.gateway_admission.source_target_intent as any)).toMatchObject({
      surface_outcome: "summarize_visible_surface",
      required_observation_kind: "helix.workstation_readable_surface_observation.v1",
      narrator_requested: false,
      terminal_eligible: false,
    });
    expect((summarySurface?.observation as any).schema).toBe("helix.workstation_readable_surface_observation.v1");
    expect(summarizeResults.map((result) => result.capability_id)).not.toContain("live_env.narrator_say");
  });

  it("does not admit prompt-derived surface observations from negated or contextual mentions", () => {
    const prompts = [
      'The text says "read the selected paragraph"; explain the phrase only.',
      "Do not read the selected paragraph; just explain the surface tool.",
      "Later we might translate the visible section, but not now.",
    ];
    for (const question of prompts) {
      const body = {
        turn_id: "ask:test:surface-negative",
        agent_runtime: "codex",
        question,
        workspace_context_snapshot: {
          activePanel: "docs-viewer",
          activeDocPath: "docs/helix-ask-flow.md",
          selectedText: "Selected paragraph text.",
          selectionRef: "docs-viewer:selection:unit-42",
          activeTranslationBlocks: [{
            unit_id: "doc-unit:1",
            translated_text: "Translated sentence.",
          }],
        },
      };
      expect(readWorkstationGatewayCallRequestsForTurn({
        body,
        includePlannerDerived: true,
      }).map((request) => (request as any).capability_id)).not.toEqual(
        expect.arrayContaining([
          "docs-viewer.read_visible_surface",
          "docs-viewer.read_active_translation",
          "scientific-calculator.read_visible_result",
        ]),
      );
    }
  });

  it("does not answer repository content when no repo search observation exists", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "The repo shows workstation_gateway is fully wired.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-repo-no-observation",
        agent_runtime: "codex",
        question: "Open docs/helix-ask-api-parity-matrix.md and, according to the repo observation, what does workstation_gateway prove?",
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

    expect((result.debug as any)?.workstation_gateway_call_results?.map((entry: any) => entry.capability_id))
      .toEqual(["docs-viewer.open_doc"]);
    expect(result.text).toContain("no repo.search observation packet was materialized");
    expect(result.text).not.toContain("fully wired");
    expect(result.turn_transcript_events?.map((event: any) => event.source_event_type)).toEqual([
      "runtime_selected",
      "action_request",
      "action_observation",
      "model_reentry",
      "terminal_answer",
    ]);
    expect(result.turn_transcript_events?.find((event: any) => event.source_event_type === "terminal_answer"))
      .toMatchObject({
        text: result.text,
        assistant_answer: false,
        raw_content_included: false,
      });
  });

  it("does not answer internet-backed content when no internet search observation exists", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "Current web sources show the claim was validated.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-internet-no-observation",
        agent_runtime: "codex",
        question: "Open docs/helix-ask-api-parity-matrix.md and, according to current web sources, what changed?",
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

    expect((result.debug as any)?.workstation_gateway_call_results?.map((entry: any) => entry.capability_id))
      .toEqual(["docs-viewer.open_doc"]);
    expect(result.text).toContain("no internet-search.search_web observation packet was materialized");
    expect(result.text).not.toContain("validated");
  });

  it("does not answer scholarly paper content when no scholarly observation exists", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "The arXiv papers prove the claim boundary is solved.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-scholarly-no-observation",
        agent_runtime: "codex",
        question: "Open docs/helix-ask-api-parity-matrix.md and, according to arXiv research papers, what evidence supports this?",
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

    expect((result.debug as any)?.workstation_gateway_call_results?.map((entry: any) => entry.capability_id))
      .toEqual(["docs-viewer.open_doc"]);
    expect(result.text).toContain("no scholarly-research.lookup_papers observation packet was materialized");
    expect(result.text).not.toContain("solved");
  });

  it("does not create host workstation actions by scraping Codex final prose", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT =
      "Open docs/helix-ask-flow.md at line 12; also 6 * 7 = 42.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-no-prose-scraped-actions",
        agent_runtime: "codex",
        question: "Give a background-only answer about workstation affordance projection.",
      },
      headers: {},
    });

    expect(result.text).toBe("Open docs/helix-ask-flow.md at line 12; also 6 * 7 = 42.");
    expect(result.workstation_actions).toEqual([]);
    expect(result.support_refs).toEqual([]);
    expect(result.tool_output_refs).toEqual([]);
    expect((result.debug as any)?.codex_host_workstation_affordances).toMatchObject({
      workstation_actions: [],
      support_refs: [],
      tool_output_refs: [],
    });
  });

  it("does not guess host workstation actions from malformed tool outputs", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "The calculator result is available.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-malformed-tool-output-no-action",
        agent_runtime: "codex",
        question: "Use the scientific calculator and answer normally.",
        workstation_gateway_call: {
          capability_id: "scientific-calculator.solve_expression",
          mode: "read",
          arguments: {},
        },
      },
      headers: {},
    });

    expect((result.debug as any)?.workstation_gateway_call_results?.[0]).toMatchObject({
      ok: false,
      capability_id: "scientific-calculator.solve_expression",
    });
    expect(result.workstation_actions).toEqual([]);
    expect(result.support_refs).toEqual([]);
    expect(result.tool_output_refs).toEqual([]);
    expect((result.debug as any)?.codex_host_workstation_affordances).toMatchObject({
      workstation_actions: [],
      support_refs: [],
      tool_output_refs: [],
    });
  });

  it("allows repository content answers when a repo search observation exists", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "The repo observation found workstation_gateway debug-export plumbing.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:test:codex-repo-observation-authorized",
        agent_runtime: "codex",
        question: "Search the repo for workstation_gateway and summarize what the repo observation shows.",
      },
      headers: {},
    });

    expect(result.text).toBe("The repo observation found workstation_gateway debug-export plumbing.");
    expect((result.debug as any)?.workstation_gateway_call_results?.some((entry: any) =>
      entry.ok === true && entry.capability_id === "repo.search",
    )).toBe(true);
    expect(result.turn_transcript_events?.some((event: any) =>
      event.source_event_type === "tool_observation" &&
      event.capability_id === "repo.search",
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
        status: "pending_helix_solver_reentry",
        provider_terminal_candidate_present: true,
        post_tool_model_step_required: true,
        evidence_reentered: false,
        normalized_observation_packet_count: 1,
        normalized_observation_refs: expect.arrayContaining([
          expect.stringContaining("scientific-calculator.solve_expression"),
        ]),
        solver_completed: false,
        goal_satisfaction_compatible: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
      terminalAuthorityCandidateReview: {
        schema: "helix.provider_terminal_authority_candidate_review.v1",
        terminal_authority_status: "blocked_pending_helix_solver_completion",
        terminal_authority_granted: false,
        final_visible_answer_authorized: false,
        blockers: ["helix_solver_completion_required"],
        normalized_observation_refs: expect.arrayContaining([
          expect.stringContaining("scientific-calculator.solve_expression"),
        ]),
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
      providerTerminalAuthorityBridge: {
        schema: "helix.provider_terminal_authority_bridge.v1",
        route_authority_status: "not_authorized",
        terminal_authority_status: "blocked_pending_helix_solver_completion",
        terminal_authority_granted: false,
        final_visible_answer_authorized: false,
        final_answer_source: null,
        terminal_artifact_kind: null,
        terminal_answer_authority: null,
        terminal_presentation: null,
      },
      terminalAnswerAuthority: null,
      terminalPresentation: null,
      workstationGatewayReentryStatus: "pending_helix_solver_reentry",
      terminalAuthorityStatus: "blocked_pending_helix_solver_completion",
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
        terminal_authority_status: "blocked_by_observation_state",
        terminal_authority_granted: false,
        final_visible_answer_authorized: false,
        blockers: ["gateway_observation_missing_or_failed"],
      },
      providerTerminalAuthorityBridge: {
        schema: "helix.provider_terminal_authority_bridge.v1",
        route_authority_status: "not_authorized",
        terminal_authority_status: "blocked_by_observation_state",
        terminal_authority_granted: false,
        final_visible_answer_authorized: false,
        final_answer_source: null,
        terminal_artifact_kind: null,
        terminal_answer_authority: null,
        terminal_presentation: null,
      },
      terminalAnswerAuthority: null,
      terminalPresentation: null,
      terminalAuthorityStatus: "blocked_by_observation_state",
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

  it("emits Codex provider transcript progress through the stream callback before terminal answer", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "Observed expression: 8*9\nResult: 72";
    const streamedEvents: Record<string, unknown>[] = [];

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn/stream",
      body: {
        turn_id: "ask:test:codex-provider-live-progress",
        question: "Use the scientific calculator to solve 8*9.",
        workstation_gateway_call: {
          capability_id: "scientific-calculator.solve_expression",
          arguments: {
            expression: "8*9",
          },
        },
      },
      onTranscriptEvent: (event) => {
        streamedEvents.push(event);
      },
    });

    expect(result.turn_transcript_events?.some((event) => event.source_event_type === "terminal_answer")).toBe(true);
    expect(streamedEvents.some((event) => event.source_event_type === "runtime_selected")).toBe(true);
    expect(streamedEvents.some((event) => event.source_event_type === "tool_request")).toBe(true);
    expect(streamedEvents.some((event) => event.source_event_type === "tool_observation")).toBe(true);
    expect(streamedEvents.some((event) => event.source_event_type === "model_reentry")).toBe(true);
    expect(streamedEvents.some((event) => event.source_event_type === "terminal_answer")).toBe(false);
    expect(streamedEvents.every((event) => event.event_source === "live")).toBe(true);
  });

  it("streams text-to-speech client playback handoff before Codex terminal answer", async () => {
    resetInterimVoiceCalloutsForTest();
    runtimeMemoryGovernor.resetRuntimeMemoryGovernorForTests({
      memoryReader: () => ({
        heapUsed: 120 * 1024 * 1024,
        heapTotal: 512 * 1024 * 1024,
        rss: 640 * 1024 * 1024,
        external: 0,
        arrayBuffers: 0,
      }),
      hostMemoryReader: () => ({
        freeMiB: 16_000,
        totalMiB: 32_000,
        freeRatio: 0.5,
      }),
    });
    process.env.CODEX_AGENT_FAKE_STDOUT = [
      "playback_status: queued",
      "assistant_answer: false",
      "terminal_eligible: false",
    ].join("\n");
    const streamedEvents: Record<string, unknown>[] = [];

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn/stream",
      body: {
        turn_id: "ask:test:codex-provider-tts-handoff",
        question:
          "Use text_to_speech.speak_text to say exactly 'provider handoff check'. After the receipt barrier, answer with playback_status plus assistant_answer and terminal_eligible flags only.",
        workstation_gateway_call: {
          capability_id: "text_to_speech.speak_text",
          mode: "act",
          arguments: {
            text: "provider handoff check",
          },
        },
      },
      onTranscriptEvent: (event) => {
        streamedEvents.push(event);
      },
    });

    const voiceObservation = streamedEvents.find((event) =>
      event.capability_id === "text_to_speech.speak_text" &&
      event.voice_playback_handoff);
    expect((result.debug as any)?.workstation_gateway_call_results?.map((entry: any) => ({
      capability_id: entry.capability_id,
      ok: entry.ok,
      state_delta: entry.observation_packet?.state_delta,
    }))).toEqual([
      expect.objectContaining({
        capability_id: "text_to_speech.speak_text",
        state_delta: expect.objectContaining({
          text_to_speech_client_playback_handoff: expect.objectContaining({
            schema: "helix.interim_voice_callout_tool_result.v1",
          }),
        }),
      }),
    ]);
    expect(voiceObservation).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      voice_playback_handoff: {
        schema: "helix.interim_voice_callout_tool_result.v1",
        request: {
          text: "provider handoff check",
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
        receipt: {
          status: "awaiting_client_playback",
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
      },
    });
    expect(streamedEvents.some((event) => event.source_event_type === "terminal_answer")).toBe(false);
    expect(result.turn_transcript_events?.some((event) => event.source_event_type === "terminal_answer")).toBe(true);
  }, 15_000);

  it("streams normalized Codex native event packets without making them terminal authority", async () => {
    process.env.CODEX_AGENT_FAKE_STDOUT = "Native runtime final text.";
    process.env.CODEX_AGENT_FAKE_NATIVE_EVENT_JSONL = [
      JSON.stringify({
        msg: {
          ReasoningContentDelta: {
            turn_id: "ask:test:codex-native-events",
            delta: "Checking the available context.",
          },
        },
      }),
      JSON.stringify({
        msg: {
          McpToolCallBegin: {
            turn_id: "ask:test:codex-native-events",
            tool_name: "docs.search",
            call_id: "native-tool-1",
          },
        },
      }),
      JSON.stringify({
        msg: {
          McpToolCallEnd: {
            turn_id: "ask:test:codex-native-events",
            tool_name: "docs.search",
            call_id: "native-tool-1",
            text: "Found two candidate references.",
          },
        },
      }),
      JSON.stringify({
        msg: {
          TurnComplete: {
            turn_id: "ask:test:codex-native-events",
            last_agent_message: "Native runtime final text.",
          },
        },
      }),
    ].join("\n");
    const streamedEvents: Record<string, unknown>[] = [];

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn/stream",
      body: {
        turn_id: "ask:test:codex-native-events",
        question: "Use native Codex events for visibility.",
      },
      onTranscriptEvent: (event) => {
        streamedEvents.push(event);
      },
    });

    expect(result.ok).toBe(true);
    expect(streamedEvents.some((event) => event.source_event_type === "codex_native_reasoning_delta")).toBe(true);
    expect(streamedEvents.some((event) => event.source_event_type === "codex_native_tool_request")).toBe(true);
    expect(streamedEvents.some((event) => event.source_event_type === "codex_native_tool_result")).toBe(true);
    expect(streamedEvents.some((event) => event.source_event_type === "codex_native_turn_complete")).toBe(true);
    const nativeEvents = streamedEvents.filter((event) =>
      typeof event.source_event_type === "string" && event.source_event_type.startsWith("codex_native_")
    );
    expect(nativeEvents.every((event) => event.terminal_eligible === false)).toBe(true);
    expect(streamedEvents.some((event) => event.source_event_type === "terminal_answer")).toBe(false);
    expect(result.final_answer_source).toBe("agent_provider_terminal_candidate");
  });
});
