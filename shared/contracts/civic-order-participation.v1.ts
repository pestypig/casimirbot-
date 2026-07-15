export const CIVIC_ORDER_PARTICIPATION_ARTIFACT_ID = "civic_order_participation" as const;
export const CIVIC_ORDER_PARTICIPATION_SCHEMA_VERSION = "civic_order_participation/v1" as const;

export const CIVIC_ORDER_SCALES = [
  "household",
  "workplace",
  "neighborhood",
  "municipality",
  "region",
  "polity",
  "trade_interface",
] as const;
export const CIVIC_ACTOR_ROLES = [
  "resident",
  "worker",
  "tenant",
  "owner",
  "consumer",
  "recipient",
  "member",
  "steward",
  "official",
  "enforcer",
  "dissenter",
  "outsider_affected",
] as const;
export const CIVIC_PARTICIPATION_FUNCTIONS = [
  "subject_to_norm",
  "uses_system",
  "contributes_resources",
  "receives_benefit",
  "votes_or_deliberates",
  "owns_or_governs",
  "administers",
  "enforces",
  "contests",
  "attempts_exit",
] as const;
export const CIVIC_CONSENT_STATES = [
  "explicit",
  "informed_but_constrained",
  "necessity_bound",
  "coerced",
  "contested",
  "unknown",
] as const;
export const CIVIC_ENTRY_MODES = [
  "birth",
  "residence",
  "employment",
  "contract",
  "migration",
  "membership",
  "unknown",
] as const;
export const CIVIC_NORM_SOURCES = [
  "custom",
  "peer_expectation",
  "contract",
  "market_rule",
  "law",
  "administrative_rule",
  "party_directive",
  "association_rule",
  "platform_rule",
] as const;
export const CIVIC_NORM_STATUSES = [
  "descriptive",
  "expected",
  "codified",
  "enforced",
  "contested",
  "obsolete_or_drifting",
] as const;
export const CIVIC_ALLOCATION_CHANNELS = [
  "market_price",
  "private_contract",
  "democratic_budget",
  "public_provision",
  "administrative_plan",
  "cooperative_governance",
  "commons_stewardship",
  "household_allocation",
  "mutual_aid",
  "rationing",
] as const;
export const CIVIC_AUTHORITY_CHANNELS = [
  "property_control",
  "contract_authority",
  "electoral_authority",
  "legislative_authority",
  "administrative_authority",
  "party_hierarchy",
  "professional_expertise",
  "customary_authority",
  "platform_control",
] as const;
export const CIVIC_ACCOUNTABILITY_CHANNELS = [
  "competition",
  "exit",
  "election",
  "recall",
  "court_or_appeal",
  "independent_audit",
  "union_or_worker_governance",
  "cooperative_review",
  "community_mediation",
  "public_transparency",
  "internal_discipline",
] as const;
export const CIVIC_CHANNEL_ROLES = ["primary", "secondary", "fallback", "constraint", "unknown"] as const;

export type CivicOrderScaleV1 = (typeof CIVIC_ORDER_SCALES)[number];
export type CivicActorRoleV1 = (typeof CIVIC_ACTOR_ROLES)[number];
export type CivicParticipationFunctionV1 = (typeof CIVIC_PARTICIPATION_FUNCTIONS)[number];
export type CivicConsentStateV1 = (typeof CIVIC_CONSENT_STATES)[number];
export type CivicEntryModeV1 = (typeof CIVIC_ENTRY_MODES)[number];
export type CivicNormSourceV1 = (typeof CIVIC_NORM_SOURCES)[number];
export type CivicNormStatusV1 = (typeof CIVIC_NORM_STATUSES)[number];
export type CivicAllocationChannelV1 = (typeof CIVIC_ALLOCATION_CHANNELS)[number];
export type CivicAuthorityChannelV1 = (typeof CIVIC_AUTHORITY_CHANNELS)[number];
export type CivicAccountabilityChannelV1 = (typeof CIVIC_ACCOUNTABILITY_CHANNELS)[number];
export type CivicChannelRoleV1 = (typeof CIVIC_CHANNEL_ROLES)[number];

