import type {
  MoralBadgeComparisonPostureV1,
  MoralBadgeComparisonSeedV1,
  MoralBadgeLocatedBindingV1,
  MoralBadgeLocationV1,
} from "../moral-badge-locator";

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function expressionText(location: MoralBadgeLocationV1): string {
  return [
    location.nodeId,
    location.matchType,
    location.proceduralExpression,
    ...(location.reasonCodes ?? []),
    ...(location.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

export function inferMoralBadgeComparisonPosture(
  locations: MoralBadgeLocationV1[],
): MoralBadgeComparisonPostureV1 {
  const text = locations.map(expressionText).join(" ");
  if (/\b(block|blocks|blocked|missing|boundary|hard_fail|unsafe|policy_blocked)\b/.test(text)) {
    return "blocked_or_missing_check";
  }
  if (
    locations.some((location) => location.matchType === "gate_term") ||
    /\b(requires|asks_for|gate|approval|covered-action|covered_action|legal-key|ethos-key)\b/.test(text)
  ) {
    return "requires_check";
  }
  if (/\b(constrains|balances|constraint|balance|restraint|non-harm|right_speech)\b/.test(text)) {
    return "constrained_action_posture";
  }
  return "supported_action_posture";
}

export function buildMoralBadgeComparisonSeed(args: {
  locations: MoralBadgeLocationV1[];
  locatedBindings?: MoralBadgeLocatedBindingV1[];
}): MoralBadgeComparisonSeedV1 {
  const selectedNodeIds = unique([
    ...args.locations.map((location) => location.nodeId),
    ...(args.locatedBindings ?? []).flatMap((binding) => binding.pathNodeIds),
  ]);
  const expectedFruitionPosture = inferMoralBadgeComparisonPosture(args.locations);
  const proceduralExpression =
    args.locations.length > 0
      ? `${args.locations.map((location) => location.proceduralExpression).join(" + ")} => ${expectedFruitionPosture}`
      : `locator.no_badge_match asks_for result.procedural_posture => blocked_or_missing_check`;

  return {
    selectedNodeIds,
    proceduralExpression,
    expectedFruitionPosture,
    reasonCodes: unique([
      "moral_badge_locator",
      "deterministic_badge_comparison",
      ...(args.locatedBindings?.length ? ["located_objective_binding"] : []),
      ...(args.locations.length ? ["located_badge_match"] : ["missing_badge_match"]),
    ]),
  };
}
