import { z } from "zod";
import {
  HELIX_AGENT_CLIENT_READINESS_SCHEMA,
  helixAgentClientReadinessSchema,
} from "./helix-agent-client-readiness";
import { helixThreadObservabilityBridgeLevelSchema } from
  "./helix-local-supervisor-coordination";

export const HELIX_AGENT_CLIENT_PROFILE_SCHEMA =
  "helix.agent_client_profile.v1" as const;
export const HELIX_AGENT_CONNECTION_STATUS_SCHEMA =
  "helix.agent_connection_status.v1" as const;

export const HELIX_AGENT_CLIENT_PROFILE_IDS = [
  "codex_app",
  "standard_mcp",
] as const;

export const helixAgentClientProfileIdSchema = z.enum(
  HELIX_AGENT_CLIENT_PROFILE_IDS,
);
export type HelixAgentClientProfileId = z.infer<
  typeof helixAgentClientProfileIdSchema
>;

const clientProfileSchema = z.object({
  schema: z.literal(HELIX_AGENT_CLIENT_PROFILE_SCHEMA),
  profile_id: helixAgentClientProfileIdSchema,
  display_name: z.string().trim().min(1).max(80),
  provider_family: z.enum(["openai_codex", "standards_based_mcp"]),
  transport: z.literal("streamable_http"),
  authentication: z.literal("oauth_authorization_code_pkce"),
  oauth_session_continuity: z.object({
    requested_scope: z.literal("offline_access"),
    refresh_token_required: z.literal(true),
    credential_custody: z.literal("external_ai_client"),
    capability_authority_expanded: z.literal(false),
  }).strict(),
  connection_surface: z.enum(["codex_mcp_settings", "client_settings"]),
  endpoint_path: z.literal("/mcp/local-supervisor-coordination"),
  scope_bundle_id: z.literal("local_supervisor_coordination"),
  endpoint_variants: z.array(z.object({
    purpose: z.enum(["coordination_only", "full_harness"]),
    endpoint_path: z.enum(["/mcp/local-supervisor-coordination", "/mcp"]),
    scope_bundle_id: z.enum([
      "local_supervisor_coordination",
      "full_helix_agent",
    ]),
    default: z.boolean(),
  }).strict()).length(2),
  optional_device_check_surface: z.enum(["codex_plugin_deep_link", "none"]),
  catalog_refresh: z.enum(["new_chat_required", "client_restart_or_reconnect"]),
  continuation_mode: z.enum(["polling", "monitor_only"]),
  thread_declaration: z.literal("required_for_attachment"),
  disconnect_behavior: z.literal("revoke_profile_agent_binding"),
  recovery_states: z.array(z.enum([
    "sign_in",
    "authorize",
    "open_client",
    "restart_or_reconnect",
    "refresh_catalog",
    "declare_thread",
  ])).min(1),
  provider_owned_steps: z.array(z.enum([
    "install_or_add_connection",
    "oauth_consent",
    "restart_or_reconnect",
    "create_or_select_chat",
    "model_session",
  ])).min(1),
  thread_observability_bridge: z.object({
    baseline_level: z.literal("tool_activity_only"),
    negotiable_levels: z.array(helixThreadObservabilityBridgeLevelSchema)
      .min(1)
      .max(3),
    checkpoint_publication: z.literal("optional_explicit_client_declaration"),
    checkpoint_freshness: z.literal("client_declared_bounded_window"),
    checkpoint_retention: z.literal("current_session_or_profile_durable"),
    checkpoint_revocation: z.literal("independent"),
    ordinary_mcp_requires_checkpoint: z.literal(false),
    continuation_ready_requires_provider_transport: z.literal(true),
  }).strict(),
  consent_upgrade: z.object({
    scope_increase_is_silent: z.literal(false),
    catalog_reenumeration: z.literal("authoritative_required"),
    recovery: z.literal("managed_reconnect_or_one_actionable_reconnect"),
  }).strict(),
  accepts_provider_credentials: z.literal(false),
  silent_configuration_mutation: z.literal(false),
  provider_app_identity_verified_by_selection: z.literal(false),
  provider_chat_control: z.literal(false),
  hidden_reasoning_access: z.literal(false),
  environment_authority: z.literal(false),
}).strict().superRefine((value, context) => {
  const defaults = value.endpoint_variants.filter((variant) => variant.default);
  const purposes = new Set(value.endpoint_variants.map((variant) => variant.purpose));
  if (defaults.length !== 1 || purposes.size !== value.endpoint_variants.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endpoint_variants"],
      message: "client_profile_requires_one_default_and_unique_purposes",
    });
  }
  const defaultVariant = defaults[0];
  if (defaultVariant && (
    defaultVariant.endpoint_path !== value.endpoint_path ||
    defaultVariant.scope_bundle_id !== value.scope_bundle_id
  )) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endpoint_variants"],
      message: "client_profile_default_variant_mismatch",
    });
  }
  for (const variant of value.endpoint_variants) {
    const valid = variant.purpose === "coordination_only"
      ? variant.endpoint_path === "/mcp/local-supervisor-coordination" &&
        variant.scope_bundle_id === "local_supervisor_coordination"
      : variant.endpoint_path === "/mcp" &&
        variant.scope_bundle_id === "full_helix_agent";
    if (!valid) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endpoint_variants"],
        message: "client_profile_endpoint_variant_mismatch",
      });
      break;
    }
  }
  if (!value.thread_observability_bridge.negotiable_levels.includes(
    value.thread_observability_bridge.baseline_level,
  )) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["thread_observability_bridge", "negotiable_levels"],
      message: "baseline_observability_level_must_be_negotiable",
    });
  }
});

