import { describe, expect, it } from "vitest";
import {
  isTheoryBadgeGraphV1,
  type TheoryBadgeV1,
} from "../../contracts/theory-badge-graph.v1";
import type { TheoryCalculatorLoadoutItemV1 } from "../../contracts/theory-calculator-loadout.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildPreboundaryBioenergeticsTheoryBadgesV1 } from "../preboundary-bioenergetics-theory-badges";
import { buildTheoryCalculatorLoadout } from "../theory-calculator-loadout";

describe("pre-boundary bioenergetics theory badges", () => {
  it("adds pre-boundary and origin-of-life condition rows to the main graph", () => {
    const branch = buildPreboundaryBioenergeticsTheoryBadgesV1();
    const graph = buildNhm2TheoryBadgeGraphV1();
    const branchBadgeIds = branch.badges.map((badge: TheoryBadgeV1) => badge.id);
    const graphBadgeIds = graph.badges.map((badge: TheoryBadgeV1) => badge.id);

    expect(branchBadgeIds).toEqual(
      expect.arrayContaining([
        "bio.preboundary.energy_entropy_gradient",
        "bio.preboundary.nonequilibrium_flux",
        "bio.origin.alkaline_vent_proton_gradient",
        "bio.origin.inorganic_compartment_barrier",
        "bio.origin.local_concentration_before_replication",
        "bio.thermo.microbial_growth_entropy_boundary",
        "bio.consciousness.orch_or_frontier_context",
      ]),
    );

    expect(graphBadgeIds).toEqual(expect.arrayContaining(branchBadgeIds));
    expect(isTheoryBadgeGraphV1(graph)).toBe(true);
  });

  it("exposes calculator loadouts for the scalar condition badges", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: [
        "bio.preboundary.energy_entropy_gradient",
        "bio.preboundary.nonequilibrium_flux",
        "bio.origin.alkaline_vent_proton_gradient",
        "bio.origin.local_concentration_before_replication",
      ],
      mode: "selected_badges",
      source: "achievement_map",
      variableBindings: {
        T_hot: "5778",
        T_cold: "3",
        J: "2",
        Delta_mu: "5",
        pH_alkaline: "11",
        pH_ocean: "6",
        concentration_factor: "20",
        C_bulk: "0.01",
      },
      includeContextItems: false,
    });

    const solveExpressions = loadout.items.map((item: TheoryCalculatorLoadoutItemV1) => item.solveExpression);

    expect(solveExpressions).toContain("Delta_T = 5778 - 3");
    expect(solveExpressions).toContain("Phi = 2 * 5");
    expect(solveExpressions).toContain("delta_pH = 11 - 6");
    expect(solveExpressions).toContain("C_local = 20 * 0.01");
  });

  it("keeps every new row under strict diagnostic boundaries", () => {
    const branch = buildPreboundaryBioenergeticsTheoryBadgesV1();

    for (const badge of branch.badges) {
      expect(badge.claimBoundary.diagnosticOnly).toBe(true);
      expect(badge.claimBoundary.doesValidateNHM2).toBe(false);
      expect(badge.claimBoundary.validationClaimAllowed).toBe(false);
      expect(badge.claimBoundary.physicalMechanismClaimAllowed).toBe(false);
      expect(badge.claimBoundary.promotionAllowed).toBe(false);
    }
  });

  it("anchors the paper references and blocks overclaiming shortcuts", () => {
    const branch = buildPreboundaryBioenergeticsTheoryBadgesV1();
    const serialized = JSON.stringify(branch);

    expect(serialized).toContain("10.1007/s10701-018-0162-3");
    expect(serialized).toContain("10.1007/s00239-014-9658-4");
    expect(serialized).toContain("S0005272899000651");
    expect(serialized).toContain("24070914");
    expect(serialized).not.toMatch(
      /gradient proves life|vent proves abiogenesis|negative entropy explains life|Orch OR is the root|objective collapse confirmed|consciousness validated/i,
    );
  });

  it("connects downstream without skipping into consciousness or proof claims", () => {
    const branch = buildPreboundaryBioenergeticsTheoryBadgesV1();

    expect(branch.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "bio.preboundary.energy_entropy_gradient",
          to: "bio.preboundary.nonequilibrium_flux",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "bio.origin.local_concentration_before_replication",
          to: "prebiotic.rna_world.ribozyme_context",
          relation: "bounds",
        }),
        expect.objectContaining({
          from: "bio.thermo.microbial_growth_entropy_boundary",
          to: "bio.preboundary.energy_entropy_gradient",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "bio.consciousness.orch_or_frontier_context",
          to: "orch_or.microtubule.coherence_window",
          relation: "documents",
        }),
      ]),
    );
  });
});
