type MutableDebugRecord = Record<string, unknown>;

export const clearObjectiveModeGateConsistencyForFinalize = (
  debugRecord: MutableDebugRecord,
): void => {
  debugRecord.objective_mode_gate_consistency_blocked = false;
  debugRecord.objective_mode_gate_consistency_reasons = [];
};

export const applyFinalModeGateConsistencyDebugState = (args: {
  debugRecord: MutableDebugRecord;
  blocked: boolean;
  reasons: string[];
  objectiveLoopEnabled: boolean;
  strictCoveredRecovered: boolean;
  objectiveFallbackShapeSuppressed: boolean;
}): void => {
  args.debugRecord.final_mode_gate_consistency_blocked = args.blocked;
  args.debugRecord.final_mode_gate_consistency_reasons = args.reasons.slice(0, 12);
  args.debugRecord.objective_mode_gate_consistency_blocked =
    Boolean(args.debugRecord.objective_mode_gate_consistency_blocked) || args.blocked;
  if (args.blocked) {
    args.debugRecord.objective_mode_gate_consistency_reasons = Array.from(
      new Set(
        [
          ...(Array.isArray(args.debugRecord.objective_mode_gate_consistency_reasons)
            ? (args.debugRecord.objective_mode_gate_consistency_reasons as unknown[])
                .map((entry) => String(entry ?? "").trim())
                .filter(Boolean)
            : []),
          ...args.reasons,
        ].filter(Boolean),
      ),
    ).slice(0, 12);
    args.debugRecord.objective_finalize_gate_passed = false;
    args.debugRecord.objective_finalize_gate_mode = "blocked";
    return;
  }
  if (!args.objectiveLoopEnabled || !args.strictCoveredRecovered) {
    return;
  }
  args.debugRecord.objective_finalize_gate_passed = true;
  args.debugRecord.objective_finalize_gate_mode = "strict_covered";
  args.debugRecord.objective_finalize_gate_reconciled = true;
  args.debugRecord.objective_mode_gate_consistency_blocked = false;
  args.debugRecord.objective_mode_gate_consistency_reasons = [];
  args.debugRecord.objective_obligations_missing_stale_suppressed =
    args.objectiveFallbackShapeSuppressed;
  if (args.objectiveFallbackShapeSuppressed) {
    args.debugRecord.answer_obligations_missing = [];
  }
};

export const reconcileObjectiveFinalizeGateAfterSurface = (args: {
  debugRecord: MutableDebugRecord;
  strictCoveredConsistent: boolean;
  objectiveObligationsSuppressed: boolean;
  consistencyReasons: string[];
}): void => {
  if (args.strictCoveredConsistent) {
    args.debugRecord.objective_finalize_gate_passed = true;
    args.debugRecord.objective_finalize_gate_mode = "strict_covered";
    args.debugRecord.objective_mode_gate_consistency_blocked = false;
    args.debugRecord.objective_mode_gate_consistency_reasons = [];
    args.debugRecord.objective_assembly_blocked_reason = null;
    if (args.objectiveObligationsSuppressed) {
      args.debugRecord.answer_obligations_missing = [];
      args.debugRecord.objective_obligations_missing_stale_suppressed = true;
    }
    return;
  }
  if (args.debugRecord.objective_finalize_gate_mode !== "strict_covered") {
    return;
  }
  args.debugRecord.objective_finalize_gate_passed = false;
  args.debugRecord.objective_finalize_gate_mode = "blocked";
  args.debugRecord.objective_mode_gate_consistency_blocked = true;
  args.debugRecord.objective_mode_gate_consistency_reasons = Array.from(
    new Set(args.consistencyReasons.filter(Boolean)),
  ).slice(0, 12);
};
