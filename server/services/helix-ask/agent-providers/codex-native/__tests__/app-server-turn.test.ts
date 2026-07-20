import { describe, expect, it, vi } from "vitest";
import { normalizeHelixRuntimeSemanticRouteProposal } from "../../../runtime/runtime-intent-packet";
import { listWorkstationGatewayCapabilities } from "../../../workstation-tool-gateway/registry";
import {
  CODEX_NATIVE_API_KEY_PROVIDER_ID,
  CODEX_NATIVE_DISABLED_CONFIG,
  runCodexNativeAppServerTurnWithTransport,
  type CodexNativeRouteAdmission,
} from "../app-server-turn";
import { HELIX_CODEX_ROUTE_PROPOSAL_TOOL } from "../dynamic-tools";
import {
  buildCodexNativeAppServerArgs,
  CODEX_NATIVE_DISABLED_FEATURES,
} from "../process-transport";
import type {
  CodexAppServerJsonRpcMessage,
  CodexAppServerTransport,
} from "../protocol";

type SimulatorMode =
  | "normal"
  | "compound"
  | "tool_before_route"
  | "forbidden_item"
  | "provider_auth_failure";

class FakeCodexAppServer implements CodexAppServerTransport {
  readonly stderr = "";
  readonly received: CodexAppServerJsonRpcMessage[] = [];
  private messageHandler: (message: CodexAppServerJsonRpcMessage) => void = () => undefined;
  private closeHandler: (error: Error | null) => void = () => undefined;
  private capabilityToolNames: string[] = [];
  private closed = false;

  constructor(private readonly mode: SimulatorMode) {}

  setMessageHandler(handler: (message: CodexAppServerJsonRpcMessage) => void): void {
    this.messageHandler = handler;
  }

  setCloseHandler(handler: (error: Error | null) => void): void {
    this.closeHandler = handler;
  }

  send(message: CodexAppServerJsonRpcMessage): void {
    this.received.push(message);
    if (message.method === "initialize") {
      this.emit({ id: message.id, result: { userAgent: "fake-codex" } });
      return;
    }
    if (message.method === "thread/start") {
      const params = message.params as Record<string, unknown>;
      const tools = params.dynamicTools as Array<Record<string, unknown>>;
      this.capabilityToolNames = tools
        .filter((tool) => tool.name !== HELIX_CODEX_ROUTE_PROPOSAL_TOOL)
        .map((tool) => String(tool.name ?? ""));
      this.emit({
        id: message.id,
        result: {
          thread: { id: "thread:fake", ephemeral: true },
          model: params.model,
        },
      });
      this.emit({ method: "thread/started", params: { thread: { id: "thread:fake" } } });
      return;
    }
    if (message.method === "turn/start") {
      this.emit({
        id: message.id,
        result: { turn: { id: "turn:fake", status: "inProgress", items: [] } },
      });
      queueMicrotask(() => this.beginTurn());
      return;
    }
    if (message.id === 100 && message.result) {
      if (this.mode === "tool_before_route") {
        this.finish("The capability was correctly blocked before route admission.");
      } else {
        this.emit({
          id: 101,
          method: "item/tool/call",
          params: {
            threadId: "thread:fake",
            turnId: "turn:fake",
            callId: "call:capability",
            tool: this.capabilityToolNames[0],
            arguments: {},
          },
        });
      }
      return;
    }
    if (message.id === 101 && message.result && this.mode === "compound") {
      this.emit({
        id: 102,
        method: "item/tool/call",
        params: {
          threadId: "thread:fake",
          turnId: "turn:fake",
          callId: "call:capability:2",
          tool: this.capabilityToolNames[1],
          arguments: { expression: "8*9" },
        },
      });
      return;
    }
    if ((message.id === 101 || message.id === 102) && message.result) {
      this.finish("The workstation status observation was re-entered in this turn.");
    }
  }

  close(): void {
    this.closed = true;
  }

