import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildNhm2TileSourceMaterialEvidenceReceipts,
  isNhm2TileSourceMaterialEvidenceReceipts,
  type BuildNhm2TileSourceMaterialEvidenceReceiptsInput,
} from "../shared/contracts/nhm2-tile-source-material-evidence-receipts.v1";
import {
  buildNhm2TileSourceEvidenceGapRoadmap,
  isNhm2TileSourceEvidenceGapRoadmap,
} from "../shared/contracts/nhm2-tile-source-evidence-gap-roadmap.v1";
import {
  buildNhm2TileSourceFalsificationReport,
  isNhm2TileSourceFalsificationReport,
} from "../shared/contracts/nhm2-tile-source-falsification-report.v1";
import {
  buildNhm2TileSourceAuthorityHandoff,
  isNhm2TileSourceAuthorityHandoff,
} from "../shared/contracts/nhm2-tile-source-authority-handoff.v1";
import {
  buildNhm2TileSourceMaterialCouponTestPlan,
  isNhm2TileSourceMaterialCouponTestPlan,
} from "../shared/contracts/nhm2-tile-source-material-coupon-test-plan.v1";
import {
  buildNhm2TileSourceMaterialCouponOperatingBudget,
  isNhm2TileSourceMaterialCouponOperatingBudget,
} from "../shared/contracts/nhm2-tile-source-material-coupon-operating-budget.v1";
import {
  buildNhm2TileSourceForceGapPullInTestPlan,
  isNhm2TileSourceForceGapPullInTestPlan,
} from "../shared/contracts/nhm2-tile-source-force-gap-pull-in-test-plan.v1";
import {
  buildNhm2TileSourceForceGapLoadBudget,
  isNhm2TileSourceForceGapLoadBudget,
} from "../shared/contracts/nhm2-tile-source-force-gap-load-budget.v1";
import {
  buildNhm2TileSourceRoughnessPatchTestPlan,
  isNhm2TileSourceRoughnessPatchTestPlan,
} from "../shared/contracts/nhm2-tile-source-roughness-patch-test-plan.v1";
import {
  buildNhm2TileSourceRoughnessPatchOperatingBudget,
  isNhm2TileSourceRoughnessPatchOperatingBudget,
} from "../shared/contracts/nhm2-tile-source-roughness-patch-operating-budget.v1";
import {
  buildNhm2TileSourceActiveControlTestPlan,
  isNhm2TileSourceActiveControlTestPlan,
} from "../shared/contracts/nhm2-tile-source-active-control-test-plan.v1";
import {
  buildNhm2TileSourceActiveControlOperatingBudget,
  isNhm2TileSourceActiveControlOperatingBudget,
} from "../shared/contracts/nhm2-tile-source-active-control-operating-budget.v1";
import {
  buildNhm2TileSourceFatigueLayerScalingTestPlan,
  isNhm2TileSourceFatigueLayerScalingTestPlan,
} from "../shared/contracts/nhm2-tile-source-fatigue-layer-scaling-test-plan.v1";
import {
  buildNhm2TileSourceFatigueLayerScalingOperatingBudget,
  isNhm2TileSourceFatigueLayerScalingOperatingBudget,
} from "../shared/contracts/nhm2-tile-source-fatigue-layer-scaling-operating-budget.v1";
import {
  buildNhm2TileSourceFullApparatusTensorTestPlan,
  isNhm2TileSourceFullApparatusTensorTestPlan,
} from "../shared/contracts/nhm2-tile-source-full-apparatus-tensor-test-plan.v1";
import {
  buildNhm2TileSourceFullApparatusTensorOperatingBudget,
  isNhm2TileSourceFullApparatusTensorOperatingBudget,
} from "../shared/contracts/nhm2-tile-source-full-apparatus-tensor-operating-budget.v1";
import {
  buildNhm2TileSourceOperatingBudgetReadiness,
  isNhm2TileSourceOperatingBudgetReadiness,
} from "../shared/contracts/nhm2-tile-source-operating-budget-readiness.v1";
import { buildNhm2TileSourcePhysicalValidationPlan } from "../shared/contracts/nhm2-tile-source-physical-validation-plan.v1";
import {
  buildNhm2TileSourceMaterialEvidenceTemplate,
  publishNhm2TileSourceMaterialEvidenceReceipts,
} from "../tools/nhm2/publish-tile-source-material-evidence-receipts";

const generatedAt = "2026-06-22T00:00:00.000Z";

const passingEvidence: BuildNhm2TileSourceMaterialEvidenceReceiptsInput = {
  generatedAt,
  materialCoupon: {
    evidenceTier: "measured",
    evidenceRef: "receipt://coupon/tin/cryogenic-4k-v1",
    tensileStressCurveRef: "receipt://coupon/tin/tensile-stress-curve-4k-v1",
    fractureYieldCurveRef: "receipt://coupon/tin/fracture-yield-curve-4k-v1",
    cryogenicStateRef: "receipt://coupon/tin/cryogenic-state-4k-v1",
    roughnessMapRef: "receipt://coupon/tin/roughness-map-v1",
    fabricationToleranceMapRef: "receipt://coupon/tin/fabrication-tolerance-map-v1",
    material: "ultra_high_stress_tin",
    measuredTensileStressPa: 2.3e9,
    fractureOrYieldStressPa: 2.1e9,
    supportStressPa: 5.45707087858e8,
    cryogenicTemperatureK: 4,
    dielectricResponseRef: "receipt://dielectric/tin/v1",
    conductivityRef: "receipt://conductivity/tin/v1",
    materialResponseFrequencyHz: 15e9,
    dielectricResponseTemperatureK: 4,
    conductivityTemperatureK: 4,
    dielectricLossTangent: 0.002,
    conductivitySiemensPerMeter: 1.2e6,
    roughnessRmsMeters: 5e-11,
    fabricationToleranceMeters: 5e-10,
  },
  forceGapPullIn: {
    evidenceTier: "validated_simulation",
    evidenceRef: "receipt://force-gap/8nm/v1",
    forceGapCurveRef: "receipt://force-gap/Fg-curve-8nm-v1",
    forceGradientCurveRef: "receipt://force-gap/dFdg-curve-8nm-v1",
    stiffnessModelRef: "receipt://force-gap/stiffness-model-447-layer-v1",
    gapMeters: 8e-9,
    casimirForceN: 1.42e4,
    forceGradientNPerM: 7.1e12,
    effectiveSpringConstantNPerM: 8.6e12,
    stictionMargin: 1.5,
    activeGapControlAuthorityN: 2e4,
  },
  roughnessPatch: {
    evidenceTier: "measured",
    evidenceRef: "receipt://roughness-patch/tin/v1",
    roughnessMapRef: "receipt://roughness-patch/maps/roughness-height-v1",
    asperityDistributionRef: "receipt://roughness-patch/maps/asperity-tail-v1",
    patchVoltageMapRef: "receipt://roughness-patch/maps/patch-voltage-v1",
    roughnessRmsMeters: 5e-11,
    asperityP99Meters: 1e-9,
    asperityMaxMeters: 2e-9,
    patchVoltageRmsVolts: 5e-3,
    residualElectrostaticForceFraction: 0.02,
    correctionRef: "receipt://roughness-patch/correction/v1",
  },
  activeControl: {
    evidenceTier: "validated_simulation",
    evidenceRef: "receipt://active-control/gap-lock-v1",
    energyWaveformRef: "receipt://active-control/energy-waveform-v1",
    controlTransferFunctionRef: "receipt://active-control/transfer-function-v1",
    gapNoiseTraceRef: "receipt://active-control/gap-noise-trace-v1",
    thermalModelRef: "receipt://active-control/thermal-model-v1",
    heatLoadTraceRef: "receipt://active-control/heat-load-trace-v1",
    timingSyncTraceRef: "receipt://active-control/timing-sync-trace-v1",
    energyPerCycleJ: 1e-9,
    bandwidthHz: 45e9,
    switchingRateHz: 15e9,
    gapNoiseRmsMeters: 5e-11,
    noiseSpectrumRef: "receipt://active-control/gap-noise-spectrum-v1",
    heatLoadW: 20,
    timingJitterSeconds: 1e-12,
    failureModeRef: "receipt://active-control/failure-modes-v1",
    failureModeCoverage: {
      lossOfLock: true,
      thermalRunaway: true,
      noiseRunaway: true,
      timingDesynchronization: true,
      failSafeShutdown: true,
    },
  },
  fatigueLayerScaling: {
    evidenceTier: "validated_simulation",
    evidenceRef: "receipt://fatigue-layer-scaling/v1",
    cycleProtocolRef: "receipt://fatigue-layer-scaling/cycle-protocol-v1",
    fatigueCurveRef: "receipt://fatigue-layer-scaling/fatigue-curve-v1",
    thermalCycleRef: "receipt://fatigue-layer-scaling/thermal-cycle-v1",
    creepDriftRef: "receipt://fatigue-layer-scaling/creep-drift-v1",
    layerScalingMapRef: "receipt://fatigue-layer-scaling/layer-scaling-map-v1",
    nonadditivityModelRef: "receipt://fatigue-layer-scaling/nonadditivity-model-v1",
    activeAreaMapRef: "receipt://fatigue-layer-scaling/active-area-map-v1",
    supportCouplingMapRef: "receipt://fatigue-layer-scaling/support-coupling-map-v1",
    multiphysicsCouplingRef: "receipt://fatigue-layer-scaling/multiphysics-coupling-v1",
    cycleCountToFailure: 2e9,
    requiredCycleCount: 1e9,
    thermalCycleDriftFraction: 0.005,
    creepDriftFraction: 0.005,
    layerScalingEfficiency: 0.95,
    nonadditivityFraction: 0.05,
    activeAreaRetention: 1,
    supportCouplingStatus: "pass",
  },
  fullApparatusTensor: {
    evidenceTier: "validated_simulation",
    evidenceRef: "receipt://full-apparatus-tmunu/v1",
    tensorValueArtifactRef: "artifact://full-apparatus-tmunu/values/v1",
    tensorValueArtifactContract: "nhm2_tile_source_full_apparatus_tensor_values/v1",
    sameChart: true,
    sameBasis: true,
    sameUnits: true,
    noMetricTargetEcho: true,
    components: {
      T00: true,
      T0i: true,
      diagonalTij: true,
      offDiagonalTij: true,
    },
    componentRefs: {
      T00: "receipt://full-apparatus-tmunu/components/T00-v1",
      T0i: "receipt://full-apparatus-tmunu/components/T0i-v1",
      diagonalTij: "receipt://full-apparatus-tmunu/components/diagonal-Tij-v1",
      offDiagonalTij: "receipt://full-apparatus-tmunu/components/off-diagonal-Tij-v1",
    },
    componentDetailRefs: {
      T00: "receipt://full-apparatus-tmunu/components/T00-v1",
      T01: "receipt://full-apparatus-tmunu/components/T01-v1",
      T02: "receipt://full-apparatus-tmunu/components/T02-v1",
      T03: "receipt://full-apparatus-tmunu/components/T03-v1",
      T11: "receipt://full-apparatus-tmunu/components/T11-v1",
      T12: "receipt://full-apparatus-tmunu/components/T12-v1",
      T13: "receipt://full-apparatus-tmunu/components/T13-v1",
      T22: "receipt://full-apparatus-tmunu/components/T22-v1",
      T23: "receipt://full-apparatus-tmunu/components/T23-v1",
      T33: "receipt://full-apparatus-tmunu/components/T33-v1",
    },
    termCoverage: {
      supportStructureStressEnergy: true,
      spacerContactStressEnergy: true,
      activeControlFieldEnergy: true,
      thermalLoadStressEnergy: true,
      patchPotentialElectrostaticStress: true,
      fatigueDamageEvolution: true,
      layerScalingCrossTerms: true,
      casimirInteractionStressEnergy: true,
      materialStrainEnergy: true,
    },
    termRefs: {
      supportStructureStressEnergy: "receipt://full-apparatus-tmunu/terms/support-stress-v1",
      spacerContactStressEnergy: "receipt://full-apparatus-tmunu/terms/spacer-contact-v1",
      activeControlFieldEnergy: "receipt://full-apparatus-tmunu/terms/active-control-v1",
      thermalLoadStressEnergy: "receipt://full-apparatus-tmunu/terms/thermal-load-v1",
      patchPotentialElectrostaticStress:
        "receipt://full-apparatus-tmunu/terms/patch-electrostatic-v1",
      fatigueDamageEvolution: "receipt://full-apparatus-tmunu/terms/fatigue-damage-v1",
      layerScalingCrossTerms: "receipt://full-apparatus-tmunu/terms/layer-cross-terms-v1",
      casimirInteractionStressEnergy: "receipt://full-apparatus-tmunu/terms/casimir-v1",
      materialStrainEnergy: "receipt://full-apparatus-tmunu/terms/material-strain-v1",
    },
    regionalCoverage: {
      wall: true,
      hull: true,
      exteriorShell: true,
    },
    regionalSupportRefs: {
      wall: "receipt://full-apparatus-tmunu/regions/wall-support-v1",
      hull: "receipt://full-apparatus-tmunu/regions/hull-support-v1",
      exteriorShell: "receipt://full-apparatus-tmunu/regions/exterior-shell-support-v1",
    },
  },
};

const allDownstreamPass = {
  regional_residual_closure: "pass",
  wall_t00_closure: "pass",
  covariant_conservation: "pass",
  qei_worldline_dossier: "pass",
  observer_family_energy_conditions: "pass",
  material_credibility: "pass",
  coupled_closure: "pass",
} as const;

const forbiddenPhrase = (...parts: string[]): RegExp => new RegExp(parts.join(""), "i");

const buildPassingOperatingBudgetReadiness = (
  receipts = buildNhm2TileSourceMaterialEvidenceReceipts(passingEvidence),
) => {
  const forceGapLoadBudget = buildNhm2TileSourceForceGapLoadBudget({
    generatedAt,
    materialEvidenceReceipts: receipts,
    forceGapPullInEvidence: passingEvidence.forceGapPullIn,
  });
  return buildNhm2TileSourceOperatingBudgetReadiness({
    generatedAt,
    materialCouponOperatingBudget: buildNhm2TileSourceMaterialCouponOperatingBudget({
      generatedAt,
      materialCouponEvidence: passingEvidence.materialCoupon,
    }),
    materialCouponOperatingBudgetRef: "artifact://material-coupon-budget",
    forceGapLoadBudget,
    forceGapLoadBudgetRef: "artifact://force-gap-load-budget",
    roughnessPatchOperatingBudget: buildNhm2TileSourceRoughnessPatchOperatingBudget({
      forceGapLoadBudget,
      roughnessPatchEvidence: passingEvidence.roughnessPatch,
    }),
    roughnessPatchOperatingBudgetRef: "artifact://roughness-patch-budget",
    activeControlOperatingBudget: buildNhm2TileSourceActiveControlOperatingBudget({
      forceGapLoadBudget,
      activeControlEvidence: passingEvidence.activeControl,
    }),
    activeControlOperatingBudgetRef: "artifact://active-control-budget",
    fatigueLayerScalingOperatingBudget: buildNhm2TileSourceFatigueLayerScalingOperatingBudget({
      generatedAt,
      fatigueLayerScalingEvidence: passingEvidence.fatigueLayerScaling,
    }),
    fatigueLayerScalingOperatingBudgetRef: "artifact://fatigue-layer-scaling-budget",
    fullApparatusTensorOperatingBudget: buildNhm2TileSourceFullApparatusTensorOperatingBudget({
      generatedAt,
      fullApparatusTensorEvidence: passingEvidence.fullApparatusTensor,
    }),
    fullApparatusTensorOperatingBudgetRef: "artifact://full-apparatus-tensor-budget",
  });
};

