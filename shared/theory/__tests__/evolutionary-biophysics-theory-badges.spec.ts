import { describe, expect, it } from "vitest";
import {
  isTheoryBadgeGraphV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../../contracts/theory-badge-graph.v1";
import type { TheoryCalculatorLoadoutItemV1 } from "../../contracts/theory-calculator-loadout.v1";
import { buildEvolutionaryBiophysicsTheoryBadgesV1 } from "../evolutionary-biophysics-theory-badges";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildTheoryCalculatorLoadout } from "../theory-calculator-loadout";

describe("evolutionary biophysics theory badges", () => {
  it("adds the evolutionary biophysics branch to the main graph", () => {
    const branch = buildEvolutionaryBiophysicsTheoryBadgesV1();
    const graph = buildNhm2TheoryBadgeGraphV1();
    const branchBadgeIds = branch.badges.map((badge: TheoryBadgeV1) => badge.id);
    const graphBadgeIds = graph.badges.map((badge: TheoryBadgeV1) => badge.id);

    expect(branchBadgeIds).toContain("biology.evolution.common_descent_phylogeny_context");
    expect(branchBadgeIds).toContain("biology.evolution.selection_fitness_context");
    expect(branchBadgeIds).toContain("biology.kingdoms.eukaryotic_trait_matrix");
    expect(branchBadgeIds).toContain("eukaryote.cytoskeleton.microtubule_conserved_scaffold");
    expect(branchBadgeIds).toContain("plant.photosynthesis.light_harvesting_exciton_context");
    expect(branchBadgeIds).toContain("plant.photosynthesis.coherence_lifetime_gate");
    expect(branchBadgeIds).toContain("animal.neural.consciousness_evolution_context");
    expect(branchBadgeIds).toContain("consciousness.claim_boundary.evolutionary_biology_context_only");

    expect(graphBadgeIds).toContain("biology.kingdoms.eukaryotic_trait_matrix");
    expect(graphBadgeIds).toContain("plant.photosynthesis.coherence_lifetime_gate");
    expect(graphBadgeIds).toContain("consciousness.claim_boundary.evolutionary_biology_context_only");
    expect(isTheoryBadgeGraphV1(graph)).toBe(true);
  });

  it("exposes the scalar calculator loadout rows", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: [
        "biology.evolution.selection_fitness_context",
        "plant.photosynthesis.light_harvesting_exciton_context",
        "plant.photosynthesis.coherence_lifetime_gate",
      ],
      mode: "selected_badges",
      source: "achievement_map",
      includeContextItems: true,
    });

    const solveExpressions = loadout.items.map((item: TheoryCalculatorLoadoutItemV1) => item.solveExpression);

    expect(solveExpressions).toContain(
      "mean_trait_change = covariance_fitness_trait/mean_fitness + expected_fitness_transmission_change/mean_fitness",
    );
    expect(solveExpressions).toContain("exciton_frequency_Hz = c/lambda_abs_m");
    expect(solveExpressions).toContain("exciton_energy_J = h*exciton_frequency_Hz");
    expect(solveExpressions).toContain(
      "photosynthesis_transfer_efficiency = k_ET_s_inv/(k_ET_s_inv + k_loss_s_inv)",
    );
    expect(solveExpressions).toContain("photosynthesis_coherence_surplus_s = tau_coherence_s - tau_transfer_s");
  });

  it("keeps every biology bridge row under a strict diagnostic boundary", () => {
    const branch = buildEvolutionaryBiophysicsTheoryBadgesV1();

    for (const badge of branch.badges) {
      expect(badge.claimBoundary.diagnosticOnly).toBe(true);
      expect(badge.claimBoundary.doesValidateNHM2).toBe(false);
      expect(badge.claimBoundary.validationClaimAllowed).toBe(false);
      expect(badge.claimBoundary.physicalMechanismClaimAllowed).toBe(false);
      expect(badge.claimBoundary.promotionAllowed).toBe(false);
    }
  });

  it("keeps photosynthesis and selection rows dimensionally inspectable", () => {
    const branch = buildEvolutionaryBiophysicsTheoryBadgesV1();
    const byId = new Map(branch.badges.map((badge: TheoryBadgeV1) => [badge.id, badge]));

    expect(byId.get("biology.evolution.selection_fitness_context")?.units).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: "covariance_fitness_trait", dimensionSignature: "1" }),
        expect.objectContaining({ symbol: "mean_fitness", dimensionSignature: "1" }),
        expect.objectContaining({ symbol: "mean_trait_change", dimensionSignature: "1" }),
      ]),
    );
    expect(byId.get("plant.photosynthesis.light_harvesting_exciton_context")?.units).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: "lambda_abs_m", dimensionSignature: "L" }),
        expect.objectContaining({ symbol: "exciton_frequency_Hz", dimensionSignature: "T^-1" }),
        expect.objectContaining({ symbol: "exciton_energy_J", dimensionSignature: "M L^2 T^-2" }),
        expect.objectContaining({ symbol: "photosynthesis_transfer_efficiency", dimensionSignature: "1" }),
      ]),
    );
    expect(byId.get("plant.photosynthesis.coherence_lifetime_gate")?.units).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: "tau_coherence_s", dimensionSignature: "T" }),
        expect.objectContaining({ symbol: "tau_transfer_s", dimensionSignature: "T" }),
        expect.objectContaining({ symbol: "photosynthesis_coherence_surplus_s", dimensionSignature: "T" }),
      ]),
    );
  });

  it("does not create direct consciousness-validation shortcuts", () => {
    const branch = buildEvolutionaryBiophysicsTheoryBadgesV1();
    const forbiddenRelations = new Set(["derives", "diagnostic_checks"]);
    const forbiddenDirectEdges = branch.edges.filter(
      (edge: TheoryBadgeEdgeV1) =>
        forbiddenRelations.has(edge.relation) &&
        (edge.to.includes("consciousness") || edge.to.includes("orch_or")),
    );

    expect(forbiddenDirectEdges).toEqual([]);
    expect(branch.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "consciousness.claim_boundary.evolutionary_biology_context_only",
          to: "orch_or.claim_boundary.exploratory_only",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "plant.photosynthesis.coherence_lifetime_gate",
          to: "consciousness.claim_boundary.evolutionary_biology_context_only",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "eukaryote.cytoskeleton.microtubule_conserved_scaffold",
          to: "consciousness.claim_boundary.evolutionary_biology_context_only",
          relation: "blocks",
        }),
      ]),
    );
  });

  it("does not emit forbidden overclaiming language", () => {
    const branch = buildEvolutionaryBiophysicsTheoryBadgesV1();

    expect(JSON.stringify(branch)).not.toMatch(
      /plants are conscious|photosynthesis proves consciousness|microtubules validate Orch-OR|objective collapse in plants|kingdom consciousness confirmed|plant consciousness confirmed/i,
    );
  });
});
