export const evaluateGlobalTerminalRewritePolicy = (args: {
  reasons: string[];
  structuredSurface: boolean;
  frontierIntent: boolean;
  promptFamily: string | null | undefined;
  objectiveStrictCovered: boolean;
  preserveConversationalAnswer: boolean;
}): {
  requiresFamilySectionRepair: boolean;
  allowMinimalSoftRepair: boolean;
  allowConversationalSoftObserve: boolean;
  prioritizeFrontierContractRepair: boolean;
} => {
  const requiresFamilySectionRepair = args.reasons.some(
    (reason) =>
      reason === "required_sections_missing" ||
      reason === "sources_missing" ||
      reason.startsWith("roadmap_"),
  );
  const softFamilySectionReasonsOnly =
    args.reasons.length > 0 &&
    args.reasons.every(
      (reason) => reason === "required_sections_missing" || reason === "sources_missing",
    );
  const roadmapFamilyIntent = args.promptFamily === "roadmap_planning";
  const comparisonFamilyIntent = args.promptFamily === "comparison_tradeoff";
  const requiresFrontierSectionRepair =
    args.frontierIntent && args.reasons.includes("frontier_required_headings_missing");
  const allowMinimalSoftRepair =
    softFamilySectionReasonsOnly &&
    !args.frontierIntent &&
    !roadmapFamilyIntent &&
    !comparisonFamilyIntent &&
    args.objectiveStrictCovered;
  const allowConversationalSoftObserve =
    !args.structuredSurface &&
    !args.frontierIntent &&
    args.objectiveStrictCovered &&
    args.reasons.every(
      (reason) =>
        reason === "required_sections_missing" ||
        reason === "sources_missing" ||
        reason === "anchor_integrity_violation",
    ) &&
    args.preserveConversationalAnswer;
  const prioritizeFrontierContractRepair =
    args.structuredSurface && args.frontierIntent && (requiresFrontierSectionRepair || requiresFamilySectionRepair);
  return {
    requiresFamilySectionRepair,
    allowMinimalSoftRepair,
    allowConversationalSoftObserve,
    prioritizeFrontierContractRepair,
  };
};

export const shouldApplyFallbackShapeRepair = (args: {
  structuredSurface: boolean;
  repoOrHybrid: boolean;
  frontierIntent: boolean;
  globalTerminalMode: string;
  intentProfileId: string;
  hasPlanShadow: boolean;
  hasAcceptedRepoFallbackShape: boolean;
}): boolean =>
  args.structuredSurface &&
  args.repoOrHybrid &&
  !args.frontierIntent &&
  args.globalTerminalMode.startsWith("minimal_repair") &&
  args.intentProfileId !== "repo.ideology_reference" &&
  args.hasPlanShadow &&
  !args.hasAcceptedRepoFallbackShape;

export const applyFinalModeGateSoftSuppression = (args: {
  reasons: string[];
  allowSoftModeGateSuppression: boolean;
  repoOrHybrid: boolean;
}): {
  reasons: string[];
  suppressed: boolean;
  suppressedReasons: string[];
} => {
  if (!args.allowSoftModeGateSuppression || args.reasons.length === 0) {
    return {
      reasons: args.reasons.slice(),
      suppressed: false,
      suppressedReasons: [],
    };
  }
  const suppressedReasons = [
    "required_sections_missing",
    "anchor_integrity_violation",
    ...(args.repoOrHybrid ? [] : ["sources_missing"]),
  ];
  const softReasonSet = new Set(suppressedReasons);
  const hardReasons = args.reasons.filter((reason) => !softReasonSet.has(reason));
  if (hardReasons.length === args.reasons.length) {
    return {
      reasons: args.reasons.slice(),
      suppressed: false,
      suppressedReasons,
    };
  }
  return {
    reasons: hardReasons,
    suppressed: true,
    suppressedReasons,
  };
};
