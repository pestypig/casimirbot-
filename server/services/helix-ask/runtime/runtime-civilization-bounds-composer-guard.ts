export type HelixRuntimeCivilizationBoundsComposerArtifact = {
  kind: string;
  artifact_id: string;
};

export type HelixRuntimeCivilizationBoundsComposerGoalSatisfaction = {
  satisfaction?: string | null;
  next_decision?: string | null;
};

export type HelixRuntimeCivilizationBoundsComposerGoalFrame = {
  goal_kind: string;
};

export const civilizationBoundsComposerContradictsReceipts = (args: {
  modelText: string;
  fallbackText: string;
  selectedArtifacts: HelixRuntimeCivilizationBoundsComposerArtifact[];
  receiptRefs: string[];
  goalSatisfactionEvaluation?: HelixRuntimeCivilizationBoundsComposerGoalSatisfaction | null;
  canonicalGoalFrame: HelixRuntimeCivilizationBoundsComposerGoalFrame;
}): boolean => {
  if (args.canonicalGoalFrame.goal_kind !== "civilization_bounds_reflection") return false;
  if (!args.fallbackText.trim() || !args.modelText.trim()) return false;
  const hasCivilizationEvidence =
    args.receiptRefs.some((ref) => /civilization_(?:scenario|bounds)|civilization-bounds/i.test(ref)) ||
    args.selectedArtifacts.some((artifact) =>
      [
        "helix_civilization_scenario_frame_tool_result",
        "helix_civilization_bounds_tool_result",
        "workstation_tool_evaluation",
        "final_answer_draft",
      ].includes(artifact.kind) ||
      /civilization_(?:scenario|bounds)|civilization-bounds/i.test(artifact.artifact_id),
    );
  if (!hasCivilizationEvidence) return false;
  const satisfaction = args.goalSatisfactionEvaluation?.satisfaction;
  const nextDecision = args.goalSatisfactionEvaluation?.next_decision;
  if (
    args.goalSatisfactionEvaluation &&
    satisfaction !== "satisfied" &&
    nextDecision !== "allow_terminal"
  ) {
    return false;
  }
  const normalized = args.modelText.replace(/\s+/g, " ").trim().toLowerCase();
  return (
    /\bno compact observations?\b/.test(normalized) ||
    /\bno (?:compact )?(?:observations?|evidence|data|receipts?|excerpts?) (?:were )?(?:provided|available|selected|listed)\b/.test(normalized) ||
    /\bgoal satisfaction evaluation\b.{0,120}\b(?:missing|incomplete|not satisfied)\b/.test(normalized) ||
    /\bplease provide\b.{0,120}\b(?:data|observations?|evidence|information)\b/.test(normalized)
  );
};
