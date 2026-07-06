import type { HelixAccountCapabilityPolicy, HelixAccountType } from "./helix-account-session";

export const HELIX_LANGUAGE_MODEL_POLICY_SCHEMA = "helix.language_model_policy.v1" as const;

export type HelixLanguageModelProfileId = "auto" | "fast" | "balanced" | "deep";
export type HelixLanguageReasoningEffort = "none" | "low" | "medium" | "high" | "xhigh";
export type HelixLanguageToolSurfaceTier = "minimal" | "standard" | "expanded" | "developer";
export type HelixLanguageModelSelectionSource =
  | "user_selected"
  | "policy"
  | "developer_override"
  | "policy_downgrade";
export type HelixLanguageModelPersistenceScope = "session" | "turn";

export type HelixLanguageModelPolicy = {
  schema: typeof HELIX_LANGUAGE_MODEL_POLICY_SCHEMA;
  requested_profile: HelixLanguageModelProfileId;
  resolved_profile: Exclude<HelixLanguageModelProfileId, "auto">;
  resolved_model: string;
  reasoning_effort: HelixLanguageReasoningEffort;
  verbosity: "low" | "medium" | "high";
  tool_surface_tier: HelixLanguageToolSurfaceTier;
  selection_source: HelixLanguageModelSelectionSource;
  persistence_scope: HelixLanguageModelPersistenceScope;
  selection_reason: string;
  escalation_reason: string | null;
  downgrade_reason: string | null;
  account_policy: HelixAccountType;
  budget_limits: {
    max_tokens_per_turn: number;
    max_tokens_per_day: number;
    runtime_minutes_per_day: number;
    profile_max_tokens_per_turn: number;
    effective_max_tokens_per_turn: number;
  };
  exact_model_override_allowed: boolean;
  exact_model_override_requested: boolean;
  exact_model_override_rejected_reason: string | null;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixLanguageModelPolicyInput = {
  requestedProfile?: unknown;
  persistedProfile?: unknown;
  exactModelOverride?: unknown;
  accountType?: HelixAccountType | string | null;
  accountPolicy?: Pick<HelixAccountCapabilityPolicy, "account_type" | "quotas"> | null;
  promptText?: string | null;
  taskClass?: string | null;
  runtimeAgentLaunchMode?: string | null;
  modelAccess?: Partial<Record<Exclude<HelixLanguageModelProfileId, "auto">, boolean>>;
};

type ProfileSpec = {
  profile: Exclude<HelixLanguageModelProfileId, "auto">;
  model: string;
  reasoning: HelixLanguageReasoningEffort;
  verbosity: "low" | "medium" | "high";
  toolTier: HelixLanguageToolSurfaceTier;
  maxTokens: number;
};

const DEFAULT_PROFILE_SPECS: Record<Exclude<HelixLanguageModelProfileId, "auto">, ProfileSpec> = {
  fast: {
    profile: "fast",
    model: "gpt-5.4-mini",
    reasoning: "low",
    verbosity: "low",
    toolTier: "minimal",
    maxTokens: 8_000,
  },
  balanced: {
    profile: "balanced",
    model: "gpt-5.5",
    reasoning: "medium",
    verbosity: "medium",
    toolTier: "standard",
    maxTokens: 32_000,
  },
  deep: {
    profile: "deep",
    model: "gpt-5.5",
    reasoning: "high",
    verbosity: "medium",
    toolTier: "expanded",
    maxTokens: 64_000,
  },
};

const normalizeProfile = (value: unknown): HelixLanguageModelProfileId | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "auto" || normalized === "fast" || normalized === "balanced" || normalized === "deep") {
    return normalized;
  }
  return null;
};

const normalizeAccountType = (value: unknown): HelixAccountType =>
  value === "developer" ? "developer" : "user";

const readText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const classifyAutoProfile = (input: HelixLanguageModelPolicyInput): {
  profile: Exclude<HelixLanguageModelProfileId, "auto">;
  reason: string;
  escalationReason: string | null;
} => {
  const taskClass = readText(input.taskClass).toLowerCase();
  const launchMode = readText(input.runtimeAgentLaunchMode).toLowerCase();
  const prompt = readText(input.promptText).toLowerCase();
  if (
    /\b(deep|research|debug|implement|refactor|architecture|multi[-\s]?step|tool[-\s]?heavy|reasoning|verify|diagnose)\b/.test(
      `${taskClass} ${launchMode} ${prompt}`,
    )
  ) {
    return {
      profile: "deep",
      reason: "Auto selected Deep for complex reasoning or tool-heavy work.",
      escalationReason: "complex_tool_planning",
    };
  }
  if (/\b(quick|fast|classify|summarize|status|voice|latency|short)\b/.test(`${taskClass} ${launchMode} ${prompt}`)) {
    return {
      profile: "fast",
      reason: "Auto selected Fast for a latency-sensitive or lightweight turn.",
      escalationReason: null,
    };
  }
  return {
    profile: "balanced",
    reason: "Auto selected Balanced as the default general-purpose profile.",
    escalationReason: null,
  };
};

