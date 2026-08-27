export const SHARED_AUTHORITY_SOCIAL_RENEWAL_ARTIFACT_ID =
  "shared_authority_social_renewal_reflection" as const;
export const SHARED_AUTHORITY_SOCIAL_RENEWAL_SCHEMA_VERSION =
  "shared_authority_social_renewal_reflection/v1" as const;

export const SHARED_AUTHORITY_SOCIAL_RENEWAL_DOMAIN_IDS = [
  "competence_and_mandate",
  "inherited_continuity_and_constraint",
  "situated_knowledge_plurality",
  "shared_governance_and_decision_rights",
  "protected_person_agency",
  "cost_and_instrumentalization",
  "leadership_lifecycle_and_succession",
  "role_projection_and_personhood",
  "dissent_and_separation",
  "social_renewal_test",
] as const;

export const SHARED_AUTHORITY_SOCIAL_RENEWAL_TENSION_IDS = [
  "earned_expertise_vs_exclusive_sovereignty",
  "inherited_continuity_vs_personal_constraint",
  "protected_future_vs_protected_person_agency",
  "shared_purpose_vs_instrumentalization",
  "love_and_role_vs_independent_purpose",
  "renewal_vs_replacement",
] as const;

export type SharedAuthoritySocialRenewalDomainIdV1 =
  (typeof SHARED_AUTHORITY_SOCIAL_RENEWAL_DOMAIN_IDS)[number];
export type SharedAuthoritySocialRenewalTensionIdV1 =
  (typeof SHARED_AUTHORITY_SOCIAL_RENEWAL_TENSION_IDS)[number];

export type SharedAuthoritySocialRenewalAuthorityV1 = {
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  context_role: "tool_policy";
  ask_context_policy: "evidence_only";
  agent_executable: false;
  diagnostic_only: true;
  no_moral_verdict: true;
  no_character_identity_claim: true;
  no_legitimacy_inference: true;
};

export type SharedAuthoritySocialRenewalDomainV1 = {
  id: SharedAuthoritySocialRenewalDomainIdV1;
  question: string;
  primaryBadgeId: string;
  supportingBadgeIds: string[];
  status: "in_scope" | "unresolved";
  evidenceNodeIds: string[];
  missingEvidence: string[];
};

export type SharedAuthoritySocialRenewalTensionV1 = {
  id: SharedAuthoritySocialRenewalTensionIdV1;
  question: string;
  status: "in_scope" | "unresolved";
  relevantBadgeIds: string[];
};

export type SharedAuthoritySocialRenewalReflectionV1 = {
  artifactId: typeof SHARED_AUTHORITY_SOCIAL_RENEWAL_ARTIFACT_ID;
  schemaVersion: typeof SHARED_AUTHORITY_SOCIAL_RENEWAL_SCHEMA_VERSION;
  generatedAt: string;
  reflectionId: string;
  compositionPurpose: string;
  reflectionSequence: SharedAuthoritySocialRenewalDomainIdV1[];
  domains: SharedAuthoritySocialRenewalDomainV1[];
  tensions: SharedAuthoritySocialRenewalTensionV1[];
  prioritizedBadgeIds: string[];
  candidateBadgeCount: number;
  deprioritizedCandidateCount: number;
  authority: SharedAuthoritySocialRenewalAuthorityV1;
};

