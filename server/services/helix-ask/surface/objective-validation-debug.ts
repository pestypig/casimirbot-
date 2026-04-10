type MutableDebugPayload = Record<string, unknown>;

const toBoundedRatio = (numerator: number, denominator: number): number => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return 0;
  }
  return Number((numerator / denominator).toFixed(4));
};

export const applyObjectiveValidationDebugPayload = (args: {
  debugPayload: MutableDebugPayload;
  objectiveCoverageUnresolvedObjectiveIds: string[];
  objectiveUnknownBlockObjectiveIds: string[];
  objectiveUnresolvedWithoutUnknownBlockIds: string[];
  unresolvedObjectiveCount: number;
  unresolvedWithGenericUnknownCount: number;
  objectiveOesScores: unknown[];
  objectiveTerminalizationReasons: Record<string, unknown>;
}): void => {
  args.debugPayload.objective_coverage_unresolved_count =
    args.objectiveCoverageUnresolvedObjectiveIds.length;
  args.debugPayload.objective_coverage_unresolved_objective_ids =
    args.objectiveCoverageUnresolvedObjectiveIds.slice();
  args.debugPayload.objective_unknown_block_count = args.objectiveUnknownBlockObjectiveIds.length;
  args.debugPayload.objective_unknown_block_objective_ids =
    args.objectiveUnknownBlockObjectiveIds.slice(0, 12);
  args.debugPayload.objective_unresolved_without_unknown_block_count =
    args.objectiveUnresolvedWithoutUnknownBlockIds.length;
  args.debugPayload.objective_unresolved_without_unknown_block_ids =
    args.objectiveUnresolvedWithoutUnknownBlockIds.slice(0, 12);
  args.debugPayload.unresolved_without_unknown_block_rate = toBoundedRatio(
    args.objectiveUnresolvedWithoutUnknownBlockIds.length,
    args.unresolvedObjectiveCount,
  );
  args.debugPayload.generic_unknown_renderer_rate = toBoundedRatio(
    args.unresolvedWithGenericUnknownCount,
    args.unresolvedObjectiveCount,
  );
  args.debugPayload.objective_oes_scores = args.objectiveOesScores.slice(0, 12);
  args.debugPayload.objective_terminalization_reasons = {
    ...args.objectiveTerminalizationReasons,
  };
  args.debugPayload.objective_terminalization_reason =
    Object.values(args.objectiveTerminalizationReasons)[0] ?? null;
};
