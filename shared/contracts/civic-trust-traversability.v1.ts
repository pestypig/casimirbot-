export const CIVIC_TRUST_TRAVERSABILITY_ARTIFACT_ID = "civic_trust_traversability" as const;
export const CIVIC_TRUST_TRAVERSABILITY_SCHEMA_VERSION = "civic_trust_traversability/v1" as const;

export const CIVIC_TRUST_SCALES = [
  "organism",
  "relationship",
  "household",
  "community",
  "institution",
  "civilization",
] as const;

export const CIVIC_TRUST_CONTEXT_LEVELS = ["low", "medium", "high", "unknown"] as const;
export const CIVIC_TRUST_CLOCK_STATES = ["bounded", "partial", "unknown"] as const;
export const CIVIC_TRUST_SIGNAL_KINDS = [
  "relational_witness",
  "reciprocal_history",
  "community_sponsorship",
  "contract_performance",
  "financial_record",
  "repair_record",
] as const;
export const CIVIC_TRUST_THRESHOLD_PURPOSES = ["entry", "reliance", "authority", "reentry"] as const;

export type CivicTrustScaleV1 = (typeof CIVIC_TRUST_SCALES)[number];
export type CivicTrustContextLevelV1 = (typeof CIVIC_TRUST_CONTEXT_LEVELS)[number];
export type CivicTrustClockStateV1 = (typeof CIVIC_TRUST_CLOCK_STATES)[number];
export type CivicTrustSignalKindV1 = (typeof CIVIC_TRUST_SIGNAL_KINDS)[number];
export type CivicTrustThresholdPurposeV1 = (typeof CIVIC_TRUST_THRESHOLD_PURPOSES)[number];

export type CivicTrustTimeWindowV1 = {
  state: CivicTrustClockStateV1;
  description: string;
  evidenceRefs: string[];
};