const AUTHORITY: SharedAuthoritySocialRenewalAuthorityV1 = {
  assistant_answer: false,
  raw_content_included: false,
  terminal_eligible: false,
  context_role: "tool_policy",
  ask_context_policy: "evidence_only",
  agent_executable: false,
  diagnostic_only: true,
  no_moral_verdict: true,
  no_character_identity_claim: true,
  no_legitimacy_inference: true,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

export function buildSharedAuthoritySocialRenewalReflectionV1(
  input: Omit<SharedAuthoritySocialRenewalReflectionV1, "artifactId" | "schemaVersion" | "authority">,
): SharedAuthoritySocialRenewalReflectionV1 {
  return {
    artifactId: SHARED_AUTHORITY_SOCIAL_RENEWAL_ARTIFACT_ID,
    schemaVersion: SHARED_AUTHORITY_SOCIAL_RENEWAL_SCHEMA_VERSION,
    ...input,
    authority: { ...AUTHORITY },
  };
}

export function validateSharedAuthoritySocialRenewalReflectionV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["Shared Authority and Social Renewal reflection must be an object"];
  if (value.artifactId !== SHARED_AUTHORITY_SOCIAL_RENEWAL_ARTIFACT_ID) issues.push("artifactId is invalid");
  if (value.schemaVersion !== SHARED_AUTHORITY_SOCIAL_RENEWAL_SCHEMA_VERSION) issues.push("schemaVersion is invalid");
  if (!isNonEmptyString(value.generatedAt)) issues.push("generatedAt must be a non-empty string");
  if (!isNonEmptyString(value.reflectionId)) issues.push("reflectionId must be a non-empty string");
  if (!isNonEmptyString(value.compositionPurpose)) issues.push("compositionPurpose must be a non-empty string");
  if (!Array.isArray(value.reflectionSequence) || value.reflectionSequence.length !== SHARED_AUTHORITY_SOCIAL_RENEWAL_DOMAIN_IDS.length) {
    issues.push("reflectionSequence must contain all social-renewal domains");
  } else if (
    value.reflectionSequence.some((id, index) => id !== SHARED_AUTHORITY_SOCIAL_RENEWAL_DOMAIN_IDS[index])
  ) {
    issues.push("reflectionSequence must preserve the social-renewal domain order");
  }
  if (!Array.isArray(value.domains) || value.domains.length !== SHARED_AUTHORITY_SOCIAL_RENEWAL_DOMAIN_IDS.length) {
    issues.push("domains must contain all social-renewal domains");
  } else {
    const ids = value.domains.map((entry) => isRecord(entry) ? entry.id : undefined);
    if (new Set(ids).size !== SHARED_AUTHORITY_SOCIAL_RENEWAL_DOMAIN_IDS.length) {
      issues.push("domains must have unique ids");
    }
    value.domains.forEach((domain, index) => {
      if (!isRecord(domain)) {
        issues.push(`domains[${index}] must be an object`);
        return;
      }
      if (!SHARED_AUTHORITY_SOCIAL_RENEWAL_DOMAIN_IDS.includes(domain.id as SharedAuthoritySocialRenewalDomainIdV1)) {
        issues.push(`domains[${index}].id is invalid`);
      }
      if (!isNonEmptyString(domain.question)) issues.push(`domains[${index}].question must be non-empty`);
      if (!isNonEmptyString(domain.primaryBadgeId)) issues.push(`domains[${index}].primaryBadgeId must be non-empty`);
      if (!isStringArray(domain.supportingBadgeIds)) issues.push(`domains[${index}].supportingBadgeIds must be strings`);
      if (!isStringArray(domain.evidenceNodeIds)) issues.push(`domains[${index}].evidenceNodeIds must be strings`);
      if (!isStringArray(domain.missingEvidence)) issues.push(`domains[${index}].missingEvidence must be strings`);
      if (domain.status !== "in_scope" && domain.status !== "unresolved") issues.push(`domains[${index}].status is invalid`);
    });
  }
  if (!Array.isArray(value.tensions) || value.tensions.length !== SHARED_AUTHORITY_SOCIAL_RENEWAL_TENSION_IDS.length) {
    issues.push("tensions must contain all social-renewal tensions");
  } else {
    const ids = value.tensions.map((entry) => isRecord(entry) ? entry.id : undefined);
    if (new Set(ids).size !== SHARED_AUTHORITY_SOCIAL_RENEWAL_TENSION_IDS.length) {
      issues.push("tensions must have unique ids");
    }
    value.tensions.forEach((tension, index) => {
      if (!isRecord(tension)) {
        issues.push(`tensions[${index}] must be an object`);
        return;
      }
      if (!SHARED_AUTHORITY_SOCIAL_RENEWAL_TENSION_IDS.includes(tension.id as SharedAuthoritySocialRenewalTensionIdV1)) {
        issues.push(`tensions[${index}].id is invalid`);
      }
      if (!isNonEmptyString(tension.question)) issues.push(`tensions[${index}].question must be non-empty`);
      if (!isStringArray(tension.relevantBadgeIds)) issues.push(`tensions[${index}].relevantBadgeIds must be strings`);
      if (tension.status !== "in_scope" && tension.status !== "unresolved") {
        issues.push(`tensions[${index}].status is invalid`);
      }
    });
  }
  if (!isStringArray(value.prioritizedBadgeIds)) issues.push("prioritizedBadgeIds must be strings");
  for (const field of ["candidateBadgeCount", "deprioritizedCandidateCount"] as const) {
    if (!Number.isInteger(value[field]) || (value[field] as number) < 0) issues.push(`${field} must be a non-negative integer`);
  }
  if (!isRecord(value.authority)) {
    issues.push("authority must be an object");
  } else {
    for (const field of ["assistant_answer", "raw_content_included", "terminal_eligible", "agent_executable"] as const) {
      if (value.authority[field] !== false) issues.push(`authority.${field} must be false`);
    }
    for (const field of ["diagnostic_only", "no_moral_verdict", "no_character_identity_claim", "no_legitimacy_inference"] as const) {
      if (value.authority[field] !== true) issues.push(`authority.${field} must be true`);
    }
    if (value.authority.context_role !== "tool_policy") issues.push("authority.context_role must be tool_policy");
    if (value.authority.ask_context_policy !== "evidence_only") issues.push("authority.ask_context_policy must be evidence_only");
  }
  return issues;
}
