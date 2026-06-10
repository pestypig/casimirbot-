import { describe, expect, it } from "vitest";
import {
  WORKSTATION_SHELL_CAPABILITIES,
  WORKSTATION_SHELL_CAPABILITY_CONTRACT_VERSION,
  findWorkstationShellCapability,
} from "../workstation-shell-capabilities";
import { WORKSTATION_VIEW_STATE_CONTRACT_VERSION } from "../workstation-view-state";

describe("workstation shell capabilities", () => {
  it("defines deep-link and restore contracts as diagnostic shell capabilities", () => {
    expect(WORKSTATION_SHELL_CAPABILITY_CONTRACT_VERSION).toBe(
      "helix.workstation_shell_capabilities.v1",
    );

    expect(WORKSTATION_SHELL_CAPABILITIES.map((entry) => entry.capability_id)).toEqual([
      "workstation.deep_link_state",
      "workstation.restore_view_state",
    ]);

    for (const capability of WORKSTATION_SHELL_CAPABILITIES) {
      expect(capability.supported_query_params).toEqual([
        "panels",
        "focus",
        "doc",
        "anchor",
      ]);
      expect(capability.path_policy).toBe("workspace_relative_path_ref_only");
      expect(capability.passive_restore_emits_receipt).toBe(false);
      expect(capability.workspace_os_status_executes).toBe(false);
    }
  });

  it("marks agent-triggered restore as receipt-producing without exposing raw paths", () => {
    expect(findWorkstationShellCapability("workstation.restore_view_state")).toMatchObject({
      action_id: "restore_view_state",
      agent_triggered_emits_receipt: true,
      agent_receipt_kind: "workstation_view_state_restore",
      path_policy: "workspace_relative_path_ref_only",
      view_state_contract_version: WORKSTATION_VIEW_STATE_CONTRACT_VERSION,
    });
  });
});
