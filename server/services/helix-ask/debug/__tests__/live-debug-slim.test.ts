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
      capability_lane_goal_dispatch_readiness: {
        schema: "helix.capability_lane.goal_dispatch_readiness.v1",
        status: "ready",
        next_lane_ids: ["live_translation"],
        next_lane_session_ids: ["lane-session-debug"],
        next_evidence_refs: ["ask:lane:translation:obs"],
        next_receipt_refs: ["ask:lane:translation:obs:projection:receipt"],
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
      capability_lane_goal_dispatch_readiness: {
        schema: "helix.capability_lane.goal_dispatch_readiness.v1",
        status: "ready",
        next_lane_ids: ["live_translation"],
        next_lane_session_ids: ["lane-session-debug"],
        next_evidence_refs: ["ask:lane:translation:obs"],
        next_receipt_refs: ["ask:lane:translation:obs:projection:receipt"],
      },
    });
  });
});
