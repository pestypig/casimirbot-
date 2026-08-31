import {
  HELIX_USER_ACCOUNT_POLICY,
  HELIX_USER_WORKSTATION_PANEL_IDS,
} from "@shared/helix-account-session";
import {
  HELIX_PUBLIC_UI_AGENT_CATALOG_SCHEMA,
  HELIX_PUBLIC_UI_AUTHORITY_BINDINGS,
  HELIX_PUBLIC_UI_MCP_BINDINGS,
  HELIX_PUBLIC_UI_SURFACE_CATALOG,
  type HelixPublicUiAuthorityState,
  type HelixPublicUiControlCatalogEntry,
  type HelixPublicUiInteractionKind,
} from "@shared/helix-public-ui-affordance";
import { HELIX_PUBLIC_UI_CONTROL_CATALOG } from "@shared/helix-public-ui-control-catalog.generated";

import { listWorkstationGatewayCapabilities } from "./workstation-tool-gateway/registry";

export const HELIX_PUBLIC_UI_CAPABILITY_AUDIT_SCHEMA =
  "helix.public_ui_capability_audit.v1" as const;

export type HelixPublicUiCapabilityAuditRow = {
  capability_id: string;
  authority_state: HelixPublicUiAuthorityState;
  command_surface_id: "helix.ask";
  projection_surface_id: string;
  account_scope: "user" | "user_feature_gated";
  interaction_kind: HelixPublicUiInteractionKind;
  permission_profile_required: "observe" | "read" | "act";
  requires_confirmation: boolean;
  mutating: boolean;
  terminal_eligible: false;
  post_tool_model_step_required: true;
};

export type HelixPublicUiCapabilityAudit = {
  schema: typeof HELIX_PUBLIC_UI_CAPABILITY_AUDIT_SCHEMA;
  verdict: "PASS" | "FAIL";
  account_type: "user";
  rows: HelixPublicUiCapabilityAuditRow[];
  orphan_capability_ids: string[];
  control_binding_failures: HelixPublicUiControlBindingFailure[];
};

export type HelixPublicUiControlBindingFailure = {
  control_id: string;
  capability_id: string;
  reason:
    | "capability_not_in_public_policy_catalog"
    | "authority_state_mismatch"
    | "projection_surface_mismatch"
    | "account_scope_mismatch"
    | "interaction_kind_mismatch";
};