  private beginTurn(): void {
    if (this.mode === "provider_auth_failure") {
      this.emit({
        method: "error",
        params: {
          error: {
            message: "unexpected status 401 Unauthorized",
            codexErrorInfo: {
              responseStreamDisconnected: { httpStatusCode: 401 },
            },
          },
          willRetry: false,
        },
      });
      this.emit({
        method: "turn/completed",
        params: {
          turn: {
            id: "turn:fake",
            status: "failed",
            error: { message: "unexpected status 401 Unauthorized" },
          },
        },
      });
      return;
    }
    if (this.mode === "forbidden_item") {
      this.emit({
        method: "item/completed",
        params: {
          item: {
            id: "command:1",
            type: "commandExecution",
            status: "completed",
          },
        },
      });
      this.finish("This answer must be rejected because a built-in command appeared.");
      return;
    }
    if (this.mode === "tool_before_route") {
      this.emit({
        id: 100,
        method: "item/tool/call",
        params: {
          threadId: "thread:fake",
          turnId: "turn:fake",
          callId: "call:early",
          tool: this.capabilityToolNames[0],
          arguments: {},
        },
      });
      return;
    }
    this.emit({
      id: 100,
      method: "item/tool/call",
      params: {
        threadId: "thread:fake",
        turnId: "turn:fake",
        callId: "call:route",
        tool: HELIX_CODEX_ROUTE_PROPOSAL_TOOL,
        arguments: {
          schema: "helix.runtime_semantic_route_proposal.v1",
          turn_id: "ask:test:native",
          proposal_id: "ask:test:native:proposal",
          prompt_hash: "prompt:test",
          proposal_source: "agent_runtime",
          proposed_route: "workspace_status",
          proposed_tool_family: "workspace",
          proposed_capability_id: "workspace_os.status",
          proposed_capability_ids: this.mode === "compound"
            ? ["workspace_os.status", "scientific-calculator.solve_expression"]
            : ["workspace_os.status"],
          confidence: "high",
          uncertainty: [],
          reason_summary: "The prompt explicitly asks for current workstation status.",
          supporting_hint_refs: [],
        },
      },
    });
  }

  private finish(text: string): void {
    this.emit({
      method: "item/completed",
      params: { item: { id: "answer:1", type: "agentMessage", text } },
    });
    this.emit({
      method: "turn/completed",
      params: { turn: { id: "turn:fake", status: "completed", items: [] } },
    });
  }

  private emit(message: CodexAppServerJsonRpcMessage): void {
    if (!this.closed) this.messageHandler(message);
  }
}

const workspaceStatusManifest = () => {
  const manifest = listWorkstationGatewayCapabilities({ mode: "read" }).capabilities.find(
    (capability) => capability.capability_id === "workspace_os.status",
  );
  if (!manifest) throw new Error("workspace_os.status manifest is required for this test");
  return manifest;
};

const calculatorManifest = () => {
  const manifest = listWorkstationGatewayCapabilities({ mode: "read" }).capabilities.find(
    (capability) => capability.capability_id === "scientific-calculator.solve_expression",
  );
  if (!manifest) throw new Error("scientific-calculator.solve_expression manifest is required for this test");
  return manifest;
};

const validateRoute = (value: unknown): CodexNativeRouteAdmission => {
  const proposal = normalizeHelixRuntimeSemanticRouteProposal({
    value,
    turnId: "ask:test:native",
    promptHash: "prompt:test",
    dependencies: {
      readString: (entry) =>
        typeof entry === "string" && entry.trim() ? entry.trim() : null,
      hashPayloadShort: () => "test-hash",
    },
  });
  return proposal?.proposed_capability_id === "workspace_os.status"
    ? {
        ok: true,
        proposal,
        admittedCapabilityIds: ["workspace_os.status"],
        reason: "route_capability_admitted",
      }
    : {
        ok: false,
        proposal,
        admittedCapabilityIds: [],
        reason: "invalid_route_proposal",
      };
};

