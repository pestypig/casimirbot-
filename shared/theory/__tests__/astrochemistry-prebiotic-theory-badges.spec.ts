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
    expect(branchBadgeIds).toContain("astrochemistry.pah.spectral_family_context");
    expect(branchBadgeIds).toContain("prebiotic.inventory.meteoritic_organics_context");
    expect(branchBadgeIds).toContain("prebiotic.photochemistry.radiation_processing_context");
    expect(branchBadgeIds).toContain("prebiotic.surface_catalysis.mineral_aqueous_context");
    expect(branchBadgeIds).toContain("prebiotic.aromatic_ring.coupled_oscillator_context");
    expect(branchBadgeIds).toContain("prebiotic.coherence.decoherence_lifetime_gate");
    expect(branchBadgeIds).toContain("prebiotic.rna_world.ribozyme_context");
    expect(branchBadgeIds).toContain("prebiotic.claim_boundary.dopamine_not_pah_shortcut");
    expect(branchBadgeIds).toContain("biophysics.membrane.open_system_entropy_flow");
    expect(branchBadgeIds).toContain("orch_or.claim_boundary.prebiotic_consciousness_exploratory_only");

    expect(graphBadgeIds).toContain("stellar.nucleosynthesis.reaction_network_context");
    expect(graphBadgeIds).toContain("astrochemistry.fullerene.c60_stellar_context");
    expect(graphBadgeIds).toContain("prebiotic.inventory.meteoritic_organics_context");
    expect(graphBadgeIds).toContain("prebiotic.claim_boundary.dopamine_not_pah_shortcut");
    expect(graphBadgeIds).toContain("orch_or.claim_boundary.prebiotic_consciousness_exploratory_only");
    expect(isTheoryBadgeGraphV1(graph)).toBe(true);
  });

  it("exposes the scalar calculator loadout rows", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: [
        "astrochemistry.fullerene.c60_stellar_context",
        "astrochemistry.pah.spectral_family_context",
        "prebiotic.photochemistry.radiation_processing_context",
        "prebiotic.aromatic_ring.coupled_oscillator_context",
        "prebiotic.coherence.decoherence_lifetime_gate",
        "biophysics.membrane.open_system_entropy_flow",
      ],
      mode: "selected_badges",
      source: "achievement_map",
      includeContextItems: true,
    });

    const solveExpressions = loadout.items.map((item: TheoryCalculatorLoadoutItemV1) => item.solveExpression);

    expect(solveExpressions).toContain("f_C60_Hz = c/lambda_C60_m");
    expect(solveExpressions).toContain("E_C60_J = h*f_C60_Hz");
    expect(solveExpressions).toContain("E_PAH_J = h*c/lambda_PAH_m");
    expect(solveExpressions).toContain("photon_fluence_m2 = photon_flux_m2_s*t_exposure_s");
    expect(solveExpressions).toContain("delta_omega_rad_s = abs(omega_1_rad_s - omega_2_rad_s)");
    expect(solveExpressions).toContain("coherence_surplus_s = tau_coherence_s - tau_candidate_s");
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

  it("anchors the stellar chemical inheritance root without promoting biology or consciousness", () => {
    const branch = buildAstrochemistryPrebioticTheoryBadgesV1();
    const graph = buildNhm2TheoryBadgeGraphV1();
    const byId = new Map(graph.badges.map((badge: TheoryBadgeV1) => [badge.id, badge]));
    const root = byId.get("stellar.nucleosynthesis.reaction_network_context");

    expect(root).toBeTruthy();
    expect(root?.level).toBe("first_principle");
    expect(root?.sourceRefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "literature_ref", id: "doi:10.1103/RevModPhys.29.547" }),
        expect.objectContaining({ path: "docs/knowledge/physics/stellar-chemical-inheritance.md" }),
      ]),
    );
    expect(root?.assumptions.join(" ")).toMatch(/do not certify life/i);
    expect(branch.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "stellar.nucleosynthesis.reaction_network_context",
          to: "astrochemistry.aromatic_carbon.interstellar_context",
          relation: "documents",
        }),
      ]),
    );
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
    expect(byId.get("prebiotic.photochemistry.radiation_processing_context")?.units).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: "photon_flux_m2_s", dimensionSignature: "L^-2 T^-1" }),
        expect.objectContaining({ symbol: "photon_fluence_m2", dimensionSignature: "L^-2" }),
      ]),
    );
    expect(byId.get("prebiotic.coherence.decoherence_lifetime_gate")?.units).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: "tau_coherence_s", dimensionSignature: "T" }),
        expect.objectContaining({ symbol: "coherence_surplus_s", dimensionSignature: "T" }),
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
          from: "prebiotic.claim_boundary.dopamine_not_pah_shortcut",
          to: "orch_or.claim_boundary.prebiotic_consciousness_exploratory_only",
          relation: "documents",
        }),
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
      /buckyballs caused life|pleasure optimization is a law|OR validated|consciousness validated|wavefunction-collapse biology validated|PAHs become dopamine|PAH chemistry proves reward/i,
    );
  });
});
