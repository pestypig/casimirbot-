import { describe, expect, it } from "vitest";
import { buildCurvatureCollapseObjectBindings } from "../curvature-collapse-object-bindings";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildTheoryCalculatorLoadout } from "../theory-calculator-loadout";

describe("curvature/collapse calculator loadout", () => {
  it("substitutes object values into benchmark scalar rows", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const objectContext = buildCurvatureCollapseObjectBindings({
      rho_kg_m3: 1000,
      power_W: 1000000,
      area_m2: 10,
      d_eff: 0.5,
      gain: 1,
      kappa_body: 1.866e-23,
      kappa_drive: 3.4625e-47,
      dt_ms: 50,
      tau_ms: 1000,
      r_c_m: 0.25,
      L_present: 0.25,
      observed: 0.82,
      bound: 1,
      sigma: 0.04,
    });

    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: [
        "curvature.proxy.body_density",
        "curvature.proxy.drive_power_flux",
        "curvature.proxy.drive_body_ratio",
        "collapse.benchmark.hazard_probability",
        "collapse.benchmark.kappa_present",
        "curvature.uncertainty.margin",
        "curvature.uncertainty.z_score",
        "collapse.runtime.benchmark_route",
        "curvature.claim_boundary.benchmark_only",
      ],
      mode: "selected_badges",
      source: "achievement_map",
      objectContext,
      includeContextItems: true,
    });

    expect(loadout.objectContext?.kind).toBe("curvature_collapse_object");
    expect(loadout.items.map((item) => item.solveExpression)).toContain("kappa_body = 6.217e-27*1000");
    expect(loadout.items.map((item) => item.solveExpression)).toContain(
      "kappa_drive = 6.925e-52*(1000000/10)*0.5*1",
    );
    expect(loadout.items.map((item) => item.solveExpression)).toContain("eta_kappa = 3.4625e-47/1.866e-23");
    expect(loadout.items.map((item) => item.solveExpression)).toContain("p_trigger = 1 - exp(-50/1000)");
    expect(loadout.items.map((item) => item.solveExpression)).toContain("kappa_present = 1/(0.25^2)");
    expect(loadout.items.map((item) => item.solveExpression)).toContain("margin = 0.82 - 1");
    expect(loadout.items.map((item) => item.solveExpression)).toContain("z_score = abs(0.82 - 1)/0.04");
    expect(loadout.items.some((item) => item.kind === "runtime_context")).toBe(true);
    expect(loadout.items.some((item) => item.kind === "claim_boundary")).toBe(true);
  });
});
