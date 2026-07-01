import { describe, expect, it } from "vitest";
import { listWorkstationGatewayCapabilities } from "../../workstation-tool-gateway/registry";
import { buildHelixAgentRuntimeSelectionTrace } from "../../agent-providers/runtime-debug";
import { buildHelixAgentProviderAskPayload } from "../../agent-providers/provider-response-projection";
import type { HelixAgentProvider } from "../../agent-providers/types";
import { runHelixCapabilityLaneOneShotRequests } from "../one-shot-runner";

const buildProvider = (id: "helix" | "codex"): HelixAgentProvider => ({
  id,
  label: id === "helix" ? "Helix Ask Native" : "Codex Workstation Mode",
  permissionProfile: {
    id: id === "helix" ? "helix-native" : "read-observe-act",
    label: "Read/observe plus non-mutating workstation action",
    allows: {
      observe: true,
      read: true,
      act: true,
      write: false,
      shell: false,
      codeMutation: false,
    },
  },
  enabled: () => true,
  supports: {
    streaming: id === "helix",
    workstationTools: true,
    capabilityLanes: true,
    capabilityLaneOneShot: true,
    capabilityLaneSessions: false,
    codeMutation: false,
  },
  runTurn: async () => ({
    ok: false,
    runtime: id,
    response_type: "test",
    final_status: "test",
  }),
});

const body = {
  turn_id: "turn-provider-neutral-lane",
  capability_lane_call: {
    capability: "live_translation.translate_text",
    text: "hello",
    source_language: "en",
    target_language: "es",
    requested_backend_provider: "google_gemini",
  },
};

const projectPayload = (provider: HelixAgentProvider, debugProjection: Record<string, unknown>) => {
  const gatewayManifest = listWorkstationGatewayCapabilities({
    agentRuntime: provider.id,
    mode: "act",
  });
  const runtimeSelectionTrace = buildHelixAgentRuntimeSelectionTrace({
    route: "/ask/turn",
    requestedRuntime: provider.id,
    provider,
    gatewayManifest,
  });
  return buildHelixAgentProviderAskPayload({
    provider,
    providerResult: {
      ok: true,
      runtime: provider.id,
      response_type: "final_answer",
      final_status: "completed",
      answer: "provider terminal candidate",
      debug: debugProjection,
    },
    runtimeSelectionTrace,
    gatewayManifest,
    turnId: "turn-provider-neutral-lane",
  });
};

