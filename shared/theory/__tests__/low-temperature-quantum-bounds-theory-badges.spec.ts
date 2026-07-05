import { describe, expect, it } from "vitest";
import {
  isTheoryBadgeGraphV1,
  type TheoryBadgeV1,
} from "../../contracts/theory-badge-graph.v1";
import type { TheoryCalculatorLoadoutItemV1 } from "../../contracts/theory-calculator-loadout.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildLowTemperatureQuantumBoundsTheoryBadgesV1 } from "../low-temperature-quantum-bounds-theory-badges";
import { buildTheoryCalculatorLoadout } from "../theory-calculator-loadout";

describe("low-temperature quantum bounds theory badges", () => {
  it("adds all low-temperature quantum-bound rows to the main graph", () => {
    const branch = buildLowTemperatureQuantumBoundsTheoryBadgesV1();
    const graph = buildNhm2TheoryBadgeGraphV1();
    const branchBadgeIds = branch.badges.map((badge: TheoryBadgeV1) => badge.id);
    const graphBadgeIds = graph.badges.map((badge: TheoryBadgeV1) => badge.id);

    expect(branchBadgeIds).toEqual(
      expect.arrayContaining([
        "low_temp.temperature.thermal_energy_not_pressure",
        "low_temp.third_law.absolute_zero_unattainable",
        "low_temp.quantum.zero_point_energy_floor",
        "low_temp.radiation.thermal_population_floor",
        "low_temp.bose.phase_space_density_threshold",
        "low_temp.superfluid.helium_rollin_film_boundary",
        "low_temp.casimir.boundary_stress_not_temperature",
        "low_temp.superconductivity.zero_dc_resistance_bounds",
        "low_temp.qft.virtual_particle_propagator_boundary",
      ]),
    );

    expect(graphBadgeIds).toEqual(expect.arrayContaining(branchBadgeIds));
    expect(isTheoryBadgeGraphV1(graph)).toBe(true);
  });

  it("uses neutral procedural titles while keeping corrections in boundary notes", () => {
    const branch = buildLowTemperatureQuantumBoundsTheoryBadgesV1();
    const titles = branch.badges.map((badge) => badge.title);

    expect(titles).toEqual(
      expect.arrayContaining([
        "Thermodynamic Temperature Scale",
        "Third-Law Cooling Limit",
        "Quantum Ground-State Energy Floor",
        "Thermal Occupation Suppression",
        "Bosonic Phase-Space Degeneracy",
        "Helium-II Superfluid Surface Flow",
        "Boundary-Induced Vacuum Stress",
        "Superconducting Critical Surface",
        "Off-Shell Propagator Boundary",
      ]),
    );
    expect(titles).not.toEqual(
      expect.arrayContaining([
        "Temperature Is Thermal Energy Scale, Not Pressure",
        "Absolute Zero Is an Unattainable Limit",
        "Ground State Is Not Zero Energy",
        "Thermal Radiation Vanishes, Vacuum Structure Remains",
        "Superfluid Helium Is Not Ordinary BEC Bowl Magic",
        "Casimir Stress Is Not Temperature",
        "Superconducting Zero DC Resistance Is Bounded",
        "Virtual Particles Are Propagator Terms",
      ]),
    );
  });

  it("exposes calculator loadouts for scalar low-temperature bounds", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: [
        "low_temp.temperature.thermal_energy_not_pressure",
        "low_temp.third_law.absolute_zero_unattainable",
        "low_temp.quantum.zero_point_energy_floor",
        "low_temp.radiation.thermal_population_floor",
        "low_temp.bose.phase_space_density_threshold",
        "low_temp.superfluid.helium_rollin_film_boundary",
        "low_temp.casimir.boundary_stress_not_temperature",
        "low_temp.superconductivity.zero_dc_resistance_bounds",
      ],
      mode: "selected_badges",
      source: "achievement_map",
      variableBindings: {
        k_B: "1.380649e-23",
        T: "2",
        T_floor: "0",
        hbar: "1.054e-34",
        omega: "6",
        h: "6.626e-34",
        nu: "1000000000",
        phase_space_density: "3",
        T_lambda: "2.17",
        pi2_hbar_c: "3.121e-25",
        a4: "1e-24",
        T_c: "9",
        J_c: "100",
        J: "40",
        B_c: "3",
        B: "1",
      },
      includeContextItems: false,
    });

    const solveExpressions = loadout.items.map((item: TheoryCalculatorLoadoutItemV1) => item.solveExpression);

    expect(solveExpressions).toContain("thermal_energy = 1.380649e-23 * 2");
    expect(solveExpressions).toContain("cooling_gap = 2 - 0");
    expect(solveExpressions).toContain("E_0 = 1.054e-34 * 6 / 2");
    expect(solveExpressions).toContain("thermal_scale = 6.626e-34 * 1000000000/(1.380649e-23 * 2)");
    expect(solveExpressions).toContain("bec_margin = 3 - 2.612");
    expect(solveExpressions).toContain("lambda_margin = 2.17 - 2");
    expect(solveExpressions).toContain("P_casimir = -3.121e-25 / (240 * 1e-24)");
    expect(solveExpressions).toContain("T_margin = 9 - 2");
    expect(solveExpressions).toContain("J_margin = 100 - 40");
    expect(solveExpressions).toContain("B_margin = 3 - 1");
  });

  it("keeps every new badge diagnostic-only", () => {
    const branch = buildLowTemperatureQuantumBoundsTheoryBadgesV1();

    for (const badge of branch.badges) {
      expect(badge.claimBoundary.diagnosticOnly).toBe(true);
      expect(badge.claimBoundary.doesValidateNHM2).toBe(false);
      expect(badge.claimBoundary.validationClaimAllowed).toBe(false);
      expect(badge.claimBoundary.physicalMechanismClaimAllowed).toBe(false);
      expect(badge.claimBoundary.promotionAllowed).toBe(false);
    }
  });

  it("anchors the attached research links", () => {
    const branch = buildLowTemperatureQuantumBoundsTheoryBadgesV1();
    const serialized = JSON.stringify(branch);

    expect(serialized).toContain("https://www.bipm.org/en/si-base-units/kelvin");
    expect(serialized).toContain("https://www.nature.com/articles/ncomms14538");
    expect(serialized).toContain("https://www.nist.gov/publications/observation-bose-einstein-condensation");
    expect(serialized).toContain("10.1103/PhysRev.79.626");
    expect(serialized).toContain("10.1103/PhysRev.76.1209");
    expect(serialized).toContain("Casimir1948.pdf");
    expect(serialized).toContain("Casimir-Review.pdf");
    expect(serialized).toContain("10.1103/PhysRev.108.1175");
    expect(serialized).toContain("nistir3977.pdf");
    expect(serialized).toContain("QUANTUM%20ELECTRODYNAMICS.pdf");
    expect(serialized).toContain("10.1103/PhysRevD.35.1");
  });

  it("connects the requested low-temperature reasoning path and boundary edges", () => {
    const branch = buildLowTemperatureQuantumBoundsTheoryBadgesV1();

    expect(branch.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "low_temp.temperature.thermal_energy_not_pressure",
          to: "low_temp.third_law.absolute_zero_unattainable",
          claimBoundaryNote: "Pressure does not define temperature.",
        }),
        expect.objectContaining({
          from: "low_temp.third_law.absolute_zero_unattainable",
          to: "low_temp.quantum.zero_point_energy_floor",
          claimBoundaryNote: "Absolute zero is not nothing.",
        }),
        expect.objectContaining({
          from: "low_temp.quantum.zero_point_energy_floor",
          to: "low_temp.radiation.thermal_population_floor",
          claimBoundaryNote: "Zero-point energy is not heat.",
        }),
        expect.objectContaining({
          from: "low_temp.quantum.zero_point_energy_floor",
          to: "low_temp.casimir.boundary_stress_not_temperature",
          claimBoundaryNote: "Casimir pressure is not temperature.",
        }),
        expect.objectContaining({
          from: "low_temp.bose.phase_space_density_threshold",
          to: "low_temp.superfluid.helium_rollin_film_boundary",
          claimBoundaryNote: "Superfluid helium does not violate gravity.",
        }),
        expect.objectContaining({
          from: "low_temp.quantum.zero_point_energy_floor",
          to: "low_temp.superconductivity.zero_dc_resistance_bounds",
          claimBoundaryNote: "Superconductivity is not zero AC impedance.",
        }),
        expect.objectContaining({
          from: "low_temp.qft.virtual_particle_propagator_boundary",
          to: "low_temp.casimir.boundary_stress_not_temperature",
          claimBoundaryNote: "Virtual particles do not prove spacetime foam.",
        }),
      ]),
    );
  });

  it("does not encode forbidden low-temperature overclaims", () => {
    const branch = buildLowTemperatureQuantumBoundsTheoryBadgesV1();
    const serialized = JSON.stringify(branch);

    expect(serialized).not.toMatch(
      /absolute zero means nothing exists|pressure defines temperature|zero point energy is heat|Casimir pressure is temperature|virtual particles prove vacuum foam|superconductors have zero impedance|superfluid helium violates gravity/i,
    );
  });
});
