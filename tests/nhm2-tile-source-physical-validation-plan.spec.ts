import { describe, expect, it } from "vitest";
import {
  buildNhm2TileSourcePhysicalValidationPlan,
  isNhm2TileSourcePhysicalValidationPlan,
} from "../shared/contracts/nhm2-tile-source-physical-validation-plan.v1";
import type { Nhm2TileSourceOperatingBudgetReadinessV1 } from "../shared/contracts/nhm2-tile-source-operating-budget-readiness.v1";

const allReceipts = {
  material_coupon: true,
  force_gap_pull_in: true,
  roughness_patch_metrology: true,
  active_control_energy: true,
  fatigue_lifetime: true,
  layer_scaling: true,
  full_apparatus_tensor: true,
} as const;

const fullTensorCoverage = {
  supportStructureStressEnergy: true,
  spacerContactStressEnergy: true,
  activeControlFieldEnergy: true,
  thermalLoadStressEnergy: true,
  patchPotentialElectrostaticStress: true,
  fatigueDamageEvolution: true,
  layerScalingCrossTerms: true,
} as const;

const downstreamPass = {
  regional_residual_closure: "pass",
  wall_t00_closure: "pass",
  covariant_conservation: "pass",
  qei_worldline_dossier: "pass",
  observer_family_energy_conditions: "pass",
  material_credibility: "pass",
  coupled_closure: "pass",
} as const;

const forbiddenPhrase = (...parts: string[]): RegExp => new RegExp(parts.join(""), "i");

const readyOperatingBudgetReadiness = (
  generatedAt: string,
): Nhm2TileSourceOperatingBudgetReadinessV1 => ({
  contractVersion: "nhm2_tile_source_operating_budget_readiness/v1",
  generatedAt,
  laneId: "nhm2_shift_lapse",
  selectedProfileId:
    "stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1",
  frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1",
  sourceRefs: {
    material_coupon: "artifact://material-coupon-budget",
    force_gap_load: "artifact://force-gap-load-budget",
    roughness_patch: "artifact://roughness-patch-budget",
    active_control: "artifact://active-control-budget",
    fatigue_layer_scaling: "artifact://fatigue-layer-scaling-budget",
    full_apparatus_tensor: "artifact://full-apparatus-tensor-budget",
  },
  budgetStatuses: [
    "material_coupon",
    "force_gap_load",
    "roughness_patch",
    "active_control",
    "fatigue_layer_scaling",
    "full_apparatus_tensor",
  ].map((surfaceId) => ({
    surfaceId: surfaceId as Nhm2TileSourceOperatingBudgetReadinessV1["budgetStatuses"][number]["surfaceId"],
    contractVersion: `nhm2_tile_source_${surfaceId}_operating_budget/v1`,
    artifactRef: `artifact://${surfaceId}-budget`,
    ready: true,
    falsifiesCurrentCandidate: false,
    firstBlocker: "none",
    blockerCount: 0,
    blockers: [],
    numericalMargins: {},
  })),
  summary: {
    allOperatingBudgetsReady: true,
    anyOperatingBudgetFalsifies: false,
    firstBlocker: "none",
    blockerCount: 0,
    falsifyingBudgetCount: 0,
    reviewBudgetCount: 0,
    physicalViabilityClaimAllowed: false,
    transportClaimAllowed: false,
    propulsionClaimAllowed: false,
  },
  blockers: [],
  claimBoundary: {
    diagnosticOnly: true,
    operatingBudgetReadinessOnly: true,
    budgetsDoNotSupplyExperimentalReceipts: true,
    budgetsDoNotSupplyFullTensorValues: true,
    fullSolveRequiresDownstreamGateClosure: true,
    physicalViabilityClaimAllowed: false,
    transportClaimAllowed: false,
    propulsionClaimAllowed: false,
  },
});

