import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2TileSourceMaterialEvidenceReceipts,
  isNhm2TileSourceMaterialEvidenceReceipts,
  type BuildNhm2TileSourceMaterialEvidenceReceiptsInput,
  type Nhm2TileSourceMaterialEvidenceReceiptsV1,
} from "../../shared/contracts/nhm2-tile-source-material-evidence-receipts.v1";
import {
  buildNhm2TileSourceEvidenceGapRoadmap,
  isNhm2TileSourceEvidenceGapRoadmap,
  type Nhm2TileSourceEvidenceGapRoadmapV1,
} from "../../shared/contracts/nhm2-tile-source-evidence-gap-roadmap.v1";
import {
  buildNhm2TileSourceFalsificationReport,
  isNhm2TileSourceFalsificationReport,
  type Nhm2TileSourceFalsificationReportV1,
} from "../../shared/contracts/nhm2-tile-source-falsification-report.v1";
import {
  buildNhm2TileSourceAuthorityHandoff,
  isNhm2TileSourceAuthorityHandoff,
  type Nhm2TileSourceAuthorityHandoffV1,
} from "../../shared/contracts/nhm2-tile-source-authority-handoff.v1";
import {
  buildNhm2TileSourceMaterialCouponTestPlan,
  isNhm2TileSourceMaterialCouponTestPlan,
  type Nhm2TileSourceMaterialCouponTestPlanV1,
} from "../../shared/contracts/nhm2-tile-source-material-coupon-test-plan.v1";
import {
  buildNhm2TileSourceMaterialCouponOperatingBudget,
  isNhm2TileSourceMaterialCouponOperatingBudget,
  type Nhm2TileSourceMaterialCouponOperatingBudgetV1,
} from "../../shared/contracts/nhm2-tile-source-material-coupon-operating-budget.v1";
import {
  buildNhm2TileSourceForceGapPullInTestPlan,
  isNhm2TileSourceForceGapPullInTestPlan,
  type Nhm2TileSourceForceGapPullInTestPlanV1,
} from "../../shared/contracts/nhm2-tile-source-force-gap-pull-in-test-plan.v1";
import {
  buildNhm2TileSourceForceGapLoadBudget,
  isNhm2TileSourceForceGapLoadBudget,
  type Nhm2TileSourceForceGapLoadBudgetV1,
} from "../../shared/contracts/nhm2-tile-source-force-gap-load-budget.v1";
import {
  buildNhm2TileSourceRoughnessPatchTestPlan,
  isNhm2TileSourceRoughnessPatchTestPlan,
  type Nhm2TileSourceRoughnessPatchTestPlanV1,
} from "../../shared/contracts/nhm2-tile-source-roughness-patch-test-plan.v1";
import {
  buildNhm2TileSourceRoughnessPatchOperatingBudget,
  isNhm2TileSourceRoughnessPatchOperatingBudget,
  type Nhm2TileSourceRoughnessPatchOperatingBudgetV1,
} from "../../shared/contracts/nhm2-tile-source-roughness-patch-operating-budget.v1";
import {
  buildNhm2TileSourceActiveControlTestPlan,
  isNhm2TileSourceActiveControlTestPlan,
  type Nhm2TileSourceActiveControlTestPlanV1,
} from "../../shared/contracts/nhm2-tile-source-active-control-test-plan.v1";
import {
  buildNhm2TileSourceActiveControlOperatingBudget,
  isNhm2TileSourceActiveControlOperatingBudget,
  type Nhm2TileSourceActiveControlOperatingBudgetV1,
} from "../../shared/contracts/nhm2-tile-source-active-control-operating-budget.v1";
import {
  buildNhm2TileSourceFatigueLayerScalingTestPlan,
  isNhm2TileSourceFatigueLayerScalingTestPlan,
  type Nhm2TileSourceFatigueLayerScalingTestPlanV1,
} from "../../shared/contracts/nhm2-tile-source-fatigue-layer-scaling-test-plan.v1";
import {
  buildNhm2TileSourceFatigueLayerScalingOperatingBudget,
  isNhm2TileSourceFatigueLayerScalingOperatingBudget,
  type Nhm2TileSourceFatigueLayerScalingOperatingBudgetV1,
} from "../../shared/contracts/nhm2-tile-source-fatigue-layer-scaling-operating-budget.v1";
import {
  buildNhm2TileSourceFullApparatusTensorTestPlan,
  isNhm2TileSourceFullApparatusTensorTestPlan,
  type Nhm2TileSourceFullApparatusTensorTestPlanV1,
} from "../../shared/contracts/nhm2-tile-source-full-apparatus-tensor-test-plan.v1";
import {
  buildNhm2TileSourceFullApparatusTensorOperatingBudget,
  isNhm2TileSourceFullApparatusTensorOperatingBudget,
  type Nhm2TileSourceFullApparatusTensorOperatingBudgetV1,
} from "../../shared/contracts/nhm2-tile-source-full-apparatus-tensor-operating-budget.v1";
import {
  buildFullApparatusTensorEvidenceFromTensorValues,
  isNhm2TileSourceFullApparatusTensorValues,
  type Nhm2TileSourceFullApparatusTensorValuesV1,
} from "../../shared/contracts/nhm2-tile-source-full-apparatus-tensor-values.v1";
import {
  buildNhm2TileSourceOperatingBudgetReadiness,
  isNhm2TileSourceOperatingBudgetReadiness,
  type Nhm2TileSourceOperatingBudgetReadinessV1,
} from "../../shared/contracts/nhm2-tile-source-operating-budget-readiness.v1";
import {
  buildNhm2TileSourcePhysicalValidationPlan,
  isNhm2TileSourcePhysicalValidationPlan,
  type Nhm2TileSourceDownstreamGateV1,
  type Nhm2TileSourcePhysicalValidationPlanV1,
} from "../../shared/contracts/nhm2-tile-source-physical-validation-plan.v1";