export type CivicTrustTraversabilityV1 = {
  artifactId: typeof CIVIC_TRUST_TRAVERSABILITY_ARTIFACT_ID;
  schemaVersion: typeof CIVIC_TRUST_TRAVERSABILITY_SCHEMA_VERSION;
  scalePath: CivicTrustScaleV1[];
  context: {
    interactionDensity: CivicTrustContextLevelV1;
    repeatedContact: CivicTrustContextLevelV1;
    networkOverlap: CivicTrustContextLevelV1;
    anonymity: CivicTrustContextLevelV1;
    institutionalReach: CivicTrustContextLevelV1;
    resourceScarcity: CivicTrustContextLevelV1;
    supportRedundancy: CivicTrustContextLevelV1;
  };
  clocks: {
    maturation: CivicTrustTimeWindowV1;
    relationship: CivicTrustTimeWindowV1;
    obligation: CivicTrustTimeWindowV1;
    institutionalMemory: CivicTrustTimeWindowV1;
  };
  trustSignals: Array<{
    id: string;
    kind: CivicTrustSignalKindV1;
    domain: string;
    observerExposure: string;
    observedAt: string | null;
    lastVerifiedAt: string | null;
    expiresAt: string | null;
    evidenceRefs: string[];
    correctionPath: string | null;
  }>;
  thresholds: Array<{
    id: string;
    purpose: CivicTrustThresholdPurposeV1;
    criteriaPublished: boolean;
    reasonVisible: boolean;
    appealPath: string | null;
    repairPath: string | null;
    sunsetOrReviewAt: string | null;
  }>;
  exclusionEffects: Array<{
    deniedAccess: string;
    downstreamDependencies: string[];
    availableAlternatives: string[];
    affectedParties: string[];
  }>;
  activatedBadgeIds: string[];
  missingEvidence: string[];
  authority: {
    assistant_answer: false;
    raw_content_included: false;
    terminal_eligible: false;
    context_role: "tool_policy";
    ask_context_policy: "evidence_only";
    agent_executable: false;
    moral_finality: false;
    character_verdict: false;
    financial_authority: false;
    global_trust_score_allowed: false;
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isEnumValue = (values: readonly string[], value: unknown): value is string =>
  typeof value === "string" && values.includes(value);

export function validateCivicTrustTraversabilityV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["Civic Trust Traversability must be an object"];
  if (value.artifactId !== CIVIC_TRUST_TRAVERSABILITY_ARTIFACT_ID) issues.push("artifactId is invalid");
  if (value.schemaVersion !== CIVIC_TRUST_TRAVERSABILITY_SCHEMA_VERSION) issues.push("schemaVersion is invalid");
  if (!Array.isArray(value.scalePath) || !value.scalePath.every((scale) => isEnumValue(CIVIC_TRUST_SCALES, scale))) {
    issues.push("scalePath contains an invalid scale");
  }

  if (!isRecord(value.context)) {
    issues.push("context must be an object");
  } else {
    for (const field of [
      "interactionDensity",
      "repeatedContact",
      "networkOverlap",
      "anonymity",
      "institutionalReach",
      "resourceScarcity",
      "supportRedundancy",
    ]) {
      if (!isEnumValue(CIVIC_TRUST_CONTEXT_LEVELS, value.context[field])) issues.push(`context.${field} is invalid`);
    }
  }

  if (!isRecord(value.clocks)) {
    issues.push("clocks must be an object");
  } else {
    for (const field of ["maturation", "relationship", "obligation", "institutionalMemory"]) {
      const clock = value.clocks[field];
      if (!isRecord(clock)) {
        issues.push(`clocks.${field} must be an object`);
      } else {
        if (!isEnumValue(CIVIC_TRUST_CLOCK_STATES, clock.state)) issues.push(`clocks.${field}.state is invalid`);
        if (typeof clock.description !== "string") issues.push(`clocks.${field}.description must be a string`);
        if (!isStringArray(clock.evidenceRefs)) issues.push(`clocks.${field}.evidenceRefs must be a string array`);
      }
    }
  }

  for (const field of ["trustSignals", "thresholds", "exclusionEffects", "activatedBadgeIds", "missingEvidence"]) {
    if (!Array.isArray(value[field])) issues.push(`${field} must be an array`);
  }
  if (Array.isArray(value.trustSignals)) {
    value.trustSignals.forEach((signal, index) => {
      if (!isRecord(signal)) {
        issues.push(`trustSignals[${index}] must be an object`);
        return;
      }
      if (typeof signal.id !== "string" || !signal.id.trim()) issues.push(`trustSignals[${index}].id is required`);
      if (!isEnumValue(CIVIC_TRUST_SIGNAL_KINDS, signal.kind)) issues.push(`trustSignals[${index}].kind is invalid`);
      for (const field of ["domain", "observerExposure"]) {
        if (typeof signal[field] !== "string") issues.push(`trustSignals[${index}].${field} must be a string`);
      }
      for (const field of ["observedAt", "lastVerifiedAt", "expiresAt", "correctionPath"]) {
        if (signal[field] !== null && typeof signal[field] !== "string") {
          issues.push(`trustSignals[${index}].${field} must be a string or null`);
        }
      }
      if (!isStringArray(signal.evidenceRefs)) issues.push(`trustSignals[${index}].evidenceRefs must be a string array`);
    });
  }
  if (Array.isArray(value.thresholds)) {
    value.thresholds.forEach((threshold, index) => {
      if (!isRecord(threshold)) {
        issues.push(`thresholds[${index}] must be an object`);
        return;
      }
      if (typeof threshold.id !== "string" || !threshold.id.trim()) issues.push(`thresholds[${index}].id is required`);
      if (!isEnumValue(CIVIC_TRUST_THRESHOLD_PURPOSES, threshold.purpose)) issues.push(`thresholds[${index}].purpose is invalid`);
      for (const field of ["criteriaPublished", "reasonVisible"]) {
        if (typeof threshold[field] !== "boolean") issues.push(`thresholds[${index}].${field} must be boolean`);
      }
      for (const field of ["appealPath", "repairPath", "sunsetOrReviewAt"]) {
        if (threshold[field] !== null && typeof threshold[field] !== "string") {
          issues.push(`thresholds[${index}].${field} must be a string or null`);
        }
      }
    });
  }
  if (Array.isArray(value.exclusionEffects)) {
    value.exclusionEffects.forEach((effect, index) => {
      if (!isRecord(effect)) {
        issues.push(`exclusionEffects[${index}] must be an object`);
        return;
      }
      if (typeof effect.deniedAccess !== "string") issues.push(`exclusionEffects[${index}].deniedAccess must be a string`);
      for (const field of ["downstreamDependencies", "availableAlternatives", "affectedParties"]) {
        if (!isStringArray(effect[field])) issues.push(`exclusionEffects[${index}].${field} must be a string array`);
      }
    });
  }
  if (!isStringArray(value.activatedBadgeIds)) issues.push("activatedBadgeIds must be a string array");
  if (!isStringArray(value.missingEvidence)) issues.push("missingEvidence must be a string array");
  if ("trustScore" in value || "globalTrustScore" in value) issues.push("global trust scores are forbidden");

  if (!isRecord(value.authority)) {
    issues.push("authority must be an object");
  } else {
    for (const field of [
      "assistant_answer",
      "raw_content_included",
      "terminal_eligible",
      "agent_executable",
      "moral_finality",
      "character_verdict",
      "financial_authority",
      "global_trust_score_allowed",
    ]) {
      if (value.authority[field] !== false) issues.push(`authority.${field} must be false`);
    }
    if (value.authority.context_role !== "tool_policy") issues.push("authority.context_role must be tool_policy");
    if (value.authority.ask_context_policy !== "evidence_only") {
      issues.push("authority.ask_context_policy must be evidence_only");
    }
  }
  return issues;
}

export const isCivicTrustTraversabilityV1 = (value: unknown): value is CivicTrustTraversabilityV1 =>
  validateCivicTrustTraversabilityV1(value).length === 0;
