import { buildNhm2LayerStackSupportFractionSweep } from "./nhm2-layer-stack-support-fraction-sweep.v1";

export const NHM2_LAYER_STACK_ENGINEERING_ARCHITECTURE_LOOP_CONTRACT_VERSION =
  "nhm2_layer_stack_engineering_architecture_loop/v1";

export const NHM2_LAYER_STACK_ARCHITECTURE_STATUSES = [
  "candidate_window",
  "review",
  "fail",
] as const;

export type Nhm2LayerStackArchitectureStatus =
  (typeof NHM2_LAYER_STACK_ARCHITECTURE_STATUSES)[number];

export type Nhm2LayerStackArchitectureKindV1 =
  | "perimeter_frame"
  | "rib_lattice"
  | "spacer_post_array"
  | "suspended_membrane"
  | "topology_optimized_lattice"
  | "segmented_microcell"
  | "multilayer_load_sharing"
  | "active_gap_control_cell";

export type Nhm2LayerStackArchitectureMaterialV1 =
  | "high_stress_sin"
  | "aln_like_mems"
  | "ultra_high_stress_tin"
  | "diamond_like_carbon"
  | "graphene_2d_support"
  | "multilayer_metal_dielectric";

export type Nhm2LayerStackArchitectureCandidateV1 = {
  architectureId: string;
  architectureKind: Nhm2LayerStackArchitectureKindV1;
  materialCandidate: Nhm2LayerStackArchitectureMaterialV1;
  literatureRefs: string[];
  assumptions: string[];
  loadBearingFraction: number;
  activeAreaLostFraction: number;
  activeFraction: number;
  materialCorrection: number;
  layerScalingEfficiency: number;
  sourceRetention: number;
  retainedWallT00Fraction: number;
  supportStressPa: number;
  supportStressMPa: number;
  allowableStressPa: number;
  designStressLimitPa: number;
  stressStatus: Nhm2LayerStackArchitectureStatus;
  springConstantNPerM: number | null;
  casimirForceGradientNPerM: number;
  pullInMargin: number | null;
  pullInStatus: Nhm2LayerStackArchitectureStatus;
  roughnessMarginStatus: Nhm2LayerStackArchitectureStatus;
  patchPotentialStatus: Nhm2LayerStackArchitectureStatus;
  activeControlStatus: Nhm2LayerStackArchitectureStatus;
  materialReceiptStatus: Nhm2LayerStackArchitectureStatus;
  sourceRetentionStatus: Nhm2LayerStackArchitectureStatus;
  tensorContaminationStatus: Nhm2LayerStackArchitectureStatus;
  goNoGoStatus: Nhm2LayerStackArchitectureStatus;
  blockers: string[];
  requiredMeasurements: string[];
  tensorTermsRequired: string[];
};