const DEFAULT_RUN_ROOT =
  "artifacts/research/full-solve/profile-campaign-runs/stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1";
const DEFAULT_SELECTED_PROFILE_ID =
  "stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1";
const FROZEN_CANDIDATE_ID = "nhm2_447_layer_topology_optimized_lattice_tin_v1" as const;

const MATERIAL_RECEIPTS_FILE = "nhm2-tile-source-material-evidence-receipts.json";
const VALIDATION_PLAN_FILE = "nhm2-tile-source-physical-validation-plan.json";
const EVIDENCE_GAP_ROADMAP_FILE = "nhm2-tile-source-evidence-gap-roadmap.json";
const FALSIFICATION_REPORT_FILE = "nhm2-tile-source-falsification-report.json";
const AUTHORITY_HANDOFF_FILE = "nhm2-tile-source-authority-handoff.json";
const MATERIAL_COUPON_TEST_PLAN_FILE = "nhm2-tile-source-material-coupon-test-plan.json";
const MATERIAL_COUPON_OPERATING_BUDGET_FILE =
  "nhm2-tile-source-material-coupon-operating-budget.json";
const FORCE_GAP_PULL_IN_TEST_PLAN_FILE = "nhm2-tile-source-force-gap-pull-in-test-plan.json";
const FORCE_GAP_LOAD_BUDGET_FILE = "nhm2-tile-source-force-gap-load-budget.json";
const ROUGHNESS_PATCH_TEST_PLAN_FILE = "nhm2-tile-source-roughness-patch-test-plan.json";
const ROUGHNESS_PATCH_OPERATING_BUDGET_FILE =
  "nhm2-tile-source-roughness-patch-operating-budget.json";
const ACTIVE_CONTROL_TEST_PLAN_FILE = "nhm2-tile-source-active-control-test-plan.json";
const ACTIVE_CONTROL_OPERATING_BUDGET_FILE =
  "nhm2-tile-source-active-control-operating-budget.json";
const FATIGUE_LAYER_SCALING_TEST_PLAN_FILE =
  "nhm2-tile-source-fatigue-layer-scaling-test-plan.json";
const FATIGUE_LAYER_SCALING_OPERATING_BUDGET_FILE =
  "nhm2-tile-source-fatigue-layer-scaling-operating-budget.json";
const FULL_APPARATUS_TENSOR_TEST_PLAN_FILE =
  "nhm2-tile-source-full-apparatus-tensor-test-plan.json";
const FULL_APPARATUS_TENSOR_OPERATING_BUDGET_FILE =
  "nhm2-tile-source-full-apparatus-tensor-operating-budget.json";
const FULL_APPARATUS_TENSOR_VALUES_FILE =
  "nhm2-tile-source-full-apparatus-tensor-values.json";
const OPERATING_BUDGET_READINESS_FILE =
  "nhm2-tile-source-operating-budget-readiness.json";

type EvidenceInput = BuildNhm2TileSourceMaterialEvidenceReceiptsInput & {
  fullApparatusTensorValues?: Nhm2TileSourceFullApparatusTensorValuesV1 | null;
  downstreamGateStatuses?: Partial<
    Record<Nhm2TileSourceDownstreamGateV1["gateId"], "pass" | "review" | "fail" | "not_run">
  > | null;
};

export type Nhm2TileSourceMaterialEvidenceTemplateV1 = EvidenceInput & {
  templateVersion: "nhm2_tile_source_material_evidence_template/v1";
  usage: {
    fillMeasuredOrValidatedReceipts: true;
    nullValuesAreMissingEvidence: true;
    declaredModelsDoNotPassMaterialCredibility: true;
  };
};

