import { describe, expect, it } from "vitest";
import type { HelixAgentProvider } from "../types";
import { buildHelixAgentRuntimeAdapterContract } from "../runtime-adapter-contract";

const buildProvider = (input: {
  id: "codex" | "future";
  permissionProfileId: "read-observe" | "read-observe-act";
  act: boolean;
}): HelixAgentProvider => ({
  id: input.id,
  label: input.id === "codex" ? "Codex Workstation Mode" : "Future Agent Wrapper",
  permissionProfile: {
    id: input.permissionProfileId,
    label: input.act ? "Read/observe plus non-mutating workstation action" : "Read/observe only",
    allows: {
      observe: true,
      read: true,
      act: input.act,
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
    ok: false,
    runtime: input.id,
    response_type: "test",
    final_status: "test",
  }),
});

describe("agent runtime adapter contract", () => {
  it("centralizes the Codex provider edge contract for workstation capabilities", () => {
    const contract = buildHelixAgentRuntimeAdapterContract({
      route: "/ask/turn",
      requestedRuntime: "codex",
      provider: buildProvider({
        id: "codex",
        permissionProfileId: "read-observe-act",
        act: true,
      }),
      gatewayMode: "act",
    });

    expect(contract.schema).toBe("helix.agent_runtime_adapter_contract.v1");
    expect(contract.adapter_boundary).toBe("helix_agent_provider_edge");
    expect(contract.selected_runtime).toBe("codex");
    expect(contract.workstation_gateway_manifest.agent_runtime).toBe("codex");
    expect(contract.workstation_gateway_manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: "scientific-calculator.open_panel",
        panel_id: "scientific-calculator",
        action_id: "open_panel",
        permission_profile_required: "act",
      }),
    );
    expect(contract.workstation_gateway_admitted_capability_ids).toContain("scientific-calculator.solve_expression");
    expect(contract.workstation_gateway_admitted_capability_ids).toContain("scientific-calculator.open_panel");
    expect(contract.workstation_gateway_blocked_capability_ids).toEqual([]);
    expect(contract.adapter_invariants.helix_owns_tool_admission).toBe(true);
    expect(contract.adapter_invariants.helix_owns_observation_packets).toBe(true);
    expect(contract.adapter_invariants.helix_owns_terminal_authority).toBe(true);
    expect(contract.adapter_invariants.shell_access_enabled).toBe(false);
    expect(contract.adapter_invariants.file_mutation_enabled).toBe(false);
    expect(contract.adapter_invariants.code_mutation_enabled).toBe(false);
    expect(contract.prompt_policy_lines.join("\n")).toContain("Runtime-specific protocol glue stays inside");
  });

  it("keeps observation-only providers on the same contract while blocking action capabilities", () => {
    const contract = buildHelixAgentRuntimeAdapterContract({
      route: "/ask/turn",
      requestedRuntime: "future",
      provider: buildProvider({
        id: "future",
        permissionProfileId: "read-observe",
        act: false,
      }),
      gatewayMode: "observe",
    });

    expect(contract.selected_runtime).toBe("future");
    expect(contract.workstation_gateway_admitted_capability_ids).toContain("workspace_os.status");
    expect(contract.workstation_gateway_admitted_capability_ids).toContain("scientific-calculator.solve_expression");
    expect(contract.workstation_gateway_blocked_capability_ids).toContain("scientific-calculator.open_panel");
    expect(contract.adapter_invariants.receipts_are_not_answers).toBe(true);
    expect(contract.assistant_answer).toBe(false);
    expect(contract.terminal_eligible).toBe(false);
    expect(contract.raw_content_included).toBe(false);
  });

  it("does not admit action capabilities for read-observe providers even if an act gateway manifest is requested", () => {
    const contract = buildHelixAgentRuntimeAdapterContract({
      route: "/ask/turn",
      requestedRuntime: "future",
      provider: buildProvider({
        id: "future",
        permissionProfileId: "read-observe",
        act: false,
      }),
      gatewayMode: "act",
    });

    expect(contract.workstation_gateway_manifest.mode).toBe("act");
    expect(contract.selected_agent_provider.permission_profile.allows.act).toBe(false);
    expect(contract.workstation_gateway_admitted_capability_ids).toContain("scientific-calculator.solve_expression");
    expect(contract.workstation_gateway_admitted_capability_ids).not.toContain("scientific-calculator.open_panel");
    expect(contract.workstation_gateway_admitted_capability_ids).not.toContain("workstation.open_panel");
    expect(contract.workstation_gateway_blocked_capability_ids).toContain("scientific-calculator.open_panel");
    expect(contract.workstation_gateway_blocked_capability_ids).toContain("workstation.open_panel");
    expect(contract.adapter_invariants.shell_access_enabled).toBe(false);
    expect(contract.adapter_invariants.file_mutation_enabled).toBe(false);
    expect(contract.adapter_invariants.code_mutation_enabled).toBe(false);
  });
});