export type HelixPublicUiAgentCatalog = {
  schema: typeof HELIX_PUBLIC_UI_AGENT_CATALOG_SCHEMA;
  account_type: "user";
  surfaces: typeof HELIX_PUBLIC_UI_SURFACE_CATALOG;
  controls: typeof HELIX_PUBLIC_UI_CONTROL_CATALOG;
  capabilities: HelixPublicUiCapabilityAuditRow[];
  mcp_bindings: typeof HELIX_PUBLIC_UI_MCP_BINDINGS;
  orphan_capability_ids: string[];
  control_binding_failures: HelixPublicUiControlBindingFailure[];
  content_role: "public_ui_catalog_observation_not_assistant_answer";
  credential_included: false;
  private_state_included: false;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

const publicPanelIds = new Set<string>(HELIX_USER_WORKSTATION_PANEL_IDS);
const routeBindingByCapabilityId = new Map(
  HELIX_PUBLIC_UI_AUTHORITY_BINDINGS.map((binding) => [binding.capability_id, binding]),
);

const projectionSurfaceForGatewayPanel = (
  capabilityId: string,
  panelId: string | null | undefined,
): { surface_id: string; account_scope: "user" | "user_feature_gated" } => {
  if (panelId && publicPanelIds.has(panelId)) {
    return { surface_id: `workstation.panel.${panelId}`, account_scope: "user" };
  }
  if (capabilityId.startsWith("situation-room.")) {
    return {
      surface_id: "helix.ask.shared_live_room",
      account_scope: "user_feature_gated",
    };
  }
  return { surface_id: "helix.ask", account_scope: "user" };
};

const interactionKindForGatewayMode = (
  mode: string,
): HelixPublicUiInteractionKind => {
  if (mode === "observe" || mode === "read" || mode === "verify") return "observe";
  if (mode === "act") return "act";
  return "human_only";
};

export const auditHelixPublicUiControlBindings = (
  capabilityRows: readonly HelixPublicUiCapabilityAuditRow[],
  controls: readonly HelixPublicUiControlCatalogEntry[],
): HelixPublicUiControlBindingFailure[] => {
  const capabilityById = new Map(capabilityRows.map((row) => [row.capability_id, row]));
  const failures: HelixPublicUiControlBindingFailure[] = [];
  for (const control of controls) {
    const capabilityId = control.capability_id ?? control.route_contract_id;
    if (!capabilityId) continue;
    const row = capabilityById.get(capabilityId);
    if (!row) {
      failures.push({
        control_id: control.control_id,
        capability_id: capabilityId,
        reason: "capability_not_in_public_policy_catalog",
      });
      continue;
    }
    const expectedAuthority = control.capability_id ? "shared_gateway" : "route_owned";
    if (control.authority_state !== expectedAuthority || row.authority_state !== expectedAuthority) {
      failures.push({
        control_id: control.control_id,
        capability_id: capabilityId,
        reason: "authority_state_mismatch",
      });
    }
    if (control.surface_id !== row.projection_surface_id) {
      failures.push({
        control_id: control.control_id,
        capability_id: capabilityId,
        reason: "projection_surface_mismatch",
      });
    }
    if (control.account_scope !== row.account_scope) {
      failures.push({
        control_id: control.control_id,
        capability_id: capabilityId,
        reason: "account_scope_mismatch",
      });
    }
    if (control.interaction_kind !== row.interaction_kind) {
      failures.push({
        control_id: control.control_id,
        capability_id: capabilityId,
        reason: "interaction_kind_mismatch",
      });
    }
  }
  return failures.sort((left, right) =>
    `${left.control_id}:${left.reason}`.localeCompare(`${right.control_id}:${right.reason}`),
  );
};

export const auditHelixPublicUserUiCapabilities = (): HelixPublicUiCapabilityAudit => {
  const gatewayManifests = listWorkstationGatewayCapabilities({
    agentRuntime: "codex",
    mode: "act",
  }).capabilities;
  const gatewayByCapabilityId = new Map(
    gatewayManifests.map((manifest) => [manifest.capability_id, manifest]),
  );
  const rows: HelixPublicUiCapabilityAuditRow[] = [];
  const orphanCapabilityIds: string[] = [];

  for (const capabilityId of HELIX_USER_ACCOUNT_POLICY.allowed_workstation_capabilities) {
    const gateway = gatewayByCapabilityId.get(capabilityId);
    if (gateway) {
      const projection = projectionSurfaceForGatewayPanel(capabilityId, gateway.panel_id);
      rows.push({
        capability_id: capabilityId,
        authority_state: "shared_gateway",
        command_surface_id: "helix.ask",
        projection_surface_id: projection.surface_id,
        account_scope: projection.account_scope,
        interaction_kind: interactionKindForGatewayMode(gateway.mode),
        permission_profile_required: gateway.permission_profile_required,
        requires_confirmation: gateway.requires_confirmation,
        mutating: gateway.mutating,
        terminal_eligible: false,
        post_tool_model_step_required: true,
      });
      continue;
    }

    const routeBinding = routeBindingByCapabilityId.get(capabilityId);
    if (routeBinding) {
      const routeSurface = HELIX_PUBLIC_UI_SURFACE_CATALOG.find(
        (surface) => surface.surface_id === routeBinding.surface_id,
      );
      rows.push({
        capability_id: capabilityId,
        authority_state: "route_owned",
        command_surface_id: "helix.ask",
        projection_surface_id: routeBinding.surface_id,
        account_scope: routeSurface?.account_scope ?? "user",
        interaction_kind: routeBinding.interaction_kind,
        permission_profile_required: routeBinding.permission_profile_required,
        requires_confirmation: routeBinding.requires_confirmation,
        mutating: routeBinding.interaction_kind === "act",
        terminal_eligible: false,
        post_tool_model_step_required: true,
      });
      continue;
    }

    orphanCapabilityIds.push(capabilityId);
  }

  const sortedRows = rows.sort((left, right) => left.capability_id.localeCompare(right.capability_id));
  const controlBindingFailures = auditHelixPublicUiControlBindings(
    sortedRows,
    HELIX_PUBLIC_UI_CONTROL_CATALOG as readonly HelixPublicUiControlCatalogEntry[],
  );
  return {
    schema: HELIX_PUBLIC_UI_CAPABILITY_AUDIT_SCHEMA,
    verdict:
      orphanCapabilityIds.length === 0 && controlBindingFailures.length === 0
        ? "PASS"
        : "FAIL",
    account_type: "user",
    rows: sortedRows,
    orphan_capability_ids: orphanCapabilityIds.sort(),
    control_binding_failures: controlBindingFailures,
  };
};

/**
 * Runtime-safe public catalog projection for agent/MCP discovery. It contains
 * only stable public identifiers and policy metadata. Source paths, handler
 * expressions, DOM access, credentials, and execution authority are excluded.
 */
export const buildHelixPublicUiAgentCatalog = (): HelixPublicUiAgentCatalog => {
  const capabilityAudit = auditHelixPublicUserUiCapabilities();
  return {
    schema: HELIX_PUBLIC_UI_AGENT_CATALOG_SCHEMA,
    account_type: "user",
    surfaces: HELIX_PUBLIC_UI_SURFACE_CATALOG,
    controls: HELIX_PUBLIC_UI_CONTROL_CATALOG,
    capabilities: capabilityAudit.rows,
    mcp_bindings: HELIX_PUBLIC_UI_MCP_BINDINGS,
    orphan_capability_ids: capabilityAudit.orphan_capability_ids,
    control_binding_failures: capabilityAudit.control_binding_failures,
    content_role: "public_ui_catalog_observation_not_assistant_answer",
    credential_included: false,
    private_state_included: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};
