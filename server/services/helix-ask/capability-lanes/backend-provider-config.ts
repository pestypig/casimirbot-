import type {
  HelixCapabilityLaneBackendFamily,
  HelixCapabilityLaneBackendProviderDescriptor,
  HelixCapabilityLaneBackendSelectionDecision,
  HelixCapabilityLaneBackendSelectionPolicy,
  HelixCapabilityLaneDescriptor,
  HelixCapabilityLaneId,
} from "@shared/helix-capability-lane";

export type HelixCapabilityLaneBackendProviderTemplate = {
  provider_id: string;
  backend_family: HelixCapabilityLaneBackendFamily;
  label: string;
  model_or_service_ref: string | null;
  required_env_vars: string[];
  configured(env: NodeJS.ProcessEnv): boolean;
  cost_class: HelixCapabilityLaneBackendProviderDescriptor["cost_class"];
  latency_class: HelixCapabilityLaneBackendProviderDescriptor["latency_class"];
  privacy_class: HelixCapabilityLaneBackendProviderDescriptor["privacy_class"];
  fallback_backend_provider: string | null;
};

export type HelixCapabilityLaneBackendProviderOwnerTemplate = {
  lane_id: HelixCapabilityLaneId;
  backend_family: HelixCapabilityLaneBackendFamily;
  label: string;
  model_or_service_ref: string | null;
  required_env_vars?: string[];
  configured(env: NodeJS.ProcessEnv): boolean;
  cost_class: HelixCapabilityLaneBackendProviderDescriptor["cost_class"];
  latency_class: HelixCapabilityLaneBackendProviderDescriptor["latency_class"];
  privacy_class: HelixCapabilityLaneBackendProviderDescriptor["privacy_class"];
  backend_provider_templates?: HelixCapabilityLaneBackendProviderTemplate[];
};

export const readBooleanEnv = (
  value: string | undefined,
  defaultValue: boolean,
): boolean => {
  if (value === undefined) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return defaultValue;
  if (["0", "false", "no", "off", "disabled"].includes(normalized)) return false;
  if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true;
  return defaultValue;
};

export const hasAnyConfiguredEnvVar = (env: NodeJS.ProcessEnv, names: string[]): boolean =>
  names.some((name: string) => typeof env[name] === "string" && Boolean(env[name]?.trim()));

const configuredEnvVars = (env: NodeJS.ProcessEnv, names: string[]): string[] =>
  names.filter((name: string) => typeof env[name] === "string" && Boolean(env[name]?.trim()));

export const textBackendConfigured = (env: NodeJS.ProcessEnv): boolean =>
  hasAnyConfiguredEnvVar(env, ["OPENAI_API_KEY", "LLM_HTTP_BASE", "LLM_HTTP_MODEL"]);

export const LIVE_TRANSLATION_OPENAI_COMPATIBLE_ENV_VARS = [
  "LIVE_TRANSLATION_OPENAI_API_KEY",
  "DOC_TRANSLATION_API_KEY",
  "OPENAI_API_KEY",
  "LLM_HTTP_API_KEY",
] as const;

export const liveTranslationOpenAiCompatibleConfigured = (env: NodeJS.ProcessEnv): boolean =>
  hasAnyConfiguredEnvVar(env, [...LIVE_TRANSLATION_OPENAI_COMPATIBLE_ENV_VARS]);

export const liveTranslationExternalBackendsEnabled = (env: NodeJS.ProcessEnv): boolean =>
  readBooleanEnv(
    env.HELIX_LIVE_TRANSLATION_EXTERNAL_BACKENDS_ENABLED,
    liveTranslationOpenAiCompatibleConfigured(env),
  );

export const HELIX_LANE_BACKEND_SELECTION_POLICY: HelixCapabilityLaneBackendSelectionPolicy = {
  schema: "helix.capability_lane.backend_selection_policy.v1",
  owner: "helix",
  runtime_provider_may_request_preference: true,
  selected_runtime_provider_remains_root: true,
  dynamic_switching_enabled: false,
  selection_inputs: [
    "configured_keys",
    "runtime_permission",
    "goal_permission",
    "account_preference",
    "account_locale",
    "cost_class",
    "latency_class",
    "privacy_class",
    "quality_requirement",
    "fallback_availability",
    "terminal_policy",
  ],
};

export const backendPermissionStatus = (
  status: HelixCapabilityLaneDescriptor["status"],
): HelixCapabilityLaneBackendProviderDescriptor["permission_status"] => {
  switch (status) {
    case "available":
    case "dry_run":
      return "admitted";
    case "unconfigured":
      return "configuration_missing";
    case "permission_blocked":
      return "permission_blocked";
    case "disabled":
      return "policy_disabled";
  }
  return "policy_disabled";
};

const backendProviderIdFor = (template: HelixCapabilityLaneBackendProviderOwnerTemplate): string =>
  `${template.lane_id}.${template.backend_family}`;

const backendTemplateFor = (
  template: HelixCapabilityLaneBackendProviderOwnerTemplate,
): HelixCapabilityLaneBackendProviderTemplate => ({
  provider_id: backendProviderIdFor(template),
  backend_family: template.backend_family,
  label: template.label,
  model_or_service_ref: template.model_or_service_ref,
  required_env_vars: template.required_env_vars ?? [],
  configured: template.configured,
  cost_class: template.cost_class,
  latency_class: template.latency_class,
  privacy_class: template.privacy_class,
  fallback_backend_provider: null,
});

