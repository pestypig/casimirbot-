import {
  buildNhm2LayerStackEngineeringArchitectureLoop,
  type Nhm2LayerStackArchitectureCandidateV1,
  type Nhm2LayerStackArchitectureStatus,
} from "./nhm2-layer-stack-engineering-architecture-loop.v1";

export const NHM2_LAYER_STACK_FULL_APPARATUS_RECEIPT_LOOP_CONTRACT_VERSION =
  "nhm2_layer_stack_full_apparatus_receipt_loop/v1";

export const NHM2_LAYER_STACK_RECEIPT_SURFACE_IDS = [
  "material_coupon",
  "force_gap_pull_in",
  "roughness_patch_metrology",
  "active_control_energy",
  "fatigue_lifetime",
  "layer_scaling",
  "full_apparatus_tensor",
] as const;

export const NHM2_LAYER_STACK_RECEIPT_STATUSES = [
  "receipted",
  "declared_model",
  "missing",
  "proxy_inadmissible",
] as const;

export type Nhm2LayerStackReceiptSurfaceId =
  (typeof NHM2_LAYER_STACK_RECEIPT_SURFACE_IDS)[number];
export type Nhm2LayerStackReceiptStatus =
  (typeof NHM2_LAYER_STACK_RECEIPT_STATUSES)[number];

export type Nhm2LayerStackReceiptSurfaceV1 = {
  surfaceId: Nhm2LayerStackReceiptSurfaceId;
  status: Nhm2LayerStackReceiptStatus;
  evaluationStatus: Nhm2LayerStackArchitectureStatus;
  evidenceRef: string | null;
  literatureRefs: string[];
  blockers: string[];
  requiredMeasurements: string[];
};

export type Nhm2FullApparatusTensorTermCoverageV1 = {
  supportStructureStressEnergy: boolean;
  spacerContactStressEnergy: boolean;
  activeControlFieldEnergy: boolean;
  thermalLoadStressEnergy: boolean;
  patchPotentialElectrostaticStress: boolean;
  fatigueDamageEvolution: boolean;
  layerScalingCrossTerms: boolean;
};

export type Nhm2LayerStackFullApparatusReceiptRowV1 = {
  architectureId: string;
  architectureKind: Nhm2LayerStackArchitectureCandidateV1["architectureKind"];
  materialCandidate: Nhm2LayerStackArchitectureCandidateV1["materialCandidate"];
  sourceRetention: number;
  supportStressMPa: number;
  pullInMargin: number | null;
  architectureBaseStatus: Nhm2LayerStackArchitectureStatus;
  receiptSurfaces: Nhm2LayerStackReceiptSurfaceV1[];
  tensorTermCoverage: Nhm2FullApparatusTensorTermCoverageV1;
  evidenceReadinessScore: number;
  sourceTensorAuthorityAllowed: false;
  engineeringCandidateStatus: Nhm2LayerStackArchitectureStatus;
  firstBlocker: string;
  blockers: string[];
};

