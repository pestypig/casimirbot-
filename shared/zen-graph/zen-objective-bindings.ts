import type { CharacterIdealProfileBadgeWeightV1, CharacterIdealProfileV1 } from "../character-situation-comparison";
import {
  buildZenObjectiveBindingV1,
  type ZenObjectiveBindingBadgeBindingV1,
  type ZenObjectiveBindingConstraintTypeV1,
  type ZenObjectiveBindingConstraintV1,
  type ZenObjectiveBindingMissingEvidenceV1,
  type ZenObjectiveBindingRoleV1,
  type ZenObjectiveBindingTraceStepV1,
  type ZenObjectiveBindingV1,
} from "../contracts/zen-objective-binding.v1";
import type { ZenBadgeLocationV1, ZenBadgeLocatorV1 } from "../zen-badge-locator";
import { getZenWisdomPrinciple, ZEN_WISDOM_PRINCIPLES, ZEN_WISDOM_ROOT_ID, type ZenWisdomPrinciple } from "./wisdom-principles";

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function evidenceId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function roleFromWisdomPrinciple(principle: ZenWisdomPrinciple): ZenObjectiveBindingRoleV1 {
  if (principle.proceduralRole === "constraint") return "constraint";
  if (principle.proceduralRole === "action_gate") return "action_gate";
  if (principle.proceduralRole === "balancer") return "safeguard";
  if (principle.proceduralRole === "objective_view") return "lens";
  return "core";
}

function roleFromCharacterWeight(weight: CharacterIdealProfileBadgeWeightV1): ZenObjectiveBindingRoleV1 {
  if (weight.operator === "constrains") return "constraint";
  if (weight.operator === "requires") return "action_gate";
  if (weight.operator === "balances") return "safeguard";
  if (weight.operator === "blocks") return "tension";
  if (weight.operator === "routes_to") return "lens";
  return "core";
}

function roleFromLocation(location: ZenBadgeLocationV1): ZenObjectiveBindingRoleV1 {
  const text = [location.nodeId, location.proceduralExpression, ...(location.reasonCodes ?? []), ...(location.tags ?? [])]
    .join(" ")
    .toLowerCase();
  if (location.matchType === "gate_term" || /\b(gate|approval|requires|review)\b/.test(text)) return "action_gate";
  if (/\b(non-harm|right_speech|constraint|constrains|uncertainty)\b/.test(text)) return "constraint";
  if (/\b(tension|conflict|risk|boundary)\b/.test(text)) return "tension";
  if (/\b(safeguard|guardrail|check|verification)\b/.test(text)) return "safeguard";
  return location.matchType === "outer_edge_inference" ? "lens" : "core";
}

function constraintTypeForBadgeId(badgeId: string): ZenObjectiveBindingConstraintTypeV1 {
  const normalized = badgeId.toLowerCase();
  if (normalized.includes("non-harm") || normalized.includes("harm")) return "non_harm";
  if (normalized.includes("speech")) return "right_speech";
  if (normalized.includes("consent")) return "consent_required";
  if (normalized.includes("uncertainty") || normalized.includes("revision")) return "uncertainty_required";
  if (normalized.includes("review") || normalized.includes("approval") || normalized.includes("due-process")) {
    return "review_required";
  }
  return "evidence_required";
}

function missingEvidenceFromPrinciple(principle: ZenWisdomPrinciple): ZenObjectiveBindingMissingEvidenceV1[] {
  return principle.evidenceNeeds.map((need) => ({
    id: need,
    description: `Evidence needed for ${principle.label}: ${need}.`,
    requiredFor: principle.id,
  }));
}

function constraintsFromBindings(bindings: ZenObjectiveBindingBadgeBindingV1[]): ZenObjectiveBindingConstraintV1[] {
  const constraintBindings = bindings.filter((binding) =>
    ["constraint", "safeguard", "action_gate", "tension"].includes(binding.role),
  );

  return constraintBindings.map((binding) => ({
    id: `constraint.${binding.badgeId}`,
    type: constraintTypeForBadgeId(binding.badgeId),
    label: `Constraint from ${binding.badgeId}`,
    severity: binding.role === "action_gate" ? "hard" : binding.role === "tension" ? "high" : "medium",
  }));
}

function wisdomBinding(principle: ZenWisdomPrinciple): ZenObjectiveBindingBadgeBindingV1 {
  return {
    badgeId: principle.id,
    principleId: principle.id,
    role: roleFromWisdomPrinciple(principle),
    weight: 1,
    confidence: 1,
    source: "ideology_tree",
    pathToRoot: [principle.id, ZEN_WISDOM_ROOT_ID],
  };
}

