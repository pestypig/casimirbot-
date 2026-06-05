import { describe, expect, it } from "vitest";
import {
  isTheoryBadgeGraphV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../../contracts/theory-badge-graph.v1";
import { buildHelixTheoryBadgeGraphV1 } from "../helix-theory-badge-graph";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";

describe("helix theory badge graph composer", () => {
  it("exposes the global composer while preserving the NHM2 compatibility alias", () => {
    const helixGraph = buildHelixTheoryBadgeGraphV1();
    const legacyGraph = buildNhm2TheoryBadgeGraphV1();

    expect(isTheoryBadgeGraphV1(helixGraph)).toBe(true);
    expect(helixGraph.graphId).toBe("nhm2-theory-badge-graph");
    expect(helixGraph.badges.map((badge: TheoryBadgeV1) => badge.id)).toContain(
      "astrochemistry.claim_boundary.spectral_identification_only",
    );
    expect(helixGraph.badges.map((badge: TheoryBadgeV1) => badge.id)).toEqual(
      expect.arrayContaining([
        "nhm2.observer.eulerian_normal",
        "nhm2.tensor.metric_required_stress_energy",
        "nhm2.closure.same_basis_regional_residual",
        "nhm2.claim_boundary.diagonal_proxy_not_full_tensor",
      ]),
    );
    expect(helixGraph.badges.map((badge: TheoryBadgeV1) => badge.id)).toEqual(
      legacyGraph.badges.map((badge: TheoryBadgeV1) => badge.id),
    );
    expect(helixGraph.edges.map((edge: TheoryBadgeEdgeV1) => edge.id)).toEqual(
      legacyGraph.edges.map((edge: TheoryBadgeEdgeV1) => edge.id),
    );
  });
});