export type CivicOrderParticipationV1 = {
  artifactId: typeof CIVIC_ORDER_PARTICIPATION_ARTIFACT_ID;
  schemaVersion: typeof CIVIC_ORDER_PARTICIPATION_SCHEMA_VERSION;
  scalePath: CivicOrderScaleV1[];
  actors: Array<{
    id: string;
    roles: CivicActorRoleV1[];
    participationFunctions: CivicParticipationFunctionV1[];
    consentState: CivicConsentStateV1;
    dependencyContext: string[];
    alternatives: string[];
    evidenceRefs: string[];
  }>;
  orderInheritance: {
    entryMode: CivicEntryModeV1;
    maturationContext: string[];
    learnedNormSources: string[];
    alternativesAtEntry: string[];
    presentChosenPosition: string | null;
  };
  localNorms: Array<{
    id: string;
    description: string;
    source: CivicNormSourceV1;
    status: CivicNormStatusV1;
    scope: CivicOrderScaleV1[];
    affectedParties: string[];
    sharedProximityEffects: string[];
    enforcementChannels: string[];
    exceptions: string[];
    dissentPath: string | null;
    reviewAt: string | null;
    evidenceRefs: string[];
  }>;
  coordinationProfile: {
    declaredLabels: string[];
    declaredLabelsAreNonAuthoritative: true;
    allocationChannels: Array<{
      channel: CivicAllocationChannelV1;
      role: CivicChannelRoleV1;
      evidenceRefs: string[];
    }>;
    authorityChannels: Array<{
      channel: CivicAuthorityChannelV1;
      role: CivicChannelRoleV1;
      evidenceRefs: string[];
    }>;
    accountabilityChannels: Array<{
      channel: CivicAccountabilityChannelV1;
      role: CivicChannelRoleV1;
      evidenceRefs: string[];
    }>;
  };
  participationConditions: {
    voicePath: string | null;
    formalExitPath: string | null;
    feasibleExitEvidence: string[];
    contestabilityPath: string | null;
    retaliationRisks: string[];
    repairPath: string | null;
    reentryPath: string | null;
  };
  supportSignals: Array<{
    actorId: string;
    signal: "endorsement" | "compliance" | "dependence" | "habit" | "benefit" | "fear" | "dissent" | "unknown";
    description: string;
    evidenceRefs: string[];
  }>;
  jurisdictionInterfaces: Array<{
    interfaceId: string;
    fromJurisdiction: string;
    toJurisdiction: string;
    exchangedFunctions: string[];
    governingChannels: string[];
    disputePath: string | null;
    exitOrContinuityPath: string | null;
    evidenceRefs: string[];
  }>;
  activatedBadgeIds: string[];
  missingEvidence: string[];
  authority: {
    assistant_answer: false;
    raw_content_included: false;
    terminal_eligible: false;
    context_role: "tool_evidence";
    ask_context_policy: "evidence_only";
    agent_executable: false;
    moral_finality: false;
    policy_finality: false;
    legitimacy_finality: false;
    consent_inference: false;
    ideology_rank: false;
    global_order_score_allowed: false;
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");
const isEnum = (values: readonly string[], value: unknown): value is string =>
  typeof value === "string" && values.includes(value);

function validateChannelEntries(
  path: string,
  entries: unknown,
  channels: readonly string[],
  issues: string[],
): void {
  if (!Array.isArray(entries)) {
    issues.push(`${path} must be an array`);
    return;
  }
  entries.forEach((entry, index) => {
    if (!isRecord(entry)) return issues.push(`${path}[${index}] must be an object`);
    if (!isEnum(channels, entry.channel)) issues.push(`${path}[${index}].channel is invalid`);
    if (!isEnum(CIVIC_CHANNEL_ROLES, entry.role)) issues.push(`${path}[${index}].role is invalid`);
    if (!isStringArray(entry.evidenceRefs)) issues.push(`${path}[${index}].evidenceRefs must be a string array`);
  });
}

function validateAuthority(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("authority must be an object");
    return;
  }
  for (const field of [
    "assistant_answer",
    "raw_content_included",
    "terminal_eligible",
    "agent_executable",
    "moral_finality",
    "policy_finality",
    "legitimacy_finality",
    "consent_inference",
    "ideology_rank",
    "global_order_score_allowed",
  ]) {
    if (value[field] !== false) issues.push(`authority.${field} must be false`);
  }
  if (value.context_role !== "tool_evidence") issues.push("authority.context_role must be tool_evidence");
  if (value.ask_context_policy !== "evidence_only") issues.push("authority.ask_context_policy must be evidence_only");
}

export function validateCivicOrderParticipationV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["Civic Order Participation must be an object"];
  if (value.artifactId !== CIVIC_ORDER_PARTICIPATION_ARTIFACT_ID) issues.push("artifactId is invalid");
  if (value.schemaVersion !== CIVIC_ORDER_PARTICIPATION_SCHEMA_VERSION) issues.push("schemaVersion is invalid");
  if (!Array.isArray(value.scalePath) || !value.scalePath.every((entry) => isEnum(CIVIC_ORDER_SCALES, entry))) {
    issues.push("scalePath contains an invalid scale");
  }

  if (!Array.isArray(value.actors)) {
    issues.push("actors must be an array");
  } else value.actors.forEach((actor, index) => {
    if (!isRecord(actor)) return issues.push(`actors[${index}] must be an object`);
    if (typeof actor.id !== "string" || !actor.id.trim()) issues.push(`actors[${index}].id is required`);
    if (!Array.isArray(actor.roles) || !actor.roles.every((entry) => isEnum(CIVIC_ACTOR_ROLES, entry))) issues.push(`actors[${index}].roles is invalid`);
    if (!Array.isArray(actor.participationFunctions) || !actor.participationFunctions.every((entry) => isEnum(CIVIC_PARTICIPATION_FUNCTIONS, entry))) issues.push(`actors[${index}].participationFunctions is invalid`);
    if (!isEnum(CIVIC_CONSENT_STATES, actor.consentState)) issues.push(`actors[${index}].consentState is invalid`);
    for (const field of ["dependencyContext", "alternatives", "evidenceRefs"]) {
      if (!isStringArray(actor[field])) issues.push(`actors[${index}].${field} must be a string array`);
    }
  });

  if (!isRecord(value.orderInheritance)) {
    issues.push("orderInheritance must be an object");
  } else {
    if (!isEnum(CIVIC_ENTRY_MODES, value.orderInheritance.entryMode)) issues.push("orderInheritance.entryMode is invalid");
    for (const field of ["maturationContext", "learnedNormSources", "alternativesAtEntry"]) {
      if (!isStringArray(value.orderInheritance[field])) issues.push(`orderInheritance.${field} must be a string array`);
    }
    if (value.orderInheritance.presentChosenPosition !== null && typeof value.orderInheritance.presentChosenPosition !== "string") {
      issues.push("orderInheritance.presentChosenPosition must be a string or null");
    }
  }

  if (!Array.isArray(value.localNorms)) issues.push("localNorms must be an array");
  if (!isRecord(value.coordinationProfile)) {
    issues.push("coordinationProfile must be an object");
  } else {
    if (!isStringArray(value.coordinationProfile.declaredLabels)) issues.push("coordinationProfile.declaredLabels must be a string array");
    if (value.coordinationProfile.declaredLabelsAreNonAuthoritative !== true) issues.push("coordinationProfile.declaredLabelsAreNonAuthoritative must be true");
    validateChannelEntries("coordinationProfile.allocationChannels", value.coordinationProfile.allocationChannels, CIVIC_ALLOCATION_CHANNELS, issues);
    validateChannelEntries("coordinationProfile.authorityChannels", value.coordinationProfile.authorityChannels, CIVIC_AUTHORITY_CHANNELS, issues);
    validateChannelEntries("coordinationProfile.accountabilityChannels", value.coordinationProfile.accountabilityChannels, CIVIC_ACCOUNTABILITY_CHANNELS, issues);
  }

  if (!isRecord(value.participationConditions)) issues.push("participationConditions must be an object");
  if (!Array.isArray(value.supportSignals)) issues.push("supportSignals must be an array");
  if (!Array.isArray(value.jurisdictionInterfaces)) issues.push("jurisdictionInterfaces must be an array");
  if (!isStringArray(value.activatedBadgeIds)) issues.push("activatedBadgeIds must be a string array");
  if (!isStringArray(value.missingEvidence)) issues.push("missingEvidence must be a string array");
  for (const forbidden of ["legitimacyScore", "consentScore", "globalOrderScore", "ideologyRank"]) {
    if (forbidden in value) issues.push(`${forbidden} is forbidden`);
  }
  validateAuthority(value.authority, issues);
  return issues;
}

export const isCivicOrderParticipationV1 = (
  value: unknown,
): value is CivicOrderParticipationV1 => validateCivicOrderParticipationV1(value).length === 0;