export type Nhm2LayerStackFullApparatusReceiptLoopV1 = {
  contractVersion: typeof NHM2_LAYER_STACK_FULL_APPARATUS_RECEIPT_LOOP_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  architectureLoopRef: "nhm2_layer_stack_engineering_architecture_loop/v1";
  receiptPolicy: {
    requiredReceiptSurfaces: Nhm2LayerStackReceiptSurfaceId[];
    declaredModelsAreReviewOnly: true;
    idealScalarCasimirIsMaterialReceipt: false;
    fullApparatusTensorTermsRequired: true;
  };
  rows: Nhm2LayerStackFullApparatusReceiptRowV1[];
  summary: {
    rowCount: number;
    receiptedCandidateRows: Nhm2LayerStackFullApparatusReceiptRowV1[];
    rankedRowsByEvidenceReadiness: Nhm2LayerStackFullApparatusReceiptRowV1[];
    bestArchitectureId: string | null;
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
    "physrevresearch_2_023355_patch_potential_measurement",
    "arxiv_1207_4429_surface_potential_nanomebrane",
    "rspa_2020_0311_casimir_pull_in_framework",
    "physrevapplied_15_034063_high_stress_sin",
    "pmc_2025_aln_piezo_mems_review",
    "apl_127_222202_high_stress_tin"
  ];
  claimBoundary: {
    diagnosticOnly: true;
    receiptLoopOnly: true;
    idealScalarLoadIsNotMaterialEvidence: true;
    supportArchitectureIsNotTensorAuthority: true;
    sourceTensorAuthorityAllowed: false;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    routeEtaClaimAllowed: false;
    propulsionClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

export type BuildNhm2LayerStackFullApparatusReceiptLoopInput = {
  generatedAt?: string | null;
  selectedProfileId?: string | null;
  suppliedReceiptSurfaces?: Partial<Record<Nhm2LayerStackReceiptSurfaceId, boolean>> | null;
  tensorTermCoverage?: Partial<Nhm2FullApparatusTensorTermCoverageV1> | null;
};

const REQUIRED_RECEIPT_SURFACES: Nhm2LayerStackReceiptSurfaceId[] = [
  "material_coupon",
  "force_gap_pull_in",
  "roughness_patch_metrology",
  "active_control_energy",
  "fatigue_lifetime",
  "layer_scaling",
  "full_apparatus_tensor",
];

const SURFACE_DETAILS: Record<
  Nhm2LayerStackReceiptSurfaceId,
  {
    literatureRefs: string[];
    blocker: string;
    measurements: string[];
  }
> = {
  material_coupon: {
    literatureRefs: [
      "physrevapplied_15_034063_high_stress_sin",
      "pmc_2025_aln_piezo_mems_review",
      "apl_127_222202_high_stress_tin",
    ],
    blocker: "material_coupon_receipt_missing",
    measurements: [
      "447_layer_load_case_compatibility",
      "thin_film_stress_curve",
      "yield_or_fracture_margin",
      "cryogenic_material_state",
      "coupon_fatigue_cycle_life",
    ],
  },
  force_gap_pull_in: {
    literatureRefs: ["pmc_2024_casimir_mems_review", "rspa_2020_0311_casimir_pull_in_framework"],
    blocker: "force_gap_curve_and_pull_in_margin_at_8nm_missing",
    measurements: ["force_gap_curve", "effective_spring_constant", "pull_in_margin_at_8nm"],
  },
  roughness_patch_metrology: {
    literatureRefs: [
      "physrevb_72_115426_roughness_pull_in",
      "physrevb_87_125413_roughness_mems_actuation",
      "physrevresearch_2_023355_patch_potential_measurement",
      "arxiv_1207_4429_surface_potential_nanomebrane",
    ],
    blocker: "roughness_asperity_tail_and_patch_potential_map_missing",
    measurements: ["roughness_rms", "asperity_tail_distribution", "surface_patch_potential_map"],
  },
  active_control_energy: {
    literatureRefs: ["pmc_2024_casimir_mems_review", "rspa_2020_0311_casimir_pull_in_framework"],
    blocker: "active_gap_control_energy_and_noise_missing",
    measurements: [
      "actuator_authority_trace",
      "gap_sensor_calibration",
      "active_control_energy_per_cycle",
      "controller_stability_margin",
      "control_noise_spectrum",
      "phase_noise_spectrum",
      "gap_lock_bandwidth",
      "heat_sink_capacity",
      "lock_acquisition_trace",
      "failure_mode_coverage",
    ],
  },
  fatigue_lifetime: {
    literatureRefs: ["physrevapplied_15_034063_high_stress_sin", "apl_127_222202_high_stress_tin"],
    blocker: "fatigue_lifetime_receipt_missing",
    measurements: [
      "load_spectrum",
      "cryogenic_fatigue_curve",
      "cycle_count_to_failure",
      "creep_or_drift_rate",
      "thermal_cycle_margin",
      "delamination_margin",
      "interlayer_adhesion_margin",
    ],
  },
  layer_scaling: {
    literatureRefs: ["revmodphys_81_1827_real_material_casimir", "pmc_2024_casimir_mems_review"],
    blocker: "layer_scaling_nonadditivity_measurement_missing",
    measurements: [
      "multi_layer_force_scaling",
      "per_layer_variation_map",
      "nonadditivity_bound",
      "active_area_retention_map",
      "support_coupling_loss",
      "electromagnetic_coupling_loss",
      "mechanical_coupling_loss",
      "source_tensor_retention_map",
      "cross_layer_coupling",
    ],
  },
  full_apparatus_tensor: {
    literatureRefs: ["revmodphys_81_1827_real_material_casimir"],
    blocker: "support_drive_terms_in_full_apparatus_Tmunu_missing",
    measurements: [
      "support_structure_stress_energy",
      "spacer_contact_stress_energy",
      "active_control_field_energy",
      "thermal_load_stress_energy",
      "patch_potential_electrostatic_stress",
    ],
  },
};

const DEFAULT_TENSOR_TERM_COVERAGE: Nhm2FullApparatusTensorTermCoverageV1 = {
  supportStructureStressEnergy: false,
  spacerContactStressEnergy: false,
  activeControlFieldEnergy: false,
  thermalLoadStressEnergy: false,
  patchPotentialElectrostaticStress: false,
  fatigueDamageEvolution: false,
  layerScalingCrossTerms: false,
};

const round = (value: number, digits = 12): number => Number(value.toPrecision(digits));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isReceiptStatus = (value: unknown): value is Nhm2LayerStackReceiptStatus =>
  typeof value === "string" &&
  (NHM2_LAYER_STACK_RECEIPT_STATUSES as readonly string[]).includes(value);

const isArchitectureStatus = (value: unknown): value is Nhm2LayerStackArchitectureStatus =>
  typeof value === "string" &&
  ["candidate_window", "review", "fail"].includes(value);

const buildReceiptSurface = (
  surfaceId: Nhm2LayerStackReceiptSurfaceId,
  supplied: boolean,
  baseCanUseReceipt: boolean,
): Nhm2LayerStackReceiptSurfaceV1 => {
  const details = SURFACE_DETAILS[surfaceId];
  const status: Nhm2LayerStackReceiptStatus = supplied ? "receipted" : "missing";
  const evaluationStatus: Nhm2LayerStackArchitectureStatus = supplied
    ? baseCanUseReceipt
      ? "candidate_window"
      : "review"
    : "review";
  return {
    surfaceId,
    status,
    evaluationStatus,
    evidenceRef: supplied ? `receipt://${surfaceId}/declared-runtime-input` : null,
    literatureRefs: details.literatureRefs,
    blockers: supplied ? [] : [details.blocker],
    requiredMeasurements: details.measurements,
  };
};

const tensorCoverageComplete = (coverage: Nhm2FullApparatusTensorTermCoverageV1): boolean =>
  Object.values(coverage).every(Boolean);

const receiptReadinessScore = (
  surfaces: Nhm2LayerStackReceiptSurfaceV1[],
  coverage: Nhm2FullApparatusTensorTermCoverageV1,
): number => {
  const surfaceScore =
    surfaces.filter((surface) => surface.status === "receipted").length / surfaces.length;
  const tensorScore =
    Object.values(coverage).filter(Boolean).length / Object.values(coverage).length;
  return round((surfaceScore + tensorScore) / 2);
};

const statusRank = (status: Nhm2LayerStackArchitectureStatus): number => {
  if (status === "candidate_window") return 2;
  if (status === "review") return 1;
  return 0;
};

const rowFirstBlocker = (
  architecture: Nhm2LayerStackArchitectureCandidateV1,
  surfaces: Nhm2LayerStackReceiptSurfaceV1[],
  coverage: Nhm2FullApparatusTensorTermCoverageV1,
): string => {
  if (architecture.goNoGoStatus === "fail") {
    return architecture.blockers[0] ?? "architecture_base_status_fail";
  }
  const missingSurface = surfaces.find((surface) => surface.status !== "receipted");
  if (missingSurface != null) {
    return missingSurface.blockers[0] ?? `${missingSurface.surfaceId}_missing`;
  }
  if (!tensorCoverageComplete(coverage)) return "support_drive_terms_in_full_apparatus_Tmunu_missing";
  return "none";
};

export const buildNhm2LayerStackFullApparatusReceiptLoop = (
  input: BuildNhm2LayerStackFullApparatusReceiptLoopInput = {},
): Nhm2LayerStackFullApparatusReceiptLoopV1 => {
  const suppliedReceiptSurfaces = input.suppliedReceiptSurfaces ?? {};
  const tensorTermCoverage = {
    ...DEFAULT_TENSOR_TERM_COVERAGE,
    ...(input.tensorTermCoverage ?? {}),
  };
  const architectureLoop = buildNhm2LayerStackEngineeringArchitectureLoop({
    generatedAt: input.generatedAt,
    selectedProfileId: input.selectedProfileId,
    materialReceiptsSupplied: Boolean(suppliedReceiptSurfaces.material_coupon),
    roughnessAndPatchReceiptsSupplied: Boolean(suppliedReceiptSurfaces.roughness_patch_metrology),
    activeControlReceiptsSupplied: Boolean(suppliedReceiptSurfaces.active_control_energy),
    supportDriveTensorTermsSupplied:
      Boolean(suppliedReceiptSurfaces.full_apparatus_tensor) &&
      tensorCoverageComplete(tensorTermCoverage),
  });
  const rows = architectureLoop.candidates.map((architecture) => {
    const baseCanUseReceipt =
      architecture.stressStatus === "candidate_window" &&
      architecture.sourceRetentionStatus === "candidate_window" &&
      architecture.pullInStatus === "candidate_window";
    const receiptSurfaces = REQUIRED_RECEIPT_SURFACES.map((surfaceId) =>
      buildReceiptSurface(surfaceId, Boolean(suppliedReceiptSurfaces[surfaceId]), baseCanUseReceipt),
    );
    const firstBlocker = rowFirstBlocker(architecture, receiptSurfaces, tensorTermCoverage);
    const allReceipted = receiptSurfaces.every((surface) => surface.status === "receipted");
    const coverageComplete = tensorCoverageComplete(tensorTermCoverage);
    const engineeringCandidateStatus: Nhm2LayerStackArchitectureStatus =
      baseCanUseReceipt && allReceipted && coverageComplete ? "candidate_window" : architecture.goNoGoStatus === "fail" ? "fail" : "review";
    const blockers = [
      ...architecture.blockers.filter(
        (blocker) =>
          ![
            "roughness_margin_receipt_missing",
            "patch_potential_bound_receipt_missing",
            "active_control_receipt_missing",
            "material_coupon_receipt_missing",
            "support_drive_tensor_terms_missing",
          ].includes(blocker),
      ),
      ...receiptSurfaces.flatMap((surface) => surface.blockers),
      ...(!coverageComplete ? ["full_apparatus_tensor_term_coverage_incomplete"] : []),
    ];
    return {
      architectureId: architecture.architectureId,
      architectureKind: architecture.architectureKind,
      materialCandidate: architecture.materialCandidate,
      sourceRetention: architecture.sourceRetention,
      supportStressMPa: architecture.supportStressMPa,
      pullInMargin: architecture.pullInMargin,
      architectureBaseStatus: architecture.goNoGoStatus,
      receiptSurfaces,
      tensorTermCoverage,
      evidenceReadinessScore: receiptReadinessScore(receiptSurfaces, tensorTermCoverage),
      sourceTensorAuthorityAllowed: false as const,
      engineeringCandidateStatus,
      firstBlocker,
      blockers: Array.from(new Set(blockers)),
    };
  });
  const receiptedCandidateRows = rows.filter(
    (row) => row.engineeringCandidateStatus === "candidate_window",
  );
  const rankedRowsByEvidenceReadiness = [...rows].sort((a, b) => {
    if (statusRank(b.engineeringCandidateStatus) !== statusRank(a.engineeringCandidateStatus)) {
      return statusRank(b.engineeringCandidateStatus) - statusRank(a.engineeringCandidateStatus);
    }
    if (statusRank(b.architectureBaseStatus) !== statusRank(a.architectureBaseStatus)) {
      return statusRank(b.architectureBaseStatus) - statusRank(a.architectureBaseStatus);
    }
    if (b.evidenceReadinessScore !== a.evidenceReadinessScore) {
      return b.evidenceReadinessScore - a.evidenceReadinessScore;
    }
    if (b.sourceRetention !== a.sourceRetention) return b.sourceRetention - a.sourceRetention;
    return (b.pullInMargin ?? 0) - (a.pullInMargin ?? 0);
  });
  const firstBlocker =
    receiptedCandidateRows.length > 0
      ? "none"
      : (rankedRowsByEvidenceReadiness.find((row) => row.firstBlocker !== "none")?.firstBlocker ??
        "receipt_loop_blocker_unknown");
  return {
    contractVersion: NHM2_LAYER_STACK_FULL_APPARATUS_RECEIPT_LOOP_CONTRACT_VERSION,
    generatedAt: architectureLoop.generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: architectureLoop.selectedProfileId,
    architectureLoopRef: "nhm2_layer_stack_engineering_architecture_loop/v1",
    receiptPolicy: {
      requiredReceiptSurfaces: [...REQUIRED_RECEIPT_SURFACES],
      declaredModelsAreReviewOnly: true,
      idealScalarCasimirIsMaterialReceipt: false,
      fullApparatusTensorTermsRequired: true,
    },
    rows,
    summary: {
      rowCount: rows.length,
      receiptedCandidateRows,
      rankedRowsByEvidenceReadiness,
      bestArchitectureId: rankedRowsByEvidenceReadiness[0]?.architectureId ?? null,
      firstBlocker,
      rankedResearchGaps: [
        "material_coupon_receipt_for_selected_support_material",
        "force_gap_curve_and_pull_in_margin_at_8nm",
        "roughness_asperity_tail_and_patch_potential_map",
        "active_gap_control_energy_and_noise",
        "fatigue_lifetime_receipt",
        "layer_scaling_nonadditivity_measurement",
        "support_drive_terms_in_full_apparatus_Tmunu",
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
      "physrevresearch_2_023355_patch_potential_measurement",
      "arxiv_1207_4429_surface_potential_nanomebrane",
      "rspa_2020_0311_casimir_pull_in_framework",
      "physrevapplied_15_034063_high_stress_sin",
      "pmc_2025_aln_piezo_mems_review",
      "apl_127_222202_high_stress_tin",
    ],
    claimBoundary: {
      diagnosticOnly: true,
      receiptLoopOnly: true,
      idealScalarLoadIsNotMaterialEvidence: true,
      supportArchitectureIsNotTensorAuthority: true,
      sourceTensorAuthorityAllowed: false,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
  };
};

export const isNhm2LayerStackFullApparatusReceiptLoop = (
  value: unknown,
): value is Nhm2LayerStackFullApparatusReceiptLoopV1 => {
  if (!isRecord(value)) return false;
  const policy = isRecord(value.receiptPolicy) ? value.receiptPolicy : null;
  const rows = Array.isArray(value.rows) ? value.rows : null;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion === NHM2_LAYER_STACK_FULL_APPARATUS_RECEIPT_LOOP_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.architectureLoopRef === "nhm2_layer_stack_engineering_architecture_loop/v1" &&
    policy != null &&
    Array.isArray(policy.requiredReceiptSurfaces) &&
    policy.declaredModelsAreReviewOnly === true &&
    policy.idealScalarCasimirIsMaterialReceipt === false &&
    policy.fullApparatusTensorTermsRequired === true &&
    rows != null &&
    rows.length > 0 &&
    rows.every(
      (row) =>
        isRecord(row) &&
        typeof row.architectureId === "string" &&
        typeof row.architectureKind === "string" &&
        typeof row.materialCandidate === "string" &&
        typeof row.sourceRetention === "number" &&
        typeof row.supportStressMPa === "number" &&
        (row.pullInMargin === null || typeof row.pullInMargin === "number") &&
        isArchitectureStatus(row.architectureBaseStatus) &&
        Array.isArray(row.receiptSurfaces) &&
        row.receiptSurfaces.every(
          (surface) =>
            isRecord(surface) &&
            typeof surface.surfaceId === "string" &&
            isReceiptStatus(surface.status) &&
            isArchitectureStatus(surface.evaluationStatus) &&
            (surface.evidenceRef === null || typeof surface.evidenceRef === "string") &&
            Array.isArray(surface.literatureRefs) &&
            Array.isArray(surface.blockers) &&
            Array.isArray(surface.requiredMeasurements),
        ) &&
        isRecord(row.tensorTermCoverage) &&
        Object.values(row.tensorTermCoverage).every((entry) => typeof entry === "boolean") &&
        typeof row.evidenceReadinessScore === "number" &&
        row.sourceTensorAuthorityAllowed === false &&
        isArchitectureStatus(row.engineeringCandidateStatus) &&
        typeof row.firstBlocker === "string" &&
        Array.isArray(row.blockers),
    ) &&
    summary != null &&
    summary.rowCount === rows.length &&
    Array.isArray(summary.receiptedCandidateRows) &&
    Array.isArray(summary.rankedRowsByEvidenceReadiness) &&
    (summary.bestArchitectureId === null || typeof summary.bestArchitectureId === "string") &&
    typeof summary.firstBlocker === "string" &&
    Array.isArray(summary.rankedResearchGaps) &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    summary.speedAuthorityClaimAllowed === false &&
    Array.isArray(value.researchRefs) &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.receiptLoopOnly === true &&
    boundary.idealScalarLoadIsNotMaterialEvidence === true &&
    boundary.supportArchitectureIsNotTensorAuthority === true &&
    boundary.sourceTensorAuthorityAllowed === false &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.routeEtaClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false &&
    boundary.speedAuthorityClaimAllowed === false
  );
};
