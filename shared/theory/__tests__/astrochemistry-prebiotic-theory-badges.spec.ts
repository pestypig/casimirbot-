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
    expect(branchBadgeIds).toContain("astrochemistry.complex_organics.dense_source_inventory_context");
    expect(branchBadgeIds).toContain("astrochemistry.gas_grain.ice_mantle_formation_context");
    expect(branchBadgeIds).toContain("astrochemistry.source_class.chemical_differentiation_context");
    expect(branchBadgeIds).toContain("astrochemistry.claim_boundary.spectral_model_inference_only");
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
    expect(graphBadgeIds).toContain("astrochemistry.complex_organics.dense_source_inventory_context");
    expect(graphBadgeIds).toContain("astrochemistry.claim_boundary.spectral_model_inference_only");
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
        "astrochemistry.complex_organics.dense_source_inventory_context",
        "astrochemistry.gas_grain.ice_mantle_formation_context",
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
    expect(solveExpressions).toContain("X_mol = N_mol_cm2/N_H2_cm2");
    expect(solveExpressions).toContain("R_CH3OH_H2O = X_CH3OH_ice/X_H2O_ice");
    expect(solveExpressions).toContain("photon_fluence_m2 = photon_flux_m2_s*t_exposure_s");
    expect(solveExpressions).toContain("delta_omega_rad_s = abs(omega_1_rad_s - omega_2_rad_s)");
    expect(solveExpressions).toContain("coherence_surplus_s = tau_coherence_s - tau_candidate_s");
    expect(solveExpressions).toContain("dS_system_dt = sigma_entropy_production + Phi_entropy_flow");
  });

  it("represents Herbst and van Dishoeck as source-conditioned evidence rather than a new axiom", () => {
    const branch = buildAstrochemistryPrebioticTheoryBadgesV1();
    const byId = new Map(branch.badges.map((badge: TheoryBadgeV1) => [badge.id, badge]));
    const inventory = byId.get("astrochemistry.complex_organics.dense_source_inventory_context");
    const ice = byId.get("astrochemistry.gas_grain.ice_mantle_formation_context");
    const sourceClass = byId.get("astrochemistry.source_class.chemical_differentiation_context");
    const boundary = byId.get("astrochemistry.claim_boundary.spectral_model_inference_only");

    expect(inventory?.level).toBe("model");
    expect(inventory?.status).toBe("diagnostic");
    expect(inventory?.sourceRefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "literature_ref", id: "doi:10.1146/annurev-astro-082708-101654" }),
      ]),
    );
    expect(inventory?.equations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "complex_organic_fractional_abundance",
          computableExpression: "X_mol = N_mol_cm2/N_H2_cm2",
        }),
      ]),
    );
    expect(ice?.equations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ice_mantle_methanol_water_ratio",
          computableExpression: "R_CH3OH_H2O = X_CH3OH_ice/X_H2O_ice",
        }),
      ]),
    );
    expect(sourceClass?.level).toBe("diagnostic_gate");
    expect(boundary?.level).toBe("claim_boundary");
    expect(boundary?.status).toBe("blocked");
    expect(boundary?.assumptions.join(" ")).toMatch(/model-conditioned evidence/i);
  });

  it("wires complex organic evidence through source-class and spectral inference boundaries", () => {
    const branch = buildAstrochemistryPrebioticTheoryBadgesV1();

    expect(branch.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "astrochemistry.aromatic_carbon.interstellar_context",
          to: "astrochemistry.complex_organics.dense_source_inventory_context",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "astrochemistry.complex_organics.dense_source_inventory_context",
          to: "astrochemistry.source_class.chemical_differentiation_context",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "astrochemistry.complex_organics.dense_source_inventory_context",
          to: "astrochemistry.claim_boundary.spectral_model_inference_only",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "astrochemistry.gas_grain.ice_mantle_formation_context",
          to: "prebiotic.inventory.meteoritic_organics_context",
          relation: "bounds",
        }),
        expect.objectContaining({
          from: "astrochemistry.source_class.chemical_differentiation_context",
          to: "astrochemistry.claim_boundary.spectral_model_inference_only",
          relation: "blocks",
        }),
      ]),
    );
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
    expect(byId.get("astrochemistry.complex_organics.dense_source_inventory_context")?.units).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: "N_mol_cm2", dimensionSignature: "L^-2" }),
        expect.objectContaining({ symbol: "X_mol", dimensionSignature: "1" }),
      ]),
    );
    expect(byId.get("astrochemistry.gas_grain.ice_mantle_formation_context")?.units).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: "X_CH3OH_ice", dimensionSignature: "1" }),
        expect.objectContaining({ symbol: "R_CH3OH_H2O", dimensionSignature: "1" }),
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
      /buckyballs caused life|complex organics prove life|ice mantles prove abiogenesis|spectra prove consciousness|pleasure optimization is a law|OR validated|consciousness validated|wavefunction-collapse biology validated|PAHs become dopamine|PAH chemistry proves reward/i,
    );
  });
});
