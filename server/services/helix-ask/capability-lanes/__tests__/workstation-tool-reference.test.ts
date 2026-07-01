import { describe, expect, it } from "vitest";
import {
  HELIX_WORKSTATION_TOOL_REFERENCE_LIST_REQUEST_SCHEMA,
  type HelixWorkstationToolReferenceListRequest,
} from "@shared/helix-workstation-tool-reference-lane";
import type { HelixAgentProvider } from "../../agent-providers/types";
import { runWorkstationToolReferenceListCapabilities } from "../workstation-tool-reference";

const buildProvider = (input: {
  id: "helix" | "codex";
  workstationTools?: boolean;
}): HelixAgentProvider => ({
  id: input.id,
  label: input.id === "helix" ? "Helix Ask Native" : "Codex Workstation Mode",
  permissionProfile: {
    id: input.id === "helix" ? "helix-native" : "read-observe-act",
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
    streaming: input.id === "helix",
    workstationTools: input.workstationTools ?? true,
    capabilityLanes: true,
    capabilityLaneOneShot: true,
    capabilityLaneSessions: false,
    codeMutation: false,
  },
  runTurn: async () => ({
    ok: false,
    runtime: input.id,
    response_type: "test",
    final_status: "test",
  }),
});

const request = (
  input: Partial<HelixWorkstationToolReferenceListRequest> = {},
): HelixWorkstationToolReferenceListRequest => ({
  schema: HELIX_WORKSTATION_TOOL_REFERENCE_LIST_REQUEST_SCHEMA,
  capability: "workstation_tool_reference.list_capabilities",
  mode: "act",
  requested_backend_provider: null,
  turn_id: "turn-workstation-reference",
  assistant_answer: false,
  terminal_eligible: false,
  ...input,
});

describe("workstation_tool_reference.list_capabilities lane", () => {
  it("returns the governed workstation gateway catalog as non-terminal observation evidence", () => {
    const result = runWorkstationToolReferenceListCapabilities({
      provider: buildProvider({ id: "codex" }),
      request: request(),
      env: {} as NodeJS.ProcessEnv,
    });

    expect(result).toMatchObject({
      schema: "helix.workstation_tool_reference.list_result.v1",
      ok: true,
      lane_id: "workstation_tool_reference",
      capability: "workstation_tool_reference.list_capabilities",
      selected_runtime_agent_provider: "codex",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.capability_count).toBeGreaterThan(0);
    expect(result.lane_resolve_trace).toMatchObject({
      requested_lane: "workstation_tool_reference",
      selected_backend_provider: "workstation_tool_reference.helix_workstation_gateway",
      selection_reason: "selected_default_backend_provider_for_shadow_manifest",
      availability_status: "available",
      permission_status: "admitted",
      cost_class: "free_local",
      latency_class: "local",
      privacy_class: "local_only",
      execution_status: "executed_observation_only",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation).toMatchObject({
      schema: "helix.workstation_tool_reference.list_observation.v1",
      gateway_mode: "act",
      backend_selection_decision: expect.objectContaining({
        outcome: "default_selected",
        selected_backend_provider: "workstation_tool_reference.helix_workstation_gateway",
        terminal_authority_owner: "helix",
      }),
      deterministic: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation?.capability_ids).toContain("docs.search");
    expect(result.observation?.capabilities[0]).toMatchObject({
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation_packet).toMatchObject({
      capability_key: "workstation_tool_reference.list_capabilities",
      action: "list_capabilities",
      status: "succeeded",
      backend_selection_decision: expect.objectContaining({
        outcome: "default_selected",
        selected_backend_provider: "workstation_tool_reference.helix_workstation_gateway",
        live_backend_execution_enabled: false,
      }),
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
      typed_handoff_contract: expect.objectContaining({
        produced_affordance_kinds: ["system_status"],
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    });
  });

  it("fails closed when the selected runtime provider lacks workstation tool permission", () => {
    const result = runWorkstationToolReferenceListCapabilities({
      provider: buildProvider({ id: "codex", workstationTools: false }),
      request: request(),
      env: {} as NodeJS.ProcessEnv,
    });

    expect(result).toMatchObject({
      ok: false,
      error: "selected_runtime_provider_permission_does_not_allow_lane",
      observation: null,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation_packet.status).toBe("blocked");
    expect(result.observation_packet.backend_selection_decision).toMatchObject({
      outcome: "blocked",
      selected_backend_provider: null,
      terminal_authority_owner: "helix",
    });
    expect(result.lane_resolve_trace).toMatchObject({
      requested_lane: "workstation_tool_reference",
      admission_status: "blocked",
      lane_status: "permission_blocked",
      execution_status: "not_executed_shadow_only",
      blocked_reason: "selected_runtime_provider_permission_does_not_allow_lane",
    });
  });
});
