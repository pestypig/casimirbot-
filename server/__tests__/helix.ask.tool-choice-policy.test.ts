import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

  it("surfaces live_env narrator affordance ids for governed narrator control plans", () => {
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
      "live_env.narrator_say",
    ]);
  });

  it("keeps repair workstation source exposed in the top-level Ask live_env capability surface", () => {
    const agiPlanSource = readFileSync(resolve(__dirname, "../routes/agi.plan.ts"), "utf8");
    const repairCapability = "live_env.repair_workstation_source";

    expect(agiPlanSource.match(new RegExp(`case "${repairCapability}"`, "g"))?.length ?? 0).toBeGreaterThanOrEqual(1);
    expect(agiPlanSource).toContain(`"${repairCapability}",`);
    expect(agiPlanSource).toContain(`capability_key: "${repairCapability}"`);
    expect(agiPlanSource).toContain("Creates a governed source-repair control receipt");
  });

  it("keeps goal sessions, goal context, packet traces, route evidence, and automation policies exposed in the top-level Ask live_env capability surface", () => {
    const agiPlanSource = readFileSync(resolve(__dirname, "../routes/agi.plan.ts"), "utf8");
    const capabilities = [
      "live_env.start_agent_goal_session",
      "live_env.query_workstation_goal_context",
      "live_env.query_packet_traces",
      "live_env.query_route_evidence",
      "live_env.query_automation_policies",
    ];

    for (const capability of capabilities) {
      expect(agiPlanSource.match(new RegExp(`case "${capability}"`, "g"))?.length ?? 0).toBeGreaterThanOrEqual(1);
      expect(agiPlanSource).toContain(`"${capability}",`);
      expect(agiPlanSource).toContain(`capability_key: "${capability}"`);
    }

    expect(agiPlanSource).toContain("context_feeds");
    expect(agiPlanSource).toContain("allowed_actuators");
    expect(agiPlanSource).toContain("producer_kind");
    expect(agiPlanSource).toContain("update_kind");
    expect(agiPlanSource).toContain("packet_id");
    expect(agiPlanSource).toContain("route-watch GoalContextUpdate evidence");
  });
});