export type HelixAgentClientProfile = z.infer<typeof clientProfileSchema>;
export { clientProfileSchema as helixAgentClientProfileSchema };

const profile = (input: Omit<HelixAgentClientProfile, "schema">): HelixAgentClientProfile =>
  clientProfileSchema.parse({ schema: HELIX_AGENT_CLIENT_PROFILE_SCHEMA, ...input });

export const HELIX_AGENT_CLIENT_PROFILES = Object.freeze({
  codex_app: profile({
    profile_id: "codex_app",
    display_name: "Codex App",
    provider_family: "openai_codex",
    transport: "streamable_http",
    authentication: "oauth_authorization_code_pkce",
    oauth_session_continuity: {
      requested_scope: "offline_access",
      refresh_token_required: true,
      credential_custody: "external_ai_client",
      capability_authority_expanded: false,
    },
    connection_surface: "codex_mcp_settings",
    endpoint_path: "/mcp/local-supervisor-coordination",
    scope_bundle_id: "local_supervisor_coordination",
    endpoint_variants: [
      {
        purpose: "coordination_only",
        endpoint_path: "/mcp/local-supervisor-coordination",
        scope_bundle_id: "local_supervisor_coordination",
        default: true,
      },
      {
        purpose: "full_harness",
        endpoint_path: "/mcp",
        scope_bundle_id: "full_helix_agent",
        default: false,
      },
    ],
    optional_device_check_surface: "codex_plugin_deep_link",
    catalog_refresh: "new_chat_required",
    continuation_mode: "polling",
    thread_declaration: "required_for_attachment",
    disconnect_behavior: "revoke_profile_agent_binding",
    recovery_states: ["sign_in", "authorize", "open_client", "restart_or_reconnect", "refresh_catalog", "declare_thread"],
    provider_owned_steps: ["install_or_add_connection", "oauth_consent", "restart_or_reconnect", "create_or_select_chat", "model_session"],
    thread_observability_bridge: {
      baseline_level: "tool_activity_only",
      negotiable_levels: ["tool_activity_only", "checkpoint_publish"],
      checkpoint_publication: "optional_explicit_client_declaration",
      checkpoint_freshness: "client_declared_bounded_window",
      checkpoint_retention: "current_session_or_profile_durable",
      checkpoint_revocation: "independent",
      ordinary_mcp_requires_checkpoint: false,
      continuation_ready_requires_provider_transport: true,
    },
    consent_upgrade: {
      scope_increase_is_silent: false,
      catalog_reenumeration: "authoritative_required",
      recovery: "managed_reconnect_or_one_actionable_reconnect",
    },
    accepts_provider_credentials: false,
    silent_configuration_mutation: false,
    provider_app_identity_verified_by_selection: false,
    provider_chat_control: false,
    hidden_reasoning_access: false,
    environment_authority: false,
  }),
  standard_mcp: profile({
    profile_id: "standard_mcp",
    display_name: "Another MCP app",
    provider_family: "standards_based_mcp",
    transport: "streamable_http",
    authentication: "oauth_authorization_code_pkce",
    oauth_session_continuity: {
      requested_scope: "offline_access",
      refresh_token_required: true,
      credential_custody: "external_ai_client",
      capability_authority_expanded: false,
    },
    connection_surface: "client_settings",
    endpoint_path: "/mcp/local-supervisor-coordination",
    scope_bundle_id: "local_supervisor_coordination",
    endpoint_variants: [
      {
        purpose: "coordination_only",
        endpoint_path: "/mcp/local-supervisor-coordination",
        scope_bundle_id: "local_supervisor_coordination",
        default: true,
      },
      {
        purpose: "full_harness",
        endpoint_path: "/mcp",
        scope_bundle_id: "full_helix_agent",
        default: false,
      },
    ],
    optional_device_check_surface: "none",
    catalog_refresh: "client_restart_or_reconnect",
    continuation_mode: "monitor_only",
    thread_declaration: "required_for_attachment",
    disconnect_behavior: "revoke_profile_agent_binding",
    recovery_states: ["sign_in", "authorize", "open_client", "restart_or_reconnect", "refresh_catalog", "declare_thread"],
    provider_owned_steps: ["install_or_add_connection", "oauth_consent", "restart_or_reconnect", "create_or_select_chat", "model_session"],
    thread_observability_bridge: {
      baseline_level: "tool_activity_only",
      negotiable_levels: ["tool_activity_only", "checkpoint_publish"],
      checkpoint_publication: "optional_explicit_client_declaration",
      checkpoint_freshness: "client_declared_bounded_window",
      checkpoint_retention: "current_session_or_profile_durable",
      checkpoint_revocation: "independent",
      ordinary_mcp_requires_checkpoint: false,
      continuation_ready_requires_provider_transport: true,
    },
    consent_upgrade: {
      scope_increase_is_silent: false,
      catalog_reenumeration: "authoritative_required",
      recovery: "managed_reconnect_or_one_actionable_reconnect",
    },
    accepts_provider_credentials: false,
    silent_configuration_mutation: false,
    provider_app_identity_verified_by_selection: false,
    provider_chat_control: false,
    hidden_reasoning_access: false,
    environment_authority: false,
  }),
} satisfies Record<HelixAgentClientProfileId, HelixAgentClientProfile>);