export type Nhm2LayerStackEngineeringArchitectureLoopV1 = {
  contractVersion: typeof NHM2_LAYER_STACK_ENGINEERING_ARCHITECTURE_LOOP_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  supportFractionSweepRef: "nhm2_layer_stack_support_fraction_sweep/v1";
  scalarInputs: {
    gapMeters: number;
    tileAreaMeters2: number;
    stackForceN: number;
    layerCount: number;
    stackThicknessMeters: number;
    forceGradientNPerM: number;
  };
  evaluationPolicy: {
    safetyFactor: number;
    minimumSourceRetention: number;
    minimumActiveFraction: number;
    minimumPullInMargin: number;
    supportDriveTensorTermsSupplied: boolean;
    materialReceiptsSupplied: boolean;
    roughnessAndPatchReceiptsSupplied: boolean;
    activeControlReceiptsSupplied: boolean;
  };
  candidates: Nhm2LayerStackArchitectureCandidateV1[];
  summary: {
    candidateCount: number;
    mechanicallyPromisingRows: Nhm2LayerStackArchitectureCandidateV1[];
    goNoGoRows: Nhm2LayerStackArchitectureCandidateV1[];
    decoupledLoadPathRows: Nhm2LayerStackArchitectureCandidateV1[];
    feasibleArchitectureWindowExists: boolean;
    firstBlocker: string;
    rankedResearchGaps: string[];
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
  researchRefs: [
    "pmc_2024_casimir_mems_review",
    "physrevb_72_115426_roughness_pull_in",
    "physrevb_87_125413_roughness_mems_actuation",
    "arxiv_1207_4429_surface_potential_nanomebrane",
    "rspa_2020_0311_casimir_pull_in_framework",
    "physrevapplied_15_034063_high_stress_sin",
    "apl_127_222202_high_stress_tin"
  ];
  claimBoundary: {
    diagnosticOnly: true;
    engineeringArchitectureLoopOnly: true;
    idealScalarLoadIsNotMaterialEvidence: true;
    supportArchitectureIsNotTensorAuthority: true;
    supportDriveTermsMustEnterFullTensor: true;
    internalLoadIsNotThrust: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    routeEtaClaimAllowed: false;
    propulsionClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

export type BuildNhm2LayerStackEngineeringArchitectureLoopInput = {
  generatedAt?: string | null;
  selectedProfileId?: string | null;
  safetyFactor?: number | null;
  minimumSourceRetention?: number | null;
  minimumActiveFraction?: number | null;
  minimumPullInMargin?: number | null;
  materialCorrection?: number | null;
  layerScalingEfficiency?: number | null;
  supportDriveTensorTermsSupplied?: boolean | null;
  materialReceiptsSupplied?: boolean | null;
  roughnessAndPatchReceiptsSupplied?: boolean | null;
  activeControlReceiptsSupplied?: boolean | null;
};

type ArchitectureSeed = {
  architectureId: string;
  architectureKind: Nhm2LayerStackArchitectureKindV1;
  materialCandidate: Nhm2LayerStackArchitectureMaterialV1;
  allowableStressPa: number;
  loadBearingFraction: number;
  activeAreaLostFraction: number;
  springConstantNPerM: number | null;
  materialCorrectionOffset?: number;
  layerScalingEfficiencyOffset?: number;
  literatureRefs: string[];
  assumptions: string[];
};

const MATERIAL_ALLOWABLE_STRESS_PA: Record<Nhm2LayerStackArchitectureMaterialV1, number> = {
  aln_like_mems: 5e8,
  high_stress_sin: 1e9,
  ultra_high_stress_tin: 2.3e9,
  diamond_like_carbon: 1.5e9,
  graphene_2d_support: 1e9,
  multilayer_metal_dielectric: 5e8,
};

const ARCHITECTURE_SEEDS: ArchitectureSeed[] = [
  {
    architectureId: "perimeter_frame_sin",
    architectureKind: "perimeter_frame",
    materialCandidate: "high_stress_sin",
    allowableStressPa: MATERIAL_ALLOWABLE_STRESS_PA.high_stress_sin,
    loadBearingFraction: 0.12,
    activeAreaLostFraction: 0.18,
    springConstantNPerM: 4e12,
    literatureRefs: ["pmc_2024_casimir_mems_review", "physrevapplied_15_034063_high_stress_sin"],
    assumptions: ["Perimeter support consumes edge area and leaves central active patches."],
  },
  {
    architectureId: "rib_lattice_tin",
    architectureKind: "rib_lattice",
    materialCandidate: "ultra_high_stress_tin",
    allowableStressPa: MATERIAL_ALLOWABLE_STRESS_PA.ultra_high_stress_tin,
    loadBearingFraction: 0.22,
    activeAreaLostFraction: 0.12,
    springConstantNPerM: 1.4e13,
    literatureRefs: ["apl_127_222202_high_stress_tin", "rspa_2020_0311_casimir_pull_in_framework"],
    assumptions: ["Ribs share load across the active area but shadow part of the Casimir aperture."],
  },
  {
    architectureId: "spacer_post_array_tin",
    architectureKind: "spacer_post_array",
    materialCandidate: "ultra_high_stress_tin",
    allowableStressPa: MATERIAL_ALLOWABLE_STRESS_PA.ultra_high_stress_tin,
    loadBearingFraction: 0.18,
    activeAreaLostFraction: 0.07,
    springConstantNPerM: 8e12,
    literatureRefs: ["pmc_2024_casimir_mems_review", "arxiv_1207_4429_surface_potential_nanomebrane"],
    assumptions: ["Distributed posts reduce active-area loss but add spacer tensor terms."],
  },
  {
    architectureId: "suspended_membrane_sin",
    architectureKind: "suspended_membrane",
    materialCandidate: "high_stress_sin",
    allowableStressPa: MATERIAL_ALLOWABLE_STRESS_PA.high_stress_sin,
    loadBearingFraction: 0.06,
    activeAreaLostFraction: 0.03,
    springConstantNPerM: 2e12,
    literatureRefs: ["physrevapplied_15_034063_high_stress_sin", "arxiv_1207_4429_surface_potential_nanomebrane"],
    assumptions: ["Suspended membrane maximizes active area but concentrates load and pull-in risk."],
  },
  {
    architectureId: "topology_optimized_lattice_tin",
    architectureKind: "topology_optimized_lattice",
    materialCandidate: "ultra_high_stress_tin",
    allowableStressPa: MATERIAL_ALLOWABLE_STRESS_PA.ultra_high_stress_tin,
    loadBearingFraction: 0.26,
    activeAreaLostFraction: 0.08,
    springConstantNPerM: 2.8e13,
    literatureRefs: ["apl_127_222202_high_stress_tin", "pmc_2024_casimir_mems_review"],
    assumptions: ["Topology optimization is treated as a planning comparator, not a fabrication receipt."],
  },
  {
    architectureId: "segmented_microcell_aln",
    architectureKind: "segmented_microcell",
    materialCandidate: "aln_like_mems",
    allowableStressPa: MATERIAL_ALLOWABLE_STRESS_PA.aln_like_mems,
    loadBearingFraction: 0.28,
    activeAreaLostFraction: 0.16,
    springConstantNPerM: 1.1e13,
    literatureRefs: ["pmc_2024_casimir_mems_review"],
    assumptions: ["Microcells shorten unsupported span but increase boundary and metrology overhead."],
  },
  {
    architectureId: "multilayer_load_sharing_dlc",
    architectureKind: "multilayer_load_sharing",
    materialCandidate: "diamond_like_carbon",
    allowableStressPa: MATERIAL_ALLOWABLE_STRESS_PA.diamond_like_carbon,
    loadBearingFraction: 0.32,
    activeAreaLostFraction: 0.11,
    springConstantNPerM: 2.1e13,
    materialCorrectionOffset: -0.05,
    layerScalingEfficiencyOffset: 0.03,
    literatureRefs: ["revmodphys_81_1827_real_material_casimir", "pmc_2024_casimir_mems_review"],
    assumptions: ["Load sharing trades material correction uncertainty against stress reduction."],
  },
  {
    architectureId: "active_gap_control_cell",
    architectureKind: "active_gap_control_cell",
    materialCandidate: "multilayer_metal_dielectric",
    allowableStressPa: MATERIAL_ALLOWABLE_STRESS_PA.multilayer_metal_dielectric,
    loadBearingFraction: 0.24,
    activeAreaLostFraction: 0.14,
    springConstantNPerM: 1.8e13,
    materialCorrectionOffset: -0.08,
    layerScalingEfficiencyOffset: -0.02,
    literatureRefs: ["rspa_2020_0311_casimir_pull_in_framework", "physrevb_87_125413_roughness_mems_actuation"],
    assumptions: ["Active control may improve pull-in margin but adds control-system energy and tensor terms."],
  },
];

const DEFAULT_SAFETY_FACTOR = 3;
const DEFAULT_MINIMUM_SOURCE_RETENTION = 0.7;
const DEFAULT_MINIMUM_ACTIVE_FRACTION = 0.7;
const DEFAULT_MINIMUM_PULL_IN_MARGIN = 1;
const DEFAULT_MATERIAL_CORRECTION = 0.85;
const DEFAULT_LAYER_SCALING_EFFICIENCY = 0.9;
const DEFAULT_GAP_METERS = 8e-9;

const round = (value: number, digits = 12): number => Number(value.toPrecision(digits));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isArchitectureStatus = (value: unknown): value is Nhm2LayerStackArchitectureStatus =>
  typeof value === "string" &&
  (NHM2_LAYER_STACK_ARCHITECTURE_STATUSES as readonly string[]).includes(value);

const belowStatus = (
  value: number,
  passLimit: number,
  reviewLimit: number,
): Nhm2LayerStackArchitectureStatus => {
  if (value <= passLimit) return "candidate_window";
  if (value <= reviewLimit) return "review";
  return "fail";
};

const aboveStatus = (
  value: number,
  passLimit: number,
  reviewLimit: number,
): Nhm2LayerStackArchitectureStatus => {
  if (value >= passLimit) return "candidate_window";
  if (value >= reviewLimit) return "review";
  return "fail";
};

const candidateFirstBlocker = (
  candidate: Pick<
    Nhm2LayerStackArchitectureCandidateV1,
    | "stressStatus"
    | "sourceRetentionStatus"
    | "pullInStatus"
    | "roughnessMarginStatus"
    | "patchPotentialStatus"
    | "activeControlStatus"
    | "materialReceiptStatus"
    | "tensorContaminationStatus"
  >,
): string[] => [
  ...(candidate.stressStatus === "fail" ? ["support_stress_exceeds_allowable"] : []),
  ...(candidate.stressStatus === "review" ? ["support_stress_inside_review_band"] : []),
  ...(candidate.sourceRetentionStatus === "fail" ? ["wall_source_retention_below_threshold"] : []),
  ...(candidate.sourceRetentionStatus === "review" ? ["wall_source_retention_review_band"] : []),
  ...(candidate.pullInStatus === "fail" ? ["pull_in_margin_below_threshold"] : []),
  ...(candidate.pullInStatus === "review" ? ["pull_in_margin_review_band"] : []),
  ...(candidate.roughnessMarginStatus !== "candidate_window" ? ["roughness_margin_receipt_missing"] : []),
  ...(candidate.patchPotentialStatus !== "candidate_window" ? ["patch_potential_bound_receipt_missing"] : []),
  ...(candidate.activeControlStatus !== "candidate_window" ? ["active_control_receipt_missing"] : []),
  ...(candidate.materialReceiptStatus !== "candidate_window" ? ["material_coupon_receipt_missing"] : []),
  ...(candidate.tensorContaminationStatus !== "candidate_window" ? ["support_drive_tensor_terms_missing"] : []),
];

const summaryFirstBlocker = (candidates: Nhm2LayerStackArchitectureCandidateV1[]): string => {
  if (candidates.some((candidate) => candidate.goNoGoStatus === "candidate_window")) {
    return "none";
  }
  const mechanicallyPromising = candidates.filter(
    (candidate) =>
      candidate.stressStatus === "candidate_window" &&
      candidate.sourceRetentionStatus === "candidate_window" &&
      candidate.pullInStatus === "candidate_window",
  );
  if (mechanicallyPromising.length === 0) return "architecture_overlap_window_missing";
  if (mechanicallyPromising.some((candidate) => candidate.materialReceiptStatus !== "candidate_window")) {
    return "material_coupon_receipt_missing";
  }
  if (
    mechanicallyPromising.some(
      (candidate) =>
        candidate.roughnessMarginStatus !== "candidate_window" ||
        candidate.patchPotentialStatus !== "candidate_window",
    )
  ) {
    return "roughness_patch_metrology_missing";
  }
  if (mechanicallyPromising.some((candidate) => candidate.activeControlStatus !== "candidate_window")) {
    return "active_control_receipt_missing";
  }
  return "support_drive_tensor_terms_missing";
};

export const buildNhm2LayerStackEngineeringArchitectureLoop = (
  input: BuildNhm2LayerStackEngineeringArchitectureLoopInput = {},
): Nhm2LayerStackEngineeringArchitectureLoopV1 => {
  const sweep = buildNhm2LayerStackSupportFractionSweep({
    generatedAt: input.generatedAt,
    selectedProfileId: input.selectedProfileId,
    supportDriveTensorTermsSupplied: input.supportDriveTensorTermsSupplied,
  });
  const safetyFactor = input.safetyFactor ?? DEFAULT_SAFETY_FACTOR;
  const minimumSourceRetention = input.minimumSourceRetention ?? DEFAULT_MINIMUM_SOURCE_RETENTION;
  const minimumActiveFraction = input.minimumActiveFraction ?? DEFAULT_MINIMUM_ACTIVE_FRACTION;
  const minimumPullInMargin = input.minimumPullInMargin ?? DEFAULT_MINIMUM_PULL_IN_MARGIN;
  const materialCorrection = input.materialCorrection ?? DEFAULT_MATERIAL_CORRECTION;
  const layerScalingEfficiency =
    input.layerScalingEfficiency ?? DEFAULT_LAYER_SCALING_EFFICIENCY;
  const supportDriveTensorTermsSupplied = input.supportDriveTensorTermsSupplied ?? false;
  const materialReceiptsSupplied = input.materialReceiptsSupplied ?? false;
  const roughnessAndPatchReceiptsSupplied = input.roughnessAndPatchReceiptsSupplied ?? false;
  const activeControlReceiptsSupplied = input.activeControlReceiptsSupplied ?? false;
  const stackForceN = sweep.scalarInputs.stackForceN;
  const tileAreaMeters2 = sweep.scalarInputs.tileAreaMeters2;
  const forceGradientNPerM = (4 * stackForceN) / DEFAULT_GAP_METERS;

  const candidates = ARCHITECTURE_SEEDS.map((seed) => {
    const activeFraction = 1 - seed.activeAreaLostFraction;
    const candidateMaterialCorrection = materialCorrection + (seed.materialCorrectionOffset ?? 0);
    const candidateLayerScalingEfficiency =
      layerScalingEfficiency + (seed.layerScalingEfficiencyOffset ?? 0);
    const sourceRetention =
      activeFraction * candidateMaterialCorrection * candidateLayerScalingEfficiency;
    const designStressLimitPa = seed.allowableStressPa / safetyFactor;
    const supportStressPa = stackForceN / (tileAreaMeters2 * seed.loadBearingFraction);
    const pullInMargin =
      seed.springConstantNPerM == null ? null : seed.springConstantNPerM / (forceGradientNPerM * safetyFactor);
    const stressStatus = belowStatus(supportStressPa, designStressLimitPa, seed.allowableStressPa);
    const sourceRetentionStatus =
      activeFraction < minimumActiveFraction
        ? "fail"
        : aboveStatus(sourceRetention, minimumSourceRetention, minimumSourceRetention * 0.85);
    const pullInStatus =
      pullInMargin == null
        ? "fail"
        : aboveStatus(pullInMargin, minimumPullInMargin, minimumPullInMargin * 0.5);
    const roughnessMarginStatus: Nhm2LayerStackArchitectureStatus =
      roughnessAndPatchReceiptsSupplied ? "candidate_window" : "review";
    const patchPotentialStatus: Nhm2LayerStackArchitectureStatus =
      roughnessAndPatchReceiptsSupplied ? "candidate_window" : "review";
    const activeControlStatus: Nhm2LayerStackArchitectureStatus =
      activeControlReceiptsSupplied ? "candidate_window" : "review";
    const materialReceiptStatus: Nhm2LayerStackArchitectureStatus =
      materialReceiptsSupplied ? "candidate_window" : "review";
    const tensorContaminationStatus: Nhm2LayerStackArchitectureStatus =
      supportDriveTensorTermsSupplied ? "candidate_window" : "review";
    const statusVector = {
      stressStatus,
      sourceRetentionStatus,
      pullInStatus,
      roughnessMarginStatus,
      patchPotentialStatus,
      activeControlStatus,
      materialReceiptStatus,
      tensorContaminationStatus,
    };
    const blockers = candidateFirstBlocker(statusVector);
    const hardFail = [stressStatus, sourceRetentionStatus, pullInStatus].includes("fail");
    const allCandidate = Object.values(statusVector).every((status) => status === "candidate_window");
    const goNoGoStatus: Nhm2LayerStackArchitectureStatus = allCandidate
      ? "candidate_window"
      : hardFail
        ? "fail"
        : "review";
    return {
      architectureId: seed.architectureId,
      architectureKind: seed.architectureKind,
      materialCandidate: seed.materialCandidate,
      literatureRefs: seed.literatureRefs,
      assumptions: seed.assumptions,
      loadBearingFraction: round(seed.loadBearingFraction),
      activeAreaLostFraction: round(seed.activeAreaLostFraction),
      activeFraction: round(activeFraction),
      materialCorrection: round(candidateMaterialCorrection),
      layerScalingEfficiency: round(candidateLayerScalingEfficiency),
      sourceRetention: round(sourceRetention),
      retainedWallT00Fraction: round(sourceRetention),
      supportStressPa: round(supportStressPa),
      supportStressMPa: round(supportStressPa / 1e6),
      allowableStressPa: seed.allowableStressPa,
      designStressLimitPa: round(designStressLimitPa),
      stressStatus,
      springConstantNPerM: seed.springConstantNPerM,
      casimirForceGradientNPerM: round(forceGradientNPerM),
      pullInMargin: pullInMargin == null ? null : round(pullInMargin),
      pullInStatus,
      roughnessMarginStatus,
      patchPotentialStatus,
      activeControlStatus,
      materialReceiptStatus,
      sourceRetentionStatus,
      tensorContaminationStatus,
      goNoGoStatus,
      blockers,
      requiredMeasurements: [
        "force_gap_curve",
        "pull_in_margin",
        "roughness_rms_and_asperity_tail",
        "surface_patch_potential_map",
        "fatigue_cycle_test",
        "active_gap_control_energy",
        "full_apparatus_tensor_terms",
      ],
      tensorTermsRequired: [
        "support_structure_stress_energy",
        "spacer_contact_stress_energy",
        "active_control_field_energy",
        "thermal_load_stress_energy",
        "patch_potential_electrostatic_stress",
      ],
    };
  });

  const mechanicallyPromisingRows = candidates.filter(
    (candidate) =>
      candidate.stressStatus === "candidate_window" &&
      candidate.sourceRetentionStatus === "candidate_window" &&
      candidate.pullInStatus === "candidate_window",
  );
  const goNoGoRows = candidates.filter((candidate) => candidate.goNoGoStatus === "candidate_window");
  return {
    contractVersion: NHM2_LAYER_STACK_ENGINEERING_ARCHITECTURE_LOOP_CONTRACT_VERSION,
    generatedAt: sweep.generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: sweep.selectedProfileId,
    supportFractionSweepRef: "nhm2_layer_stack_support_fraction_sweep/v1",
    scalarInputs: {
      gapMeters: DEFAULT_GAP_METERS,
      tileAreaMeters2,
      stackForceN,
      layerCount: sweep.scalarInputs.layerCount,
      stackThicknessMeters: sweep.scalarInputs.stackThicknessMeters,
      forceGradientNPerM: round(forceGradientNPerM),
    },
    evaluationPolicy: {
      safetyFactor,
      minimumSourceRetention,
      minimumActiveFraction,
      minimumPullInMargin,
      supportDriveTensorTermsSupplied,
      materialReceiptsSupplied,
      roughnessAndPatchReceiptsSupplied,
      activeControlReceiptsSupplied,
    },
    candidates,
    summary: {
      candidateCount: candidates.length,
      mechanicallyPromisingRows,
      goNoGoRows,
      decoupledLoadPathRows: candidates.filter(
        (candidate) => candidate.loadBearingFraction > candidate.activeAreaLostFraction,
      ),
      feasibleArchitectureWindowExists: goNoGoRows.length > 0,
      firstBlocker: summaryFirstBlocker(candidates),
      rankedResearchGaps: [
        "material_coupon_receipt_for_selected_support_material",
        "force_gap_curve_and_pull_in_margin_at_8nm",
        "roughness_asperity_tail_and_patch_potential_map",
        "active_gap_control_energy_and_noise",
        "support_drive_terms_in_full_apparatus_Tmunu",
        "layer_scaling_nonadditivity_measurement",
      ],
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
    researchRefs: [
      "pmc_2024_casimir_mems_review",
      "physrevb_72_115426_roughness_pull_in",
      "physrevb_87_125413_roughness_mems_actuation",
      "arxiv_1207_4429_surface_potential_nanomebrane",
      "rspa_2020_0311_casimir_pull_in_framework",
      "physrevapplied_15_034063_high_stress_sin",
      "apl_127_222202_high_stress_tin",
    ],
    claimBoundary: {
      diagnosticOnly: true,
      engineeringArchitectureLoopOnly: true,
      idealScalarLoadIsNotMaterialEvidence: true,
      supportArchitectureIsNotTensorAuthority: true,
      supportDriveTermsMustEnterFullTensor: true,
      internalLoadIsNotThrust: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
  };
};

export const isNhm2LayerStackEngineeringArchitectureLoop = (
  value: unknown,
): value is Nhm2LayerStackEngineeringArchitectureLoopV1 => {
  if (!isRecord(value)) return false;
  const scalarInputs = isRecord(value.scalarInputs) ? value.scalarInputs : null;
  const policy = isRecord(value.evaluationPolicy) ? value.evaluationPolicy : null;
  const candidates = Array.isArray(value.candidates) ? value.candidates : null;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion === NHM2_LAYER_STACK_ENGINEERING_ARCHITECTURE_LOOP_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.supportFractionSweepRef === "nhm2_layer_stack_support_fraction_sweep/v1" &&
    scalarInputs != null &&
    typeof scalarInputs.gapMeters === "number" &&
    typeof scalarInputs.tileAreaMeters2 === "number" &&
    typeof scalarInputs.stackForceN === "number" &&
    typeof scalarInputs.layerCount === "number" &&
    typeof scalarInputs.stackThicknessMeters === "number" &&
    typeof scalarInputs.forceGradientNPerM === "number" &&
    policy != null &&
    typeof policy.safetyFactor === "number" &&
    typeof policy.minimumSourceRetention === "number" &&
    typeof policy.minimumActiveFraction === "number" &&
    typeof policy.minimumPullInMargin === "number" &&
    typeof policy.supportDriveTensorTermsSupplied === "boolean" &&
    typeof policy.materialReceiptsSupplied === "boolean" &&
    typeof policy.roughnessAndPatchReceiptsSupplied === "boolean" &&
    typeof policy.activeControlReceiptsSupplied === "boolean" &&
    candidates != null &&
    candidates.length > 0 &&
    candidates.every(
      (candidate) =>
        isRecord(candidate) &&
        typeof candidate.architectureId === "string" &&
        typeof candidate.architectureKind === "string" &&
        typeof candidate.materialCandidate === "string" &&
        Array.isArray(candidate.literatureRefs) &&
        Array.isArray(candidate.assumptions) &&
        typeof candidate.loadBearingFraction === "number" &&
        typeof candidate.activeAreaLostFraction === "number" &&
        typeof candidate.activeFraction === "number" &&
        typeof candidate.sourceRetention === "number" &&
        typeof candidate.supportStressPa === "number" &&
        typeof candidate.supportStressMPa === "number" &&
        typeof candidate.allowableStressPa === "number" &&
        typeof candidate.designStressLimitPa === "number" &&
        isArchitectureStatus(candidate.stressStatus) &&
        (candidate.springConstantNPerM === null || typeof candidate.springConstantNPerM === "number") &&
        typeof candidate.casimirForceGradientNPerM === "number" &&
        (candidate.pullInMargin === null || typeof candidate.pullInMargin === "number") &&
        isArchitectureStatus(candidate.pullInStatus) &&
        isArchitectureStatus(candidate.roughnessMarginStatus) &&
        isArchitectureStatus(candidate.patchPotentialStatus) &&
        isArchitectureStatus(candidate.activeControlStatus) &&
        isArchitectureStatus(candidate.materialReceiptStatus) &&
        isArchitectureStatus(candidate.sourceRetentionStatus) &&
        isArchitectureStatus(candidate.tensorContaminationStatus) &&
        isArchitectureStatus(candidate.goNoGoStatus) &&
        Array.isArray(candidate.blockers) &&
        Array.isArray(candidate.requiredMeasurements) &&
        Array.isArray(candidate.tensorTermsRequired),
    ) &&
    summary != null &&
    summary.candidateCount === candidates.length &&
    Array.isArray(summary.mechanicallyPromisingRows) &&
    Array.isArray(summary.goNoGoRows) &&
    Array.isArray(summary.decoupledLoadPathRows) &&
    typeof summary.feasibleArchitectureWindowExists === "boolean" &&
    typeof summary.firstBlocker === "string" &&
    Array.isArray(summary.rankedResearchGaps) &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    summary.speedAuthorityClaimAllowed === false &&
    Array.isArray(value.researchRefs) &&
    value.researchRefs.length > 0 &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.engineeringArchitectureLoopOnly === true &&
    boundary.idealScalarLoadIsNotMaterialEvidence === true &&
    boundary.supportArchitectureIsNotTensorAuthority === true &&
    boundary.supportDriveTermsMustEnterFullTensor === true &&
    boundary.internalLoadIsNotThrust === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.routeEtaClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false &&
    boundary.speedAuthorityClaimAllowed === false
  );
};
