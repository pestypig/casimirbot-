import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { listWorkstationGatewayCapabilities } from "../../workstation-tool-gateway/registry";
import { buildHelixAgentRuntimeSelectionTrace } from "../runtime-debug";
import { buildHelixAgentProviderAskPayload } from "../provider-response-projection";
import type { HelixAgentProvider, HelixAgentRunRoute, HelixAgentRunResult } from "../types";

const buildProvider = (id: "codex" | "future"): HelixAgentProvider => ({
  id,
  label: id === "codex" ? "Codex Workstation Mode" : "Future Agent Wrapper",
  permissionProfile: {
    id: id === "codex" ? "read-observe-act" : "read-observe",
    label: id === "codex" ? "Read/observe plus non-mutating workstation action" : "Read/observe only",
    allows: {
      observe: true,
      read: true,
      act: id === "codex",
      write: false,
      shell: false,
      codeMutation: false,
    },
  },
  enabled: () => true,
  supports: {
    streaming: false,
    workstationTools: true,
    codeMutation: false,
  },
  runTurn: async () => ({
    ok: true,
    runtime: id,
    response_type: "final_answer",
    final_status: "completed",
  }),
});

const buildPayload = (input: {
  provider: HelixAgentProvider;
  route: HelixAgentRunRoute;
  turnId: string;
  providerResult: HelixAgentRunResult;
}) => {
  const gatewayManifest = listWorkstationGatewayCapabilities({
    agentRuntime: input.provider.id,
    mode: input.provider.id === "codex" ? "act" : "observe",
  });
  const runtimeSelectionTrace = buildHelixAgentRuntimeSelectionTrace({
    route: input.route,
    requestedRuntime: input.provider.id,
    provider: input.provider,
    gatewayManifest,
  });

  return buildHelixAgentProviderAskPayload({
    provider: input.provider,
    providerResult: input.providerResult,
    runtimeSelectionTrace,
    gatewayManifest,
    turnId: input.turnId,
  });
};

