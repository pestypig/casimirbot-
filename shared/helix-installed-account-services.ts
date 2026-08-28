import { z } from "zod";

export const HELIX_INSTALLED_ACCOUNT_SERVICES_SCHEMA =
  "helix.installed_account_services.v1" as const;

export const helixInstalledConnectionClassSchema = z.object({
  connection_type: z.enum([
    "agent_client_connection",
    "provider_connection",
    "environment_provider_connection",
  ]),
  provider_id: z.enum(["codex_app", "fal", "openai_api", "robinhood"]),
  label: z.string().min(1).max(80),
  status: z.enum([
    "available",
    "managed_elsewhere",
    "blocked_pending_stage",
  ]),
  authentication_mode: z.enum([
    "oauth_mcp",
    "oauth_pkce",
    "native_api_key_pending",
  ]),
  management_panel_id: z.enum([
    "account-session",
    "agent-access",
    "connections-billing-security",
  ]),
  credential_owner: z.enum(["user_provider", "not_applicable"]),
  raw_secret_entry_available: z.literal(false),
  blocked_by_stage: z.enum(["SPB-3", "SPB-4", "SPB-5", "SPB-6"]).nullable(),
}).strict();

export const helixInstalledAccountServicesSchema = z.object({
  schema: z.literal(HELIX_INSTALLED_ACCOUNT_SERVICES_SCHEMA),
  ok: z.literal(true),
  generated_at: z.string().datetime(),
  profile_ref: z.string().min(1).max(240),
  account_type: z.literal("developer"),
  runtime: z.object({
    surface: z.literal("desktop_native"),
    private_service: z.literal("ready"),
    provider_credential_broker: z.enum(["ready", "unavailable"]),
    signed_release: z.literal("not_verified"),
  }).strict(),
  connections: z.array(helixInstalledConnectionClassSchema).length(4),
  billing: z.object({
    status: z.literal("not_configured"),
    casimir_managed_plan_available: z.literal(false),
    prepaid_credits_available: z.literal(false),
    payment_method_collected: z.literal(false),
    user_provider_key_enrollment_available: z.literal(false),
    next_stage: z.literal("SPB-4"),
  }).strict(),
  security: z.object({
    native_vault: z.enum(["ready", "unavailable"]),
    master_key_in_child_environment: z.literal(false),
    raw_secret_fields_present: z.literal(false),
    mfa: z.literal("not_enforced"),
    step_up: z.literal("not_available"),
    native_key_entry: z.literal("not_implemented"),
    next_stage: z.literal("SPB-3"),
  }).strict(),
  device: z.object({
    label: z.literal("This Windows device"),
    status: z.literal("active"),
    registration: z.literal("local_only"),
    remote_revoke_available: z.literal(false),
  }).strict(),
  agent_authority: z.object({
    may_inspect_sanitized_status: z.literal(true),
    may_enroll_credentials: z.literal(false),
    may_manage_subscription: z.literal(false),
    may_change_payment_method: z.literal(false),
    may_raise_budget: z.literal(false),
    may_register_device: z.literal(false),
    may_satisfy_mfa: z.literal(false),
  }).strict(),
  raw_credential_included: z.literal(false),
  payment_instrument_included: z.literal(false),
}).strict();

export type HelixInstalledConnectionClass = z.infer<
  typeof helixInstalledConnectionClassSchema
>;
export type HelixInstalledAccountServices = z.infer<
  typeof helixInstalledAccountServicesSchema
>;

export const buildHelixInstalledAccountServices = (input: {
  profileRef: string;
  providerCredentialBrokerReady: boolean;
  now?: Date;
}): HelixInstalledAccountServices => helixInstalledAccountServicesSchema.parse({
  schema: HELIX_INSTALLED_ACCOUNT_SERVICES_SCHEMA,
  ok: true,
  generated_at: (input.now ?? new Date()).toISOString(),
  profile_ref: input.profileRef,
  account_type: "developer",
  runtime: {
    surface: "desktop_native",
    private_service: "ready",
    provider_credential_broker: input.providerCredentialBrokerReady
      ? "ready"
      : "unavailable",
    signed_release: "not_verified",
  },
  connections: [
    {
      connection_type: "agent_client_connection",
      provider_id: "codex_app",
      label: "Codex app",
      status: "managed_elsewhere",
      authentication_mode: "oauth_mcp",
      management_panel_id: "agent-access",
      credential_owner: "not_applicable",
      raw_secret_entry_available: false,
      blocked_by_stage: null,
    },
    {
      connection_type: "environment_provider_connection",
      provider_id: "robinhood",
      label: "Robinhood read connection",
      status: "available",
      authentication_mode: "oauth_pkce",
      management_panel_id: "account-session",
      credential_owner: "user_provider",
      raw_secret_entry_available: false,
      blocked_by_stage: null,
    },
    {
      connection_type: "provider_connection",
      provider_id: "fal",
      label: "fal image provider",
      status: "blocked_pending_stage",
      authentication_mode: "native_api_key_pending",
      management_panel_id: "connections-billing-security",
      credential_owner: "user_provider",
      raw_secret_entry_available: false,
      blocked_by_stage: "SPB-6",
    },
    {
      connection_type: "provider_connection",
      provider_id: "openai_api",
      label: "OpenAI API",
      status: "blocked_pending_stage",
      authentication_mode: "native_api_key_pending",
      management_panel_id: "connections-billing-security",
      credential_owner: "user_provider",
      raw_secret_entry_available: false,
      blocked_by_stage: "SPB-6",
    },
  ],
  billing: {
    status: "not_configured",
    casimir_managed_plan_available: false,
    prepaid_credits_available: false,
    payment_method_collected: false,
    user_provider_key_enrollment_available: false,
    next_stage: "SPB-4",
  },
  security: {
    native_vault: input.providerCredentialBrokerReady
      ? "ready"
      : "unavailable",
    master_key_in_child_environment: false,
    raw_secret_fields_present: false,
    mfa: "not_enforced",
    step_up: "not_available",
    native_key_entry: "not_implemented",
    next_stage: "SPB-3",
  },
  device: {
    label: "This Windows device",
    status: "active",
    registration: "local_only",
    remote_revoke_available: false,
  },
  agent_authority: {
    may_inspect_sanitized_status: true,
    may_enroll_credentials: false,
    may_manage_subscription: false,
    may_change_payment_method: false,
    may_raise_budget: false,
    may_register_device: false,
    may_satisfy_mfa: false,
  },
  raw_credential_included: false,
  payment_instrument_included: false,
});
