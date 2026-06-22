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
  buildNhm2TileSourceFullApparatusTensorTestPlan,
  isNhm2TileSourceFullApparatusTensorTestPlan,
} from "../shared/contracts/nhm2-tile-source-full-apparatus-tensor-test-plan.v1";
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
  forceGapPullIn: {
    evidenceTier: "validated_simulation",
    evidenceRef: "receipt://force-gap/8nm/v1",
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
    energyPerCycleJ: 1e-9,
    bandwidthHz: 45e9,
    switchingRateHz: 15e9,
    gapNoiseRmsMeters: 5e-11,
    heatLoadW: 20,
    timingJitterSeconds: 1e-12,
    failureModeRef: "receipt://active-control/failure-modes-v1",
  },
  fatigueLayerScaling: {
    evidenceTier: "validated_simulation",
    evidenceRef: "receipt://fatigue-layer-scaling/v1",
    cycleCountToFailure: 2e9,
    requiredCycleCount: 1e9,
    layerScalingEfficiency: 0.95,
    nonadditivityFraction: 0.05,
    activeAreaRetention: 0.7,
    supportCouplingStatus: "pass",
  },
  fullApparatusTensor: {
    evidenceTier: "validated_simulation",
    evidenceRef: "receipt://full-apparatus-tmunu/v1",
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
    regionalCoverage: {
      wall: true,
      hull: true,
      exteriorShell: true,
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

  it("feeds the physical validation plan without opening physical or transport claims", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts(passingEvidence);
    const plan = buildNhm2TileSourcePhysicalValidationPlan({
      generatedAt,
      materialEvidenceReceipts: receipts,
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
      const forceGapPlanJson = JSON.parse(
        readFileSync(result.outputRefs.forceGapPullInTestPlan, "utf8"),
      ) as { contractVersion?: string; summary?: { nextRequiredTestId?: string } };
      const forceGapLoadBudgetJson = JSON.parse(
        readFileSync(result.outputRefs.forceGapLoadBudget, "utf8"),
      ) as { contractVersion?: string; summary?: { firstBlocker?: string } };
      const roughnessPatchPlanJson = JSON.parse(
        readFileSync(result.outputRefs.roughnessPatchTestPlan, "utf8"),
      ) as { contractVersion?: string; summary?: { nextRequiredTestId?: string } };
      const activeControlPlanJson = JSON.parse(
        readFileSync(result.outputRefs.activeControlTestPlan, "utf8"),
      ) as { contractVersion?: string; summary?: { nextRequiredTestId?: string } };
      const activeControlOperatingBudgetJson = JSON.parse(
        readFileSync(result.outputRefs.activeControlOperatingBudget, "utf8"),
      ) as { contractVersion?: string; summary?: { firstBlocker?: string } };
      const fatigueLayerScalingPlanJson = JSON.parse(
        readFileSync(result.outputRefs.fatigueLayerScalingTestPlan, "utf8"),
      ) as { contractVersion?: string; summary?: { nextRequiredTestId?: string } };
      const fullApparatusTensorPlanJson = JSON.parse(
        readFileSync(result.outputRefs.fullApparatusTensorTestPlan, "utf8"),
      ) as { contractVersion?: string; summary?: { nextRequiredTestId?: string } };

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
      expect(forceGapPlanJson.contractVersion).toBe("nhm2_tile_source_force_gap_pull_in_test_plan/v1");
      expect(forceGapPlanJson.summary?.nextRequiredTestId).toBe("none");
      expect(forceGapLoadBudgetJson.contractVersion).toBe("nhm2_tile_source_force_gap_load_budget/v1");
      expect(forceGapLoadBudgetJson.summary?.firstBlocker).toBe("none");
      expect(roughnessPatchPlanJson.contractVersion).toBe("nhm2_tile_source_roughness_patch_test_plan/v1");
      expect(roughnessPatchPlanJson.summary?.nextRequiredTestId).toBe("none");
      expect(activeControlPlanJson.contractVersion).toBe("nhm2_tile_source_active_control_test_plan/v1");
      expect(activeControlPlanJson.summary?.nextRequiredTestId).toBe("none");
      expect(activeControlOperatingBudgetJson.contractVersion).toBe(
        "nhm2_tile_source_active_control_operating_budget/v1",
      );
      expect(activeControlOperatingBudgetJson.summary?.firstBlocker).toBe("none");
      expect(fatigueLayerScalingPlanJson.contractVersion).toBe("nhm2_tile_source_fatigue_layer_scaling_test_plan/v1");
      expect(fatigueLayerScalingPlanJson.summary?.nextRequiredTestId).toBe("none");
      expect(fullApparatusTensorPlanJson.contractVersion).toBe("nhm2_tile_source_full_apparatus_tensor_test_plan/v1");
      expect(fullApparatusTensorPlanJson.summary?.nextRequiredTestId).toBe("none");
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
      expect(result.forceGapPullInTestPlan.summary.nextRequiredTestId).toBe("force_gap_provenance");
      expect(result.forceGapPullInTestPlan.summary.openTestCount).toBeGreaterThan(0);
      expect(result.forceGapLoadBudget.summary.firstBlocker).toBe(
        "force_gap_receipt_missing_for_load_budget",
      );
      expect(result.forceGapLoadBudget.idealLoadBudget.forceScaleKilonewtons).toBeCloseTo(14.17, 1);
      expect(result.roughnessPatchTestPlan.summary.nextRequiredTestId).toBe("roughness_patch_provenance");
      expect(result.roughnessPatchTestPlan.summary.openTestCount).toBeGreaterThan(0);
      expect(result.activeControlTestPlan.summary.nextRequiredTestId).toBe("active_control_provenance");
      expect(result.activeControlTestPlan.summary.openTestCount).toBeGreaterThan(0);
      expect(result.activeControlOperatingBudget.summary.firstBlocker).toBe(
        "active_control_receipt_missing_for_operating_budget",
      );
      expect(result.activeControlOperatingBudget.operatingTargets.bandwidthMinHz).toBe(30e9);
      expect(result.fatigueLayerScalingTestPlan.summary.nextRequiredTestId).toBe("fatigue_scaling_provenance");
      expect(result.fatigueLayerScalingTestPlan.summary.openTestCount).toBeGreaterThan(0);
      expect(result.fullApparatusTensorTestPlan.summary.nextRequiredTestId).toBe("full_apparatus_tensor_provenance");
      expect(result.fullApparatusTensorTestPlan.summary.openTestCount).toBeGreaterThan(0);
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
    const report = buildNhm2TileSourceFalsificationReport({
      materialEvidenceReceipts: receipts,
      physicalValidationPlan: plan,
      evidenceGapRoadmap: roadmap,
      materialEvidenceReceiptsRef: "artifact://material-receipts",
      physicalValidationPlanRef: "artifact://validation-plan",
      evidenceGapRoadmapRef: "artifact://roadmap",
    });

    expect(isNhm2TileSourceFalsificationReport(report)).toBe(true);
    expect(report.disposition.reportStatus).toBe("review");
    expect(report.disposition.firstBlocker).toBe("material_coupon_receipt_missing");
    expect(report.summary.missingReceiptCount).toBe(7);
    expect(report.summary.failingReceiptCount).toBe(0);
    expect(report.summary.nextRequiredSurfaceId).toBe("material_coupon");
    expect(report.summary.nextRequiredChange).toContain("ultra-high-stress TiN");
    expect(report.readiness.materialEvidenceReady).toBe(false);
    expect(report.readiness.physicallyCredibleSourceCandidate).toBe(false);
    expect(report.blockerRows.some((row) => row.blockerId === "material_coupon_receipt_missing")).toBe(true);
    expect(report.claimBoundary.reportDoesNotSupplyEvidence).toBe(true);
    expect(report.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("builds a falsification report with quantitative force-gap no-go margins", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      materialCoupon: passingEvidence.materialCoupon,
      forceGapPullIn: {
        evidenceTier: "measured",
        evidenceRef: "receipt://force-gap/failing-8nm-v1",
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
    });
    const pullIn = report.blockerRows.find((row) => row.blockerId === "pull_in_margin_below_one");
    const downstream = report.blockerRows.find(
      (row) => row.blockerId === "regional_residual_closure_incomplete",
    );

    expect(isNhm2TileSourceFalsificationReport(report)).toBe(true);
    expect(report.disposition.reportStatus).toBe("falsified");
    expect(report.summary.failingReceiptCount).toBe(1);
    expect(report.summary.failingDownstreamGateCount).toBe(1);
    expect(report.summary.falsifyingBlockerCount).toBeGreaterThan(0);
    expect(report.summary.nextRequiredSurfaceId).toBe("force_gap_pull_in");
    expect(pullIn?.surfaceId).toBe("force_gap_pull_in");
    expect(pullIn?.numericalMargin).toBeLessThan(1);
    expect(pullIn?.falsifiesCurrentCandidate).toBe(true);
    expect(downstream?.downstreamGateId).toBe("regional_residual_closure");
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
    const report = buildNhm2TileSourceFalsificationReport({
      materialEvidenceReceipts: receipts,
      physicalValidationPlan: plan,
      evidenceGapRoadmap: roadmap,
    });
    const handoff = buildNhm2TileSourceAuthorityHandoff({
      materialEvidenceReceipts: receipts,
      physicalValidationPlan: plan,
      falsificationReport: report,
    });
    const materialGate = handoff.gates.find((gate) => gate.gateId === "material_receipts");
    const tensorGate = handoff.gates.find((gate) => gate.gateId === "full_apparatus_tensor");

    expect(isNhm2TileSourceAuthorityHandoff(handoff)).toBe(true);
    expect(handoff.summary.handoffStatus).toBe("blocked");
    expect(handoff.summary.handoffReadyForSameBasisAuthority).toBe(false);
    expect(handoff.summary.firstBlocker).toBe("material_coupon_receipt_missing");
    expect(materialGate?.status).toBe("missing");
    expect(materialGate?.blockers).toContain("material_coupon_receipt_missing");
    expect(tensorGate?.status).toBe("missing");
    expect(tensorGate?.blockers).toContain("support_drive_terms_in_full_apparatus_Tmunu_missing");
    expect(handoff.claimBoundary.handoffDoesNotRunSameBasisAuthority).toBe(true);
    expect(handoff.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("allows source-authority handoff for complete receipts without opening physical claims", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts(passingEvidence);
    const plan = buildNhm2TileSourcePhysicalValidationPlan({
      generatedAt,
      materialEvidenceReceipts: receipts,
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
    });
    const handoff = buildNhm2TileSourceAuthorityHandoff({
      materialEvidenceReceipts: receipts,
      physicalValidationPlan: plan,
      falsificationReport: report,
    });

    expect(isNhm2TileSourceAuthorityHandoff(handoff)).toBe(true);
    expect(handoff.summary.handoffStatus).toBe("handoff_ready");
    expect(handoff.summary.handoffReadyForSameBasisAuthority).toBe(true);
    expect(handoff.summary.materialEvidenceReady).toBe(true);
    expect(handoff.summary.fullApparatusTensorReady).toBe(true);
    expect(handoff.summary.sourceAuthorityEvidenceReady).toBe(true);
    expect(handoff.summary.physicalValidationStillRequired).toBe(true);
    expect(handoff.gates.every((gate) => gate.status === "pass")).toBe(true);
    expect(handoff.handoffTarget.targetContractVersion).toBe(
      "nhm2_source_side_same_basis_tensor_authority/v1",
    );
    expect(handoff.claimBoundary.handoffReadyIsNotPhysicalCredibility).toBe(true);
    expect(handoff.summary.transportClaimAllowed).toBe(false);
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
        material: "ultra_high_stress_tin",
        measuredTensileStressPa: 8e8,
        fractureOrYieldStressPa: 8e8,
        supportStressPa: 5.45707087858e8,
        cryogenicTemperatureK: 4,
        dielectricResponseRef: "receipt://dielectric/tin/v1",
        conductivityRef: "receipt://conductivity/tin/v1",
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

  it("maps an absent force-gap receipt to force-gap provenance", () => {
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({ generatedAt });
    const plan = buildNhm2TileSourceForceGapPullInTestPlan({
      materialEvidenceReceipts: receipts,
      materialEvidenceReceiptsRef: "artifact://material-receipts",
    });
    const provenance = plan.testItems.find((item) => item.testId === "force_gap_provenance");

    expect(isNhm2TileSourceForceGapPullInTestPlan(plan)).toBe(true);
    expect(plan.forceGapTarget.operatingGapMeters).toBe(8e-9);
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
        gapMeters: 8e-9,
        casimirForceN: 1.42e4,
        forceGradientNPerM: 3e6,
        effectiveSpringConstantNPerM: 1e6,
        stictionMargin: 0.8,
        activeGapControlAuthorityN: 1e4,
      },
    });
    const plan = buildNhm2TileSourceForceGapPullInTestPlan({ materialEvidenceReceipts: receipts });
    const pullIn = plan.testItems.find((item) => item.testId === "pull_in_margin");
    const stiction = plan.testItems.find((item) => item.testId === "stiction_margin");
    const activeAuthority = plan.testItems.find(
      (item) => item.testId === "active_gap_control_authority",
    );

    expect(receipts.summary.candidateDisposition).toBe("falsified");
    expect(plan.summary.forceGapReceiptStatus).toBe("fail");
    expect(plan.summary.nextRequiredTestId).toBe("pull_in_margin");
    expect(plan.summary.pullInMargin).toBeLessThan(1);
    expect(plan.summary.stictionMargin).toBeLessThan(1);
    expect(plan.summary.activeAuthorityMargin).toBeLessThan(1);
    expect(plan.summary.falsifiesCurrentCandidate).toBe(true);
    expect(pullIn?.status).toBe("falsifying");
    expect(stiction?.status).toBe("falsifying");
    expect(activeAuthority?.status).toBe("falsifying");
    expect(activeAuthority?.blockerIds).toContain("active_gap_control_authority_below_1p2x_force");
    expect(plan.summary.transportClaimAllowed).toBe(false);
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
    expect(budget.margins.suppliedForceToIdealStackForce).toBeCloseTo(1, 1);
    expect(budget.margins.pullInMarginToIdealGradient).toBeGreaterThan(1);
    expect(budget.margins.activeAuthorityMarginToIdealLoad).toBeGreaterThan(1);
    expect(budget.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("falsifies the load path when measured stiffness and control authority are below the ideal budget", () => {
    const budget = buildNhm2TileSourceForceGapLoadBudget({
      generatedAt,
      forceGapPullInEvidence: {
        evidenceTier: "measured",
        evidenceRef: "receipt://force-gap/failing-budget-v1",
        gapMeters: 8e-9,
        casimirForceN: 1.42e4,
        forceGradientNPerM: 3e6,
        effectiveSpringConstantNPerM: 1e12,
        stictionMargin: 1.5,
        activeGapControlAuthorityN: 1e4,
      },
    });

    expect(budget.summary.falsifiesCurrentCandidate).toBe(true);
    expect(budget.blockers).toEqual(
      expect.arrayContaining([
        "ideal_load_pull_in_margin_below_one",
        "ideal_load_active_control_authority_below_1p2x_stack_force",
      ]),
    );
    expect(budget.margins.pullInMarginToIdealGradient).toBeLessThan(1);
    expect(budget.margins.activeAuthorityMarginToIdealLoad).toBeLessThan(1);
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
        energyPerCycleJ: 1e-9,
        bandwidthHz: 15e9,
        switchingRateHz: 15e9,
        gapNoiseRmsMeters: 2e-10,
        heatLoadW: null,
        timingJitterSeconds: 1e-11,
        failureModeRef: null,
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
    expect(plan.summary.nextRequiredTestId).toBe("control_bandwidth");
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
    expect(timingJitter?.blockerIds).toContain("timing_jitter_above_0p1_cycle");
    expect(heatLoad?.blockerIds).toContain("active_control_heat_load_missing");
    expect(failureMode?.blockerIds).toContain("active_control_failure_mode_ref_missing");
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
    expect(budget.summary.firstBlocker).toBe("active_control_receipt_missing_for_operating_budget");
    expect(budget.claimBoundary.controllerEvidenceDoesNotSupplyFullApparatusTensor).toBe(true);
  });

  it("clears the active-control operating budget when power, noise, timing, and heat are accounted", () => {
    const budget = buildNhm2TileSourceActiveControlOperatingBudget({
      generatedAt,
      activeControlEvidence: passingEvidence.activeControl,
    });

    expect(budget.summary.activeControlEvidenceReady).toBe(true);
    expect(budget.summary.firstBlocker).toBe("none");
    expect(budget.derivedOperatingBudget.controlPowerW).toBe(15);
    expect(budget.derivedOperatingBudget.bandwidthMargin).toBeGreaterThan(1);
    expect(budget.derivedOperatingBudget.noiseMargin).toBeGreaterThan(1);
    expect(budget.derivedOperatingBudget.timingMargin).toBeGreaterThan(1);
    expect(budget.derivedOperatingBudget.thermalAccountingMargin).toBeGreaterThan(1);
    expect(budget.summary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("falsifies active-control evidence when the 15 GHz operating budget is thermally or dynamically inconsistent", () => {
    const budget = buildNhm2TileSourceActiveControlOperatingBudget({
      generatedAt,
      activeControlEvidence: {
        evidenceTier: "measured",
        evidenceRef: "receipt://active-control/failing-operating-budget-v1",
        energyPerCycleJ: 1e-9,
        bandwidthHz: 15e9,
        switchingRateHz: 15e9,
        gapNoiseRmsMeters: 2e-10,
        heatLoadW: 0.1,
        timingJitterSeconds: 1e-11,
        failureModeRef: null,
      },
    });

    expect(budget.summary.falsifiesCurrentCandidate).toBe(true);
    expect(budget.blockers).toEqual(
      expect.arrayContaining([
        "active_control_bandwidth_below_30ghz",
        "active_control_gap_noise_above_80pm",
        "active_control_timing_jitter_above_0p1_cycle",
        "active_control_heat_load_below_computed_control_power",
        "active_control_failure_mode_ref_missing_for_operating_budget",
      ]),
    );
    expect(budget.derivedOperatingBudget.controlPowerW).toBe(15);
    expect(budget.derivedOperatingBudget.thermalAccountingMargin).toBeLessThan(1);
    expect(budget.summary.transportClaimAllowed).toBe(false);
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
        cycleCountToFailure: 5e8,
        requiredCycleCount: 1e9,
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
    expect(plan.summary.scalingMargin).toBeLessThan(1);
    expect(plan.summary.nonadditivityMargin).toBeLessThan(1);
    expect(plan.summary.activeAreaMargin).toBeLessThan(1);
    expect(plan.summary.falsifiesCurrentCandidate).toBe(true);
    expect(cycleMargin?.status).toBe("falsifying");
    expect(scalingEfficiency?.status).toBe("falsifying");
    expect(nonadditivity?.status).toBe("falsifying");
    expect(activeArea?.status).toBe("falsifying");
    expect(supportCoupling?.status).toBe("falsifying");
    expect(cycleMargin?.blockerIds).toContain("fatigue_cycle_margin_below_required");
    expect(scalingEfficiency?.blockerIds).toContain("layer_scaling_efficiency_below_0p9");
    expect(nonadditivity?.blockerIds).toContain("layer_nonadditivity_above_0p1");
    expect(activeArea?.blockerIds).toContain("active_area_retention_below_0p6");
    expect(supportCoupling?.blockerIds).toContain("support_coupling_status_not_pass");
    expect(plan.summary.transportClaimAllowed).toBe(false);
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
});