const backendProviderStatus = (input: {
  laneStatus: HelixCapabilityLaneDescriptor["status"];
  backendTemplate: HelixCapabilityLaneBackendProviderTemplate;
  env: NodeJS.ProcessEnv;
}): HelixCapabilityLaneDescriptor["status"] => {
  if (input.laneStatus === "disabled" || input.laneStatus === "permission_blocked") return input.laneStatus;
  if (!input.backendTemplate.configured(input.env)) return "unconfigured";
  if (input.laneStatus === "available") return "available";
  return "dry_run";
};

const backendProviderFor = (input: {
  backendTemplate: HelixCapabilityLaneBackendProviderTemplate;
  status: HelixCapabilityLaneDescriptor["status"];
  env: NodeJS.ProcessEnv;
}): HelixCapabilityLaneBackendProviderDescriptor => ({
  schema: "helix.capability_lane.backend_provider.v1",
  provider_id: input.backendTemplate.provider_id,
  backend_family: input.backendTemplate.backend_family,
  label: input.backendTemplate.label,
  model_or_service_ref: input.backendTemplate.model_or_service_ref,
  configuration_status:
    input.status === "disabled"
      ? "disabled"
      : input.backendTemplate.required_env_vars.length === 0
        ? "not_required"
        : input.backendTemplate.configured(input.env)
          ? "configured"
          : "missing",
  required_env_vars: input.backendTemplate.required_env_vars,
  configured_env_vars: configuredEnvVars(input.env, input.backendTemplate.required_env_vars),
  availability_status: input.status,
  permission_status: backendPermissionStatus(input.status),
  cost_class: input.backendTemplate.cost_class,
  latency_class: input.backendTemplate.latency_class,
  privacy_class: input.backendTemplate.privacy_class,
  fallback_backend_provider: input.backendTemplate.fallback_backend_provider,
  raw_secret_exposed: false,
});

export const backendProvidersFor = (input: {
  template: HelixCapabilityLaneBackendProviderOwnerTemplate;
  laneStatus: HelixCapabilityLaneDescriptor["status"];
  env: NodeJS.ProcessEnv;
}): HelixCapabilityLaneBackendProviderDescriptor[] => {
  const backendTemplates = input.template.backend_provider_templates ?? [backendTemplateFor(input.template)];
  return backendTemplates.map((backendTemplate) => backendProviderFor({
    backendTemplate,
    env: input.env,
    status: backendProviderStatus({
      laneStatus: input.laneStatus,
      backendTemplate,
      env: input.env,
    }),
  }));
};

export const buildBackendSelectionDecision = (input: {
  admitted: boolean;
  laneStatusReason: string;
  requestedBackendProvider: string | null;
  requestedBackend: HelixCapabilityLaneBackendProviderDescriptor | null;
  selectedBackend: HelixCapabilityLaneBackendProviderDescriptor | null;
  liveBackendExecutionEnabled?: boolean;
}): HelixCapabilityLaneBackendSelectionDecision => {
  const outcomeAndReason = (() => {
    if (!input.admitted) {
      return {
        outcome: "blocked" as const,
        reason: input.laneStatusReason,
      };
    }
    if (!input.requestedBackendProvider) {
      return {
        outcome: "default_selected" as const,
        reason: "selected_default_backend_provider_for_shadow_manifest",
      };
    }
    if (!input.requestedBackend) {
      return {
        outcome: "fallback_selected" as const,
        reason: "requested_backend_unknown_default_backend_selected_by_helix_policy",
      };
    }
    if (input.requestedBackend.provider_id === input.selectedBackend?.provider_id) {
      return {
        outcome: "requested_selected" as const,
        reason: "selected_requested_backend_provider_for_shadow_manifest",
      };
    }
    if (input.requestedBackend.availability_status === "unconfigured") {
      return {
        outcome: "fallback_selected" as const,
        reason: "requested_backend_unconfigured_default_backend_selected_by_helix_policy",
      };
    }
    if (
      input.requestedBackend.availability_status === "permission_blocked" ||
      input.requestedBackend.availability_status === "disabled" ||
      input.requestedBackend.permission_status !== "admitted"
    ) {
      return {
        outcome: "fallback_selected" as const,
        reason: "requested_backend_not_permitted_default_backend_selected_by_helix_policy",
      };
    }
    return {
      outcome: "requested_recorded_default_selected" as const,
      reason: "requested_backend_recorded_but_default_backend_selected_by_helix_shadow_policy",
    };
  })();

  return {
    schema: "helix.capability_lane.backend_selection_decision.v1",
    owner: "helix",
    outcome: outcomeAndReason.outcome,
    reason: outcomeAndReason.reason,
    requested_backend_provider: input.requestedBackendProvider,
    requested_backend_provider_known: input.requestedBackendProvider ? Boolean(input.requestedBackend) : false,
    selected_backend_provider: input.selectedBackend?.provider_id ?? null,
    fallback_backend_provider:
      input.requestedBackend?.fallback_backend_provider ??
      input.selectedBackend?.fallback_backend_provider ??
      null,
    selected_runtime_provider_remains_root: true,
    backend_provider_becomes_root_agent: false,
    dynamic_switching_executed: false,
    live_backend_execution_enabled: input.liveBackendExecutionEnabled === true,
    terminal_authority_owner: "helix",
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};