describe("NHM2 tile source physical validation plan", () => {
  const generatedAt = "2026-06-22T00:00:00.000Z";

  it("freezes the strongest receipt-loop candidate into a named validation plan", () => {
    const plan = buildNhm2TileSourcePhysicalValidationPlan({ generatedAt });

    expect(isNhm2TileSourcePhysicalValidationPlan(plan)).toBe(true);
    expect(plan.contractVersion).toBe("nhm2_tile_source_physical_validation_plan/v1");
    expect(plan.generatedAt).toBe(generatedAt);
    expect(plan.frozenCandidate.candidateId).toBe(
      "nhm2_447_layer_topology_optimized_lattice_tin_v1",
    );
    expect(plan.frozenCandidate.architectureId).toBe("topology_optimized_lattice_tin");
    expect(plan.frozenCandidate.materialCandidate).toBe("ultra_high_stress_tin");
    expect(plan.frozenCandidate.sourceRetention).toBeCloseTo(0.7038, 6);
    expect(plan.frozenCandidate.supportStressMPa).toBeCloseTo(545.707087858, 6);
    expect(plan.frozenCandidate.pullInMargin).toBeCloseTo(1.31563018682, 6);
  });

  it("keeps the default candidate in review with a material coupon blocker", () => {
    const plan = buildNhm2TileSourcePhysicalValidationPlan({ generatedAt });

    expect(plan.summary.sourceCandidateStatus).toBe("review");
    expect(plan.summary.firstBlocker).toBe("material_coupon_receipt_missing");
    expect(plan.summary.allReceiptsPresent).toBe(false);
    expect(plan.summary.physicallyCredibleSourceCandidate).toBe(false);
    expect(plan.receiptTargets.map((target) => target.targetId)).toEqual([
      "material_coupon",
      "force_gap_pull_in",
      "roughness_patch_metrology",
      "active_control_energy",
      "fatigue_lifetime",
      "layer_scaling",
      "full_apparatus_tensor",
    ]);
    expect(plan.falsificationMap.map((item) => item.blocker)).toContain(
      "material_coupon_receipt_missing",
    );
  });

  it("requires full apparatus tensor authority after receipts exist", () => {
    const plan = buildNhm2TileSourcePhysicalValidationPlan({
      generatedAt,
      suppliedReceiptSurfaces: allReceipts,
      tensorTermCoverage: fullTensorCoverage,
      operatingBudgetReadiness: readyOperatingBudgetReadiness(generatedAt),
    });

    expect(plan.summary.allReceiptsPresent).toBe(true);
    expect(plan.summary.fullApparatusTensorCoverageComplete).toBe(true);
    expect(plan.tensorAuthorityGate.sourceTensorAuthorityCandidateAllowed).toBe(false);
    expect(plan.summary.firstBlocker).toBe("same_chart_full_apparatus_tensor_missing");
    expect(plan.summary.sourceCandidateStatus).toBe("review");
  });

  it("requires downstream NHM2 gates before the source candidate can become physically credible", () => {
    const plan = buildNhm2TileSourcePhysicalValidationPlan({
      generatedAt,
      suppliedReceiptSurfaces: allReceipts,
      tensorTermCoverage: fullTensorCoverage,
      tensorAuthorityEvidenceSupplied: true,
      operatingBudgetReadiness: readyOperatingBudgetReadiness(generatedAt),
    });

    expect(plan.tensorAuthorityGate.sourceTensorAuthorityCandidateAllowed).toBe(true);
    expect(plan.summary.downstreamGatesPass).toBe(false);
    expect(plan.summary.firstBlocker).toBe("regional_residual_closure_not_run");
    expect(plan.downstreamGates.every((gate) => gate.status === "not_run")).toBe(true);
    expect(plan.summary.sourceCandidateStatus).toBe("review");
  });

  it("blocks otherwise complete validation when operating-budget readiness is missing", () => {
    const plan = buildNhm2TileSourcePhysicalValidationPlan({
      generatedAt,
      suppliedReceiptSurfaces: allReceipts,
      tensorTermCoverage: fullTensorCoverage,
      tensorAuthorityEvidenceSupplied: true,
      downstreamGateStatuses: downstreamPass,
    });

    expect(plan.summary.allReceiptsPresent).toBe(true);
    expect(plan.summary.operatingBudgetsReady).toBe(false);
    expect(plan.summary.operatingBudgetsFalsifyCurrentCandidate).toBe(false);
    expect(plan.summary.downstreamGatesPass).toBe(false);
    expect(plan.summary.firstBlocker).toBe("operating_budget_readiness_missing");
    expect(plan.summary.physicallyCredibleSourceCandidate).toBe(false);
    expect(plan.summary.sourceCandidateStatus).toBe("review");
    expect(plan.downstreamGates.find((gate) => gate.gateId === "material_credibility"))
      .toMatchObject({
        status: "review",
        blockers: expect.arrayContaining([
          "material_credibility_operating_budgets_not_ready",
        ]),
      });
    expect(plan.downstreamGates.find((gate) => gate.gateId === "coupled_closure"))
      .toMatchObject({
        status: "review",
        blockers: expect.arrayContaining([
          "coupled_closure_operating_budgets_not_ready",
          "material_credibility_not_pass_for_coupled_closure",
        ]),
      });
    expect(plan.falsificationMap.map((item) => item.blocker)).toContain(
      "operating_budget_readiness_missing",
    );
    expect(plan.falsificationMap.map((item) => item.blocker)).toEqual(
      expect.arrayContaining([
        "material_credibility_operating_budgets_not_ready",
        "coupled_closure_operating_budgets_not_ready",
      ]),
    );
  });

  it("admits a physically credible source candidate only when receipts, tensor authority, and downstream gates all pass", () => {
    const plan = buildNhm2TileSourcePhysicalValidationPlan({
      generatedAt,
      suppliedReceiptSurfaces: allReceipts,
      tensorTermCoverage: fullTensorCoverage,
      tensorAuthorityEvidenceSupplied: true,
      downstreamGateStatuses: downstreamPass,
      operatingBudgetReadiness: readyOperatingBudgetReadiness(generatedAt),
    });

    expect(plan.summary.sourceCandidateStatus).toBe("physically_credible_source_candidate");
    expect(plan.summary.physicallyCredibleSourceCandidate).toBe(true);
    expect(plan.summary.firstBlocker).toBe("none");
    expect(plan.summary.physicalViabilityClaimAllowed).toBe(false);
    expect(plan.summary.transportClaimAllowed).toBe(false);
    expect(plan.claimBoundary.physicallyCredibleSourceCandidateIsNotPhysicalViability).toBe(true);
  });

  it("keeps claim boundaries closed and avoids promotion language", () => {
    const plan = buildNhm2TileSourcePhysicalValidationPlan({
      generatedAt,
      suppliedReceiptSurfaces: allReceipts,
      tensorTermCoverage: fullTensorCoverage,
      tensorAuthorityEvidenceSupplied: true,
      downstreamGateStatuses: downstreamPass,
      operatingBudgetReadiness: readyOperatingBudgetReadiness(generatedAt),
    });
    const text = JSON.stringify(plan);

    expect(plan.summary.physicalViabilityClaimAllowed).toBe(false);
    expect(plan.summary.transportClaimAllowed).toBe(false);
    expect(plan.summary.propulsionClaimAllowed).toBe(false);
    expect(plan.summary.speedAuthorityClaimAllowed).toBe(false);
    expect(plan.summary.routeEtaClaimAllowed).toBe(false);
    expect(text).not.toMatch(forbiddenPhrase("physical", " viability"));
    expect(text).not.toMatch(forbiddenPhrase("internal load", " thrust"));
    expect(text).not.toMatch(forbiddenPhrase("transport", " certified"));
    expect(text).not.toMatch(forbiddenPhrase("wall", " closure passed"));
  });
});
