import { describe, expect, it } from "vitest";
import type { HelixAgentProvider } from "../../agent-providers/types";
import {
  listHelixCapabilityLanes,
  resolveHelixCapabilityLaneRequest,
} from "../registry";

const buildProvider = (input: {
  id: "helix" | "codex";
  workstationTools?: boolean;
}): HelixAgentProvider => ({
  id: input.id,
  label: input.id === "helix" ? "Helix Ask Native" : "Codex Workstation Mode",
  permissionProfile: {
    id: input.id === "helix" ? "helix-native" : "read-observe-act",
    label: input.id === "helix" ? "Helix native governed runtime" : "Read/observe plus non-mutating action",
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
    streaming: input.id === "helix",
    workstationTools: input.workstationTools ?? true,
    codeMutation: false,
  },
  runTurn: async () => ({
    ok: false,
    runtime: input.id,
    response_type: "test",
    final_status: "test",
  }),
});

describe("Helix capability lane registry", () => {
  it("exposes the same governed lane definitions to Helix and Codex", () => {
    const env = {
      OPENAI_API_KEY: "test-key",
      ELEVENLABS_API_KEY: "test-eleven",
      GOOGLE_GEMINI_API_KEY: "test-gemini",
    } as NodeJS.ProcessEnv;
    const helix = listHelixCapabilityLanes({
      provider: buildProvider({ id: "helix" }),
      env,
    });
    const codex = listHelixCapabilityLanes({
      provider: buildProvider({ id: "codex" }),
      env,
    });

    expect(helix.schema).toBe("helix.capability_lane_manifest.v1");
    expect(helix.policy_mode).toBe("shadow");
    expect(codex.policy_mode).toBe("shadow");
    expect(helix.lane_ids).toEqual(codex.lane_ids);
    expect(helix.lane_ids).toEqual([
      "utility_text",
      "interactive_text",
      "deliberate_text",
      "code_text",
      "speech_to_text",
      "text_to_speech",
      "live_translation",
      "visual_analysis",
      "workstation_tool_reference",
    ]);
    expect(helix.lanes.find((lane) => lane.lane_id === "live_translation")).toMatchObject({
      status: "dry_run",
      backend_family: "google_gemini",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(codex.lanes.find((lane) => lane.lane_id === "workstation_tool_reference")).toMatchObject({
      status: "available",
      backend_family: "helix_workstation_gateway",
      result_authority: "observation_or_receipt_only",
    });
  });

  it("keeps configured AI lanes in dry-run instead of executing them", () => {
    const trace = resolveHelixCapabilityLaneRequest({
      provider: buildProvider({ id: "codex" }),
      requestedLane: "utility_text",
      env: { OPENAI_API_KEY: "test-key" } as NodeJS.ProcessEnv,
    });

    expect(trace).toMatchObject({
      schema: "helix.capability_lane_resolve_trace.v1",
      selected_runtime_agent_provider: "codex",
      requested_lane: "utility_text",
      admission_status: "admitted_shadow_only",
      lane_status: "dry_run",
      resolved_backend_provider: "openai_compatible",
      resolved_model_or_service: "utility_text_default",
      result_ref: null,
      reentry_required: true,
      execution_status: "not_executed_shadow_only",
      blocked_reason: null,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("fails closed for unknown and unconfigured lanes", () => {
    const unknown = resolveHelixCapabilityLaneRequest({
      provider: buildProvider({ id: "helix" }),
      requestedLane: "random_model",
      env: {} as NodeJS.ProcessEnv,
    });
    const unconfigured = resolveHelixCapabilityLaneRequest({
      provider: buildProvider({ id: "helix" }),
      requestedLane: "live_translation",
      env: {} as NodeJS.ProcessEnv,
    });

    expect(unknown).toMatchObject({
      admission_status: "blocked",
      lane_status: "unknown",
      resolved_backend_provider: null,
      resolved_model_or_service: null,
      blocked_reason: "unknown_capability_lane",
      execution_status: "not_executed_shadow_only",
    });
    expect(unconfigured).toMatchObject({
      admission_status: "blocked",
      lane_status: "unconfigured",
      resolved_backend_provider: null,
      resolved_model_or_service: null,
      blocked_reason: "backend_provider_key_or_endpoint_not_configured",
      execution_status: "not_executed_shadow_only",
    });
  });

  it("represents provider permission differences without changing lane definitions", () => {
    const enabled = listHelixCapabilityLanes({
      provider: buildProvider({ id: "codex", workstationTools: true }),
      env: {} as NodeJS.ProcessEnv,
    });
    const blocked = listHelixCapabilityLanes({
      provider: buildProvider({ id: "codex", workstationTools: false }),
      env: {} as NodeJS.ProcessEnv,
    });

    expect(enabled.lane_ids).toEqual(blocked.lane_ids);
    expect(enabled.lanes.find((lane) => lane.lane_id === "workstation_tool_reference")?.status).toBe("available");
    expect(blocked.lanes.find((lane) => lane.lane_id === "workstation_tool_reference")?.status).toBe("permission_blocked");
  });
});