const profileWithAccess = (
  requested: Exclude<HelixLanguageModelProfileId, "auto">,
  access: HelixLanguageModelPolicyInput["modelAccess"],
): { profile: Exclude<HelixLanguageModelProfileId, "auto">; downgradeReason: string | null } => {
  if (access?.[requested] !== false) return { profile: requested, downgradeReason: null };
  if (requested === "deep" && access?.balanced !== false) {
    return { profile: "balanced", downgradeReason: "requested_profile_unavailable" };
  }
  if (requested !== "fast" && access?.fast !== false) {
    return { profile: "fast", downgradeReason: "requested_profile_unavailable" };
  }
  return { profile: "fast", downgradeReason: "requested_profile_unavailable" };
};

export const buildHelixLanguageModelDebugSummary = (policy: HelixLanguageModelPolicy): string => {
  const requested = policy.requested_profile.charAt(0).toUpperCase() + policy.requested_profile.slice(1);
  const resolved = policy.resolved_profile.charAt(0).toUpperCase() + policy.resolved_profile.slice(1);
  return `AI: ${requested} -> ${resolved} | ${policy.resolved_model} | reasoning: ${policy.reasoning_effort} | ${policy.persistence_scope}-local`;
};

export const resolveHelixLanguageModelPolicy = (
  input: HelixLanguageModelPolicyInput,
): HelixLanguageModelPolicy => {
  const accountType = normalizeAccountType(input.accountPolicy?.account_type ?? input.accountType);
  const quotas = input.accountPolicy?.quotas;
  const requestedProfile =
    normalizeProfile(input.requestedProfile) ?? normalizeProfile(input.persistedProfile) ?? "auto";
  const autoSelection = requestedProfile === "auto" ? classifyAutoProfile(input) : null;
  const requestedConcreteProfile = autoSelection?.profile ?? requestedProfile;
  const accessResolved = profileWithAccess(requestedConcreteProfile, input.modelAccess);
  let resolvedProfile = accessResolved.profile;
  let downgradeReason = accessResolved.downgradeReason;
  let selectionSource: HelixLanguageModelSelectionSource =
    requestedProfile === "auto" ? "policy" : "user_selected";
  const exactModelOverride = readText(input.exactModelOverride);
  const exactOverrideRequested = Boolean(exactModelOverride);
  const exactOverrideAllowed = accountType === "developer" && exactOverrideRequested;
  let exactOverrideRejectedReason: string | null = null;
  if (exactOverrideRequested && accountType !== "developer") {
    exactOverrideRejectedReason = "exact_model_override_requires_developer_account";
    downgradeReason = downgradeReason ?? exactOverrideRejectedReason;
  }
  const quotaMaxTurn = Math.max(1, Math.floor(quotas?.model_tokens_per_turn ?? 16_000));
  const quotaMaxDay = Math.max(1, Math.floor(quotas?.model_tokens_per_day ?? 100_000));
  const runtimeMinutes = Math.max(0, Math.floor(quotas?.runtime_minutes_per_day ?? 30));
  if (quotaMaxTurn < DEFAULT_PROFILE_SPECS[resolvedProfile].maxTokens && resolvedProfile === "deep") {
    resolvedProfile = quotaMaxTurn >= DEFAULT_PROFILE_SPECS.balanced.maxTokens ? "balanced" : "fast";
    downgradeReason = downgradeReason ?? "profile_budget_exceeds_account_quota";
  }
  if (quotaMaxTurn < DEFAULT_PROFILE_SPECS.fast.maxTokens && resolvedProfile === "balanced") {
    resolvedProfile = "fast";
    downgradeReason = downgradeReason ?? "profile_budget_exceeds_account_quota";
  }
  const spec = DEFAULT_PROFILE_SPECS[resolvedProfile];
  if (downgradeReason) selectionSource = "policy_downgrade";
  if (exactOverrideAllowed) selectionSource = "developer_override";
  const resolvedModel = exactOverrideAllowed ? exactModelOverride : spec.model;
  const selectionReason =
    exactOverrideAllowed
      ? "Developer exact model override accepted by account policy."
      : autoSelection?.reason ??
        (downgradeReason
          ? `Resolved profile was downgraded by policy: ${downgradeReason}.`
          : `User-selected ${requestedProfile} profile persisted for this chat/session.`);
  return {
    schema: HELIX_LANGUAGE_MODEL_POLICY_SCHEMA,
    requested_profile: requestedProfile,
    resolved_profile: resolvedProfile,
    resolved_model: resolvedModel,
    reasoning_effort: spec.reasoning,
    verbosity: spec.verbosity,
    tool_surface_tier: accountType === "developer" && exactOverrideAllowed ? "developer" : spec.toolTier,
    selection_source: selectionSource,
    persistence_scope: requestedProfile === "auto" ? "turn" : "session",
    selection_reason: selectionReason,
    escalation_reason: autoSelection?.escalationReason ?? null,
    downgrade_reason: downgradeReason,
    account_policy: accountType,
    budget_limits: {
      max_tokens_per_turn: quotaMaxTurn,
      max_tokens_per_day: quotaMaxDay,
      runtime_minutes_per_day: runtimeMinutes,
      profile_max_tokens_per_turn: spec.maxTokens,
      effective_max_tokens_per_turn: Math.min(quotaMaxTurn, spec.maxTokens),
    },
    exact_model_override_allowed: exactOverrideAllowed,
    exact_model_override_requested: exactOverrideRequested,
    exact_model_override_rejected_reason: exactOverrideRejectedReason,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};
