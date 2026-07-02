import {
  buildHelixRecommendedActionAdmissionV1,
  type HelixRecommendedActionAdmissionV1,
} from "../contracts/helix-recommended-action-admission.v1";
import {
  buildFruitionProcedureExpressionV1,
  type FruitionOperatorKindV1,
  type FruitionProceduralOperatorV1,
  type FruitionProceduralRoleV1,
  type FruitionProcedureExpressionV1,
  type FruitionProcedureTermV1,
  type FruitionResultPostureV1,
  type FruitionTermKindV1,
  type FruitionTermPolarityV1,
} from "../fruition-procedure-expression";
import type {
  MoralBadgeComparisonPostureV1,
  MoralBadgeLocationV1,
  MoralBadgeLocatorV1,
} from "../moral-badge-locator";

export type BuildFruitionFromMoralBadgeComparisonSeedInput = {
  locator: MoralBadgeLocatorV1;
  objective?: string;
  refs?: string[];
  generatedAt?: string;
  expressionId?: string;
};

function termId(prefix: string, id: string): string {
  return `fruition.seed.${prefix}.${id.replace(/[^a-z0-9_-]+/gi, "_")}`;
}

function uniqueLocations(locator: MoralBadgeLocatorV1): MoralBadgeLocationV1[] {
  const selected = new Set(locator.comparisonSeed.selectedNodeIds);
  const candidates = [
    ...locator.locatedBadges.exact,
    ...locator.locatedBadges.likely,
    ...locator.locatedBadges.inferred,
  ];
  const seen = new Set<string>();
  const result: MoralBadgeLocationV1[] = [];
  const ordered = [
    ...candidates.filter((location) => selected.has(location.nodeId)),
    ...candidates.filter((location) => !selected.has(location.nodeId)),
  ];

  for (const location of ordered) {
    if (seen.has(location.nodeId)) continue;
    seen.add(location.nodeId);
    result.push(location);
  }

  return result;
}

function mapSeedPostureToFruition(posture: MoralBadgeComparisonPostureV1): FruitionResultPostureV1 {
  if (posture === "requires_check") return "requires_review";
  if (posture === "blocked_or_missing_check") return "ask_for_clarification";
  return "diagnostic_only";
}

function polarityFromSeedPosture(posture: MoralBadgeComparisonPostureV1): FruitionTermPolarityV1 {
  if (posture === "requires_check" || posture === "blocked_or_missing_check") return "requires";
  if (posture === "constrained_action_posture") return "constrains";
  return "supports";
}

function operatorFromSeedPosture(posture: MoralBadgeComparisonPostureV1): FruitionProceduralOperatorV1 {
  if (posture === "requires_check" || posture === "blocked_or_missing_check") return "requires";
  if (posture === "constrained_action_posture") return "constrains";
  return "supports";
}

function operatorKindFromSeedPosture(posture: MoralBadgeComparisonPostureV1): FruitionOperatorKindV1 {
  if (posture === "requires_check" || posture === "blocked_or_missing_check") return "requires";
  if (posture === "constrained_action_posture") return "constrains";
  return "supports";
}

function roleFromLocation(location: MoralBadgeLocationV1, posture: MoralBadgeComparisonPostureV1): FruitionProceduralRoleV1 {
  const tags = (location.tags ?? []).map((tag) => tag.toLowerCase());
  if (tags.some((tag) => tag.includes("gate") || tag.includes("safeguard"))) return "action_gate";
  if (tags.some((tag) => tag.includes("objective_view") || tag.includes("mission"))) return "objective_view";
  if (tags.some((tag) => tag.includes("balance") || tag.includes("yin") || tag.includes("yang"))) return "balancer";
  if (posture === "requires_check" || posture === "blocked_or_missing_check") return "evidence_requirement";
  if (posture === "constrained_action_posture") return "constraint";
  return "lens";
}

function kindFromLocation(location: MoralBadgeLocationV1): FruitionTermKindV1 {
  if (location.matchType === "outer_edge_inference") return "trait";
  if ((location.tags ?? []).some((tag) => /gate|safeguard/i.test(tag))) return "action_gate";
  return "lens";
}

function labelForPosture(posture: FruitionResultPostureV1): string {
  if (posture === "ask_for_clarification") return "Procedure asks for missing checks";
  if (posture === "requires_review") return "Procedure requires review before action";
  return "Diagnostic procedure only";
}

