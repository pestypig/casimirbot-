import { describe, expect, it } from "vitest";
import { validateHelixRecommendedActionAdmissionV1 } from "../../contracts/helix-recommended-action-admission.v1";
import { validateIdeologyContextReflectionV1 } from "../../ideology-context-reflection";
import type { IdeologyGraphDocument } from "../ideology-graph-types";
import { buildIdeologyGraph } from "../load-ideology-graph";
import { reflectRepoEvidenceWithMoralGraph } from "../repo-evidence-moral-graph";

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
      children: ["integrity-protocols", "capture-resistance", "review-gate"],
    },
    {
      id: "integrity-protocols",
      title: "Integrity Protocols",
      aliases: ["integrity lens"],
      tags: ["integrity", "governance", "lens"],
      references: [{ kind: "doc", title: "Integrity policy", path: "docs/ethos/integrity.md" }],
    },
    {
      id: "capture-resistance",
      title: "Capture Resistance",
      aliases: ["capture resistance warning"],
      tags: ["capture", "resistance", "safeguard"],
      references: [{ kind: "doc", title: "Capture policy", path: "docs/ethos/capture.md" }],
    },
    {
      id: "review-gate",
      title: "Review Gate",
      tags: ["covered-action", "legal-key", "review"],
      actions: [{ label: "Require review gate" }],
    },
  ],
};

const graph = buildIdeologyGraph(graphDocument);

describe("repo evidence MoralGraph adapter", () => {
  it("reflects repo evidence and preserves repo, commit, and file refs", () => {
    const result = reflectRepoEvidenceWithMoralGraph(graph, {
      repoRef: "repo:casimirbot",
      commitRef: "commit:abc123",
      fileRefs: ["shared/moral-graph/repo-evidence-moral-graph.ts"],
      summaryOfDiffOrEvidence: "Integrity Protocols are relevant to this code review evidence.",
    });

    expect(validateIdeologyContextReflectionV1(result.reflection)).toEqual([]);
    expect(result.reflection.input.kind).toBe("repo_evidence");
    expect(result.reflection.input.refs).toEqual([
      "repo:casimirbot",
      "commit:abc123",
      "shared/moral-graph/repo-evidence-moral-graph.ts",
    ]);
    expect(result.admissions[0]?.evidenceRefs).toEqual(result.reflection.input.refs);
    expect(result.admissions[0]?.actions.every((action) => action.evidenceRefs?.includes("repo:casimirbot"))).toBe(true);
  });

  it("maps read-only repo evidence reflection to auto diagnostic admissions", () => {
    const admission = reflectRepoEvidenceWithMoralGraph(graph, {
      repoRef: "repo:casimirbot",
      commitRef: "commit:abc123",
      fileRefs: ["server/routes/agi.plan.ts"],
      summaryOfDiffOrEvidence: "Integrity Protocols and Capture Resistance should be shown for this review.",
    }).admissions[0]!;

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    for (const actionId of [
      "moral-graph.show_integrity_lens",
      "moral-graph.show_capture_resistance_warning",
      "moral-graph.link_policy_node",
    ]) {
      expect(admission.actions.find((action) => action.actionId === actionId)).toMatchObject({
        admission: "auto",
        risk: "read_only",
        display_policy: "diagnostic_only",
        agentExecutable: false,
      });
    }
  });

  it("asks the user for review gate suggestions", () => {
    const admission = reflectRepoEvidenceWithMoralGraph(graph, {
      repoRef: "repo:casimirbot",
      commitRef: "commit:review",
      fileRefs: ["shared/contracts/helix-recommended-action-admission.v1.ts"],
      summaryOfDiffOrEvidence: "Review Gate should be considered before claiming this check is complete.",
    }).admissions[0]!;
    const reviewGate = admission.actions.find((action) => action.actionId === "moral-graph.suggest_review_gate");

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    expect(reviewGate).toMatchObject({
      admission: "ask_user",
      risk: "claim_sensitive",
      display_policy: "actionable",
      agentExecutable: false,
    });
    expect(reviewGate?.source).toMatchObject({
      workstation: "repo-evidence",
      panel: "repo-evidence",
    });
  });

  it("asks for test evidence as read-only diagnostic evidence", () => {
    const admission = reflectRepoEvidenceWithMoralGraph(graph, {
      repoRef: "repo:casimirbot",
      summaryOfDiffOrEvidence: "Integrity Protocols are relevant, but tests are not provided.",
    }).admissions[0]!;
    const testEvidence = admission.actions.find((action) => action.actionId === "moral-graph.ask_for_test_evidence");

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    expect(testEvidence).toMatchObject({
      admission: "auto",
      risk: "read_only",
      display_policy: "diagnostic_only",
      agentExecutable: false,
    });
    expect(testEvidence?.evidenceRequirements?.missing).toContain("test evidence");
  });

  it("does not allow repo mutation, command execution, commits, or code edits", () => {
    const evidence = {
      repoRef: "repo:casimirbot",
      commitRef: "commit:abc123",
      fileRefs: ["shared/moral-graph/repo-evidence-moral-graph.ts"],
      summaryOfDiffOrEvidence: "Integrity Protocols and Review Gate apply to this repo evidence.",
    };
    const before = { ...evidence, fileRefs: [...evidence.fileRefs] };
    const admission = reflectRepoEvidenceWithMoralGraph(graph, evidence).admissions[0]!;

    expect(evidence).toEqual(before);
    expect(admission.actions.every((action) => action.agentExecutable === false)).toBe(true);
    expect(admission.actions.some((action) => action.risk === "mutating")).toBe(false);
    expect(admission.actions.some((action) => /commit|edit|terminal|command/i.test(action.actionId))).toBe(false);
  });
});
