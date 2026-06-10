import { describe, expect, it } from "vitest";
import {
  isTheoryBadgeGraphV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../../contracts/theory-badge-graph.v1";
import type { TheoryCalculatorLoadoutItemV1 } from "../../contracts/theory-calculator-loadout.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildRelativityHistoryTheoryBadgesV1 } from "../relativity-history-theory-badges";
import { buildTheoryCalculatorLoadout } from "../theory-calculator-loadout";

describe("relativity history theory badges", () => {
  it("adds the relativity experiment constraint branch to the main graph", () => {
    const branch = buildRelativityHistoryTheoryBadgesV1();
    const graph = buildNhm2TheoryBadgeGraphV1();
    const branchBadgeIds = branch.badges.map((badge: TheoryBadgeV1) => badge.id);
    const graphBadgeIds = graph.badges.map((badge: TheoryBadgeV1) => badge.id);

    expect(branchBadgeIds).toContain("relativity.history.romer_io_light_time_delay");
    expect(branchBadgeIds).toContain("relativity.history.bradley_stellar_aberration");
    expect(branchBadgeIds).toContain("relativity.history.fizeau_wheel_terrestrial_c");
    expect(branchBadgeIds).toContain("relativity.history.foucault_medium_speed");
    expect(branchBadgeIds).toContain("relativity.history.fizeau_flowing_water_drag");
    expect(branchBadgeIds).toContain("relativity.history.michelson_morley_aether_null");
    expect(branchBadgeIds).toContain("relativity.history.trouton_noble_torque_null");
    expect(branchBadgeIds).toContain("relativity.lorentz.length_contraction_context");
    expect(branchBadgeIds).toContain("relativity.lorentz.transform_context");
    expect(branchBadgeIds).toContain("relativity.claim_boundary.historical_constraints_not_single_proof");

    expect(graphBadgeIds).toContain("relativity.history.romer_io_light_time_delay");
    expect(graphBadgeIds).toContain("relativity.history.michelson_morley_aether_null");
    expect(graphBadgeIds).toContain("relativity.lorentz.length_contraction_context");
    expect(graphBadgeIds).toContain("relativity.claim_boundary.historical_constraints_not_single_proof");
    expect(isTheoryBadgeGraphV1(graph)).toBe(true);
  });

  it("exposes scalar calculator rows for the experiment chain", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: [
        "relativity.history.romer_io_light_time_delay",
        "relativity.history.bradley_stellar_aberration",
        "relativity.history.fizeau_wheel_terrestrial_c",
        "relativity.history.foucault_medium_speed",
        "relativity.history.fizeau_flowing_water_drag",
        "relativity.history.michelson_morley_aether_null",
        "relativity.history.trouton_noble_torque_null",
        "relativity.lorentz.length_contraction_context",
        "relativity.lorentz.transform_context",
      ],
      mode: "selected_badges",
      source: "achievement_map",
      includeContextItems: true,
    });

    const solveExpressions = loadout.items.map((item: TheoryCalculatorLoadoutItemV1) => item.solveExpression);

    expect(solveExpressions).toContain("c_estimate_m_s = range_change_m/eclipse_delay_s");
    expect(solveExpressions).toContain("aberration_angle_rad = earth_orbital_speed_m_s/c");
    expect(solveExpressions).toContain("c_estimate_m_s = 2*path_length_m/light_round_trip_time_s");
    expect(solveExpressions).toContain("refractive_index = c/speed_medium_m_s");
    expect(solveExpressions).toContain(
      "fresnel_drag_speed_m_s = c/refractive_index + water_speed_m_s*(1 - 1/(refractive_index^2))",
    );
    expect(solveExpressions).toContain(
      "expected_fringe_shift = (2*arm_length_m/lambda_light_m)*(aether_speed_m_s^2/c^2)",
    );
    expect(solveExpressions).toContain(
      "trouton_expected_torque_N_m = -capacitor_energy_J*(aether_speed_m_s^2/c^2)*sin(2*plate_angle_rad)",
    );
    expect(solveExpressions).toContain("contracted_length_m = proper_length_m/gamma");
    expect(solveExpressions).toContain("x_prime_m = gamma*(x_m - v_m_s*t_s)");
    expect(solveExpressions).toContain("t_prime_s = gamma*(t_s - v_m_s*x_m/c^2)");
  });

  it("keeps every relativity-history row under a strict diagnostic boundary", () => {
    const branch = buildRelativityHistoryTheoryBadgesV1();

    for (const badge of branch.badges) {
      expect(badge.claimBoundary.diagnosticOnly).toBe(true);
      expect(badge.claimBoundary.doesValidateNHM2).toBe(false);
      expect(badge.claimBoundary.validationClaimAllowed).toBe(false);
      expect(badge.claimBoundary.physicalMechanismClaimAllowed).toBe(false);
      expect(badge.claimBoundary.promotionAllowed).toBe(false);
    }
  });

  it("keeps the historical constraint equations dimensionally inspectable", () => {
    const branch = buildRelativityHistoryTheoryBadgesV1();
    const byId = new Map(branch.badges.map((badge: TheoryBadgeV1) => [badge.id, badge]));

    expect(byId.get("relativity.history.romer_io_light_time_delay")?.units).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: "range_change_m", dimensionSignature: "L" }),
        expect.objectContaining({ symbol: "eclipse_delay_s", dimensionSignature: "T" }),
        expect.objectContaining({ symbol: "c_estimate_m_s", dimensionSignature: "L T^-1" }),
      ]),
    );
    expect(byId.get("relativity.history.michelson_morley_aether_null")?.units).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: "arm_length_m", dimensionSignature: "L" }),
        expect.objectContaining({ symbol: "aether_speed_m_s", dimensionSignature: "L T^-1" }),
        expect.objectContaining({ symbol: "expected_fringe_shift", dimensionSignature: "1" }),
      ]),
    );
    expect(byId.get("relativity.lorentz.length_contraction_context")?.units).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: "proper_length_m", dimensionSignature: "L" }),
        expect.objectContaining({ symbol: "gamma", dimensionSignature: "1" }),
        expect.objectContaining({ symbol: "contracted_length_m", dimensionSignature: "L" }),
      ]),
    );
  });

  it("connects experiments as constraints without validation shortcuts", () => {
    const branch = buildRelativityHistoryTheoryBadgesV1();
    const forbiddenEdges = branch.edges.filter(
      (edge: TheoryBadgeEdgeV1) =>
        edge.relation === "derives" ||
        edge.relation === "diagnostic_checks" ||
        edge.to === "nhm2.claim_boundary.diagnostic_only",
    );

    expect(forbiddenEdges).toEqual([]);
    expect(branch.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "relativity.history.michelson_morley_aether_null",
          to: "relativity.lorentz.length_contraction_context",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "physics.frames.lorentz_factor",
          to: "relativity.lorentz.length_contraction_context",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "relativity.history.michelson_morley_aether_null",
          to: "relativity.claim_boundary.historical_constraints_not_single_proof",
          relation: "blocks",
        }),
      ]),
    );
  });

  it("does not emit forbidden overclaiming language", () => {
    const branch = buildRelativityHistoryTheoryBadgesV1();

    expect(JSON.stringify(branch)).not.toMatch(
      /single experiment proved relativity|Michelson-Morley proved relativity|Trouton-Noble proved relativity|validated NHM2|working warp drive|physical mechanism confirmed|aether drift confirmed/i,
    );
  });
});