describe("NHM2 tile source material evidence receipts", () => {
  it("emits missing receipt blockers by default", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({ generatedAt });

    expect(isNhm2TileSourceMaterialEvidenceReceipts(receipts)).toBe(true);
    expect(receipts.contractVersion).toBe("nhm2_tile_source_material_evidence_receipts/v1");
    expect(receipts.frozenCandidateId).toBe("nhm2_447_layer_topology_optimized_lattice_tin_v1");
    expect(receipts.summary.candidateDisposition).toBe("review");
    expect(receipts.summary.firstBlocker).toBe("material_coupon_receipt_missing");
    expect(receipts.derivedReceiptInputs.suppliedReceiptSurfaces.material_coupon).toBe(false);
    expect(receipts.derivedReceiptInputs.tensorAuthorityEvidenceSupplied).toBe(false);
  });

  it("keeps declared-model evidence in review instead of material pass", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      materialCoupon: {
        ...passingEvidence.materialCoupon!,
        evidenceTier: "declared_model",
      },
    });
    const material = receipts.receiptSurfaces.find((surface) => surface.surfaceId === "material_coupon");

    expect(material?.status).toBe("review");
    expect(material?.blockers).toContain("material_coupon_tier_not_measured_or_validated");
    expect(receipts.derivedReceiptInputs.suppliedReceiptSurfaces.material_coupon).toBe(false);
    expect(receipts.summary.candidateDisposition).toBe("review");
  });

  it("falsifies the current candidate when 8 nm pull-in margin fails", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      forceGapPullIn: {
        evidenceTier: "measured",
        forceGapCurveRef: "receipt://force-gap/failing-Fg-curve-v1",
        forceGradientCurveRef: "receipt://force-gap/failing-dFdg-curve-v1",
        stiffnessModelRef: "receipt://force-gap/failing-stiffness-model-v1",
        gapMeters: 8e-9,
        casimirForceN: 1.42e4,
        forceGradientNPerM: 3e6,
        effectiveSpringConstantNPerM: 1e6,
        stictionMargin: 0.8,
        activeGapControlAuthorityN: 1e4,
      },
    });

    expect(receipts.summary.candidateDisposition).toBe("falsified");
    expect(receipts.falsificationMap.map((entry) => entry.blocker)).toEqual(
      expect.arrayContaining([
        "force_gradient_inconsistent_with_force_curve_at_8nm",
        "pull_in_margin_below_one",
        "stiction_margin_below_one",
        "active_gap_control_authority_below_1p2x_force",
      ]),
    );
    expect(
      receipts.falsificationMap.some((entry) => entry.falsifiesCurrentCandidate),
    ).toBe(true);
  });

  it("opens a receipt-ready source candidate only with all material evidence and full tensor terms", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts(passingEvidence);

    expect(receipts.summary.candidateDisposition).toBe("receipt_ready");
    expect(receipts.summary.materialEvidenceReady).toBe(true);
    expect(receipts.summary.fullApparatusTensorReady).toBe(true);
    expect(receipts.summary.sourceAuthorityEvidenceReady).toBe(true);
    expect(receipts.summary.firstBlocker).toBe("none");
    expect(
      Object.values(receipts.derivedReceiptInputs.suppliedReceiptSurfaces).every(Boolean),
    ).toBe(true);
  });

  it("blocks measured or validated receipt surfaces that lack a top-level evidence ref", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      ...passingEvidence,
      materialCoupon: {
        ...passingEvidence.materialCoupon!,
        evidenceRef: undefined,
      },
      forceGapPullIn: {
        ...passingEvidence.forceGapPullIn!,
        evidenceRef: undefined,
      },
      roughnessPatch: {
        ...passingEvidence.roughnessPatch!,
        evidenceRef: undefined,
      },
      activeControl: {
        ...passingEvidence.activeControl!,
        evidenceRef: undefined,
      },
      fatigueLayerScaling: {
        ...passingEvidence.fatigueLayerScaling!,
        evidenceRef: undefined,
      },
      fullApparatusTensor: {
        ...passingEvidence.fullApparatusTensor!,
        evidenceRef: undefined,
      },
    });

    expect(receipts.summary.candidateDisposition).toBe("falsified");
    expect(receipts.summary.materialEvidenceReady).toBe(false);
    expect(receipts.summary.fullApparatusTensorReady).toBe(false);
    expect(receipts.falsificationMap.map((entry) => entry.blocker)).toEqual(
      expect.arrayContaining([
        "material_coupon_evidence_ref_missing",
        "force_gap_evidence_ref_missing",
        "roughness_patch_evidence_ref_missing",
        "active_control_evidence_ref_missing",
        "fatigue_layer_scaling_evidence_ref_missing",
        "full_apparatus_tensor_evidence_ref_missing",
      ]),
    );
    expect(
      receipts.receiptSurfaces
        .filter((surface) => surface.evidenceTier === "measured" || surface.evidenceTier === "validated_simulation")
        .every((surface) => surface.evidenceRef === null && surface.status === "fail"),
    ).toBe(true);
    expect(receipts.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("feeds the physical validation plan without opening physical or transport claims", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts(passingEvidence);
    const plan = buildNhm2TileSourcePhysicalValidationPlan({
      generatedAt,
      materialEvidenceReceipts: receipts,
      operatingBudgetReadiness: buildPassingOperatingBudgetReadiness(receipts),
      downstreamGateStatuses: allDownstreamPass,
    });

    expect(plan.summary.allReceiptsPresent).toBe(true);
    expect(plan.tensorAuthorityGate.sourceTensorAuthorityCandidateAllowed).toBe(true);
    expect(plan.summary.physicallyCredibleSourceCandidate).toBe(true);
    expect(plan.summary.sourceCandidateStatus).toBe("physically_credible_source_candidate");
    expect(plan.summary.physicalViabilityClaimAllowed).toBe(false);
    expect(plan.summary.transportClaimAllowed).toBe(false);
    expect(plan.claimBoundary.physicallyCredibleSourceCandidateIsNotPhysicalViability).toBe(true);
  });

  it("keeps claim-boundary language closed", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts(passingEvidence);
    const text = JSON.stringify(receipts);

    expect(receipts.claimBoundary.idealScalarCasimirIsNotMaterialEvidence).toBe(true);
    expect(receipts.claimBoundary.fullApparatusTensorRequired).toBe(true);
    expect(receipts.summary.physicalViabilityClaimAllowed).toBe(false);
    expect(text).not.toMatch(forbiddenPhrase("certified", " speed"));
    expect(text).not.toMatch(forbiddenPhrase("transport", " certified"));
    expect(text).not.toMatch(forbiddenPhrase("propulsion", " proof"));
    expect(text).not.toMatch(forbiddenPhrase("wall", " closure", " passed"));
  });

  it("publishes material evidence and validation plan artifacts from one evidence input", () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "nhm2-tile-source-material-evidence-"));
    try {
      const evidencePath = join(tempRoot, "evidence.json");
      const outDir = join(tempRoot, "out");
      writeFileSync(
        evidencePath,
        `${JSON.stringify({ ...passingEvidence, downstreamGateStatuses: allDownstreamPass }, null, 2)}\n`,
        "utf8",
      );

      const result = publishNhm2TileSourceMaterialEvidenceReceipts({
        repoRoot: process.cwd(),
        evidencePath,
        outDir,
        generatedAt,
      });
      const materialJson = JSON.parse(
        readFileSync(result.outputRefs.materialEvidenceReceipts, "utf8"),
      ) as { contractVersion?: string; summary?: { firstBlocker?: string } };
      const planJson = JSON.parse(
        readFileSync(result.outputRefs.physicalValidationPlan, "utf8"),
      ) as { contractVersion?: string; summary?: { sourceCandidateStatus?: string } };
      const roadmapJson = JSON.parse(
        readFileSync(result.outputRefs.evidenceGapRoadmap, "utf8"),
      ) as { contractVersion?: string; summary?: { nextBestItemId?: string } };
      const falsificationReportJson = JSON.parse(
        readFileSync(result.outputRefs.falsificationReport, "utf8"),
      ) as { contractVersion?: string; disposition?: { reportStatus?: string } };
      const authorityHandoffJson = JSON.parse(
        readFileSync(result.outputRefs.authorityHandoff, "utf8"),
      ) as { contractVersion?: string; summary?: { handoffStatus?: string } };
      const couponPlanJson = JSON.parse(
        readFileSync(result.outputRefs.materialCouponTestPlan, "utf8"),
      ) as { contractVersion?: string; summary?: { nextRequiredTestId?: string } };
      const couponOperatingBudgetJson = JSON.parse(
        readFileSync(result.outputRefs.materialCouponOperatingBudget, "utf8"),
      ) as { contractVersion?: string; summary?: { firstBlocker?: string } };
      const forceGapPlanJson = JSON.parse(
        readFileSync(result.outputRefs.forceGapPullInTestPlan, "utf8"),
      ) as { contractVersion?: string; summary?: { nextRequiredTestId?: string } };
      const forceGapLoadBudgetJson = JSON.parse(
        readFileSync(result.outputRefs.forceGapLoadBudget, "utf8"),
      ) as { contractVersion?: string; summary?: { firstBlocker?: string } };
      const roughnessPatchPlanJson = JSON.parse(
        readFileSync(result.outputRefs.roughnessPatchTestPlan, "utf8"),
      ) as { contractVersion?: string; summary?: { nextRequiredTestId?: string } };
      const roughnessPatchOperatingBudgetJson = JSON.parse(
        readFileSync(result.outputRefs.roughnessPatchOperatingBudget, "utf8"),
      ) as { contractVersion?: string; summary?: { firstBlocker?: string } };
      const activeControlPlanJson = JSON.parse(
        readFileSync(result.outputRefs.activeControlTestPlan, "utf8"),
      ) as { contractVersion?: string; summary?: { nextRequiredTestId?: string } };
      const activeControlOperatingBudgetJson = JSON.parse(
        readFileSync(result.outputRefs.activeControlOperatingBudget, "utf8"),
      ) as { contractVersion?: string; summary?: { firstBlocker?: string } };
      const fatigueLayerScalingPlanJson = JSON.parse(
        readFileSync(result.outputRefs.fatigueLayerScalingTestPlan, "utf8"),
      ) as { contractVersion?: string; summary?: { nextRequiredTestId?: string } };
      const fatigueLayerScalingOperatingBudgetJson = JSON.parse(
        readFileSync(result.outputRefs.fatigueLayerScalingOperatingBudget, "utf8"),
      ) as { contractVersion?: string; summary?: { firstBlocker?: string } };
      const fullApparatusTensorPlanJson = JSON.parse(
        readFileSync(result.outputRefs.fullApparatusTensorTestPlan, "utf8"),
      ) as { contractVersion?: string; summary?: { nextRequiredTestId?: string } };
      const fullApparatusTensorOperatingBudgetJson = JSON.parse(
        readFileSync(result.outputRefs.fullApparatusTensorOperatingBudget, "utf8"),
      ) as { contractVersion?: string; summary?: { firstBlocker?: string } };
      const operatingBudgetReadinessJson = JSON.parse(
        readFileSync(result.outputRefs.operatingBudgetReadiness, "utf8"),
      ) as {
        contractVersion?: string;
        summary?: { allOperatingBudgetsReady?: boolean; firstBlocker?: string };
      };

      expect(materialJson.contractVersion).toBe("nhm2_tile_source_material_evidence_receipts/v1");
      expect(materialJson.summary?.firstBlocker).toBe("none");
      expect(planJson.contractVersion).toBe("nhm2_tile_source_physical_validation_plan/v1");
      expect(planJson.summary?.sourceCandidateStatus).toBe("physically_credible_source_candidate");
      expect(roadmapJson.contractVersion).toBe("nhm2_tile_source_evidence_gap_roadmap/v1");
      expect(roadmapJson.summary?.nextBestItemId).toBe("none");
      expect(falsificationReportJson.contractVersion).toBe("nhm2_tile_source_falsification_report/v1");
      expect(falsificationReportJson.disposition?.reportStatus).toBe("candidate_evidence_complete");
      expect(authorityHandoffJson.contractVersion).toBe("nhm2_tile_source_authority_handoff/v1");
      expect(authorityHandoffJson.summary?.handoffStatus).toBe("handoff_ready");
      expect(couponPlanJson.contractVersion).toBe("nhm2_tile_source_material_coupon_test_plan/v1");
      expect(couponPlanJson.summary?.nextRequiredTestId).toBe("none");
      expect(couponOperatingBudgetJson.contractVersion).toBe(
        "nhm2_tile_source_material_coupon_operating_budget/v1",
      );
      expect(couponOperatingBudgetJson.summary?.firstBlocker).toBe("none");
      expect(forceGapPlanJson.contractVersion).toBe("nhm2_tile_source_force_gap_pull_in_test_plan/v1");
      expect(forceGapPlanJson.summary?.nextRequiredTestId).toBe("none");
      expect(forceGapLoadBudgetJson.contractVersion).toBe("nhm2_tile_source_force_gap_load_budget/v1");
      expect(forceGapLoadBudgetJson.summary?.firstBlocker).toBe("none");
      expect(roughnessPatchPlanJson.contractVersion).toBe("nhm2_tile_source_roughness_patch_test_plan/v1");
      expect(roughnessPatchPlanJson.summary?.nextRequiredTestId).toBe("none");
      expect(roughnessPatchOperatingBudgetJson.contractVersion).toBe(
        "nhm2_tile_source_roughness_patch_operating_budget/v1",
      );
      expect(roughnessPatchOperatingBudgetJson.summary?.firstBlocker).toBe("none");
      expect(activeControlPlanJson.contractVersion).toBe("nhm2_tile_source_active_control_test_plan/v1");
      expect(activeControlPlanJson.summary?.nextRequiredTestId).toBe("none");
      expect(activeControlOperatingBudgetJson.contractVersion).toBe(
        "nhm2_tile_source_active_control_operating_budget/v1",
      );
      expect(activeControlOperatingBudgetJson.summary?.firstBlocker).toBe("none");
      expect(fatigueLayerScalingPlanJson.contractVersion).toBe("nhm2_tile_source_fatigue_layer_scaling_test_plan/v1");
      expect(fatigueLayerScalingPlanJson.summary?.nextRequiredTestId).toBe("none");
      expect(fatigueLayerScalingOperatingBudgetJson.contractVersion).toBe(
        "nhm2_tile_source_fatigue_layer_scaling_operating_budget/v1",
      );
      expect(fatigueLayerScalingOperatingBudgetJson.summary?.firstBlocker).toBe("none");
      expect(fullApparatusTensorPlanJson.contractVersion).toBe("nhm2_tile_source_full_apparatus_tensor_test_plan/v1");
      expect(fullApparatusTensorPlanJson.summary?.nextRequiredTestId).toBe("none");
      expect(fullApparatusTensorOperatingBudgetJson.contractVersion).toBe(
        "nhm2_tile_source_full_apparatus_tensor_operating_budget/v1",
      );
      expect(fullApparatusTensorOperatingBudgetJson.summary?.firstBlocker).toBe("none");
      expect(operatingBudgetReadinessJson.contractVersion).toBe(
        "nhm2_tile_source_operating_budget_readiness/v1",
      );
      expect(operatingBudgetReadinessJson.summary?.allOperatingBudgetsReady).toBe(true);
      expect(operatingBudgetReadinessJson.summary?.firstBlocker).toBe("none");
      expect(result.operatingBudgetReadiness.summary.physicalViabilityClaimAllowed).toBe(false);
      expect(result.physicalValidationPlan.summary.physicalViabilityClaimAllowed).toBe(false);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("builds a fillable frozen-candidate evidence template without opening claims", () => {
    const template = buildNhm2TileSourceMaterialEvidenceTemplate({ generatedAt });
    const text = JSON.stringify(template);

    expect(template.templateVersion).toBe("nhm2_tile_source_material_evidence_template/v1");
    expect(template.candidateId).toBe("nhm2_447_layer_topology_optimized_lattice_tin_v1");
    expect(template.materialCoupon?.material).toBe("ultra_high_stress_tin");
    expect(template.materialCoupon?.supportStressPa).toBe(5.45707087858e8);
    expect(template.forceGapPullIn?.gapMeters).toBe(8e-9);
    expect(template.activeControl?.switchingRateHz).toBe(15e9);
    expect(template.fullApparatusTensor?.components.T0i).toBe(false);
    expect(template.fullApparatusTensor?.components.offDiagonalTij).toBe(false);
    expect(template.fullApparatusTensor?.termCoverage.supportStructureStressEnergy).toBe(false);
    expect(template.downstreamGateStatuses?.coupled_closure).toBe("not_run");
    expect(template.usage.nullValuesAreMissingEvidence).toBe(true);
    expect(text).not.toMatch(forbiddenPhrase("physical", " viability", " allowed"));
    expect(text).not.toMatch(forbiddenPhrase("transport", " claim", " allowed"));
  });

  it("keeps a filled-from-template publish result in review until evidence is supplied", () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "nhm2-tile-source-material-template-"));
    try {
      const evidencePath = join(tempRoot, "template.json");
      const outDir = join(tempRoot, "out");
      writeFileSync(
        evidencePath,
        `${JSON.stringify(buildNhm2TileSourceMaterialEvidenceTemplate({ generatedAt }), null, 2)}\n`,
        "utf8",
      );

      const result = publishNhm2TileSourceMaterialEvidenceReceipts({
        repoRoot: process.cwd(),
        evidencePath,
        outDir,
        generatedAt,
      });
      const materialSurface = result.materialEvidenceReceipts.receiptSurfaces.find(
        (surface) => surface.surfaceId === "material_coupon",
      );

      expect(result.materialEvidenceReceipts.summary.candidateDisposition).toBe("review");
      expect(result.materialEvidenceReceipts.summary.materialEvidenceReady).toBe(false);
      expect(result.materialEvidenceReceipts.summary.fullApparatusTensorReady).toBe(false);
      expect(result.materialEvidenceReceipts.summary.physicalViabilityClaimAllowed).toBe(false);
      expect(result.physicalValidationPlan.summary.sourceCandidateStatus).toBe("review");
      expect(result.evidenceGapRoadmap.summary.nextBestItemId).toBe("material_coupon");
      expect(result.evidenceGapRoadmap.summary.openItemCount).toBe(7);
      expect(result.falsificationReport.disposition.reportStatus).toBe("review");
      expect(result.falsificationReport.summary.nextRequiredSurfaceId).toBe("material_coupon");
      expect(result.falsificationReport.summary.missingReceiptCount).toBe(7);
      expect(result.authorityHandoff.summary.handoffStatus).toBe("blocked");
      expect(result.authorityHandoff.summary.firstBlocker).toBe("material_coupon_tier_not_measured_or_validated");
      expect(result.materialCouponTestPlan.summary.nextRequiredTestId).toBe("coupon_provenance");
      expect(result.materialCouponTestPlan.summary.openTestCount).toBeGreaterThan(0);
      expect(result.materialCouponOperatingBudget.summary.firstBlocker).toBe(
        "material_coupon_receipt_missing_for_operating_budget",
      );
      expect(result.materialCouponOperatingBudget.operatingTargets.requiredFractureOrYieldStressPa).toBeCloseTo(
        1.091414175716e9,
      );
      expect(result.forceGapPullInTestPlan.summary.nextRequiredTestId).toBe("force_gap_provenance");
      expect(result.forceGapPullInTestPlan.summary.openTestCount).toBeGreaterThan(0);
      expect(result.forceGapLoadBudget.summary.firstBlocker).toBe(
        "force_gap_receipt_missing_for_load_budget",
      );
      expect(result.forceGapLoadBudget.idealLoadBudget.forceScaleKilonewtons).toBeCloseTo(14.17, 1);
      expect(result.roughnessPatchTestPlan.summary.nextRequiredTestId).toBe("roughness_patch_provenance");
      expect(result.roughnessPatchTestPlan.summary.openTestCount).toBeGreaterThan(0);
      expect(result.roughnessPatchOperatingBudget.summary.firstBlocker).toBe(
        "roughness_patch_receipt_missing_for_operating_budget",
      );
      expect(
        result.roughnessPatchOperatingBudget.operatingTargets.residualElectrostaticForceMaxN,
      ).toBeCloseTo(709.419, 2);
      expect(result.activeControlTestPlan.summary.nextRequiredTestId).toBe("active_control_provenance");
      expect(result.activeControlTestPlan.summary.openTestCount).toBeGreaterThan(0);
      expect(result.activeControlOperatingBudget.summary.firstBlocker).toBe(
        "active_control_receipt_missing_for_operating_budget",
      );
      expect(result.activeControlOperatingBudget.operatingTargets.bandwidthMinHz).toBe(30e9);
      expect(result.fatigueLayerScalingTestPlan.summary.nextRequiredTestId).toBe("fatigue_scaling_provenance");
      expect(result.fatigueLayerScalingTestPlan.summary.openTestCount).toBeGreaterThan(0);
      expect(result.fatigueLayerScalingOperatingBudget.summary.firstBlocker).toBe(
        "fatigue_layer_scaling_receipt_missing_for_operating_budget",
      );
      expect(
        result.fatigueLayerScalingOperatingBudget.operatingTargets.effectiveActiveLayerCountMin,
      ).toBeCloseTo(217.242, 3);
      expect(result.fullApparatusTensorTestPlan.summary.nextRequiredTestId).toBe("full_apparatus_tensor_provenance");
      expect(result.fullApparatusTensorTestPlan.summary.openTestCount).toBeGreaterThan(0);
      expect(result.fullApparatusTensorOperatingBudget.summary.firstBlocker).toBe(
        "full_apparatus_tensor_receipt_missing_for_operating_budget",
      );
      expect(result.fullApparatusTensorOperatingBudget.operatingTargets.requiredTermCount).toBe(9);
      expect(result.evidenceGapRoadmap.roadmapItems[0]?.decisionQuestion).toContain("ultra-high-stress TiN");
      expect(materialSurface?.status).toBe("missing");
      expect(materialSurface?.blockers).toContain("material_coupon_tier_not_measured_or_validated");
      expect(result.materialEvidenceReceipts.falsificationMap.length).toBeGreaterThan(0);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("builds an evidence-gap roadmap that prioritizes falsifying force-gap evidence", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      materialCoupon: passingEvidence.materialCoupon,
      forceGapPullIn: {
        evidenceTier: "measured",
        evidenceRef: "receipt://force-gap/failing-8nm-v1",
        forceGapCurveRef: "receipt://force-gap/failing-Fg-curve-v1",
        forceGradientCurveRef: "receipt://force-gap/failing-dFdg-curve-v1",
        stiffnessModelRef: "receipt://force-gap/failing-stiffness-model-v1",
        gapMeters: 8e-9,
        casimirForceN: 1.42e4,
        forceGradientNPerM: 3e6,
        effectiveSpringConstantNPerM: 1e6,
        stictionMargin: 0.8,
        activeGapControlAuthorityN: 1e4,
      },
    });
    const plan = buildNhm2TileSourcePhysicalValidationPlan({
      generatedAt,
      materialEvidenceReceipts: receipts,
    });
    const roadmap = buildNhm2TileSourceEvidenceGapRoadmap({
      materialEvidenceReceipts: receipts,
      physicalValidationPlan: plan,
      materialEvidenceReceiptsRef: "artifact://material-receipts",
      physicalValidationPlanRef: "artifact://validation-plan",
    });
    const forceGap = roadmap.roadmapItems.find((item) => item.itemId === "force_gap_pull_in");

    expect(isNhm2TileSourceEvidenceGapRoadmap(roadmap)).toBe(true);
    expect(roadmap.summary.currentDisposition).toBe("falsified");
    expect(roadmap.summary.nextBestItemId).toBe("force_gap_pull_in");
    expect(roadmap.summary.falsifyingItemCount).toBeGreaterThan(0);
    expect(forceGap?.status).toBe("falsifying");
    expect(forceGap?.noGoCriteria).toContain("pull-in margin below 1");
    expect(forceGap?.numericalMargins.pullInMargin).toBeLessThan(1);
    expect(roadmap.claimBoundary.roadmapDoesNotSupplyEvidence).toBe(true);
    expect(roadmap.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("builds a falsification report for missing evidence without calling it a physical pass", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({ generatedAt });
    const plan = buildNhm2TileSourcePhysicalValidationPlan({
      generatedAt,
      materialEvidenceReceipts: receipts,
    });
    const roadmap = buildNhm2TileSourceEvidenceGapRoadmap({
      materialEvidenceReceipts: receipts,
      physicalValidationPlan: plan,
      materialEvidenceReceiptsRef: "artifact://material-receipts",
      physicalValidationPlanRef: "artifact://validation-plan",
    });
    const forceGapLoadBudget = buildNhm2TileSourceForceGapLoadBudget({
      generatedAt,
      materialEvidenceReceipts: receipts,
    });
    const operatingBudgetReadiness = buildNhm2TileSourceOperatingBudgetReadiness({
      generatedAt,
      materialCouponOperatingBudget: buildNhm2TileSourceMaterialCouponOperatingBudget({
        generatedAt,
      }),
      forceGapLoadBudget,
      roughnessPatchOperatingBudget: buildNhm2TileSourceRoughnessPatchOperatingBudget({
        forceGapLoadBudget,
      }),
      activeControlOperatingBudget: buildNhm2TileSourceActiveControlOperatingBudget({
        forceGapLoadBudget,
      }),
      fatigueLayerScalingOperatingBudget: buildNhm2TileSourceFatigueLayerScalingOperatingBudget({
        generatedAt,
      }),
      fullApparatusTensorOperatingBudget: buildNhm2TileSourceFullApparatusTensorOperatingBudget({
        generatedAt,
      }),
    });
    const report = buildNhm2TileSourceFalsificationReport({
      materialEvidenceReceipts: receipts,
      physicalValidationPlan: plan,
      evidenceGapRoadmap: roadmap,
      operatingBudgetReadiness,
      materialEvidenceReceiptsRef: "artifact://material-receipts",
      physicalValidationPlanRef: "artifact://validation-plan",
      evidenceGapRoadmapRef: "artifact://roadmap",
      operatingBudgetReadinessRef: "artifact://operating-budget-readiness",
    });
    const operatingBudgetRow = report.blockerRows.find(
      (row) =>
        row.blockerId ===
        "material_coupon:material_coupon_receipt_missing_for_operating_budget",
    );
    const materialDomain = report.campaignDomainSummary.find(
      (entry) => entry.campaignDomain === "material_coupon_behavior",
    );
    const forceGapDomain = report.campaignDomainSummary.find(
      (entry) => entry.campaignDomain === "force_gap_pull_in",
    );

    expect(isNhm2TileSourceFalsificationReport(report)).toBe(true);
    expect(report.disposition.reportStatus).toBe("review");
    expect(report.disposition.firstBlocker).toBe("material_coupon_receipt_missing");
    expect(report.currentBlocker).toMatchObject({
      blockerId: "material_coupon_receipt_missing",
      source: "material_evidence_receipts",
      surfaceId: "material_coupon",
      operatingBudgetSurfaceId: null,
      downstreamGateId: null,
      campaignDomain: "material_coupon_behavior",
      evidenceTarget: expect.stringContaining("ultra-high-stress TiN"),
      requiredChange: expect.stringContaining("Supply measured or validated coupon data"),
      falsifiesCurrentCandidate: false,
    });
    expect(report.summary.missingReceiptCount).toBe(7);
    expect(report.summary.failingReceiptCount).toBe(0);
    expect(report.summary.operatingBudgetBlockerCount).toBeGreaterThan(0);
    expect(report.summary.nextRequiredSurfaceId).toBe("material_coupon");
    expect(report.summary.nextRequiredChange).toContain("ultra-high-stress TiN");
    expect(report.campaignDomainSummary.length).toBeGreaterThanOrEqual(8);
    expect(materialDomain).toMatchObject({
      blockerCount: expect.any(Number),
      firstBlocker: "material_coupon_receipt_missing",
      evidenceTarget: expect.stringContaining("candidate-stack coupon behavior"),
    });
    expect(materialDomain?.blockerCount).toBeGreaterThan(0);
    expect(materialDomain?.reviewBlockerCount).toBeGreaterThan(0);
    expect(forceGapDomain?.firstBlocker).toBe(
      "force_gap_curve_and_pull_in_margin_at_8nm_missing",
    );
    expect(forceGapDomain?.evidenceTarget).toContain("8 nm force-gap receipt");
    expect(report.readiness.materialEvidenceReady).toBe(false);
    expect(report.readiness.operatingBudgetsReady).toBe(false);
    expect(report.readiness.physicallyCredibleSourceCandidate).toBe(false);
    expect(report.blockerRows.some((row) => row.blockerId === "material_coupon_receipt_missing")).toBe(true);
    expect(operatingBudgetRow?.source).toBe("operating_budget_readiness");
    expect(operatingBudgetRow?.operatingBudgetSurfaceId).toBe("material_coupon");
    expect(operatingBudgetRow?.campaignDomain).toBe("material_coupon_behavior");
    expect(operatingBudgetRow?.evidenceTarget).toContain("candidate-stack coupon behavior");
    expect(operatingBudgetRow?.numericalMargins).toMatchObject({
      tensileStressMargin: null,
      fractureOrYieldStressMargin: null,
      roughnessRmsMargin: null,
    });
    expect(operatingBudgetRow?.requiredChange).toContain("material_coupon operating evidence");
    expect(report.claimBoundary.reportDoesNotSupplyEvidence).toBe(true);
    expect(report.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("points the falsification report current blocker at operating-budget evidence when receipts are present", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts(passingEvidence);
    const operatingBudgetReadiness = buildNhm2TileSourceOperatingBudgetReadiness({
      generatedAt,
      materialCouponOperatingBudget: buildNhm2TileSourceMaterialCouponOperatingBudget({
        generatedAt,
      }),
      forceGapLoadBudget: buildNhm2TileSourceForceGapLoadBudget({ generatedAt }),
      roughnessPatchOperatingBudget: buildNhm2TileSourceRoughnessPatchOperatingBudget({
        generatedAt,
      }),
      activeControlOperatingBudget: buildNhm2TileSourceActiveControlOperatingBudget({
        generatedAt,
      }),
      fatigueLayerScalingOperatingBudget: buildNhm2TileSourceFatigueLayerScalingOperatingBudget({
        generatedAt,
      }),
      fullApparatusTensorOperatingBudget: buildNhm2TileSourceFullApparatusTensorOperatingBudget({
        generatedAt,
      }),
    });
    const plan = buildNhm2TileSourcePhysicalValidationPlan({
      generatedAt,
      materialEvidenceReceipts: receipts,
      operatingBudgetReadiness,
    });
    const roadmap = buildNhm2TileSourceEvidenceGapRoadmap({
      materialEvidenceReceipts: receipts,
      physicalValidationPlan: plan,
      operatingBudgetReadiness,
    });
    const report = buildNhm2TileSourceFalsificationReport({
      materialEvidenceReceipts: receipts,
      physicalValidationPlan: plan,
      evidenceGapRoadmap: roadmap,
      operatingBudgetReadiness,
    });

    expect(isNhm2TileSourceFalsificationReport(report)).toBe(true);
    expect(report.summary.nextRequiredSurfaceId).toBe("material_coupon");
    expect(report.summary.nextRequiredChange).toContain("447-layer support stress");
    expect(roadmap.summary.operatingBudgetsReady).toBe(false);
    expect(roadmap.summary.nextBestItemId).toBe("material_coupon");
    expect(roadmap.roadmapItems[0]?.operatingBudgetSurfaceId).toBe("material_coupon");
    expect(roadmap.roadmapItems[0]?.operatingBudgetReady).toBe(false);
    expect(roadmap.roadmapItems[0]?.requiredCorrections).toMatchObject({
      missingCurveAndMapRefCount: 5,
      missingMaterialResponseRefCount: 2,
    });
    expect(report.currentBlocker).toMatchObject({
      blockerId: "material_coupon:material_coupon_receipt_missing_for_operating_budget",
      source: "operating_budget_readiness",
      surfaceId: null,
      operatingBudgetSurfaceId: "material_coupon",
      downstreamGateId: null,
      requiredChange: expect.stringContaining("material_coupon operating evidence"),
      falsifiesCurrentCandidate: false,
    });
    expect(report.currentBlocker.numericalMargins).toMatchObject({
      tensileStressMargin: null,
      fractureOrYieldStressMargin: null,
      roughnessRmsMargin: null,
    });
    expect(report.currentBlocker.requiredCorrections).toMatchObject({
      materialMismatch: true,
      tensileStressShortfallPa: null,
      requiredCurveAndMapRefCount: 5,
      missingCurveAndMapRefCount: 5,
      requiredMaterialResponseRefCount: 2,
      missingMaterialResponseRefCount: 2,
      materialResponseNumericValuesAvailable: false,
    });
    expect(report.currentBlocker.requiredChange).toContain("corrections:");
    expect(report.currentBlocker.requiredChange).toContain("missingCurveAndMapRefCount=5");
    expect(report.readiness.materialEvidenceReady).toBe(true);
    expect(report.readiness.operatingBudgetsReady).toBe(false);
    expect(report.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("builds a falsification report with quantitative force-gap no-go margins", () => {
    const failingForceGapEvidence = {
      evidenceTier: "measured" as const,
      evidenceRef: "receipt://force-gap/failing-8nm-v1",
      forceGapCurveRef: "receipt://force-gap/failing-Fg-curve-v1",
      forceGradientCurveRef: "receipt://force-gap/failing-dFdg-curve-v1",
      stiffnessModelRef: "receipt://force-gap/failing-stiffness-model-v1",
      gapMeters: 8e-9,
      casimirForceN: 1.42e4,
      forceGradientNPerM: 3e6,
      effectiveSpringConstantNPerM: 1e6,
      stictionMargin: 0.8,
      activeGapControlAuthorityN: 1e4,
    };
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      materialCoupon: passingEvidence.materialCoupon,
      forceGapPullIn: failingForceGapEvidence,
    });
    const forceGapLoadBudget = buildNhm2TileSourceForceGapLoadBudget({
      generatedAt,
      materialEvidenceReceipts: receipts,
      forceGapPullInEvidence: failingForceGapEvidence,
    });
    const operatingBudgetReadiness = buildNhm2TileSourceOperatingBudgetReadiness({
      generatedAt,
      materialCouponOperatingBudget: buildNhm2TileSourceMaterialCouponOperatingBudget({
        generatedAt,
        materialCouponEvidence: passingEvidence.materialCoupon,
      }),
      forceGapLoadBudget,
      roughnessPatchOperatingBudget: buildNhm2TileSourceRoughnessPatchOperatingBudget({
        forceGapLoadBudget,
      }),
      activeControlOperatingBudget: buildNhm2TileSourceActiveControlOperatingBudget({
        forceGapLoadBudget,
      }),
      fatigueLayerScalingOperatingBudget: buildNhm2TileSourceFatigueLayerScalingOperatingBudget({
        generatedAt,
      }),
      fullApparatusTensorOperatingBudget: buildNhm2TileSourceFullApparatusTensorOperatingBudget({
        generatedAt,
      }),
    });
    const plan = buildNhm2TileSourcePhysicalValidationPlan({
      generatedAt,
      materialEvidenceReceipts: receipts,
      operatingBudgetReadiness,
      downstreamGateStatuses: {
        regional_residual_closure: "fail",
      },
    });
    const roadmap = buildNhm2TileSourceEvidenceGapRoadmap({
      materialEvidenceReceipts: receipts,
      physicalValidationPlan: plan,
    });
    const report = buildNhm2TileSourceFalsificationReport({
      materialEvidenceReceipts: receipts,
      physicalValidationPlan: plan,
      evidenceGapRoadmap: roadmap,
      operatingBudgetReadiness,
    });
    const pullIn = report.blockerRows.find((row) => row.blockerId === "pull_in_margin_below_one");
    const operatingPullIn = report.blockerRows.find(
      (row) => row.blockerId === "force_gap_load:ideal_load_pull_in_margin_below_one",
    );
    const downstream = report.blockerRows.find(
      (row) => row.blockerId === "regional_residual_closure_incomplete",
    );
    const forceGapDomain = report.campaignDomainSummary.find(
      (entry) => entry.campaignDomain === "force_gap_pull_in",
    );
    const downstreamDomain = report.campaignDomainSummary.find(
      (entry) => entry.campaignDomain === "downstream_residual_conservation_qei_observer",
    );

    expect(isNhm2TileSourceFalsificationReport(report)).toBe(true);
    expect(report.disposition.reportStatus).toBe("falsified");
    expect(report.currentBlocker).toMatchObject({
      blockerId: "force_gradient_inconsistent_with_force_curve_at_8nm",
      source: "material_evidence_receipts",
      surfaceId: "force_gap_pull_in",
      campaignDomain: "force_gap_pull_in",
      evidenceTarget: expect.stringContaining("8 nm force-gap receipt"),
      falsifiesCurrentCandidate: true,
    });
    expect(report.currentBlocker.numericalMargin).toBeLessThan(1);
    expect(report.summary.failingReceiptCount).toBe(1);
    expect(report.summary.failingDownstreamGateCount).toBe(1);
    expect(report.summary.falsifyingBlockerCount).toBeGreaterThan(0);
    expect(report.summary.nextRequiredSurfaceId).toBe("force_gap_pull_in");
    expect(forceGapDomain).toMatchObject({
      firstBlocker: "force_gradient_inconsistent_with_force_curve_at_8nm",
      evidenceTarget: expect.stringContaining("8 nm force-gap receipt"),
      evidenceRefs: expect.arrayContaining(["receipt://force-gap/failing-8nm-v1"]),
    });
    expect(forceGapDomain?.falsifyingBlockerCount).toBeGreaterThan(0);
    expect(forceGapDomain?.minimumNumericalMargin).toBeLessThan(1);
    expect(downstreamDomain).toMatchObject({
      firstBlocker: "regional_residual_closure_incomplete",
      evidenceTarget: expect.stringContaining("Downstream gate receipt"),
    });
    expect(pullIn?.surfaceId).toBe("force_gap_pull_in");
    expect(pullIn?.campaignDomain).toBe("force_gap_pull_in");
    expect(pullIn?.numericalMargin).toBeLessThan(1);
    expect(pullIn?.falsifiesCurrentCandidate).toBe(true);
    expect(operatingPullIn?.source).toBe("operating_budget_readiness");
    expect(operatingPullIn?.operatingBudgetSurfaceId).toBe("force_gap_load");
    expect(operatingPullIn?.campaignDomain).toBe("force_gap_pull_in");
    expect(operatingPullIn?.numericalMargin).toBeLessThan(1);
    expect(operatingPullIn?.numericalMargins.pullInMarginToIdealGradient).toBeLessThan(1);
    expect(operatingPullIn?.numericalMargins.stictionMarginToMinimum).toBeLessThan(1);
    expect(operatingPullIn?.numericalMargins.activeAuthorityMarginToIdealLoad).toBeLessThan(1);
    expect(operatingPullIn?.requiredChange).toContain("pullInMarginToIdealGradient=");
    expect(operatingPullIn?.requiredCorrections).toMatchObject({
      pullInMarginDefinition: "effectiveSpringConstantNPerM / idealForceGradientNPerM",
      stictionMarginShortfall: expect.any(Number),
      activeGapControlAuthorityShortfallN: expect.any(Number),
      forceGradientConsistencyShortfall: expect.any(Number),
    });
    expect(operatingPullIn?.requiredChange).toContain("corrections:");
    expect(operatingPullIn?.requiredChange).toContain("stictionMarginShortfall=");
    expect(downstream?.downstreamGateId).toBe("regional_residual_closure");
    expect(downstream?.campaignDomain).toBe("downstream_residual_conservation_qei_observer");
    expect(downstream?.evidenceTarget).toContain("regional residual closure");
    expect(downstream?.falsifiesCurrentCandidate).toBe(true);
    expect(report.summary.transportClaimAllowed).toBe(false);
  });

  it("blocks source-authority handoff when material receipts or tensor evidence are missing", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({ generatedAt });
    const plan = buildNhm2TileSourcePhysicalValidationPlan({
      generatedAt,
      materialEvidenceReceipts: receipts,
    });
    const roadmap = buildNhm2TileSourceEvidenceGapRoadmap({
      materialEvidenceReceipts: receipts,
      physicalValidationPlan: plan,
    });
    const forceGapLoadBudget = buildNhm2TileSourceForceGapLoadBudget({
      generatedAt,
      materialEvidenceReceipts: receipts,
    });
    const operatingBudgetReadiness = buildNhm2TileSourceOperatingBudgetReadiness({
      generatedAt,
      materialCouponOperatingBudget: buildNhm2TileSourceMaterialCouponOperatingBudget({
        generatedAt,
      }),
      forceGapLoadBudget,
      roughnessPatchOperatingBudget: buildNhm2TileSourceRoughnessPatchOperatingBudget({
        forceGapLoadBudget,
      }),
      activeControlOperatingBudget: buildNhm2TileSourceActiveControlOperatingBudget({
        forceGapLoadBudget,
      }),
      fatigueLayerScalingOperatingBudget: buildNhm2TileSourceFatigueLayerScalingOperatingBudget({
        generatedAt,
      }),
      fullApparatusTensorOperatingBudget: buildNhm2TileSourceFullApparatusTensorOperatingBudget({
        generatedAt,
      }),
    });
    const report = buildNhm2TileSourceFalsificationReport({
      materialEvidenceReceipts: receipts,
      physicalValidationPlan: plan,
      evidenceGapRoadmap: roadmap,
      operatingBudgetReadiness,
    });
    const handoff = buildNhm2TileSourceAuthorityHandoff({
      materialEvidenceReceipts: receipts,
      physicalValidationPlan: plan,
      falsificationReport: report,
      operatingBudgetReadiness,
    });
    const materialGate = handoff.gates.find((gate) => gate.gateId === "material_receipts");
    const tensorGate = handoff.gates.find((gate) => gate.gateId === "full_apparatus_tensor");
    const operatingBudgetGate = handoff.gates.find(
      (gate) => gate.gateId === "operating_budget_readiness",
    );
    const componentDetailGate = handoff.gates.find(
      (gate) => gate.gateId === "component_detail_refs",
    );

    expect(isNhm2TileSourceAuthorityHandoff(handoff)).toBe(true);
    expect(handoff.summary.handoffStatus).toBe("blocked");
    expect(handoff.summary.handoffReadyForSameBasisAuthority).toBe(false);
    expect(handoff.summary.firstBlocker).toBe("material_coupon_receipt_missing");
    expect(materialGate?.status).toBe("missing");
    expect(materialGate?.blockers).toContain("material_coupon_receipt_missing");
    expect(tensorGate?.status).toBe("missing");
    expect(tensorGate?.blockers).toContain("support_drive_terms_in_full_apparatus_Tmunu_missing");
    expect(operatingBudgetGate?.status).toBe("review");
    expect(operatingBudgetGate?.blockers).toContain(
      "material_coupon:material_coupon_receipt_missing_for_operating_budget",
    );
    expect(operatingBudgetGate?.requiredCorrections).toMatchObject({
      "material_coupon.missingCurveAndMapRefCount": 5,
      "material_coupon.missingMaterialResponseRefCount": 2,
      "full_apparatus_tensor.tensorComponentRefMissingCount": 10,
    });
    expect(componentDetailGate?.status).toBe("review");
    expect(componentDetailGate?.blockers).toContain(
      "full_apparatus_T01_ref_missing_for_operating_budget",
    );
    expect(componentDetailGate?.requiredCorrections).toMatchObject({
      tensorComponentRefMissingCount: 10,
      missingTensorComponentIds: expect.arrayContaining(["T01", "T12", "T33"]),
    });
    expect(handoff.summary.operatingBudgetsReady).toBe(false);
    expect(handoff.summary.fullApparatusComponentDetailRefsReady).toBe(false);
    expect(handoff.summary.firstRequiredCorrections).toMatchObject({
      "material_coupon.missingCurveAndMapRefCount": 5,
    });
    expect(handoff.claimBoundary.handoffDoesNotRunSameBasisAuthority).toBe(true);
    expect(handoff.claimBoundary.operatingBudgetReadinessDoesNotValidateMaterialSource).toBe(true);
    expect(handoff.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("allows source-authority handoff for complete receipts without opening physical claims", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts(passingEvidence);
    const operatingBudgetReadiness = buildPassingOperatingBudgetReadiness(receipts);
    const plan = buildNhm2TileSourcePhysicalValidationPlan({
      generatedAt,
      materialEvidenceReceipts: receipts,
      operatingBudgetReadiness,
      downstreamGateStatuses: allDownstreamPass,
    });
    const roadmap = buildNhm2TileSourceEvidenceGapRoadmap({
      materialEvidenceReceipts: receipts,
      physicalValidationPlan: plan,
    });
    const report = buildNhm2TileSourceFalsificationReport({
      materialEvidenceReceipts: receipts,
      physicalValidationPlan: plan,
      evidenceGapRoadmap: roadmap,
      operatingBudgetReadiness,
    });
    const handoff = buildNhm2TileSourceAuthorityHandoff({
      materialEvidenceReceipts: receipts,
      physicalValidationPlan: plan,
      falsificationReport: report,
      operatingBudgetReadiness,
    });

    expect(isNhm2TileSourceAuthorityHandoff(handoff)).toBe(true);
    expect(handoff.summary.handoffStatus).toBe("handoff_ready");
    expect(handoff.summary.handoffReadyForSameBasisAuthority).toBe(true);
    expect(handoff.summary.materialEvidenceReady).toBe(true);
    expect(handoff.summary.fullApparatusTensorReady).toBe(true);
    expect(handoff.summary.fullApparatusComponentDetailRefsReady).toBe(true);
    expect(handoff.summary.sourceAuthorityEvidenceReady).toBe(true);
    expect(handoff.summary.operatingBudgetsReady).toBe(true);
    expect(handoff.summary.physicalValidationStillRequired).toBe(true);
    expect(handoff.gates.every((gate) => gate.status === "pass")).toBe(true);
    expect(handoff.gates.every((gate) => Object.keys(gate.requiredCorrections).length === 0)).toBe(
      true,
    );
    expect(handoff.summary.firstRequiredCorrections).toEqual({});
    expect(handoff.handoffTarget.targetContractVersion).toBe(
      "nhm2_source_side_same_basis_tensor_authority/v1",
    );
    expect(handoff.handoffTarget.requiresTensorComponents).toEqual([
      "T00",
      "T01",
      "T02",
      "T03",
      "T11",
      "T12",
      "T13",
      "T22",
      "T23",
      "T33",
    ]);
    expect(handoff.sourceRefs.fullApparatusTensorOperatingBudgetRef).toBe(
      "artifact://full-apparatus-tensor-budget",
    );
    expect(handoff.claimBoundary.handoffReadyIsNotPhysicalCredibility).toBe(true);
    expect(handoff.summary.transportClaimAllowed).toBe(false);
  });

  it("blocks same-basis authority handoff when full-apparatus tensor only has grouped component refs", () => {
    const groupedOnlyEvidence = {
      ...passingEvidence.fullApparatusTensor!,
      componentDetailRefs: undefined,
    };
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      ...passingEvidence,
      fullApparatusTensor: groupedOnlyEvidence,
    });
    const forceGapLoadBudget = buildNhm2TileSourceForceGapLoadBudget({
      generatedAt,
      materialEvidenceReceipts: receipts,
      forceGapPullInEvidence: passingEvidence.forceGapPullIn,
    });
    const operatingBudgetReadiness = buildNhm2TileSourceOperatingBudgetReadiness({
      generatedAt,
      materialCouponOperatingBudget: buildNhm2TileSourceMaterialCouponOperatingBudget({
        generatedAt,
        materialCouponEvidence: passingEvidence.materialCoupon,
      }),
      forceGapLoadBudget,
      roughnessPatchOperatingBudget: buildNhm2TileSourceRoughnessPatchOperatingBudget({
        forceGapLoadBudget,
        roughnessPatchEvidence: passingEvidence.roughnessPatch,
      }),
      activeControlOperatingBudget: buildNhm2TileSourceActiveControlOperatingBudget({
        forceGapLoadBudget,
        activeControlEvidence: passingEvidence.activeControl,
      }),
      fatigueLayerScalingOperatingBudget: buildNhm2TileSourceFatigueLayerScalingOperatingBudget({
        generatedAt,
        fatigueLayerScalingEvidence: passingEvidence.fatigueLayerScaling,
      }),
      fullApparatusTensorOperatingBudget: buildNhm2TileSourceFullApparatusTensorOperatingBudget({
        generatedAt,
        fullApparatusTensorEvidence: groupedOnlyEvidence,
      }),
      fullApparatusTensorOperatingBudgetRef: "artifact://grouped-only-full-apparatus-budget",
    });
    const plan = buildNhm2TileSourcePhysicalValidationPlan({
      generatedAt,
      materialEvidenceReceipts: receipts,
      operatingBudgetReadiness,
      downstreamGateStatuses: allDownstreamPass,
    });
    const roadmap = buildNhm2TileSourceEvidenceGapRoadmap({
      materialEvidenceReceipts: receipts,
      physicalValidationPlan: plan,
    });
    const report = buildNhm2TileSourceFalsificationReport({
      materialEvidenceReceipts: receipts,
      physicalValidationPlan: plan,
      evidenceGapRoadmap: roadmap,
      operatingBudgetReadiness,
    });
    const handoff = buildNhm2TileSourceAuthorityHandoff({
      materialEvidenceReceipts: receipts,
      physicalValidationPlan: plan,
      falsificationReport: report,
      operatingBudgetReadiness,
    });
    const componentDetailGate = handoff.gates.find(
      (gate) => gate.gateId === "component_detail_refs",
    );
    const tensorGate = handoff.gates.find((gate) => gate.gateId === "full_apparatus_tensor");

    expect(isNhm2TileSourceAuthorityHandoff(handoff)).toBe(true);
    expect(receipts.summary.fullApparatusTensorReady).toBe(false);
    expect(operatingBudgetReadiness.summary.allOperatingBudgetsReady).toBe(false);
    expect(handoff.summary.handoffReadyForSameBasisAuthority).toBe(false);
    expect(handoff.summary.fullApparatusComponentDetailRefsReady).toBe(false);
    expect(handoff.summary.handoffStatus).toBe("falsified");
    expect(tensorGate?.status).toBe("fail");
    expect(componentDetailGate?.status).toBe("fail");
    expect(componentDetailGate?.blockers).toEqual(
      expect.arrayContaining([
        "full_apparatus_T01_ref_missing_for_operating_budget",
        "full_apparatus_T12_ref_missing_for_operating_budget",
        "full_apparatus_T33_ref_missing_for_operating_budget",
      ]),
    );
    expect(componentDetailGate?.requiredCorrections).toMatchObject({
      tensorComponentRefMissingCount: 10,
      missingTensorComponentIds: expect.arrayContaining(["T01", "T12", "T33"]),
      requiredTensorComponentCount: 10,
    });
    expect(handoff.sourceRefs.fullApparatusTensorOperatingBudgetRef).toBe(
      "artifact://grouped-only-full-apparatus-budget",
    );
    expect(handoff.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("builds a material-coupon test plan with explicit missing coupon tests", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      materialCoupon: {
        evidenceTier: "missing",
        evidenceRef: null,
        material: "ultra_high_stress_tin",
        measuredTensileStressPa: null,
        fractureOrYieldStressPa: null,
        supportStressPa: 5.45707087858e8,
        cryogenicTemperatureK: null,
        dielectricResponseRef: null,
        conductivityRef: null,
        roughnessRmsMeters: null,
        fabricationToleranceMeters: null,
      },
    });
    const plan = buildNhm2TileSourceMaterialCouponTestPlan({
      materialEvidenceReceipts: receipts,
      materialEvidenceReceiptsRef: "artifact://material-receipts",
    });
    const fractureYield = plan.testItems.find((item) => item.testId === "fracture_yield_margin");

    expect(isNhm2TileSourceMaterialCouponTestPlan(plan)).toBe(true);
    expect(plan.couponTarget.requiredFractureOrYieldStressPa).toBeCloseTo(1.091414175716e9);
    expect(plan.summary.materialCouponReceiptStatus).toBe("missing");
    expect(plan.summary.nextRequiredTestId).toBe("coupon_provenance");
    expect(plan.summary.couponEvidenceReady).toBe(false);
    expect(fractureYield?.status).toBe("open");
    expect(fractureYield?.blockerIds).toContain("fracture_or_yield_margin_missing");
    expect(plan.claimBoundary.measuredCouponIsNotFullApparatusTensor).toBe(true);
    expect(plan.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("maps an absent material-coupon receipt to the coupon provenance test", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({ generatedAt });
    const plan = buildNhm2TileSourceMaterialCouponTestPlan({ materialEvidenceReceipts: receipts });
    const provenance = plan.testItems.find((item) => item.testId === "coupon_provenance");

    expect(receipts.summary.firstBlocker).toBe("material_coupon_receipt_missing");
    expect(plan.summary.nextRequiredTestId).toBe("coupon_provenance");
    expect(provenance?.status).toBe("open");
    expect(provenance?.blockerIds).toContain("material_coupon_receipt_missing");
    expect(plan.summary.couponEvidenceReady).toBe(false);
  });

  it("marks a measured but under-strength coupon as falsifying", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      materialCoupon: {
        evidenceTier: "measured",
        evidenceRef: "receipt://coupon/tin/under-strength-v1",
        tensileStressCurveRef: "receipt://coupon/tin/under-strength-tensile-curve-v1",
        fractureYieldCurveRef: "receipt://coupon/tin/under-strength-fracture-yield-curve-v1",
        cryogenicStateRef: "receipt://coupon/tin/under-strength-cryogenic-state-v1",
        roughnessMapRef: "receipt://coupon/tin/under-strength-roughness-map-v1",
        fabricationToleranceMapRef: "receipt://coupon/tin/under-strength-fabrication-map-v1",
        material: "ultra_high_stress_tin",
        measuredTensileStressPa: 8e8,
        fractureOrYieldStressPa: 8e8,
        supportStressPa: 5.45707087858e8,
        cryogenicTemperatureK: 4,
        dielectricResponseRef: "receipt://dielectric/tin/v1",
        conductivityRef: "receipt://conductivity/tin/v1",
        materialResponseFrequencyHz: 15e9,
        dielectricResponseTemperatureK: 4,
        conductivityTemperatureK: 4,
        dielectricLossTangent: 0.002,
        conductivitySiemensPerMeter: 1.2e6,
        roughnessRmsMeters: 5e-11,
        fabricationToleranceMeters: 5e-10,
      },
    });
    const plan = buildNhm2TileSourceMaterialCouponTestPlan({ materialEvidenceReceipts: receipts });
    const fractureYield = plan.testItems.find((item) => item.testId === "fracture_yield_margin");

    expect(receipts.summary.candidateDisposition).toBe("falsified");
    expect(plan.summary.materialCouponReceiptStatus).toBe("fail");
    expect(plan.summary.nextRequiredTestId).toBe("fracture_yield_margin");
    expect(plan.summary.falsifiesCurrentCandidate).toBe(true);
    expect(fractureYield?.status).toBe("falsifying");
    expect(fractureYield?.blockerIds).toContain("fracture_or_yield_margin_below_2x_support_stress");
    expect(plan.summary.transportClaimAllowed).toBe(false);
  });

  it("builds material-coupon operating targets for the ultra-high-stress TiN candidate", () => {
    const budget = buildNhm2TileSourceMaterialCouponOperatingBudget({ generatedAt });

    expect(isNhm2TileSourceMaterialCouponOperatingBudget(budget)).toBe(true);
    expect(budget.operatingTargets.material).toBe("ultra_high_stress_tin");
    expect(budget.operatingTargets.layerCount).toBe(447);
    expect(budget.operatingTargets.operatingTemperatureK).toBe(4);
    expect(budget.operatingTargets.supportStressPa).toBe(5.45707087858e8);
    expect(budget.operatingTargets.requiredFractureOrYieldStressPa).toBeCloseTo(1.091414175716e9);
    expect(budget.operatingTargets.fabricationToleranceMaxMeters).toBe(5e-10);
    expect(budget.operatingTargets.materialResponseFrequencyHz).toBe(15e9);
    expect(budget.requiredCorrections.materialMismatch).toBe(true);
    expect(budget.requiredCorrections.supportStressPa).toBe(5.45707087858e8);
    expect(budget.requiredCorrections.tensileStressShortfallPa).toBeNull();
    expect(budget.requiredCorrections.requiredFractureOrYieldStressPa).toBeCloseTo(
      1.091414175716e9,
    );
    expect(budget.requiredCorrections.fractureOrYieldStressShortfallPa).toBeNull();
    expect(budget.requiredCorrections.cryogenicTemperatureReductionK).toBeNull();
    expect(budget.requiredCorrections.materialResponseFrequencyAbsDeltaHz).toBeNull();
    expect(budget.requiredCorrections.roughnessRmsReductionMeters).toBeNull();
    expect(budget.requiredCorrections.fabricationToleranceReductionMeters).toBeNull();
    expect(budget.requiredCorrections.missingCurveAndMapRefCount).toBe(5);
    expect(budget.requiredCorrections.missingMaterialResponseRefCount).toBe(2);
    expect(budget.requiredCorrections.materialResponseNumericValuesAvailable).toBe(false);
    expect(budget.summary.firstBlocker).toBe("material_coupon_receipt_missing_for_operating_budget");
    expect(budget.claimBoundary.materialResponseRefsDoNotSubstituteForFullTensor).toBe(true);
  });

  it("clears material-coupon operating budget when measured TiN coupon margins pass", () => {
    const budget = buildNhm2TileSourceMaterialCouponOperatingBudget({
      generatedAt,
      materialCouponEvidence: passingEvidence.materialCoupon,
    });

    expect(budget.summary.materialCouponEvidenceReady).toBe(true);
    expect(budget.summary.firstBlocker).toBe("none");
    expect(budget.derivedOperatingBudget.curveAndMapRefsAvailable).toBe(true);
    expect(budget.suppliedMaterialCouponEvidence.tensileStressCurveRef).toBe(
      "receipt://coupon/tin/tensile-stress-curve-4k-v1",
    );
    expect(budget.derivedOperatingBudget.tensileStressMargin).toBeGreaterThan(1);
    expect(budget.derivedOperatingBudget.fractureOrYieldStressMargin).toBeGreaterThan(1);
    expect(budget.derivedOperatingBudget.cryogenicTemperatureMargin).toBe(1);
    expect(budget.derivedOperatingBudget.materialResponseFrequencyMargin).toBe(1);
    expect(budget.derivedOperatingBudget.dielectricTemperatureMargin).toBe(1);
    expect(budget.derivedOperatingBudget.conductivityTemperatureMargin).toBe(1);
    expect(budget.derivedOperatingBudget.materialResponseValuesAvailable).toBe(true);
    expect(budget.suppliedMaterialCouponEvidence.dielectricLossTangent).toBe(0.002);
    expect(budget.suppliedMaterialCouponEvidence.conductivitySiemensPerMeter).toBe(1.2e6);
    expect(budget.derivedOperatingBudget.roughnessRmsMargin).toBeGreaterThan(1);
    expect(budget.derivedOperatingBudget.fabricationToleranceMargin).toBe(1);
    expect(budget.requiredCorrections.materialMismatch).toBe(false);
    expect(budget.requiredCorrections.tensileStressShortfallPa).toBe(0);
    expect(budget.requiredCorrections.fractureOrYieldStressShortfallPa).toBe(0);
    expect(budget.requiredCorrections.cryogenicTemperatureReductionK).toBe(0);
    expect(budget.requiredCorrections.materialResponseFrequencyAbsDeltaHz).toBe(0);
    expect(budget.requiredCorrections.dielectricTemperatureReductionK).toBe(0);
    expect(budget.requiredCorrections.conductivityTemperatureReductionK).toBe(0);
    expect(budget.requiredCorrections.roughnessRmsReductionMeters).toBe(0);
    expect(budget.requiredCorrections.fabricationToleranceReductionMeters).toBe(0);
    expect(budget.requiredCorrections.missingCurveAndMapRefCount).toBe(0);
    expect(budget.requiredCorrections.missingMaterialResponseRefCount).toBe(0);
    expect(budget.requiredCorrections.materialResponseNumericValuesAvailable).toBe(true);
    expect(budget.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("falsifies material-coupon operating budget when strength or metrology margins fail", () => {
    const budget = buildNhm2TileSourceMaterialCouponOperatingBudget({
      generatedAt,
      materialCouponEvidence: {
        evidenceTier: "measured",
        evidenceRef: "receipt://coupon/tin/failing-operating-budget-v1",
        tensileStressCurveRef: "receipt://coupon/tin/failing-tensile-curve-v1",
        fractureYieldCurveRef: "receipt://coupon/tin/failing-fracture-yield-curve-v1",
        cryogenicStateRef: "receipt://coupon/tin/failing-cryogenic-state-v1",
        roughnessMapRef: "receipt://coupon/tin/failing-roughness-map-v1",
        fabricationToleranceMapRef: "receipt://coupon/tin/failing-fabrication-map-v1",
        material: "ultra_high_stress_tin",
        measuredTensileStressPa: 4e8,
        fractureOrYieldStressPa: 8e8,
        supportStressPa: 5.45707087858e8,
        cryogenicTemperatureK: 6,
        dielectricResponseRef: null,
        conductivityRef: null,
        materialResponseFrequencyHz: 7.5e9,
        dielectricResponseTemperatureK: 6,
        conductivityTemperatureK: 6,
        dielectricLossTangent: null,
        conductivitySiemensPerMeter: null,
        roughnessRmsMeters: 2e-10,
        fabricationToleranceMeters: 1e-9,
      },
    });

    expect(budget.summary.falsifiesCurrentCandidate).toBe(true);
    expect(budget.blockers).toEqual(
      expect.arrayContaining([
        "measured_tensile_stress_below_support_stress_operating_budget",
        "fracture_or_yield_margin_below_2x_support_stress_operating_budget",
        "cryogenic_temperature_above_4k_operating_budget",
        "dielectric_response_ref_missing_for_operating_budget",
        "conductivity_ref_missing_for_operating_budget",
        "material_response_frequency_not_15ghz_for_operating_budget",
        "dielectric_response_temperature_above_4k_for_operating_budget",
        "conductivity_temperature_above_4k_for_operating_budget",
        "material_response_numeric_values_missing_for_operating_budget",
        "coupon_roughness_rms_above_0p1nm_operating_budget",
        "fabrication_tolerance_above_0p5nm_operating_budget",
      ]),
    );
    expect(budget.derivedOperatingBudget.tensileStressMargin).toBeLessThan(1);
    expect(budget.derivedOperatingBudget.fractureOrYieldStressMargin).toBeLessThan(1);
    expect(budget.derivedOperatingBudget.roughnessRmsMargin).toBeLessThan(1);
    expect(budget.requiredCorrections.materialMismatch).toBe(false);
    expect(budget.requiredCorrections.tensileStressShortfallPa).toBeCloseTo(1.45707087858e8);
    expect(budget.requiredCorrections.fractureOrYieldStressShortfallPa).toBeCloseTo(
      2.91414175716e8,
    );
    expect(budget.requiredCorrections.cryogenicTemperatureReductionK).toBe(2);
    expect(budget.requiredCorrections.materialResponseFrequencyAbsDeltaHz).toBe(7.5e9);
    expect(budget.requiredCorrections.dielectricTemperatureReductionK).toBe(2);
    expect(budget.requiredCorrections.conductivityTemperatureReductionK).toBe(2);
    expect(budget.requiredCorrections.roughnessRmsReductionMeters).toBeCloseTo(1e-10, 15);
    expect(budget.requiredCorrections.fabricationToleranceReductionMeters).toBeCloseTo(5e-10, 15);
    expect(budget.requiredCorrections.missingCurveAndMapRefCount).toBe(0);
    expect(budget.requiredCorrections.missingMaterialResponseRefCount).toBe(2);
    expect(budget.requiredCorrections.materialResponseNumericValuesAvailable).toBe(false);
    expect(budget.summary.transportClaimAllowed).toBe(false);
  });

  it("blocks scalar-only material-coupon values without stress curve and metrology provenance", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      materialCoupon: {
        evidenceTier: "measured",
        evidenceRef: "receipt://coupon/tin/scalar-only-v1",
        material: "ultra_high_stress_tin",
        measuredTensileStressPa: 2.3e9,
        fractureOrYieldStressPa: 2.1e9,
        supportStressPa: 5.45707087858e8,
        cryogenicTemperatureK: 4,
        dielectricResponseRef: "receipt://dielectric/tin/v1",
        conductivityRef: "receipt://conductivity/tin/v1",
        roughnessRmsMeters: 5e-11,
        fabricationToleranceMeters: 5e-10,
      },
    });
    const plan = buildNhm2TileSourceMaterialCouponTestPlan({ materialEvidenceReceipts: receipts });
    const budget = buildNhm2TileSourceMaterialCouponOperatingBudget({
      generatedAt,
      materialCouponEvidence: {
        evidenceTier: "measured",
        evidenceRef: "receipt://coupon/tin/scalar-only-v1",
        material: "ultra_high_stress_tin",
        measuredTensileStressPa: 2.3e9,
        fractureOrYieldStressPa: 2.1e9,
        supportStressPa: 5.45707087858e8,
        cryogenicTemperatureK: 4,
        dielectricResponseRef: "receipt://dielectric/tin/v1",
        conductivityRef: "receipt://conductivity/tin/v1",
        roughnessRmsMeters: 5e-11,
        fabricationToleranceMeters: 5e-10,
      },
    });
    const materialSurface = receipts.receiptSurfaces.find(
      (surface) => surface.surfaceId === "material_coupon",
    );
    const provenance = plan.testItems.find((item) => item.testId === "coupon_provenance");

    expect(materialSurface?.status).toBe("fail");
    expect(materialSurface?.blockers).toEqual(
      expect.arrayContaining([
        "tensile_stress_curve_ref_missing",
        "fracture_yield_curve_ref_missing",
        "cryogenic_state_ref_missing",
        "coupon_roughness_map_ref_missing",
        "fabrication_tolerance_map_ref_missing",
        "material_response_numeric_values_missing",
      ]),
    );
    expect(materialSurface?.numericalMargins.couponProvenanceRefsAvailable).toBe(0);
    expect(plan.summary.nextRequiredTestId).toBe("coupon_provenance");
    expect(provenance?.status).toBe("falsifying");
    expect(budget.summary.materialCouponEvidenceReady).toBe(false);
    expect(budget.derivedOperatingBudget.curveAndMapRefsAvailable).toBe(false);
    expect(budget.requiredCorrections.materialMismatch).toBe(false);
    expect(budget.requiredCorrections.tensileStressShortfallPa).toBe(0);
    expect(budget.requiredCorrections.fractureOrYieldStressShortfallPa).toBe(0);
    expect(budget.requiredCorrections.missingCurveAndMapRefCount).toBe(5);
    expect(budget.requiredCorrections.missingMaterialResponseRefCount).toBe(0);
    expect(budget.requiredCorrections.materialResponseNumericValuesAvailable).toBe(false);
    expect(budget.blockers).toEqual(
      expect.arrayContaining([
        "tensile_stress_curve_ref_missing_for_operating_budget",
        "fracture_yield_curve_ref_missing_for_operating_budget",
        "cryogenic_state_ref_missing_for_operating_budget",
        "coupon_roughness_map_ref_missing_for_operating_budget",
        "fabrication_tolerance_map_ref_missing_for_operating_budget",
        "material_response_numeric_values_missing_for_operating_budget",
      ]),
    );
  });

  it("maps an absent force-gap receipt to force-gap provenance", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({ generatedAt });
    const plan = buildNhm2TileSourceForceGapPullInTestPlan({
      materialEvidenceReceipts: receipts,
      materialEvidenceReceiptsRef: "artifact://material-receipts",
    });
    const provenance = plan.testItems.find((item) => item.testId === "force_gap_provenance");

    expect(isNhm2TileSourceForceGapPullInTestPlan(plan)).toBe(true);
    expect(plan.forceGapTarget.operatingGapMeters).toBe(8e-9);
    expect(plan.forceGapTarget.forceGradientConsistencyMin).toBe(0.75);
    expect(plan.summary.forceGapReceiptStatus).toBe("missing");
    expect(plan.summary.nextRequiredTestId).toBe("force_gap_provenance");
    expect(provenance?.status).toBe("open");
    expect(provenance?.blockerIds).toContain("force_gap_curve_and_pull_in_margin_at_8nm_missing");
    expect(plan.summary.forceGapEvidenceReady).toBe(false);
    expect(plan.claimBoundary.forceGapPassIsNotFullApparatusTensor).toBe(true);
  });

  it("marks a measured force-gap pull-in failure as falsifying", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      forceGapPullIn: {
        evidenceTier: "measured",
        evidenceRef: "receipt://force-gap/failing-8nm-v1",
        forceGapCurveRef: "receipt://force-gap/failing-Fg-curve-v1",
        forceGradientCurveRef: "receipt://force-gap/failing-dFdg-curve-v1",
        stiffnessModelRef: "receipt://force-gap/failing-stiffness-model-v1",
        gapMeters: 8e-9,
        casimirForceN: 1.42e4,
        forceGradientNPerM: 3e6,
        effectiveSpringConstantNPerM: 1e6,
        stictionMargin: 0.8,
        activeGapControlAuthorityN: 1e4,
      },
    });
    const plan = buildNhm2TileSourceForceGapPullInTestPlan({ materialEvidenceReceipts: receipts });
    const forceGradient = plan.testItems.find((item) => item.testId === "force_gradient");
    const pullIn = plan.testItems.find((item) => item.testId === "pull_in_margin");
    const stiction = plan.testItems.find((item) => item.testId === "stiction_margin");
    const activeAuthority = plan.testItems.find(
      (item) => item.testId === "active_gap_control_authority",
    );

    expect(receipts.summary.candidateDisposition).toBe("falsified");
    expect(plan.summary.forceGapReceiptStatus).toBe("fail");
    expect(plan.summary.nextRequiredTestId).toBe("force_gradient");
    expect(plan.summary.pullInMargin).toBeLessThan(1);
    expect(plan.summary.stictionMargin).toBeLessThan(1);
    expect(plan.summary.activeAuthorityMargin).toBeLessThan(1);
    expect(plan.summary.falsifiesCurrentCandidate).toBe(true);
    expect(forceGradient?.status).toBe("falsifying");
    expect(forceGradient?.blockerIds).toContain("force_gradient_inconsistent_with_force_curve_at_8nm");
    expect(pullIn?.status).toBe("falsifying");
    expect(stiction?.status).toBe("falsifying");
    expect(activeAuthority?.status).toBe("falsifying");
    expect(activeAuthority?.blockerIds).toContain("active_gap_control_authority_below_1p2x_force");
    expect(plan.summary.transportClaimAllowed).toBe(false);
  });

  it("keeps scalar-only force-gap evidence blocked without curve and stiffness provenance", () => {
    const scalarOnlyForceGapEvidence = {
      evidenceTier: "measured" as const,
      evidenceRef: "receipt://force-gap/scalar-only-8nm-v1",
      gapMeters: 8e-9,
      casimirForceN: 1.42e4,
      forceGradientNPerM: 7.1e12,
      effectiveSpringConstantNPerM: 8.6e12,
      stictionMargin: 1.5,
      activeGapControlAuthorityN: 2e4,
    };
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      forceGapPullIn: scalarOnlyForceGapEvidence,
    });
    const plan = buildNhm2TileSourceForceGapPullInTestPlan({ materialEvidenceReceipts: receipts });
    const budget = buildNhm2TileSourceForceGapLoadBudget({
      generatedAt,
      forceGapPullInEvidence: scalarOnlyForceGapEvidence,
    });
    const provenance = plan.testItems.find((item) => item.testId === "force_gap_provenance");

    expect(plan.summary.forceGapEvidenceReady).toBe(false);
    expect(plan.summary.nextRequiredTestId).toBe("force_gap_provenance");
    expect(provenance?.blockerIds).toEqual(
      expect.arrayContaining([
        "force_gap_curve_ref_missing",
        "force_gradient_curve_ref_missing",
        "force_gap_stiffness_model_ref_missing",
      ]),
    );
    expect(budget.summary.forceGapEvidenceReady).toBe(false);
    expect(budget.margins.curveModelRefsAvailable).toBe(false);
    expect(budget.blockers).toEqual(
      expect.arrayContaining([
        "force_gap_curve_ref_missing_for_load_budget",
        "force_gradient_curve_ref_missing_for_load_budget",
        "force_gap_stiffness_model_ref_missing_for_load_budget",
      ]),
    );
    expect(budget.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("builds the frozen 447-layer ideal force-gap load budget", () => {
    const budget = buildNhm2TileSourceForceGapLoadBudget({ generatedAt });

    expect(isNhm2TileSourceForceGapLoadBudget(budget)).toBe(true);
    expect(budget.frozenGeometry.gapMeters).toBe(8e-9);
    expect(budget.frozenGeometry.tileAreaMeters2).toBe(1e-4);
    expect(budget.frozenGeometry.layerCount).toBe(447);
    expect(budget.idealLoadBudget.forcePer447LayerStackN).toBeCloseTo(14188.38, 2);
    expect(budget.idealLoadBudget.forceScaleKilonewtons).toBeCloseTo(14.188, 2);
    expect(budget.idealLoadBudget.requiredActiveGapControlAuthorityN).toBeCloseTo(17026.06, 2);
    expect(budget.idealLoadBudget.forceGradientConsistencyMin).toBe(0.75);
    expect(budget.suppliedForceGapEvidence.stictionMargin).toBeNull();
    expect(budget.margins.stictionMarginToMinimum).toBeNull();
    expect(budget.requiredCorrections.pullInMarginDefinition).toBe(
      "effectiveSpringConstantNPerM / idealForceGradientNPerM",
    );
    expect(budget.requiredCorrections.springConstantMinNPerM).toBe(
      budget.idealLoadBudget.forceGradientNPerM,
    );
    expect(budget.requiredCorrections.springConstantShortfallNPerM).toBeNull();
    expect(budget.requiredCorrections.activeGapControlAuthorityMinN).toBe(
      budget.idealLoadBudget.requiredActiveGapControlAuthorityN,
    );
    expect(budget.requiredCorrections.activeGapControlAuthorityShortfallN).toBeNull();
    expect(budget.requiredCorrections.suppliedForceAbsTargetN).toBeCloseTo(14188.38, 2);
    expect(budget.summary.firstBlocker).toBe("force_gap_receipt_missing_for_load_budget");
    expect(budget.claimBoundary.internalLoadIsNotThrust).toBe(true);
  });

  it("clears the force-gap load budget with validated stiffness and control authority", () => {
    const budget = buildNhm2TileSourceForceGapLoadBudget({
      generatedAt,
      forceGapPullInEvidence: passingEvidence.forceGapPullIn,
    });

    expect(budget.summary.forceGapEvidenceReady).toBe(true);
    expect(budget.summary.firstBlocker).toBe("none");
    expect(budget.margins.curveModelRefsAvailable).toBe(true);
    expect(budget.suppliedForceGapEvidence.forceGapCurveRef).toBe("receipt://force-gap/Fg-curve-8nm-v1");
    expect(budget.margins.suppliedForceToIdealStackForce).toBeCloseTo(1, 1);
    expect(budget.margins.suppliedGradientConsistencyWithForceCurve).toBeGreaterThan(0.75);
    expect(budget.margins.pullInMarginToIdealGradient).toBeGreaterThan(1);
    expect(budget.margins.stictionMarginToMinimum).toBeGreaterThan(1);
    expect(budget.margins.activeAuthorityMarginToIdealLoad).toBeGreaterThan(1);
    expect(budget.requiredCorrections.springConstantShortfallNPerM).toBe(0);
    expect(budget.requiredCorrections.stictionMarginShortfall).toBe(0);
    expect(budget.requiredCorrections.activeGapControlAuthorityShortfallN).toBe(0);
    expect(budget.requiredCorrections.forceGradientConsistencyShortfall).toBe(0);
    expect(budget.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("falsifies the load path when measured stiffness and control authority are below the ideal budget", () => {
    const budget = buildNhm2TileSourceForceGapLoadBudget({
      generatedAt,
      forceGapPullInEvidence: {
        evidenceTier: "measured",
        evidenceRef: "receipt://force-gap/failing-budget-v1",
        forceGapCurveRef: "receipt://force-gap/failing-Fg-curve-v1",
        forceGradientCurveRef: "receipt://force-gap/failing-dFdg-curve-v1",
        stiffnessModelRef: "receipt://force-gap/failing-stiffness-model-v1",
        gapMeters: 8e-9,
        casimirForceN: 1.42e4,
        forceGradientNPerM: 3e6,
        effectiveSpringConstantNPerM: 1e12,
        stictionMargin: 0.8,
        activeGapControlAuthorityN: 1e4,
      },
    });

    expect(budget.summary.falsifiesCurrentCandidate).toBe(true);
    expect(budget.blockers).toEqual(
      expect.arrayContaining([
        "force_gap_gradient_inconsistent_with_force_curve_for_load_budget",
        "ideal_load_pull_in_margin_below_one",
        "force_gap_stiction_margin_below_one_for_load_budget",
        "ideal_load_active_control_authority_below_1p2x_stack_force",
      ]),
    );
    expect(budget.margins.suppliedGradientConsistencyWithForceCurve).toBeLessThan(0.75);
    expect(budget.margins.pullInMarginToIdealGradient).toBeLessThan(1);
    expect(budget.margins.stictionMarginToMinimum).toBeLessThan(1);
    expect(budget.margins.activeAuthorityMarginToIdealLoad).toBeLessThan(1);
    expect(budget.requiredCorrections.springConstantShortfallNPerM).toBeGreaterThan(0);
    expect(budget.requiredCorrections.stictionMarginShortfall).toBeCloseTo(0.2, 6);
    expect(budget.requiredCorrections.activeGapControlAuthorityShortfallN).toBeGreaterThan(0);
    expect(budget.requiredCorrections.forceGradientConsistencyShortfall).toBeGreaterThan(0);
    expect(budget.requiredCorrections.suppliedForceDeltaFromIdealStackForceN).toBeCloseTo(
      11.62,
      1,
    );
    expect(budget.summary.transportClaimAllowed).toBe(false);
  });

  it("maps an absent roughness/patch receipt to roughness-patch provenance", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({ generatedAt });
    const plan = buildNhm2TileSourceRoughnessPatchTestPlan({
      materialEvidenceReceipts: receipts,
      materialEvidenceReceiptsRef: "artifact://material-receipts",
    });
    const provenance = plan.testItems.find((item) => item.testId === "roughness_patch_provenance");

    expect(isNhm2TileSourceRoughnessPatchTestPlan(plan)).toBe(true);
    expect(plan.roughnessPatchTarget.operatingGapMeters).toBe(8e-9);
    expect(plan.roughnessPatchTarget.asperityMaxMeters).toBe(4e-9);
    expect(plan.summary.roughnessPatchReceiptStatus).toBe("missing");
    expect(plan.summary.nextRequiredTestId).toBe("roughness_patch_provenance");
    expect(provenance?.status).toBe("open");
    expect(provenance?.blockerIds).toContain("roughness_asperity_tail_and_patch_potential_map_missing");
    expect(plan.summary.roughnessPatchEvidenceReady).toBe(false);
    expect(plan.claimBoundary.roughnessPatchPassIsNotFullApparatusTensor).toBe(true);
  });

  it("marks roughness, asperity, patch, and residual electrostatic failures as falsifying", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      roughnessPatch: {
        evidenceTier: "measured",
        evidenceRef: "receipt://roughness-patch/failing-8nm-v1",
        roughnessMapRef: "receipt://roughness-patch/maps/failing-roughness-height-v1",
        asperityDistributionRef: "receipt://roughness-patch/maps/failing-asperity-tail-v1",
        patchVoltageMapRef: "receipt://roughness-patch/maps/failing-patch-voltage-v1",
        roughnessRmsMeters: 2e-10,
        asperityP99Meters: 2e-9,
        asperityMaxMeters: 5e-9,
        patchVoltageRmsVolts: 0.02,
        residualElectrostaticForceFraction: 0.08,
        correctionRef: "receipt://roughness-patch/correction-v1",
      },
    });
    const plan = buildNhm2TileSourceRoughnessPatchTestPlan({ materialEvidenceReceipts: receipts });
    const roughness = plan.testItems.find((item) => item.testId === "roughness_rms");
    const asperityTail = plan.testItems.find((item) => item.testId === "asperity_tail");
    const patchVoltage = plan.testItems.find((item) => item.testId === "patch_voltage_rms");
    const residual = plan.testItems.find((item) => item.testId === "residual_electrostatic_force");

    expect(receipts.summary.candidateDisposition).toBe("falsified");
    expect(plan.summary.roughnessPatchReceiptStatus).toBe("fail");
    expect(plan.summary.nextRequiredTestId).toBe("roughness_rms");
    expect(plan.summary.roughnessRmsMeters).toBe(2e-10);
    expect(plan.summary.asperityMaxMargin).toBeLessThan(1);
    expect(plan.summary.patchVoltageRmsVolts).toBe(0.02);
    expect(plan.summary.residualElectrostaticForceFraction).toBe(0.08);
    expect(plan.summary.falsifiesCurrentCandidate).toBe(true);
    expect(roughness?.status).toBe("falsifying");
    expect(asperityTail?.status).toBe("falsifying");
    expect(patchVoltage?.status).toBe("falsifying");
    expect(residual?.status).toBe("falsifying");
    expect(residual?.blockerIds).toContain("residual_electrostatic_force_correction_above_5pct_or_missing");
    expect(plan.summary.transportClaimAllowed).toBe(false);
  });

  it("builds roughness/patch operating targets from the frozen 8 nm gap and load budget", () => {
    const budget = buildNhm2TileSourceRoughnessPatchOperatingBudget({ generatedAt });

    expect(isNhm2TileSourceRoughnessPatchOperatingBudget(budget)).toBe(true);
    expect(budget.operatingTargets.gapMeters).toBe(8e-9);
    expect(budget.operatingTargets.roughnessRmsMaxMeters).toBe(1e-10);
    expect(budget.operatingTargets.asperityP99MaxMeters).toBe(2e-9);
    expect(budget.operatingTargets.asperityMaxMeters).toBe(4e-9);
    expect(budget.operatingTargets.residualElectrostaticForceMaxN).toBeCloseTo(709.419, 2);
    expect(budget.requiredCorrections.roughnessRmsMaxMeters).toBe(1e-10);
    expect(budget.requiredCorrections.roughnessRmsReductionMeters).toBeNull();
    expect(budget.requiredCorrections.minimumGapClearanceRequiredMeters).toBe(4e-9);
    expect(budget.requiredCorrections.patchVoltageRmsMaxVolts).toBe(0.01);
    expect(budget.requiredCorrections.residualElectrostaticForceMaxN).toBeCloseTo(709.419, 2);
    expect(budget.requiredCorrections.residualElectrostaticForceReductionN).toBeNull();
    expect(budget.summary.firstBlocker).toBe("roughness_patch_receipt_missing_for_operating_budget");
    expect(budget.claimBoundary.patchElectrostaticTermsMustEnterFullTensor).toBe(true);
  });

  it("clears roughness/patch operating budget when measured margins stay inside targets", () => {
    const budget = buildNhm2TileSourceRoughnessPatchOperatingBudget({
      generatedAt,
      roughnessPatchEvidence: passingEvidence.roughnessPatch,
    });

    expect(budget.summary.roughnessPatchEvidenceReady).toBe(true);
    expect(budget.summary.firstBlocker).toBe("none");
    expect(budget.derivedOperatingBudget.mapRefsAvailable).toBe(true);
    expect(budget.suppliedRoughnessPatchEvidence.roughnessMapRef).toBe(
      "receipt://roughness-patch/maps/roughness-height-v1",
    );
    expect(budget.derivedOperatingBudget.roughnessRmsMargin).toBeGreaterThan(1);
    expect(budget.derivedOperatingBudget.asperityP99Margin).toBeGreaterThan(1);
    expect(budget.derivedOperatingBudget.asperityMaxMargin).toBeGreaterThan(1);
    expect(budget.derivedOperatingBudget.minimumGapClearanceMeters).toBeCloseTo(6e-9);
    expect(budget.derivedOperatingBudget.patchVoltageMargin).toBeGreaterThan(1);
    expect(budget.derivedOperatingBudget.patchVoltageDerivedElectrostaticForceFraction).toBeLessThan(0.05);
    expect(budget.derivedOperatingBudget.patchVoltageDerivedElectrostaticMargin).toBeGreaterThan(1);
    expect(budget.derivedOperatingBudget.residualElectrostaticForceN).toBeCloseTo(283.768, 2);
    expect(budget.derivedOperatingBudget.residualElectrostaticMargin).toBeGreaterThan(1);
    expect(budget.requiredCorrections.roughnessRmsReductionMeters).toBe(0);
    expect(budget.requiredCorrections.asperityP99ReductionMeters).toBe(0);
    expect(budget.requiredCorrections.asperityMaxReductionMeters).toBe(0);
    expect(budget.requiredCorrections.gapClearanceShortfallMeters).toBe(0);
    expect(budget.requiredCorrections.patchVoltageReductionVolts).toBe(0);
    expect(budget.requiredCorrections.patchVoltageDerivedElectrostaticFractionReduction).toBe(0);
    expect(budget.requiredCorrections.residualElectrostaticForceFractionReduction).toBe(0);
    expect(budget.requiredCorrections.residualElectrostaticForceReductionN).toBe(0);
    expect(budget.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("keeps scalar-only roughness/patch evidence blocked without map provenance", () => {
    const scalarOnlyRoughnessEvidence = {
      evidenceTier: "measured" as const,
      evidenceRef: "receipt://roughness-patch/scalar-only-8nm-v1",
      roughnessRmsMeters: 5e-11,
      asperityP99Meters: 1e-9,
      asperityMaxMeters: 2e-9,
      patchVoltageRmsVolts: 5e-3,
      residualElectrostaticForceFraction: 0.02,
      correctionRef: "receipt://roughness-patch/correction-v1",
    };
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      roughnessPatch: scalarOnlyRoughnessEvidence,
    });
    const plan = buildNhm2TileSourceRoughnessPatchTestPlan({ materialEvidenceReceipts: receipts });
    const budget = buildNhm2TileSourceRoughnessPatchOperatingBudget({
      generatedAt,
      roughnessPatchEvidence: scalarOnlyRoughnessEvidence,
    });
    const provenance = plan.testItems.find((item) => item.testId === "roughness_patch_provenance");

    expect(plan.summary.roughnessPatchEvidenceReady).toBe(false);
    expect(plan.summary.nextRequiredTestId).toBe("roughness_patch_provenance");
    expect(provenance?.blockerIds).toEqual(
      expect.arrayContaining([
        "roughness_map_ref_missing",
        "asperity_tail_distribution_ref_missing",
        "patch_voltage_map_ref_missing",
      ]),
    );
    expect(budget.summary.roughnessPatchEvidenceReady).toBe(false);
    expect(budget.derivedOperatingBudget.mapRefsAvailable).toBe(false);
    expect(budget.requiredCorrections.roughnessRmsReductionMeters).toBe(0);
    expect(budget.requiredCorrections.asperityMaxReductionMeters).toBe(0);
    expect(budget.requiredCorrections.patchVoltageReductionVolts).toBe(0);
    expect(budget.requiredCorrections.residualElectrostaticForceFractionReduction).toBe(0);
    expect(budget.blockers).toEqual(
      expect.arrayContaining([
        "roughness_map_ref_missing_for_operating_budget",
        "asperity_tail_distribution_ref_missing_for_operating_budget",
        "patch_voltage_map_ref_missing_for_operating_budget",
      ]),
    );
    expect(budget.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("falsifies roughness/patch evidence when asperities or electrostatic contamination exceed operating budget", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      roughnessPatch: {
        evidenceTier: "measured",
        evidenceRef: "receipt://roughness-patch/failing-operating-budget-v1",
        roughnessMapRef: "receipt://roughness-patch/maps/failing-roughness-height-v1",
        asperityDistributionRef: "receipt://roughness-patch/maps/failing-asperity-tail-v1",
        patchVoltageMapRef: "receipt://roughness-patch/maps/failing-patch-voltage-v1",
        roughnessRmsMeters: 2e-10,
        asperityP99Meters: 3e-9,
        asperityMaxMeters: 9e-9,
        patchVoltageRmsVolts: 1,
        residualElectrostaticForceFraction: 0.08,
        correctionRef: null,
      },
    });
    const budget = buildNhm2TileSourceRoughnessPatchOperatingBudget({
      generatedAt,
      roughnessPatchEvidence: {
        evidenceTier: "measured",
        evidenceRef: "receipt://roughness-patch/failing-operating-budget-v1",
        roughnessMapRef: "receipt://roughness-patch/maps/failing-roughness-height-v1",
        asperityDistributionRef: "receipt://roughness-patch/maps/failing-asperity-tail-v1",
        patchVoltageMapRef: "receipt://roughness-patch/maps/failing-patch-voltage-v1",
        roughnessRmsMeters: 2e-10,
        asperityP99Meters: 3e-9,
        asperityMaxMeters: 9e-9,
        patchVoltageRmsVolts: 1,
        residualElectrostaticForceFraction: 0.08,
        correctionRef: null,
      },
    });
    const roughnessSurface = receipts.receiptSurfaces.find(
      (surface) => surface.surfaceId === "roughness_patch_metrology",
    );

    expect(budget.summary.falsifiesCurrentCandidate).toBe(true);
    expect(roughnessSurface?.blockers).toEqual(
      expect.arrayContaining([
        "patch_voltage_derived_electrostatic_fraction_above_5pct",
        "residual_electrostatic_force_correction_above_5pct_or_missing",
      ]),
    );
    expect(roughnessSurface?.numericalMargins.patchVoltageDerivedElectrostaticForceFraction).toBeGreaterThan(0.05);
    expect(roughnessSurface?.numericalMargins.patchVoltageDerivedElectrostaticMargin).toBeLessThan(1);
    expect(budget.blockers).toEqual(
      expect.arrayContaining([
        "roughness_rms_above_0p1nm_operating_budget",
        "asperity_p99_above_2nm_operating_budget",
        "asperity_max_exceeds_half_gap_operating_budget",
        "asperity_tail_closes_8nm_gap",
        "patch_voltage_above_10mv_operating_budget",
        "residual_electrostatic_force_above_5pct_operating_budget",
        "patch_voltage_derived_electrostatic_fraction_above_5pct_operating_budget",
        "roughness_patch_correction_ref_missing_for_operating_budget",
      ]),
    );
    expect(budget.derivedOperatingBudget.minimumGapClearanceMeters).toBeLessThan(0);
    expect(budget.derivedOperatingBudget.residualElectrostaticForceN).toBeCloseTo(1135.07, 2);
    expect(budget.derivedOperatingBudget.patchVoltageDerivedElectrostaticForceFraction).toBeGreaterThan(0.05);
    expect(budget.derivedOperatingBudget.patchVoltageDerivedElectrostaticMargin).toBeLessThan(1);
    expect(budget.requiredCorrections.roughnessRmsReductionMeters).toBeCloseTo(1e-10, 15);
    expect(budget.requiredCorrections.asperityP99ReductionMeters).toBeCloseTo(1e-9, 15);
    expect(budget.requiredCorrections.asperityMaxReductionMeters).toBeCloseTo(5e-9, 15);
    expect(budget.requiredCorrections.gapClearanceShortfallMeters).toBeCloseTo(5e-9, 15);
    expect(budget.requiredCorrections.patchVoltageReductionVolts).toBeCloseTo(0.99, 12);
    expect(
      budget.requiredCorrections.patchVoltageDerivedElectrostaticFractionReduction,
    ).toBeGreaterThan(0);
    expect(budget.requiredCorrections.residualElectrostaticForceFractionReduction).toBeCloseTo(
      0.03,
      12,
    );
    expect(budget.requiredCorrections.residualElectrostaticForceReductionN).toBeGreaterThan(0);
    expect(budget.summary.transportClaimAllowed).toBe(false);
  });

  it("maps an absent active-control receipt to active-control provenance", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({ generatedAt });
    const plan = buildNhm2TileSourceActiveControlTestPlan({
      materialEvidenceReceipts: receipts,
      materialEvidenceReceiptsRef: "artifact://material-receipts",
    });
    const provenance = plan.testItems.find((item) => item.testId === "active_control_provenance");

    expect(isNhm2TileSourceActiveControlTestPlan(plan)).toBe(true);
    expect(plan.activeControlTarget.switchingRateHz).toBe(15e9);
    expect(plan.activeControlTarget.gapNoiseRmsMaxMeters).toBeCloseTo(8e-11);
    expect(plan.summary.activeControlReceiptStatus).toBe("missing");
    expect(plan.summary.nextRequiredTestId).toBe("active_control_provenance");
    expect(provenance?.status).toBe("open");
    expect(provenance?.blockerIds).toContain("active_gap_control_energy_and_noise_missing");
    expect(plan.summary.activeControlEvidenceReady).toBe(false);
    expect(plan.claimBoundary.activeControlPassIsNotFullApparatusTensor).toBe(true);
    expect(plan.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("marks active-control bandwidth, noise, timing, heat, and failure-mode evidence as falsifying", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      activeControl: {
        evidenceTier: "measured",
        evidenceRef: "receipt://active-control/failing-gap-lock-v1",
        energyWaveformRef: "receipt://active-control/failing-energy-waveform-v1",
        controlTransferFunctionRef: "receipt://active-control/failing-transfer-function-v1",
        gapNoiseTraceRef: "receipt://active-control/failing-gap-noise-trace-v1",
        thermalModelRef: "receipt://active-control/failing-thermal-model-v1",
        heatLoadTraceRef: "receipt://active-control/failing-heat-load-trace-v1",
        timingSyncTraceRef: "receipt://active-control/failing-timing-sync-trace-v1",
        energyPerCycleJ: 1e-9,
        bandwidthHz: 15e9,
        switchingRateHz: 15e9,
        gapNoiseRmsMeters: 2e-10,
        noiseSpectrumRef: null,
        heatLoadW: null,
        timingJitterSeconds: 1e-11,
        failureModeRef: null,
        failureModeCoverage: null,
      },
    });
    const plan = buildNhm2TileSourceActiveControlTestPlan({ materialEvidenceReceipts: receipts });
    const controlBandwidth = plan.testItems.find((item) => item.testId === "control_bandwidth");
    const gapNoise = plan.testItems.find((item) => item.testId === "gap_noise");
    const heatLoad = plan.testItems.find((item) => item.testId === "heat_load");
    const timingJitter = plan.testItems.find((item) => item.testId === "timing_jitter");
    const failureMode = plan.testItems.find((item) => item.testId === "failure_mode");

    expect(receipts.summary.candidateDisposition).toBe("falsified");
    expect(plan.summary.activeControlReceiptStatus).toBe("fail");
    expect(plan.summary.nextRequiredTestId).toBe("active_control_provenance");
    expect(plan.summary.bandwidthMargin).toBeLessThan(1);
    expect(plan.summary.noiseMargin).toBeLessThan(1);
    expect(plan.summary.timingMargin).toBeLessThan(1);
    expect(plan.summary.energyPerCycleJ).toBe(1e-9);
    expect(plan.summary.heatLoadW).toBeNull();
    expect(plan.summary.falsifiesCurrentCandidate).toBe(true);
    expect(controlBandwidth?.status).toBe("falsifying");
    expect(gapNoise?.status).toBe("falsifying");
    expect(heatLoad?.status).toBe("falsifying");
    expect(timingJitter?.status).toBe("falsifying");
    expect(failureMode?.status).toBe("falsifying");
    expect(controlBandwidth?.blockerIds).toContain("gap_lock_bandwidth_below_2x_switching_rate");
    expect(gapNoise?.blockerIds).toContain("gap_noise_above_1pct_gap");
    expect(gapNoise?.blockerIds).toContain("active_control_noise_spectrum_ref_missing");
    expect(timingJitter?.blockerIds).toContain("timing_jitter_above_0p1_cycle");
    expect(heatLoad?.blockerIds).toContain("active_control_heat_load_missing");
    expect(failureMode?.blockerIds).toContain("active_control_failure_mode_ref_missing");
    expect(failureMode?.blockerIds).toContain("active_control_loss_of_lock_failure_mode_missing");
    expect(plan.summary.transportClaimAllowed).toBe(false);
  });

  it("builds active-control operating targets from the frozen 15 GHz cadence", () => {
    const budget = buildNhm2TileSourceActiveControlOperatingBudget({ generatedAt });

    expect(isNhm2TileSourceActiveControlOperatingBudget(budget)).toBe(true);
    expect(budget.operatingTargets.switchingRateHz).toBe(15e9);
    expect(budget.operatingTargets.bandwidthMinHz).toBe(30e9);
    expect(budget.operatingTargets.gapNoiseRmsMaxMeters).toBe(8e-11);
    expect(budget.operatingTargets.timingJitterMaxSeconds).toBeCloseTo(6.666666666666667e-12);
    expect(budget.operatingTargets.requiredGapControlAuthorityN).toBeCloseTo(17026.06, 2);
    expect(budget.derivedOperatingBudget.gapControlAuthorityMargin).toBeNull();
    expect(budget.requiredCorrections.switchingRateTargetHz).toBe(15e9);
    expect(budget.requiredCorrections.switchingRateAbsDeltaHz).toBeNull();
    expect(budget.requiredCorrections.bandwidthMinHz).toBe(30e9);
    expect(budget.requiredCorrections.bandwidthShortfallHz).toBeNull();
    expect(budget.requiredCorrections.gapControlAuthorityMinN).toBeCloseTo(17026.06, 2);
    expect(budget.requiredCorrections.suppliedGapControlAuthorityN).toBeNull();
    expect(budget.requiredCorrections.gapNoiseRmsMaxMeters).toBe(8e-11);
    expect(budget.requiredCorrections.gapNoiseRmsReductionMeters).toBeNull();
    expect(budget.requiredCorrections.requiredTraceRefCount).toBe(8);
    expect(budget.requiredCorrections.missingTraceRefCount).toBe(8);
    expect(budget.requiredCorrections.requiredFailureModeCount).toBe(5);
    expect(budget.requiredCorrections.missingFailureModeCount).toBe(5);
    expect(budget.summary.firstBlocker).toBe("active_control_receipt_missing_for_operating_budget");
    expect(budget.claimBoundary.controllerEvidenceDoesNotSupplyFullApparatusTensor).toBe(true);
  });

  it("clears the active-control operating budget when power, noise, timing, and heat are accounted", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts(passingEvidence);
    const forceGapLoadBudget = buildNhm2TileSourceForceGapLoadBudget({
      generatedAt,
      materialEvidenceReceipts: receipts,
      forceGapPullInEvidence: passingEvidence.forceGapPullIn,
    });
    const budget = buildNhm2TileSourceActiveControlOperatingBudget({
      generatedAt,
      forceGapLoadBudget,
      activeControlEvidence: passingEvidence.activeControl,
    });

    expect(budget.summary.activeControlEvidenceReady).toBe(true);
    expect(budget.summary.firstBlocker).toBe("none");
    expect(budget.derivedOperatingBudget.controlPowerW).toBe(15);
    expect(budget.derivedOperatingBudget.gapControlAuthorityMargin).toBeGreaterThan(1);
    expect(budget.derivedOperatingBudget.activeControlTraceRefsAvailable).toBe(true);
    expect(budget.suppliedActiveControlEvidence.energyWaveformRef).toBe(
      "receipt://active-control/energy-waveform-v1",
    );
    expect(budget.derivedOperatingBudget.noiseSpectrumAvailable).toBe(true);
    expect(budget.derivedOperatingBudget.failureModeCoverageComplete).toBe(true);
    expect(budget.derivedOperatingBudget.switchingRateMargin).toBe(1);
    expect(budget.derivedOperatingBudget.bandwidthMargin).toBeGreaterThan(1);
    expect(budget.derivedOperatingBudget.noiseMargin).toBeGreaterThan(1);
    expect(budget.derivedOperatingBudget.timingMargin).toBeGreaterThan(1);
    expect(budget.derivedOperatingBudget.thermalAccountingMargin).toBeGreaterThan(1);
    expect(budget.requiredCorrections.switchingRateAbsDeltaHz).toBe(0);
    expect(budget.requiredCorrections.bandwidthShortfallHz).toBe(0);
    expect(budget.requiredCorrections.gapControlAuthorityShortfallN).toBe(0);
    expect(budget.requiredCorrections.gapNoiseRmsReductionMeters).toBe(0);
    expect(budget.requiredCorrections.timingJitterReductionSeconds).toBe(0);
    expect(budget.requiredCorrections.heatLoadShortfallW).toBe(0);
    expect(budget.requiredCorrections.energyPerCycleReductionJ).toBe(0);
    expect(budget.requiredCorrections.missingTraceRefCount).toBe(0);
    expect(budget.requiredCorrections.missingFailureModeCount).toBe(0);
    expect(budget.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("falsifies active-control evidence that is complete but not synchronized to the frozen 15 GHz cadence", () => {
    const halfRateActiveControl = {
      ...passingEvidence.activeControl,
      evidenceTier: "measured" as const,
      evidenceRef: "receipt://active-control/half-rate-v1",
      switchingRateHz: 7.5e9,
      bandwidthHz: 45e9,
      timingJitterSeconds: 1e-12,
    };
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      activeControl: halfRateActiveControl,
    });
    const activeSurface = receipts.receiptSurfaces.find(
      (surface) => surface.surfaceId === "active_control_energy",
    );
    const forceGapLoadBudget = buildNhm2TileSourceForceGapLoadBudget({
      generatedAt,
      materialEvidenceReceipts: buildNhm2TileSourceMaterialEvidenceReceipts(passingEvidence),
      forceGapPullInEvidence: passingEvidence.forceGapPullIn,
    });
    const budget = buildNhm2TileSourceActiveControlOperatingBudget({
      generatedAt,
      forceGapLoadBudget,
      activeControlEvidence: halfRateActiveControl,
    });

    expect(activeSurface?.status).toBe("fail");
    expect(activeSurface?.blockers).toContain("active_control_switching_rate_not_15ghz");
    expect(activeSurface?.numericalMargins.switchingRateMargin).toBe(0.5);
    expect(budget.summary.falsifiesCurrentCandidate).toBe(true);
    expect(budget.blockers).toContain("active_control_switching_rate_not_15ghz");
    expect(budget.derivedOperatingBudget.switchingRateMargin).toBe(0.5);
    expect(budget.derivedOperatingBudget.controlPowerW).toBe(7.5);
    expect(budget.requiredCorrections.switchingRateAbsDeltaHz).toBe(7.5e9);
    expect(budget.requiredCorrections.bandwidthShortfallHz).toBe(0);
    expect(budget.requiredCorrections.timingJitterReductionSeconds).toBe(0);
    expect(budget.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("falsifies active-control evidence when the 15 GHz operating budget is thermally or dynamically inconsistent", () => {
    const forceGapLoadBudget = buildNhm2TileSourceForceGapLoadBudget({
      generatedAt,
      forceGapPullInEvidence: {
        evidenceTier: "measured",
        evidenceRef: "receipt://force-gap/insufficient-active-authority-v1",
        forceGapCurveRef: "receipt://force-gap/Fg-curve-active-control-v1",
        forceGradientCurveRef: "receipt://force-gap/dFdg-curve-active-control-v1",
        stiffnessModelRef: "receipt://force-gap/stiffness-model-active-control-v1",
        gapMeters: 8e-9,
        casimirForceN: 1.42e4,
        forceGradientNPerM: 7.1e12,
        effectiveSpringConstantNPerM: 8.6e12,
        stictionMargin: 1.5,
        activeGapControlAuthorityN: 1e4,
      },
    });
    const budget = buildNhm2TileSourceActiveControlOperatingBudget({
      generatedAt,
      forceGapLoadBudget,
      activeControlEvidence: {
        evidenceTier: "measured",
        evidenceRef: "receipt://active-control/failing-operating-budget-v1",
        energyWaveformRef: "receipt://active-control/failing-energy-waveform-v1",
        controlTransferFunctionRef: "receipt://active-control/failing-transfer-function-v1",
        gapNoiseTraceRef: "receipt://active-control/failing-gap-noise-trace-v1",
        thermalModelRef: "receipt://active-control/failing-thermal-model-v1",
        heatLoadTraceRef: "receipt://active-control/failing-heat-load-trace-v1",
        timingSyncTraceRef: "receipt://active-control/failing-timing-sync-trace-v1",
        energyPerCycleJ: 1e-9,
        bandwidthHz: 15e9,
        switchingRateHz: 15e9,
        gapNoiseRmsMeters: 2e-10,
        noiseSpectrumRef: null,
        heatLoadW: 0.1,
        timingJitterSeconds: 1e-11,
        failureModeRef: null,
        failureModeCoverage: null,
      },
    });

    expect(budget.summary.falsifiesCurrentCandidate).toBe(true);
    expect(budget.blockers).toEqual(
      expect.arrayContaining([
        "active_control_bandwidth_below_30ghz",
        "active_control_gap_authority_below_447_layer_load",
        "active_control_gap_noise_above_80pm",
        "active_control_noise_spectrum_ref_missing_for_operating_budget",
        "active_control_timing_jitter_above_0p1_cycle",
        "active_control_heat_load_below_computed_control_power",
        "active_control_failure_mode_ref_missing_for_operating_budget",
        "active_control_loss_of_lock_failure_mode_missing_for_operating_budget",
        "active_control_fail_safe_shutdown_missing_for_operating_budget",
      ]),
    );
    expect(budget.derivedOperatingBudget.controlPowerW).toBe(15);
    expect(budget.derivedOperatingBudget.gapControlAuthorityMargin).toBeLessThan(1);
    expect(budget.derivedOperatingBudget.noiseSpectrumAvailable).toBe(false);
    expect(budget.derivedOperatingBudget.thermalAccountingMargin).toBeLessThan(1);
    expect(budget.requiredCorrections.bandwidthShortfallHz).toBe(15e9);
    expect(budget.requiredCorrections.gapControlAuthorityShortfallN).toBeGreaterThan(0);
    expect(budget.requiredCorrections.gapNoiseRmsReductionMeters).toBeCloseTo(1.2e-10, 18);
    expect(budget.requiredCorrections.timingJitterReductionSeconds).toBeGreaterThan(0);
    expect(budget.requiredCorrections.heatLoadShortfallW).toBeCloseTo(14.9, 6);
    expect(budget.requiredCorrections.energyPerCycleHeatLimitedMaxJ).toBeCloseTo(
      6.666666666666667e-12,
      18,
    );
    expect(budget.requiredCorrections.energyPerCycleReductionJ).toBeGreaterThan(0);
    expect(budget.requiredCorrections.missingTraceRefCount).toBe(2);
    expect(budget.requiredCorrections.missingFailureModeCount).toBe(5);
    expect(budget.summary.transportClaimAllowed).toBe(false);
  });

  it("blocks scalar-only active-control values without waveform, transfer, thermal, and timing traces", () => {
    const scalarOnlyActiveControl = {
      evidenceTier: "measured" as const,
      evidenceRef: "receipt://active-control/scalar-only-gap-lock-v1",
      energyPerCycleJ: 1e-9,
      bandwidthHz: 45e9,
      switchingRateHz: 15e9,
      gapNoiseRmsMeters: 5e-11,
      noiseSpectrumRef: "receipt://active-control/gap-noise-spectrum-v1",
      heatLoadW: 20,
      timingJitterSeconds: 2e-12,
      failureModeRef: "receipt://active-control/failure-modes-v1",
      failureModeCoverage: {
        lossOfLock: false,
        thermalRunaway: false,
        noiseRunaway: false,
        timingDesynchronization: false,
        failSafeShutdown: false,
      },
    };
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      activeControl: scalarOnlyActiveControl,
    });
    const forceGapLoadBudget = buildNhm2TileSourceForceGapLoadBudget({
      generatedAt,
      materialEvidenceReceipts: buildNhm2TileSourceMaterialEvidenceReceipts(passingEvidence),
      forceGapPullInEvidence: passingEvidence.forceGapPullIn,
    });
    const plan = buildNhm2TileSourceActiveControlTestPlan({ materialEvidenceReceipts: receipts });
    const budget = buildNhm2TileSourceActiveControlOperatingBudget({
      generatedAt,
      forceGapLoadBudget,
      activeControlEvidence: scalarOnlyActiveControl,
    });
    const activeSurface = receipts.receiptSurfaces.find(
      (surface) => surface.surfaceId === "active_control_energy",
    );
    const provenance = plan.testItems.find((item) => item.testId === "active_control_provenance");

    expect(activeSurface?.status).toBe("fail");
    expect(activeSurface?.blockers).toEqual(
      expect.arrayContaining([
        "active_control_energy_waveform_ref_missing",
        "active_control_transfer_function_ref_missing",
        "active_control_gap_noise_trace_ref_missing",
        "active_control_thermal_model_ref_missing",
        "active_control_heat_load_trace_ref_missing",
        "active_control_timing_sync_trace_ref_missing",
        "active_control_loss_of_lock_failure_mode_missing",
        "active_control_fail_safe_shutdown_missing",
      ]),
    );
    expect(activeSurface?.numericalMargins.activeControlProvenanceRefsAvailable).toBe(0);
    expect(plan.summary.nextRequiredTestId).toBe("active_control_provenance");
    expect(provenance?.status).toBe("falsifying");
    expect(budget.summary.activeControlEvidenceReady).toBe(false);
    expect(budget.derivedOperatingBudget.activeControlTraceRefsAvailable).toBe(false);
    expect(budget.blockers).toEqual(
      expect.arrayContaining([
        "active_control_energy_waveform_ref_missing_for_operating_budget",
        "active_control_transfer_function_ref_missing_for_operating_budget",
        "active_control_gap_noise_trace_ref_missing_for_operating_budget",
        "active_control_thermal_model_ref_missing_for_operating_budget",
        "active_control_heat_load_trace_ref_missing_for_operating_budget",
        "active_control_timing_sync_trace_ref_missing_for_operating_budget",
        "active_control_loss_of_lock_failure_mode_missing_for_operating_budget",
        "active_control_fail_safe_shutdown_missing_for_operating_budget",
      ]),
    );
    expect(budget.requiredCorrections.bandwidthShortfallHz).toBe(0);
    expect(budget.requiredCorrections.gapNoiseRmsReductionMeters).toBe(0);
    expect(budget.requiredCorrections.timingJitterReductionSeconds).toBe(0);
    expect(budget.requiredCorrections.heatLoadShortfallW).toBe(0);
    expect(budget.requiredCorrections.energyPerCycleReductionJ).toBe(0);
    expect(budget.requiredCorrections.missingTraceRefCount).toBe(6);
    expect(budget.requiredCorrections.missingFailureModeCount).toBe(5);
    expect(budget.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("maps absent fatigue and layer-scaling receipts to fatigue-scaling provenance", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({ generatedAt });
    const plan = buildNhm2TileSourceFatigueLayerScalingTestPlan({
      materialEvidenceReceipts: receipts,
      materialEvidenceReceiptsRef: "artifact://material-receipts",
    });
    const provenance = plan.testItems.find((item) => item.testId === "fatigue_scaling_provenance");

    expect(isNhm2TileSourceFatigueLayerScalingTestPlan(plan)).toBe(true);
    expect(plan.fatigueLayerScalingTarget.layerCount).toBe(447);
    expect(plan.fatigueLayerScalingTarget.layerScalingEfficiencyMin).toBe(0.9);
    expect(plan.fatigueLayerScalingTarget.layerNonadditivityFractionMax).toBe(0.1);
    expect(plan.fatigueLayerScalingTarget.activeAreaRetentionMin).toBe(0.6);
    expect(plan.fatigueLayerScalingTarget.thermalCycleDriftFractionMax).toBe(0.01);
    expect(plan.fatigueLayerScalingTarget.creepDriftFractionMax).toBe(0.01);
    expect(plan.summary.combinedReceiptStatus).toBe("missing");
    expect(plan.summary.nextRequiredTestId).toBe("fatigue_scaling_provenance");
    expect(provenance?.status).toBe("open");
    expect(provenance?.blockerIds).toEqual(
      expect.arrayContaining([
        "fatigue_lifetime_receipt_missing",
        "layer_scaling_nonadditivity_measurement_missing",
      ]),
    );
    expect(plan.summary.fatigueLayerScalingEvidenceReady).toBe(false);
    expect(plan.claimBoundary.fatigueLayerScalingPassIsNotFullApparatusTensor).toBe(true);
    expect(plan.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("marks fatigue lifetime and layer scaling failures as falsifying", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      fatigueLayerScaling: {
        evidenceTier: "measured",
        evidenceRef: "receipt://fatigue-layer-scaling/failing-447-layer-v1",
        cycleProtocolRef: "receipt://fatigue-layer-scaling/failing-cycle-protocol-v1",
        fatigueCurveRef: "receipt://fatigue-layer-scaling/failing-fatigue-curve-v1",
        thermalCycleRef: "receipt://fatigue-layer-scaling/failing-thermal-cycle-v1",
        creepDriftRef: "receipt://fatigue-layer-scaling/failing-creep-drift-v1",
        layerScalingMapRef: "receipt://fatigue-layer-scaling/failing-layer-scaling-map-v1",
        nonadditivityModelRef: "receipt://fatigue-layer-scaling/failing-nonadditivity-model-v1",
        activeAreaMapRef: "receipt://fatigue-layer-scaling/failing-active-area-map-v1",
        supportCouplingMapRef: "receipt://fatigue-layer-scaling/failing-support-coupling-map-v1",
        multiphysicsCouplingRef: "receipt://fatigue-layer-scaling/failing-multiphysics-coupling-v1",
        cycleCountToFailure: 5e8,
        requiredCycleCount: 1e9,
        thermalCycleDriftFraction: 0.02,
        creepDriftFraction: 0.02,
        layerScalingEfficiency: 0.72,
        nonadditivityFraction: 0.2,
        activeAreaRetention: 0.5,
        supportCouplingStatus: "fail",
      },
    });
    const plan = buildNhm2TileSourceFatigueLayerScalingTestPlan({
      materialEvidenceReceipts: receipts,
    });
    const cycleMargin = plan.testItems.find((item) => item.testId === "cycle_margin");
    const thermalCycleDrift = plan.testItems.find(
      (item) => item.testId === "thermal_cycle_drift",
    );
    const creepDrift = plan.testItems.find((item) => item.testId === "creep_drift");
    const scalingEfficiency = plan.testItems.find(
      (item) => item.testId === "layer_scaling_efficiency",
    );
    const nonadditivity = plan.testItems.find((item) => item.testId === "nonadditivity_fraction");
    const activeArea = plan.testItems.find((item) => item.testId === "active_area_retention");
    const supportCoupling = plan.testItems.find((item) => item.testId === "support_coupling");

    expect(receipts.summary.candidateDisposition).toBe("falsified");
    expect(plan.summary.fatigueReceiptStatus).toBe("fail");
    expect(plan.summary.layerScalingReceiptStatus).toBe("fail");
    expect(plan.summary.combinedReceiptStatus).toBe("fail");
    expect(plan.summary.nextRequiredTestId).toBe("cycle_margin");
    expect(plan.summary.cycleMargin).toBeLessThan(1);
    expect(plan.summary.thermalCycleDriftMargin).toBeLessThan(1);
    expect(plan.summary.creepDriftMargin).toBeLessThan(1);
    expect(plan.summary.scalingMargin).toBeLessThan(1);
    expect(plan.summary.nonadditivityMargin).toBeLessThan(1);
    expect(plan.summary.activeAreaMargin).toBeLessThan(1);
    expect(plan.summary.falsifiesCurrentCandidate).toBe(true);
    expect(cycleMargin?.status).toBe("falsifying");
    expect(thermalCycleDrift?.status).toBe("falsifying");
    expect(creepDrift?.status).toBe("falsifying");
    expect(scalingEfficiency?.status).toBe("falsifying");
    expect(nonadditivity?.status).toBe("falsifying");
    expect(activeArea?.status).toBe("falsifying");
    expect(supportCoupling?.status).toBe("falsifying");
    expect(cycleMargin?.blockerIds).toContain("fatigue_cycle_margin_below_required");
    expect(thermalCycleDrift?.blockerIds).toContain("thermal_cycle_drift_above_0p01");
    expect(creepDrift?.blockerIds).toContain("creep_drift_above_0p01");
    expect(scalingEfficiency?.blockerIds).toContain("layer_scaling_efficiency_below_0p9");
    expect(nonadditivity?.blockerIds).toContain("layer_nonadditivity_above_0p1");
    expect(activeArea?.blockerIds).toContain("active_area_retention_below_0p6");
    expect(supportCoupling?.blockerIds).toContain("support_coupling_status_not_pass");
    expect(plan.summary.transportClaimAllowed).toBe(false);
  });

  it("builds fatigue/layer-scaling operating targets for the frozen 447-layer candidate", () => {
    const budget = buildNhm2TileSourceFatigueLayerScalingOperatingBudget({ generatedAt });

    expect(isNhm2TileSourceFatigueLayerScalingOperatingBudget(budget)).toBe(true);
    expect(budget.operatingTargets.layerCount).toBe(447);
    expect(budget.operatingTargets.layerScalingEfficiencyMin).toBe(0.9);
    expect(budget.operatingTargets.layerNonadditivityFractionMax).toBe(0.1);
    expect(budget.operatingTargets.activeAreaRetentionMin).toBe(0.6);
    expect(budget.operatingTargets.sourceTensorRetentionFractionMin).toBe(0.9);
    expect(budget.operatingTargets.thermalCycleDriftFractionMax).toBe(0.01);
    expect(budget.operatingTargets.creepDriftFractionMax).toBe(0.01);
    expect(budget.operatingTargets.effectiveActiveLayerCountMin).toBeCloseTo(217.242, 3);
    expect(budget.operatingTargets.effectiveSourceTensorLayerCountMin).toBeCloseTo(402.3, 3);
    expect(budget.requiredCorrections.cycleMarginMin).toBe(1);
    expect(budget.requiredCorrections.cycleCountRequired).toBeNull();
    expect(budget.requiredCorrections.cycleCountShortfall).toBeNull();
    expect(budget.requiredCorrections.thermalCycleDriftFractionMax).toBe(0.01);
    expect(budget.requiredCorrections.thermalCycleDriftReduction).toBeNull();
    expect(budget.requiredCorrections.layerScalingEfficiencyMin).toBe(0.9);
    expect(budget.requiredCorrections.layerScalingEfficiencyShortfall).toBeNull();
    expect(budget.requiredCorrections.effectiveActiveLayerCountMin).toBeCloseTo(217.242, 3);
    expect(budget.requiredCorrections.effectiveActiveLayerCountShortfall).toBeNull();
    expect(budget.requiredCorrections.effectiveSourceTensorLayerCountMin).toBeCloseTo(402.3, 3);
    expect(budget.requiredCorrections.effectiveSourceTensorLayerCountShortfall).toBeNull();
    expect(budget.requiredCorrections.requiredFatigueProvenanceRefCount).toBe(4);
    expect(budget.requiredCorrections.missingFatigueProvenanceRefCount).toBe(4);
    expect(budget.requiredCorrections.requiredLayerScalingProvenanceRefCount).toBe(5);
    expect(budget.requiredCorrections.missingLayerScalingProvenanceRefCount).toBe(5);
    expect(budget.requiredCorrections.supportCouplingStatusSatisfied).toBe(false);
    expect(budget.summary.firstBlocker).toBe(
      "fatigue_layer_scaling_receipt_missing_for_operating_budget",
    );
    expect(budget.claimBoundary.layerScalingCrossTermsMustEnterFullTensor).toBe(true);
  });

  it("clears fatigue/layer-scaling operating budget when cycle and layer margins pass", () => {
    const budget = buildNhm2TileSourceFatigueLayerScalingOperatingBudget({
      generatedAt,
      fatigueLayerScalingEvidence: passingEvidence.fatigueLayerScaling,
    });

    expect(budget.summary.fatigueLayerScalingEvidenceReady).toBe(true);
    expect(budget.summary.firstBlocker).toBe("none");
    expect(budget.derivedOperatingBudget.fatigueProvenanceRefsAvailable).toBe(true);
    expect(budget.derivedOperatingBudget.layerScalingProvenanceRefsAvailable).toBe(true);
    expect(budget.suppliedFatigueLayerScalingEvidence.cycleProtocolRef).toBe(
      "receipt://fatigue-layer-scaling/cycle-protocol-v1",
    );
    expect(budget.derivedOperatingBudget.cycleMargin).toBeGreaterThan(1);
    expect(budget.derivedOperatingBudget.thermalCycleDriftMargin).toBeGreaterThan(1);
    expect(budget.derivedOperatingBudget.creepDriftMargin).toBeGreaterThan(1);
    expect(budget.derivedOperatingBudget.scalingMargin).toBeGreaterThan(1);
    expect(budget.derivedOperatingBudget.nonadditivityMargin).toBeGreaterThan(1);
    expect(budget.derivedOperatingBudget.activeAreaMargin).toBeGreaterThan(1);
    expect(budget.derivedOperatingBudget.effectiveActiveLayerCount).toBeCloseTo(403.4175, 5);
    expect(budget.derivedOperatingBudget.effectiveActiveLayerCountMargin).toBeGreaterThan(1);
    expect(budget.derivedOperatingBudget.sourceTensorRetentionFraction).toBeCloseTo(0.9025, 4);
    expect(budget.derivedOperatingBudget.sourceTensorRetentionMargin).toBeGreaterThan(1);
    expect(budget.requiredCorrections.cycleCountShortfall).toBe(0);
    expect(budget.requiredCorrections.thermalCycleDriftReduction).toBe(0);
    expect(budget.requiredCorrections.creepDriftReduction).toBe(0);
    expect(budget.requiredCorrections.layerScalingEfficiencyShortfall).toBe(0);
    expect(budget.requiredCorrections.layerNonadditivityReduction).toBe(0);
    expect(budget.requiredCorrections.activeAreaRetentionShortfall).toBe(0);
    expect(budget.requiredCorrections.effectiveActiveLayerCountShortfall).toBe(0);
    expect(budget.requiredCorrections.sourceTensorRetentionFractionShortfall).toBe(0);
    expect(budget.requiredCorrections.effectiveSourceTensorLayerCountShortfall).toBe(0);
    expect(budget.requiredCorrections.missingFatigueProvenanceRefCount).toBe(0);
    expect(budget.requiredCorrections.missingLayerScalingProvenanceRefCount).toBe(0);
    expect(budget.requiredCorrections.supportCouplingStatusSatisfied).toBe(true);
    expect(budget.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("falsifies layer scaling when active area clears the mechanical floor but misses source tensor retention", () => {
    const budget = buildNhm2TileSourceFatigueLayerScalingOperatingBudget({
      generatedAt,
      fatigueLayerScalingEvidence: {
        ...passingEvidence.fatigueLayerScaling,
        activeAreaRetention: 0.7,
      },
    });

    expect(budget.derivedOperatingBudget.activeAreaMargin).toBeGreaterThan(1);
    expect(budget.derivedOperatingBudget.sourceTensorRetentionFraction).toBeCloseTo(
      0.632,
      3,
    );
    expect(budget.derivedOperatingBudget.sourceTensorRetentionMargin).toBeLessThan(1);
    expect(budget.blockers).toEqual(
      expect.arrayContaining(["source_tensor_retention_below_0p9_operating_budget"]),
    );
    expect(budget.requiredCorrections.activeAreaRetentionShortfall).toBe(0);
    expect(budget.requiredCorrections.sourceTensorRetentionFractionShortfall).toBeCloseTo(
      0.26825,
      6,
    );
    expect(budget.requiredCorrections.effectiveSourceTensorLayerCountShortfall).toBeCloseTo(
      119.90775,
      4,
    );
    expect(budget.summary.falsifiesCurrentCandidate).toBe(true);
    expect(budget.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("falsifies fatigue/layer scaling when cycle, effective layer, or support margins fail", () => {
    const budget = buildNhm2TileSourceFatigueLayerScalingOperatingBudget({
      generatedAt,
      fatigueLayerScalingEvidence: {
        evidenceTier: "measured",
        evidenceRef: "receipt://fatigue-layer-scaling/failing-operating-budget-v1",
        cycleProtocolRef: "receipt://fatigue-layer-scaling/failing-cycle-protocol-v1",
        fatigueCurveRef: "receipt://fatigue-layer-scaling/failing-fatigue-curve-v1",
        thermalCycleRef: "receipt://fatigue-layer-scaling/failing-thermal-cycle-v1",
        creepDriftRef: "receipt://fatigue-layer-scaling/failing-creep-drift-v1",
        layerScalingMapRef: "receipt://fatigue-layer-scaling/failing-layer-scaling-map-v1",
        nonadditivityModelRef: "receipt://fatigue-layer-scaling/failing-nonadditivity-model-v1",
        activeAreaMapRef: "receipt://fatigue-layer-scaling/failing-active-area-map-v1",
        supportCouplingMapRef: "receipt://fatigue-layer-scaling/failing-support-coupling-map-v1",
        multiphysicsCouplingRef: "receipt://fatigue-layer-scaling/failing-multiphysics-coupling-v1",
        cycleCountToFailure: 5e8,
        requiredCycleCount: 1e9,
        thermalCycleDriftFraction: 0.02,
        creepDriftFraction: 0.02,
        layerScalingEfficiency: 0.72,
        nonadditivityFraction: 0.2,
        activeAreaRetention: 0.5,
        supportCouplingStatus: "fail",
      },
    });

    expect(budget.summary.falsifiesCurrentCandidate).toBe(true);
    expect(budget.blockers).toEqual(
      expect.arrayContaining([
        "fatigue_cycle_margin_below_one_operating_budget",
        "thermal_cycle_drift_above_0p01_operating_budget",
        "creep_drift_above_0p01_operating_budget",
        "layer_scaling_efficiency_below_0p9_operating_budget",
        "layer_nonadditivity_above_0p1_operating_budget",
        "active_area_retention_below_0p6_operating_budget",
        "effective_active_layer_count_below_operating_budget",
        "source_tensor_retention_below_0p9_operating_budget",
        "support_coupling_status_not_pass_for_operating_budget",
      ]),
    );
    expect(budget.derivedOperatingBudget.effectiveActiveLayerCount).toBeCloseTo(128.736, 3);
    expect(budget.derivedOperatingBudget.effectiveActiveLayerCountMargin).toBeLessThan(1);
    expect(budget.requiredCorrections.cycleCountShortfall).toBe(5e8);
    expect(budget.requiredCorrections.thermalCycleDriftReduction).toBeCloseTo(0.01, 12);
    expect(budget.requiredCorrections.creepDriftReduction).toBeCloseTo(0.01, 12);
    expect(budget.requiredCorrections.layerScalingEfficiencyShortfall).toBeCloseTo(0.18, 12);
    expect(budget.requiredCorrections.layerNonadditivityReduction).toBeCloseTo(0.1, 12);
    expect(budget.requiredCorrections.activeAreaRetentionShortfall).toBeCloseTo(0.1, 12);
    expect(budget.requiredCorrections.effectiveActiveLayerCountShortfall).toBeCloseTo(88.506, 3);
    expect(budget.requiredCorrections.sourceTensorRetentionFractionShortfall).toBeCloseTo(
      0.612,
      3,
    );
    expect(budget.requiredCorrections.effectiveSourceTensorLayerCountShortfall).toBeCloseTo(
      273.564,
      3,
    );
    expect(budget.requiredCorrections.supportCouplingStatusSatisfied).toBe(false);
    expect(budget.summary.transportClaimAllowed).toBe(false);
  });

  it("blocks scalar-only fatigue/layer-scaling values without cycle, map, and coupling provenance", () => {
    const scalarOnlyFatigueScaling = {
      evidenceTier: "measured" as const,
      evidenceRef: "receipt://fatigue-layer-scaling/scalar-only-v1",
      cycleCountToFailure: 2e9,
      requiredCycleCount: 1e9,
      layerScalingEfficiency: 0.95,
      nonadditivityFraction: 0.05,
      activeAreaRetention: 0.7,
      supportCouplingStatus: "pass" as const,
    };
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      fatigueLayerScaling: scalarOnlyFatigueScaling,
    });
    const plan = buildNhm2TileSourceFatigueLayerScalingTestPlan({ materialEvidenceReceipts: receipts });
    const budget = buildNhm2TileSourceFatigueLayerScalingOperatingBudget({
      generatedAt,
      fatigueLayerScalingEvidence: scalarOnlyFatigueScaling,
    });
    const fatigueSurface = receipts.receiptSurfaces.find(
      (surface) => surface.surfaceId === "fatigue_lifetime",
    );
    const scalingSurface = receipts.receiptSurfaces.find(
      (surface) => surface.surfaceId === "layer_scaling",
    );
    const provenance = plan.testItems.find((item) => item.testId === "fatigue_scaling_provenance");

    expect(fatigueSurface?.status).toBe("fail");
    expect(scalingSurface?.status).toBe("fail");
    expect(fatigueSurface?.blockers).toEqual(
      expect.arrayContaining([
        "fatigue_cycle_protocol_ref_missing",
        "fatigue_curve_ref_missing",
        "thermal_cycle_ref_missing",
        "creep_drift_ref_missing",
        "thermal_cycle_drift_fraction_missing",
        "creep_drift_fraction_missing",
      ]),
    );
    expect(scalingSurface?.blockers).toEqual(
      expect.arrayContaining([
        "layer_scaling_map_ref_missing",
        "layer_nonadditivity_model_ref_missing",
        "active_area_map_ref_missing",
        "support_coupling_map_ref_missing",
        "multiphysics_coupling_ref_missing",
      ]),
    );
    expect(fatigueSurface?.numericalMargins.fatigueProvenanceRefsAvailable).toBe(0);
    expect(scalingSurface?.numericalMargins.layerScalingProvenanceRefsAvailable).toBe(0);
    expect(plan.summary.nextRequiredTestId).toBe("fatigue_scaling_provenance");
    expect(provenance?.status).toBe("falsifying");
    expect(budget.summary.fatigueLayerScalingEvidenceReady).toBe(false);
    expect(budget.derivedOperatingBudget.fatigueProvenanceRefsAvailable).toBe(false);
    expect(budget.derivedOperatingBudget.layerScalingProvenanceRefsAvailable).toBe(false);
    expect(budget.requiredCorrections.cycleCountShortfall).toBe(0);
    expect(budget.requiredCorrections.thermalCycleDriftReduction).toBeNull();
    expect(budget.requiredCorrections.creepDriftReduction).toBeNull();
    expect(budget.requiredCorrections.layerScalingEfficiencyShortfall).toBe(0);
    expect(budget.requiredCorrections.layerNonadditivityReduction).toBe(0);
    expect(budget.requiredCorrections.activeAreaRetentionShortfall).toBe(0);
    expect(budget.requiredCorrections.missingFatigueProvenanceRefCount).toBe(4);
    expect(budget.requiredCorrections.missingLayerScalingProvenanceRefCount).toBe(5);
    expect(budget.requiredCorrections.supportCouplingStatusSatisfied).toBe(true);
    expect(budget.blockers).toEqual(
      expect.arrayContaining([
        "fatigue_cycle_protocol_ref_missing_for_operating_budget",
        "fatigue_curve_ref_missing_for_operating_budget",
        "thermal_cycle_ref_missing_for_operating_budget",
        "creep_drift_ref_missing_for_operating_budget",
        "thermal_cycle_drift_fraction_missing_for_operating_budget",
        "creep_drift_fraction_missing_for_operating_budget",
        "layer_scaling_map_ref_missing_for_operating_budget",
        "layer_nonadditivity_model_ref_missing_for_operating_budget",
        "active_area_map_ref_missing_for_operating_budget",
        "support_coupling_map_ref_missing_for_operating_budget",
        "multiphysics_coupling_ref_missing_for_operating_budget",
      ]),
    );
    expect(budget.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("maps an absent full-apparatus tensor receipt to tensor provenance", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({ generatedAt });
    const plan = buildNhm2TileSourceFullApparatusTensorTestPlan({
      materialEvidenceReceipts: receipts,
      materialEvidenceReceiptsRef: "artifact://material-receipts",
    });
    const provenance = plan.testItems.find(
      (item) => item.testId === "full_apparatus_tensor_provenance",
    );

    expect(isNhm2TileSourceFullApparatusTensorTestPlan(plan)).toBe(true);
    expect(plan.fullApparatusTensorTarget.requiredComponents).toEqual([
      "T00",
      "T0i",
      "diagonalTij",
      "offDiagonalTij",
    ]);
    expect(plan.fullApparatusTensorTarget.requiredTensorComponentCount).toBe(10);
    expect(plan.fullApparatusTensorTarget.requiredTermCount).toBe(9);
    expect(plan.fullApparatusTensorTarget.requiredRegions).toEqual([
      "wall",
      "hull",
      "exterior_shell",
    ]);
    expect(plan.fullApparatusTensorTarget.sourceSideOnly).toBe(true);
    expect(plan.fullApparatusTensorTarget.targetEchoForbidden).toBe(true);
    expect(plan.summary.fullApparatusTensorReceiptStatus).toBe("missing");
    expect(plan.summary.nextRequiredTestId).toBe("full_apparatus_tensor_provenance");
    expect(provenance?.status).toBe("open");
    expect(provenance?.blockerIds).toContain("support_drive_terms_in_full_apparatus_Tmunu_missing");
    expect(plan.summary.fullApparatusTensorEvidenceReady).toBe(false);
    expect(plan.claimBoundary.scalarCasimirT00IsNotFullApparatusTensor).toBe(true);
    expect(plan.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("marks scalar-like or incomplete full-apparatus tensor evidence as falsifying", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      fullApparatusTensor: {
        evidenceTier: "validated_simulation",
        evidenceRef: "receipt://full-apparatus-tmunu/scalar-like-fail-v1",
        sameChart: true,
        sameBasis: false,
        sameUnits: true,
        noMetricTargetEcho: false,
        components: {
          T00: true,
          T0i: false,
          diagonalTij: true,
          offDiagonalTij: false,
        },
        termCoverage: {
          supportStructureStressEnergy: false,
          spacerContactStressEnergy: false,
          activeControlFieldEnergy: false,
          thermalLoadStressEnergy: false,
          patchPotentialElectrostaticStress: false,
          fatigueDamageEvolution: false,
          layerScalingCrossTerms: false,
          casimirInteractionStressEnergy: true,
          materialStrainEnergy: false,
        },
        regionalCoverage: {
          wall: true,
          hull: false,
          exteriorShell: false,
        },
      },
    });
    const plan = buildNhm2TileSourceFullApparatusTensorTestPlan({
      materialEvidenceReceipts: receipts,
    });
    const sameBasis = plan.testItems.find((item) => item.testId === "same_basis");
    const noEcho = plan.testItems.find((item) => item.testId === "no_metric_target_echo");
    const t0i = plan.testItems.find((item) => item.testId === "T0i_components");
    const offDiagonal = plan.testItems.find(
      (item) => item.testId === "off_diagonal_Tij_components",
    );
    const support = plan.testItems.find(
      (item) => item.testId === "support_structure_stress_energy",
    );
    const activeControl = plan.testItems.find(
      (item) => item.testId === "active_control_field_energy",
    );
    const casimir = plan.testItems.find(
      (item) => item.testId === "casimir_interaction_stress_energy",
    );
    const hull = plan.testItems.find((item) => item.testId === "regional_hull_coverage");

    expect(receipts.summary.candidateDisposition).toBe("falsified");
    expect(plan.summary.fullApparatusTensorReceiptStatus).toBe("fail");
    expect(plan.summary.nextRequiredTestId).toBe("same_basis");
    expect(plan.summary.componentCoverageFraction).toBe(0.5);
    expect(plan.summary.termCoverageFraction).toBeCloseTo(1 / 9);
    expect(plan.summary.falsifiesCurrentCandidate).toBe(true);
    expect(sameBasis?.status).toBe("falsifying");
    expect(noEcho?.status).toBe("falsifying");
    expect(t0i?.status).toBe("falsifying");
    expect(offDiagonal?.status).toBe("falsifying");
    expect(support?.status).toBe("falsifying");
    expect(activeControl?.status).toBe("falsifying");
    expect(casimir?.status).toBe("satisfied");
    expect(hull?.status).toBe("falsifying");
    expect(t0i?.blockerIds).toContain("full_apparatus_T0i_missing");
    expect(offDiagonal?.blockerIds).toContain("full_apparatus_off_diagonal_Tij_missing");
    expect(support?.blockerIds).toContain("full_apparatus_support_structure_stress_energy_missing");
    expect(activeControl?.blockerIds).toContain("full_apparatus_active_control_field_energy_missing");
    expect(hull?.blockerIds).toContain("full_apparatus_hull_region_missing");
    expect(plan.summary.transportClaimAllowed).toBe(false);
  });

  it("builds full-apparatus tensor operating targets with scalar-only forbidden", () => {
    const budget = buildNhm2TileSourceFullApparatusTensorOperatingBudget({ generatedAt });

    expect(isNhm2TileSourceFullApparatusTensorOperatingBudget(budget)).toBe(true);
    expect(budget.operatingTargets.requiredComponentGroupCount).toBe(4);
    expect(budget.operatingTargets.requiredTensorComponentCount).toBe(10);
    expect(budget.operatingTargets.requiredTermCount).toBe(9);
    expect(budget.operatingTargets.requiredRegionCount).toBe(3);
    expect(budget.operatingTargets.scalarT00OnlyForbidden).toBe(true);
    expect(budget.derivedOperatingBudget.componentCoverageFraction).toBe(0);
    expect(budget.derivedOperatingBudget.termCoverageFraction).toBe(0);
    expect(budget.derivedOperatingBudget.regionalCoverageFraction).toBe(0);
    expect(budget.requiredCorrections.componentGroupMissingCount).toBe(4);
    expect(budget.requiredCorrections.missingComponentGroupIds).toEqual([
      "T00",
      "T0i",
      "diagonalTij",
      "offDiagonalTij",
    ]);
    expect(budget.requiredCorrections.componentGroupRefMissingCount).toBe(4);
    expect(budget.requiredCorrections.tensorComponentRefMissingCount).toBe(10);
    expect(budget.requiredCorrections.stressEnergyTermMissingCount).toBe(9);
    expect(budget.requiredCorrections.stressEnergyTermRefMissingCount).toBe(9);
    expect(budget.requiredCorrections.regionCoverageMissingCount).toBe(3);
    expect(budget.requiredCorrections.regionalSupportRefMissingCount).toBe(3);
    expect(budget.requiredCorrections.authorityMetadataMissingCount).toBe(4);
    expect(budget.requiredCorrections.componentCoverageFractionShortfall).toBe(1);
    expect(budget.requiredCorrections.termCoverageFractionShortfall).toBe(1);
    expect(budget.requiredCorrections.regionalCoverageFractionShortfall).toBe(1);
    expect(budget.requiredCorrections.tensorValueArtifactAvailable).toBe(false);
    expect(budget.requiredCorrections.scalarT00OnlyDetected).toBe(false);
    expect(budget.summary.firstBlocker).toBe(
      "full_apparatus_tensor_receipt_missing_for_operating_budget",
    );
    expect(budget.claimBoundary.scalarCasimirT00IsNotFullApparatusTensor).toBe(true);
  });

  it("blocks full-apparatus tensor evidence when coverage flags lack provenance refs", () => {
    const booleanOnlyEvidence = {
      ...passingEvidence.fullApparatusTensor!,
      componentRefs: undefined,
      componentDetailRefs: undefined,
      termRefs: undefined,
      regionalSupportRefs: undefined,
    };
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      fullApparatusTensor: booleanOnlyEvidence,
    });
    const budget = buildNhm2TileSourceFullApparatusTensorOperatingBudget({
      generatedAt,
      fullApparatusTensorEvidence: booleanOnlyEvidence,
    });
    const tensorSurface = receipts.receiptSurfaces.find(
      (surface) => surface.surfaceId === "full_apparatus_tensor",
    );

    expect(tensorSurface?.status).toBe("fail");
    expect(tensorSurface?.blockers).toEqual(
      expect.arrayContaining([
        "full_apparatus_T00_ref_missing",
        "full_apparatus_T0i_ref_missing",
        "full_apparatus_T01_ref_missing",
        "full_apparatus_T12_ref_missing",
        "full_apparatus_support_structure_stress_energy_ref_missing",
        "full_apparatus_wall_region_support_ref_missing",
      ]),
    );
    expect(budget.summary.fullApparatusTensorEvidenceReady).toBe(false);
    expect(budget.derivedOperatingBudget.componentRefsComplete).toBe(false);
    expect(budget.derivedOperatingBudget.componentDetailRefsComplete).toBe(false);
    expect(budget.derivedOperatingBudget.termRefsComplete).toBe(false);
    expect(budget.derivedOperatingBudget.regionalSupportRefsComplete).toBe(false);
    expect(budget.requiredCorrections.componentGroupMissingCount).toBe(0);
    expect(budget.requiredCorrections.componentGroupRefMissingCount).toBe(4);
    expect(budget.requiredCorrections.missingComponentGroupRefIds).toEqual([
      "T00",
      "T0i",
      "diagonalTij",
      "offDiagonalTij",
    ]);
    expect(budget.requiredCorrections.tensorComponentRefMissingCount).toBe(10);
    expect(budget.requiredCorrections.missingTensorComponentIds).toContain("T01");
    expect(budget.requiredCorrections.stressEnergyTermMissingCount).toBe(0);
    expect(budget.requiredCorrections.stressEnergyTermRefMissingCount).toBe(9);
    expect(budget.requiredCorrections.regionCoverageMissingCount).toBe(0);
    expect(budget.requiredCorrections.regionalSupportRefMissingCount).toBe(3);
    expect(budget.blockers).toEqual(
      expect.arrayContaining([
        "full_apparatus_T00_ref_missing_for_operating_budget",
        "full_apparatus_T0i_ref_missing_for_operating_budget",
        "full_apparatus_T01_ref_missing_for_operating_budget",
        "full_apparatus_T12_ref_missing_for_operating_budget",
        "full_apparatus_support_structure_stress_energy_ref_missing_for_operating_budget",
        "full_apparatus_wall_region_support_ref_missing_for_operating_budget",
      ]),
    );
    expect(budget.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("blocks grouped full-apparatus component refs without per-component tensor refs", () => {
    const groupedOnlyEvidence = {
      ...passingEvidence.fullApparatusTensor!,
      componentDetailRefs: undefined,
    };
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      fullApparatusTensor: groupedOnlyEvidence,
    });
    const plan = buildNhm2TileSourceFullApparatusTensorTestPlan({
      materialEvidenceReceipts: receipts,
    });
    const budget = buildNhm2TileSourceFullApparatusTensorOperatingBudget({
      generatedAt,
      fullApparatusTensorEvidence: groupedOnlyEvidence,
    });
    const tensorSurface = receipts.receiptSurfaces.find(
      (surface) => surface.surfaceId === "full_apparatus_tensor",
    );
    const t0i = plan.testItems.find((item) => item.testId === "T0i_components");
    const diagonal = plan.testItems.find((item) => item.testId === "diagonal_Tij_components");
    const offDiagonal = plan.testItems.find(
      (item) => item.testId === "off_diagonal_Tij_components",
    );

    expect(tensorSurface?.status).toBe("fail");
    expect(tensorSurface?.numericalMargins.componentRefsAvailable).toBe(1);
    expect(tensorSurface?.numericalMargins.componentDetailRefsAvailable).toBe(0);
    expect(tensorSurface?.blockers).toEqual(
      expect.arrayContaining([
        "full_apparatus_T01_ref_missing",
        "full_apparatus_T02_ref_missing",
        "full_apparatus_T03_ref_missing",
        "full_apparatus_T11_ref_missing",
        "full_apparatus_T12_ref_missing",
        "full_apparatus_T13_ref_missing",
        "full_apparatus_T22_ref_missing",
        "full_apparatus_T23_ref_missing",
        "full_apparatus_T33_ref_missing",
      ]),
    );
    expect(t0i?.blockerIds).toEqual(
      expect.arrayContaining([
        "full_apparatus_T01_ref_missing",
        "full_apparatus_T02_ref_missing",
        "full_apparatus_T03_ref_missing",
      ]),
    );
    expect(diagonal?.blockerIds).toEqual(
      expect.arrayContaining([
        "full_apparatus_T11_ref_missing",
        "full_apparatus_T22_ref_missing",
        "full_apparatus_T33_ref_missing",
      ]),
    );
    expect(offDiagonal?.blockerIds).toEqual(
      expect.arrayContaining([
        "full_apparatus_T12_ref_missing",
        "full_apparatus_T13_ref_missing",
        "full_apparatus_T23_ref_missing",
      ]),
    );
    expect(budget.summary.fullApparatusTensorEvidenceReady).toBe(false);
    expect(budget.derivedOperatingBudget.componentRefsComplete).toBe(true);
    expect(budget.derivedOperatingBudget.componentDetailRefsComplete).toBe(false);
    expect(budget.requiredCorrections.componentGroupMissingCount).toBe(0);
    expect(budget.requiredCorrections.componentGroupRefMissingCount).toBe(0);
    expect(budget.requiredCorrections.tensorComponentRefMissingCount).toBe(10);
    expect(budget.requiredCorrections.missingTensorComponentIds).toEqual([
      "T00",
      "T01",
      "T02",
      "T03",
      "T11",
      "T12",
      "T13",
      "T22",
      "T23",
      "T33",
    ]);
    expect(budget.blockers).toEqual(
      expect.arrayContaining([
        "full_apparatus_T01_ref_missing_for_operating_budget",
        "full_apparatus_T12_ref_missing_for_operating_budget",
        "full_apparatus_T33_ref_missing_for_operating_budget",
      ]),
    );
    expect(budget.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("blocks full-apparatus tensor operating budget when tensor-value artifact is missing", () => {
    const provenanceOnlyEvidence = {
      ...passingEvidence.fullApparatusTensor!,
      tensorValueArtifactRef: undefined,
      tensorValueArtifactContract: undefined,
    };
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      fullApparatusTensor: provenanceOnlyEvidence,
    });
    const budget = buildNhm2TileSourceFullApparatusTensorOperatingBudget({
      generatedAt,
      fullApparatusTensorEvidence: provenanceOnlyEvidence,
    });
    const tensorSurface = receipts.receiptSurfaces.find(
      (surface) => surface.surfaceId === "full_apparatus_tensor",
    );

    expect(tensorSurface?.status).toBe("fail");
    expect(tensorSurface?.blockers).toEqual(
      expect.arrayContaining([
        "full_apparatus_tensor_value_artifact_ref_missing",
        "full_apparatus_tensor_value_artifact_contract_missing_or_invalid",
      ]),
    );
    expect(tensorSurface?.numericalMargins.tensorValueArtifactAvailable).toBe(0);
    expect(budget.summary.fullApparatusTensorEvidenceReady).toBe(false);
    expect(budget.derivedOperatingBudget.componentDetailRefsComplete).toBe(true);
    expect(budget.derivedOperatingBudget.tensorValueArtifactAvailable).toBe(false);
    expect(budget.requiredCorrections.tensorValueArtifactRequired).toBe(true);
    expect(budget.requiredCorrections.tensorValueArtifactAvailable).toBe(false);
    expect(budget.requiredCorrections.componentGroupMissingCount).toBe(0);
    expect(budget.requiredCorrections.tensorComponentRefMissingCount).toBe(0);
    expect(budget.blockers).toEqual(
      expect.arrayContaining([
        "full_apparatus_tensor_value_artifact_ref_missing_for_operating_budget",
        "full_apparatus_tensor_value_artifact_contract_missing_or_invalid_for_operating_budget",
      ]),
    );
    expect(budget.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("clears full-apparatus tensor operating budget only with full source-side coverage", () => {
    const budget = buildNhm2TileSourceFullApparatusTensorOperatingBudget({
      generatedAt,
      fullApparatusTensorEvidence: passingEvidence.fullApparatusTensor,
    });

    expect(budget.summary.fullApparatusTensorEvidenceReady).toBe(true);
    expect(budget.summary.firstBlocker).toBe("none");
    expect(budget.derivedOperatingBudget.authorityMetadataComplete).toBe(true);
    expect(budget.derivedOperatingBudget.componentRefsComplete).toBe(true);
    expect(budget.derivedOperatingBudget.componentDetailRefsComplete).toBe(true);
    expect(budget.derivedOperatingBudget.tensorValueArtifactAvailable).toBe(true);
    expect(budget.derivedOperatingBudget.termRefsComplete).toBe(true);
    expect(budget.derivedOperatingBudget.regionalSupportRefsComplete).toBe(true);
    expect(budget.derivedOperatingBudget.fullTensorCoverageComplete).toBe(true);
    expect(budget.derivedOperatingBudget.requiredStressEnergyTermsComplete).toBe(true);
    expect(budget.derivedOperatingBudget.requiredRegionalCoverageComplete).toBe(true);
    expect(budget.derivedOperatingBudget.scalarT00Only).toBe(false);
    expect(budget.derivedOperatingBudget.componentCoverageFraction).toBe(1);
    expect(budget.derivedOperatingBudget.termCoverageFraction).toBe(1);
    expect(budget.derivedOperatingBudget.regionalCoverageFraction).toBe(1);
    expect(budget.requiredCorrections.componentGroupMissingCount).toBe(0);
    expect(budget.requiredCorrections.componentGroupRefMissingCount).toBe(0);
    expect(budget.requiredCorrections.tensorComponentRefMissingCount).toBe(0);
    expect(budget.requiredCorrections.stressEnergyTermMissingCount).toBe(0);
    expect(budget.requiredCorrections.stressEnergyTermRefMissingCount).toBe(0);
    expect(budget.requiredCorrections.regionCoverageMissingCount).toBe(0);
    expect(budget.requiredCorrections.regionalSupportRefMissingCount).toBe(0);
    expect(budget.requiredCorrections.authorityMetadataMissingCount).toBe(0);
    expect(budget.requiredCorrections.componentCoverageFractionShortfall).toBe(0);
    expect(budget.requiredCorrections.termCoverageFractionShortfall).toBe(0);
    expect(budget.requiredCorrections.regionalCoverageFractionShortfall).toBe(0);
    expect(budget.requiredCorrections.tensorValueArtifactAvailable).toBe(true);
    expect(budget.requiredCorrections.scalarT00OnlyDetected).toBe(false);
    expect(budget.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("falsifies full-apparatus tensor operating budget when source tensor is scalar-like or incomplete", () => {
    const budget = buildNhm2TileSourceFullApparatusTensorOperatingBudget({
      generatedAt,
      fullApparatusTensorEvidence: {
        evidenceTier: "validated_simulation",
        evidenceRef: "receipt://full-apparatus-tmunu/scalar-like-operating-budget-fail-v1",
        sameChart: true,
        sameBasis: true,
        sameUnits: true,
        noMetricTargetEcho: false,
        components: {
          T00: true,
          T0i: false,
          diagonalTij: false,
          offDiagonalTij: false,
        },
        termCoverage: {
          supportStructureStressEnergy: false,
          spacerContactStressEnergy: false,
          activeControlFieldEnergy: false,
          thermalLoadStressEnergy: false,
          patchPotentialElectrostaticStress: false,
          fatigueDamageEvolution: false,
          layerScalingCrossTerms: false,
          casimirInteractionStressEnergy: true,
          materialStrainEnergy: false,
        },
        regionalCoverage: {
          wall: true,
          hull: false,
          exteriorShell: false,
        },
      },
    });

    expect(budget.summary.falsifiesCurrentCandidate).toBe(true);
    expect(budget.blockers).toEqual(
      expect.arrayContaining([
        "full_apparatus_tensor_metric_echo_detected_or_not_checked_for_operating_budget",
        "full_apparatus_tensor_scalar_T00_only_forbidden",
        "full_apparatus_T0i_missing_for_operating_budget",
        "full_apparatus_diagonal_Tij_missing_for_operating_budget",
        "full_apparatus_off_diagonal_Tij_missing_for_operating_budget",
        "full_apparatus_support_structure_stress_energy_missing_for_operating_budget",
        "full_apparatus_active_control_field_energy_missing_for_operating_budget",
        "full_apparatus_hull_region_missing_for_operating_budget",
      ]),
    );
    expect(budget.derivedOperatingBudget.scalarT00Only).toBe(true);
    expect(budget.derivedOperatingBudget.componentCoverageFraction).toBe(0.25);
    expect(budget.derivedOperatingBudget.termCoverageFraction).toBeCloseTo(1 / 9);
    expect(budget.derivedOperatingBudget.regionalCoverageFraction).toBeCloseTo(1 / 3);
    expect(budget.requiredCorrections.scalarT00OnlyDetected).toBe(true);
    expect(budget.requiredCorrections.missingAuthorityMetadataIds).toContain("noMetricTargetEcho");
    expect(budget.requiredCorrections.componentGroupMissingCount).toBe(3);
    expect(budget.requiredCorrections.missingComponentGroupIds).toEqual([
      "T0i",
      "diagonalTij",
      "offDiagonalTij",
    ]);
    expect(budget.requiredCorrections.stressEnergyTermMissingCount).toBe(8);
    expect(budget.requiredCorrections.missingStressEnergyTermIds).toContain(
      "activeControlFieldEnergy",
    );
    expect(budget.requiredCorrections.regionCoverageMissingCount).toBe(2);
    expect(budget.requiredCorrections.missingRegionIds).toEqual(["hull", "exteriorShell"]);
    expect(budget.requiredCorrections.componentCoverageFractionShortfall).toBe(0.75);
    expect(budget.requiredCorrections.termCoverageFractionShortfall).toBeCloseTo(8 / 9);
    expect(budget.requiredCorrections.regionalCoverageFractionShortfall).toBeCloseTo(2 / 3);
    expect(budget.summary.transportClaimAllowed).toBe(false);
  });

  it("aggregates operating budget readiness without opening physical claims", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts(passingEvidence);
    const forceGapLoadBudget = buildNhm2TileSourceForceGapLoadBudget({
      generatedAt,
      materialEvidenceReceipts: receipts,
      forceGapPullInEvidence: passingEvidence.forceGapPullIn,
    });
    const readiness = buildNhm2TileSourceOperatingBudgetReadiness({
      generatedAt,
      materialCouponOperatingBudget: buildNhm2TileSourceMaterialCouponOperatingBudget({
        generatedAt,
        materialCouponEvidence: passingEvidence.materialCoupon,
      }),
      materialCouponOperatingBudgetRef: "artifact://material-coupon-budget",
      forceGapLoadBudget,
      forceGapLoadBudgetRef: "artifact://force-gap-load-budget",
      roughnessPatchOperatingBudget: buildNhm2TileSourceRoughnessPatchOperatingBudget({
        forceGapLoadBudget,
        roughnessPatchEvidence: passingEvidence.roughnessPatch,
      }),
      roughnessPatchOperatingBudgetRef: "artifact://roughness-patch-budget",
      activeControlOperatingBudget: buildNhm2TileSourceActiveControlOperatingBudget({
        forceGapLoadBudget,
        activeControlEvidence: passingEvidence.activeControl,
      }),
      activeControlOperatingBudgetRef: "artifact://active-control-budget",
      fatigueLayerScalingOperatingBudget: buildNhm2TileSourceFatigueLayerScalingOperatingBudget({
        generatedAt,
        fatigueLayerScalingEvidence: passingEvidence.fatigueLayerScaling,
      }),
      fatigueLayerScalingOperatingBudgetRef: "artifact://fatigue-layer-budget",
      fullApparatusTensorOperatingBudget: buildNhm2TileSourceFullApparatusTensorOperatingBudget({
        generatedAt,
        fullApparatusTensorEvidence: passingEvidence.fullApparatusTensor,
      }),
      fullApparatusTensorOperatingBudgetRef: "artifact://full-apparatus-budget",
    });

    expect(isNhm2TileSourceOperatingBudgetReadiness(readiness)).toBe(true);
    expect(readiness.summary.allOperatingBudgetsReady).toBe(true);
    expect(readiness.summary.firstBlocker).toBe("none");
    expect(readiness.summary.physicalViabilityClaimAllowed).toBe(false);
    expect(readiness.claimBoundary.budgetsDoNotSupplyExperimentalReceipts).toBe(true);
    expect(readiness.claimBoundary.budgetsDoNotSupplyFullTensorValues).toBe(true);
  });

  it("keeps missing operating budget evidence as a campaign blocker", () => {
    const readiness = buildNhm2TileSourceOperatingBudgetReadiness({
      generatedAt,
      materialCouponOperatingBudget: buildNhm2TileSourceMaterialCouponOperatingBudget({
        generatedAt,
      }),
      forceGapLoadBudget: buildNhm2TileSourceForceGapLoadBudget({ generatedAt }),
      roughnessPatchOperatingBudget: buildNhm2TileSourceRoughnessPatchOperatingBudget({
        generatedAt,
      }),
      activeControlOperatingBudget: buildNhm2TileSourceActiveControlOperatingBudget({
        generatedAt,
      }),
      fatigueLayerScalingOperatingBudget: buildNhm2TileSourceFatigueLayerScalingOperatingBudget({
        generatedAt,
      }),
      fullApparatusTensorOperatingBudget: buildNhm2TileSourceFullApparatusTensorOperatingBudget({
        generatedAt,
      }),
    });

    expect(readiness.summary.allOperatingBudgetsReady).toBe(false);
    expect(readiness.summary.firstBlocker).toBe(
      "material_coupon:material_coupon_receipt_missing_for_operating_budget",
    );
    expect(readiness.summary.blockerCount).toBeGreaterThan(0);
    expect(readiness.summary.physicalViabilityClaimAllowed).toBe(false);
    expect(readiness.blockers).toEqual(
      expect.arrayContaining([
        "full_apparatus_tensor:full_apparatus_tensor_receipt_missing_for_operating_budget",
      ]),
    );
  });
});
