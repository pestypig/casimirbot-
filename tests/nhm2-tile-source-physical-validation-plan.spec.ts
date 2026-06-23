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

const downstreamArtifactRefs = {
  regional_residual_closure: "artifact://downstream/regional-residual-closure-v1",
  wall_t00_closure: "artifact://downstream/wall-t00-closure-v1",
  covariant_conservation: "artifact://downstream/covariant-conservation-v1",
  qei_worldline_dossier: "artifact://downstream/qei-worldline-dossier-v1",
  observer_family_energy_conditions: "artifact://downstream/observer-family-energy-conditions-v1",
  material_credibility: "artifact://downstream/material-credibility-v1",
  coupled_closure: "artifact://downstream/coupled-closure-v1",
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

const forceGapFailingOperatingBudgetReadiness = (
  generatedAt: string,
): Nhm2TileSourceOperatingBudgetReadinessV1 => {
  const readiness = readyOperatingBudgetReadiness(generatedAt);
  return {
    ...readiness,
    budgetStatuses: readiness.budgetStatuses.map((status) =>
      status.surfaceId === "force_gap_load"
        ? {
            ...status,
            ready: false,
            falsifiesCurrentCandidate: true,
            firstBlocker: "force_gap_pull_in_margin_below_operating_budget",
            blockerCount: 1,
            blockers: ["force_gap_pull_in_margin_below_operating_budget"],
            numericalMargins: {
              pullInMarginToIdealGradient: 0.8,
              activeAuthorityMarginToIdealLoad: 0.5,
            },
            requiredCorrections: {
              springConstantShortfallNPerM: 123,
              activeGapControlAuthorityShortfallN: 456,
            },
          }
        : status,
    ),
    summary: {
      ...readiness.summary,
      allOperatingBudgetsReady: false,
      anyOperatingBudgetFalsifies: true,
      firstBlocker: "force_gap_load:force_gap_pull_in_margin_below_operating_budget",
      blockerCount: 1,
      falsifyingBudgetCount: 1,
      reviewBudgetCount: 0,
    },
    blockers: ["force_gap_load:force_gap_pull_in_margin_below_operating_budget"],
  };
};

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
    expect(plan.summary.firstFrontierCampaignDomain).toBe("material_coupon_behavior");
    expect(plan.summary.firstFrontierResolutionMode).toBe("supply_experimental_receipt");
    expect(plan.summary.frontierResolutionItemCount).toBeGreaterThan(0);
    expect(plan.frontierResolutionQueue[0]).toMatchObject({
      rank: 1,
      campaignDomain: "material_coupon_behavior",
      resolutionMode: "supply_experimental_receipt",
      source: "receipt_target",
      targetId: "material_coupon",
      firstBlocker: "material_coupon_receipt_missing",
      blocksPhysicallyCredibleSourceCandidate: true,
    });
    expect(plan.frontierResolutionQueue[0].evidenceTarget).toContain("ultra-high-stress TiN");
    expect(plan.frontierResolutionQueue[0].nextEvidenceArtifact).toBe(
      "receipt://material_coupon/provenance_v1",
    );
    expect(plan.frontierResolutionQueue[0].measurementTargetSummary).toContain(
      "fracture/yield target is at least 2x",
    );
    expect(plan.frontierResolutionQueue[0].falsificationRule).toContain(
      "447-layer TiN stack",
    );
    expect(plan.frontierResolutionQueue[0].decisiveMeasurements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          measurementId: "coupon_fracture_yield_margin",
          evidenceArtifact: "receipt://material_coupon/fracture_yield_margin_v1",
          falsificationConsequence:
            "447-layer TiN support stack is mechanically inadmissible",
        }),
        expect.objectContaining({
          measurementId: "coupon_dielectric_response",
          evidenceArtifact: "receipt://material_coupon/dielectric_response_v1",
        }),
        expect.objectContaining({
          measurementId: "coupon_conductivity_response",
          evidenceArtifact: "receipt://material_coupon/conductivity_v1",
        }),
      ]),
    );
    expect(plan.frontierResolutionQueue[0].prevents).toEqual(
      expect.arrayContaining(["force_gap_pull_in", "full_apparatus_tensor"]),
    );
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

  it("rejects stale frontier items that drop decisive measurement rows", () => {
    const plan = buildNhm2TileSourcePhysicalValidationPlan({ generatedAt });
    const stalePlan = JSON.parse(JSON.stringify(plan));

    delete stalePlan.frontierResolutionQueue[0].decisiveMeasurements;

    expect(isNhm2TileSourcePhysicalValidationPlan(stalePlan)).toBe(false);
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
    expect(plan.summary.firstFrontierCampaignDomain).toBe("full_apparatus_tensor");
    expect(plan.summary.firstFrontierResolutionMode).toBe(
      "supply_same_basis_full_apparatus_tensor",
    );
    expect(plan.frontierResolutionQueue[0]).toMatchObject({
      source: "tensor_authority_gate",
      campaignDomain: "full_apparatus_tensor",
      firstBlocker: "same_chart_full_apparatus_tensor_missing",
      nextEvidenceArtifact: "receipt://full_apparatus_tensor/provenance_v1",
      measurementTargetSummary: expect.stringContaining(
        "nhm2_tile_source_full_apparatus_tensor_values/v1",
      ),
      falsificationRule: expect.stringContaining("source-side same-basis T_munu"),
      decisiveMeasurements: expect.arrayContaining([
        expect.objectContaining({
          measurementId: "tensor_value_artifact",
          evidenceArtifact: "receipt://full_apparatus_tensor/tensor_value_artifact_v1",
        }),
        expect.objectContaining({
          measurementId: "tensor_authority_metadata",
          evidenceArtifact: "receipt://full_apparatus_tensor/authority_metadata_v1",
        }),
        expect.objectContaining({
          measurementId: "tensor_component_detail_refs",
          evidenceArtifact: "receipt://full_apparatus_tensor/component_detail_refs_v1",
        }),
        expect.objectContaining({
          measurementId: "apparatus_stress_energy_term_refs",
          evidenceArtifact: "receipt://full_apparatus_tensor/stress_energy_terms_v1",
        }),
        expect.objectContaining({
          measurementId: "regional_support_sample_counts",
          evidenceArtifact: "receipt://full_apparatus_tensor/regional_support_sample_counts_v1",
          noGoCriterion: expect.stringContaining("zero"),
        }),
      ]),
    });
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
    expect(plan.summary.firstFrontierCampaignDomain).toBe(
      "downstream_residual_conservation_qei_observer",
    );
    expect(plan.summary.firstFrontierResolutionMode).toBe("rerun_downstream_gate");
    expect(plan.frontierResolutionQueue[0]).toMatchObject({
      source: "downstream_gate",
      downstreamGateId: "regional_residual_closure",
      firstBlocker: "regional_residual_closure_not_run",
      nextEvidenceArtifact: "artifact://nhm2/downstream-gates/regional-residual-closure-v1",
      measurementTargetSummary: expect.stringContaining("observer-family WEC/NEC/SEC/DEC"),
      falsificationRule: expect.stringContaining("do not pass together"),
      decisiveMeasurements: expect.arrayContaining([
        expect.objectContaining({
          measurementId: "regional_residual_closure_artifact",
          evidenceArtifact: "artifact://nhm2/downstream-gates/regional-residual-closure-v1",
          noGoCriterion: "regional residual closure is missing, stale, or failing",
          requiredCorrectionKey: null,
        }),
        expect.objectContaining({
          measurementId: "qei_worldline_dossier_artifact",
          evidenceArtifact: "artifact://nhm2/downstream-gates/qei-worldline-dossier-v1",
          noGoCriterion: "QEI is scalar-only, missing, stale, failing, or lacks bound provenance",
          requiredCorrectionKey: null,
        }),
        expect.objectContaining({
          measurementId: "coupled_closure_artifact",
          evidenceArtifact: "artifact://nhm2/downstream-gates/coupled-closure-v1",
          noGoCriterion: "coupled closure is missing, stale, false, or mixes incompatible artifacts",
          requiredCorrectionKey: null,
        }),
      ]),
    });
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
      downstreamGateArtifactRefs: downstreamArtifactRefs,
    });

    expect(plan.summary.allReceiptsPresent).toBe(true);
    expect(plan.summary.operatingBudgetsReady).toBe(false);
    expect(plan.summary.operatingBudgetsFalsifyCurrentCandidate).toBe(false);
    expect(plan.summary.downstreamGatesPass).toBe(false);
    expect(plan.summary.firstBlocker).toBe("operating_budget_readiness_missing");
    expect(plan.summary.firstFrontierCampaignDomain).toBe("campaign_coordination");
    expect(plan.summary.firstFrontierResolutionMode).toBe("supply_operating_budget_receipt");
    expect(plan.frontierResolutionQueue[0]).toMatchObject({
      source: "operating_budget_readiness",
      campaignDomain: "campaign_coordination",
      firstBlocker: "operating_budget_readiness_missing",
      nextEvidenceArtifact: "artifact://nhm2/campaign/reference-capsule-congruence-v1",
      measurementTargetSummary: expect.stringContaining("one frozen profile/run"),
      falsificationRule: expect.stringContaining("stale or inadmissible"),
      decisiveMeasurements: expect.arrayContaining([
        expect.objectContaining({
          measurementId: "reference_capsule_congruence",
          evidenceArtifact: "artifact://nhm2/campaign/reference-capsule-congruence-v1",
        }),
      ]),
    });
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

  it("does not admit pass-status downstream gates without explicit artifact refs", () => {
    const plan = buildNhm2TileSourcePhysicalValidationPlan({
      generatedAt,
      suppliedReceiptSurfaces: allReceipts,
      tensorTermCoverage: fullTensorCoverage,
      tensorAuthorityEvidenceSupplied: true,
      downstreamGateStatuses: downstreamPass,
      operatingBudgetReadiness: readyOperatingBudgetReadiness(generatedAt),
    });
    const residualGate = plan.downstreamGates.find(
      (gate) => gate.gateId === "regional_residual_closure",
    );

    expect(residualGate).toMatchObject({
      status: "review",
      artifactRef: null,
      blockers: ["regional_residual_closure_artifact_ref_missing_for_pass"],
    });
    expect(plan.summary.downstreamGatesPass).toBe(false);
    expect(plan.summary.physicallyCredibleSourceCandidate).toBe(false);
    expect(plan.summary.firstBlocker).toBe(
      "regional_residual_closure_artifact_ref_missing_for_pass",
    );
  });

  it("carries operating-budget margins into decisive measurement rows", () => {
    const plan = buildNhm2TileSourcePhysicalValidationPlan({
      generatedAt,
      suppliedReceiptSurfaces: allReceipts,
      tensorTermCoverage: fullTensorCoverage,
      operatingBudgetReadiness: forceGapFailingOperatingBudgetReadiness(generatedAt),
    });

    expect(plan.summary.sourceCandidateStatus).toBe("falsified");
    expect(plan.summary.operatingBudgetsFalsifyCurrentCandidate).toBe(true);
    expect(plan.summary.firstFrontierCampaignDomain).toBe("force_gap_pull_in");
    expect(plan.summary.firstFrontierResolutionMode).toBe(
      "revise_architecture_or_operating_margin",
    );
    expect(plan.frontierResolutionQueue[0]).toMatchObject({
      source: "operating_budget_readiness",
      campaignDomain: "force_gap_pull_in",
      firstBlocker: "force_gap_pull_in_margin_below_operating_budget",
      numericalMargin: 0.5,
      requiredCorrections: expect.objectContaining({
        springConstantShortfallNPerM: 123,
        activeGapControlAuthorityShortfallN: 456,
      }),
      decisiveMeasurements: expect.arrayContaining([
        expect.objectContaining({
          measurementId: "pull_in_margin",
          currentMargin: 0.8,
          requiredCorrectionValue: 123,
        }),
      ]),
    });
  });

  it("admits a physically credible source candidate only when receipts, tensor authority, and downstream gates all pass", () => {
    const plan = buildNhm2TileSourcePhysicalValidationPlan({
      generatedAt,
      suppliedReceiptSurfaces: allReceipts,
      tensorTermCoverage: fullTensorCoverage,
      tensorAuthorityEvidenceSupplied: true,
      downstreamGateStatuses: downstreamPass,
      downstreamGateArtifactRefs: downstreamArtifactRefs,
      operatingBudgetReadiness: readyOperatingBudgetReadiness(generatedAt),
    });

    expect(plan.summary.sourceCandidateStatus).toBe("physically_credible_source_candidate");
    expect(plan.summary.physicallyCredibleSourceCandidate).toBe(true);
    expect(plan.summary.firstBlocker).toBe("none");
    expect(plan.summary.firstFrontierCampaignDomain).toBe("none");
    expect(plan.summary.firstFrontierResolutionMode).toBe("none");
    expect(plan.summary.frontierResolutionItemCount).toBe(0);
    expect(plan.frontierResolutionQueue).toEqual([]);
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
      downstreamGateArtifactRefs: downstreamArtifactRefs,
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
