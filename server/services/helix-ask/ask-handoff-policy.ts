import type { HelixGoalCard } from "@shared/helix-goal-card";
import type { HelixLiveSourceChunk } from "@shared/helix-live-source-chunk";
import type { HelixAskHandoffReasoningBudget } from "@shared/helix-ask-handoff";

export function shouldCreateAskHandoffForGoal(input: {
  goal: HelixGoalCard;
  chunk: HelixLiveSourceChunk;
  status: "completed" | "failed" | "suppressed";
}): { shouldCreate: boolean; reasoningBudget: HelixAskHandoffReasoningBudget; expectedOutput: string } {
  if (input.status !== "completed") return { shouldCreate: false, reasoningBudget: "cheap", expectedOutput: "grounded_micro_report" };
  if (input.goal.may_request_helix_ask === false) {
    return { shouldCreate: false, reasoningBudget: "cheap", expectedOutput: "grounded_micro_report" };
  }
  if (
    input.goal.goal_type === "identify_current_activity" ||
    input.goal.goal_type === "track_risk" ||
    input.goal.goal_type === "monitor_user_direct_address" ||
    input.goal.goal_type === "verify_equation_or_calculation"
  ) {
    return {
      shouldCreate: true,
      reasoningBudget: input.goal.goal_type === "track_risk" ? "normal" : "cheap",
      expectedOutput: "grounded_micro_report",
    };
  }
  return { shouldCreate: false, reasoningBudget: "cheap", expectedOutput: "grounded_micro_report" };
}
