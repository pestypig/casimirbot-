import { describe, expect, it } from "vitest";
import { createHelixAskLiveDebugSlimBuilder } from "../live-debug-slim";

const buildSlimDebug = createHelixAskLiveDebugSlimBuilder({
  asDebugExportRecord: (value) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null,
  buildDebugExportMandatoryNextTool: () => null,
  buildDebugExportPhaseControllerTrajectory: () => ({
    schema: "helix.phase_controller_trajectory.v1",
  }),
  buildDebugExportEvidenceReentryProof: () => ({
    schema: "helix.evidence_reentry_proof.v1",
  }),
});

describe("Helix Ask live debug slim", () => {
  it("preserves runtime-provider adapter and capability lane projection fields", () => {
    const slim = buildSlimDebug({
      agent_runtime: "codex",
      agent_runtime_adapter_contract: {
        schema: "helix.agent_runtime_adapter_contract.v1",
      },
      capability_lane_manifest: {
        schema: "helix.capability_lane_manifest.v1",
      },
      model_visible_capability_lane_manifest: {
        schema: "helix.agent_model_visible_capability_lane_manifest.v1",
        lanes: [
          {
            lane_id: "live_translation",
            status: "dry_run",
          },
        ],
      },
      capability_lane_ids: ["utility_text", "workstation_tool_reference"],
      capability_lane_statuses: {
        utility_text: "available",
        workstation_tool_reference: "available",
      },
      capability_lane_resolve_trace_shape: {
        schema: "helix.capability_lane_resolve_trace.v1",
      },
      capability_lane_backend_selections: [
        {
          schema: "helix.capability_lane.backend_selection_summary.v1",
          requested_lane: "live_translation",
          requested_backend_provider: "live_translation.google_gemini",
          selected_backend_provider: "live_translation.local_runtime",
          selection_reason: "requested_backend_unconfigured_default_backend_selected_by_helix_policy",
          receipt_ref: "ask:lane:translation:obs:projection:receipt",
        },
      ],
      capability_lane_debug_events: [
        {
          schema: "helix.capability_lane.debug_event.v1",
          stage: "lane_observation",
          capability: "live_translation.translate_text",
          selected_backend_provider: "live_translation.local_runtime",
          observation_ref: "ask:lane:translation:obs",
          receipt_ref: "ask:lane:translation:obs:projection:receipt",
          terminal_eligible: false,
          assistant_answer: false,
        },
      ],
      capability_lane_projection_receipts: [
        {
          schema: "helix.capability_lane.provider_adapter_receipt.v1",
          receipt_ref: "ask:lane:translation:obs:projection:receipt",
          observation_ref: "ask:lane:translation:obs",
          terminal_eligible: false,
          assistant_answer: false,
        },
      ],
      capability_lane_goal_binding_results: [
        {
          ok: true,
          goal_binding: {
            schema: "helix.capability_lane.goal_binding.v1",
            goal_binding_id: "goal-binding-debug",
            goal_id: "goal:translate-docs",
            lane_session_id: "lane-session-debug",
            lane_id: "live_translation",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
          blocked_reason: null,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      ],
      capability_lane_goal_binding_debug_summaries: [
        {
          schema: "helix.capability_lane.goal_binding_debug_summary.v1",
          goal_binding_id: "goal-binding-debug",
          goal_id: "goal:translate-docs",
          lane_session_id: "lane-session-debug",
          lane_id: "live_translation",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
          latest_mail_loop_summary: {
            schema: "helix.capability_lane.mail_loop_debug_summary.v1",
            lane_session_id: "lane-session-debug",
            packet_count: 2,
            terminal_eligible: false,
            assistant_answer: false,
          },
        },
      ],
      capability_lane_goal_dispatch_readiness: {
        schema: "helix.capability_lane.goal_dispatch_readiness.v1",
        status: "ready",
        next_lane_ids: ["live_translation"],
        next_lane_session_ids: ["lane-session-debug"],
        next_evidence_refs: ["ask:lane:translation:obs"],
        next_receipt_refs: ["ask:lane:translation:obs:projection:receipt"],
      },
      runtime_lane_request_contract: {
        schema: "helix.codex_runtime_lane_request_contract.v1",
        execution_status: "lane_observation_reentered",
        observation_packet_count: 1,
      },
      runtime_lane_request_loop: {
        schema: "helix.codex_runtime_lane_request_loop.v1",
        status: "lane_observation_reentered",
        candidate: {
          capability: "live_translation.translate_text",
        },
      },
      debug: {
        turn_id: "turn-provider-projection",
      },
    });

    expect(slim).toMatchObject({
      schema: "helix.ask.live_debug_slim.v1",
      agent_runtime: "codex",
      agent_runtime_adapter_contract: {
        schema: "helix.agent_runtime_adapter_contract.v1",
      },
      capability_lane_manifest: {
        schema: "helix.capability_lane_manifest.v1",
      },
      model_visible_capability_lane_manifest: {
        schema: "helix.agent_model_visible_capability_lane_manifest.v1",
        lanes: [
          {
            lane_id: "live_translation",
            status: "dry_run",
          },
        ],
      },
      capability_lane_ids: ["utility_text", "workstation_tool_reference"],
      capability_lane_statuses: {
        utility_text: "available",
        workstation_tool_reference: "available",
      },
      capability_lane_resolve_trace_shape: {
        schema: "helix.capability_lane_resolve_trace.v1",
      },
      capability_lane_backend_selections: {
        count: 1,
        sample: [
          expect.objectContaining({
            requested_lane: "live_translation",
            requested_backend_provider: "live_translation.google_gemini",
            selected_backend_provider: "live_translation.local_runtime",
            receipt_ref: "ask:lane:translation:obs:projection:receipt",
          }),
        ],
        truncated: false,
      },
      capability_lane_debug_events: {
        count: 1,
        sample: [
          expect.objectContaining({
            stage: "lane_observation",
            capability: "live_translation.translate_text",
            receipt_ref: "ask:lane:translation:obs:projection:receipt",
            terminal_eligible: false,
            assistant_answer: false,
          }),
        ],
        truncated: false,
      },
      capability_lane_projection_receipts: {
        count: 1,
        sample: [
          expect.objectContaining({
            receipt_ref: "ask:lane:translation:obs:projection:receipt",
            observation_ref: "ask:lane:translation:obs",
            terminal_eligible: false,
            assistant_answer: false,
          }),
        ],
        truncated: false,
      },
      capability_lane_goal_binding_results: {
        count: 1,
        sample: [
          expect.objectContaining({
            ok: true,
            goal_binding: expect.objectContaining({
              goal_binding_id: "goal-binding-debug",
              lane_session_id: "lane-session-debug",
              lane_id: "live_translation",
            }),
            terminal_eligible: false,
            assistant_answer: false,
          }),
        ],
        truncated: false,
      },
      capability_lane_goal_binding_debug_summaries: {
        count: 1,
        sample: [
          expect.objectContaining({
            goal_binding_id: "goal-binding-debug",
            lane_session_id: "lane-session-debug",
            lane_id: "live_translation",
            terminal_eligible: false,
            assistant_answer: false,
          }),
        ],
        truncated: false,
      },
      capability_lane_mail_loop_debug_summaries: {
        count: 1,
        sample: [
          expect.objectContaining({
            schema: "helix.capability_lane.mail_loop_debug_summary.v1",
            lane_session_id: "lane-session-debug",
            packet_count: 2,
            terminal_eligible: false,
            assistant_answer: false,
          }),
        ],
        truncated: false,
      },
      capability_lane_goal_dispatch_readiness: {
        schema: "helix.capability_lane.goal_dispatch_readiness.v1",
        status: "ready",
        next_lane_ids: ["live_translation"],
        next_lane_session_ids: ["lane-session-debug"],
        next_evidence_refs: ["ask:lane:translation:obs"],
        next_receipt_refs: ["ask:lane:translation:obs:projection:receipt"],
      },
      runtime_lane_request_contract: {
        schema: "helix.codex_runtime_lane_request_contract.v1",
        execution_status: "lane_observation_reentered",
        observation_packet_count: 1,
      },
      runtime_lane_request_loop: {
        schema: "helix.codex_runtime_lane_request_loop.v1",
        status: "lane_observation_reentered",
        candidate: {
          capability: "live_translation.translate_text",
        },
      },
    });
  });
});
