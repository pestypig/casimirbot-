type MutableDebugPayload = Record<string, unknown>;

type FallbackReasonClassifier = (args: {
  fallbackReason: string | null;
  failClosedReason: string | null;
  answerFallbackReason: string | null;
  answerShortFallbackReason: string | null;
  toolResultsFallbackReason: string | null;
  placeholderApplied: boolean;
  ambiguityApplied: boolean;
  qualityFloorReasons: string[];
}) => string | null;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const applyResponseFallbackTaxonomy = (args: {
  debugPayload: MutableDebugPayload;
  answerPath: string[];
  fallbackReason: string | null;
  failClosedReason: string | null;
  answerFallbackReason: string | null;
  answerShortFallbackReason: string | null;
  toolResultsFallbackReason: string | null;
  qualityFloorReasons: string[];
  ambiguityAppliedForTaxonomy: boolean;
  classifyFallbackReason: FallbackReasonClassifier;
}): void => {
  const debugPayloadRecord = args.debugPayload;
  const objectiveLoopPrimaryTaxonomySuppressed =
    Boolean(debugPayloadRecord.objective_loop_primary_active) ||
    (isFiniteNumber(debugPayloadRecord.objective_loop_primary_rate) &&
      Number(debugPayloadRecord.objective_loop_primary_rate) >= 0.5) ||
    args.answerPath.some(
      (entry) =>
        entry === "answer:objective_loop_primary_skip" ||
        entry.startsWith("arbiterClarify:objective_loop_primary_suppressed"),
    );
  const objectiveFinalizeGateModeForTaxonomy =
    typeof debugPayloadRecord.objective_finalize_gate_mode === "string"
      ? debugPayloadRecord.objective_finalize_gate_mode
      : null;
  const objectiveCoverageUnresolvedForTaxonomy = isFiniteNumber(
    debugPayloadRecord.objective_coverage_unresolved_count,
  )
    ? Number(debugPayloadRecord.objective_coverage_unresolved_count)
    : 0;
  const objectiveUnknownBlockForTaxonomy = isFiniteNumber(
    debugPayloadRecord.objective_unknown_block_count,
  )
    ? Number(debugPayloadRecord.objective_unknown_block_count)
    : 0;
  const objectiveAssemblyBlockedReasonForTaxonomy =
    typeof debugPayloadRecord.objective_assembly_blocked_reason === "string"
      ? debugPayloadRecord.objective_assembly_blocked_reason.trim()
      : "";
  const objectiveStrictCoveredNoFallback =
    objectiveFinalizeGateModeForTaxonomy === "strict_covered" &&
    objectiveCoverageUnresolvedForTaxonomy <= 0 &&
    objectiveUnknownBlockForTaxonomy <= 0 &&
    !objectiveAssemblyBlockedReasonForTaxonomy;

  if (objectiveLoopPrimaryTaxonomySuppressed) {
    debugPayloadRecord.fallback_reason = objectiveStrictCoveredNoFallback
      ? null
      : "objective_loop_primary_suppressed";
    debugPayloadRecord.fallback_reason_taxonomy = objectiveStrictCoveredNoFallback
      ? "none"
      : "objective_loop_primary_suppressed";
    debugPayloadRecord.fallback_reason_taxonomy_suppressed = true;
    return;
  }

  const fallbackTaxonomy = args.classifyFallbackReason({
    fallbackReason: args.fallbackReason,
    failClosedReason: args.failClosedReason,
    answerFallbackReason: args.answerFallbackReason,
    answerShortFallbackReason: args.answerShortFallbackReason,
    toolResultsFallbackReason: args.toolResultsFallbackReason,
    placeholderApplied: Boolean(debugPayloadRecord.placeholder_fallback_applied),
    ambiguityApplied: args.ambiguityAppliedForTaxonomy,
    qualityFloorReasons: args.qualityFloorReasons,
  });
  if (Boolean(debugPayloadRecord.ambiguity_gate_applied) && !args.ambiguityAppliedForTaxonomy) {
    debugPayloadRecord.ambiguity_gate_taxonomy_suppressed_by_equation_lock = true;
  }
  debugPayloadRecord.fallback_reason = fallbackTaxonomy;
  debugPayloadRecord.fallback_reason_taxonomy = fallbackTaxonomy;
};
