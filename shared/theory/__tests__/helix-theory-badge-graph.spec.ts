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
        "nhm2.regional_atlas.available",
        "nhm2.regional_atlas.partition_of_unity",
        "nhm2.regional_atlas.transition_supports",
        "nhm2.regional_atlas.derivative_support",
        "nhm2.regional_atlas.consumer_congruence",
        "nhm2.regional_atlas.claim_boundary",
        "nhm2.claim_boundary.diagonal_proxy_not_full_tensor",
      ]),
    );
    for (const badgeId of [
      "nhm2.regional_atlas.available",
      "nhm2.regional_atlas.partition_of_unity",
      "nhm2.regional_atlas.transition_supports",
      "nhm2.regional_atlas.derivative_support",
      "nhm2.regional_atlas.consumer_congruence",
      "nhm2.regional_atlas.claim_boundary",
    ]) {
      const badge = helixGraph.badges.find((candidate: TheoryBadgeV1) => candidate.id === badgeId);
      expect(badge?.calculatorPayloads).toEqual([]);
      expect(badge?.claimBoundary.diagnosticOnly).toBe(true);
      expect(badge?.claimBoundary.physicalMechanismClaimAllowed).toBe(false);
    }
    expect(helixGraph.edges.map((edge: TheoryBadgeEdgeV1) => edge.id)).toEqual(
      expect.arrayContaining([
        "regional_atlas_feeds_same_basis_closure",
        "regional_atlas_derivative_support_feeds_conservation",
        "regional_atlas_consumer_congruence_feeds_qei_dossier",
        "regional_atlas_consumer_congruence_feeds_observer_gate",
        "regional_atlas_claim_boundary_blocks_promotion",
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
