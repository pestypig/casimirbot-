import crypto from "node:crypto";
import type { HelixAccountCapabilityPolicy, HelixAccountType } from "@shared/helix-account-session";
import type { HelixWorkstationGatewayAccountContext } from "../workstation-tool-gateway/account-policy";
import { listAccountAuthorizedWorkstationGatewayCapabilities } from "../workstation-tool-gateway/account-policy";

export const HELIX_RUNTIME_GOAL_ACCOUNT_BINDING_SCHEMA =
  "helix.runtime_goal.account_binding.v1" as const;
export const HELIX_RUNTIME_GOAL_ACCOUNT_BINDING_PROJECTION_SCHEMA =
  "helix.runtime_goal.account_binding_projection.v1" as const;
export const HELIX_RUNTIME_GOAL_ACCOUNT_SCOPE_SCHEMA =
  "helix.runtime_goal.account_scope.v1" as const;

export type HelixRuntimeGoalTrustedAccountBinding = {
  schema: typeof HELIX_RUNTIME_GOAL_ACCOUNT_BINDING_SCHEMA;
  binding_ref: string;
  session_id: string;
  session_ref: string;
  profile_id: string;
  profile_ref: string;
  account_type: HelixAccountType;
  policy_fingerprint: string;
  allowed_workstation_tools: string[];
  bound_at_ms: number;
};

export type HelixRuntimeGoalAccountScope = {
  schema: typeof HELIX_RUNTIME_GOAL_ACCOUNT_SCOPE_SCHEMA;
  trusted: true;
  session_ref: string;
  profile_ref: string;
  account_type: HelixAccountType;
  policy_fingerprint: string;
  raw_session_id_included: false;
  raw_profile_id_included: false;
};

export type HelixRuntimeGoalAccountBindingValidationStatus =
  | "trusted"
  | "unbound"
  | "active_session_missing"
  | "session_mismatch"
  | "profile_mismatch"
  | "policy_mismatch";

