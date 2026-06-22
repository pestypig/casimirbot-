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
  buildNhm2TileSourceFullApparatusTensorTestPlan,
  isNhm2TileSourceFullApparatusTensorTestPlan,
  type Nhm2TileSourceFullApparatusTensorTestPlanV1,
} from "../../shared/contracts/nhm2-tile-source-full-apparatus-tensor-test-plan.v1";
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
const FORCE_GAP_PULL_IN_TEST_PLAN_FILE = "nhm2-tile-source-force-gap-pull-in-test-plan.json";
const FORCE_GAP_LOAD_BUDGET_FILE = "nhm2-tile-source-force-gap-load-budget.json";
const ROUGHNESS_PATCH_TEST_PLAN_FILE = "nhm2-tile-source-roughness-patch-test-plan.json";
const ACTIVE_CONTROL_TEST_PLAN_FILE = "nhm2-tile-source-active-control-test-plan.json";
const ACTIVE_CONTROL_OPERATING_BUDGET_FILE =
  "nhm2-tile-source-active-control-operating-budget.json";
const FATIGUE_LAYER_SCALING_TEST_PLAN_FILE =
  "nhm2-tile-source-fatigue-layer-scaling-test-plan.json";
const FULL_APPARATUS_TENSOR_TEST_PLAN_FILE =
  "nhm2-tile-source-full-apparatus-tensor-test-plan.json";

