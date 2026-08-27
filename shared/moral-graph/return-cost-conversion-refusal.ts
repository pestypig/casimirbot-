import {
  buildReturnCostConversionRefusalReflectionV1,
  type ReturnCostConversionRefusalCheckV1,
  type ReturnCostConversionRefusalPositionIdV1,
  type ReturnCostConversionRefusalPositionV1,
  type ReturnCostConversionRefusalReflectionV1,
} from "../contracts/return-cost-conversion-refusal.v1";
import type { MoralBadgeLocatorV1, MoralBadgeLocationV1 } from "../moral-badge-locator";
import { getMoralWisdomPrinciple } from "./wisdom-principles";

type PositionDefinition = {
  id: ReturnCostConversionRefusalPositionIdV1;
  question: string;
  primaryBadgeId: string;
  supportingBadgeIds: string[];
};

const POSITION_DEFINITIONS: readonly PositionDefinition[] = [
  {
    id: "return",
    question: "What protected good gives the action its purpose, and does the protected person retain agency within it?",
    primaryBadgeId: "protection-without-possession",
    supportingBadgeIds: ["non-harm-and-compassionate-constraint", "love-without-projection"],
  },
  {
    id: "cost",
    question: "Who bears the material danger, labor, exclusion, uncertainty, or sacrifice required by the action?",
    primaryBadgeId: "cost-to-power-conversion-ledger",
    supportingBadgeIds: ["stewardship-ledger", "restorative-harm-repair"],
  },
  {
    id: "conversion",
    question: "Who receives victory, reputation, access, legitimacy, wealth, or authority converted from those costs?",
    primaryBadgeId: "cost-to-power-conversion-ledger",
    supportingBadgeIds: ["reciprocity-contract", "adherence-legitimacy-separation"],
  },
  {
    id: "refusal",
    question: "Who can dissent, redefine their role, pursue an independent purpose, or leave, and what follows if they do?",
    primaryBadgeId: "autonomy-proven-equality",
    supportingBadgeIds: ["voice-exit-contestability", "participation-consent-separation"],
  },
] as const;

const CHECK_DEFINITIONS: readonly Omit<ReturnCostConversionRefusalCheckV1, "status">[] = [
  {
    id: "protected_good_served",
    question: "Is the protected good actually served by the action rather than merely invoked?",
    relevantBadgeIds: ["protection-without-possession"],
  },
  {
    id: "protected_party_retains_agency",
    question: "Does the protected person retain voice, choice, decision access, and contestability?",
    relevantBadgeIds: ["protection-without-possession", "voice-exit-contestability"],
  },
  {
    id: "costs_visible_and_reciprocally_accounted",
    question: "Are costs visible, consent-bounded where possible, and reciprocally accounted to those who bear them?",
    relevantBadgeIds: ["cost-to-power-conversion-ledger", "reciprocity-contract"],
  },
  {
    id: "symbolic_devotion_not_consent",
    question: "Has symbolic devotion, service, or preciousness been kept separate from consent and personhood?",
    relevantBadgeIds: ["protection-without-possession", "participation-consent-separation", "love-without-projection"],
  },
  {
    id: "survivable_refusal_and_exit",
    question: "Can participants refuse or leave without being reduced to traitors, failures, or disposable obstacles?",
    relevantBadgeIds: ["autonomy-proven-equality", "voice-exit-contestability"],
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

function positionFromDefinition(
  definition: PositionDefinition,
  locatedNodeIds: Set<string>,
): ReturnCostConversionRefusalPositionV1 {
  const relevantIds = [definition.primaryBadgeId, ...definition.supportingBadgeIds];
  const evidenceNodeIds = relevantIds.filter((id) => locatedNodeIds.has(id));
  const principle = getMoralWisdomPrinciple(definition.primaryBadgeId);
  return {
    ...definition,
    activated: evidenceNodeIds.length > 0,
    evidenceNodeIds,
    // A thematic match identifies what to ask; it never proves these facts are present.
    missingEvidence: principle?.evidenceNeeds ?? [],
  };
}

export function buildReturnCostConversionRefusalFromLocatorV1(
  locator: MoralBadgeLocatorV1,
  options: { reflectionId: string; generatedAt?: string },
): ReturnCostConversionRefusalReflectionV1 {
  const locatedNodeIds = new Set(locations(locator).map((location) => location.nodeId));
  const positions = POSITION_DEFINITIONS.map((definition) => positionFromDefinition(definition, locatedNodeIds));
  const selectedBadgeIds = unique(
    positions.flatMap((position) => position.evidenceNodeIds).filter((id) => getMoralWisdomPrinciple(id) !== undefined),
  );
  const checks: ReturnCostConversionRefusalCheckV1[] = CHECK_DEFINITIONS.map((check) => ({
    ...check,
    status: check.relevantBadgeIds.some((id) => locatedNodeIds.has(id)) ? "in_scope" : "unresolved",
  }));

  return buildReturnCostConversionRefusalReflectionV1({
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    reflectionId: options.reflectionId,
    positions,
    checks,
    selectedBadgeIds,
  });
}