function buildSeedAdmission(locator: MoralBadgeLocatorV1, refs: string[], generatedAt?: string): HelixRecommendedActionAdmissionV1 {
  const missing = locator.comparisonSeed.expectedFruitionPosture === "blocked_or_missing_check"
    ? ["missing_check"]
    : [];
  return buildHelixRecommendedActionAdmissionV1({
    generatedAt,
    admissionId: `fruition-seed-admission:${locator.locatorId}`,
    prompt: locator.input.summary,
    sourceReceiptId: locator.locatorId,
    source: {
      workstation: "moral-graph",
      panelId: "fruition-calculator",
      tool: "moral-badge-locator",
      artifact_type: "moral_badge_locator",
      artifact_id: locator.locatorId,
    },
    actions: [
      {
        actionId: "load_locator_seed_to_fruition",
        panelId: "fruition-calculator",
        label: "Load locator seed into Fruition",
        mutatesCalculator: false,
        solves: false,
        objectiveFit: "high",
        risk: "claim_sensitive",
        admission: missing.length > 0 ? "ask_user" : "auto",
        requiresConfirmation: missing.length > 0,
        agentExecutable: false,
        reason: "Moral badge locator seed can be displayed as diagnostic Fruition evidence only.",
        reasonCode: missing.length > 0 ? "missing_evidence" : "diagnostic_only_not_executable",
        source: {
          workstation: "moral-graph",
          panelId: "fruition-calculator",
          artifact_type: "moral_badge_locator",
          artifact_id: locator.locatorId,
        },
        display_policy: "diagnostic_only",
        evidenceRefs: refs,
        evidenceRequirements: missing.length > 0 ? { missing } : undefined,
        reasonCodes: ["moral_badge_locator_seed", "evidence_only_authority"],
      },
    ],
    evidenceRefs: refs,
    evidenceRequirements: missing.length > 0 ? { missing } : undefined,
    reasonCodes: ["moral_badge_locator_seed", "diagnostic_overlay_only", "evidence_only_authority"],
  });
}

export function buildFruitionFromMoralBadgeComparisonSeed(
  input: BuildFruitionFromMoralBadgeComparisonSeedInput,
): FruitionProcedureExpressionV1 {
  const locator = input.locator;
  const seed = locator.comparisonSeed;
  const refs = input.refs ?? locator.input.refs ?? [];
  const posture = mapSeedPostureToFruition(seed.expectedFruitionPosture);
  const resultTermId = "fruition.seed.result.procedural_posture";
  const locations = uniqueLocations(locator);
  const terms: FruitionProcedureTermV1[] = [
    ...locations.map((location) => {
      const polarity = polarityFromSeedPosture(seed.expectedFruitionPosture);
      return {
        id: termId("badge", location.nodeId),
        kind: kindFromLocation(location),
        label: location.label,
        polarity,
        confidence: location.confidence,
        proceduralRole: roleFromLocation(location, seed.expectedFruitionPosture),
        procedureOperator: operatorFromSeedPosture(seed.expectedFruitionPosture),
        actionEffect: location.proceduralExpression,
        evidenceNeeds:
          seed.expectedFruitionPosture === "requires_check" ||
          seed.expectedFruitionPosture === "blocked_or_missing_check"
            ? ["required_check"]
            : undefined,
        refusesAuthority: ["final_answer", "execution_authority", "character_verdict"],
        sourceNodeIds: [location.nodeId],
        evidenceRefs: refs,
        reasonCodes: location.reasonCodes,
      };
    }),
    {
      id: resultTermId,
      kind: "authority_boundary",
      label: "Procedural posture result",
      polarity: "constrains",
      confidence: 1,
      proceduralRole: "objective_view",
      procedureOperator: "routes_to",
      actionEffect: "Express the locator comparison seed as a diagnostic Fruition posture.",
      refusesAuthority: ["execution_authority", "moral_finality", "character_verdict"],
      evidenceRefs: refs,
      reasonCodes: ["locator_seed_result"],
    },
  ];
  const badgeTermIds = terms.filter((term) => term.id !== resultTermId).map((term) => term.id);
  const operators = [
    {
      id: "fruition.operator.locator_seed_composes_posture",
      kind: operatorKindFromSeedPosture(seed.expectedFruitionPosture),
      fromTermIds: badgeTermIds.length > 0 ? badgeTermIds : [resultTermId],
      toTermIds: [resultTermId],
      label: "Locator comparison seed composes procedural posture",
      rationale:
        "Located Moral badges provide evidence-only procedural context; they do not decide execution or moral finality.",
    },
  ];
  const missingEvidence = seed.expectedFruitionPosture === "blocked_or_missing_check" ? ["missing_check"] : [];

  return buildFruitionProcedureExpressionV1({
    generatedAt: input.generatedAt,
    expressionId: input.expressionId,
    sourceReflectionId: locator.locatorId,
    inputs: {
      ...(input.objective ? { objective: input.objective } : {}),
      inputKind: locator.input.kind,
      summary: locator.input.summary,
      ...(refs.length > 0 ? { refs } : {}),
    },
    terms,
    operators,
    expression: seed.proceduralExpression,
    result: {
      posture,
      label: labelForPosture(posture),
      recommendedActionIds: [],
      missingEvidence,
      admission: buildSeedAdmission(locator, refs, input.generatedAt),
      agentExecutable: false,
    },
  });
}
