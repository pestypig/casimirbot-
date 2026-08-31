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

export type HelixPublicUiMcpBinding = {
  tool_name: string;
  capability_id: string;
  command_surface_id: "mcp";
  projection_surface_id: "helix.ask.shared_live_room";
  account_scope: "user_feature_gated";
  interaction_kind: HelixPublicUiInteractionKind;
  authority_state: "route_owned";
  control_ids: readonly string[];
  required_scopes: readonly string[];
  mutating: boolean;
  requires_idempotency_key: boolean;
  requires_signed_delegation: boolean;
  pre_transition_behavior: "deny_full_mcp_transition_required";
  post_transition_behavior: "execute_governed_handler";
  assistant_answer: false;
  terminal_eligible: false;
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
  "room.floor.release",
  "room.floor.acquire",
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
  {
    surface_id: "helix.ask.shared_live_room",
    capability_id: "room.floor.acquire",
    authority_state: "route_owned",
    interaction_kind: "configure",
    permission_profile_required: "act",
    requires_confirmation: false,
    notes: "First-party floor acquisition through the same shared room control handler used by delegated MCP.",
  },
  {
    surface_id: "helix.ask.shared_live_room",
    capability_id: "room.floor.release",
    authority_state: "route_owned",
    interaction_kind: "configure",
    permission_profile_required: "act",
    requires_confirmation: false,
    notes: "Authority-reducing exact-epoch speaking-floor release through the shared room control service.",
  },
] as const satisfies readonly HelixPublicUiAuthorityBinding[];

/**
 * Stable MCP projections for public Shared Live Room operations. These rows
 * describe a route to the same governed room handlers; they do not convert a
 * browser control into DOM automation or grant room authority. Before the
 * native tunnel transition the names are present but fail closed.
 */