describe("agent provider response projection", () => {
  it("projects Codex non-stream payload and debug fields with capability lane metadata", () => {
    const provider = buildProvider("codex");
    const providerResult: HelixAgentRunResult = {
      ok: true,
      runtime: "codex",
      response_type: "final_answer",
      final_status: "completed",
      answer: "calculator result",
      action_envelope: {
        schema: "helix.action_envelope.v1",
      },
      turn_transcript_events: [
        {
          event: "agent_final",
        },
      ],
      support_refs: ["artifact:calculator"],
      tool_output_refs: ["tool:calculator"],
      debug: {
        agent_runtime_adapter_contract: {
          schema: "helix.agent_runtime_adapter_contract.v1",
        },
        capability_lane_manifest: {
          schema: "helix.capability_lane_manifest.v1",
        },
        capability_lane_ids: ["utility_text", "workstation_tool_reference"],
        capability_lane_statuses: {
          utility_text: "available",
        },
        capability_lane_resolve_trace_shape: {
          schema: "helix.capability_lane_resolve_trace.v1",
        },
        workstation_gateway_call_results: [{ capability_id: "scientific-calculator.solve_expression" }],
        workstation_gateway_observation_packets: [{ observation_ref: "obs:calculator" }],
        tool_lifecycle_traces: [{ capability_id: "scientific-calculator.solve_expression" }],
        tool_followup_decisions: [{ decision: "reenter_observation" }],
        provider_terminal_candidate: { text: "calculator result" },
        provider_reasoning_reentry: { status: "complete" },
        terminal_authority_candidate_review: { status: "accepted" },
        provider_terminal_authority_bridge: { status: "bridged" },
        terminal_answer_authority: { terminal_authority_ok: true },
        terminal_presentation: { final_answer: "calculator result" },
        final_answer_source: "provider_terminal_candidate",
        terminal_artifact_kind: "final_answer",
        provider_gateway_debug_summary: { gateway_call_count: 1 },
        codex_runtime_status: { launchable: true },
      },
    };

    const payload = buildPayload({
      provider,
      route: "/ask/turn",
      turnId: "turn-codex",
      providerResult,
    });
    const debug = payload.debug as Record<string, unknown>;

    expect(payload.answer).toBe("calculator result");
    expect(payload.turn_id).toBe("turn-codex");
    expect(payload.agent_runtime).toBe("codex");
    expect(payload.selected_agent_provider).toMatchObject({
      id: "codex",
      label: "Codex Workstation Mode",
    });
    expect(payload.workstation_gateway_capability_ids).toContain("scientific-calculator.solve_expression");
    expect(payload.agent_runtime_adapter_contract).toMatchObject({
      schema: "helix.agent_runtime_adapter_contract.v1",
    });
    expect(payload.capability_lane_manifest).toMatchObject({
      schema: "helix.capability_lane_manifest.v1",
    });
    expect(payload.capability_lane_ids).toContain("workstation_tool_reference");
    expect(payload.capability_lane_statuses).toMatchObject({
      utility_text: "available",
    });
    expect(payload.capability_lane_resolve_trace_shape).toMatchObject({
      schema: "helix.capability_lane_resolve_trace.v1",
    });
    expect(payload.workstation_gateway_call_results).toEqual([
      { capability_id: "scientific-calculator.solve_expression" },
    ]);
    expect(payload.terminal_answer_authority).toMatchObject({
      terminal_authority_ok: true,
    });
    expect(payload.action_envelope).toMatchObject({
      schema: "helix.action_envelope.v1",
    });
    expect(payload.support_refs).toEqual(["artifact:calculator"]);
    expect(payload.tool_output_refs).toEqual(["tool:calculator"]);
    expect(debug.agent_runtime).toBe("codex");
    expect(debug.capability_lane_manifest).toEqual(payload.capability_lane_manifest);
    expect(debug.workstation_gateway_call_results).toEqual(payload.workstation_gateway_call_results);
    expect(debug.provider_terminal_candidate).toEqual(payload.provider_terminal_candidate);
    expect(debug.codex_runtime_status).toEqual({ launchable: true });
  });

  it("projects stream fallback payloads through the same provider envelope", () => {
    const provider = buildProvider("codex");
    const payload = buildPayload({
      provider,
      route: "/ask/turn/stream",
      turnId: "turn-stream",
      providerResult: {
        ok: true,
        runtime: "codex",
        response_type: "final_answer",
        final_status: "completed",
        answer: "stream final",
        debug: {
          capability_lane_manifest: {
            schema: "helix.capability_lane_manifest.v1",
          },
          capability_lane_ids: ["utility_text"],
          workstation_gateway_call_results: [{ capability_id: "workspace.status" }],
        },
      },
    });
    const debug = payload.debug as Record<string, unknown>;

    expect(payload.turn_id).toBe("turn-stream");
    expect((payload.agent_runtime_selection_trace as Record<string, unknown>).route).toBe("/ask/turn/stream");
    expect(payload.capability_lane_manifest).toMatchObject({
      schema: "helix.capability_lane_manifest.v1",
    });
    expect(payload.capability_lane_ids).toEqual(["utility_text"]);
    expect(payload.workstation_gateway_call_results).toEqual([{ capability_id: "workspace.status" }]);
    expect(debug.capability_lane_ids).toEqual(["utility_text"]);
    expect(debug.workstation_gateway_call_results).toEqual(payload.workstation_gateway_call_results);
  });

  it("keeps route-local provider projection out of agi.plan.ts", () => {
    const routeSource = readFileSync(resolve(process.cwd(), "server/routes/agi.plan.ts"), "utf8");

    expect(routeSource).toContain("buildHelixAgentProviderAskPayload");
    expect(routeSource).not.toContain("providerDebug.");
    expect(routeSource).not.toContain("capability_lane_manifest: providerDebug.capability_lane_manifest");
    expect(routeSource).not.toContain("workstation_gateway_call_results: providerDebug.workstation_gateway_call_results");
    expect(routeSource).not.toContain("provider_terminal_candidate: providerDebug.provider_terminal_candidate");
  });
});