describe("Codex native app-server turn", () => {
  it("disables every non-Helix runtime tool family before app-server startup", () => {
    const args = buildCodexNativeAppServerArgs();
    expect(args).toContain("--strict-config");
    expect(args).toContain('web_search="disabled"');
    for (const feature of CODEX_NATIVE_DISABLED_FEATURES) {
      expect(args).toContain(feature);
      expect(
        (CODEX_NATIVE_DISABLED_CONFIG.features as Record<string, unknown>)[feature],
      ).toBe(false);
    }
    expect(CODEX_NATIVE_DISABLED_CONFIG).toMatchObject({
      model_provider: CODEX_NATIVE_API_KEY_PROVIDER_ID,
      model_providers: {
        [CODEX_NATIVE_API_KEY_PROVIDER_ID]: {
          env_key: "OPENAI_API_KEY",
          wire_api: "responses",
          requires_openai_auth: false,
          supports_websockets: false,
        },
      },
    });
  });

  it("reports provider authentication failures as typed native failures", async () => {
    const result = await runCodexNativeAppServerTurnWithTransport(
      {
        prompt: "Answer from the native provider.",
        turnId: "ask:test:native",
        cwd: process.cwd(),
        capabilities: [],
        validateRouteProposal: validateRoute,
        executeCapability: vi.fn(),
        timeoutMs: 2_000,
      },
      new FakeCodexAppServer("provider_auth_failure"),
    );

    expect(result).toMatchObject({
      ok: false,
      failReason: "native_provider_auth_failed",
      debug: {
        native_turn_status: "failed",
        native_error_code: "provider_auth_failed",
        native_error_http_status: 401,
      },
    });
  });

  it("runs route proposal, capability observation, and final answer in one native turn", async () => {
    const transport = new FakeCodexAppServer("normal");
    const executeCapability = vi.fn(async () => ({
      ok: true,
      content: {
        schema: "helix.workspace_os_status_observation.v1",
        status: "ready",
        terminal_eligible: false,
        assistant_answer: false,
      },
      observationRef: "ask:test:native:workspace_os.status:observation",
    }));

    const result = await runCodexNativeAppServerTurnWithTransport(
      {
        prompt: "Check the current workstation status.",
        turnId: "ask:test:native",
        cwd: process.cwd(),
        model: "gpt-5.4-mini",
        reasoningEffort: "low",
        capabilities: [workspaceStatusManifest()],
        validateRouteProposal: validateRoute,
        executeCapability,
        timeoutMs: 2_000,
      },
      transport,
    );

    expect(result).toMatchObject({
      ok: true,
      answer: "The workstation status observation was re-entered in this turn.",
      failReason: null,
      debug: {
        ephemeral_thread: true,
        isolated_runtime_workspace: true,
        sandbox_policy: "read_only",
        network_access: false,
        approval_policy: "never",
        built_in_tools_disabled: true,
        disabled_native_features: [...CODEX_NATIVE_DISABLED_FEATURES],
        model_visible_tools: ["workspace_os.status"],
        route_admitted_tools: ["workspace_os.status"],
        requested_tools: ["workspace_os.status"],
        executed_tools: ["workspace_os.status"],
        successful_tools: ["workspace_os.status"],
        failed_tools: [],
        route_unobserved_tools: [],
        observation_reentry_refs: ["ask:test:native:workspace_os.status:observation"],
        effective_model: "gpt-5.4-mini",
        effective_reasoning_effort: "low",
        native_thread_id: "thread:fake",
        native_turn_id: "turn:fake",
        native_final_item_id: "answer:1",
        native_turn_status: "completed",
        terminal_candidate_present: true,
      },
    });
    expect(executeCapability).toHaveBeenCalledWith({
      capabilityId: "workspace_os.status",
      arguments: {},
      iteration: 1,
    });

    const initialize = transport.received.find((message) => message.method === "initialize");
    expect(initialize?.params).toMatchObject({
      capabilities: {
        experimentalApi: true,
        requestAttestation: false,
      },
    });

    const threadStart = transport.received.find((message) => message.method === "thread/start");
    expect(threadStart?.params).toMatchObject({
      model: "gpt-5.4-mini",
      approvalPolicy: "never",
      sandbox: "read-only",
      ephemeral: true,
      config: CODEX_NATIVE_DISABLED_CONFIG,
    });
    const dynamicTools = (threadStart?.params as Record<string, unknown>)
      ?.dynamicTools as Array<Record<string, unknown>>;
    expect(dynamicTools).not.toHaveLength(0);
    expect(dynamicTools.every((tool) => tool.type === "function")).toBe(true);
    const routeTool = dynamicTools.find(
      (tool) => tool.name === HELIX_CODEX_ROUTE_PROPOSAL_TOOL,
    );
    expect((routeTool?.inputSchema as Record<string, unknown>)?.required).toEqual(
      expect.arrayContaining(["proposed_capability_id", "proposed_capability_ids"]),
    );
    const turnStart = transport.received.find((message) => message.method === "turn/start");
    expect(turnStart?.params).toMatchObject({
      model: "gpt-5.4-mini",
      effort: "low",
      approvalPolicy: "never",
      input: [
        {
          type: "text",
          text: "Check the current workstation status.",
          text_elements: [],
        },
      ],
      sandboxPolicy: { type: "readOnly", networkAccess: false },
    });
  });

  it("executes every capability admitted by one compound semantic route before completing", async () => {
    const transport = new FakeCodexAppServer("compound");
    const executeCapability = vi.fn(async ({ capabilityId }: { capabilityId: string }) => ({
      ok: true,
      content: {
        schema: "helix.test_observation.v1",
        capability_id: capabilityId,
        terminal_eligible: false,
        assistant_answer: false,
      },
      observationRef: `ask:test:native:${capabilityId}:observation`,
    }));

    const result = await runCodexNativeAppServerTurnWithTransport(
      {
        prompt: "Check workstation status and calculate 8*9.",
        turnId: "ask:test:native",
        cwd: process.cwd(),
        capabilities: [workspaceStatusManifest(), calculatorManifest()],
        validateRouteProposal: (value) => {
          const proposal = normalizeHelixRuntimeSemanticRouteProposal({
            value,
            turnId: "ask:test:native",
            promptHash: "prompt:test",
            dependencies: {
              readString: (entry) =>
                typeof entry === "string" && entry.trim() ? entry.trim() : null,
              hashPayloadShort: () => "test-hash",
            },
          });
          return {
            ok: Boolean(proposal),
            proposal,
            admittedCapabilityIds: proposal?.proposed_capability_ids ?? [],
            reason: proposal ? "compound_route_admitted" : "invalid_route_proposal",
          };
        },
        executeCapability,
        timeoutMs: 2_000,
      },
      transport,
    );

    expect(result).toMatchObject({
      ok: true,
      debug: {
        route_admitted_tools: [
          "workspace_os.status",
          "scientific-calculator.solve_expression",
        ],
        requested_tools: [
          "workspace_os.status",
          "scientific-calculator.solve_expression",
        ],
        executed_tools: [
          "workspace_os.status",
          "scientific-calculator.solve_expression",
        ],
        successful_tools: [
          "workspace_os.status",
          "scientific-calculator.solve_expression",
        ],
        route_unobserved_tools: [],
      },
    });
    expect(executeCapability).toHaveBeenCalledTimes(2);
  });

  it("rejects a native terminal candidate when one admitted compound observation failed", async () => {
    const transport = new FakeCodexAppServer("compound");

    const result = await runCodexNativeAppServerTurnWithTransport(
      {
        prompt: "Check workstation status and calculate 8*9.",
        turnId: "ask:test:native",
        cwd: process.cwd(),
        capabilities: [workspaceStatusManifest(), calculatorManifest()],
        validateRouteProposal: (value) => {
          const proposal = normalizeHelixRuntimeSemanticRouteProposal({
            value,
            turnId: "ask:test:native",
            promptHash: "prompt:test",
            dependencies: {
              readString: (entry) =>
                typeof entry === "string" && entry.trim() ? entry.trim() : null,
              hashPayloadShort: () => "test-hash",
            },
          });
          return {
            ok: Boolean(proposal),
            proposal,
            admittedCapabilityIds: proposal?.proposed_capability_ids ?? [],
            reason: proposal ? "compound_route_admitted" : "invalid_route_proposal",
          };
        },
        executeCapability: async ({ capabilityId }) => ({
          ok: capabilityId === "workspace_os.status",
          content: { capability_id: capabilityId },
          observationRef: `ask:test:native:${capabilityId}:observation`,
        }),
        timeoutMs: 2_000,
      },
      transport,
    );

    expect(result).toMatchObject({
      ok: false,
      answer: "",
      failReason: "native_route_observation_missing",
      debug: {
        successful_tools: ["workspace_os.status"],
        failed_tools: ["scientific-calculator.solve_expression"],
        route_unobserved_tools: ["scientific-calculator.solve_expression"],
        terminal_candidate_present: true,
      },
    });
  });

  it("does not execute a capability requested before route admission", async () => {
    const transport = new FakeCodexAppServer("tool_before_route");
    const executeCapability = vi.fn();

    const result = await runCodexNativeAppServerTurnWithTransport(
      {
        prompt: "Check status.",
        turnId: "ask:test:native",
        cwd: process.cwd(),
        capabilities: [workspaceStatusManifest()],
        validateRouteProposal: validateRoute,
        executeCapability,
        timeoutMs: 2_000,
      },
      transport,
    );

    expect(result).toMatchObject({
      ok: false,
      failReason: "native_route_proposal_missing",
    });
    expect(result.debug.requested_tools).toEqual(["workspace_os.status"]);
    expect(result.debug.executed_tools).toEqual([]);
    expect(executeCapability).not.toHaveBeenCalled();
    const blockedResponse = transport.received.find((message) => message.id === 100 && message.result);
    const contentItems = (blockedResponse?.result as Record<string, unknown>)
      .contentItems as Array<Record<string, unknown>>;
    expect(JSON.parse(String(contentItems[0]?.text))).toMatchObject({
      reason: "route_proposal_required",
      capability_id: "workspace_os.status",
      terminal_eligible: false,
    });
  });

  it("fails closed if the native runtime emits a built-in tool item", async () => {
    const transport = new FakeCodexAppServer("forbidden_item");

    const result = await runCodexNativeAppServerTurnWithTransport(
      {
        prompt: "Answer without built-in tools.",
        turnId: "ask:test:native",
        cwd: process.cwd(),
        capabilities: [workspaceStatusManifest()],
        validateRouteProposal: validateRoute,
        executeCapability: vi.fn(),
        timeoutMs: 2_000,
      },
      transport,
    );

    expect(result).toMatchObject({
      ok: false,
      answer: "",
      failReason: "forbidden_native_tool_activity",
      debug: {
        forbidden_native_item_types: ["commandExecution"],
        terminal_candidate_present: true,
      },
    });
  });
});