export const HELIX_PUBLIC_UI_MCP_BINDINGS = [
  {
    tool_name: "helix_room_list",
    capability_id: "room.list",
    command_surface_id: "mcp",
    projection_surface_id: "helix.ask.shared_live_room",
    account_scope: "user_feature_gated",
    interaction_kind: "observe",
    authority_state: "route_owned",
    control_ids: [],
    required_scopes: ["helix.rooms.read"],
    mutating: false,
    requires_idempotency_key: false,
    requires_signed_delegation: false,
    pre_transition_behavior: "deny_full_mcp_transition_required",
    post_transition_behavior: "execute_governed_handler",
    assistant_answer: false,
    terminal_eligible: false,
  },
  {
    tool_name: "helix_room_inspect",
    capability_id: "room.inspect",
    command_surface_id: "mcp",
    projection_surface_id: "helix.ask.shared_live_room",
    account_scope: "user_feature_gated",
    interaction_kind: "observe",
    authority_state: "route_owned",
    control_ids: [],
    required_scopes: ["helix.rooms.read"],
    mutating: false,
    requires_idempotency_key: false,
    requires_signed_delegation: false,
    pre_transition_behavior: "deny_full_mcp_transition_required",
    post_transition_behavior: "execute_governed_handler",
    assistant_answer: false,
    terminal_eligible: false,
  },
  {
    tool_name: "helix_room_floor_inspect",
    capability_id: "room.floor.inspect",
    command_surface_id: "mcp",
    projection_surface_id: "helix.ask.shared_live_room",
    account_scope: "user_feature_gated",
    interaction_kind: "observe",
    authority_state: "route_owned",
    control_ids: [],
    required_scopes: ["helix.rooms.read"],
    mutating: false,
    requires_idempotency_key: false,
    requires_signed_delegation: false,
    pre_transition_behavior: "deny_full_mcp_transition_required",
    post_transition_behavior: "execute_governed_handler",
    assistant_answer: false,
    terminal_eligible: false,
  },
  {
    tool_name: "helix_room_create",
    capability_id: "room.create",
    command_surface_id: "mcp",
    projection_surface_id: "helix.ask.shared_live_room",
    account_scope: "user_feature_gated",
    interaction_kind: "act",
    authority_state: "route_owned",
    control_ids: [
      "helix.ask.shared_live_room.create_room_form",
      "helix.ask.shared_live_room.room_title_input",
      "helix.ask.shared_live_room.create_room",
    ],
    required_scopes: ["helix.rooms.manage"],
    mutating: true,
    requires_idempotency_key: true,
    requires_signed_delegation: false,
    pre_transition_behavior: "deny_full_mcp_transition_required",
    post_transition_behavior: "execute_governed_handler",
    assistant_answer: false,
    terminal_eligible: false,
  },
  {
    tool_name: "helix_room_presence_set",
    capability_id: "room.presence.set_own",
    command_surface_id: "mcp",
    projection_surface_id: "helix.ask.shared_live_room",
    account_scope: "user_feature_gated",
    interaction_kind: "configure",
    authority_state: "route_owned",
    control_ids: [],
    required_scopes: ["helix.rooms.read", "helix.environment.action.write"],
    mutating: true,
    requires_idempotency_key: false,
    requires_signed_delegation: false,
    pre_transition_behavior: "deny_full_mcp_transition_required",
    post_transition_behavior: "execute_governed_handler",
    assistant_answer: false,
    terminal_eligible: false,
  },
  {
    tool_name: "helix_room_consent_revoke",
    capability_id: "room.consent.revoke",
    command_surface_id: "mcp",
    projection_surface_id: "helix.ask.shared_live_room",
    account_scope: "user_feature_gated",
    interaction_kind: "configure",
    authority_state: "route_owned",
    control_ids: [
      "helix.ask.shared_live_room.shared-live-room-consent-panel.void-toggle-consent-control-key-enabled",
    ],
    required_scopes: ["helix.rooms.manage"],
    mutating: true,
    requires_idempotency_key: true,
    requires_signed_delegation: false,
    pre_transition_behavior: "deny_full_mcp_transition_required",
    post_transition_behavior: "execute_governed_handler",
    assistant_answer: false,
    terminal_eligible: false,
  },
  {
    tool_name: "helix_room_consent_grant",
    capability_id: "room.consent.grant",
    command_surface_id: "mcp",
    projection_surface_id: "helix.ask.shared_live_room",
    account_scope: "user_feature_gated",
    interaction_kind: "configure",
    authority_state: "route_owned",
    control_ids: [
      "helix.ask.shared_live_room.shared-live-room-consent-panel.void-toggle-consent-control-key-enabled",
    ],
    required_scopes: ["helix.rooms.manage"],
    mutating: true,
    requires_idempotency_key: true,
    requires_signed_delegation: true,
    pre_transition_behavior: "deny_full_mcp_transition_required",
    post_transition_behavior: "execute_governed_handler",
    assistant_answer: false,
    terminal_eligible: false,
  },
  {
    tool_name: "helix_room_floor_release",
    capability_id: "room.floor.release",
    command_surface_id: "mcp",
    projection_surface_id: "helix.ask.shared_live_room",
    account_scope: "user_feature_gated",
    interaction_kind: "configure",
    authority_state: "route_owned",
    control_ids: [
      "helix.ask.shared_live_room.shared-live-room-runtime-panel.release-speaking-floor",
    ],
    required_scopes: ["helix.rooms.manage"],
    mutating: true,
    requires_idempotency_key: false,
    requires_signed_delegation: false,
    pre_transition_behavior: "deny_full_mcp_transition_required",
    post_transition_behavior: "execute_governed_handler",
    assistant_answer: false,
    terminal_eligible: false,
  },
  {
    tool_name: "helix_room_floor_acquire",
    capability_id: "room.floor.acquire",
    command_surface_id: "mcp",
    projection_surface_id: "helix.ask.shared_live_room",
    account_scope: "user_feature_gated",
    interaction_kind: "configure",
    authority_state: "route_owned",
    control_ids: [
      "helix.ask.shared_live_room.shared-live-room-runtime-panel.take-speaking-floor",
    ],
    required_scopes: ["helix.rooms.manage"],
    mutating: true,
    requires_idempotency_key: true,
    requires_signed_delegation: true,
    pre_transition_behavior: "deny_full_mcp_transition_required",
    post_transition_behavior: "execute_governed_handler",
    assistant_answer: false,
    terminal_eligible: false,
  },
] as const satisfies readonly HelixPublicUiMcpBinding[];

export const listHelixPublicUiSurfaceIds = (): string[] =>
  HELIX_PUBLIC_UI_SURFACE_CATALOG.map((entry) => entry.surface_id);
