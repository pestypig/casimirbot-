import { beforeEach, describe, expect, it } from "vitest";
import { listWorkstationGatewayCapabilities } from "../../workstation-tool-gateway/registry";
import { buildHelixAgentRuntimeSelectionTrace } from "../../agent-providers/runtime-debug";
import { buildHelixAgentProviderAskPayload } from "../../agent-providers/provider-response-projection";
import type { HelixAgentProvider } from "../../agent-providers/types";
import { runHelixCapabilityLaneOneShotRequests } from "../one-shot-runner";
import { resetStagePlayLiveSourceMailboxForTest } from "../../../stage-play/stage-play-live-source-mailbox-store";
import { resetStagePlayLiveSourceMailWakeStoreForTest } from "../../../stage-play/stage-play-live-source-mail-wake-store";

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
    source_id: "document_markdown:docs/example.md",
    source_hash: "fnv1a32:example",
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

beforeEach(() => {
  resetStagePlayLiveSourceMailboxForTest();
  resetStagePlayLiveSourceMailWakeStoreForTest();
});

describe("provider-neutral capability lane one-shot runner", () => {
  it("lets Helix and Codex request the same one-shot translation lane through the same body contract", async () => {
    const helix = await runHelixCapabilityLaneOneShotRequests({
      provider: buildProvider("helix"),
      body,
      env: {} as NodeJS.ProcessEnv,
    });
    const codex = await runHelixCapabilityLaneOneShotRequests({
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
    expect(helix.resolve_traces[0]?.receipt_ref).toContain(
      `${helix.resolve_traces[0]?.observation_ref}:projection:`,
    );
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
    expect(helix.backend_selections[0]?.receipt_ref).toBe(helix.resolve_traces[0]?.receipt_ref);
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
    expect(codex.backend_selections[0]?.receipt_ref).toBe(codex.resolve_traces[0]?.receipt_ref);
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
    expect(codex.resolve_traces[0]?.receipt_ref).toContain(
      `${codex.resolve_traces[0]?.observation_ref}:projection:`,
    );
    expect(helix.observation_packets[0]?.capability_key).toBe("live_translation.translate_text");
    expect(codex.observation_packets[0]?.capability_key).toBe("live_translation.translate_text");
    expect(codex.call_results[0]?.observation).toMatchObject({
      source_id: "document_markdown:docs/example.md",
      source_hash: "fnv1a32:example",
    });
    expect(codex.observation_packets[0]?.state_delta).toMatchObject({
      live_translation_chunk: {
        source_id: "document_markdown:docs/example.md",
        source_hash: "fnv1a32:example",
      },
      live_translation_projection_receipt: {
        source_id: "document_markdown:docs/example.md",
        source_hash: "fnv1a32:example",
      },
    });
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
      availability_status: "dry_run",
      permission_status: "admitted",
      cost_class: "free_local",
      latency_class: "interactive",
      privacy_class: "local_only",
      fallback_backend_provider: null,
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
      availability_status: "dry_run",
      permission_status: "admitted",
      cost_class: "free_local",
      latency_class: "interactive",
      privacy_class: "local_only",
      fallback_backend_provider: null,
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
    expect(codex.debug_events[2]?.receipt_ref).toBe(codex.resolve_traces[0]?.receipt_ref);
    expect(codex.debug_events[3]).toMatchObject({
      stage: "lane_reentered",
      lane_id: "live_translation",
      capability: "live_translation.translate_text",
      requested_backend_provider: "google_gemini",
      selected_backend_provider: "live_translation.local_runtime",
      execution_status: "executed_observation_only",
      observation_ref: codex.resolve_traces[0]?.observation_ref,
      result_ref: codex.resolve_traces[0]?.result_ref,
      reentry_status: "observation_packet_required_for_provider_reentry",
    });
    expect(codex.debug_events[3]?.receipt_ref).toBe(codex.resolve_traces[0]?.receipt_ref);
  });

  it("projects lane call results through the same provider debug/export envelope", async () => {
    const provider = buildProvider("codex");
    const runner = await runHelixCapabilityLaneOneShotRequests({
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

  it("lets Helix and Codex request the same utility text lane through the same body contract", async () => {
    const utilityBody = {
      turn_id: "turn-provider-neutral-utility",
      capability_lane_call: {
        capability: "utility_text.normalize_text",
        text: "  Hello    WORKSTATION  ",
        normalization_mode: "lowercase",
        requested_backend_provider: "utility_text.openai_compatible",
      },
    };
    const helix = await runHelixCapabilityLaneOneShotRequests({
      provider: buildProvider("helix"),
      body: utilityBody,
      env: {} as NodeJS.ProcessEnv,
    });
    const codex = await runHelixCapabilityLaneOneShotRequests({
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

  it("lets Helix and Codex inspect the same workstation tool catalog through the lane contract", async () => {
    const catalogBody = {
      turn_id: "turn-provider-neutral-workstation-catalog",
      capability_lane_call: {
        capability: "workstation_tool_reference.list_capabilities",
        mode: "act",
      },
    };
    const helix = await runHelixCapabilityLaneOneShotRequests({
      provider: buildProvider("helix"),
      body: catalogBody,
      env: {} as NodeJS.ProcessEnv,
    });
    const codex = await runHelixCapabilityLaneOneShotRequests({
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

  it("lets Helix and Codex request Image Lens region inspection as non-terminal crop evidence", async () => {
    const imageRegionBody = {
      turn_id: "turn-provider-neutral-image-lens-region",
      capability_lane_call: {
        capability: "visual_analysis.inspect_image_region",
        source_id: "image-lens-source:test",
        frame_id: "frame:test",
        source_attachment_id: "attachment:image:test",
        source_kind: "image_lens_source",
        source_image_ref: "ephemeral://image/source",
        bbox_px: { x: 4, y: 8, width: 120, height: 64 },
        question: "What equation is in this crop?",
        reason_for_crop: "The equation is small in the full image.",
        detail: "high",
        region_kind: "equation",
        text_candidate: "T00 = rho",
        latex_candidate: "T_{00}=\\rho",
        uncertainty: ["OCR is candidate-only"],
        requested_backend_provider: "openai_compatible",
      },
    };
    const env = { OPENAI_API_KEY: "test-openai" } as NodeJS.ProcessEnv;
    const helix = await runHelixCapabilityLaneOneShotRequests({
      provider: buildProvider("helix"),
      body: imageRegionBody,
      env,
    });
    const codex = await runHelixCapabilityLaneOneShotRequests({
      provider: buildProvider("codex"),
      body: imageRegionBody,
      env,
    });

    expect(helix.call_results).toHaveLength(1);
    expect(codex.call_results).toHaveLength(1);
    expect(codex.call_results[0]).toMatchObject({
      schema: "helix.image_lens_region_inspection_result.v1",
      ok: true,
      lane_id: "visual_analysis",
      capability: "visual_analysis.inspect_image_region",
      selected_runtime_agent_provider: "codex",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
      receipt: {
        schema: "image_lens_region_inspection_receipt/v1",
        capability: "visual_analysis.inspect_image_region",
        bbox_px: { x: 4, y: 8, width: 120, height: 64 },
        text_candidate: "T00 = rho",
        latex_candidate: "T_{00}=\\rho",
        claim_boundary: {
          cropObservationOnly: true,
          ocrCandidateOnly: true,
          notProofAuthority: true,
        },
        document_region_receipt: {
          sourceKind: "image_lens_source",
          classification: {
            kind: "equation",
          },
          claimBoundary: {
            ocrCandidateOnly: true,
            notProofAuthority: true,
          },
        },
      },
    });
    expect(codex.resolve_traces[0]).toMatchObject({
      requested_lane: "visual_analysis",
      requested_backend_provider: "openai_compatible",
      selected_backend_provider: "visual_analysis.openai_compatible",
      execution_status: "executed_observation_only",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(codex.observation_packets[0]).toMatchObject({
      capability_key: "visual_analysis.inspect_image_region",
      panel_id: "image_lens",
      status: "succeeded",
      state_delta: {
        visual_analysis_region_inspection: {
          source_id: "image-lens-source:test",
          frame_id: "frame:test",
          source_attachment_id: "attachment:image:test",
          page_number: null,
          crop_bbox_px: { x: 4, y: 8, width: 120, height: 64 },
          crop_image_ref: "ephemeral://image/source#crop=4,8,120,64",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(codex.observation_packets[0]?.produced_affordances).toEqual([
      expect.objectContaining({
        kind: "image_lens_region_evidence",
        source_capability: "visual_analysis.inspect_image_region",
        status: "available",
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(codex.debug_events.map((event) => event.stage)).toEqual([
      "lane_requested",
      "lane_backend_selected",
      "lane_observation",
      "lane_reentered",
    ]);
    expect(helix.observation_packets[0]?.state_delta).toMatchObject({
      visual_analysis_region_inspection: {
        source_id: "image-lens-source:test",
      },
    });
  });

  it("reports missing Image Lens source as missing input without terminal authority", async () => {
    const result = await runHelixCapabilityLaneOneShotRequests({
      provider: buildProvider("codex"),
      body: {
        turn_id: "turn-provider-neutral-image-lens-missing-source",
        capability_lane_call: {
          capability: "visual_analysis.inspect_image_region",
          bbox_px: { x: 0, y: 0, width: 20, height: 20 },
        },
      },
      env: { OPENAI_API_KEY: "test-openai" } as NodeJS.ProcessEnv,
    });

    expect(result.call_results[0]).toMatchObject({
      ok: false,
      error: "missing_source_id",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation_packets[0]).toMatchObject({
      status: "missing_input",
      missing_requirements: [
        expect.objectContaining({
          code: "missing_source_id",
          repair_action: "provide_source_id",
        }),
      ],
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("normalizes invalid Image Lens bbox values into a stable positive crop", async () => {
    const result = await runHelixCapabilityLaneOneShotRequests({
      provider: buildProvider("codex"),
      body: {
        turn_id: "turn-provider-neutral-image-lens-bbox",
        capability_lane_call: {
          capability: "visual_analysis.inspect_image_region",
          source_id: "image-lens-source:bbox",
          source_image_ref: "ephemeral://image/bbox",
          bbox_px: { x: -4.8, y: 9.9, width: 0, height: -2 },
        },
      },
      env: { OPENAI_API_KEY: "test-openai" } as NodeJS.ProcessEnv,
    });

    expect(result.call_results[0]).toMatchObject({
      ok: true,
      receipt: {
        bbox_px: { x: 0, y: 9, width: 1, height: 1 },
        crop_image_ref: "ephemeral://image/bbox#crop=0,9,1,1",
      },
    });
    expect(result.observation_packets[0]).toMatchObject({
      status: "succeeded",
      state_delta: {
        visual_analysis_region_inspection: {
          crop_bbox_px: { x: 0, y: 9, width: 1, height: 1 },
        },
      },
    });
  });

  it("projects future lane calls and governed TTS receipts as non-terminal observations", async () => {
    const result = await runHelixCapabilityLaneOneShotRequests({
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
            capability: "text_to_speech.speak_text",
            requested_backend_provider: "elevenlabs",
            text: "checking now",
            voice: "dottie_default",
            locale: "en-US",
            source_observation_ref: "obs:test:voice-source",
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
      schema: "helix.text_to_speech.one_shot_result.v1",
      ok: true,
      lane_id: "text_to_speech",
      capability: "text_to_speech.speak_text",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
      receipt: {
        schema: "helix.text_to_speech.receipt.v1",
        capability: "text_to_speech.speak_text",
        playback_status: "started",
        provider_playback_status: "awaiting_client_playback",
        source_text_hash: expect.any(String),
        audio_bytes_observed: false,
        voice_profile: "dottie_default",
        locale: "en-US",
        source_observation_ref: "obs:test:voice-source",
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
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
      requested_backend_provider_known: true,
      requested_backend_fallback_provider: "text_to_speech.existing_voice_service",
      selected_backend_provider: "text_to_speech.existing_voice_service",
      execution_status: "executed_observation_only",
      blocked_reason: null,
    });
    expect(result.observation_packets.map((packet) => packet.status)).toEqual(["blocked", "succeeded"]);
    expect(result.observation_packets[0]?.state_delta).toMatchObject({
      capability_lane_shadow_execution: {
        lane_id: "visual_analysis",
        capability: "visual_analysis.inspect_frame",
        requested_backend_provider: "openai_compatible",
        selected_backend_provider: "visual_analysis.openai_compatible",
        selection_reason: "selected_requested_backend_provider_for_shadow_manifest",
        availability_status: "dry_run",
        permission_status: "admitted",
        cost_class: "standard",
        latency_class: "interactive",
        privacy_class: "external_provider",
        fallback_backend_provider: null,
        execution_status: "not_executed_shadow_only",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(result.observation_packets[0]?.backend_selection_decision).toMatchObject({
      outcome: "requested_selected",
      requested_backend_provider: "openai_compatible",
      selected_backend_provider: "visual_analysis.openai_compatible",
      selected_runtime_provider_remains_root: true,
      backend_provider_becomes_root_agent: false,
      dynamic_switching_executed: false,
      live_backend_execution_enabled: false,
      terminal_authority_owner: "helix",
    });
    expect(result.observation_packets[1]?.state_delta).toMatchObject({
      text_to_speech_receipt: {
        lane_id: "text_to_speech",
        capability: "text_to_speech.speak_text",
        requested_backend_provider: "elevenlabs",
        selected_backend_provider: "text_to_speech.existing_voice_service",
        playback_status: "started",
        source_text_hash: expect.any(String),
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(result.observation_packets[1]?.produced_affordances).toEqual([
      expect.objectContaining({
        kind: "voice_playback_receipt",
        source_capability: "text_to_speech.speak_text",
        artifact_ref: result.call_results[1]?.receipt?.receipt_ref,
        status: "available",
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(result.observation_packets[1]?.typed_handoff_contract).toMatchObject({
      produced_affordance_kinds: ["voice_playback_receipt"],
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.debug_events.map((event) => event.stage)).toEqual([
      "lane_requested",
      "lane_backend_selected",
      "lane_observation",
      "lane_reentered",
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
    expect(result.debug_events[6]).toMatchObject({
      stage: "lane_observation",
      lane_id: "text_to_speech",
      capability: "text_to_speech.speak_text",
      status: "completed",
      execution_status: "executed_observation_only",
      terminal_authority_status: "pending_helix_terminal_authority",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.debug_events[7]).toMatchObject({
      stage: "lane_reentered",
      lane_id: "text_to_speech",
      capability: "text_to_speech.speak_text",
      status: "pending",
      observation_ref: result.resolve_traces[1]?.observation_ref,
      receipt_ref: result.resolve_traces[1]?.receipt_ref,
      reentry_status: "observation_packet_required_for_provider_reentry",
      terminal_authority_status: "pending_helix_terminal_authority",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.debug_projection.capability_lane_reentry_status).toBe("observation_packet_required_for_provider_reentry");
  });

  it("composes STT, translation, and TTS lane calls as re-entered non-terminal observations", async () => {
    const result = await runHelixCapabilityLaneOneShotRequests({
      provider: buildProvider("codex"),
      body: {
        turn_id: "turn-provider-neutral-stt-compose",
        capability_lane_call: [
          {
            capability: "speech_to_text.transcribe_audio",
            audio_ref: "voice:audio:compose",
            audio_hash: "audio-hash-compose",
            transcript_text: "hello workstation",
            language: "en",
            source_id: "audio_transcript:helix-ask:desktop",
            thread_id: "helix-ask:desktop",
            capture_session_id: "capture:compose",
            chunk_index: 0,
          },
          {
            capability: "live_translation.translate_text",
            text: "hello workstation",
            source_language: "en",
            target_language: "es",
            source_id: "audio_transcript:helix-ask:desktop",
            projection_target: "audio_chunk",
          },
          {
            capability: "text_to_speech.speak_text",
            text: "hola estacion de trabajo",
            source_observation_ref: "turn-provider-neutral-stt-compose:translation",
          },
        ],
      },
      env: {
        OPENAI_API_KEY: "test-openai",
      } as NodeJS.ProcessEnv,
    });

    expect(result.call_results.map((entry) => entry.capability)).toEqual([
      "speech_to_text.transcribe_audio",
      "live_translation.translate_text",
      "text_to_speech.speak_text",
    ]);
    expect(result.observation_packets).toHaveLength(3);
    expect(result.observation_packets.map((packet) => packet.capability_key)).toEqual([
      "speech_to_text.transcribe_audio",
      "live_translation.translate_text",
      "text_to_speech.speak_text",
    ]);
    expect(result.observation_packets.every((packet) => packet.terminal_eligible === false)).toBe(true);
    expect(result.observation_packets.every((packet) => packet.assistant_answer === false)).toBe(true);
    expect(result.observation_packets[0]).toMatchObject({
      status: "succeeded",
      state_delta: {
        speech_to_text_observation: expect.objectContaining({
          schema: "helix.speech_to_text.observation.v1",
          source_kind: "audio_transcript",
          stage_play_mail_id: expect.stringMatching(/^stage_play_live_source_mail:/),
          terminal_eligible: false,
          assistant_answer: false,
          raw_audio_included: false,
        }),
        speech_to_text_live_source_mail_item: expect.objectContaining({
          sourceKind: "audio_transcript",
          status: "unread",
          context_role: "tool_evidence",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      },
    });
    expect(result.observation_packets[1]).toMatchObject({
      status: "succeeded",
      state_delta: {
        live_translation_chunk: expect.objectContaining({
          projection_target: "audio_chunk",
          source_id: "audio_transcript:helix-ask:desktop",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      },
    });
    expect(result.observation_packets[2]).toMatchObject({
      status: "succeeded",
      state_delta: {
        text_to_speech_receipt: expect.objectContaining({
          capability: "text_to_speech.speak_text",
          playback_status: "started",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      },
    });
    expect(result.debug_events.filter((event) => event.stage === "lane_observation").map((event) => event.capability)).toEqual([
      "speech_to_text.transcribe_audio",
      "live_translation.translate_text",
      "text_to_speech.speak_text",
    ]);
    expect(result.debug_projection.capability_lane_reentry_status).toBe("observation_packet_required_for_provider_reentry");
  });

  it("fails closed on unknown structured lane calls instead of dropping the request", async () => {
    const result = await runHelixCapabilityLaneOneShotRequests({
      provider: buildProvider("codex"),
      body: {
        turn_id: "turn-provider-neutral-unknown-lane",
        capability_lane_call: {
          capability: "random_provider.do_anything",
          requested_backend_provider: "random_provider.backend",
        },
      },
      env: {} as NodeJS.ProcessEnv,
    });

    expect(result.requested).toBe(true);
    expect(result.call_results).toHaveLength(1);
    expect(result.call_results[0]).toMatchObject({
      schema: "helix.capability_lane.shadow_one_shot_result.v1",
      ok: false,
      lane_id: "random_provider",
      capability: "random_provider.do_anything",
      selected_runtime_agent_provider: "codex",
      error: "unknown_capability_lane",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.resolve_traces[0]).toMatchObject({
      requested_lane: "random_provider",
      lane_status: "unknown",
      admission_status: "blocked",
      requested_backend_provider: "random_provider.backend",
      requested_backend_provider_known: false,
      selected_backend_provider: null,
      execution_status: "not_executed_shadow_only",
      blocked_reason: "unknown_capability_lane",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation_packets[0]).toMatchObject({
      turn_id: "turn-provider-neutral-unknown-lane",
      capability_key: "random_provider.do_anything",
      status: "blocked",
      missing_requirements: [
        expect.objectContaining({
          code: "unknown_capability_lane",
          repair_action: "use_configured_lane_backend_or_supported_capability",
        }),
      ],
      state_delta: {
        capability_lane_shadow_execution: expect.objectContaining({
          lane_id: "random_provider",
          capability: "random_provider.do_anything",
          requested_backend_provider: "random_provider.backend",
          selected_backend_provider: null,
          execution_status: "not_executed_shadow_only",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.debug_events.map((event) => event.stage)).toEqual([
      "lane_requested",
      "lane_backend_selected",
      "lane_observation",
      "lane_reentered",
    ]);
    expect(result.debug_events[2]).toMatchObject({
      stage: "lane_observation",
      status: "blocked",
      lane_id: "random_provider",
      capability: "random_provider.do_anything",
      selected_backend_provider: null,
      execution_status: "not_executed_shadow_only",
      terminal_authority_status: "pending_helix_terminal_authority",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.debug_projection.capability_lane_reentry_status).toBe(
      "observation_packet_required_for_provider_reentry",
    );
  });

  it("does not execute lane calls from prompt text alone", async () => {
    const result = await runHelixCapabilityLaneOneShotRequests({
      provider: buildProvider("codex"),
      body: {
        question: "Please translate hello to Spanish, then inspect the crop in the image lens.",
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
