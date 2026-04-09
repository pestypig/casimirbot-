const pushUniqueReason = (reasons: string[], reason: string): void => {
  const trimmed = reason.trim();
  if (!trimmed) return;
  if (!reasons.includes(trimmed)) {
    reasons.push(trimmed);
  }
};

export const collectGlobalTerminalValidatorReasons = (args: {
  weakObjectiveAssembly: boolean;
  hasObjectiveScaffoldLeak: boolean;
  hasPlanStreamLeakage: boolean;
  strictCoveredUnknownLeak: boolean;
  enforceShortTextFloor: boolean;
  finalPlanValidationFailReasons: string[];
  visibleSourcesRequired: boolean;
  hasSourcesLine: boolean;
  structuredSurface: boolean;
  frontierIntent: boolean;
  hasRequiredFrontierHeadings: boolean;
  promptFamily: string | null | undefined;
  roadmapMissingReasons?: string[];
}): string[] => {
  const reasons: string[] = [];
  if (args.weakObjectiveAssembly) {
    pushUniqueReason(reasons, "weak_output");
  }
  if (args.hasObjectiveScaffoldLeak) {
    pushUniqueReason(reasons, "objective_scaffold_leak");
  }
  if (args.hasPlanStreamLeakage) {
    pushUniqueReason(reasons, "plan_stream_leak");
  }
  if (args.strictCoveredUnknownLeak) {
    pushUniqueReason(reasons, "strict_covered_unknown_leak");
  }
  if (args.enforceShortTextFloor) {
    pushUniqueReason(reasons, "text_too_short");
  }
  if (
    args.structuredSurface &&
    args.finalPlanValidationFailReasons.includes("required_sections_missing")
  ) {
    pushUniqueReason(reasons, "required_sections_missing");
  }
  if (args.finalPlanValidationFailReasons.includes("anchor_integrity_violation")) {
    pushUniqueReason(reasons, "anchor_integrity_violation");
  }
  if (args.visibleSourcesRequired && !args.hasSourcesLine) {
    pushUniqueReason(reasons, "sources_missing");
  }
  if (args.structuredSurface && args.frontierIntent && !args.hasRequiredFrontierHeadings) {
    pushUniqueReason(reasons, "frontier_required_headings_missing");
  }
  if (args.structuredSurface && args.promptFamily === "roadmap_planning") {
    for (const reason of args.roadmapMissingReasons ?? []) {
      pushUniqueReason(reasons, reason);
    }
  }
  return reasons;
};

export const collectFinalModeGateConsistencyReasons = (args: {
  structuredSurface: boolean;
  finalPlanValidationFailReasons: string[];
  frontierIntent: boolean;
  hasRequiredFrontierHeadings: boolean;
  visibleSourcesRequired: boolean;
  hasSourcesLine: boolean;
  promptFamily: string | null | undefined;
  roadmapMissingReasons?: string[];
  objectiveLoopEnabled: boolean;
  objectiveObligationGateRequired: boolean;
  finalObjectiveFinalizeMode: string;
  finalObjectiveObligationsMissingCount: number;
}): string[] => {
  const reasons: string[] = [];
  const finalPlanMissingSections = args.finalPlanValidationFailReasons.includes(
    "required_sections_missing",
  );
  const frontierHeadingsSatisfied = args.frontierIntent && args.hasRequiredFrontierHeadings;
  if (args.structuredSurface && finalPlanMissingSections && !frontierHeadingsSatisfied) {
    pushUniqueReason(reasons, "required_sections_missing");
  }
  if (args.finalPlanValidationFailReasons.includes("anchor_integrity_violation")) {
    pushUniqueReason(reasons, "anchor_integrity_violation");
  }
  if (args.visibleSourcesRequired && !args.hasSourcesLine) {
    pushUniqueReason(reasons, "sources_missing");
  }
  if (args.structuredSurface && args.frontierIntent && !args.hasRequiredFrontierHeadings) {
    pushUniqueReason(reasons, "frontier_required_headings_missing");
  }
  if (args.structuredSurface && args.promptFamily === "roadmap_planning") {
    for (const reason of args.roadmapMissingReasons ?? []) {
      pushUniqueReason(reasons, reason);
    }
  }
  if (
    args.objectiveLoopEnabled &&
    args.objectiveObligationGateRequired &&
    args.finalObjectiveFinalizeMode === "strict_covered" &&
    args.finalObjectiveObligationsMissingCount > 0
  ) {
    pushUniqueReason(reasons, "objective_obligations_missing");
  }
  return reasons;
};
