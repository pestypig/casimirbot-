import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateTheoryBadgeGraphV1 } from "../../contracts/theory-badge-graph.v1";
import type { TheoryBadgeLookupMatch } from "../theory-badge-overlap-locator";
import type { TheoryCalculatorLoadoutItemV1 } from "../../contracts/theory-calculator-loadout.v1";
import { buildCasimirCavityObjectBindings } from "../casimir-cavity-object-bindings";
import { buildCasimirCavityTheoryBadgesV1 } from "../casimir-cavity-theory-badges";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { locateTheoryBadges } from "../theory-badge-overlap-locator";
import { buildTheoryCalculatorLoadout } from "../theory-calculator-loadout";

describe("casimir cavity theory badges", () => {
  it("merges a validating Casimir cavity branch into the theory graph", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const badgeIds = graph.badges.map((badge) => badge.id);
    const casimirSeed = buildCasimirCavityTheoryBadgesV1();

    expect(validateTheoryBadgeGraphV1(graph)).toEqual([]);
    expect(casimirSeed.badges.length).toBeGreaterThanOrEqual(10);
    expect(badgeIds).toContain("casimir.cavity.parallel_plate_energy_density");
    expect(badgeIds).toContain("casimir.cavity.parallel_plate_pressure");
    expect(badgeIds).toContain("casimir.cavity.static_tile_budget");
    expect(badgeIds).toContain("casimir.tile.duty_budget");
    expect(badgeIds).toContain("casimir.material_receipts");
    expect(badgeIds).toContain("casimir.material.lifshitz_receipt");
    expect(badgeIds).toContain("casimir.geometry.beyond_pfa_validity");
    expect(badgeIds).toContain("casimir.geometry.finite_temperature_maxwell_stress");
    expect(badgeIds).toContain("casimir.cavity.mode_frequency");
    expect(badgeIds).toContain("casimir.claim_boundary.diagnostic_source_context");
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "casimir.geometry.beyond_pfa_validity",
          to: "casimir.material.lifshitz_receipt",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "casimir.material.lifshitz_receipt",
          to: "nhm2.closure.wall_t00_source_residual",
          relation: "diagnostic_checks",
        }),
        expect.objectContaining({
          from: "casimir.material.lifshitz_receipt",
          to: "casimir.geometry.finite_temperature_maxwell_stress",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "casimir.geometry.finite_temperature_maxwell_stress",
          to: "nhm2.closure.wall_t00_source_residual",
          relation: "diagnostic_checks",
        }),
      ]),
    );
    expect(JSON.stringify(graph)).not.toMatch(/Casimir proves propulsion|validated propulsion|confirmed physical mechanism/i);
  });

  it("locates Casimir cavity and tile budget prompts", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();

    const matches = locateTheoryBadges({
      graph,
      input: {
        query: "Casimir parallel plate gap tile energy budget cavity mode duty sector material lifshitz receipt",
        simulationOwners: ["casimir"],
        limit: 20,
      },
    });

    expect(matches.map((match: TheoryBadgeLookupMatch) => match.badgeId)).toContain(
      "casimir.cavity.parallel_plate_energy_density",
    );
    expect(matches.map((match: TheoryBadgeLookupMatch) => match.badgeId)).toContain("casimir.cavity.per_tile_energy");
    expect(matches.map((match: TheoryBadgeLookupMatch) => match.badgeId)).toContain("casimir.tile.duty_budget");
    expect(matches.map((match: TheoryBadgeLookupMatch) => match.badgeId)).toContain("casimir.material.lifshitz_receipt");
  });

  it("keeps finite-temperature Maxwell-stress evaluation receipt-backed and claim-safe", () => {
    const badge = buildCasimirCavityTheoryBadgesV1().badges.find(
      (candidate) => candidate.id === "casimir.geometry.finite_temperature_maxwell_stress",
    );

    expect(badge).toMatchObject({
      status: "blocked",
      level: "diagnostic_gate",
      calculatorPayloads: [],
      claimBoundary: {
        diagnosticOnly: true,
        doesValidateNHM2: false,
        validationClaimAllowed: false,
        physicalMechanismClaimAllowed: false,
        promotionAllowed: false,
      },
    });
    expect(badge?.equations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          computableExpression: null,
          operatorKind: "gate_status",
        }),
      ]),
    );
    expect(JSON.stringify(badge?.sourceRefs)).toMatch(/arxiv\.org\/abs\/2603\.03888/);
    expect(JSON.stringify(badge)).toMatch(/run-specific receipt/i);
    expect(JSON.stringify(badge)).toMatch(/cannot establish NHM2, propulsion, transport, route ETA, or certified-speed claims/i);
    for (const ref of badge?.sourceRefs.filter(
      (candidate) => candidate.kind === "repo_module" || candidate.kind === "artifact",
    ) ?? []) {
      expect(ref.path).toBeTruthy();
      expect(existsSync(ref.path ?? ""), String(ref.path)).toBe(true);
    }
  });

  it("builds a Casimir scalar loadout from selected badges", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: [
        "casimir.cavity.parallel_plate_energy_density",
        "casimir.cavity.per_tile_energy",
        "casimir.tile.duty_budget",
        "casimir.cavity.mode_frequency",
      ],
      mode: "selected_badges",
      objectContext: buildCasimirCavityObjectBindings({
        a: 1e-9,
        A_tile: 2.5e-3,
        E_area: -0.4333,
        d_burst: 0.12,
        d_cycle: 0.12,
        N_concurrent: 2,
        N_sector: 80,
        L: 0.01,
        n: 1,
      }),
      includeContextItems: false,
    });

    expect(loadout.objectContext?.kind).toBe("casimir_cavity_object");
    expect(loadout.items.map((item: TheoryCalculatorLoadoutItemV1) => item.expression)).toEqual(
      expect.arrayContaining([
        "E_area = -(pi^2*hbar_c)/(720*a^3)",
        "E_tile = E_area*A_tile",
        "d_eff = d_burst*d_cycle*(N_concurrent/N_sector)",
        "f_n = n*c/(2*L)",
      ]),
    );
    expect(loadout.items.map((item: TheoryCalculatorLoadoutItemV1) => item.solveExpression)).toEqual(
      expect.arrayContaining([
        "E_area = -(3.141592653589793^2*3.16152677e-26)/(720*1e-9^3)",
        "E_tile = -0.4333*0.0025",
        "d_eff = 0.12*0.12*(2/80)",
        "f_n = 1*299792458/(2*0.01)",
      ]),
    );
  });
});
