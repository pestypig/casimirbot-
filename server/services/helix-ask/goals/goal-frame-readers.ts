type HelixAskGoalFrameWithMutationTargets = {
  mutation_targets?: Array<{
    kind: "note" | "doc" | "clipboard" | "workspace_panel";
    value: string;
    resolution: "explicit" | "active" | "last_created" | "ambiguous" | "missing";
    confidence: number;
  }>;
};

export const readAskTurnGoalFrameMutationTarget = <
  Frame extends HelixAskGoalFrameWithMutationTargets | null | undefined,
>(
  frame: Frame,
  kind: NonNullable<HelixAskGoalFrameWithMutationTargets["mutation_targets"]>[number]["kind"],
): NonNullable<HelixAskGoalFrameWithMutationTargets["mutation_targets"]>[number] | null =>
  frame?.mutation_targets?.find((entry) => entry.kind === kind && entry.resolution !== "missing") ?? null;