export function buildWisdomPresetObjectiveBindingV1(input?: {
  label?: string;
  refs?: string[];
  principleIds?: string[];
}): ZenObjectiveBindingV1 {
  const selectedPrinciples =
    input?.principleIds && input.principleIds.length > 0
      ? input.principleIds.map((id) => getZenWisdomPrinciple(id)).filter((entry): entry is ZenWisdomPrinciple => Boolean(entry))
      : [...ZEN_WISDOM_PRINCIPLES];
  const bindings = selectedPrinciples.map(wisdomBinding);

  return buildZenObjectiveBindingV1({
    subject: {
      kind: "wisdom_preset",
      label: input?.label ?? "Zen wisdom preset",
      refs: input?.refs ?? ["docs/ethos/ideology.json"],
    },
    objectiveState: {
      id: "zen.wisdom.objective_state",
      label: "Wisdom objective state",
      description: "Procedural first-principle binding over the Zen badge graph.",
    },
    bindings,
    constraints: constraintsFromBindings(bindings),
    trace: [
      {
        step: "resolve_wisdom_preset",
        nodeIds: selectedPrinciples.map((principle) => principle.id),
        badgeIds: bindings.map((binding) => binding.badgeId),
        reason: "Wisdom preset resolves directly from ZEN_WISDOM_PRINCIPLES into ZenObjectiveBindingV1.",
      },
    ],
    missingEvidence: selectedPrinciples.flatMap(missingEvidenceFromPrinciple),
  });
}

function characterWeightBinding(weight: CharacterIdealProfileBadgeWeightV1): ZenObjectiveBindingBadgeBindingV1 {
  const principle = getZenWisdomPrinciple(weight.nodeId);
  return {
    badgeId: weight.nodeId,
    principleId: principle?.id,
    role: roleFromCharacterWeight(weight),
    weight: clampUnit(weight.weight),
    confidence: principle ? 0.9 : 0.72,
    source: "preset",
    pathToRoot: principle ? [principle.id, ZEN_WISDOM_ROOT_ID] : [weight.nodeId],
  };
}

export function buildCharacterPresetObjectiveBindingV1(profile: CharacterIdealProfileV1): ZenObjectiveBindingV1 {
  const weights = [...profile.zenBadgeWeights, ...profile.characterSpecificBadges];
  const bindings = weights.map(characterWeightBinding);
  const ruleEvidence = profile.proceduralDecisionRules.flatMap((rule) =>
    rule.missingEvidence.map((missing) => ({
      id: missing,
      description: `Missing evidence for ${profile.character.displayName} preset rule ${rule.id}: ${missing}.`,
      requiredFor: rule.id,
    })),
  );

  return buildZenObjectiveBindingV1({
    subject: {
      kind: "character_preset",
      label: profile.character.displayName,
      refs: [profile.character.id, profile.character.series],
    },
    objectiveState: {
      id: `${profile.character.id}.objective_state`,
      label: `${profile.character.displayName} character perspective preset`,
      description: "Named character preset resolved as weighted bindings over the same Zen badge graph.",
    },
    bindings,
    constraints: constraintsFromBindings(bindings),
    trace: [
      {
        step: "resolve_character_preset",
        nodeIds: weights.map((weight) => weight.nodeId),
        badgeIds: bindings.map((binding) => binding.badgeId),
        reason: "Character perspective is represented as a named preset over ZenObjectiveBindingV1, not a separate graph.",
      },
    ],
    missingEvidence: ruleEvidence,
  });
}

function allLocations(locator: ZenBadgeLocatorV1): ZenBadgeLocationV1[] {
  return [
    ...locator.locatedBadges.exact,
    ...locator.locatedBadges.likely,
    ...locator.locatedBadges.inferred,
  ];
}

function sourceFromLocation(location: ZenBadgeLocationV1): ZenObjectiveBindingBadgeBindingV1["source"] {
  if (location.matchType === "node_id" || location.matchType === "label") return "exact";
  if (location.matchType === "outer_edge_inference" || location.matchType === "keyword_overlap") return "inferred";
  return "ideology_tree";
}

export function buildSituationObjectiveBindingFromLocatorV1(locator: ZenBadgeLocatorV1): ZenObjectiveBindingV1 {
  const locations = allLocations(locator);
  const bindings: ZenObjectiveBindingBadgeBindingV1[] = locations.map((location) => ({
    badgeId: location.nodeId,
    principleId: getZenWisdomPrinciple(location.nodeId)?.id,
    role: roleFromLocation(location),
    weight: clampUnit(location.confidence),
    confidence: clampUnit(location.confidence),
    source: sourceFromLocation(location),
    pathToRoot: location.pathToBinding,
  }));
  const missingEvidence = unique([
    ...locator.comparisonSeed.reasonCodes.filter((reason) => reason.includes("missing")),
    ...locations.flatMap((location) => location.reasonCodes.filter((reason) => reason.includes("missing"))),
  ]).map((missing) => ({
    id: evidenceId(missing),
    description: `Missing evidence signaled by Zen badge locator: ${missing}.`,
    requiredFor: locator.locatorId,
  }));

  return buildZenObjectiveBindingV1({
    subject: {
      kind: locator.input.kind === "workstation_event" ? "workstation_event" : locator.input.kind === "user_prompt" ? "user_prompt" : "situation",
      label: locator.input.summary,
      refs: locator.input.refs,
    },
    objectiveState: {
      id: `${locator.locatorId}.objective_state`,
      label: "Situation objective binding",
      description: locator.comparisonSeed.proceduralExpression,
    },
    bindings,
    constraints: constraintsFromBindings(bindings),
    trace: [
      {
        step: "resolve_situation_locator",
        nodeIds: unique([...locations.map((location) => location.nodeId), ...locator.comparisonSeed.selectedNodeIds]),
        badgeIds: bindings.map((binding) => binding.badgeId),
        reason: "Situation reflection resolves from a Zen badge locator into the common objective binding contract.",
      },
    ],
    missingEvidence,
  });
}
