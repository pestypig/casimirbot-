import { describe, expect, it } from "vitest";
import {
  buildNhm2TileSourcePhysicalValidationPlan,
  isNhm2TileSourcePhysicalValidationPlan,
} from "../shared/contracts/nhm2-tile-source-physical-validation-plan.v1";

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
    });

    expect(plan.tensorAuthorityGate.sourceTensorAuthorityCandidateAllowed).toBe(true);
    expect(plan.summary.downstreamGatesPass).toBe(false);
    expect(plan.summary.firstBlocker).toBe("regional_residual_closure_not_run");
    expect(plan.downstreamGates.every((gate) => gate.status === "not_run")).toBe(true);
    expect(plan.summary.sourceCandidateStatus).toBe("review");
  });

  it("admits a physically credible source candidate only when receipts, tensor authority, and downstream gates all pass", () => {
    const plan = buildNhm2TileSourcePhysicalValidationPlan({
      generatedAt,
      suppliedReceiptSurfaces: allReceipts,
      tensorTermCoverage: fullTensorCoverage,
      tensorAuthorityEvidenceSupplied: true,
      downstreamGateStatuses: downstreamPass,
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