describe("provider-neutral capability lane one-shot runner", () => {
  it("lets Helix and Codex request the same one-shot translation lane through the same body contract", () => {
    const helix = runHelixCapabilityLaneOneShotRequests({
      provider: buildProvider("helix"),
      body,
      env: {} as NodeJS.ProcessEnv,
    });
    const codex = runHelixCapabilityLaneOneShotRequests({
      provider: buildProvider("codex"),
      body,
      env: {} as NodeJS.ProcessEnv,
    });

    expect(helix).toMatchObject({
      schema: "helix.capability_lane.one_shot_runner_result.v1",
      requested: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(codex).toMatchObject({
      requested: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(helix.call_results).toHaveLength(1);
    expect(codex.call_results).toHaveLength(1);
    expect(helix.call_results[0]?.translated_text).toBe("hola");
    expect(codex.call_results[0]?.translated_text).toBe("hola");
    expect(helix.call_results[0]?.selected_runtime_agent_provider).toBe("helix");
    expect(codex.call_results[0]?.selected_runtime_agent_provider).toBe("codex");
    expect(helix.resolve_traces[0]).toMatchObject({
      requested_lane: "live_translation",
      requested_backend_provider: "google_gemini",
      requested_backend_provider_known: true,
      requested_backend_configuration_status: "missing",
      requested_backend_availability_status: "unconfigured",
      requested_backend_permission_status: "configuration_missing",
      requested_backend_fallback_provider: "live_translation.local_runtime",
      selected_backend_provider: "live_translation.local_runtime",
      execution_status: "executed_observation_only",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(helix.backend_selections[0]).toMatchObject({
      schema: "helix.capability_lane.backend_selection_summary.v1",
      selected_runtime_agent_provider: "helix",
      lane_id: "live_translation",
      capability: "live_translation.translate_text",
      requested_lane: "live_translation",
      requested_backend_provider: "google_gemini",
      requested_backend_provider_known: true,
      requested_backend_configuration_status: "missing",
      requested_backend_availability_status: "unconfigured",
      requested_backend_permission_status: "configuration_missing",
      requested_backend_fallback_provider: "live_translation.local_runtime",
      selected_backend_provider: "live_translation.local_runtime",
      backend_selection_decision: {
        schema: "helix.capability_lane.backend_selection_decision.v1",
        owner: "helix",
        outcome: "fallback_selected",
        reason: "requested_backend_unconfigured_default_backend_selected_by_helix_policy",
        requested_backend_provider: "google_gemini",
        requested_backend_provider_known: true,
        selected_backend_provider: "live_translation.local_runtime",
        fallback_backend_provider: "live_translation.local_runtime",
        selected_runtime_provider_remains_root: true,
        backend_provider_becomes_root_agent: false,
        dynamic_switching_executed: false,
        live_backend_execution_enabled: false,
        terminal_authority_owner: "helix",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      selection_reason: "requested_backend_unconfigured_default_backend_selected_by_helix_policy",
      availability_status: "dry_run",
      permission_status: "admitted",
      cost_class: "free_local",
      latency_class: "interactive",
      privacy_class: "local_only",
      fallback_backend_provider: null,
      execution_status: "executed_observation_only",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(codex.backend_selections[0]).toMatchObject({
      schema: "helix.capability_lane.backend_selection_summary.v1",
      selected_runtime_agent_provider: "codex",
      lane_id: "live_translation",
      capability: "live_translation.translate_text",
      requested_backend_provider: "google_gemini",
      requested_backend_provider_known: true,
      requested_backend_configuration_status: "missing",
      requested_backend_availability_status: "unconfigured",
      requested_backend_permission_status: "configuration_missing",
      requested_backend_fallback_provider: "live_translation.local_runtime",
      selected_backend_provider: "live_translation.local_runtime",
      execution_status: "executed_observation_only",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(codex.resolve_traces[0]).toMatchObject({
      requested_lane: "live_translation",
      requested_backend_provider: "google_gemini",
      requested_backend_provider_known: true,
      requested_backend_configuration_status: "missing",
      requested_backend_availability_status: "unconfigured",
      requested_backend_permission_status: "configuration_missing",
      requested_backend_fallback_provider: "live_translation.local_runtime",
      selected_backend_provider: "live_translation.local_runtime",
      execution_status: "executed_observation_only",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(helix.observation_packets[0]?.capability_key).toBe("live_translation.translate_text");
    expect(codex.observation_packets[0]?.capability_key).toBe("live_translation.translate_text");
    expect(helix.debug_events.map((event) => event.stage)).toEqual([
      "lane_requested",
      "lane_backend_selected",
      "lane_observation",
      "lane_reentered",
    ]);
    expect(codex.debug_events.map((event) => event.stage)).toEqual([
      "lane_requested",
      "lane_backend_selected",
      "lane_observation",
      "lane_reentered",
    ]);
    expect(codex.debug_events[1]).toMatchObject({
      schema: "helix.capability_lane.debug_event.v1",
      stage: "lane_backend_selected",
      requested_backend_provider: "google_gemini",
      requested_backend_provider_known: true,
      requested_backend_configuration_status: "missing",
      requested_backend_availability_status: "unconfigured",
      requested_backend_permission_status: "configuration_missing",
      requested_backend_fallback_provider: "live_translation.local_runtime",
      selected_backend_provider: "live_translation.local_runtime",
      selection_reason: "requested_backend_unconfigured_default_backend_selected_by_helix_policy",
      backend_selection_decision: expect.objectContaining({
        outcome: "fallback_selected",
        selected_runtime_provider_remains_root: true,
        backend_provider_becomes_root_agent: false,
        dynamic_switching_executed: false,
        live_backend_execution_enabled: false,
        terminal_authority_owner: "helix",
      }),
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(codex.debug_events[2]).toMatchObject({
      schema: "helix.capability_lane.debug_event.v1",
      stage: "lane_observation",
      selected_runtime_agent_provider: "codex",
      lane_id: "live_translation",
      capability: "live_translation.translate_text",
      status: "completed",
      requested_backend_provider: "google_gemini",
      requested_backend_provider_known: true,
      requested_backend_configuration_status: "missing",
      requested_backend_availability_status: "unconfigured",
      requested_backend_permission_status: "configuration_missing",
      requested_backend_fallback_provider: "live_translation.local_runtime",
      selected_backend_provider: "live_translation.local_runtime",
      backend_selection_decision: expect.objectContaining({
        outcome: "fallback_selected",
        selected_runtime_provider_remains_root: true,
        backend_provider_becomes_root_agent: false,
        dynamic_switching_executed: false,
        live_backend_execution_enabled: false,
        terminal_authority_owner: "helix",
      }),
      execution_status: "executed_observation_only",
      reentry_status: "observation_packet_required_for_provider_reentry",
      terminal_authority_status: "pending_helix_terminal_authority",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(codex.debug_events[3]).toMatchObject({
      stage: "lane_reentered",
      requested_backend_provider: null,
      requested_backend_provider_known: null,
      requested_backend_configuration_status: null,
      requested_backend_availability_status: null,
      requested_backend_permission_status: null,
      requested_backend_fallback_provider: null,
    });
  });

  it("projects lane call results through the same provider debug/export envelope", () => {
    const provider = buildProvider("codex");
    const runner = runHelixCapabilityLaneOneShotRequests({
      provider,
      body,
      env: {} as NodeJS.ProcessEnv,
    });
    const payload = projectPayload(provider, runner.debug_projection);
    const debug = payload.debug as Record<string, unknown>;

    expect(payload.agent_runtime).toBe("codex");
    expect(payload.capability_lane_call_results).toEqual(runner.call_results);
    expect(payload.capability_lane_observation_packets).toEqual(runner.observation_packets);
    expect(payload.capability_lane_resolve_traces).toEqual(runner.resolve_traces);
    expect(payload.capability_lane_backend_selections).toEqual(runner.backend_selections);
    expect(payload.capability_lane_debug_events).toEqual(runner.debug_events);
    expect(debug.capability_lane_call_results).toEqual(runner.call_results);
    expect(debug.capability_lane_observation_packets).toEqual(runner.observation_packets);
    expect(debug.capability_lane_resolve_traces).toEqual(runner.resolve_traces);
    expect(debug.capability_lane_backend_selections).toEqual(runner.backend_selections);
    expect(debug.capability_lane_debug_events).toEqual(runner.debug_events);
    expect(debug.capability_lane_reentry_status).toBe("observation_packet_required_for_provider_reentry");
    expect((payload.capability_lane_call_results as Array<Record<string, unknown>>)[0]).toMatchObject({
      capability: "live_translation.translate_text",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("lets Helix and Codex request the same utility text lane through the same body contract", () => {
    const utilityBody = {
      turn_id: "turn-provider-neutral-utility",
      capability_lane_call: {
        capability: "utility_text.normalize_text",
        text: "  Hello    WORKSTATION  ",
        normalization_mode: "lowercase",
        requested_backend_provider: "utility_text.openai_compatible",
      },
    };
    const helix = runHelixCapabilityLaneOneShotRequests({
      provider: buildProvider("helix"),
      body: utilityBody,
      env: {} as NodeJS.ProcessEnv,
    });
    const codex = runHelixCapabilityLaneOneShotRequests({
      provider: buildProvider("codex"),
      body: utilityBody,
      env: {} as NodeJS.ProcessEnv,
    });

    expect(helix.call_results).toHaveLength(1);
    expect(codex.call_results).toHaveLength(1);
    expect(helix.call_results[0]).toMatchObject({
      schema: "helix.utility_text.normalize_result.v1",
      ok: true,
      lane_id: "utility_text",
      capability: "utility_text.normalize_text",
      selected_runtime_agent_provider: "helix",
      normalized_text: "hello workstation",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(codex.call_results[0]).toMatchObject({
      schema: "helix.utility_text.normalize_result.v1",
      ok: true,
      selected_runtime_agent_provider: "codex",
      normalized_text: "hello workstation",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(helix.resolve_traces[0]).toMatchObject({
      requested_lane: "utility_text",
      requested_backend_provider: "utility_text.openai_compatible",
      selected_backend_provider: "utility_text.local_runtime",
      selection_reason: "requested_backend_unconfigured_default_backend_selected_by_helix_policy",
      execution_status: "executed_observation_only",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(codex.resolve_traces[0]).toMatchObject({
      requested_lane: "utility_text",
      requested_backend_provider: "utility_text.openai_compatible",
      selected_backend_provider: "utility_text.local_runtime",
      execution_status: "executed_observation_only",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(helix.observation_packets[0]).toMatchObject({
      capability_key: "utility_text.normalize_text",
      status: "succeeded",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(codex.observation_packets[0]).toMatchObject({
      capability_key: "utility_text.normalize_text",
      status: "succeeded",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("lets Helix and Codex inspect the same workstation tool catalog through the lane contract", () => {
    const catalogBody = {
      turn_id: "turn-provider-neutral-workstation-catalog",
      capability_lane_call: {
        capability: "workstation_tool_reference.list_capabilities",
        mode: "act",
      },
    };
    const helix = runHelixCapabilityLaneOneShotRequests({
      provider: buildProvider("helix"),
      body: catalogBody,
      env: {} as NodeJS.ProcessEnv,
    });
    const codex = runHelixCapabilityLaneOneShotRequests({
      provider: buildProvider("codex"),
      body: catalogBody,
      env: {} as NodeJS.ProcessEnv,
    });

    expect(helix.call_results).toHaveLength(1);
    expect(codex.call_results).toHaveLength(1);
    expect(helix.call_results[0]).toMatchObject({
      schema: "helix.workstation_tool_reference.list_result.v1",
      ok: true,
      lane_id: "workstation_tool_reference",
      capability: "workstation_tool_reference.list_capabilities",
      selected_runtime_agent_provider: "helix",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(codex.call_results[0]).toMatchObject({
      schema: "helix.workstation_tool_reference.list_result.v1",
      ok: true,
      selected_runtime_agent_provider: "codex",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(helix.resolve_traces[0]).toMatchObject({
      requested_lane: "workstation_tool_reference",
      selected_backend_provider: "workstation_tool_reference.helix_workstation_gateway",
      execution_status: "executed_observation_only",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(codex.resolve_traces[0]).toMatchObject({
      requested_lane: "workstation_tool_reference",
      selected_backend_provider: "workstation_tool_reference.helix_workstation_gateway",
      execution_status: "executed_observation_only",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(helix.observation_packets[0]).toMatchObject({
      capability_key: "workstation_tool_reference.list_capabilities",
      status: "succeeded",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(codex.observation_packets[0]).toMatchObject({
      capability_key: "workstation_tool_reference.list_capabilities",
      status: "succeeded",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("projects future lane calls as explicit shadow-only non-terminal observations", () => {
    const result = runHelixCapabilityLaneOneShotRequests({
      provider: buildProvider("codex"),
      body: {
        turn_id: "turn-provider-neutral-shadow-lanes",
        capability_lane_call: [
          {
            capability: "visual_analysis.inspect_frame",
            requested_backend_provider: "openai_compatible",
            frame_ref: "frame:test",
          },
          {
            capability: "text_to_speech.synthesize",
            requested_backend_provider: "elevenlabs",
            text: "checking now",
          },
        ],
      },
      env: {
        OPENAI_API_KEY: "test-openai",
        ELEVENLABS_API_KEY: "test-eleven",
      } as NodeJS.ProcessEnv,
    });

    expect(result).toMatchObject({
      requested: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.call_results).toHaveLength(2);
    expect(result.call_results[0]).toMatchObject({
      schema: "helix.capability_lane.shadow_one_shot_result.v1",
      ok: false,
      lane_id: "visual_analysis",
      capability: "visual_analysis.inspect_frame",
      error: "capability_lane_shadow_only_not_executed",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.call_results[1]).toMatchObject({
      schema: "helix.capability_lane.shadow_one_shot_result.v1",
      ok: false,
      lane_id: "text_to_speech",
      capability: "text_to_speech.synthesize",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.resolve_traces[0]).toMatchObject({
      requested_lane: "visual_analysis",
      requested_backend_provider: "openai_compatible",
      selected_backend_provider: "visual_analysis.openai_compatible",
      execution_status: "not_executed_shadow_only",
      blocked_reason: "capability_lane_shadow_only_not_executed",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.resolve_traces[1]).toMatchObject({
      requested_lane: "text_to_speech",
      requested_backend_provider: "elevenlabs",
      selected_backend_provider: "text_to_speech.elevenlabs",
      execution_status: "not_executed_shadow_only",
      blocked_reason: "capability_lane_shadow_only_not_executed",
    });
    expect(result.observation_packets.map((packet) => packet.status)).toEqual(["blocked", "blocked"]);
    expect(result.observation_packets[0]?.state_delta).toMatchObject({
      capability_lane_shadow_execution: {
        lane_id: "visual_analysis",
        capability: "visual_analysis.inspect_frame",
        execution_status: "not_executed_shadow_only",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(result.debug_events.map((event) => event.stage)).toEqual([
      "lane_requested",
      "lane_backend_selected",
      "lane_observation",
      "lane_requested",
      "lane_backend_selected",
      "lane_observation",
      "lane_reentered",
    ]);
    expect(result.debug_events[2]).toMatchObject({
      stage: "lane_observation",
      lane_id: "visual_analysis",
      capability: "visual_analysis.inspect_frame",
      status: "blocked",
      execution_status: "not_executed_shadow_only",
      terminal_authority_status: "pending_helix_terminal_authority",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.debug_projection.capability_lane_reentry_status).toBe("observation_packet_required_for_provider_reentry");
  });

  it("ignores unknown lane calls instead of inventing execution", () => {
    const result = runHelixCapabilityLaneOneShotRequests({
      provider: buildProvider("codex"),
      body: {
        capability_lane_call: {
          capability: "random_provider.do_anything",
        },
      },
      env: {} as NodeJS.ProcessEnv,
    });

    expect(result.requested).toBe(true);
    expect(result.call_results).toEqual([]);
    expect(result.observation_packets).toEqual([]);
    expect(result.resolve_traces).toEqual([]);
    expect(result.debug_events).toEqual([]);
    expect(result.debug_projection.capability_lane_reentry_status).toBe("not_requested");
  });

  it("does not execute lane calls from prompt text alone", () => {
    const result = runHelixCapabilityLaneOneShotRequests({
      provider: buildProvider("codex"),
      body: {
        question: "Please translate hello to Spanish.",
      },
      env: {} as NodeJS.ProcessEnv,
    });

    expect(result.requested).toBe(false);
    expect(result.call_results).toEqual([]);
    expect(result.observation_packets).toEqual([]);
    expect(result.resolve_traces).toEqual([]);
    expect(result.debug_events).toEqual([]);
    expect(result.debug_projection.capability_lane_reentry_status).toBe("not_requested");
  });
});
