import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  resetAccountSessionStore,
  signInLocalAccountSession,
} from "../../../../helix-account/account-session-store";
import { resolveWorkstationGatewayAccountContext } from "../../../workstation-tool-gateway/account-policy";
import type {
  CodexNativeAppServerTurnResult,
  RunCodexNativeAppServerTurnInput,
} from "../app-server-turn";
import { runCodexNativeWorkstationTurn } from "../workstation-turn";

const nativeResult = (input: {
  turn: RunCodexNativeAppServerTurnInput;
  proposal: NonNullable<CodexNativeAppServerTurnResult["debug"]["route_proposal"]>;
  admitted: string[];
  requested?: string[];
  executed?: string[];
  successful?: string[];
  failed?: string[];
  routeUnobserved?: string[];
  observationRefs?: string[];
  ok?: boolean;
}): CodexNativeAppServerTurnResult => ({
  ok: input.ok ?? true,
  answer: input.ok === false ? "" : "Native answer from a re-entered observation.",
  failReason: input.ok === false ? "native_tool_failed" : null,
  stderr: "",
  debug: {
    schema: "helix.codex_native_app_server_debug.v1",
    transport: "app_server_stdio_jsonl",
    ephemeral_thread: true,
    isolated_runtime_workspace: true,
    sandbox_policy: "read_only",
    network_access: false,
    approval_policy: "never",
    built_in_tools_disabled: true,
    disabled_native_features: [],
    model_visible_tools: input.turn.capabilities.map((capability) => capability.capability_id),
    route_proposal: input.proposal,
    route_admission_reason: "runtime_semantic_route_validated_against_helix_admission",
    route_admitted_tools: input.admitted,
    requested_tools: input.requested ?? [],
    executed_tools: input.executed ?? [],
    successful_tools:
      input.successful ?? (input.ok === false ? [] : input.executed ?? []),
    failed_tools:
      input.failed ?? (input.ok === false ? input.executed ?? [] : []),
    route_unobserved_tools: input.routeUnobserved ?? [],
    observation_reentry_refs: input.observationRefs ?? [],
    native_item_types: ["dynamicToolCall", "agentMessage"],
    forbidden_native_item_types: [],
    effective_model: input.turn.model ?? null,
    effective_reasoning_effort: input.turn.reasoningEffort ?? null,
    native_thread_id: "thread:test",
    native_turn_id: "turn:test",
    native_final_item_id: "answer:test",
    native_turn_status: "completed",
    terminal_candidate_present: input.ok !== false,
  },
});

const readBinding = (prompt: string) =>
  JSON.parse(prompt.split(/\r?\n/).at(-1) ?? "{}") as Record<string, unknown>;

