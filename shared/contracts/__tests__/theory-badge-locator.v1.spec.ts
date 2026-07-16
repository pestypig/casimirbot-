import { describe, expect, it } from "vitest";
import {
  buildTheoryBadgeLocatorArtifactV1,
  isTheoryBadgeLocatorArtifactV1,
  validateTheoryBadgeLocatorArtifactV1,
} from "../theory-badge-locator.v1";

describe("theory-badge-locator/v1", () => {
  it("validates a compact locator artifact", () => {
    const artifact = buildTheoryBadgeLocatorArtifactV1({
      graphId: "nhm2-theory-badge-graph",
      input: {
        query: "qei margin",
        expression: "qei_margin = qei_bound - qei_sample",
        subjects: ["qei"],
        symbols: ["qei_margin"],
        unitSignatures: ["M L^-1 T^-2"],
        repoPaths: [],
        equationFamilies: ["qei"],
        simulationOwners: ["nhm2"],
        source: "helix_ask",
      },
      matches: [
        {
          badgeId: "nhm2.qei.sampling_window",
          title: "QEI badge replay margin",
          score: 92,
          reasons: ["matched symbol qei_margin"],
          matchedSubjects: ["qei"],
          matchedSymbols: ["qei_margin"],
          matchedUnitSignatures: ["M L^-1 T^-2"],
          matchedEquationFamilies: ["qei"],
          matchedSimulationOwners: ["nhm2"],
          matchedRepoPaths: [],
          calculatorPayloads: [
            {
              payloadId: "qei_margin_difference_payload",
              expression: "qei_margin = qei_bound - qei_sample",
              displayLatex: "qei\\_margin = qei\\_bound - qei\\_sample",
              preferredAction: "solve_with_steps",
            },
          ],
          claimBoundaryNotes: ["nhm2.qei.sampling_window: diagnostic-only badge"],
        },
      ],
      overlay: {
        centerBadgeIds: ["nhm2.qei.sampling_window"],
        highlightedBadgeIds: ["nhm2.qei.sampling_window"],
        highlightedEdgeIds: [],
        rippleBadgeIds: ["nhm2.qei.sampling_window"],
        heatByBadgeId: {
          "nhm2.qei.sampling_window": 1,
        },
        suggestedViewport: {
          centerBadgeId: "nhm2.qei.sampling_window",
          zoom: 1.15,
        },
      },
      recommendedActions: [
        {
          actionId: "theory-badge-graph.load_payloads_to_calculator",
          label: "Load QEI badge replay margin into calculator",
          badgeId: "nhm2.qei.sampling_window",
          payloadIds: ["qei_margin_difference_payload"],
        },
      ],
      claimBoundaryNotes: ["nhm2.qei.sampling_window: diagnostic-only badge"],
    });

    expect(artifact.resolution).toBe("matched");
    expect(artifact.resolutionReason).toBe("matched_graph_evidence");
    expect(validateTheoryBadgeLocatorArtifactV1(artifact)).toEqual([]);
    expect(isTheoryBadgeLocatorArtifactV1(artifact)).toBe(true);
  });

  it("builds a typed unresolved artifact when no graph evidence matches", () => {
    const artifact = buildTheoryBadgeLocatorArtifactV1({
      graphId: "nhm2-theory-badge-graph",
      input: {
        query: "Fermat's Last Theorem",
        expression: null,
        subjects: [],
        symbols: [],
        unitSignatures: [],
        repoPaths: [],
        equationFamilies: [],
        simulationOwners: [],
        source: "helix_ask",
      },
      matches: [],
      overlay: {
        centerBadgeIds: [],
        highlightedBadgeIds: [],
        highlightedEdgeIds: [],
        rippleBadgeIds: [],
        heatByBadgeId: {},
        suggestedViewport: {
          centerBadgeId: null,
          zoom: 1,
        },
      },
      recommendedActions: [],
      claimBoundaryNotes: [
        "No canonical theory badge matched the supplied context.",
        "Locator result is unresolved; no proof or validation claim was made.",
      ],
    });

    expect(artifact.resolution).toBe("unresolved");
    expect(artifact.resolutionReason).toBe("no_supported_graph_match");
    expect(validateTheoryBadgeLocatorArtifactV1(artifact)).toEqual([]);
  });
});
