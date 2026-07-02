import { describe, expect, it } from "vitest";
import {
  isTheoryBadgeGraphV1,
  type TheoryBadgeV1,
} from "../../contracts/theory-badge-graph.v1";
import type { TheoryCalculatorLoadoutItemV1 } from "../../contracts/theory-calculator-loadout.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildTheoryCalculatorLoadout } from "../theory-calculator-loadout";
import { buildViabilityRegulationTheoryBadgesV1 } from "../viability-regulation-theory-badges";

describe("viability regulation theory badges", () => {
  it("adds the viability and regulation branch to the main graph", () => {
    const branch = buildViabilityRegulationTheoryBadgesV1();
    const graph = buildNhm2TheoryBadgeGraphV1();
    const branchBadgeIds = branch.badges.map((badge: TheoryBadgeV1) => badge.id);
    const graphBadgeIds = graph.badges.map((badge: TheoryBadgeV1) => badge.id);

    expect(branchBadgeIds).toEqual(
      expect.arrayContaining([
        "viability.regulation.viability_range_before_preference",
        "viability.regulation.homeostasis_constraint_maintenance",
        "viability.regulation.sensing_state_discrimination",
        "viability.regulation.membrane_potential_maintenance_signal",
        "viability.regulation.repair_cost_before_growth",
        "viability.regulation.perturbation_margin_before_response",
        "viability.regulation.claim_boundary.not_preference_agency_consciousness",
      ]),
    );

    expect(graphBadgeIds).toEqual(expect.arrayContaining(branchBadgeIds));
    expect(isTheoryBadgeGraphV1(graph)).toBe(true);
  });

  it("exposes calculator loadouts for all scalar regulation badges", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: [
        "viability.regulation.viability_range_before_preference",
        "viability.regulation.homeostasis_constraint_maintenance",
        "viability.regulation.sensing_state_discrimination",
        "viability.regulation.membrane_potential_maintenance_signal",
        "viability.regulation.repair_cost_before_growth",
        "viability.regulation.perturbation_margin_before_response",
      ],
      mode: "selected_badges",
      source: "achievement_map",
      variableBindings: {
        state: "8",
        setpoint: "5",
        measured_state: "4",
        signal: "12",
        noise: "3",
        V_inside: "-0.07",
        V_outside: "0",
        energy_available: "100",
        maintenance_cost: "35",
        tolerance: "10",
        deviation: "4",
      },
      includeContextItems: false,
    });

    const solveExpressions = loadout.items.map((item: TheoryCalculatorLoadoutItemV1) => item.solveExpression);

    expect(solveExpressions).toContain("viability_error = 8 - 5");
    expect(solveExpressions).toContain("homeostatic_error = 5 - 4");
    expect(solveExpressions).toContain("SNR = 12/3");
    expect(solveExpressions).toContain("Delta_V = -0.07 - 0");
    expect(solveExpressions).toContain("energy_surplus = 100 - 35");
    expect(solveExpressions).toContain("perturbation_margin = 10 - 4");
  });

  it("keeps every new row under strict diagnostic boundaries", () => {
    const branch = buildViabilityRegulationTheoryBadgesV1();

    for (const badge of branch.badges) {
      expect(badge.claimBoundary.diagnosticOnly).toBe(true);
      expect(badge.claimBoundary.doesValidateNHM2).toBe(false);
      expect(badge.claimBoundary.validationClaimAllowed).toBe(false);
      expect(badge.claimBoundary.physicalMechanismClaimAllowed).toBe(false);
      expect(badge.claimBoundary.promotionAllowed).toBe(false);
    }
  });

  it("anchors the requested research references", () => {
    const branch = buildViabilityRegulationTheoryBadgesV1();
    const serialized = JSON.stringify(branch);

    expect(serialized).toContain("PMC4166604");
    expect(serialized).toContain("rsfs.20220041");
    expect(serialized).toContain("S2405471221001599");
    expect(serialized).toContain("PMC8889180");
    expect(serialized).toContain("PMC3945014");
    expect(serialized).toContain("10.1073/pnas.0504321102");
    expect(serialized).toContain("PMC9507437");
    expect(serialized).toContain("22237730");
    expect(serialized).toContain("S0092867421002233");
    expect(serialized).toContain("10.1091/mbc.E23-08-0312");
    expect(serialized).toContain("PMC1915598");
    expect(serialized).toContain("10.3389/fmicb.2017.00031");
  });

  it("connects downstream of pre-boundary bioenergetics and blocks shortcut claims", () => {
    const branch = buildViabilityRegulationTheoryBadgesV1();

    expect(branch.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "bio.origin.local_concentration_before_replication",
          to: "viability.regulation.viability_range_before_preference",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "viability.regulation.homeostasis_constraint_maintenance",
          to: "viability.regulation.claim_boundary.not_preference_agency_consciousness",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "viability.regulation.sensing_state_discrimination",
          to: "viability.regulation.claim_boundary.not_preference_agency_consciousness",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "viability.regulation.membrane_potential_maintenance_signal",
          to: "viability.regulation.claim_boundary.not_preference_agency_consciousness",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "viability.regulation.repair_cost_before_growth",
          to: "viability.regulation.claim_boundary.not_preference_agency_consciousness",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "viability.regulation.perturbation_margin_before_response",
          to: "viability.regulation.claim_boundary.not_preference_agency_consciousness",
          relation: "blocks",
        }),
      ]),
    );
  });

  it("does not encode forbidden overclaims", () => {
    const branch = buildViabilityRegulationTheoryBadgesV1();
    const serialized = JSON.stringify(branch);

    expect(serialized).not.toMatch(
      /homeostasis proves preference|sensing proves consciousness|bioelectricity proves mind|repair cost proves growth success|perturbation response proves agency|viability validates moral claim/i,
    );
  });
});
