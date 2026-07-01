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
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(codex.prompt_observation_block).toContain("hello workstation");
    expect(codex.prompt_observation_block).toContain("utility_text.normalize_text");
  });
});