export type HelixRuntimeGoalAccountBindingProjection = {
  schema: typeof HELIX_RUNTIME_GOAL_ACCOUNT_BINDING_PROJECTION_SCHEMA;
  trusted: boolean;
  binding_ref: string | null;
  session_ref: string | null;
  profile_ref: string | null;
  account_type: HelixAccountType | null;
  policy_fingerprint: string | null;
  current_policy_fingerprint: string | null;
  validation_status: HelixRuntimeGoalAccountBindingValidationStatus;
  blocked_reason: string | null;
  allowed_workstation_tools: string[];
  raw_session_id_included: false;
  raw_profile_id_included: false;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixRuntimeGoalAccountBindingValidation = {
  admitted: boolean;
  status: HelixRuntimeGoalAccountBindingValidationStatus;
  blockedReason: string | null;
  effectiveAllowedWorkstationTools: string[];
  projection: HelixRuntimeGoalAccountBindingProjection;
};

const unique = (values: readonly string[]): string[] =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const hash = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex");

const policyFingerprintPayload = (policy: HelixAccountCapabilityPolicy) => ({
  schema: policy.schema,
  account_type: policy.account_type,
  max_workstation_permission: policy.max_workstation_permission,
  allowed_panels: [...policy.allowed_panels].sort(),
  locked_panels: [...policy.locked_panels].sort(),
  locked_features: [...policy.locked_features].sort(),
  allowed_runtime_agents: [...policy.allowed_runtime_agents].sort(),
  allowed_workstation_capabilities: [...policy.allowed_workstation_capabilities].sort(),
  locked_workstation_capabilities: [...policy.locked_workstation_capabilities].sort(),
  feature_flags: [...policy.feature_flags].sort(),
  quotas: {
    profile_storage_bytes: policy.quotas.profile_storage_bytes,
    model_tokens_per_turn: policy.quotas.model_tokens_per_turn,
    model_tokens_per_day: policy.quotas.model_tokens_per_day,
    runtime_minutes_per_day: policy.quotas.runtime_minutes_per_day,
  },
});

export const fingerprintRuntimeGoalAccountPolicy = (
  policy: HelixAccountCapabilityPolicy,
): string => `sha256:${hash(JSON.stringify(policyFingerprintPayload(policy)))}`;

const opaqueRef = (kind: "session" | "profile", value: string): string =>
  `runtime-goal-${kind}:sha256:${hash(value).slice(0, 24)}`;

export const buildRuntimeGoalProfileRef = (profileId: string): string =>
  opaqueRef("profile", profileId.trim());

export const buildRuntimeGoalAccountScope = (
  context: HelixWorkstationGatewayAccountContext | null | undefined,
): HelixRuntimeGoalAccountScope | null => {
  const sessionId = context?.session_id?.trim() ?? "";
  const profileId = context?.profile_id?.trim() ?? "";
  if (
    !context?.trusted_account_session ||
    !context.account_session ||
    context.account_session.status !== "active" ||
    !sessionId ||
    !profileId
  ) {
    return null;
  }
  return {
    schema: HELIX_RUNTIME_GOAL_ACCOUNT_SCOPE_SCHEMA,
    trusted: true,
    session_ref: opaqueRef("session", sessionId),
    profile_ref: buildRuntimeGoalProfileRef(profileId),
    account_type: context.account_policy.account_type,
    policy_fingerprint: fingerprintRuntimeGoalAccountPolicy(context.account_policy),
    raw_session_id_included: false,
    raw_profile_id_included: false,
  };
};

export const runtimeGoalAccountScopeMatchesBinding = (input: {
  scope?: HelixRuntimeGoalAccountScope | null;
  binding?: HelixRuntimeGoalTrustedAccountBinding | null;
}): boolean => {
  const scope = input.scope ?? null;
  const binding = input.binding ?? null;
  if (!binding) return scope === null;
  return Boolean(
    scope?.trusted &&
    scope.session_ref === binding.session_ref &&
    scope.profile_ref === binding.profile_ref &&
    scope.account_type === binding.account_type &&
    scope.policy_fingerprint === binding.policy_fingerprint
  );
};

const accountAuthorizedToolIds = (input: {
  accountContext: HelixWorkstationGatewayAccountContext;
  runtimeAgentProvider: string;
}): string[] =>
  listAccountAuthorizedWorkstationGatewayCapabilities({
    accountContext: input.accountContext,
    requestedMode: "observe",
    requestedRuntime: input.runtimeAgentProvider,
  }).capabilities.map((capability) => capability.capability_id);

export const intersectRuntimeGoalAllowedWorkstationTools = (input: {
  adapterAllowedWorkstationTools: readonly string[];
  requestedAllowedWorkstationTools?: readonly string[] | null;
  accountContext?: HelixWorkstationGatewayAccountContext | null;
  runtimeAgentProvider: string;
}): string[] => {
  const adapterAllowed = unique(input.adapterAllowedWorkstationTools);
  const requestedToolsWereSupplied = input.requestedAllowedWorkstationTools != null;
  const requested = unique(input.requestedAllowedWorkstationTools ?? []);
  const candidates = requestedToolsWereSupplied ? requested : adapterAllowed;
  const adapterSet = new Set(adapterAllowed);
  const adapterAndGoal = candidates.filter((capabilityId) => adapterSet.has(capabilityId));
  if (!input.accountContext) return adapterAndGoal;
  const accountSet = new Set(accountAuthorizedToolIds({
    accountContext: input.accountContext,
    runtimeAgentProvider: input.runtimeAgentProvider,
  }));
  return adapterAndGoal.filter((capabilityId) => accountSet.has(capabilityId));
};

export const buildRuntimeGoalTrustedAccountBinding = (input: {
  accountContext?: HelixWorkstationGatewayAccountContext | null;
  allowedWorkstationTools: readonly string[];
  nowMs?: number;
}): HelixRuntimeGoalTrustedAccountBinding | null => {
  const context = input.accountContext;
  const sessionId = context?.session_id?.trim() ?? "";
  const profileId = context?.profile_id?.trim() ?? "";
  if (
    !context?.trusted_account_session ||
    !context.account_session ||
    context.account_session.status !== "active" ||
    !sessionId ||
    !profileId
  ) {
    return null;
  }
  const policyFingerprint = fingerprintRuntimeGoalAccountPolicy(context.account_policy);
  const boundAtMs = input.nowMs ?? Date.now();
  const bindingRef = `runtime-goal-account-binding:sha256:${hash([
    sessionId,
    profileId,
    policyFingerprint,
    String(boundAtMs),
  ].join("\n")).slice(0, 32)}`;
  return {
    schema: HELIX_RUNTIME_GOAL_ACCOUNT_BINDING_SCHEMA,
    binding_ref: bindingRef,
    session_id: sessionId,
    session_ref: opaqueRef("session", sessionId),
    profile_id: profileId,
    profile_ref: opaqueRef("profile", profileId),
    account_type: context.account_policy.account_type,
    policy_fingerprint: policyFingerprint,
    allowed_workstation_tools: unique(input.allowedWorkstationTools),
    bound_at_ms: boundAtMs,
  };
};

const blockedReasonForStatus = (
  status: HelixRuntimeGoalAccountBindingValidationStatus,
): string | null => {
  if (status === "trusted") return null;
  if (status === "unbound") return "runtime_goal_account_binding_required";
  if (status === "active_session_missing") return "runtime_goal_account_session_inactive";
  if (status === "session_mismatch") return "runtime_goal_account_session_mismatch";
  if (status === "profile_mismatch") return "runtime_goal_account_profile_mismatch";
  return "runtime_goal_account_policy_changed";
};

export const validateRuntimeGoalAccountBinding = (input: {
  binding?: HelixRuntimeGoalTrustedAccountBinding | null;
  accountContext?: HelixWorkstationGatewayAccountContext | null;
  sessionAllowedWorkstationTools: readonly string[];
  runtimeAgentProvider: string;
}): HelixRuntimeGoalAccountBindingValidation => {
  const binding = input.binding ?? null;
  const context = input.accountContext ?? null;
  const currentPolicyFingerprint = context
    ? fingerprintRuntimeGoalAccountPolicy(context.account_policy)
    : null;
  let status: HelixRuntimeGoalAccountBindingValidationStatus = "trusted";
  if (!binding) {
    status = "unbound";
  } else if (
    !context?.trusted_account_session ||
    !context.account_session ||
    context.account_session.status !== "active" ||
    !context.session_id ||
    !context.profile_id
  ) {
    status = "active_session_missing";
  } else if (context.session_id !== binding.session_id) {
    status = "session_mismatch";
  } else if (context.profile_id !== binding.profile_id) {
    status = "profile_mismatch";
  } else if (
    currentPolicyFingerprint !== binding.policy_fingerprint ||
    context.account_policy.account_type !== binding.account_type
  ) {
    status = "policy_mismatch";
  }

  const admitted = status === "trusted";
  const effectiveAllowedWorkstationTools = admitted && binding && context
    ? intersectRuntimeGoalAllowedWorkstationTools({
        adapterAllowedWorkstationTools: binding.allowed_workstation_tools,
        requestedAllowedWorkstationTools: input.sessionAllowedWorkstationTools,
        accountContext: context,
        runtimeAgentProvider: input.runtimeAgentProvider,
      })
    : [];
  const blockedReason = blockedReasonForStatus(status);
  return {
    admitted,
    status,
    blockedReason,
    effectiveAllowedWorkstationTools,
    projection: {
      schema: HELIX_RUNTIME_GOAL_ACCOUNT_BINDING_PROJECTION_SCHEMA,
      trusted: admitted,
      binding_ref: binding?.binding_ref ?? null,
      session_ref: binding?.session_ref ?? null,
      profile_ref: binding?.profile_ref ?? null,
      account_type: binding?.account_type ?? null,
      policy_fingerprint: binding?.policy_fingerprint ?? null,
      current_policy_fingerprint: currentPolicyFingerprint,
      validation_status: status,
      blocked_reason: blockedReason,
      allowed_workstation_tools: effectiveAllowedWorkstationTools,
      raw_session_id_included: false,
      raw_profile_id_included: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    },
  };
};
