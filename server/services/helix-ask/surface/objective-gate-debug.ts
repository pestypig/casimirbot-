type MutableDebugPayload = Record<string, unknown>;

export const applyObjectiveGateDebugPayload = (args: {
  debugPayload: MutableDebugPayload;
  objectiveFinalizeGatePassed: boolean;
  objectiveFinalizeGateMode: "strict_covered" | "unknown_terminal" | "blocked";
  unknownTerminalPass: boolean;
  strictCoveredPass: boolean;
  unresolvedCount: number;
  blockedCount: number;
  objectiveAnswerObligationsMissingCount: number;
  objectiveComposerValidationFailCount: number;
}): void => {
  args.debugPayload.objective_finalize_gate_passed = args.objectiveFinalizeGatePassed;
  args.debugPayload.objective_finalize_gate_mode = args.objectiveFinalizeGateMode;
  args.debugPayload.objective_finalize_gate_unknown_terminal_eligible = args.unknownTerminalPass;
  if (args.strictCoveredPass) {
    const softReasons = [
      args.objectiveAnswerObligationsMissingCount > 0 ? "answer_obligations_missing" : null,
      args.objectiveComposerValidationFailCount > 0 ? "composer_validation_fail" : null,
    ].filter((entry): entry is string => Boolean(entry));
    if (softReasons.length > 0) {
      args.debugPayload.objective_finalize_gate_soft_reasons = softReasons;
    }
  }
  args.debugPayload.objective_mode_gate_consistency_blocked = !args.strictCoveredPass;
  if (!args.strictCoveredPass) {
    args.debugPayload.objective_mode_gate_consistency_reasons = [
      args.unresolvedCount > 0 ? "objective_unresolved" : null,
      args.blockedCount > 0 ? "objective_blocked" : null,
      args.objectiveAnswerObligationsMissingCount > 0 ? "answer_obligations_missing" : null,
      args.objectiveComposerValidationFailCount > 0 ? "composer_validation_fail" : null,
    ].filter((reason): reason is string => Boolean(reason));
  }
};
