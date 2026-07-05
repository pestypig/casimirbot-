import type {
  HelixProfileIngressTokenSummary,
  HelixProfileIngressUsageSummary,
} from "./helix-profile-ingress";

export const HELIX_ACCOUNT_SESSION_SCHEMA = "helix.account_session.v1" as const;
export const HELIX_ACCOUNT_SESSION_STATUS_SCHEMA =
  "helix.account_session_status.v1" as const;
export const HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA =
  "helix.account_session_receipt.v1" as const;
export const HELIX_ACCOUNT_CAPABILITY_POLICY_SCHEMA =
  "helix.account_capability_policy.v1" as const;

export type HelixAccountType = "developer" | "user";

export type HelixWorkstationPermissionProfile =
  | "observe"
  | "read"
  | "act"
  | "write"
  | "danger";

export type HelixAccountCapabilityPolicy = {
  schema: typeof HELIX_ACCOUNT_CAPABILITY_POLICY_SCHEMA;
  account_type: HelixAccountType;
  max_workstation_permission: HelixWorkstationPermissionProfile;
  allowed_panels: string[];
  locked_panels: string[];
  locked_features: string[];
  allowed_runtime_agents: string[];
  allowed_workstation_capabilities: string[];
  locked_workstation_capabilities: string[];
  feature_flags: string[];
  quotas: {
    profile_storage_bytes: number;
    model_tokens_per_turn: number;
    model_tokens_per_day: number;
    runtime_minutes_per_day: number;
  };
};

export type HelixAccountPolicyAccessState = "available" | "locked" | "hidden";

export const HELIX_USER_WORKSTATION_PANEL_IDS = [
  "account-session",
  "workstation-clipboard-history",
  "docs-viewer",
  "image-lens",
  "narrator",
  "agi-task-history",
  "scientific-calculator",
  "theory-badge-graph",
  "workstation-notes",
  "workstation-storage-map",
  "workstation-task-manager",
  "moral-graph",
] as const;

export const HELIX_LOCKED_WORKSTATION_PANEL_IDS = [
  "agi-contribution-workbench",
  "agi-essence-console",
  "civilization-bounds-roadmap",
  "code-admin",
  "document-image-lens",
  "fruition-calculator",
  "helix-noise-gens",
  "live-answer-environment",
  "mission-ethos",
  "mission-ethos-source",
  "needle-world-roadmap",
  "rag-admin",
  "situation-room-pipelines",
  "stage-play-badge-graph",
  "workstation-workflow-timeline",
] as const;

export const HELIX_DEVELOPER_ACCOUNT_POLICY: HelixAccountCapabilityPolicy = {
  schema: HELIX_ACCOUNT_CAPABILITY_POLICY_SCHEMA,
  account_type: "developer",
  max_workstation_permission: "danger",
  allowed_panels: ["*"],
  locked_panels: [],
  locked_features: [],
  allowed_runtime_agents: ["*"],
  allowed_workstation_capabilities: ["*"],
  locked_workstation_capabilities: [],
  feature_flags: [
    "advanced_helix_ask_controls",
    "developer_workstation_panels",
    "experimental_panels",
    "runtime_agent_controls",
    "workstation_gateway_act",
  ],
  quotas: {
    profile_storage_bytes: 5 * 1024 * 1024,
    model_tokens_per_turn: 64_000,
    model_tokens_per_day: 1_000_000,
    runtime_minutes_per_day: 240,
  },
};