export type PublishNhm2TileSourceMaterialEvidenceResult = {
  materialEvidenceReceipts: Nhm2TileSourceMaterialEvidenceReceiptsV1;
  physicalValidationPlan: Nhm2TileSourcePhysicalValidationPlanV1;
  evidenceGapRoadmap: Nhm2TileSourceEvidenceGapRoadmapV1;
  falsificationReport: Nhm2TileSourceFalsificationReportV1;
  authorityHandoff: Nhm2TileSourceAuthorityHandoffV1;
  materialCouponTestPlan: Nhm2TileSourceMaterialCouponTestPlanV1;
  materialCouponOperatingBudget: Nhm2TileSourceMaterialCouponOperatingBudgetV1;
  forceGapPullInTestPlan: Nhm2TileSourceForceGapPullInTestPlanV1;
  forceGapLoadBudget: Nhm2TileSourceForceGapLoadBudgetV1;
  roughnessPatchTestPlan: Nhm2TileSourceRoughnessPatchTestPlanV1;
  roughnessPatchOperatingBudget: Nhm2TileSourceRoughnessPatchOperatingBudgetV1;
  activeControlTestPlan: Nhm2TileSourceActiveControlTestPlanV1;
  activeControlOperatingBudget: Nhm2TileSourceActiveControlOperatingBudgetV1;
  fatigueLayerScalingTestPlan: Nhm2TileSourceFatigueLayerScalingTestPlanV1;
  fatigueLayerScalingOperatingBudget: Nhm2TileSourceFatigueLayerScalingOperatingBudgetV1;
  fullApparatusTensorTestPlan: Nhm2TileSourceFullApparatusTensorTestPlanV1;
  fullApparatusTensorOperatingBudget: Nhm2TileSourceFullApparatusTensorOperatingBudgetV1;
  fullApparatusTensorValues: Nhm2TileSourceFullApparatusTensorValuesV1 | null;
  operatingBudgetReadiness: Nhm2TileSourceOperatingBudgetReadinessV1;
  outputRefs: {
    materialEvidenceReceipts: string;
    physicalValidationPlan: string;
    evidenceGapRoadmap: string;
    falsificationReport: string;
    authorityHandoff: string;
    materialCouponTestPlan: string;
    materialCouponOperatingBudget: string;
    forceGapPullInTestPlan: string;
    forceGapLoadBudget: string;
    roughnessPatchTestPlan: string;
    roughnessPatchOperatingBudget: string;
    activeControlTestPlan: string;
    activeControlOperatingBudget: string;
    fatigueLayerScalingTestPlan: string;
    fatigueLayerScalingOperatingBudget: string;
    fullApparatusTensorTestPlan: string;
    fullApparatusTensorOperatingBudget: string;
    fullApparatusTensorValues: string | null;
    operatingBudgetReadiness: string;
  };
};

