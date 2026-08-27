import {
  buildSharedAuthoritySocialRenewalReflectionV1,
  SHARED_AUTHORITY_SOCIAL_RENEWAL_DOMAIN_IDS,
  type SharedAuthoritySocialRenewalDomainIdV1,
  type SharedAuthoritySocialRenewalDomainV1,
  type SharedAuthoritySocialRenewalReflectionV1,
  type SharedAuthoritySocialRenewalTensionV1,
} from "../contracts/shared-authority-social-renewal.v1";
import type { MoralBadgeLocatorV1, MoralBadgeLocationV1 } from "../moral-badge-locator";

type DomainDefinition = Omit<SharedAuthoritySocialRenewalDomainV1, "status" | "evidenceNodeIds">;

const DOMAIN_DEFINITIONS: readonly DomainDefinition[] = [
  {
    id: "competence_and_mandate",
    question: "What demonstrated competence justifies authority, within which domain, and under what bounded mandate?",
    primaryBadgeId: "leadership-as-capacity-transfer",
    supportingBadgeIds: ["mandate-bounded-hierarchy", "specialization-without-caste"],
    missingEvidence: ["originating_expertise", "demonstrated_competence", "mandate_scope", "review_trigger"],
  },
  {
    id: "inherited_continuity_and_constraint",
    question: "What continuity or legitimacy is inherited, and what personal or institutional constraints accompany it?",
    primaryBadgeId: "inherited-order-participation",
    supportingBadgeIds: ["adherence-legitimacy-separation", "leadership-as-capacity-transfer"],
    missingEvidence: ["inherited_role", "continuity_value", "legitimacy_basis", "personal_constraints", "present_chosen_position"],
  },
  {
    id: "situated_knowledge_plurality",
    question: "What distinct situated knowledge does each participant possess, and where are its domain limits?",
    primaryBadgeId: "domain-bounded-accountability",
    supportingBadgeIds: ["leadership-as-capacity-transfer", "coordination-pluralism"],
    missingEvidence: ["participant_knowledge_domains", "experience_sources", "knowledge_limits", "translation_path"],
  },
  {
    id: "shared_governance_and_decision_rights",
    question: "How are distinct forms of knowledge represented in shared decisions as competence develops?",
    primaryBadgeId: "leadership-as-capacity-transfer",
    supportingBadgeIds: ["autonomy-proven-equality", "mandate-bounded-hierarchy"],
    missingEvidence: ["decision_domains", "decision_access", "competence_to_decision_rights", "joint_review_path"],
  },
  {
    id: "protected_person_agency",
    question: "Does the person invoked as the protected future possess agency over that future?",
    primaryBadgeId: "protection-without-possession",
    supportingBadgeIds: ["agency-preserving-disclosure", "voice-exit-contestability"],
    missingEvidence: ["protected_good", "protected_party", "affected_agency", "decision_access", "contestability_and_exit"],
  },
  {
    id: "cost_and_instrumentalization",
    question: "Who bears the costs, who receives the resulting authority, and is anyone being made material for another objective?",
    primaryBadgeId: "cost-to-power-conversion-ledger",
    supportingBadgeIds: ["protection-without-possession", "participation-consent-separation"],
    missingEvidence: ["cost_bearers", "burden_map", "beneficiary", "converted_value", "instrumentalization_risk", "reciprocal_return"],
  },
  {
    id: "leadership_lifecycle_and_succession",
    question: "Which leadership lifecycle stage is active, and can the shared purpose survive weakness, error, absence, or succession?",
    primaryBadgeId: "leadership-as-capacity-transfer",
    supportingBadgeIds: ["impermanence-entropy-and-revision", "transformation-window-stewardship"],
    missingEvidence: ["leadership_lifecycle_stage", "renewal_trigger", "succession_path", "mission_continuity_without_leader"],
  },
  {
    id: "role_projection_and_personhood",
    question: "Can each person become more complicated than the role through which they are valued or desired?",
    primaryBadgeId: "love-without-projection",
    supportingBadgeIds: ["protection-without-possession", "identity-view-and-non-attachment"],
    missingEvidence: ["assigned_roles", "observed_personhood", "named_projections", "consent_boundaries", "revision_trigger"],
  },
  {
    id: "dissent_and_separation",
    question: "Can disagreement, role revision, independent purpose, or separation occur without becoming betrayal?",
    primaryBadgeId: "autonomy-proven-equality",
    supportingBadgeIds: ["voice-exit-contestability", "love-without-projection"],
    missingEvidence: ["independent_purpose", "dissent_path", "feasible_exit", "retaliation_risk", "post_refusal_relationship"],
  },
  {
    id: "social_renewal_test",
    question: "Does the transition enlarge shared authorship, or merely replace the people who possess unanswerable power?",
    primaryBadgeId: "leadership-as-capacity-transfer",
    supportingBadgeIds: ["impermanence-by-design", "cost-to-power-conversion-ledger", "transformation-window-stewardship"],
    missingEvidence: ["authority_before_and_after", "authorship_distribution", "institutional_changes", "contestability_change", "succession_effect"],
  },
] as const;

