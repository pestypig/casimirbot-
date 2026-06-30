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
    });
  });
});
