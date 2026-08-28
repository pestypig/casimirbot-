import { HELIX_USER_WORKSTATION_PANEL_IDS } from "./helix-account-session";

export const HELIX_PUBLIC_UI_SURFACE_CATALOG_SCHEMA =
  "helix.public_ui_surface_catalog.v1" as const;
export const HELIX_PUBLIC_UI_CONTROL_SCHEMA =
  "helix.public_ui_control.v1" as const;
export const HELIX_PUBLIC_UI_CONTROL_CATALOG_SCHEMA =
  "helix.public_ui_control_catalog.v1" as const;
export const HELIX_PUBLIC_UI_AGENT_CATALOG_SCHEMA =
  "helix.public_ui_agent_catalog.v1" as const;

export type HelixPublicUiSurfaceFamily =
  | "workstation_shell"
  | "mobile_launcher"
  | "helix_ask"
  | "shared_live_room"
  | "workstation_panel";

export type HelixPublicUiAccountScope =
  | "user"
  | "user_feature_gated";

export type HelixPublicUiInteractionKind =
  | "observe"
  | "navigate"
  | "configure"
  | "act"
  | "human_only";

export type HelixPublicUiAuthorityState =
  | "shared_gateway"
  | "route_owned"
  | "client_local"
  | "blocked_pending_contract"
  | "not_applicable"
  | "unmapped";

export type HelixPublicUiSurfaceCatalogEntry = {
  surface_id: string;
  family: HelixPublicUiSurfaceFamily;
  account_scope: HelixPublicUiAccountScope;
  panel_id?: (typeof HELIX_USER_WORKSTATION_PANEL_IDS)[number];
  description: string;
};

export type HelixPublicUiAuthorityBinding = {
  surface_id: string;
  capability_id: string;
  authority_state: "shared_gateway" | "route_owned";
  interaction_kind: HelixPublicUiInteractionKind;
  permission_profile_required: "observe" | "read" | "act";
  requires_confirmation: boolean;
  notes: string;
};

export type HelixPublicUiControlCatalogEntry = {
  control_id: string;
  surface_id: string;
  account_scope: HelixPublicUiAccountScope;
  interaction_kind: HelixPublicUiInteractionKind;
  authority_state: Exclude<HelixPublicUiAuthorityState, "unmapped">;
  capability_id?: string;
  route_contract_id?: string;
};

const PUBLIC_PANEL_SURFACES: HelixPublicUiSurfaceCatalogEntry[] =
  HELIX_USER_WORKSTATION_PANEL_IDS.map((panelId) => ({
    surface_id: `workstation.panel.${panelId}`,
    family: "workstation_panel",
    account_scope: "user",
    panel_id: panelId,
    description: `Public workstation panel: ${panelId}`,
  }));

/**
 * Canonical discovery catalog for UI surfaces reachable by a public-user
 * account. This catalog does not grant tool or route authority. Individual
 * controls remain human-only/unmapped until an explicit capability contract
 * associates them with a gateway or route-owned operation.
 */
export const HELIX_PUBLIC_UI_SURFACE_CATALOG = [
  {
    surface_id: "workstation.shell",
    family: "workstation_shell",
    account_scope: "user",
    description: "Desktop workstation navigation and panel-host controls.",
  },
  {
    surface_id: "workstation.mobile_launcher",
    family: "mobile_launcher",
    account_scope: "user",
    description: "Mobile workstation launcher and public session controls.",
  },
  {
    surface_id: "helix.ask",
    family: "helix_ask",
    account_scope: "user",
    description: "Helix Ask composer, turn, runtime, history, attachment, and voice controls.",
  },
  {
    surface_id: "helix.ask.shared_live_room",
    family: "shared_live_room",
    account_scope: "user_feature_gated",
    description: "Shared Live Room controls when the public-room feature is enabled.",
  },
  ...PUBLIC_PANEL_SURFACES,
] as const satisfies readonly HelixPublicUiSurfaceCatalogEntry[];

/**
 * Public policy capabilities implemented by an account-policy-enforced route
 * instead of the shared workstation gateway. Keeping these exceptions typed
 * prevents an audit from misreporting them as missing gateway registrations.
 */
export const HELIX_PUBLIC_UI_ROUTE_OWNED_CAPABILITIES = [
  "scientific-calculator.run_theory_runtime",
  "scientific-calculator.read_theory_runtime_result",
  "theory-badge-graph.reflect_discussion_context",
  "postulate.submit_proposal",
] as const;

export const HELIX_PUBLIC_UI_AUTHORITY_BINDINGS = [
  {
    surface_id: "workstation.panel.scientific-calculator",
    capability_id: "scientific-calculator.run_theory_runtime",
    authority_state: "route_owned",
    interaction_kind: "act",
    permission_profile_required: "act",
    requires_confirmation: false,
    notes: "Account-policy-enforced theory runtime start route.",
  },
  {
    surface_id: "workstation.panel.scientific-calculator",
    capability_id: "scientific-calculator.read_theory_runtime_result",
    authority_state: "route_owned",
    interaction_kind: "observe",
    permission_profile_required: "read",
    requires_confirmation: false,
    notes: "Account-policy-enforced theory runtime status/result route.",
  },
  {
    surface_id: "workstation.panel.theory-badge-graph",
    capability_id: "theory-badge-graph.reflect_discussion_context",
    authority_state: "route_owned",
    interaction_kind: "observe",
    permission_profile_required: "read",
    requires_confirmation: false,
    notes: "Legacy public alias for the Ask-owned helix_ask.reflect_theory_context contract.",
  },
  {
    surface_id: "workstation.panel.postulate-board",
    capability_id: "postulate.submit_proposal",
    authority_state: "route_owned",
    interaction_kind: "act",
    permission_profile_required: "act",
    requires_confirmation: false,
    notes: "Postulate submission remains owned by its route contract.",
  },
] as const satisfies readonly HelixPublicUiAuthorityBinding[];

export const listHelixPublicUiSurfaceIds = (): string[] =>
  HELIX_PUBLIC_UI_SURFACE_CATALOG.map((entry) => entry.surface_id);