const TENSION_DEFINITIONS: readonly Omit<SharedAuthoritySocialRenewalTensionV1, "status">[] = [
  {
    id: "earned_expertise_vs_exclusive_sovereignty",
    question: "Is earned expertise remaining domain-bounded, or becoming a claim to exclusive sovereignty?",
    relevantBadgeIds: ["leadership-as-capacity-transfer", "mandate-bounded-hierarchy"],
  },
  {
    id: "inherited_continuity_vs_personal_constraint",
    question: "Does inherited continuity preserve a shared good while restricting the person who embodies it?",
    relevantBadgeIds: ["inherited-order-participation", "adherence-legitimacy-separation", "protection-without-possession"],
  },
  {
    id: "protected_future_vs_protected_person_agency",
    question: "Is a protected future being honored through the protected person's agency, or only through their symbolic value?",
    relevantBadgeIds: ["protection-without-possession", "voice-exit-contestability"],
  },
  {
    id: "shared_purpose_vs_instrumentalization",
    question: "Does the shared purpose preserve participants as authors, or convert them into costs, legitimacy, or material?",
    relevantBadgeIds: ["cost-to-power-conversion-ledger", "leadership-as-capacity-transfer"],
  },
  {
    id: "love_and_role_vs_independent_purpose",
    question: "Can affection survive the other person's contradiction of the desired role?",
    relevantBadgeIds: ["love-without-projection", "autonomy-proven-equality"],
  },
  {
    id: "renewal_vs_replacement",
    question: "Does generational change renew how authority works, or only replace its current holder?",
    relevantBadgeIds: ["leadership-as-capacity-transfer", "impermanence-by-design", "transformation-window-stewardship"],
  },
] as const;

function locations(locator: MoralBadgeLocatorV1): MoralBadgeLocationV1[] {
  return [
    ...locator.locatedBadges.exact,
    ...locator.locatedBadges.likely,
    ...locator.locatedBadges.inferred,
  ];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function buildSharedAuthoritySocialRenewalFromLocatorV1(
  locator: MoralBadgeLocatorV1,
  options: { reflectionId: string; generatedAt?: string },
): SharedAuthoritySocialRenewalReflectionV1 {
  const candidateNodeIds = new Set(locations(locator).map((location) => location.nodeId));
  const domains: SharedAuthoritySocialRenewalDomainV1[] = DOMAIN_DEFINITIONS.map((definition) => {
    const relevantIds = [definition.primaryBadgeId, ...definition.supportingBadgeIds];
    const evidenceNodeIds = relevantIds.filter((id) => candidateNodeIds.has(id));
    return {
      ...definition,
      status: evidenceNodeIds.length > 0 ? "in_scope" : "unresolved",
      evidenceNodeIds,
    };
  });
  const prioritizedBadgeIds = unique(domains.flatMap((domain) => domain.evidenceNodeIds));
  const tensions: SharedAuthoritySocialRenewalTensionV1[] = TENSION_DEFINITIONS.map((definition) => ({
    ...definition,
    status: definition.relevantBadgeIds.some((id) => candidateNodeIds.has(id)) ? "in_scope" : "unresolved",
  }));

  return buildSharedAuthoritySocialRenewalReflectionV1({
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    reflectionId: options.reflectionId,
    compositionPurpose:
      "Prioritize existing Moral Graph lenses into one evidence-only reflection on competence, legitimacy, agency, instrumentalization, development, love, and succession.",
    reflectionSequence: [...SHARED_AUTHORITY_SOCIAL_RENEWAL_DOMAIN_IDS],
    domains,
    tensions,
    prioritizedBadgeIds,
    candidateBadgeCount: candidateNodeIds.size,
    deprioritizedCandidateCount: Math.max(0, candidateNodeIds.size - prioritizedBadgeIds.length),
  });
}