export const HELIX_USER_ACCOUNT_POLICY: HelixAccountCapabilityPolicy = {
  schema: HELIX_ACCOUNT_CAPABILITY_POLICY_SCHEMA,
  account_type: "user",
  max_workstation_permission: "act",
  allowed_panels: [...HELIX_USER_WORKSTATION_PANEL_IDS],
  locked_panels: [...HELIX_LOCKED_WORKSTATION_PANEL_IDS],
  locked_features: [
    "advanced_helix_ask_controls",
    "developer_workstation_panels",
    "experimental_panels",
    "live_answer_visual_capture_controls",
    "runtime_agent_controls",
    "workstation_gateway_act",
  ],
  allowed_runtime_agents: ["codex"],
  allowed_workstation_capabilities: [
    "workspace_os.status",
    "workstation.active_context",
    "workstation-notes.list_notes",
    "scientific-calculator.solve_expression",
    "scientific-calculator.solve_scalar_expression",
    "scientific-calculator.classify_expression",
    "scientific-calculator.bind_variables",
    "scientific-calculator.active_context",
    "scientific-calculator.read_visible_result",
    "scientific-calculator.open_panel",
    "scientific-calculator.focus_panel",
    "scientific-calculator.show_gateway_solve",
    "scientific-calculator.prefill_expression",
    "workstation.readable_surface.observe",
    "workstation.open_panel",
    "workstation.focus_panel",
    "docs-viewer.read_visible_surface",
    "docs-viewer.read_active_translation",
    "docs-viewer.open_doc",
    "docs.search",
    "scholarly-research.lookup_papers",
    "scholarly-research.fetch_full_text",
    "scholarly-research.extract_numeric_parameters",
    "theory-badge-graph.reflect_discussion_context",
    "theory-badge-graph.propose_frontier_conjectures",
    "moral-graph.reflect_context",
    "moral-graph.reflect_living_substrate_context",
    "text_to_speech.speak_text",
    "live_env.narrator_say",
  ],
  locked_workstation_capabilities: [
    "permission:write",
    "permission:danger",
  ],
  feature_flags: ["stable_workstation_panels", "locked_dev_features_visible"],
  quotas: {
    profile_storage_bytes: 1024 * 1024,
    model_tokens_per_turn: 16_000,
    model_tokens_per_day: 100_000,
    runtime_minutes_per_day: 30,
  },
};

const PERMISSION_RANK: Record<HelixWorkstationPermissionProfile, number> = {
  observe: 0,
  read: 1,
  act: 2,
  write: 3,
  danger: 4,
};

const MODE_TO_PERMISSION: Record<string, HelixWorkstationPermissionProfile> = {
  observe: "observe",
  read: "read",
  act: "act",
  verify: "read",
  write: "write",
  danger: "danger",
};

const copyPolicy = (
  policy: HelixAccountCapabilityPolicy,
): HelixAccountCapabilityPolicy => ({
  ...policy,
  allowed_panels: [...policy.allowed_panels],
  locked_panels: [...policy.locked_panels],
  locked_features: [...policy.locked_features],
  allowed_runtime_agents: [...policy.allowed_runtime_agents],
  allowed_workstation_capabilities: [...policy.allowed_workstation_capabilities],
  locked_workstation_capabilities: [...policy.locked_workstation_capabilities],
  feature_flags: [...policy.feature_flags],
  quotas: { ...policy.quotas },
});

export const buildHelixAccountCapabilityPolicy = (
  accountType: HelixAccountType,
): HelixAccountCapabilityPolicy =>
  copyPolicy(accountType === "developer"
    ? HELIX_DEVELOPER_ACCOUNT_POLICY
    : HELIX_USER_ACCOUNT_POLICY);

export const helixPermissionRank = (
  permission: HelixWorkstationPermissionProfile | string | null | undefined,
): number => {
  const normalized = typeof permission === "string" ? permission.trim() : "";
  return PERMISSION_RANK[normalized as HelixWorkstationPermissionProfile] ?? -1;
};

export const helixPolicyAllowsPermission = (
  policy: HelixAccountCapabilityPolicy,
  permission: HelixWorkstationPermissionProfile | string | null | undefined,
): boolean =>
  helixPermissionRank(policy.max_workstation_permission) >= helixPermissionRank(permission);

export const capHelixWorkstationModeForPolicy = (
  policy: HelixAccountCapabilityPolicy,
  mode: string | null | undefined,
): "observe" | "read" | "act" | "verify" => {
  const normalized = typeof mode === "string" && mode.trim()
    ? mode.trim()
    : "read";
  const requestedPermission = MODE_TO_PERMISSION[normalized] ?? "read";
  if (helixPolicyAllowsPermission(policy, requestedPermission)) {
    return normalized === "act" || normalized === "observe" || normalized === "verify"
      ? normalized
      : "read";
  }
  if (helixPolicyAllowsPermission(policy, "act")) return "act";
  if (helixPolicyAllowsPermission(policy, "read")) return "read";
  return "observe";
};

export const resolveHelixAccountPanelAccess = (
  policy: HelixAccountCapabilityPolicy | null | undefined,
  panelId: string,
): { state: HelixAccountPolicyAccessState; reason: string | null } => {
  const normalizedPanelId = panelId.trim();
  if (!normalizedPanelId) return { state: "hidden", reason: "missing_panel_id" };
  const activePolicy = policy ?? HELIX_USER_ACCOUNT_POLICY;
  if (activePolicy.locked_panels.includes(normalizedPanelId)) {
    return { state: "locked", reason: "panel_locked_by_account_policy" };
  }
  if (
    activePolicy.allowed_panels.includes("*") ||
    activePolicy.allowed_panels.includes(normalizedPanelId)
  ) {
    return { state: "available", reason: null };
  }
  return { state: "locked", reason: "panel_outside_account_policy" };
};