const opaqueRef = z.string().trim().min(1).max(512);

export const helixAgentConnectionStatusSchema = z.object({
  schema: z.literal(HELIX_AGENT_CONNECTION_STATUS_SCHEMA),
  selected_client_profile: helixAgentClientProfileIdSchema,
  selected_profile_is_preference_only: z.literal(true),
  client_kind_verified: z.literal(false),
  authenticated_profile_ref: opaqueRef,
  service_instance_ref: opaqueRef,
  oauth_binding_ref: opaqueRef.nullable(),
  authenticated_mcp_client_ref: opaqueRef.nullable(),
  client_session_ref: opaqueRef.nullable(),
  conversation_thread_ref: opaqueRef.nullable(),
  proof_basis: z.enum(["none", "authenticated_presence_tool"]),
  observed_at: z.string().datetime().nullable(),
  heartbeat_expires_at: z.string().datetime().nullable(),
  authorization_changed_after_presence: z.boolean(),
  catalog_reenumeration_required: z.boolean(),
  catalog_recovery: z.enum(["none", "reconnect_and_refresh"]),
  thread_observability_bridge: z.object({
    negotiated_level: helixThreadObservabilityBridgeLevelSchema,
    declaration_basis: z.enum([
      "profile_default",
      "authenticated_client_declaration",
    ]),
    checkpoint_publication_status: z.enum([
      "not_requested",
      "negotiated_no_checkpoint_observed",
    ]),
    checkpoint_freshness_window_seconds: z.number().int().min(15).max(3600)
      .nullable(),
    checkpoint_retention: z.enum([
      "none",
      "current_session",
      "profile_durable",
    ]),
    checkpoint_revocation: z.enum(["not_applicable", "independent"]),
    provider_thread_content_included: z.literal(false),
    hidden_reasoning_included: z.literal(false),
    activity_completeness_claimed: z.literal(false),
  }).strict(),
  readiness: helixAgentClientReadinessSchema,
  readiness_schema: z.literal(HELIX_AGENT_CLIENT_READINESS_SCHEMA),
  credential_included: z.literal(false),
  oauth_subject_included: z.literal(false),
  raw_claims_included: z.literal(false),
  provider_thread_content_included: z.literal(false),
  hidden_reasoning_included: z.literal(false),
  environment_authority: z.literal(false),
  mutation_authority: z.literal(false),
  answer_authority: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();

export type HelixAgentConnectionStatus = z.infer<
  typeof helixAgentConnectionStatusSchema
>;

export const getHelixAgentClientProfile = (
  profileId: HelixAgentClientProfileId,
): HelixAgentClientProfile => HELIX_AGENT_CLIENT_PROFILES[profileId];
