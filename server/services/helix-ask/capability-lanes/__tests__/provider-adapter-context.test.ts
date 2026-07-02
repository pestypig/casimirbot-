import { describe, expect, it } from "vitest";
import type { HelixAgentProvider } from "../../agent-providers/types";
import { buildHelixCapabilityLaneProviderAdapterContext } from "../provider-adapter-context";

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
    capabilityLaneSessions: true,
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
  turn_id: "turn-provider-adapter-context",
  capability_lane_call: {
    capability: "utility_text.normalize_text",
    text: "  HELLO   WORKSTATION  ",
    normalization_mode: "lowercase",
    requested_backend_provider: "utility_text.openai_compatible",
  },
};

describe("capability lane provider adapter context", () => {
  it("packages one-shot lane execution for any selected runtime provider", () => {
    const helix = buildHelixCapabilityLaneProviderAdapterContext({
      provider: buildProvider("helix"),
      body,
      env: {} as NodeJS.ProcessEnv,
    });
    const codex = buildHelixCapabilityLaneProviderAdapterContext({
      provider: buildProvider("codex"),
      body,
      env: {} as NodeJS.ProcessEnv,
    });

    expect(helix).toMatchObject({
      schema: "helix.capability_lane.provider_adapter_context.v1",
      calls_succeeded: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(codex).toMatchObject({
      schema: "helix.capability_lane.provider_adapter_context.v1",
      calls_succeeded: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(helix.debug_projection.capability_lane_call_results).toEqual([
      expect.objectContaining({
        capability: "utility_text.normalize_text",
        selected_runtime_agent_provider: "helix",
        normalized_text: "hello workstation",
      }),
    ]);
    expect(codex.debug_projection.capability_lane_call_results).toEqual([
      expect.objectContaining({
        capability: "utility_text.normalize_text",
        selected_runtime_agent_provider: "codex",
        normalized_text: "hello workstation",
      }),
    ]);
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
    expect(codex.artifact_ledger).toEqual([
      expect.objectContaining({
        schema: "helix.current_turn_artifact.v1",
        kind: "capability_lane_observation_packet",
        observation_kind: "utility_text.normalize_text",
        capability_key: "utility_text.normalize_text",
        selected_backend_provider: "utility_text.local_runtime",
        backend_selection_decision: expect.objectContaining({
          selected_backend_provider: "utility_text.local_runtime",
          terminal_authority_owner: "helix",
        }),
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(codex.prompt_observation_block).toContain("hello workstation");
    expect(codex.prompt_observation_block).toContain("utility_text.normalize_text");
    expect(codex.prompt_observation_block).toContain("capability_lane_observation_packets");
    expect(codex.prompt_observation_block).toContain("capability_lane_backend_selections");
    expect(codex.prompt_observation_block).toContain("capability_lane_session_debug_summaries");
    expect(codex.prompt_observation_block).toContain("capability_lane_reentry_status");
  });

  it("packages governed lane session lifecycle calls for the selected runtime provider", () => {
    const context = buildHelixCapabilityLaneProviderAdapterContext({
      provider: buildProvider("codex"),
      body: {
        turn_id: "turn-provider-adapter-session",
        capability_lane_session_call: {
          action: "start",
          lane_id: "live_translation",
          lane_session_id: "lane-session-provider-context",
          requested_backend_provider: "google_gemini",
          now_ms: 200,
          source_binding: {
            source_id: "docs:nhm2",
            source_kind: "docs",
            projection_target: "docs_chunk",
            account_locale: "es-US",
          },
        },
      },
      env: {} as NodeJS.ProcessEnv,
    });

    expect(context.calls_succeeded).toBe(true);
    expect(context.sessions).toMatchObject({
      schema: "helix.capability_lane.session_runner_result.v1",
      requested: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(context.debug_projection.capability_lane_session_results).toEqual([
      expect.objectContaining({
        ok: true,
        action: "start",
        blocked_reason: null,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(context.debug_projection.capability_lane_session_debug_summaries).toEqual([
      expect.objectContaining({
        schema: "helix.capability_lane.session_debug_summary.v1",
        lane_session_id: "lane-session-provider-context",
        lane_id: "live_translation",
        selected_runtime_agent_provider: "codex",
        selected_backend_provider: "live_translation.local_runtime",
        backend_selection_decision: expect.objectContaining({
          outcome: "fallback_selected",
          requested_backend_provider: "google_gemini",
          selected_backend_provider: "live_translation.local_runtime",
          selected_runtime_provider_remains_root: true,
          backend_provider_becomes_root_agent: false,
          terminal_authority_owner: "helix",
        }),
        session_status: "running",
        session_health: "healthy",
        source_id: "docs:nhm2",
        projection_target: "docs_chunk",
        account_locale: "es-US",
        backend_provider_becomes_root_agent: false,
        final_reports_require_terminal_authority: true,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(context.prompt_observation_block).toContain("capability_lane_session_results");
    expect(context.prompt_observation_block).toContain("capability_lane_session_debug_summaries");
    expect(context.prompt_observation_block).toContain("lane-session-provider-context");
    expect(context.prompt_observation_block).toContain("fallback_selected");
    expect(context.prompt_observation_block).toContain("final_reports_require_terminal_authority");
  });

  it("exposes projection receipts at the provider adapter edge without answer authority", () => {
    const context = buildHelixCapabilityLaneProviderAdapterContext({
      provider: buildProvider("codex"),
      body: {
        turn_id: "turn-provider-adapter-translation-receipt",
        capability_lane_call: {
          capability: "live_translation.translate_text",
          text: "thank you",
          source_language: "en",
          target_language: "fr",
          source_id: "docs:nhm2",
          chunk_id: "chunk-11",
          chunk_index: 11,
          dedupe_key: "docs:nhm2:chunk-11:fr",
          source_event_ms: 1,
          projection_target: "docs_chunk",
          requested_backend_provider: "google_gemini",
        },
      },
      env: {} as NodeJS.ProcessEnv,
    });

    const receipt = context.projection_receipts[0];
    expect(context.calls_succeeded).toBe(true);
    expect(context.projection_receipts).toHaveLength(1);
    expect(receipt).toMatchObject({
      schema: "helix.capability_lane.provider_adapter_receipt.v1",
      kind: "live_translation_projection",
      status: "stale",
      turn_id: "turn-provider-adapter-translation-receipt",
      capability_key: "live_translation.translate_text",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(receipt?.receipt_ref).toContain(`${receipt?.observation_ref}:projection:`);
    expect(receipt?.payload).toMatchObject({
      schema: "helix.live_translation.projection_receipt.v1",
      lane_id: "live_translation",
      capability: "live_translation.translate_text",
      projection_target: "docs_chunk",
      projection_status: "stale",
      source_id: "docs:nhm2",
      chunk_id: "chunk-11",
      chunk_index: 11,
      dedupe_key: "docs:nhm2:chunk-11:fr",
      source_event_ms: 1,
      target_language: "fr",
      translated_text: "merci",
      stale: true,
      cancel_requested: false,
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(context.one_shot.resolve_traces[0]?.receipt_ref).toBe(receipt?.receipt_ref);
    expect(context.one_shot.backend_selections[0]?.receipt_ref).toBe(receipt?.receipt_ref);
    expect(context.one_shot.debug_events[2]?.receipt_ref).toBe(receipt?.receipt_ref);
    expect(context.debug_projection.capability_lane_projection_receipts).toEqual([
      expect.objectContaining({
        receipt_ref: receipt?.receipt_ref,
        observation_ref: receipt?.observation_ref,
        capability_key: "live_translation.translate_text",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(context.prompt_observation_block).toContain("capability_lane_projection_receipts");
    expect(context.prompt_observation_block).toContain(receipt?.receipt_ref ?? "");
    expect(context.prompt_observation_block).toContain("live_translation_projection");
  });

  it("exposes shadow future-lane packets and backend selections to the runtime provider context", () => {
    const context = buildHelixCapabilityLaneProviderAdapterContext({
      provider: buildProvider("codex"),
      body: {
        turn_id: "turn-provider-adapter-shadow-lane",
        capability_lane_call: {
          capability: "visual_analysis.inspect_frame",
          requested_backend_provider: "openai_compatible",
          frame_ref: "frame:test",
        },
      },
      env: {
        OPENAI_API_KEY: "test-openai",
      } as NodeJS.ProcessEnv,
    });

    expect(context.calls_succeeded).toBe(false);
    expect(context.projection_receipts).toEqual([]);
    expect(context.one_shot.call_results[0]).toMatchObject({
      schema: "helix.capability_lane.shadow_one_shot_result.v1",
      ok: false,
      lane_id: "visual_analysis",
      capability: "visual_analysis.inspect_frame",
      error: "capability_lane_shadow_only_not_executed",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(context.observation_packets[0]).toMatchObject({
      capability_key: "visual_analysis.inspect_frame",
      status: "blocked",
      backend_selection_decision: expect.objectContaining({
        outcome: "requested_selected",
        requested_backend_provider: "openai_compatible",
        selected_backend_provider: "visual_analysis.openai_compatible",
        selected_runtime_provider_remains_root: true,
        backend_provider_becomes_root_agent: false,
        terminal_authority_owner: "helix",
      }),
      state_delta: {
        capability_lane_shadow_execution: expect.objectContaining({
          lane_id: "visual_analysis",
          capability: "visual_analysis.inspect_frame",
          requested_backend_provider: "openai_compatible",
          selected_backend_provider: "visual_analysis.openai_compatible",
          availability_status: "dry_run",
          permission_status: "admitted",
          cost_class: "standard",
          latency_class: "interactive",
          privacy_class: "external_provider",
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
    expect(context.artifact_ledger[0]).toMatchObject({
      schema: "helix.current_turn_artifact.v1",
      kind: "capability_lane_observation_packet",
      observation_kind: "visual_analysis.inspect_frame",
      capability_key: "visual_analysis.inspect_frame",
      lane_id: "visual_analysis",
      selected_backend_provider: "visual_analysis.openai_compatible",
      lane_execution_status: "not_executed_shadow_only",
      lane_availability_status: "dry_run",
      lane_permission_status: "admitted",
      lane_cost_class: "standard",
      lane_latency_class: "interactive",
      lane_privacy_class: "external_provider",
      backend_selection_decision: expect.objectContaining({
        outcome: "requested_selected",
        selected_backend_provider: "visual_analysis.openai_compatible",
        backend_provider_becomes_root_agent: false,
        terminal_authority_owner: "helix",
      }),
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(context.prompt_observation_block).toContain("capability_lane_observation_packets");
    expect(context.prompt_observation_block).toContain("capability_lane_backend_selections");
    expect(context.prompt_observation_block).toContain("visual_analysis.inspect_frame");
    expect(context.prompt_observation_block).toContain("visual_analysis.openai_compatible");
    expect(context.prompt_observation_block).toContain("capability_lane_shadow_only_not_executed");
    expect(context.prompt_observation_block).toContain("not_executed_shadow_only");
    expect(context.prompt_observation_block).toContain("observation_packet_required_for_provider_reentry");
  });
});
