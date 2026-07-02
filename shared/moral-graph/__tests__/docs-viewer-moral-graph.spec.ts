import { describe, expect, it } from "vitest";
import { validateHelixRecommendedActionAdmissionV1 } from "../../contracts/helix-recommended-action-admission.v1";
import { validateIdeologyContextReflectionV1 } from "../../ideology-context-reflection";
import type { IdeologyGraphDocument } from "../ideology-graph-types";
import { buildIdeologyGraph } from "../load-ideology-graph";
import { reflectDocsSelectionWithMoralGraph } from "../docs-viewer-moral-graph";

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
      children: ["right-speech-infrastructure", "two-key-approval"],
    },
    {
      id: "right-speech-infrastructure",
      title: "Right Speech Infrastructure",
      tags: ["speech", "posture"],
      links: [{ rel: "see-also", to: "two-key-approval" }],
      references: [{ kind: "doc", title: "Right speech guide", path: "docs/ethos/right-speech.md" }],
    },
    {
      id: "two-key-approval",
      title: "Two-Key Approval",
      tags: ["covered-action", "legal-key"],
      actions: [{ label: "Run gate check" }],
    },
  ],
};

const graph = buildIdeologyGraph(graphDocument);

describe("docs viewer MoralGraph adapter", () => {
  it("reflects selected text and preserves document refs as evidenceRefs", () => {
    const result = reflectDocsSelectionWithMoralGraph(graph, {
      documentId: "doc:ethos:right-speech",
      selectionRange: "120:260",
      selectedText: "Right Speech Infrastructure should frame this selected passage.",
    });

    expect(validateIdeologyContextReflectionV1(result.reflection)).toEqual([]);
    expect(result.reflection.input.kind).toBe("document_selection");
    expect(result.reflection.input.refs).toEqual(["doc:ethos:right-speech", "120:260"]);
    expect(result.admissions[0]?.evidenceRefs).toEqual(["doc:ethos:right-speech", "120:260"]);
    expect(result.admissions[0]?.actions.every((action) => action.evidenceRefs?.includes("doc:ethos:right-speech"))).toBe(true);
  });

  it("maps highlight and show actions to auto read-only diagnostic admissions", () => {
    const admission = reflectDocsSelectionWithMoralGraph(graph, {
      documentId: "doc:ethos:right-speech",
      selectionRange: "120:260",
      selectedText: "Right Speech Infrastructure should frame this selected passage.",
    }).admissions[0]!;

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    for (const actionId of ["moral-graph.highlight_relevant_ethos_passage", "moral-graph.show_related_ethos_node"]) {
      expect(admission.actions.find((action) => action.actionId === actionId)).toMatchObject({
        admission: "auto",
        risk: "read_only",
        display_policy: "diagnostic_only",
        agentExecutable: false,
      });
    }
  });

  it("maps action gate warnings to read-only diagnostic display", () => {
    const admission = reflectDocsSelectionWithMoralGraph(graph, {
      documentId: "doc:ethos:right-speech",
      selectionRange: "120:260",
      selectedText: "Right Speech Infrastructure before any covered action.",
    }).admissions[0]!;

    expect(admission.actions.find((action) => action.actionId === "moral-graph.show_action_gate_warning")).toMatchObject({
      admission: "auto",
      risk: "read_only",
      display_policy: "diagnostic_only",
      agentExecutable: false,
    });
  });

  it("requires ask_user for document annotation suggestions", () => {
    const admission = reflectDocsSelectionWithMoralGraph(graph, {
      documentId: "doc:ethos:right-speech",
      selectionRange: "120:260",
      selectedText: "Right Speech Infrastructure should be annotated here.",
    }).admissions[0]!;
    const annotation = admission.actions.find((action) => action.actionId === "moral-graph.suggest_doc_annotation");

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    expect(annotation).toMatchObject({
      admission: "ask_user",
      risk: "mutating",
      display_policy: "actionable",
      agentExecutable: false,
    });
    expect(annotation?.source).toMatchObject({
      workstation: "docs-viewer",
      panel: "docs-viewer",
    });
  });

  it("does not allow document mutation without user confirmation", () => {
    const selected = {
      documentId: "doc:ethos:right-speech",
      selectionRange: "120:260",
      selectedText: "Right Speech Infrastructure should be annotated here.",
    };
    const before = { ...selected };
    const admission = reflectDocsSelectionWithMoralGraph(graph, selected).admissions[0]!;

    expect(selected).toEqual(before);
    expect(admission.actions.every((action) => action.agentExecutable === false)).toBe(true);
    expect(admission.actions.filter((action) => action.risk === "mutating").every((action) => action.admission === "ask_user")).toBe(true);
  });
});
