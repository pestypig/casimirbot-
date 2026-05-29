import { describe, expect, it } from "vitest";
import type { TheoryBadgeV1 } from "../../contracts/theory-badge-graph.v1";
import { buildTheoryBadgeGraphV1 } from "../../contracts/theory-badge-graph.v1";
import { resolveTheoryRouteEligibility } from "../theory-route-eligibility";

const claimBoundary = {
  diagnosticOnly: true,
  doesValidateNHM2: false,
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
} as const;

function badge(overrides: Partial<TheoryBadgeV1> & { id: string; title?: string }): TheoryBadgeV1 {
  return {
    id: overrides.id,
    title: overrides.title ?? overrides.id,
    plainMeaning: "Test badge",
    whyItMatters: "Test route eligibility",
    subjects: ["test"],
    level: "derived_relation",
    status: "project_derived",
    simulationOwners: [],
    equationFamilies: [],
    tags: [],
    equations: [],
    units: [],
    assumptions: [],
    calculatorPayloads: [],
    sourceRefs: [{ kind: "doc", path: "docs/test.md", id: null, note: null }],
    hintKeys: {
      subjects: [],
      symbols: [],
      unitSignatures: [],
      repoPaths: [],
      equationFamilies: [],
      simulationOwners: [],
    },
    claimBoundary,
    ...overrides,
  };
}

describe("resolveTheoryRouteEligibility", () => {
  it("marks scalar badges executable", () => {
    const graph = buildTheoryBadgeGraphV1({
      graphId: "test.route",
      title: "Test Route",
      description: "Fixture",
      badges: [
        badge({
          id: "test.scalar",
          calculatorPayloads: [
            {
              id: "payload",
              expression: "x = y + z",
              displayLatex: "x=y+z",
              preferredAction: "solve_with_steps",
            },
          ],
        }),
      ],
      edges: [],
    });

    const result = resolveTheoryRouteEligibility({ graph, startBadgeIds: ["test.scalar"] });
    const scalar = result.badges.find((candidate) => candidate.badgeId === "test.scalar");

    expect(scalar?.decision).toBe("allowed");
    expect(scalar?.labels).toContain("scalar-solvable");
  });

  it("blocks runtime badges without typed runtime entrypoints", () => {
    const graph = buildTheoryBadgeGraphV1({
      graphId: "test.route",
      title: "Test Route",
      description: "Fixture",
      badges: [
        badge({
          id: "test.runtime.evaluate",
          equations: [
            {
              id: "tensor",
              role: "constraint",
              displayLatex: "G_{\\mu\\nu}=8\\pi T_{\\mu\\nu}",
              operatorKind: "tensor_component",
              inputSymbols: ["g"],
              outputSymbols: ["G"],
            },
          ],
        }),
      ],
      edges: [],
    });

    const result = resolveTheoryRouteEligibility({ graph, startBadgeIds: ["test.runtime.evaluate"] });
    const runtime = result.badges.find((candidate) => candidate.badgeId === "test.runtime.evaluate");

    expect(runtime?.decision).toBe("blocked");
    expect(runtime?.reason).toBe("missing_runtime_entrypoint");
  });

  it("blocks claim-boundary badges from promotion", () => {
    const graph = buildTheoryBadgeGraphV1({
      graphId: "test.route",
      title: "Test Route",
      description: "Fixture",
      badges: [
        badge({
          id: "test.claim_boundary",
          level: "claim_boundary",
        }),
      ],
      edges: [],
    });

    const result = resolveTheoryRouteEligibility({
      graph,
      startBadgeIds: ["test.claim_boundary"],
      allowedClaimLevel: "CL4",
    });
    const boundary = result.badges.find((candidate) => candidate.badgeId === "test.claim_boundary");

    expect(boundary?.decision).toBe("blocked");
    expect(boundary?.reason).toBe("claim_boundary");
  });

  it("returns missing_evidence when evidence is required but absent", () => {
    const graph = buildTheoryBadgeGraphV1({
      graphId: "test.route",
      title: "Test Route",
      description: "Fixture",
      badges: [
        badge({
          id: "test.no_evidence",
          sourceRefs: [],
        }),
      ],
      edges: [],
    });

    const result = resolveTheoryRouteEligibility({
      graph,
      startBadgeIds: ["test.no_evidence"],
      requireEvidence: true,
    });
    const missing = result.badges.find((candidate) => candidate.badgeId === "test.no_evidence");

    expect(missing?.decision).toBe("blocked");
    expect(missing?.reason).toBe("missing_evidence");
    expect(result.summary.blockedReasons.missing_evidence).toBe(1);
  });
});
