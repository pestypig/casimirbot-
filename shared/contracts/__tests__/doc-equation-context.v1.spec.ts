import { describe, expect, it } from "vitest";
import {
  isDocEquationContextArtifactV1,
  validateDocEquationContextArtifactV1,
  type DocEquationContextArtifactV1,
} from "../doc-equation-context.v1";

const makeArtifact = (): DocEquationContextArtifactV1 => ({
  contractVersion: "doc_equation_context/v1",
  generatedAt: "2026-06-10T00:00:00.000Z",
  docPath: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
  equationId: "nhm2-same-chart-full-tensor-ledger",
  equationLabel: "Same-chart full tensor ledger",
  sectionAnchor: "57-workstation-equation-anchors",
  latex: "\\mathcal{T}^{\\rm same-chart}_{\\rm full}=\\{T_{00},T_{0i},T_{ii},T_{ij,\\ i\\ne j}\\}.",
  actionId: "open-same-chart-full-tensor-artifact",
  actionKind: "artifact_backed_theory_run",
  badgeIds: ["physics.gr.3p1_decomposition", "nhm2.tensor.same_chart_full_tensor"],
  preferredBadgeId: "nhm2.tensor.same_chart_full_tensor",
  atlasLensId: "warp_gr_nhm2",
  atlasGroupId: "warp.nhm2.diagnostic_path",
  openedPanels: ["theory-badge-graph", "scientific-calculator"],
  claimBoundaryNotes: ["Full-tensor completeness is an evidence ledger, not a propulsion claim."],
  actionClaimBoundaryNote: "Missing T0i or off-diagonal Tij is a blocker, not a zero.",
  commentaryHints: {
    summary: "Same-chart full tensor ledger maps the whitepaper equation to a runtime evidence row.",
    scope: "runtime_artifact",
    prohibitedClaims: ["validated", "viable", "certified transport"],
    suggestedExplanationFocus: ["same-chart tensor completeness", "missing component blockers"],
  },
});

describe("doc_equation_context/v1", () => {
  it("validates a runtime artifact context receipt", () => {
    const artifact = makeArtifact();

    expect(validateDocEquationContextArtifactV1(artifact)).toEqual([]);
    expect(isDocEquationContextArtifactV1(artifact)).toBe(true);
  });

  it("rejects missing commentary authority boundaries", () => {
    const artifact = {
      ...makeArtifact(),
      commentaryHints: {
        ...makeArtifact().commentaryHints,
        prohibitedClaims: [],
      },
    };

    expect(validateDocEquationContextArtifactV1(artifact)).toContain(
      "commentaryHints.prohibitedClaims must be a non-empty string array",
    );
    expect(isDocEquationContextArtifactV1(artifact)).toBe(false);
  });
});
