import { describe, expect, it } from "vitest";

import { decideHelixToolChoice } from "../services/helix-ask/tool-choice-policy";
import { planWorkstationToolUse } from "../services/helix-ask/workstation-tool-planner";

describe("Helix Ask tool-choice policy", () => {
  it("surfaces run_ask_tool affordance ids for workstation goal-context plans", () => {
    const workstationPlan = planWorkstationToolUse(
      "Start an agent goal session goal_id=goal:frog-monitor source_id=image-lens:latest objective=\"Monitor visual capture for frog classification evidence.\"",
      { threadId: "thread:frog", turnId: "turn:frog" },
    ).tool_plan;

    const decision = decideHelixToolChoice({
      turn_id: "turn:frog",
      prompt: "Start an agent goal session for frog classification.",
      workstation_tool_plan: workstationPlan,
    });

    expect(decision.decision).toBe("workstation_tool_plan");
    expect(decision.selected_affordance_ids).toEqual([
      "live_env.start_agent_goal_session",
      "live_env.query_workstation_goal_context",
    ]);
  });

  it("surfaces narrator panel action affordance ids for governed narrator control plans", () => {
    const workstationPlan = planWorkstationToolUse(
      'Narrator say text="Translation is now routed through Narrator."',
      { threadId: "thread:narrator", turnId: "turn:narrator" },
    ).tool_plan;

    const decision = decideHelixToolChoice({
      turn_id: "turn:narrator",
      prompt: "Narrator say this status update.",
      workstation_tool_plan: workstationPlan,
    });

    expect(decision.decision).toBe("workstation_tool_plan");
    expect(decision.selected_affordance_ids).toEqual([
      "narrator.open",
      "narrator.narrator.say",
    ]);
  });
});