export const resolveHelixRuntimeAgentAccess = (
  policy: HelixAccountCapabilityPolicy | null | undefined,
  agentRuntimeId: string,
): { state: HelixAccountPolicyAccessState; reason: string | null } => {
  const normalizedAgentId = agentRuntimeId.trim();
  if (!normalizedAgentId) return { state: "hidden", reason: "missing_agent_runtime" };
  const activePolicy = policy ?? HELIX_USER_ACCOUNT_POLICY;
  if (
    activePolicy.allowed_runtime_agents.includes("*") ||
    activePolicy.allowed_runtime_agents.includes(normalizedAgentId)
  ) {
    return { state: "available", reason: null };
  }
  return { state: "locked", reason: "runtime_agent_outside_account_policy" };
};

export const resolveHelixWorkstationCapabilityAccess = (
  policy: HelixAccountCapabilityPolicy | null | undefined,
  input: {
    capability_id: string;
    permission_profile_required?: HelixWorkstationPermissionProfile | string | null;
  },
): { state: HelixAccountPolicyAccessState; reason: string | null } => {
  const activePolicy = policy ?? HELIX_USER_ACCOUNT_POLICY;
  if (activePolicy.locked_workstation_capabilities.includes(input.capability_id)) {
    return { state: "locked", reason: "capability_locked_by_account_policy" };
  }
  if (
    input.permission_profile_required &&
    !helixPolicyAllowsPermission(activePolicy, input.permission_profile_required)
  ) {
    return { state: "locked", reason: "capability_permission_exceeds_account_policy" };
  }
  if (
    activePolicy.allowed_workstation_capabilities.includes("*") ||
    activePolicy.allowed_workstation_capabilities.includes(input.capability_id) ||
    (
      input.permission_profile_required &&
      activePolicy.allowed_workstation_capabilities.includes(
        `permission:${input.permission_profile_required}`,
      )
    )
  ) {
    return { state: "available", reason: null };
  }
  return { state: "locked", reason: "capability_outside_account_policy" };
};

export type HelixAccountSessionProfile = {
  profile_id: string;
  display_name: string;
  email?: string | null;
  auth_mode: "web_auth" | "local_dev_profile" | "local_password_profile";
  account_type?: HelixAccountType;
  provider?: "google" | "local" | null;
  provider_subject?: string | null;
  picture_url?: string | null;
  created_at: string;
  updated_at: string;
};

export type HelixAccountLinkedAccount = {
  provider: "discord" | "minehut" | "browser" | "local" | "google";
  external_id: string;
  display_name?: string | null;
  status: "linked" | "pending" | "revoked";
  authority?: "owner" | "commander" | "participant" | "viewer" | null;
  linked_at?: string | null;
};

export type HelixAccountUsageSummary = {
  thread_count: number;
  item_count: number;
  answer_count: number;
  tool_observation_count: number;
  validation_count: number;
  estimated_token_count: number;
  window_started_at: string;
  window_ended_at: string;
};

export type HelixAccountSession = {
  schema: typeof HELIX_ACCOUNT_SESSION_SCHEMA;
  session_id: string;
  profile: HelixAccountSessionProfile;
  account_policy: HelixAccountCapabilityPolicy;
  status: "active" | "signed_out";
  memory_scope: "profile" | "session_only";
  created_at: string;
  updated_at: string;
};

export type HelixAccountSessionStatus = {
  schema: typeof HELIX_ACCOUNT_SESSION_STATUS_SCHEMA;
  ok: boolean;
  session: HelixAccountSession | null;
  account_policy: HelixAccountCapabilityPolicy;
  linked_accounts: HelixAccountLinkedAccount[];
  profile_ingress_tokens: HelixProfileIngressTokenSummary[];
  profile_ingress_usage: HelixProfileIngressUsageSummary;
  usage: HelixAccountUsageSummary;
  auth_boundary: {
    credential_collection_allowed_in_agents: false;
    raw_password_stored: false;
    discord_bot_password_collection_allowed: false;
    recommended_flow: "web_auth_or_oauth_link" | "dev_local_password_profile";
    local_password_profile_available?: boolean;
    local_password_profile_dev_default?: boolean;
  };
};

export type HelixAccountSessionReceipt = {
  schema: typeof HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA;
  ok: boolean;
  session: HelixAccountSession | null;
  message: string;
  error?: string | null;
  raw_password_stored: false;
  credential_collection_allowed_in_agents: false;
  auth_method?: "web_auth" | "local_dev_profile" | "local_password_profile" | null;
};
