import { describe, expect, it } from "vitest";
import { validateHelixRecommendedActionAdmissionV1 } from "../../contracts/helix-recommended-action-admission.v1";
import { validateIdeologyContextReflectionV1 } from "../../ideology-context-reflection";
import type { IdeologyGraphDocument } from "../ideology-graph-types";
import { buildIdeologyGraph } from "../load-ideology-graph";
import { reflectSituationRoomEventWithMoralGraph } from "../situation-room-moral-graph";

const graphDocument: IdeologyGraphDocument = {
  version: 1,
  rootId: "mission-ethos",
  actionGatePolicy: {
    version: 1,
    covered_action_tags: ["covered-action"],
    legal_key_tags: ["legal-key"],
    ethos_key_tags: ["ethos-key"],
    jurisdiction_floor_ok_tags: ["jurisdiction-floor-ok"],
  },
  nodes: [
    {
      id: "mission-ethos",
      title: "Mission Ethos",
      tags: ["root"],
      children: ["two-key-review", "lawful-interface", "non-harm-check"],
    },
    {
      id: "two-key-review",
      title: "Two-Key Review",
      aliases: ["two key approval"],
      tags: ["covered-action", "legal-key", "ethos-key", "approval", "review"],
      actions: [{ label: "Require two-key review" }],
    },
    {
      id: "lawful-interface",
      title: "Lawful Interface",
      tags: ["lawful", "jurisdiction", "interface", "safeguard"],
      references: [{ kind: "doc", title: "Lawful interface policy", path: "docs/ethos/lawful-interface.md" }],
    },
    {
      id: "non-harm-check",
      title: "Non-Harm Check",
      tags: ["non-harm", "safety", "restraint", "safeguard"],
      references: [{ kind: "doc", title: "Non-harm policy", path: "docs/ethos/non-harm.md" }],
    },
  ],
};

const graph = buildIdeologyGraph(graphDocument);

describe("situation room MoralGraph adapter", () => {
  it("reflects situation room events and preserves situation/action refs", () => {
    const result = reflectSituationRoomEventWithMoralGraph(graph, {
      situationId: "situation:alpha",
      actionId: "action:deploy",
      missionActionSummary: "Two-Key Review is required before this mission action.",
    });

    expect(validateIdeologyContextReflectionV1(result.reflection)).toEqual([]);
    expect(result.reflection.input.kind).toBe("situation_room_event");
    expect(result.reflection.input.refs).toEqual(["situation:alpha", "action:deploy"]);
    expect(result.admissions[0]?.evidenceRefs).toEqual(["situation:alpha", "action:deploy"]);
    expect(result.admissions[0]?.actions.every((action) => action.evidenceRefs?.includes("action:deploy"))).toBe(true);
  });

  it("maps warnings and checks to auto claim-sensitive diagnostic admissions", () => {
    const admission = reflectSituationRoomEventWithMoralGraph(graph, {
      situationId: "situation:alpha",
      actionId: "action:check",
      missionActionSummary: "Lawful Interface and Non-Harm Check apply before this mission action.",
    }).admissions[0]!;

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    for (const actionId of [
      "moral-graph.show_lawful_interface_check",
      "moral-graph.show_non_harm_check",
    ]) {
      expect(admission.actions.find((action) => action.actionId === actionId)).toMatchObject({
        admission: "auto",
        risk: "claim_sensitive",
        display_policy: "diagnostic_only",
        agentExecutable: false,
      });
    }
  });

  it("requires ask_user for two-key review and missing authority", () => {
    const admission = reflectSituationRoomEventWithMoralGraph(graph, {
      situationId: "situation:alpha",
      actionId: "action:authority",
      missionActionSummary: "Deploy mission action with Two-Key Review but unclear authority.",
    }).admissions[0]!;

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    for (const actionId of [
      "moral-graph.require_two_key_review",
      "moral-graph.ask_for_missing_authority",
    ]) {
      expect(admission.actions.find((action) => action.actionId === actionId)).toMatchObject({
        admission: "ask_user",
        risk: "claim_sensitive",
        display_policy: "actionable",
        agentExecutable: false,
      });
    }
  });

  it("blocks high-impact or unclear operational actions", () => {
    const admission = reflectSituationRoomEventWithMoralGraph(graph, {
      situationId: "situation:beta",
      actionId: "action:override",
      missionActionSummary: "Execute production override without approval for external customer incident.",
    }).admissions[0]!;
    const blocked = admission.actions.find((action) => action.actionId === "moral-graph.block_policy_sensitive_action");

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    expect(blocked).toMatchObject({
      admission: "blocked",
      risk: "unknown",
      display_policy: "hidden",
      agentExecutable: false,
    });
  });

  it("cannot approve or execute mission actions by itself", () => {
    const event = {
      situationId: "situation:gamma",
      actionId: "action:mission",
      missionActionSummary: "Deploy mission action after Lawful Interface and Non-Harm Check review.",
    };
    const before = { ...event };
    const admission = reflectSituationRoomEventWithMoralGraph(graph, event).admissions[0]!;

    expect(event).toEqual(before);
    expect(admission.authority.agent_executable).toBe(false);
    expect(admission.actions.every((action) => action.agentExecutable === false)).toBe(true);
    expect(admission.actions.some((action) => /approve|execute|dispatch|deploy/i.test(action.actionId))).toBe(false);
    expect(admission.actions.filter((action) => action.admission === "blocked").every((action) => action.risk === "unknown")).toBe(true);
  });
});