describe("Codex native governed workstation turn", () => {
  beforeEach(async () => {
    await resetAccountSessionStore();
  });

  it("intersects account policy, goal tools, route admission, and gateway execution", async () => {
    const receipt = await signInLocalAccountSession({
      profile_id: "profile:native-workstation-user",
      account_type: "user",
    });
    const accountContext = await resolveWorkstationGatewayAccountContext(receipt.session?.session_id);
    const nativeTurnRunner = vi.fn(async (turn: RunCodexNativeAppServerTurnInput) => {
      const binding = readBinding(turn.prompt);
      const admission = await turn.validateRouteProposal({
        schema: "helix.runtime_semantic_route_proposal.v1",
        turn_id: "ask:test:native-workstation",
        proposal_source: "agent_runtime",
        prompt_hash: binding.prompt_hash,
        proposed_route: "workspace_status",
        proposed_tool_family: "workspace",
        proposed_capability_id: "workspace_os.status",
        proposed_capability_ids: ["workspace_os.status"],
        confidence: "high",
        uncertainty: [],
        reason_summary: "Current status requires the admitted status observation.",
        supporting_hint_refs: [],
      });
      const execution = await turn.executeCapability({
        capabilityId: "workspace_os.status",
        arguments: {},
        iteration: 1,
      });
      const outsideRouteExecution = await turn.executeCapability({
        capabilityId: "repo.search",
        arguments: { query: "must not execute" },
        iteration: 2,
      });
      expect(outsideRouteExecution).toMatchObject({
        ok: false,
        content: {
          reason: "capability_outside_validated_route",
          capability_id: "repo.search",
          terminal_eligible: false,
        },
      });
      return nativeResult({
        turn,
        proposal: admission.proposal!,
        admitted: admission.admittedCapabilityIds,
        requested: ["workspace_os.status"],
        executed: ["workspace_os.status"],
        observationRefs: execution.observationRef ? [execution.observationRef] : [],
        ok: execution.ok,
      });
    });

    const result = await runCodexNativeWorkstationTurn({
      prompt: "Check the current workstation status.",
      turnId: "ask:test:native-workstation",
      cwd: process.cwd(),
      accountContext,
      model: "gpt-5.4-mini",
      reasoningEffort: "low",
      allowedWorkstationTools: [
        "workspace_os.status",
        "repo.search",
        "live_env.request_interim_voice_callout",
      ],
      nativeTurnRunner,
    });

    expect(result).toMatchObject({
      ok: true,
      gatewayCallResults: [
        expect.objectContaining({
          ok: true,
          capability_id: "workspace_os.status",
          terminal_eligible: false,
          post_tool_model_step_required: true,
        }),
      ],
      debug: {
        account_type: "user",
        profile_bound: true,
        raw_profile_id_included: false,
        trusted_account_session: true,
        model_visible_tools: ["workspace_os.status", "repo.search"],
        goal_allowed_tools: [
          "workspace_os.status",
          "repo.search",
          "live_env.request_interim_voice_callout",
        ],
        route_admitted_tools: ["workspace_os.status"],
        requested_tools: ["workspace_os.status"],
        executed_tools: ["workspace_os.status"],
        successful_tools: ["workspace_os.status"],
        failed_tools: [],
        route_unobserved_tools: [],
        effective_model: "gpt-5.4-mini",
        effective_reasoning_effort: "low",
        native_transport: "app_server_stdio_jsonl",
        native_item_types: ["dynamicToolCall", "agentMessage"],
        native_thread_id: "thread:test",
        native_turn_id: "turn:test",
        native_final_item_id: "answer:test",
        native_turn_status: "completed",
        terminal_candidate_present: true,
      },
    });
    expect(nativeTurnRunner).toHaveBeenCalledOnce();
  });

  it("admits and executes an ordered compound capability set from one native route proposal", async () => {
    const receipt = await signInLocalAccountSession({
      profile_id: "profile:native-workstation-compound-developer",
      account_type: "developer",
    });
    const accountContext = await resolveWorkstationGatewayAccountContext(receipt.session?.session_id);
    const proposedCapabilities = [
      "workspace_os.status",
      "scientific-calculator.solve_expression",
    ];
    const nativeTurnRunner = vi.fn(async (turn: RunCodexNativeAppServerTurnInput) => {
      const binding = readBinding(turn.prompt);
      const admission = await turn.validateRouteProposal({
        schema: "helix.runtime_semantic_route_proposal.v1",
        turn_id: "ask:test:native-compound",
        proposal_source: "agent_runtime",
        prompt_hash: binding.prompt_hash,
        proposed_route: "compound_workspace_calculator",
        proposed_tool_family: "compound",
        proposed_capability_id: proposedCapabilities[0],
        proposed_capability_ids: proposedCapabilities,
        confidence: "high",
        uncertainty: [],
        reason_summary: "Both bounded observations are required by the compound request.",
        supporting_hint_refs: [],
      });
      expect(admission).toMatchObject({
        ok: true,
        admittedCapabilityIds: proposedCapabilities,
      });
      const status = await turn.executeCapability({
        capabilityId: proposedCapabilities[0],
        arguments: {},
        iteration: 1,
      });
      const calculation = await turn.executeCapability({
        capabilityId: proposedCapabilities[1],
        arguments: { expression: "8*9" },
        iteration: 2,
      });
      return nativeResult({
        turn,
        proposal: admission.proposal!,
        admitted: admission.admittedCapabilityIds,
        requested: proposedCapabilities,
        executed: proposedCapabilities,
        observationRefs: [status.observationRef, calculation.observationRef].filter(
          (ref): ref is string => Boolean(ref),
        ),
        ok: status.ok && calculation.ok,
      });
    });

    const result = await runCodexNativeWorkstationTurn({
      prompt: "Check workstation status and calculate 8*9.",
      turnId: "ask:test:native-compound",
      cwd: process.cwd(),
      accountContext,
      allowedWorkstationTools: proposedCapabilities,
      nativeTurnRunner,
    });

    expect(result).toMatchObject({
      ok: true,
      gatewayCallResults: [
        expect.objectContaining({ capability_id: "workspace_os.status", ok: true }),
        expect.objectContaining({
          capability_id: "scientific-calculator.solve_expression",
          ok: true,
        }),
      ],
      debug: {
        model_visible_tools: proposedCapabilities,
        route_admitted_tools: proposedCapabilities,
        executed_tools: proposedCapabilities,
        successful_tools: proposedCapabilities,
        route_unobserved_tools: [],
      },
    });
    expect(nativeTurnRunner).toHaveBeenCalledOnce();
  });

  it("does not expose a mutating dynamic-panel capability to the read-only native turn", async () => {
    const receipt = await signInLocalAccountSession({
      profile_id: "profile:native-workstation-panel-user",
      account_type: "user",
    });
    const accountContext = await resolveWorkstationGatewayAccountContext(receipt.session?.session_id);
    const nativeTurnRunner = vi.fn();

    const result = await runCodexNativeWorkstationTurn({
      prompt: "Open code admin.",
      turnId: "ask:test:native-panel",
      cwd: process.cwd(),
      accountContext,
      allowedWorkstationTools: ["workstation.open_panel"],
      nativeTurnRunner,
    });

    expect(result).toMatchObject({
      ok: false,
      failReason: "native_admitted_capability_set_empty",
      native: null,
      debug: {
        model_visible_tools: [],
        compatibility_fallback_required: true,
        compatibility_fallback_reason: "native_admitted_capability_set_empty",
      },
    });
    expect(result.gatewayCallResults).toEqual([]);
    expect(nativeTurnRunner).not.toHaveBeenCalled();
  });

  it("does not start a durable-goal native turn without trusted account binding", async () => {
    const accountContext = await resolveWorkstationGatewayAccountContext(null);
    const nativeTurnRunner = vi.fn();

    const result = await runCodexNativeWorkstationTurn({
      prompt: "Continue the goal.",
      turnId: "goal:test:native",
      cwd: process.cwd(),
      accountContext,
      requireTrustedAccountBinding: true,
      nativeTurnRunner,
    });

    expect(result).toMatchObject({
      ok: false,
      failReason: "trusted_account_binding_required",
      native: null,
      debug: {
        account_type: "user",
        trusted_account_session: false,
        trusted_account_binding_required: true,
        account_binding_status: "blocked",
        compatibility_fallback_required: true,
        compatibility_fallback_reason: "trusted_account_binding_required",
      },
    });
    expect(nativeTurnRunner).not.toHaveBeenCalled();
  });
});