const parseArgs = (argv: string[]): Record<string, string | boolean> => {
  const parsed: Record<string, string | boolean> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (next == null || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
};

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (repoRoot: string, path: string | null): unknown => {
  if (path == null) return {};
  const resolved = resolvePath(repoRoot, path);
  if (!existsSync(resolved)) {
    throw new Error(`evidence input missing: ${path}`);
  }
  return JSON.parse(readFileSync(resolved, "utf8").replace(/^\uFEFF/, ""));
};

const parseEvidenceInput = (raw: unknown): EvidenceInput => {
  if (!isRecord(raw)) {
    throw new Error("evidence input must be a JSON object");
  }
  return raw as EvidenceInput;
};

const writeJson = (repoRoot: string, path: string, value: unknown): void => {
  const outPath = resolvePath(repoRoot, path);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

export const buildNhm2TileSourceMaterialEvidenceTemplate = (args: {
  generatedAt?: string | null;
  selectedProfileId?: string | null;
} = {}): Nhm2TileSourceMaterialEvidenceTemplateV1 => ({
  templateVersion: "nhm2_tile_source_material_evidence_template/v1",
  generatedAt: args.generatedAt ?? new Date().toISOString(),
  selectedProfileId: args.selectedProfileId ?? DEFAULT_SELECTED_PROFILE_ID,
  candidateId: FROZEN_CANDIDATE_ID,
  usage: {
    fillMeasuredOrValidatedReceipts: true,
    nullValuesAreMissingEvidence: true,
    declaredModelsDoNotPassMaterialCredibility: true,
  },
  materialCoupon: {
    evidenceTier: "missing",
    evidenceRef: null,
    tensileStressCurveRef: null,
    fractureYieldCurveRef: null,
    cryogenicStateRef: null,
    roughnessMapRef: null,
    fabricationToleranceMapRef: null,
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
  forceGapPullIn: {
    evidenceTier: "missing",
    evidenceRef: null,
    forceGapCurveRef: null,
    forceGradientCurveRef: null,
    stiffnessModelRef: null,
    gapMeters: 8e-9,
    casimirForceN: null,
    forceGradientNPerM: null,
    effectiveSpringConstantNPerM: null,
    stictionMargin: null,
    activeGapControlAuthorityN: null,
  },
  roughnessPatch: {
    evidenceTier: "missing",
    evidenceRef: null,
    roughnessMapRef: null,
    asperityDistributionRef: null,
    patchVoltageMapRef: null,
    roughnessRmsMeters: null,
    asperityP99Meters: null,
    asperityMaxMeters: null,
    patchVoltageRmsVolts: null,
    residualElectrostaticForceFraction: null,
    correctionRef: null,
  },
  activeControl: {
    evidenceTier: "missing",
    evidenceRef: null,
    energyWaveformRef: null,
    actuatorAuthorityTraceRef: null,
    gapSensorCalibrationRef: null,
    controlTransferFunctionRef: null,
    controllerStabilityRef: null,
    gapNoiseTraceRef: null,
    thermalModelRef: null,
    heatSinkCapacityTraceRef: null,
    heatLoadTraceRef: null,
    timingSyncTraceRef: null,
    phaseNoiseSpectrumRef: null,
    lockAcquisitionTraceRef: null,
    energyPerCycleJ: null,
    actuatorAuthorityN: null,
    bandwidthHz: null,
    switchingRateHz: 15e9,
    gapNoiseRmsMeters: null,
    noiseSpectrumRef: null,
    heatLoadW: null,
    heatSinkCapacityW: null,
    timingJitterSeconds: null,
    phaseNoiseRmsSeconds: null,
    controllerPhaseMarginDegrees: null,
    controllerGainMarginDb: null,
    lockAcquisitionTimeSeconds: null,
    failureModeRef: null,
  },
  fatigueLayerScaling: {
    evidenceTier: "missing",
    evidenceRef: null,
    loadSpectrumRef: null,
    cycleProtocolRef: null,
    cryogenicFatigueRef: null,
    fatigueCurveRef: null,
    thermalCycleRef: null,
    creepDriftRef: null,
    delaminationProtocolRef: null,
    interlayerAdhesionRef: null,
    layerScalingMapRef: null,
    perLayerVariationMapRef: null,
    nonadditivityModelRef: null,
    activeAreaMapRef: null,
    supportCouplingMapRef: null,
    electromagneticCouplingMapRef: null,
    mechanicalCouplingMapRef: null,
    multiphysicsCouplingRef: null,
    sourceTensorRetentionMapRef: null,
    cycleCountToFailure: null,
    requiredCycleCount: null,
    thermalCycleDriftFraction: null,
    creepDriftFraction: null,
    delaminationMargin: null,
    interlayerAdhesionMargin: null,
    layerScalingEfficiency: null,
    perLayerVariationFraction: null,
    nonadditivityFraction: null,
    activeAreaRetention: null,
    supportCouplingFraction: null,
    electromagneticCouplingFraction: null,
    mechanicalCouplingFraction: null,
    sourceTensorRetentionFraction: null,
    supportCouplingStatus: "missing",
  },
  fullApparatusTensor: {
    evidenceTier: "missing",
    evidenceRef: null,
    tensorValueArtifactRef: null,
    tensorValueArtifactContract: null,
    sameChart: false,
    sameBasis: false,
    sameUnits: false,
    noMetricTargetEcho: false,
    components: {
      T00: false,
      T0i: false,
      diagonalTij: false,
      offDiagonalTij: false,
    },
    componentRefs: {
      T00: null,
      T0i: null,
      diagonalTij: null,
      offDiagonalTij: null,
    },
    componentDetailRefs: {
      T00: null,
      T01: null,
      T02: null,
      T03: null,
      T11: null,
      T12: null,
      T13: null,
      T22: null,
      T23: null,
      T33: null,
    },
    termCoverage: {
      supportStructureStressEnergy: false,
      spacerContactStressEnergy: false,
      activeControlFieldEnergy: false,
      thermalLoadStressEnergy: false,
      patchPotentialElectrostaticStress: false,
      fatigueDamageEvolution: false,
      layerScalingCrossTerms: false,
      casimirInteractionStressEnergy: false,
      materialStrainEnergy: false,
    },
    termRefs: {
      supportStructureStressEnergy: null,
      spacerContactStressEnergy: null,
      activeControlFieldEnergy: null,
      thermalLoadStressEnergy: null,
      patchPotentialElectrostaticStress: null,
      fatigueDamageEvolution: null,
      layerScalingCrossTerms: null,
      casimirInteractionStressEnergy: null,
      materialStrainEnergy: null,
    },
    regionalCoverage: {
      wall: false,
      hull: false,
      exteriorShell: false,
    },
    regionalSupportRefs: {
      wall: null,
      hull: null,
      exteriorShell: null,
    },
  },
  downstreamGateStatuses: {
    regional_residual_closure: "not_run",
    wall_t00_closure: "not_run",
    covariant_conservation: "not_run",
    qei_worldline_dossier: "not_run",
    observer_family_energy_conditions: "not_run",
    material_credibility: "not_run",
    coupled_closure: "not_run",
  },
});

export const publishNhm2TileSourceMaterialEvidenceReceipts = (args: {
  repoRoot: string;
  evidencePath?: string | null;
  outDir?: string | null;
  generatedAt?: string | null;
  selectedProfileId?: string | null;
}): PublishNhm2TileSourceMaterialEvidenceResult => {
  const evidence = parseEvidenceInput(readJson(args.repoRoot, args.evidencePath ?? null));
  const outDir = args.outDir ?? DEFAULT_RUN_ROOT;
  const outputRefs = {
    materialEvidenceReceipts: join(outDir, MATERIAL_RECEIPTS_FILE),
    physicalValidationPlan: join(outDir, VALIDATION_PLAN_FILE),
    evidenceGapRoadmap: join(outDir, EVIDENCE_GAP_ROADMAP_FILE),
    falsificationReport: join(outDir, FALSIFICATION_REPORT_FILE),
    authorityHandoff: join(outDir, AUTHORITY_HANDOFF_FILE),
    materialCouponTestPlan: join(outDir, MATERIAL_COUPON_TEST_PLAN_FILE),
    materialCouponOperatingBudget: join(outDir, MATERIAL_COUPON_OPERATING_BUDGET_FILE),
    forceGapPullInTestPlan: join(outDir, FORCE_GAP_PULL_IN_TEST_PLAN_FILE),
    forceGapLoadBudget: join(outDir, FORCE_GAP_LOAD_BUDGET_FILE),
    roughnessPatchTestPlan: join(outDir, ROUGHNESS_PATCH_TEST_PLAN_FILE),
    roughnessPatchOperatingBudget: join(outDir, ROUGHNESS_PATCH_OPERATING_BUDGET_FILE),
    activeControlTestPlan: join(outDir, ACTIVE_CONTROL_TEST_PLAN_FILE),
    activeControlOperatingBudget: join(outDir, ACTIVE_CONTROL_OPERATING_BUDGET_FILE),
    fatigueLayerScalingTestPlan: join(outDir, FATIGUE_LAYER_SCALING_TEST_PLAN_FILE),
    fatigueLayerScalingOperatingBudget: join(
      outDir,
      FATIGUE_LAYER_SCALING_OPERATING_BUDGET_FILE,
    ),
    fullApparatusTensorTestPlan: join(outDir, FULL_APPARATUS_TENSOR_TEST_PLAN_FILE),
    fullApparatusTensorOperatingBudget: join(
      outDir,
      FULL_APPARATUS_TENSOR_OPERATING_BUDGET_FILE,
    ),
    fullApparatusTensorValues:
      evidence.fullApparatusTensorValues == null
        ? null
        : join(outDir, FULL_APPARATUS_TENSOR_VALUES_FILE),
    operatingBudgetReadiness: join(outDir, OPERATING_BUDGET_READINESS_FILE),
  };
  const fullApparatusTensorValues =
    evidence.fullApparatusTensorValues == null ? null : evidence.fullApparatusTensorValues;
  if (
    fullApparatusTensorValues != null &&
    !isNhm2TileSourceFullApparatusTensorValues(fullApparatusTensorValues)
  ) {
    throw new Error("evidence input failed nhm2_tile_source_full_apparatus_tensor_values/v1 validation");
  }
  const normalizedEvidence: EvidenceInput =
    fullApparatusTensorValues == null
      ? evidence
      : {
          ...evidence,
          fullApparatusTensor: buildFullApparatusTensorEvidenceFromTensorValues({
            artifact: fullApparatusTensorValues,
            evidenceTier: "validated_simulation",
            evidenceRef:
              fullApparatusTensorValues.artifactRef ??
              outputRefs.fullApparatusTensorValues ??
              null,
          }),
        };
  const materialEvidenceReceipts = buildNhm2TileSourceMaterialEvidenceReceipts({
    ...normalizedEvidence,
    generatedAt: args.generatedAt ?? normalizedEvidence.generatedAt ?? null,
    selectedProfileId: args.selectedProfileId ?? normalizedEvidence.selectedProfileId ?? null,
  });
  if (!isNhm2TileSourceMaterialEvidenceReceipts(materialEvidenceReceipts)) {
    throw new Error("built artifact failed nhm2_tile_source_material_evidence_receipts/v1 validation");
  }
  const materialCouponTestPlan = buildNhm2TileSourceMaterialCouponTestPlan({
    materialEvidenceReceipts,
    materialEvidenceReceiptsRef: outputRefs.materialEvidenceReceipts,
  });
  if (!isNhm2TileSourceMaterialCouponTestPlan(materialCouponTestPlan)) {
    throw new Error("built artifact failed nhm2_tile_source_material_coupon_test_plan/v1 validation");
  }
  const materialCouponOperatingBudget = buildNhm2TileSourceMaterialCouponOperatingBudget({
    generatedAt: materialEvidenceReceipts.generatedAt,
    selectedProfileId: materialEvidenceReceipts.selectedProfileId,
    materialCouponEvidence: normalizedEvidence.materialCoupon ?? null,
  });
  if (!isNhm2TileSourceMaterialCouponOperatingBudget(materialCouponOperatingBudget)) {
    throw new Error(
      "built artifact failed nhm2_tile_source_material_coupon_operating_budget/v1 validation",
    );
  }
  const forceGapPullInTestPlan = buildNhm2TileSourceForceGapPullInTestPlan({
    materialEvidenceReceipts,
    materialEvidenceReceiptsRef: outputRefs.materialEvidenceReceipts,
  });
  if (!isNhm2TileSourceForceGapPullInTestPlan(forceGapPullInTestPlan)) {
    throw new Error("built artifact failed nhm2_tile_source_force_gap_pull_in_test_plan/v1 validation");
  }
  const forceGapLoadBudget = buildNhm2TileSourceForceGapLoadBudget({
    generatedAt: materialEvidenceReceipts.generatedAt,
    materialEvidenceReceipts,
    materialEvidenceReceiptsRef: outputRefs.materialEvidenceReceipts,
    forceGapPullInEvidence: normalizedEvidence.forceGapPullIn ?? null,
  });
  if (!isNhm2TileSourceForceGapLoadBudget(forceGapLoadBudget)) {
    throw new Error("built artifact failed nhm2_tile_source_force_gap_load_budget/v1 validation");
  }
  const roughnessPatchTestPlan = buildNhm2TileSourceRoughnessPatchTestPlan({
    materialEvidenceReceipts,
    materialEvidenceReceiptsRef: outputRefs.materialEvidenceReceipts,
  });
  if (!isNhm2TileSourceRoughnessPatchTestPlan(roughnessPatchTestPlan)) {
    throw new Error("built artifact failed nhm2_tile_source_roughness_patch_test_plan/v1 validation");
  }
  const roughnessPatchOperatingBudget = buildNhm2TileSourceRoughnessPatchOperatingBudget({
    forceGapLoadBudget,
    forceGapLoadBudgetRef: outputRefs.forceGapLoadBudget,
    roughnessPatchEvidence: normalizedEvidence.roughnessPatch ?? null,
  });
  if (!isNhm2TileSourceRoughnessPatchOperatingBudget(roughnessPatchOperatingBudget)) {
    throw new Error(
      "built artifact failed nhm2_tile_source_roughness_patch_operating_budget/v1 validation",
    );
  }
  const activeControlTestPlan = buildNhm2TileSourceActiveControlTestPlan({
    materialEvidenceReceipts,
    materialEvidenceReceiptsRef: outputRefs.materialEvidenceReceipts,
  });
  if (!isNhm2TileSourceActiveControlTestPlan(activeControlTestPlan)) {
    throw new Error("built artifact failed nhm2_tile_source_active_control_test_plan/v1 validation");
  }
  const activeControlOperatingBudget = buildNhm2TileSourceActiveControlOperatingBudget({
    forceGapLoadBudget,
    forceGapLoadBudgetRef: outputRefs.forceGapLoadBudget,
    activeControlEvidence: normalizedEvidence.activeControl ?? null,
  });
  if (!isNhm2TileSourceActiveControlOperatingBudget(activeControlOperatingBudget)) {
    throw new Error(
      "built artifact failed nhm2_tile_source_active_control_operating_budget/v1 validation",
    );
  }
  const fatigueLayerScalingTestPlan = buildNhm2TileSourceFatigueLayerScalingTestPlan({
    materialEvidenceReceipts,
    materialEvidenceReceiptsRef: outputRefs.materialEvidenceReceipts,
  });
  if (!isNhm2TileSourceFatigueLayerScalingTestPlan(fatigueLayerScalingTestPlan)) {
    throw new Error(
      "built artifact failed nhm2_tile_source_fatigue_layer_scaling_test_plan/v1 validation",
    );
  }
  const fatigueLayerScalingOperatingBudget =
    buildNhm2TileSourceFatigueLayerScalingOperatingBudget({
      generatedAt: materialEvidenceReceipts.generatedAt,
      selectedProfileId: materialEvidenceReceipts.selectedProfileId,
      fatigueLayerScalingEvidence: normalizedEvidence.fatigueLayerScaling ?? null,
    });
  if (!isNhm2TileSourceFatigueLayerScalingOperatingBudget(fatigueLayerScalingOperatingBudget)) {
    throw new Error(
      "built artifact failed nhm2_tile_source_fatigue_layer_scaling_operating_budget/v1 validation",
    );
  }
  const fullApparatusTensorTestPlan = buildNhm2TileSourceFullApparatusTensorTestPlan({
    materialEvidenceReceipts,
    materialEvidenceReceiptsRef: outputRefs.materialEvidenceReceipts,
  });
  if (!isNhm2TileSourceFullApparatusTensorTestPlan(fullApparatusTensorTestPlan)) {
    throw new Error(
      "built artifact failed nhm2_tile_source_full_apparatus_tensor_test_plan/v1 validation",
    );
  }
  const fullApparatusTensorOperatingBudget =
    buildNhm2TileSourceFullApparatusTensorOperatingBudget({
      generatedAt: materialEvidenceReceipts.generatedAt,
      selectedProfileId: materialEvidenceReceipts.selectedProfileId,
      fullApparatusTensorEvidence: normalizedEvidence.fullApparatusTensor ?? null,
    });
  if (!isNhm2TileSourceFullApparatusTensorOperatingBudget(fullApparatusTensorOperatingBudget)) {
    throw new Error(
      "built artifact failed nhm2_tile_source_full_apparatus_tensor_operating_budget/v1 validation",
    );
  }
  const operatingBudgetReadiness = buildNhm2TileSourceOperatingBudgetReadiness({
    generatedAt: materialEvidenceReceipts.generatedAt,
    selectedProfileId: materialEvidenceReceipts.selectedProfileId,
    materialCouponOperatingBudget,
    materialCouponOperatingBudgetRef: outputRefs.materialCouponOperatingBudget,
    forceGapLoadBudget,
    forceGapLoadBudgetRef: outputRefs.forceGapLoadBudget,
    roughnessPatchOperatingBudget,
    roughnessPatchOperatingBudgetRef: outputRefs.roughnessPatchOperatingBudget,
    activeControlOperatingBudget,
    activeControlOperatingBudgetRef: outputRefs.activeControlOperatingBudget,
    fatigueLayerScalingOperatingBudget,
    fatigueLayerScalingOperatingBudgetRef: outputRefs.fatigueLayerScalingOperatingBudget,
    fullApparatusTensorOperatingBudget,
    fullApparatusTensorOperatingBudgetRef: outputRefs.fullApparatusTensorOperatingBudget,
  });
  if (!isNhm2TileSourceOperatingBudgetReadiness(operatingBudgetReadiness)) {
    throw new Error(
      "built artifact failed nhm2_tile_source_operating_budget_readiness/v1 validation",
    );
  }
  const physicalValidationPlan = buildNhm2TileSourcePhysicalValidationPlan({
    generatedAt: materialEvidenceReceipts.generatedAt,
    selectedProfileId: materialEvidenceReceipts.selectedProfileId,
    materialEvidenceReceipts,
    operatingBudgetReadiness,
    downstreamGateStatuses: normalizedEvidence.downstreamGateStatuses ?? null,
  });
  if (!isNhm2TileSourcePhysicalValidationPlan(physicalValidationPlan)) {
    throw new Error("built artifact failed nhm2_tile_source_physical_validation_plan/v1 validation");
  }
  const evidenceGapRoadmap = buildNhm2TileSourceEvidenceGapRoadmap({
    materialEvidenceReceipts,
    physicalValidationPlan,
    materialEvidenceReceiptsRef: outputRefs.materialEvidenceReceipts,
    physicalValidationPlanRef: outputRefs.physicalValidationPlan,
  });
  if (!isNhm2TileSourceEvidenceGapRoadmap(evidenceGapRoadmap)) {
    throw new Error("built artifact failed nhm2_tile_source_evidence_gap_roadmap/v1 validation");
  }
  const falsificationReport = buildNhm2TileSourceFalsificationReport({
    materialEvidenceReceipts,
    physicalValidationPlan,
    evidenceGapRoadmap,
    operatingBudgetReadiness,
    materialEvidenceReceiptsRef: outputRefs.materialEvidenceReceipts,
    physicalValidationPlanRef: outputRefs.physicalValidationPlan,
    evidenceGapRoadmapRef: outputRefs.evidenceGapRoadmap,
    operatingBudgetReadinessRef: outputRefs.operatingBudgetReadiness,
  });
  if (!isNhm2TileSourceFalsificationReport(falsificationReport)) {
    throw new Error("built artifact failed nhm2_tile_source_falsification_report/v1 validation");
  }
  const authorityHandoff = buildNhm2TileSourceAuthorityHandoff({
    materialEvidenceReceipts,
    physicalValidationPlan,
    falsificationReport,
    operatingBudgetReadiness,
    materialEvidenceReceiptsRef: outputRefs.materialEvidenceReceipts,
    physicalValidationPlanRef: outputRefs.physicalValidationPlan,
    falsificationReportRef: outputRefs.falsificationReport,
    operatingBudgetReadinessRef: outputRefs.operatingBudgetReadiness,
  });
  if (!isNhm2TileSourceAuthorityHandoff(authorityHandoff)) {
    throw new Error("built artifact failed nhm2_tile_source_authority_handoff/v1 validation");
  }
  writeJson(args.repoRoot, outputRefs.materialEvidenceReceipts, materialEvidenceReceipts);
  writeJson(args.repoRoot, outputRefs.physicalValidationPlan, physicalValidationPlan);
  writeJson(args.repoRoot, outputRefs.evidenceGapRoadmap, evidenceGapRoadmap);
  writeJson(args.repoRoot, outputRefs.falsificationReport, falsificationReport);
  writeJson(args.repoRoot, outputRefs.authorityHandoff, authorityHandoff);
  writeJson(args.repoRoot, outputRefs.materialCouponTestPlan, materialCouponTestPlan);
  writeJson(args.repoRoot, outputRefs.materialCouponOperatingBudget, materialCouponOperatingBudget);
  writeJson(args.repoRoot, outputRefs.forceGapPullInTestPlan, forceGapPullInTestPlan);
  writeJson(args.repoRoot, outputRefs.forceGapLoadBudget, forceGapLoadBudget);
  writeJson(args.repoRoot, outputRefs.roughnessPatchTestPlan, roughnessPatchTestPlan);
  writeJson(args.repoRoot, outputRefs.roughnessPatchOperatingBudget, roughnessPatchOperatingBudget);
  writeJson(args.repoRoot, outputRefs.activeControlTestPlan, activeControlTestPlan);
  writeJson(args.repoRoot, outputRefs.activeControlOperatingBudget, activeControlOperatingBudget);
  writeJson(
    args.repoRoot,
    outputRefs.fatigueLayerScalingTestPlan,
    fatigueLayerScalingTestPlan,
  );
  writeJson(
    args.repoRoot,
    outputRefs.fatigueLayerScalingOperatingBudget,
    fatigueLayerScalingOperatingBudget,
  );
  writeJson(
    args.repoRoot,
    outputRefs.fullApparatusTensorTestPlan,
    fullApparatusTensorTestPlan,
  );
  writeJson(
    args.repoRoot,
    outputRefs.fullApparatusTensorOperatingBudget,
    fullApparatusTensorOperatingBudget,
  );
  if (fullApparatusTensorValues != null && outputRefs.fullApparatusTensorValues != null) {
    writeJson(args.repoRoot, outputRefs.fullApparatusTensorValues, fullApparatusTensorValues);
  }
  writeJson(args.repoRoot, outputRefs.operatingBudgetReadiness, operatingBudgetReadiness);
  return {
    materialEvidenceReceipts,
    physicalValidationPlan,
    evidenceGapRoadmap,
    falsificationReport,
    authorityHandoff,
    materialCouponTestPlan,
    materialCouponOperatingBudget,
    forceGapPullInTestPlan,
    forceGapLoadBudget,
    roughnessPatchTestPlan,
    roughnessPatchOperatingBudget,
    activeControlTestPlan,
    activeControlOperatingBudget,
    fatigueLayerScalingTestPlan,
    fatigueLayerScalingOperatingBudget,
    fullApparatusTensorTestPlan,
    fullApparatusTensorOperatingBudget,
    fullApparatusTensorValues,
    operatingBudgetReadiness,
    outputRefs,
  };
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const templateOut = asString(args["template-out"]);
  if (templateOut != null) {
    const template = buildNhm2TileSourceMaterialEvidenceTemplate({
      generatedAt: asString(args["generated-at"]),
      selectedProfileId: asString(args["selected-profile-id"]),
    });
    writeJson(process.cwd(), templateOut, template);
    process.stdout.write(`${JSON.stringify({ templateRef: templateOut, template }, null, 2)}\n`);
    return;
  }
  const result = publishNhm2TileSourceMaterialEvidenceReceipts({
    repoRoot: process.cwd(),
    evidencePath: asString(args.evidence),
    outDir: asString(args["out-dir"]),
    generatedAt: asString(args["generated-at"]),
    selectedProfileId: asString(args["selected-profile-id"]),
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
