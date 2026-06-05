import { describe, expect, it } from "vitest";
import {
  isTheoryBadgeGraphV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../../contracts/theory-badge-graph.v1";
import type { TheoryCalculatorLoadoutItemV1 } from "../../contracts/theory-calculator-loadout.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildStellarSpectroscopyAstrochemistryTheoryBadgesV1 } from "../stellar-spectroscopy-astrochemistry-theory-badges";
import { buildTheoryCalculatorLoadout } from "../theory-calculator-loadout";

describe("stellar spectroscopy astrochemistry theory badges", () => {
  it("adds the spectroscopy bridge branch to the main graph", () => {
    const branch = buildStellarSpectroscopyAstrochemistryTheoryBadgesV1();
    const graph = buildNhm2TheoryBadgeGraphV1();
    const branchBadgeIds = branch.badges.map((badge: TheoryBadgeV1) => badge.id);
    const graphBadgeIds = graph.badges.map((badge: TheoryBadgeV1) => badge.id);

    expect(branchBadgeIds).toContain("starsim.reference.stellar_spectral_abundance_context");
    expect(branchBadgeIds).toContain("starsim.nucleosynthesis.element_yield_prior");
    expect(branchBadgeIds).toContain("stellar.spectroscopy.atomic_line_identification_context");
    expect(branchBadgeIds).toContain("stellar.spectroscopy.abundance_proxy_equivalent_width");
    expect(branchBadgeIds).toContain("astrochemistry.spectroscopy.molecular_band_identification_context");
    expect(branchBadgeIds).toContain("astrochemistry.claim_boundary.spectral_identification_only");

    expect(graphBadgeIds).toContain("stellar.spectroscopy.atomic_line_identification_context");
    expect(graphBadgeIds).toContain("astrochemistry.spectroscopy.molecular_band_identification_context");
    expect(graphBadgeIds).toContain("astrochemistry.claim_boundary.spectral_identification_only");
    expect(isTheoryBadgeGraphV1(graph)).toBe(true);
  });

  it("exposes spectral conversion, redshift, abundance proxy, and molecular band loadouts", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: [
        "stellar.spectroscopy.atomic_line_identification_context",
        "stellar.spectroscopy.abundance_proxy_equivalent_width",
        "astrochemistry.spectroscopy.molecular_band_identification_context",
      ],
      mode: "selected_badges",
      source: "achievement_map",
      includeContextItems: true,
    });

    const solveExpressions = loadout.items.map((item: TheoryCalculatorLoadoutItemV1) => item.solveExpression);

    expect(solveExpressions).toContain("f_Hz = c/lambda_m");
    expect(solveExpressions).toContain("E_J = h*f_Hz");
    expect(solveExpressions).toContain("z = (lambda_obs - lambda_rest)/lambda_rest");
    expect(solveExpressions).toContain("lambda_rest = lambda_obs/(1 + z)");
    expect(solveExpressions).toContain("abundance_proxy = line_strength/reference_line_strength");
    expect(solveExpressions).toContain("E_band_J = h*c/lambda_band_rest_m");
    expect(solveExpressions).toContain("lambda_band_rest_m = lambda_band_obs_m/(1 + z)");
  });

  it("keeps every bridge row under strict diagnostic boundaries", () => {
    const branch = buildStellarSpectroscopyAstrochemistryTheoryBadgesV1();

    for (const badge of branch.badges) {
      expect(badge.claimBoundary.diagnosticOnly).toBe(true);
      expect(badge.claimBoundary.doesValidateNHM2).toBe(false);
      expect(badge.claimBoundary.validationClaimAllowed).toBe(false);
      expect(badge.claimBoundary.physicalMechanismClaimAllowed).toBe(false);
      expect(badge.claimBoundary.promotionAllowed).toBe(false);
    }
  });

  it("links to PAH and C60 context while blocking spectral overclaiming", () => {
    const branch = buildStellarSpectroscopyAstrochemistryTheoryBadgesV1();

    expect(branch.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "astrochemistry.spectroscopy.molecular_band_identification_context",
          to: "astrochemistry.pah.spectral_family_context",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "astrochemistry.spectroscopy.molecular_band_identification_context",
          to: "astrochemistry.fullerene.c60_stellar_context",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "stellar.spectroscopy.abundance_proxy_equivalent_width",
          to: "astrochemistry.claim_boundary.spectral_identification_only",
          relation: "blocks",
        }),
      ]),
    );
  });

  it("does not connect spectroscopy directly to Orch-OR mechanism rows", () => {
    const branch = buildStellarSpectroscopyAstrochemistryTheoryBadgesV1();
    const forbiddenTargets = new Set([
      "orch_or.microtubule.coherence_window",
      "orch_or.gamma_synchrony.frequency_locking",
      "orch_or.time_crystal.temporal_order_gate",
    ]);
    const directForbiddenEdges = branch.edges.filter((edge: TheoryBadgeEdgeV1) => forbiddenTargets.has(edge.to));

    expect(directForbiddenEdges).toEqual([]);
    expect(JSON.stringify(branch)).not.toMatch(
      /spectroscopy proves life|spectral match validates consciousness|StarSim validates astrochemistry|objective collapse confirmed|formation pathway proven/i,
    );
  });
});
