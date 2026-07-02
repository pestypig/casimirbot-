import {
  buildCharacterSituationComparisonV1,
  type CharacterDecisionRuleV1,
  type CharacterIdealProfileBadgeWeightV1,
  type CharacterIdealProfileV1,
  type CharacterSituationActivationV1,
  type CharacterSituationComparisonV1,
} from "../character-situation-comparison";
import type { FruitionResultPostureV1 } from "../fruition-procedure-expression";
import type { IdeologyContextReflectionInputKindV1 } from "../ideology-context-reflection";
import type {
  MoralBadgeComparisonPostureV1,
  MoralBadgeLocationV1,
  MoralBadgeLocatorV1,
} from "../moral-badge-locator";
import { buildFruitionFromMoralBadgeComparisonSeed } from "./build-fruition-from-moral-badge-comparison-seed";
import type { IdeologyGraph } from "./ideology-graph-types";
import { locateMoralBadges } from "./locate-moral-badges";

export type CompareCharacterSituationInput = {
  graph: IdeologyGraph;
  profile: CharacterIdealProfileV1;
  situationText: string;
  inputKind?: IdeologyContextReflectionInputKindV1;
  refs?: string[];
  generatedAt?: string;
  comparisonId?: string;
};

function comparisonId(characterId: string): string {
  return `character-situation:${characterId}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, " ");
}

function countTermMatches(text: string, terms: string[]): number {
  return terms.reduce((count, term) => {
    const normalizedTerm = normalize(term).trim();
    if (normalizedTerm.length === 0) return count;
    return text.includes(normalizedTerm) ? count + 1 : count;
  }, 0);
}

function matchRules(profile: CharacterIdealProfileV1, situationText: string): Array<CharacterDecisionRuleV1 & { confidence: number }> {
  const text = normalize(situationText);
  return profile.proceduralDecisionRules
    .map((rule) => {
      const matches = countTermMatches(text, rule.matchTerms);
      const confidence = matches === 0 ? 0 : Math.min(1, 0.45 + matches * 0.18);
      return { ...rule, confidence };
    })
    .filter((rule) => rule.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence || b.activates.length - a.activates.length || a.id.localeCompare(b.id));
}

function posturePriority(posture: MoralBadgeComparisonPostureV1): number {
  if (posture === "blocked_or_missing_check") return 4;
  if (posture === "requires_check") return 3;
  if (posture === "constrained_action_posture") return 2;
  return 1;
}

function dominantPosture(rules: Array<CharacterDecisionRuleV1 & { confidence: number }>): MoralBadgeComparisonPostureV1 {
  if (rules.length === 0) return "blocked_or_missing_check";
  return [...rules].sort(
    (a, b) => posturePriority(b.posture) - posturePriority(a.posture) || b.confidence - a.confidence,
  )[0].posture;
}

function mapPostureToFruition(posture: MoralBadgeComparisonPostureV1): FruitionResultPostureV1 {
  if (posture === "blocked_or_missing_check") return "ask_for_clarification";
  if (posture === "requires_check") return "requires_review";
  return "diagnostic_only";
}

function profileWeightsById(profile: CharacterIdealProfileV1): Map<string, CharacterIdealProfileBadgeWeightV1> {
  return new Map(
    [...profile.moralBadgeWeights, ...profile.characterSpecificBadges].map((weight) => [weight.nodeId, weight]),
  );
}

function allLocatedLocations(locator: MoralBadgeLocatorV1): MoralBadgeLocationV1[] {
  return [...locator.locatedBadges.exact, ...locator.locatedBadges.likely, ...locator.locatedBadges.inferred];
}

function relationForWeight(weight: CharacterIdealProfileBadgeWeightV1): CharacterSituationActivationV1["relation"] {
  if (weight.operator === "blocks") return "tensions";
  if (weight.operator === "balances" || weight.nodeId.includes("counterweight")) return "counterweighted";
  if (weight.operator === "requires") return "missing";
  return "aligns";
}

function buildActivations(
  profile: CharacterIdealProfileV1,
  locator: MoralBadgeLocatorV1,
  rules: Array<CharacterDecisionRuleV1 & { confidence: number }>,
): CharacterSituationActivationV1[] {
  const weights = profileWeightsById(profile);
  const graphConfidences = new Map<string, number>();
  for (const location of allLocatedLocations(locator)) {
    graphConfidences.set(location.nodeId, Math.max(graphConfidences.get(location.nodeId) ?? 0, location.confidence));
  }
  for (const rule of rules) {
    for (const nodeId of rule.activates) {
      graphConfidences.set(nodeId, Math.max(graphConfidences.get(nodeId) ?? 0, rule.confidence));
    }
  }

  return [...graphConfidences.entries()]
    .map(([nodeId, graphConfidence]) => {
      const weight = weights.get(nodeId);
      if (!weight) return null;
      return {
        nodeId,
        graphConfidence,
        characterWeight: weight.weight,
        relation: relationForWeight(weight),
        reason: weight.note,
      } satisfies CharacterSituationActivationV1;
    })
    .filter((entry): entry is CharacterSituationActivationV1 => entry !== null)
    .sort((a, b) => b.graphConfidence * b.characterWeight - a.graphConfidence * a.characterWeight || a.nodeId.localeCompare(b.nodeId));
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function buildHypothesis(rules: Array<CharacterDecisionRuleV1 & { confidence: number }>) {
  const primary = rules[0];
  if (!primary) {
    return {
      likelyChoice: "Insufficient character-profile activation; ask for more situation detail before making a behavioral hypothesis.",
      likelySpeechStyle: ["diagnostic", "bounded"],
      likelyInnerConflict: ["missing situation archetype"],
      missingEvidence: ["situation_class", "activated_principles", "source_anchor"],
    };
  }
  return {
    likelyChoice: primary.likelyChoice,
    likelySpeechStyle: uniqueStrings(rules.flatMap((rule) => rule.likelySpeechStyle)).slice(0, 5),
    likelyInnerConflict: uniqueStrings(rules.flatMap((rule) => rule.likelyInnerConflict)).slice(0, 5),
    missingEvidence: uniqueStrings(rules.flatMap((rule) => rule.missingEvidence)).slice(0, 8),
  };
}

function enrichedLocatorText(situationText: string, rules: Array<CharacterDecisionRuleV1 & { confidence: number }>): string {
  const activatedGenericNodes = uniqueStrings(
    rules
      .flatMap((rule) => rule.activates)
      .filter((nodeId) => nodeId.includes("-and-") || nodeId === "direct-observation-before-claim"),
  );
  if (activatedGenericNodes.length === 0) return situationText;
  return `${situationText}\nActivated Moral badge ids: ${activatedGenericNodes.join(", ")}.`;
}

function overrideLocatorPosture(
  locator: MoralBadgeLocatorV1,
  rules: Array<CharacterDecisionRuleV1 & { confidence: number }>,
): MoralBadgeLocatorV1 {
  const posture = dominantPosture(rules);
  const ruleExpression = rules
    .map((rule) => `${rule.id} activates ${rule.activates.join("+")} => ${rule.posture}`)
    .join(" ; ");
  return {
    ...locator,
    comparisonSeed: {
      selectedNodeIds: uniqueStrings([
        ...locator.comparisonSeed.selectedNodeIds,
        ...rules.flatMap((rule) => rule.activates),
      ]),
      proceduralExpression: [locator.comparisonSeed.proceduralExpression, ruleExpression]
        .filter((value) => value.trim().length > 0)
        .join(" ; "),
      expectedFruitionPosture: posture,
      reasonCodes: uniqueStrings([
        ...locator.comparisonSeed.reasonCodes,
        "character_profile_overlay",
        ...rules.map((rule) => `matched:${rule.id}`),
      ]),
    },
  };
}

export function compareCharacterSituation(input: CompareCharacterSituationInput): CharacterSituationComparisonV1 {
  const rules = matchRules(input.profile, input.situationText);
  const locator = overrideLocatorPosture(
    locateMoralBadges(input.graph, {
      kind: input.inputKind ?? "user_prompt",
      text: enrichedLocatorText(input.situationText, rules),
      summary: input.situationText,
      refs: input.refs,
      generatedAt: input.generatedAt,
      locatorId: input.comparisonId ? `moral-badge-locator:${input.comparisonId}` : undefined,
    }),
    rules,
  );
  const fruition = buildFruitionFromMoralBadgeComparisonSeed({
    locator,
    objective: `Compare ${input.profile.character.displayName} against a situation prompt.`,
    refs: input.refs,
    generatedAt: input.generatedAt,
    expressionId: input.comparisonId ? `fruition:${input.comparisonId}` : undefined,
  });
  const posture = dominantPosture(rules);

  return buildCharacterSituationComparisonV1({
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    comparisonId: input.comparisonId ?? comparisonId(input.profile.character.id),
    characterId: input.profile.character.id,
    situationText: input.situationText,
    locator,
    fruition,
    activatedProfileWeights: buildActivations(input.profile, locator, rules),
    matchedRules: rules.map((rule) => ({
      id: rule.id,
      posture: rule.posture,
      confidence: rule.confidence,
      risks: rule.risks,
    })),
    predictedPosture: mapPostureToFruition(posture),
    behavioralHypothesis: buildHypothesis(rules),
  });
}
