import { describe, expect, it } from "vitest";
import {
  isTheoryBadgeGraphV1,
  validateTheoryBadgeGraphV1,
} from "../theory-badge-graph.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../../theory/nhm2-theory-badges";

describe("theory_badge_graph/v1", () => {
  it("validates the NHM2 seed badge graph", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();

    expect(validateTheoryBadgeGraphV1(graph)).toEqual([]);
    expect(isTheoryBadgeGraphV1(graph)).toBe(true);
    expect(graph.badges.length).toBeGreaterThanOrEqual(8);
    expect(graph.edges.length).toBeGreaterThanOrEqual(8);
    expect(graph.summary.calculatorLoadableCount).toBeGreaterThanOrEqual(4);
  });

  it("rejects forbidden claim language", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    graph.badges[0] = {
      ...graph.badges[0],
      whyItMatters: "This would imply proven warp.",
    };

    expect(
      validateTheoryBadgeGraphV1(graph).some((issue: string) =>
        issue.includes("forbidden validation claim phrase matched"),
      ),
    ).toBe(true);
  });

  it("rejects edges that point outside the badge set", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    graph.edges[0] = {
      ...graph.edges[0],
      to: "missing.badge",
    };

    expect(validateTheoryBadgeGraphV1(graph)).toContain(
      "edges[0].to references missing badge: missing.badge",
    );
  });

  it("rejects incoherent badge scale envelopes", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    graph.badges[0] = {
      ...graph.badges[0],
      scaleEnvelope: {
        characteristicLog10M: -3,
        minLog10M: -2,
        maxLog10M: -4,
        basis: "measured",
        sourceRefs: [],
      },
    };

    expect(validateTheoryBadgeGraphV1(graph)).toEqual(
      expect.arrayContaining(["badges[0].scaleEnvelope.minLog10M must be <= maxLog10M"]),
    );
  });
});
