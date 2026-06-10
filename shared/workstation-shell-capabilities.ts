import { WORKSTATION_VIEW_STATE_CONTRACT_VERSION } from "./workstation-view-state";

export type WorkstationShellCapabilityId =
  | "workstation.deep_link_state"
  | "workstation.restore_view_state";

export type WorkstationShellCapabilityDefinition = {
  capability_id: WorkstationShellCapabilityId;
  label: string;
  description: string;
  action_id?: "restore_view_state";
  supported_query_params: string[];
  path_policy: "workspace_relative_path_ref_only";
  passive_restore_emits_receipt: false;
  agent_triggered_emits_receipt: boolean;
  agent_receipt_kind?: "workstation_view_state_restore";
  workspace_os_status_executes: false;
  fallbacks: string[];
  evidence_ref: string;
  view_state_contract_version: typeof WORKSTATION_VIEW_STATE_CONTRACT_VERSION;
};

export const WORKSTATION_SHELL_CAPABILITY_CONTRACT_VERSION =
  "helix.workstation_shell_capabilities.v1" as const;

export const WORKSTATION_SHELL_CAPABILITIES: WorkstationShellCapabilityDefinition[] = [
  {
    capability_id: "workstation.deep_link_state",
    label: "Workstation deep-link state",
    description:
      "Reports the shareable workstation view-state contract for panels, focus, docs, and anchors.",
    supported_query_params: ["panels", "focus", "doc", "anchor"],
    path_policy: "workspace_relative_path_ref_only",
    passive_restore_emits_receipt: false,
    agent_triggered_emits_receipt: false,
    workspace_os_status_executes: false,
    fallbacks: ["workstation.panel_focus", "workstation.restore_view_state"],
    evidence_ref: "workstation_deep_link_contract",
    view_state_contract_version: WORKSTATION_VIEW_STATE_CONTRACT_VERSION,
  },
  {
    capability_id: "workstation.restore_view_state",
    label: "Restore workstation view state",
    description:
      "Describes the global workstation shell action that restores panels, focus, docs, and anchors through the workstation action loop.",
    action_id: "restore_view_state",
    supported_query_params: ["panels", "focus", "doc", "anchor"],
    path_policy: "workspace_relative_path_ref_only",
    passive_restore_emits_receipt: false,
    agent_triggered_emits_receipt: true,
    agent_receipt_kind: "workstation_view_state_restore",
    workspace_os_status_executes: false,
    fallbacks: ["workstation.panel_focus", "docs-viewer.open_doc_by_path"],
    evidence_ref: "workstation_restore_view_state_contract",
    view_state_contract_version: WORKSTATION_VIEW_STATE_CONTRACT_VERSION,
  },
];

export function findWorkstationShellCapability(
  capabilityId: WorkstationShellCapabilityId,
  capabilities: readonly WorkstationShellCapabilityDefinition[] = WORKSTATION_SHELL_CAPABILITIES,
): WorkstationShellCapabilityDefinition | null {
  return capabilities.find((entry) => entry.capability_id === capabilityId) ?? null;
}
