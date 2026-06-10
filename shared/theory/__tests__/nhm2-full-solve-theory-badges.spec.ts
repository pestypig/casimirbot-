import { describe, expect, it } from "vitest";
import { isTheoryBadgeGraphV1, validateTheoryBadgeGraphV1, type TheoryBadgeV1 } from "../../contracts/theory-badge-graph.v1";
import { buildHelixTheoryBadgeGraphV1 } from "../helix-theory-badge-graph";
import { buildNhm2FullSolveTheoryBadgesV1 } from "../nhm2-full-solve-theory-badges";

describe("NHM2 full-solve theory badges", () => {
  const newClosureStackBadgeIds = [
    "nhm2.tensor.same_chart_full_tensor",
    "nhm2.closure.wall_t00_source_residual",
    "nhm2.energy_condition.observer_robust_gate",
    "nhm2.qei.worldline_dossier",
    "casimir.material.lifshitz_receipt",
    "casimir.geometry.beyond_pfa_validity",
    "nhm2.natario.invariant_audit",
  ];

  it("builds NHM2 full-solve badges with no validation or promotion boundary", () => {
    const { badges, edges } = buildNhm2FullSolveTheoryBadgesV1();

    expect(badges.length).toBeGreaterThanOrEqual(15);
    expect(edges.length).toBeGreaterThanOrEqual(14);

    for (const badge of badges) {
      expect(badge.claimBoundary.diagnosticOnly).toBe(true);
      expect(badge.claimBoundary.doesValidateNHM2).toBe(false);
      expect(badge.claimBoundary.validationClaimAllowed).toBe(false);
      expect(badge.claimBoundary.physicalMechanismClaimAllowed).toBe(false);
      expect(badge.claimBoundary.promotionAllowed).toBe(false);
    }
  });

  it("includes the whitepaper projection grammar as first-class badges", () => {
    const ids = buildNhm2FullSolveTheoryBadgesV1().badges.map((badge: TheoryBadgeV1) => badge.id);

    expect(ids).toContain("nhm2.observer.eulerian_normal");
    expect(ids).toContain("nhm2.observer.energy_density_projection");
    expect(ids).toContain("nhm2.observer.momentum_density_projection");
    expect(ids).toContain("nhm2.observer.spatial_stress_projection");
    expect(ids).toContain("nhm2.tensor.metric_required_stress_energy");
    expect(ids).toContain("nhm2.tensor.tile_effective_counterpart");
    expect(ids).toContain("nhm2.source.wall_t00_trace");
    expect(ids).toContain("nhm2.tensor.full_authority_gate");
    expect(ids).toContain("nhm2.tensor.same_chart_full_tensor");
    expect(ids).toContain("nhm2.closure.same_basis_regional_residual");
    expect(ids).toContain("nhm2.energy_condition.wec_nec_sec_dec_family");
    expect(ids).toContain("nhm2.energy_condition.observer_robust_gate");
    expect(ids).toContain("nhm2.qei.worldline_sampling_requirement");
    expect(ids).toContain("nhm2.qei.worldline_dossier");
    expect(ids).toContain("nhm2.natario.curvature_invariants");
    expect(ids).toContain("nhm2.natario.invariant_audit");
    expect(ids).toContain("nhm2.clock.centerline_tau_alpha_T");
    expect(ids).toContain("nhm2.artifact.frozen_reference_run_provenance");
  });

  it("keeps promotion-sensitive routes blocked by claim boundaries", () => {
    const { edges } = buildNhm2FullSolveTheoryBadgesV1();

    expect(edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "nhm2.closure.same_basis_regional_residual",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "nhm2.source.wall_t00_trace",
          to: "nhm2.claim_boundary.diagnostic_only",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "nhm2.tensor.full_authority_gate",
          to: "nhm2.claim_boundary.diagonal_proxy_not_full_tensor",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "nhm2.tensor.same_chart_full_tensor",
          to: "nhm2.closure.wall_t00_source_residual",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.tensor.same_chart_full_tensor",
          to: "nhm2.energy_condition.observer_robust_gate",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.clock.centerline_tau_alpha_T",
          to: "nhm2.claim_boundary.expected_clocking_not_route_result",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "nhm2.qei.worldline_sampling_requirement",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "nhm2.qei.worldline_dossier",
          to: "nhm2.claim_boundary.literature_not_validation",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "nhm2.natario.invariant_audit",
          to: "nhm2.energy_condition.observer_robust_gate",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "nhm2.energy_condition.observer_robust_gate",
          to: "nhm2.claim_boundary.diagnostic_only",
          relation: "blocks",
        }),
      ]),
    );
  });

  it("keeps non-scalar full-solve artifacts out of calculator payloads", () => {
    const badges = buildNhm2FullSolveTheoryBadgesV1().badges;
    const nonScalarIds = [
      "nhm2.tensor.same_chart_full_tensor",
      "nhm2.energy_condition.observer_robust_gate",
      "nhm2.qei.worldline_dossier",
      "nhm2.natario.invariant_audit",
    ];

    for (const badgeId of nonScalarIds) {
      const badge = badges.find((candidate: TheoryBadgeV1) => candidate.id === badgeId);
      expect(badge?.calculatorPayloads).toEqual([]);
    }
  });

  it("keeps the centerline clocking target calculator-loadable but bounded", () => {
    const badge = buildNhm2FullSolveTheoryBadgesV1().badges.find(
      (candidate: TheoryBadgeV1) => candidate.id === "nhm2.clock.centerline_tau_alpha_T",
    );

    expect(badge?.calculatorPayloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          expression: "tau = alpha_centerline*T_coordinate",
          targetVariable: "tau",
        }),
      ]),
    );
    expect(badge?.claimBoundary.promotionAllowed).toBe(false);
  });

  it("is included in the global Helix graph and validates", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const ids = graph.badges.map((badge: TheoryBadgeV1) => badge.id);

    expect(isTheoryBadgeGraphV1(graph)).toBe(true);
    expect(validateTheoryBadgeGraphV1(graph)).toEqual([]);
    expect(ids).toEqual(
      expect.arrayContaining([
        "nhm2.observer.eulerian_normal",
        "nhm2.tensor.metric_required_stress_energy",
        "nhm2.closure.wall_t00_source_residual",
        "nhm2.source.wall_t00_trace",
        "nhm2.tensor.full_authority_gate",
        "nhm2.tensor.same_chart_full_tensor",
        "nhm2.closure.same_basis_regional_residual",
        "nhm2.qei.worldline_dossier",
        "nhm2.natario.curvature_invariants",
        "nhm2.natario.invariant_audit",
        "nhm2.energy_condition.observer_robust_gate",
        "nhm2.claim_boundary.diagonal_proxy_not_full_tensor",
      ]),
    );
    const wallClosure = graph.badges.find(
      (badge: TheoryBadgeV1) => badge.id === "nhm2.closure.wall_t00_source_residual",
    );
    expect(wallClosure?.calculatorPayloads.map((payload) => payload.expression)).toContain(
      "R_wall_T00 = T00_wall_required - T00_wall_available",
    );
  });

  it("keeps new closure-stack badges diagnostic and noncomputable except scalar replay rows", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const byId = new Map(graph.badges.map((badge: TheoryBadgeV1) => [badge.id, badge]));

    for (const badgeId of newClosureStackBadgeIds) {
      const badge = byId.get(badgeId);
      expect(badge, badgeId).toBeDefined();
      expect(badge?.claimBoundary).toMatchObject({
        diagnosticOnly: true,
        doesValidateNHM2: false,
        validationClaimAllowed: false,
        physicalMechanismClaimAllowed: false,
        promotionAllowed: false,
      });
    }

    for (const badgeId of [
      "nhm2.tensor.same_chart_full_tensor",
      "nhm2.energy_condition.observer_robust_gate",
      "nhm2.qei.worldline_dossier",
      "nhm2.natario.invariant_audit",
      "casimir.material.lifshitz_receipt",
      "casimir.geometry.beyond_pfa_validity",
    ]) {
      const badge = byId.get(badgeId);
      expect(badge?.calculatorPayloads).toEqual([]);
      expect(badge?.equations.every((equation) => equation.computableExpression == null)).toBe(true);
      expect(
        badge?.equations.every((equation) =>
          ["gate_status", "noncomputable_reference"].includes(equation.operatorKind),
        ),
      ).toBe(true);
    }

    expect(
      byId.get("nhm2.closure.wall_t00_source_residual")?.calculatorPayloads.map(
        (payload) => payload.expression,
      ),
    ).toEqual(["R_wall_T00 = T00_wall_required - T00_wall_available"]);
    expect(
      byId.get("nhm2.qei.sampling_window")?.calculatorPayloads.map(
        (payload) => payload.expression,
      ),
    ).toContain("qei_margin = qei_bound - qei_sample");
    expect(
      byId.get("casimir.cavity.mass_equivalent_proxy")?.calculatorPayloads.map(
        (payload) => payload.expression,
      ),
    ).toEqual(["M_proxy = E_out/c^2"]);
    expect(
      byId.get("nhm2.tile.duty_cycle_average")?.calculatorPayloads.map(
        (payload) => payload.expression,
      ),
    ).toEqual(["P_avg = E_cycle / T_cycle"]);
  });

  it("wires the requested full-solve closure graph edges", () => {
    const graph = buildHelixTheoryBadgeGraphV1();

    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "physics.gr.3p1_decomposition",
          to: "nhm2.tensor.same_chart_full_tensor",
        }),
        expect.objectContaining({
          from: "nhm2.tensor.same_chart_full_tensor",
          to: "nhm2.closure.wall_t00_source_residual",
        }),
        expect.objectContaining({
          from: "nhm2.tensor.same_chart_full_tensor",
          to: "nhm2.energy_condition.observer_robust_gate",
        }),
        expect.objectContaining({
          from: "nhm2.closure.wall_t00_source_residual",
          to: "nhm2.qei.worldline_dossier",
        }),
        expect.objectContaining({
          from: "casimir.material.lifshitz_receipt",
          to: "nhm2.closure.wall_t00_source_residual",
        }),
        expect.objectContaining({
          from: "casimir.geometry.beyond_pfa_validity",
          to: "casimir.material.lifshitz_receipt",
        }),
        expect.objectContaining({
          from: "nhm2.natario.invariant_audit",
          to: "nhm2.energy_condition.observer_robust_gate",
        }),
        expect.objectContaining({
          from: "nhm2.energy_condition.observer_robust_gate",
          to: "nhm2.claim_boundary.diagnostic_only",
        }),
      ]),
    );
  });

  it("does not contain forbidden promotion language", () => {
    const text = JSON.stringify(buildNhm2FullSolveTheoryBadgesV1());

    expect(text).not.toMatch(/\bvalidated propulsion\b/i);
    expect(text).not.toMatch(/\bworking warp drive\b/i);
    expect(text).not.toMatch(/\bphysical mechanism confirmed\b/i);
    expect(text).not.toMatch(/\bQEI passed\b/i);
    expect(text).not.toMatch(/\benergy conditions cleared\b/i);
    expect(text).not.toMatch(/\bsource closure solved\b/i);
    expect(text).not.toMatch(/\bexternal paper validates NHM2\b/i);
  });
});