type EvidenceInput = BuildNhm2TileSourceMaterialEvidenceReceiptsInput & {
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
  forceGapPullInTestPlan: Nhm2TileSourceForceGapPullInTestPlanV1;
  forceGapLoadBudget: Nhm2TileSourceForceGapLoadBudgetV1;
  roughnessPatchTestPlan: Nhm2TileSourceRoughnessPatchTestPlanV1;
  activeControlTestPlan: Nhm2TileSourceActiveControlTestPlanV1;
  activeControlOperatingBudget: Nhm2TileSourceActiveControlOperatingBudgetV1;
  fatigueLayerScalingTestPlan: Nhm2TileSourceFatigueLayerScalingTestPlanV1;
  fullApparatusTensorTestPlan: Nhm2TileSourceFullApparatusTensorTestPlanV1;
  outputRefs: {
    materialEvidenceReceipts: string;
    physicalValidationPlan: string;
    evidenceGapRoadmap: string;
    falsificationReport: string;
    authorityHandoff: string;
    materialCouponTestPlan: string;
    forceGapPullInTestPlan: string;
    forceGapLoadBudget: string;
    roughnessPatchTestPlan: string;
    activeControlTestPlan: string;
    activeControlOperatingBudget: string;
    fatigueLayerScalingTestPlan: string;
    fullApparatusTensorTestPlan: string;
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
    energyPerCycleJ: null,
    bandwidthHz: null,
    switchingRateHz: 15e9,
    gapNoiseRmsMeters: null,
    heatLoadW: null,
    timingJitterSeconds: null,
    failureModeRef: null,
  },
  fatigueLayerScaling: {
    evidenceTier: "missing",
    evidenceRef: null,
    cycleCountToFailure: null,
    requiredCycleCount: null,
    layerScalingEfficiency: null,
    nonadditivityFraction: null,
    activeAreaRetention: null,
    supportCouplingStatus: "missing",
  },
  fullApparatusTensor: {
    evidenceTier: "missing",
    evidenceRef: null,
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
    regionalCoverage: {
      wall: false,
      hull: false,
      exteriorShell: false,
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
  const materialEvidenceReceipts = buildNhm2TileSourceMaterialEvidenceReceipts({
    ...evidence,
    generatedAt: args.generatedAt ?? evidence.generatedAt ?? null,
    selectedProfileId: args.selectedProfileId ?? evidence.selectedProfileId ?? null,
  });
  if (!isNhm2TileSourceMaterialEvidenceReceipts(materialEvidenceReceipts)) {
    throw new Error("built artifact failed nhm2_tile_source_material_evidence_receipts/v1 validation");
  }
  const physicalValidationPlan = buildNhm2TileSourcePhysicalValidationPlan({
    generatedAt: materialEvidenceReceipts.generatedAt,
    selectedProfileId: materialEvidenceReceipts.selectedProfileId,
    materialEvidenceReceipts,
    downstreamGateStatuses: evidence.downstreamGateStatuses ?? null,
  });
  if (!isNhm2TileSourcePhysicalValidationPlan(physicalValidationPlan)) {
    throw new Error("built artifact failed nhm2_tile_source_physical_validation_plan/v1 validation");
  }
  const outDir = args.outDir ?? DEFAULT_RUN_ROOT;
  const outputRefs = {
    materialEvidenceReceipts: join(outDir, MATERIAL_RECEIPTS_FILE),
    physicalValidationPlan: join(outDir, VALIDATION_PLAN_FILE),
    evidenceGapRoadmap: join(outDir, EVIDENCE_GAP_ROADMAP_FILE),
    falsificationReport: join(outDir, FALSIFICATION_REPORT_FILE),
    authorityHandoff: join(outDir, AUTHORITY_HANDOFF_FILE),
    materialCouponTestPlan: join(outDir, MATERIAL_COUPON_TEST_PLAN_FILE),
    forceGapPullInTestPlan: join(outDir, FORCE_GAP_PULL_IN_TEST_PLAN_FILE),
    forceGapLoadBudget: join(outDir, FORCE_GAP_LOAD_BUDGET_FILE),
    roughnessPatchTestPlan: join(outDir, ROUGHNESS_PATCH_TEST_PLAN_FILE),
    activeControlTestPlan: join(outDir, ACTIVE_CONTROL_TEST_PLAN_FILE),
    activeControlOperatingBudget: join(outDir, ACTIVE_CONTROL_OPERATING_BUDGET_FILE),
    fatigueLayerScalingTestPlan: join(outDir, FATIGUE_LAYER_SCALING_TEST_PLAN_FILE),
    fullApparatusTensorTestPlan: join(outDir, FULL_APPARATUS_TENSOR_TEST_PLAN_FILE),
  };
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
    materialEvidenceReceiptsRef: outputRefs.materialEvidenceReceipts,
    physicalValidationPlanRef: outputRefs.physicalValidationPlan,
    evidenceGapRoadmapRef: outputRefs.evidenceGapRoadmap,
  });
  if (!isNhm2TileSourceFalsificationReport(falsificationReport)) {
    throw new Error("built artifact failed nhm2_tile_source_falsification_report/v1 validation");
  }
  const authorityHandoff = buildNhm2TileSourceAuthorityHandoff({
    materialEvidenceReceipts,
    physicalValidationPlan,
    falsificationReport,
    materialEvidenceReceiptsRef: outputRefs.materialEvidenceReceipts,
    physicalValidationPlanRef: outputRefs.physicalValidationPlan,
    falsificationReportRef: outputRefs.falsificationReport,
  });
  if (!isNhm2TileSourceAuthorityHandoff(authorityHandoff)) {
    throw new Error("built artifact failed nhm2_tile_source_authority_handoff/v1 validation");
  }
  const materialCouponTestPlan = buildNhm2TileSourceMaterialCouponTestPlan({
    materialEvidenceReceipts,
    materialEvidenceReceiptsRef: outputRefs.materialEvidenceReceipts,
  });
  if (!isNhm2TileSourceMaterialCouponTestPlan(materialCouponTestPlan)) {
    throw new Error("built artifact failed nhm2_tile_source_material_coupon_test_plan/v1 validation");
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
    forceGapPullInEvidence: evidence.forceGapPullIn ?? null,
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
    activeControlEvidence: evidence.activeControl ?? null,
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
  const fullApparatusTensorTestPlan = buildNhm2TileSourceFullApparatusTensorTestPlan({
    materialEvidenceReceipts,
    materialEvidenceReceiptsRef: outputRefs.materialEvidenceReceipts,
  });
  if (!isNhm2TileSourceFullApparatusTensorTestPlan(fullApparatusTensorTestPlan)) {
    throw new Error(
      "built artifact failed nhm2_tile_source_full_apparatus_tensor_test_plan/v1 validation",
    );
  }
  writeJson(args.repoRoot, outputRefs.materialEvidenceReceipts, materialEvidenceReceipts);
  writeJson(args.repoRoot, outputRefs.physicalValidationPlan, physicalValidationPlan);
  writeJson(args.repoRoot, outputRefs.evidenceGapRoadmap, evidenceGapRoadmap);
  writeJson(args.repoRoot, outputRefs.falsificationReport, falsificationReport);
  writeJson(args.repoRoot, outputRefs.authorityHandoff, authorityHandoff);
  writeJson(args.repoRoot, outputRefs.materialCouponTestPlan, materialCouponTestPlan);
  writeJson(args.repoRoot, outputRefs.forceGapPullInTestPlan, forceGapPullInTestPlan);
  writeJson(args.repoRoot, outputRefs.forceGapLoadBudget, forceGapLoadBudget);
  writeJson(args.repoRoot, outputRefs.roughnessPatchTestPlan, roughnessPatchTestPlan);
  writeJson(args.repoRoot, outputRefs.activeControlTestPlan, activeControlTestPlan);
  writeJson(args.repoRoot, outputRefs.activeControlOperatingBudget, activeControlOperatingBudget);
  writeJson(
    args.repoRoot,
    outputRefs.fatigueLayerScalingTestPlan,
    fatigueLayerScalingTestPlan,
  );
  writeJson(
    args.repoRoot,
    outputRefs.fullApparatusTensorTestPlan,
    fullApparatusTensorTestPlan,
  );
  return {
    materialEvidenceReceipts,
    physicalValidationPlan,
    evidenceGapRoadmap,
    falsificationReport,
    authorityHandoff,
    materialCouponTestPlan,
    forceGapPullInTestPlan,
    forceGapLoadBudget,
    roughnessPatchTestPlan,
    activeControlTestPlan,
    activeControlOperatingBudget,
    fatigueLayerScalingTestPlan,
    fullApparatusTensorTestPlan,
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
