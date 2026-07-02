import { describe, expect, it } from "vitest";
import { validateHelixRecommendedActionAdmissionV1 } from "../../contracts/helix-recommended-action-admission.v1";
import { validateIdeologyContextReflectionV1 } from "../../ideology-context-reflection";
import type { IdeologyGraphDocument } from "../ideology-graph-types";
import { buildIdeologyGraph } from "../load-ideology-graph";
import { reflectWorkstationNoteWithMoralGraph } from "../workstation-notes-moral-graph";

const graphDocument: IdeologyGraphDocument = {
  version: 1,
  rootId: "mission-ethos",
  actionGatePolicy: {
    version: 1,
    covered_action_tags: ["covered-action"],
    legal_key_tags: ["legal-key"],
    ethos_key_tags: ["ethos-key"],
    jurisdiction_floor_ok_tags: ["jurisdiction-floor-ok"],
    hard_fail_ids: {
      missing_legal_key: "IDEOLOGY_MISSING_LEGAL_KEY",
    },
  },
  nodes: [
    {
      id: "mission-ethos",
      title: "Mission Ethos",
      tags: ["root"],
      children: ["right-speech-infrastructure", "skillful-mediation"],
    },
    {
      id: "right-speech-infrastructure",
      title: "Right Speech Infrastructure",
      tags: ["speech", "posture"],
      children: [],
      references: [{ kind: "doc", title: "Right speech guide", path: "docs/ethos/right-speech.md" }],
      actions: [{ label: "Open speech lens", action: { kind: "openPanel" } }],
    },
    {
      id: "skillful-mediation",
      title: "Skillful Mediation",
      tags: ["trait", "outer_edge", "mediation"],
      children: [],
    },
  ],
};

const graph = buildIdeologyGraph(graphDocument);

describe("workstation notes MoralGraph adapter", () => {
  it("produces a MoralGraph reflection from note text and preserves note refs", () => {
    const result = reflectWorkstationNoteWithMoralGraph(graph, {
      id: "note:ethos:1",
      content: "Use Right Speech Infrastructure and skillful mediation for this review.",
    });

    expect(validateIdeologyContextReflectionV1(result.reflection)).toEqual([]);
    expect(result.reflection.input.kind).toBe("note");
    expect(result.reflection.input.refs).toEqual(["note:ethos:1"]);
    expect(result.reflection.matches.exact.some((match) => match.nodeId === "right-speech-infrastructure")).toBe(true);
    expect(result.admissions[0]?.evidenceRefs).toEqual(["note:ethos:1"]);
    expect(result.admissions[0]?.actions.every((action) => action.evidenceRefs?.includes("note:ethos:1"))).toBe(true);
  });

  it("requires ask_user for suggested note tags and does not auto-mutate notes", () => {
    const note = {
      id: "note:ethos:tag",
      content: "Use Right Speech Infrastructure and speech posture.",
      title: "Ethos review",
    };
    const before = { ...note };
    const result = reflectWorkstationNoteWithMoralGraph(graph, note);
    const admission = result.admissions[0]!;
    const tagAction = admission.actions.find((action) => action.actionId === "moral-graph.suggest_note_tag");

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    expect(tagAction).toMatchObject({
      admission: "ask_user",
      risk: "mutating",
      display_policy: "actionable",
      agentExecutable: false,
    });
    expect(note).toEqual(before);
  });

  it("maps missing evidence to diagnostic_only without execution", () => {
    const result = reflectWorkstationNoteWithMoralGraph(graph, {
      id: "note:ethos:missing",
      content: "This note has no matching ideology lens terms.",
    });
    const admission = result.admissions[0]!;
    const missingAction = admission.actions.find((action) => action.actionId === "moral-graph.ask_for_missing_evidence");

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    expect(missingAction).toMatchObject({
      admission: "auto",
      risk: "claim_sensitive",
      display_policy: "diagnostic_only",
      agentExecutable: false,
    });
    expect(missingAction?.evidenceRequirements?.missing).toContain("deterministic_ideology_lens_match");
  });

  it("requires ask_user for related ethos node links and identifies Notes as source", () => {
    const result = reflectWorkstationNoteWithMoralGraph(graph, {
      id: "note:ethos:link",
      content: "Skillful Mediation should be linked back to the mission ethos review.",
    });
    const admission = result.admissions[0]!;
    const linkAction = admission.actions.find((action) => action.actionId === "moral-graph.link_ethos_node");

    expect(linkAction).toMatchObject({
      admission: "ask_user",
      risk: "mutating",
      display_policy: "actionable",
      agentExecutable: false,
    });
    expect(admission.source).toMatchObject({
      workstation: "workstation-notes",
      panel: "workstation-notes",
      tool: "moral-graph-reflection",
    });
    expect(linkAction?.source).toMatchObject({
      workstation: "workstation-notes",
      panel: "workstation-notes",
    });
  });
});
