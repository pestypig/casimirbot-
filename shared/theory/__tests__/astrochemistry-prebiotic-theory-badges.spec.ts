import { describe, expect, it } from "vitest";
import {
  isTheoryBadgeGraphV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../../contracts/theory-badge-graph.v1";
import type { TheoryCalculatorLoadoutItemV1 } from "../../contracts/theory-calculator-loadout.v1";
import { buildAstrochemistryPrebioticTheoryBadgesV1 } from "../astrochemistry-prebiotic-theory-badges";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildTheoryCalculatorLoadout } from "../theory-calculator-loadout";

describe("astrochemistry/prebiotic theory badges", () => {
  it("adds the prebiotic bridge branch to the main graph", () => {
    const branch = buildAstrochemistryPrebioticTheoryBadgesV1();
    const graph = buildNhm2TheoryBadgeGraphV1();
    const branchBadgeIds = branch.badges.map((badge: TheoryBadgeV1) => badge.id);
    const graphBadgeIds = graph.badges.map((badge: TheoryBadgeV1) => badge.id);

    expect(branchBadgeIds).toContain("astrochemistry.aromatic_carbon.interstellar_context");
    expect(branchBadgeIds).toContain("astrochemistry.fullerene.c60_stellar_context");
    expect(branchBadgeIds).toContain("prebiotic.aromatic_ring.coupled_oscillator_context");
    expect(branchBadgeIds).toContain("prebiotic.rna_world.ribozyme_context");
    expect(branchBadgeIds).toContain("biophysics.membrane.open_system_entropy_flow");
    expect(branchBadgeIds).toContain("orch_or.claim_boundary.prebiotic_consciousness_exploratory_only");

    expect(graphBadgeIds).toContain("astrochemistry.fullerene.c60_stellar_context");
    expect(graphBadgeIds).toContain("orch_or.claim_boundary.prebiotic_consciousness_exploratory_only");
    expect(isTheoryBadgeGraphV1(graph)).toBe(true);
  });

  it("exposes the scalar calculator loadout rows", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: [
        "astrochemistry.fullerene.c60_stellar_context",
        "prebiotic.aromatic_ring.coupled_oscillator_context",
        "biophysics.membrane.open_system_entropy_flow",
      ],
      mode: "selected_badges",
      source: "achievement_map",
      includeContextItems: true,
    });

    const solveExpressions = loadout.items.map((item: TheoryCalculatorLoadoutItemV1) => item.solveExpression);

    expect(solveExpressions).toContain("f_C60_Hz = c/lambda_C60_m");
    expect(solveExpressions).toContain("E_C60_J = h*f_C60_Hz");
    expect(solveExpressions).toContain("delta_omega_rad_s = abs(omega_1_rad_s - omega_2_rad_s)");
    expect(solveExpressions).toContain("dS_system_dt = sigma_entropy_production + Phi_entropy_flow");
  });

  it("keeps every new row under a strict diagnostic boundary", () => {
    const branch = buildAstrochemistryPrebioticTheoryBadgesV1();

    for (const badge of branch.badges) {
      expect(badge.claimBoundary.diagnosticOnly).toBe(true);
      expect(badge.claimBoundary.doesValidateNHM2).toBe(false);
      expect(badge.claimBoundary.validationClaimAllowed).toBe(false);
      expect(badge.claimBoundary.physicalMechanismClaimAllowed).toBe(false);
      expect(badge.claimBoundary.promotionAllowed).toBe(false);
    }
  });

  it("keeps C60 and coupled-ring rows dimensionally inspectable", () => {
    const branch = buildAstrochemistryPrebioticTheoryBadgesV1();
    const byId = new Map(branch.badges.map((badge: TheoryBadgeV1) => [badge.id, badge]));

    expect(byId.get("astrochemistry.fullerene.c60_stellar_context")?.units).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: "lambda_C60_m", dimensionSignature: "L" }),
        expect.objectContaining({ symbol: "f_C60_Hz", dimensionSignature: "T^-1" }),
        expect.objectContaining({ symbol: "E_C60_J", dimensionSignature: "M L^2 T^-2" }),
      ]),
    );
    expect(byId.get("prebiotic.aromatic_ring.coupled_oscillator_context")?.units).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: "delta_omega_rad_s", dimensionSignature: "T^-1" }),
        expect.objectContaining({ symbol: "N_rings", dimensionSignature: "1" }),
      ]),
    );
  });

  it("allows Orch-OR adjacency only through an exploratory boundary", () => {
    const branch = buildAstrochemistryPrebioticTheoryBadgesV1();
    const prebioticPrefixes = ["astrochemistry.", "prebiotic.", "biophysics."];
    const forbiddenTargets = new Set([
      "orch_or.microtubule.coherence_window",
      "orch_or.gamma_synchrony.frequency_locking",
      "orch_or.time_crystal.temporal_order_gate",
    ]);
    const directForbiddenEdges = branch.edges.filter(
      (edge: TheoryBadgeEdgeV1) =>
        prebioticPrefixes.some((prefix: string) => edge.from.startsWith(prefix)) && forbiddenTargets.has(edge.to),
    );

    expect(directForbiddenEdges).toEqual([]);
    expect(branch.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "orch_or.claim_boundary.prebiotic_consciousness_exploratory_only",
          to: "orch_or.claim_boundary.exploratory_only",
          relation: "documents",
        }),
      ]),
    );
  });

  it("does not emit forbidden overclaiming language", () => {
    const branch = buildAstrochemistryPrebioticTheoryBadgesV1();

    expect(JSON.stringify(branch)).not.toMatch(
      /buckyballs caused life|pleasure optimization is a law|OR validated|consciousness validated|wavefunction-collapse biology validated|dopamine is a PAH/i,
    );
  });
});
