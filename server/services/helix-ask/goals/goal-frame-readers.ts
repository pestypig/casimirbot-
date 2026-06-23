import crypto from "node:crypto";

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

type HelixAskGoalFrameHashSource = {
  user_goal: {
    goal_kind: string;
    normalized: string;
  };
};

export const hashAskTurnGoalFrame = (frame: HelixAskGoalFrameHashSource): string =>
  crypto.createHash("sha1").update(`${frame.user_goal.goal_kind}:${frame.user_goal.normalized}`).digest("hex").slice(0, 16);
